/**
 * Created by donbrad on 8/11/15.
 * userModel.js -- handles all user model interactions with parse, kendoDS and local storage
 */
'use strict';

var userModel = {

    _version: 1,
    parseUser: null,
    parseDataFetched: false,
    tempDirectory: '',
    appDirectory: '',
    hasAccount: false,
    parseACL : undefined,
    userName : '',
    identiconUrl : null,
    rememberUserName : false,
    recoverPassword: null,
    key : null,
    userUUID: null,
    kendoInit : false,
    initialView : '#newuserhome',

    _user: new kendo.data.ObservableObject({
        version: 1,
        Id: null,   // everlive id -- existance and case critical for update to function
        username: null,
        name: '',
        userUUID: '',
        Email: null,
        Username: null,
        email: '',
        phone: '',
        alias: '',
        aliasPhoto: '',
        photo: '',
        publicAlias: '',
        publicAliasPhoto: '',
        privateKey: '',
        publicKey: '',
        udid: '',
        macAddress: '',
        statusMessage: '',
        rememberUsername: false,
        emailValidated: false,
        phoneValidated: false,
        isVerified: false,
        isRetina: false,
        isWIFIOnly: false,
        isPhotoStored: false,
        isVisible: true,
        isAvailable: true,
        useIdenticon: true,
        availImgUrl: 'images/status-available.svg',
        currentPlace: '',
        currentPlaceUUID: '',
        isCheckedIn: false
    }),

    device : {
        udid: '',
        platform: '',
        device: '',
        model: ''
    },

    updateLocalStorage: function () {
        if (userModel._user.get('rememberUsername')) {
            localStorage.setItem('ggRememberUsername', true);
            localStorage.setItem('ggUsername', userModel._user.get('username'));

        }


    },

    init: function () {
        var hasAccount = window.localStorage.getItem('ggHasAccount');
        
        if (hasAccount !== undefined && hasAccount === true) {
            userModel.hasAccount = true;
            //userModel.initialView = '#usersignin';
        } else {
            userModel.hasAccount = false;
            //userModel.initialView = '#newuserhome';
        }

        userModel.initKendo();
    },

    initCloudModels : function () {
        contactModel.init();

        mapModel.init();

        placesModel.init();

        privateNoteModel.init();  // Depends on everlive...

        memberdirectory.init();

        noteModel.init();

        photoModel.init();

        channelModel.init();

        smartEvent.init();

        smartMovie.init();

        tagModel.init();

        if (window.navigator.simulator === undefined) {
            serverPush.init();
        }

    },

    initKendo : function () {
        if (userModel.kendoInit)
            return;
        
        userModel.kendoInit = true;
        
        APP.kendo = new kendo.mobile.Application(document.body, {

            // comment out the following line to get a UI which matches the look
            // and feel of the operating system
            skin: 'material',

            // the application needs to know which view to load first
            initial: '#startUpView'
        });
    },

    initCloud: function () {
    
       // userModel.parseUser = Parse.User.current();
        userModel.device.udid = device.uuid;
        userModel.device.platform = device.platform;
        userModel.device.device = device.name;
        userModel.device.model = device.model;
        userModel.rememberUsername = window.localStorage.getItem('ggRememberUsername');
        userModel.recoveryPassword = window.localStorage.getItem('ggRecoveryPassword');
       
        userModel.userUUID =  window.localStorage.getItem('ggUserUUID');
        if (userModel.userUUID === undefined) {
            userModel.userUUID = null;
            userModel.hasAccount = false;
        }

        // If remembering Username, get it from localstorage and prefill signin.
        if (userModel.rememberUsername) {
           userModel.username = window.localStorage.getItem('ggUsername');
            if (userModel.username == undefined || userModel.username === '') {
                window.localStorage.setItem('ggUsername', userModel._user.get('username'));
            }

        }
        userModel.initialView = '#newuserhome';

        // Check the status of kendo auth
        everlive.currentUser(function (error, data) {
            if (error === null && data !== null) {
                // No error and valid auth data
                //APP.kendo.navigate('#home');
                
                everlive.loadUserData();
              
            } else {
                if (error.code !== 301) { // 301 = no auth credentials, could be new user or member not signed it
                    // So other error - just notify for now...
                    mobileNotify("Kendo Auth Error " + JSON.stringify(error));
                }
                if (userModel.hasAccount) {
                    //
                    mobileNotify("Please login to ghostgrams");
                    APP.kendo.navigate('#usersignin');
                } else {
                    APP.kendo.navigate('#newuserhome');
                }

            }


        });


   /*     if (Parse.User.current() === null) {

            if (userModel.hasAccount) {
                mobileNotify("Please login to ghostgrams");
                userModel.initialView = '#usersignin';
            } else {
                userModel.initialView = '#newuserhome';
            }

        } else {
            // Need to force parse to actually fetch the data from the service.  Parse creates a local cache of user data that gets saved on login / create
            // account while all user.set / saves are pushed to the cloud...
            mobileNotify("Syncing user data...");
            Parse.User.currentAsync().then(function (user) {

                userModel.parseUser = user;


                if (user.get("version") === undefined) {
                    userModel.generateNewPrivateKey(userModel.parseUser);
                    userModel.parseUser.set("version", 1);
                    userModel.parseUser.save();
                }

                // Update new fields
                var dirty = false;
                if (user.get('addressList') === undefined) {
                    userModel._user.set('addressList', []);
                    user.set('addressList', []);
                    dirty = true;
                }

                if (user.get('emailList') === undefined) {
                    userModel._user.set('emailList', []);
                    user.set('emailList', []);
                    dirty = true;
                }

                if (user.get('phoneList') === undefined) {
                    userModel._user.set('phoneList', []);
                    user.set('phoneList', []);
                    dirty = true;
                }

                if (user.get('archiveIntro') === undefined) {
                    userModel._user.set('archiveIntro', false);
                    user.set('archiveIntro', false);
                    dirty = true;
                }


                if (user.get('homeIntro') === undefined) {
                    userModel._user.set('homeIntro', false);
                    user.set('homeIntro', false);
                    dirty = true;
                }

                if (user.get('chatIntro') === undefined) {
                    userModel._user.set('chatIntro', false);
                    user.set('chatIntro', false);
                    dirty = true;
                }

                if (user.get('contactIntro') === undefined) {
                    userModel._user.set('contactIntro', false);
                    user.set('contactIntro', false);
                    dirty = true;
                }

                if (user.get('galleryIntro') === undefined) {
                    userModel._user.set('galleryIntro', false);
                    user.set('galleryIntro', false);
                    dirty = true;
                }

                if (user.get('identiconIntro') === undefined) {
                    userModel._user.set('identiconIntro', false);
                    user.set('identiconIntro', false);
                    dirty = true;
                }

                if (user.get('placesIntro') === undefined) {
                    userModel._user.set('placesIntro', false);
                    user.set('placesIntro', false);
                    dirty = true;
                }

                if (user.get('firstMessage') === undefined) {
                    userModel._user.set('firstMessage', false);
                    user.set('firstMessage', false);
                    dirty = true;
                }

                if (user.get('phoneValidated') === true && user.get('emailValidated') === true) {
                    if (user.get('isVerified') !== true) {
                        user.set('isVerified', true);
                        dirty = true;
                    }
                } else {
                    if (user.get('isVerified') !== false) {
                        user.set('isVerified', false);
                        dirty = true;
                    }
                }

                if (dirty)
                    user.save();

                userModel.initialView = '#home';

                userModel.userUUID = user.get('userUUID');
                userModel._user.set('userUUID', userModel.userUUID);
                localStorage.setItem('ggUserUUID', userModel.userUUID);

                userModel.generateUserKey();
                userModel.updatePrivateKey();
                userModel.decryptPrivateKey();


                userModel._user.set('username', user.get('username'));
                userModel._user.set('objectId', user.get('objectId'));
                userModel._user.set('name', user.get('name'));
                userModel._user.set('email', user.get('email'));
                userModel._user.set('phone', user.get('phone'));
                userModel._user.set('alias', user.get('alias'));

                userModel._user.set('publicKey', user.get('publicKey'));
                // userModel._user.set('privateKey', userModel.parseUser.get('privateKey'));
                userModel._user.set('statusMessage', user.get('statusMessage'));
                userModel._user.set('currentPlaceUUID', user.get('currentPlaceUUID'));
                userModel._user.set('currentPlace', user.get('currentPlace'));
                userModel._user.set('aliasPublic', user.get('aliasPublic'));
                userModel._user.set('aliasPhoto', user.get('aliasPhoto'));
                userModel._user.set('photo', user.get('photo'));
                userModel._user.set('isAvailable', user.get('isAvailable'));
                userModel._user.set('isCheckedIn', user.get('isCheckedIn'));
                userModel._user.set('isVisible', user.get('isVisible'));
                userModel._user.set('isRetina', user.get('isRetina'));
                userModel._user.set('isWIFIOnly', user.get('isWIFIOnly'));
                userModel._user.set('isPhotoStored', user.get('isPhotoStored'));
                userModel._user.set('addressList', user.get('addressList'));
                userModel._user.set('emailList', user.get('emailList'));
                userModel._user.set('phoneList', user.get('phoneList'));
                userModel._user.set('archiveIntro', user.get('archiveIntro'));
                userModel._user.set('homeIntro', user.get('homeIntro'));
                userModel._user.set('chatIntro', user.get('chatIntro'));
                userModel._user.set('contactIntro', user.get('contactIntro'));
                userModel._user.set('galleryIntro', user.get('galleryIntro'));
                userModel._user.set('identiconIntro', user.get('identiconIntro'));
                userModel._user.set('placesIntro', user.get('placesIntro'));
                userModel._user.set('saveToPhotoAlbum',user.get('saveToPhotoAlbum'));
                userModel._user.set('rememberUsername', user.get('rememberUsername'));
                var phoneValidated = user.get('phoneValidated');
                userModel._user.set('phoneValidated', phoneValidated);
                userModel._user.set('emailValidated', user.get('emailValidated'));
                userModel._user.set('useIdenticon', user.get('useIdenticon'));
                userModel._user.set('availImgUrl', 'images/status-away.svg');
                ux.updateHeaderStatusImages();

                userModel.createIdenticon(user.get('userUUID'));

                var photo = user.get('photo');
                if (photo === undefined || photo === null) {
                    userModel._user.photo =  userModel.identiconUrl;
                }
                userModel.parseACL = new Parse.ACL(userModel.parseUser);

                userModel._user.bind('change', userModel.syncToEverlive);
                userModel.initPubNub();
                userModel.fetchParseData();

                APP.everlive.users.currentUser(function(data) {
                    if (data.result) {
                        everlive._user = data.result;
                        mobileNotify(data.result.Username + " is logged in to Everlive!");
                    } else {
                        var username = user.get('username'), password = user.get('recoveryPassword');
                        everlive.login(username, password, function (error, data){
                            if (error !== null) {
                                mobileNotify(JSON.stringify(error));

                                everlive.createAccount(username, name, password, function (error1, data1) {
                                    if (error1 !== null) {
                                        mobileNotify(JSON.stringify(error1));
                                    } else {
                                        var token = data1;
                                        userModel.userUUID = uuid.v4();
                                        userModel._user.set('userUUID', userModel.userUUID);
                                        localStorage.setItem('ggUserUUID', userModel.userUUID);

                                        userModel.generateUserKey();
                                        userModel.updatePrivateKey();
                                        userModel.decryptPrivateKey();

                                        everlive.updateUser();
                                    }

                                });
                            } else {
                                everlive.updateUser();
                            }
                        });
                    }
                }, function(err) {
                    var username = user.get('username'), password = user.get('recoveryPassword');
                    everlive.login(username, password, function (error, data){
                        if (error !== null) {
                            mobileNotify(JSON.stringify(error));

                            everlive.createAccount(username, name, password, function (error1, data1) {
                                if (error1 !== null) {
                                    mobileNotify(JSON.stringify(error1));
                                } else {
                                    var token = data1;
                                    userModel.userUUID = uuid.v4();
                                    userModel._user.set('userUUID', userModel.userUUID);
                                    localStorage.setItem('ggUserUUID', userModel.userUUID);

                                    userModel.generateUserKey();
                                    userModel.updatePrivateKey();
                                    userModel.decryptPrivateKey();

                                    everlive.updateUser();
                                }

                            });
                        } else {
                            everlive.updateUser();
                        }
                    });
                });

                if (phoneValidated) {
                    deviceModel.setAppState('phoneValidated', true);
                    notificationModel.deleteNotificationsByType(notificationModel._verifyPhone, 0);
                } else {
                    mobileNotify("Please verify your phone number");

                    cordova.plugins.notification.local.schedule({
                        id         : 1,
                        title      : 'Phone not verified',
                        text       : 'Please verify your mobile phone number ',
                        sound      : null,
                        autoClear  : true,
                        at         : new Date(new Date().getTime())
                    });
                    //Add verify phone notification to home screen
                }
            });
        }
*/
    },


    deleteAccount: function () {

    },

    createIdenticon: function (hash) {
        hash = hash.replace(/-/g,'');
        jdenticon.update("#identiconCanvas", hash);
        var canvas = document.getElementById("identiconCanvas");
        userModel.identiconUrl = canvas.toDataURL('image/png');
    },

    _setRecoveryPassword : function (password) {
        var aesPassword  = GibberishAES.enc(password, userModel.key);
        userModel._user.set('recoveryPassword', aesPassword);
        window.localStorage.setItem('ggRecoveryPassword', aesPassword);
    },
    
    _getRecoveryPassword : function () {
        var encPassword = window.localStorage.setItem('ggRecoveryPassword');
        var clearPassword = GibberishAES.dec(encPassword, userModel.key);

        return(clearPassword);
    },


    // user is valid parse User object
    generateNewPrivateKey : function () {
        // Generate Keys for the user.
        var RSAkey = cryptico.generateRSAKey(512);
        var publicKey = cryptico.publicKeyString(RSAkey);
        var privateKey = cryptico.privateKeyString(RSAkey);
        
        userModel._RSAKey = RSAKey;
        userModel._publicKey = publicKey;
        userModel._privateKey = privateKey;

        var newPrivateKey  = GibberishAES.enc(privateKey, userModel.key);
        userModel._user.set('privateKey',newPrivateKey);
        userModel._user.set('publicKey',publicKey);



    },

   syncToEverlive: function (e) {
      _preventDefault(e);

       var field = e.field;
       var fieldValue = userModel._user.get(field);
       /* userModel.parseUser.set(e.field, fieldValue);
        userModel.parseUser.save(null, {
            success : function (user){
                //mobileNotify("Updated your " + e.field);
            },
            error: function (user, error){
                mobileNotify("Profile save error: " + error);
            }
        });*/
       
       
       userStatus.syncField(field, fieldValue);
    },

    encryptPrivateKey : function (key) {

    },

    setUserUUID : function (uuid) {

        userModel.userUUID  = uuid;
        userModel._user.set("userUUID", uuid);
        userModel.key = uuid.replace(/-/g,'');
    },
    
    
    generateUserKey : function () {
        var rawKey = userModel.userUUID;

         userModel.key = rawKey.replace(/-/g,'');

    },

    decryptPrivateKey : function () {

       
        var privateKey = userModel._user.get('privateKey');
        var newPrivateKey  = GibberishAES.dec(privateKey, userModel.key);
        var RSAKey = cryptico.privateKeyFromString(newPrivateKey);
        userModel._user.set('privateKey', newPrivateKey);
        userModel._user.set('RSAKey', RSAKey);
        userModel._RSAKey = RSAKey;
        userModel._privateKey = newPrivateKey;

    },

    encryptBlob : function (blobIn) {
        return(GibberishAES.enc(blobIn, userModel.key));
    },

    decryptBlob : function (blobIn) {
        return(GibberishAES.dec(blobIn, userModel.key));
    },

    updatePrivateKey : function () {
        var privateKey = userModel._user.get('privateKey');
        if (privateKey === undefined ){
            return;
        }

        if (privateKey.charAt(0) === "{") {
            var newPrivateKey  = GibberishAES.enc(privateKey, userModel.key);
            userModel._user.set('privateKey', newPrivateKey);
        }
    },

    checkIn : function (placeUUID, lat, lng, locationName, googlePlaceId) {

        if (placeUUID !== null) {
            var place = placesModel.getPlaceModel(placeUUID);

            userModel._user.set('currentPlace', place.name);
            userModel._user.set('currentPlaceUUID', place.uuid);
            userModel._user.set('googlePlaceId', place.googleId);
            userModel._user.set('lat', place.lat.toFixed(6));
            userModel._user.set('lng', place.lat.toFixed(6));

        } else {
            userModel._user.set('currentPlace', locationName);
            userModel._user.set('currentPlaceUUID', null);
            userModel._user.set('googlePlaceId', googlePlaceId);
            userModel._user.set('lat', lat.toFixed(6));
            userModel._user.set('lng', lat.toFixed(6));
        }

        userModel._user.set('isCheckedIn', true);
        userStatus.update();
    },

    checkOut : function () {
        userModel._user.set('isCheckedIn', false);
        userModel._user.set('currentPlace', null);
        userModel._user.set('currentPlaceUUID',null);
        userModel._user.set('googlePlaceId', null);
        userStatus.update();

    },

    // Need a valid uuid to initialize pubnub and create appData and userData channels
    initPubNub: function () {
        if (APP.pubnub !== null) {
            return;
        }
        var uuid = userModel._user.get('userUUID');

        if (uuid === undefined || uuid === null) {
            mobileNotify("initPubNub : invalid UUID!!!!");
        }

        APP.pubnub = PUBNUB.init({
            publish_key: 'pub-c-d4fcc2b9-2c1c-4a38-9e2c-a11331c895be',
            subscribe_key: 'sub-c-4624e1d4-dcad-11e4-adc7-0619f8945a4f',
            secret_key: 'sec-c-NDFiNzlmNTUtNWEyNy00OGUzLWExZjYtNDc3ZTI2ZGRlOGMw',
            ssl: true,
            jsonp: true,
            restore: true,
            uuid: uuid
        });

        // Initialize application data channel with gg's unique ID
        appDataChannel.init();

        // Initialize the user's data channel with the user's UUID...
        userDataChannel.init(uuid);

    },

    fetchParseData: function() {
       // APP.models.places.placesDS.fetch();

        // fetch channel (chat) models (objects) from parse.
       //channelModel.fetch();

        // fetch contact models (objects) from parse.
        //contactModel.fetch();

       // placesModel.fetch();

       // photoModel.fetch();

       // noteModel.fetch();

        //smartEvent.fetch();

        userStatus.init();


    },

    enableIdenticon : function () {
        $('.homeProfileImg').addClass('hidden');
        $('.homeProfileIdenticon').removeClass('hidden');

        $('#profileStatusPhoto').addClass('hidden');
        $('#profileStatusIdenticon').removeClass('hidden');

        var hash = userModel._user.userUUID;
        if (hash === undefined) {
            hash = "01234567890ABCDE";
        } else {
            hash = hash.replace(/-/g,'');  //strip the dashes...
        }

        jdenticon.update(".homeProfileIdenticon", hash);

        jdenticon.update("#profileStatusIdenticon", hash);
    },

    disableIdenticon : function () {

        $('.homeProfileImg').removeClass('hidden');
        $('.homeProfileIdenticon').addClass('hidden');

        $('#profileStatusIdenticon').addClass('hidden');
    }


};

