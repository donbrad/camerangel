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
    key : null,
    initialView : '#newuserhome',

    currentUser: new kendo.data.ObservableObject({
        _version: 1,
        username: '',
        name: '',
        userUUID: '',
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
        phoneVerified: false,
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
        if (userModel.currentUser.get('rememberUsername')) {
            localStorage.setItem('ggRememberUsername', true);
            localStorage.setItem('ggUsername', userModel.currentUser.get('username'));
        }
    },

    init: function () {
        var hasAccount = window.localStorage.getItem('ggHasAccount');
        if (hasAccount !== undefined) {
            userModel.hasAccount = true;
            userModel.initialView = '#usersignin';
        } else {
            userModel.hasAccount = false;
            userModel.initialView = '#newuserhome';
        }
    },


    initParse: function () {
      /* if (! Parse.Session.isCurrentSessionRevocable()) {
           mobileNotify("Please Login on this device");

       }*/


       // userModel.parseUser = Parse.User.current();
        userModel.device.udid = device.uuid;
        userModel.device.platform = device.platform;
        userModel.device.device = device.name;
        userModel.device.model = device.model;
        userModel.rememberUsername = window.localStorage.getItem('ggRememberUsername');
        userModel.recoveryPassword = window.localStorage.getItem('ggRecoveryPassword');
        // If remembering Username, get it from localstorage and prefill signin.
        if (userModel.rememberUsername) {
           userModel.username = window.localStorage.getItem('ggUsername');
            if (userModel.username == undefined || userModel.username === '') {
                window.localStorage.setItem('ggUsername', userModel.parseUser.get('username'));
            }

        }


        if (Parse.User.current() === null) {

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

                userModel.generateUserKey();
                if (user.get("version") === undefined) {
                    userModel.generateNewPrivateKey(userModel.parseUser);
                    userModel.parseUser.set("version", 1);
                    userModel.parseUser.save();
                }

                // Update new fields
                var dirty = false;
                if (user.get('addressList') === undefined) {
                    userModel.currentUser.set('addressList', []);
                    user.set('addressList', []);
                    dirty = true;
                }

                if (user.get('emailList') === undefined) {
                    userModel.currentUser.set('emailList', []);
                    user.set('emailList', []);
                    dirty = true;
                }

                if (user.get('phoneList') === undefined) {
                    userModel.currentUser.set('phoneList', []);
                    user.set('phoneList', []);
                    dirty = true;
                }

                if (user.get('archiveIntro') === undefined) {
                    userModel.currentUser.set('archiveIntro', false);
                    user.set('archiveIntro', false);
                    dirty = true;
                }


                if (user.get('homeIntro') === undefined) {
                    userModel.currentUser.set('homeIntro', false);
                    user.set('homeIntro', false);
                    dirty = true;
                }

                if (user.get('chatIntro') === undefined) {
                    userModel.currentUser.set('chatIntro', false);
                    user.set('chatIntro', false);
                    dirty = true;
                }

                if (user.get('contactIntro') === undefined) {
                    userModel.currentUser.set('contactIntro', false);
                    user.set('contactIntro', false);
                    dirty = true;
                }

                if (user.get('galleryIntro') === undefined) {
                    userModel.currentUser.set('galleryIntro', false);
                    user.set('galleryIntro', false);
                    dirty = true;
                }

                if (user.get('identiconIntro') === undefined) {
                    userModel.currentUser.set('identiconIntro', false);
                    user.set('identiconIntro', false);
                    dirty = true;
                }

                if (user.get('placesIntro') === undefined) {
                    userModel.currentUser.set('placesIntro', false);
                    user.set('placesIntro', false);
                    dirty = true;
                }

                if (user.get('firstMessage') === undefined) {
                    userModel.currentUser.set('firstMessage', false);
                    user.set('firstMessage', false);
                    dirty = true;
                }

                if (user.get('phoneVerified') === true && user.get('emailVerified') === true) {
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

                userModel.updatePrivateKey();
                userModel.decryptPrivateKey();
                userModel.initialView = '#home';

                userModel.currentUser.set('username', user.get('username'));
                userModel.currentUser.set('objectId', user.get('objectId'));
                userModel.currentUser.set('name', user.get('name'));
                userModel.currentUser.set('email', user.get('email'));
                userModel.currentUser.set('phone', user.get('phone'));
                userModel.currentUser.set('alias', user.get('alias'));
                userModel.currentUser.set('userUUID', user.get('userUUID'));
                userModel.currentUser.set('publicKey', user.get('publicKey'));
                // userModel.currentUser.set('privateKey', userModel.parseUser.get('privateKey'));
                userModel.currentUser.set('statusMessage', user.get('statusMessage'));
                userModel.currentUser.set('currentPlaceUUID', user.get('currentPlaceUUID'));
                userModel.currentUser.set('currentPlace', user.get('currentPlace'));
                userModel.currentUser.set('aliasPublic', user.get('aliasPublic'));
                userModel.currentUser.set('aliasPhoto', user.get('aliasPhoto'));
                userModel.currentUser.set('photo', user.get('photo'));
                userModel.currentUser.set('isAvailable', user.get('isAvailable'));
                userModel.currentUser.set('isCheckedIn', user.get('isCheckedIn'));
                userModel.currentUser.set('isVisible', user.get('isVisible'));
                userModel.currentUser.set('isRetina', user.get('isRetina'));
                userModel.currentUser.set('isWIFIOnly', user.get('isWIFIOnly'));
                userModel.currentUser.set('isPhotoStored', user.get('isPhotoStored'));
                userModel.currentUser.set('addressList', user.get('addressList'));
                userModel.currentUser.set('emailList', user.get('emailList'));
                userModel.currentUser.set('phoneList', user.get('phoneList'));
                userModel.currentUser.set('archiveIntro', user.get('archiveIntro'));
                userModel.currentUser.set('homeIntro', user.get('homeIntro'));
                userModel.currentUser.set('chatIntro', user.get('chatIntro'));
                userModel.currentUser.set('contactIntro', user.get('contactIntro'));
                userModel.currentUser.set('galleryIntro', user.get('galleryIntro'));
                userModel.currentUser.set('identiconIntro', user.get('identiconIntro'));
                userModel.currentUser.set('placesIntro', user.get('placesIntro'));
                userModel.currentUser.set('saveToPhotoAlbum',user.get('saveToPhotoAlbum'));
                userModel.currentUser.set('rememberUsername', user.get('rememberUsername'));
                var phoneVerified = user.get('phoneVerified');
                userModel.currentUser.set('phoneVerified', phoneVerified);
                userModel.currentUser.set('emailValidated', user.get('emailVerified'));
                userModel.currentUser.set('useIdenticon', user.get('useIdenticon'));
                userModel.currentUser.set('availImgUrl', 'images/status-away.svg');
                ux.updateHeaderStatusImages();

                userModel.createIdenticon(user.get('userUUID'));

                var photo = user.get('photo');
                if (photo === undefined || photo === null) {
                    userModel.currentUser.photo =  userModel.identiconUrl;
                }
                userModel.parseACL = new Parse.ACL(userModel.parseUser);

                userModel.currentUser.bind('change', userModel.sync);
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
                                        mobileNotify("Everlive account created for " + username);
                                    }

                                });
                            } else {
                                mobileNotify("Everlive account confirmed -- migration enabled");
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
                                    mobileNotify("Everlive account created for " + username);
                                }

                            });
                        } else {
                            mobileNotify("Everlive account confirmed -- migration enabled");
                        }
                    });
                });

                if (phoneVerified) {
                    deviceModel.setAppState('phoneVerified', true);
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

    },

    deleteAccount: function () {

    },

    createIdenticon: function (hash) {
        hash = hash.replace(/-/g,'');
        jdenticon.update("#identiconCanvas", hash);
        var canvas = document.getElementById("identiconCanvas");
        userModel.identiconUrl = canvas.toDataURL('image/png');
    },

    // user is valid parse User object
    generateNewPrivateKey : function (user) {
        // Generate Keys for the user.
        var RSAkey = cryptico.generateRSAKey(1024);
        var publicKey = cryptico.publicKeyString(RSAkey);
        var privateKey = cryptico.privateKeyString(RSAkey);

        userModel.currentUser.set('publicKey',publicKey);
        userModel.currentUser.set('privateKey',privateKey);
        user.set("publicKey", publicKey);
        var newPrivateKey  = GibberishAES.enc(privateKey, userModel.key);
        user.set("privateKey", newPrivateKey);

        user.save();

    },

   sync: function (e) {
      _preventDefault(e);

       var fieldValue = userModel.currentUser.get(e.field);
        userModel.parseUser.set(e.field, fieldValue);
        userModel.parseUser.save(null, {
            success : function (user){
                //mobileNotify("Updated your " + e.field);
            },
            error: function (user, error){
                mobileNotify("Profile save error: " + error);
            }
        });
       userStatus.syncField(e.field);
    },

    encryptPrivateKey : function (key) {

    },

    generateUserKey : function () {
        var rawKey = userModel.parseUser.get('userUUID');

         userModel.key = rawKey.replace(/-/g,'');

    },

    decryptPrivateKey : function () {

        if (userModel.key === null) {
            mobileNotify("Generating User Key...");
            userModel.generateUserKey();
        }

        var privateKey = userModel.parseUser.get('privateKey');
        var newPrivateKey  = GibberishAES.dec(privateKey, userModel.key);
        var RSAKey = cryptico.privateKeyFromString(newPrivateKey);
        userModel.currentUser.set('privateKey', newPrivateKey);
        userModel.currentUser.set('RSAKey', RSAKey);

    },

    encryptBlob : function (blobIn) {
        return(GibberishAES.enc(blobIn, userModel.key));
    },

    decryptBlob : function (blobIn) {
        return(GibberishAES.dec(blobIn, userModel.key));
    },

    updatePrivateKey : function () {
        var privateKey = userModel.parseUser.get('privateKey');
        if (privateKey === undefined ){
            return;
        }

        if (privateKey.charAt(0) === "{") {
            var newPrivateKey  = GibberishAES.enc(privateKey, userModel.key);
            userModel.parseUser.set('privateKey', newPrivateKey);
            userModel.parseUser.save();
        }
    },

    checkIn : function (placeId, lat, lng, locationName, googlePlaceId) {

        if (placeId !== null) {
            var place = placesModel.getPlaceModel(placeId);

            userModel.currentUser.set('currentPlace', place.name);
            userModel.currentUser.set('currentPlaceUUID', place.uuid);
            userModel.currentUser.set('googlePlaceId', place.googleId);
            userModel.currentUser.set('lat', place.lat.toFixed(6));
            userModel.currentUser.set('lng', place.lat.toFixed(6));

        } else {
            userModel.currentUser.set('currentPlace', locationName);
            userModel.currentUser.set('currentPlaceUUID', null);
            userModel.currentUser.set('googlePlaceId', googlePlaceId);
            userModel.currentUser.set('lat', lat.toFixed(6));
            userModel.currentUser.set('lng', lat.toFixed(6));
        }

        userModel.currentUser.set('isCheckedIn', true);
        userStatus.update();
    },

    checkOut : function () {
        userModel.currentUser.set('isCheckedIn', false);
        userModel.currentUser.set('currentPlace', null);
        userModel.currentUser.set('currentPlaceUUID',null);

    },

    // Need a valid uuid to initialize pubnub and create appData and userData channels
    initPubNub: function () {
        if (APP.pubnub !== null) {
            return;
        }
        var uuid = userModel.currentUser.get('userUUID');

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
       channelModel.fetch();

        // fetch contact models (objects) from parse.
        contactModel.fetch();

        placesModel.fetch();

        photoModel.fetch();

        noteModel.fetch();

        smartEvent.fetch();

        userStatus.init();


    },

    enableIdenticon : function () {
        $('.homeProfileImg').addClass('hidden');
        $('.homeProfileIdenticon').removeClass('hidden');

        $('#profileStatusPhoto').addClass('hidden');
        $('#profileStatusIdenticon').removeClass('hidden');

        var hash = userModel.currentUser.userUUID;
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
    parseUserStatus: null,
    parseUserStatusACL : null,   // this ACL can be used to create public read objects that only the user can create, update and delete

    init: function () {
        var UserStatusModel = Parse.Object.extend("userStatus");
        userStatus.setACL();
        var query = new Parse.Query(UserStatusModel);
        query.equalTo("userUUID", userModel.currentUser.userUUID);
        query.find({
            success: function(results) {
                if (results.length > 0) {
                    userStatus.parseUserStatus = results[0];
                } else {
                    userStatus.parseUserStatus = new UserStatusModel();
                    userStatus.parseUserStatus.setACL(userStatus.parseUserStatusACL);
                    userStatus.update();
                }

            },
            error: function(error) {
                mobileNotify("Parse User Status Error: " + error.code + " " + error.message);
            }
        });

    },

    // create a special ACL with public read and user only write access
    setACL : function () {
        var acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(false);
        acl.setWriteAccess(Parse.User.current().id, true);
        userStatus.parseUserStatusACL = acl;
    },

    syncField : function (field) {
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
                userStatus.parseUserStatus.set(field, userModel.currentUser.get(field));
                userStatus.parseUserStatus.set('lastUpdate', ggTime.currentTime());
                userStatus.parseUserStatus.save(null, {
                    success : function (user){
                        mobileNotify("User status update: " + field);
                    },
                    error: function (user, error){
                        mobileNotify("User Status update error: " + error);
                    }
                });
        }
    },

    update : function () {
        var status = userStatus.parseUserStatus;

        status.set('userUUID', userModel.currentUser.userUUID);
        status.set('isAvailable', userModel.currentUser.isAvailable);
        status.set('isVisible', userModel.currentUser.isVisible);
        status.set('statusMessage', userModel.currentUser.statusMessage);
        status.set('currentPlace', userModel.currentUser.currentPlace);
        var lat = userModel.currentUser.lat;
       /* if (lat !== null)
            lat = lat.toFixed(6);*/
        status.set('lat', userModel.currentUser.lat);
        var lng = userModel.currentUser.lng;
       /* if (lng !== null)
            lng = lng.toFixed(6);*/
        status.set('lng', userModel.currentUser.lng);
        status.set('googlePlaceId', userModel.currentUser.googlePlaceId);
        status.set('currentPlaceUUID', userModel.currentUser.currentPlaceUUID);
        status.set('isCheckedIn', userModel.currentUser.isCheckedIn);
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


    }


};
