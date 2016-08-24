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
    privateKey : null,
    publicKey: null,
    RSAKey : null,
    userUUID: null,
    kendoInit : false,
    _needSync: false,
    _needStatusSync: false,
    
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
        autoStatusEnabled: false,
        availImgUrl: 'images/status-available.svg',
        lat: '',
        lng: '',
        currentPlace: '',
        currentPlaceUUID: '',
        googlePlaceId: '',
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

    reset: function () {

    },
    
    init: function () {
        var hasAccount = window.localStorage.getItem('ggHasAccount');
        userModel.rememberUsername = window.localStorage.getItem('ggRememberUsername');
        userModel.recoveryPassword = window.localStorage.getItem('ggRecoveryPassword');
        userModel.username = window.localStorage.getItem('ggUserName');
        userModel.hasAccount = window.localStorage.getItem('ggHasAccount');
        userModel.userUUID =  window.localStorage.getItem('ggUserUUID');

        // userModel.parseUser = Parse.User.current();
        userModel.device.udid = device.uuid;
        userModel.device.platform = device.platform;
        userModel.device.device = device.name;
        userModel.device.model = device.model;

        if (userModel.userUUID === undefined) {
            userModel.userUUID = null;
            userModel.hasAccount = false;
        }

        // If remembering Username, get it from localstorage and prefill signin.
        if (userModel.rememberUsername) {
            userModel.username = window.localStorage.getItem('ggUsername');
            if (userModel.username === undefined) {
                userModel.username = null;
            }

        }

        if (userModel.userUUID !== undefined && userModel.userUUID !== null) {
            userModel.key = userModel.userUUID.replace(/-/g,'');
        }
        
        if (hasAccount !== undefined && hasAccount === true) {
            userModel.hasAccount = true;
            //userModel.initialView = '#usersignin';
        } else {
            userModel.hasAccount = false;
            //userModel.initialView = '#newuserhome';
        }
        
    },

    
    initCloudModels : function () {

        tagModel.init();

        channelModel.init();

        contactModel.init();

        notificationModel.init();

        var uuid = userModel._user.userUUID;
        // Initialize the user's data channel with the user's UUID...

        userDataChannel.init(uuid);

        userStatusChannel.init(uuid);

        // Initialize application data channel with gg's unique ID
        appDataChannel.init();


        mapModel.init();

        placesModel.init();

        privateNoteModel.init();  // Depends on everlive...

        userStatus.init();

        memberdirectory.init();

        noteModel.init();

        photoModel.init();

        profilePhotoModel.init();

        sharedPhotoModel.init();

        smartEvent.init();

        smartMovie.init();

        smartTrip.init();

        smartFlight.init();

        statusTracker.init();

        todayModel.init();

        galleryModel.init();

        groupModel.init();

        if (window.navigator.simulator === undefined) {
            serverPush.init();
        }


    },


    syncCloudModels : function () {
        mobileNotify("Syncing Cloud Models...");
        contactModel.sync();
        channelModel.sync();
        photoModel.sync();
        placesModel.sync();
        privateNoteModel.sync();
        sharedPhotoModel.sync();
        smartEvent.sync();
        smartMovie.sync();
        smartTrip.sync();
        smartFlight.sync();
        statusTracker.sync();
        statusTracker.syncObjects();
        notificationModel.sync();
        todayModel.sync();
        tagModel.sync();
        galleryModel.sync();
        groupModel.sync();
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

    update_user : function (user) {

        userModel.setUserUUID(user.userUUID);

        var publicKey = user.publicKey;
        var privateKey = user.privateKey;
        if (publicKey === null  || publicKey === '' || privateKey === null || privateKey === '') {
            userModel.generateNewPrivateKey();
        }
        
        userModel._user.set('username', user.Username);
        userModel._user.set('Username', user.Username);
        userModel._user.set('DisplayName', user.DisplayName);
        userModel._user.set('name', user.name);
        userModel._user.set('recoveryPassword', user.recoveryPassword);
        userModel._user.set('Email', user.Email);
        userModel._user.set('email', user.email);
        userModel._user.set('phone', user.phone);
        userModel._user.set('alias', user.alias);
        userModel._user.set('address', user.address);
        userModel._user.set('aliasPhoto', user.aliasPhoto);
        userModel._user.set('statusMessage', user.statusMessage);
        userModel._user.set('isAvailable', user.isAvailable);
        userModel._user.set('isCheckedIn', user.isCheckedIn);
        userModel._user.set('isVisible', user.isVisible);
        userModel._user.set('isRetina', user.isRetina);
        userModel._user.set('isWIFIOnly', user.isWIFIOnly);
        userModel._user.set('isPhotoStored', user.isPhotoStored);
        userModel._user.set('saveToPhotoAlbum', user.saveToPhotoAlbum);
        userModel._user.set('currentPlace', user.currentPlace);
        userModel._user.set('googlePlaceId', user.googlePlaceId);
        userModel._user.set('lat', user.lat);
        userModel._user.set('lng', user.lng);
        userModel._user.set('currentPlaceUUID', user.currentPlaceUUID);
        userModel._user.set('photo', user.photo);
        userModel._user.set('aliasPublic', user.aliasPublic);
        userModel._user.set('userUUID', user.userUUID);
        userModel._user.set('useIdenticon', user.useIdenticon);
        userModel._user.set('useLargeView', user.useLargeView);
        userModel._user.set('rememberUsername', user.rememberUsername);
        userModel._user.set('autoStatusEnabled', user.autoStatusEnabled);

        userModel._user.set('addressList', user.addressList);
        userModel._user.set('emailList', user.emailList);
        userModel._user.set('phoneList', user.phoneList);
        userModel._user.set('homeIntro', user.homeIntro);


        if(user.autoStatusEnabled === undefined) {
            user.autoStatusEnabled = false;
        }

        userModel._user.set('autoStatusEnabled', user.autoStatusEnabled);
        userModel._user.set('publicKey', publicKey);
        userModel._user.set('privateKey', privateKey);
        userModel.decryptPrivateKey();

        userModel.createIdenticon(user.userUUID);

        var photo = user.photo;
        if (photo === undefined || photo === null) {
            userModel._user.photo =  userModel.identiconUrl;
        }
        var emailValidated = user.isVerified;   // this is everlive's flag for email validation

        userModel._user.set('emailValidated', emailValidated);
        if (!emailValidated) {
            if (window.navigator.simulator === undefined) {
                cordova.plugins.notification.local.add({
                    id: 'verifyPhone',
                    title: 'intelligram suggests...',
                    message: 'Please verify your phone',
                    autoCancel: true,
                    date: new Date(new Date().getTime() + 30)
                });
            }
        }
        userModel._user.set('phoneValidated', user.phoneValidated);

        if (!user.phoneValidated) {
            if (window.navigator.simulator === undefined) {
                cordova.plugins.notification.local.add({
                    id: 'verifyEmail',
                    title: 'intelligram suggests...',
                    message: 'Please verify your email',
                    autoCancel: true,
                    date: new Date(new Date().getTime() + 30)
                });
            }
        }

        if (user.addressValidated === undefined) {
            user.addressValidated = false;
        }
        userModel._user.set('addressValidated',user.addressValidated);
        userModel._user.set('availImgUrl', 'images/status-away.svg');
        var isAvailable  = userModel._user.get('isAvailable');
        if (isAvailable) {
            userModel._user.set('availImgUrl', 'images/status-available.svg');
        }
        
        userModel._user.set('isValidated', emailValidated && user.phoneValidated);



        memberdirectory.update();

        if (user.phoneValidated) {
            APP.kendo.navigate('#home');
        } else {
            verifyPhoneModal.openModal();
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

    _setRecoveryPassword : function (password) {
        var aesPassword  = GibberishAES.enc(password, userModel.key);
        userModel._user.set('recoveryPassword', aesPassword);
        window.localStorage.setItem('ggRecoveryPassword', aesPassword);
    },
    
    _getRecoveryPassword : function () {
        var encPassword = window.localStorage.getItem('ggRecoveryPassword');
        var clearPassword = GibberishAES.dec(encPassword, userModel.key);

        return(clearPassword);
    },


    // user is valid parse User object
    generateNewPrivateKey : function () {
        // Generate Keys for the user.
        var RSAkey = cryptico.generateRSAKey(512);
        var publicKey = cryptico.publicKeyString(RSAkey);
        var privateKey = cryptico.privateKeyString(RSAkey);
        
        if (userModel.key === null) {
            userModel.generateUserKey();
        }
        userModel.RSAKey = RSAKey;
        userModel.publicKey = publicKey;
        userModel.privateKey = privateKey;

        var newPrivateKey  = GibberishAES.enc(privateKey, userModel.key);
        userModel._user.set('privateKey', newPrivateKey);
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

    encryptPrivateKey : function () {
        var privateKey = userModel._user.get('privateKey');
        var newPrivateKey  = GibberishAES.enc(privateKey, userModel.key);
        userModel._user.set('privateKey', newPrivateKey);
        
        
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
       
        userModel.RSAKey = RSAKey;
        userModel.privateKey = newPrivateKey;

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
            userModel._user.set('lat', place.lat.toFixed(9));
            userModel._user.set('lng', place.lng.toFixed(9));

        } else {
            userModel._user.set('currentPlace', locationName);
            userModel._user.set('currentPlaceUUID', null);
            userModel._user.set('googlePlaceId', googlePlaceId);
            userModel._user.set('lat', lat.toFixed(9));
            userModel._user.set('lng', lng.toFixed(9));
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
            return;
        }

        APP.pubnub = PUBNUB.init({
            publish_key: 'pub-c-d4fcc2b9-2c1c-4a38-9e2c-a11331c895be',
            subscribe_key: 'sub-c-4624e1d4-dcad-11e4-adc7-0619f8945a4f',
            ssl: true,
            jsonp: true,
            restore: true,
            uuid: uuid,
            error : function (error) {
                ggError("PubNub: Init" + error);
            }
        });



        deviceModel.setAppState('pubnubInit', true);
        deviceModel.isPushProvisioned();

        appDataChannel.history();
        userDataChannel.history();



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
    _status : null,
    _id : null,
    _needsSync: false,


    init: function () {
        var filter = new Everlive.Query();
        filter.where().eq('userUUID', userModel._user.userUUID);

        var data = APP.everlive.data(userStatus._ggClass);
        data.get(filter)
            .then(function(data){
                    if (data.count === 0) {
                        userStatus.create();
                    } else {
                        userStatus._status = data.result[0];
                        window.localStorage.setItem('ggUserStatus', JSON.stringify(userStatus._status));

                    }

                },
                function(error){
                    ggError("User Status Init error : " + JSON.stringify(error));
                });


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

    getMemberStatus : function (uuid, callback) {
        var filter = new Everlive.Query();
        filter.where().eq('userUUID', uuid);

        var data = APP.everlive.data(userStatus._ggClass);
        data.get(filter)
            .then(function(data){
                    if (data.count === 0) {
                        callback(null, null)
                    } else {
                        var member = data.result[0];
                        userStatus._status = member;
                        window.localStorage.setItem('ggUserStatus', JSON.stringify(userStatus._status));
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

        userStatus._statusObj.Id  = everlive._id;

        data.create(userStatus._statusObj,
            function(data){

                userStatus.update();

            },
            function(error){
                ggError("User Status create error : " + JSON.stringify(error));
            });
    },

    update : function () {
        var status = userStatus._statusObj;

        var everliveData =  APP.everlive.data(userStatus._ggClass);

        if (status.Id === undefined || status.Id === null) {
            status.Id = everlive._id;
        }
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
        var gp = {Longitude : parseFloat(userModel._user.lng), Latitude : parseFloat(userModel._user.lat)};
        status.set("geoPoint", gp);
        status.set('googlePlaceId', userModel._user.googlePlaceId);
        status.set('currentPlaceUUID', userModel._user.currentPlaceUUID);
        status.set('isCheckedIn', userModel._user.isCheckedIn);
        status.set('lastUpdate', ggTime.currentTime());


        everliveData.updateSingle( status,
            function ( data) {
                mobileNotify("User Status Updated");

            },
            function (error) {
                if (error !== null) {
                    if (error !== undefined && error.code === 801) {
                        userStatus.create();
                        return;
                    }
                   // mobileNotify("Update User Status error : " + JSON.stringify(error));
                }

            }
        );

        everlive.updateUserStatus();

    }

};