var userStatus = {

    _ggClass : 'userStatus',
    _version : 1,
    _statusObj : new kendo.data.ObservableObject(),
    _id : null,


    init: function () {
        var filter = new Everlive.Query();
        filter.where().eq('userUUID', userModel._user.userUUID);

        var data = APP.everlive.data(userStatus._ggClass);
        data.get(filter)
            .then(function(data){
                    if (data.count === 0) {
                        userStatus.create();
                    } else {
                        var member = data.result[0];
                        userStatus._id = member.Id;
                        userStatus._statusObj.Id = member.Id;
                    }

                },
                function(error){
                    mobileNotify("User Status Init error : " + JSON.stringify(error));
                });

        /*userStatus._statusObj.on('change', function () {
            userStatus.update();
        });*/

    },

    getStatus : function (uuid, callback) {
        var filter = new Everlive.Query();
        filter.where().eq('userUUID', uuid);

        var data = APP.everlive.data(userStatus._ggClass);
        data.get(filter)
            .then(function(data){
                    if (data.count === 0) {
                        userStatus.create();
                    } else {
                        var member = data.result[0];
                        callback(null, member);
                    }

                },
                function(error){
                    callback(error, null);
                });
    },

    syncField : function (field) {

        var updateObject = userStatus._statusObj;

        switch(field) {
            case 'userUUID':
            case 'isAvailable' :
            case 'isVisible' :
            case 'isCheckedIn' :
            case 'statusMessage' :
            case 'currentPlace' :
            case 'lat' :
            case 'lng' :
            case 'googlePlaceId' :
            case 'currentPlaceUUID' :

                updateObject.set(field, userModel._user.get(field));
                
               /* userStatus.parseUserStatus.set(field, userModel._user.get(field));
                userStatus.parseUserStatus.set('lastUpdate', ggTime.currentTime());
                userStatus.parseUserStatus.save(null, {
                    success : function (user){
                        mobileNotify("User status update: " + field);
                    },
                    error: function (user, error){
                        mobileNotify("User Status update error: " + error);
                    }
                });*/
        }
    },

    create : function () {
        var data = APP.everlive.data(userStatus._ggClass);



        data.create(userStatus._statusObj,
            function(data){
                userStatus._id = data.result.Id;
                userStatus._statusObj.Id  = data.result.Id;
                userStatus.update();
                //userStatus.updateEverlive();
            },
            function(error){
                mobileNotify("User Status Init error : " + JSON.stringify(error));
            });
    },

   /* update : function () {
        var status = userStatus.parseUserStatus;

        status.set('userUUID', userModel._user.userUUID);
        status.set('isAvailable', userModel._user.isAvailable);
        status.set('isVisible', userModel._user.isVisible);
        status.set('statusMessage', userModel._user.statusMessage);
        status.set('currentPlace', userModel._user.currentPlace);
        var lat = userModel._user.lat;
       /!* if (lat !== null)
            lat = lat.toFixed(6);*!/
        status.set('lat', userModel._user.lat);
        var lng = userModel._user.lng;
       /!* if (lng !== null)
            lng = lng.toFixed(6);*!/
        status.set('lng', userModel._user.lng);
        status.set('googlePlaceId', userModel._user.googlePlaceId);
        status.set('currentPlaceUUID', userModel._user.currentPlaceUUID);
        status.set('isCheckedIn', userModel._user.isCheckedIn);
        status.set('lastUpdate', ggTime.currentTime());
        status.save(null, {
            success: function(status) {
                // Execute any logic that should take place after the object is saved.

            },
            error: function(status, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                mobileNotify('Failed to create new object, with error code: ' + error.message);
            }
        });


    },*/

    update : function () {
        var status = userStatus._statusObj;


        status.set('userUUID', userModel._user.userUUID);
        status.set('isAvailable', userModel._user.isAvailable);
        status.set('isVisible', userModel._user.isVisible);
        status.set('statusMessage', userModel._user.statusMessage);
        status.set('currentPlace', userModel._user.currentPlace);
        var lat = userModel._user.lat;
        /* if (lat !== null)
         lat = lat.toFixed(6);*/
        status.set('lat', userModel._user.lat);
        var lng = userModel._user.lng;
        /* if (lng !== null)
         lng = lng.toFixed(6);*/
        status.set('lng', userModel._user.lng);
        status.set('googlePlaceId', userModel._user.googlePlaceId);
        status.set('currentPlaceUUID', userModel._user.currentPlaceUUID);
        status.set('isCheckedIn', userModel._user.isCheckedIn);
        status.set('lastUpdate', ggTime.currentTime());


        everlive.updateOne(userStatus._ggClass, status, function (error, data) {

            if (error !== null) {
                mobileNotify("Update User Status error : " + JSON.stringify(error));
            }

        })

    }



};
