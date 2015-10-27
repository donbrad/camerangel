/**
 * Created by donbrad on 8/11/15.
 * userModel.js -- handles all user model interactions with parse, kendoDS and local storage
 */
'use strict';

var userModel = {

    parseUser: null,
    parseDataFetched: false,
    tempDirectory: '',
    appDirectory: '',
    parseACL : undefined,
    userName : '',
    identiconUrl : null,
    rememberUserName : false,
    initialView : '#newuserhome',

    currentUser: new kendo.data.ObservableObject({
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

    initParse: function () {
       if (! Parse.Session.isCurrentSessionRevocable()) {
           mobileNotify("Please Login on this device");
       }

        userModel.parseUser = Parse.User.current();
        userModel.device.udid = device.uuid;
        userModel.device.platform = device.platform;
        userModel.device.device = device.name;
        userModel.device.model = device.model;
        userModel.rememberUsername = window.localStorage.getItem('ggRememberUsername');

        // If remembering Username, get it from localstorage and prefill signin.
        if (userModel.rememberUsername) {
           userModel.username = window.localStorage.getItem('ggUsername');
            if (userModel.username == undefined || userModel.username === '') {
                window.localStorage.setItem('ggUsername', userModel.parseUser.get('username'));
            } else {
                $('#home-signin-username').val(userModel.username);
            }

        }

        if (userModel.parseUser !== null) {

            userModel.updatePrivateKey();
            userModel.decryptPrivateKey();
            userModel.initialView = '#home';
            userModel.currentUser.set('username', userModel.parseUser.get('username'));
            userModel.currentUser.set('objectId', userModel.parseUser.get('objectId'));
            userModel.currentUser.set('name', userModel.parseUser.get('name'));
            userModel.currentUser.set('email', userModel.parseUser.get('email'));
            userModel.currentUser.set('phone', userModel.parseUser.get('phone'));
            userModel.currentUser.set('alias', userModel.parseUser.get('alias'));
            userModel.currentUser.set('userUUID', userModel.parseUser.get('userUUID'));
            userModel.currentUser.set('publicKey', userModel.parseUser.get('publicKey'));
           // userModel.currentUser.set('privateKey', userModel.parseUser.get('privateKey'));
            userModel.currentUser.set('statusMessage', userModel.parseUser.get('statusMessage'));
            userModel.currentUser.set('currentPlaceUUID', userModel.parseUser.get('currentPlaceUUID'));
            userModel.currentUser.set('currentPlace', userModel.parseUser.get('currentPlace'));
            userModel.currentUser.set('aliasPublic', userModel.parseUser.get('aliasPublic'));
            userModel.currentUser.set('aliasPhoto', userModel.parseUser.get('aliasPhoto'));
            userModel.currentUser.set('photo', userModel.parseUser.get('photo'));
            userModel.currentUser.set('isAvailable', userModel.parseUser.get('isAvailable'));
            userModel.currentUser.set('isCheckedIn', userModel.parseUser.get('isCheckedIn'));
            userModel.currentUser.set('isVisible', userModel.parseUser.get('isVisible'));
            userModel.currentUser.set('isRetina', userModel.parseUser.get('isRetina'));
            userModel.currentUser.set('isWIFIOnly', userModel.parseUser.get('isWIFIOnly'));
            userModel.currentUser.set('isPhotoStored', userModel.parseUser.get('isPhotoStored'));
            userModel.currentUser.set('saveToPhotoAlbum', userModel.parseUser.get('saveToPhotoAlbum'));
            userModel.currentUser.set('rememberUsername', userModel.parseUser.get('rememberUsername'));
            userModel.currentUser.set('phoneVerified', userModel.parseUser.get('phoneVerified'));
            userModel.currentUser.set('emailValidated', userModel.parseUser.get('emailVerified'));
            userModel.currentUser.set('useIdenticon', userModel.parseUser.get('useIdenticon'));
            userModel.currentUser.set('availImgUrl', 'images/status-away.svg');
            ux.updateHeaderStatusImages();

            userModel.createIdenticon(userModel.parseUser.get('userUUID'));
            userModel.parseACL = new Parse.ACL(userModel.parseUser);

            userModel.currentUser.bind('change', userModel.sync);
            userModel.fetchParseData();

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
        var userId = user.get('objectId');

        userModel.currentUser.set('publicKey',publicKey);
        userModel.currentUser.set('privateKey',privateKey);
        user.set("publicKey", publicKey);
        var newPrivateKey  = GibberishAES.enc(privateKey, userId);
        user.set("privateKey", newPrivateKey);

        user.save();

    },

   sync: function (e) {
      _preventDefault(e);

        userModel.parseUser.set(e.field, userModel.currentUser.get(e.field));
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

    decryptPrivateKey : function () {
        if (privateKey === undefined || key === undefined) {
            return;
        }
        
        var privateKey = userModel.parseUser.get('privateKey'), key = userModel.parseUser.get('objectId');
        var newPrivateKey  = GibberishAES.dec(privateKey, key);
        userModel.currentUser.set('privateKey', newPrivateKey);
    },

    encryptBlob : function (blobIn) {
        var key = userModel.parseUser.get('objectId');
        return(GibberishAES.enc(blobIn, key));
    },

    decryptBlob : function (blobIn) {
        var key = userModel.parseUser.get('objectId');
        return(GibberishAES.dec(blobIn, key));
    },

    updatePrivateKey : function () {
        var privateKey = userModel.parseUser.get('privateKey'), key = userModel.parseUser.get('objectId');
        if (privateKey === undefined || key === undefined) {
            return;
        }

        if (privateKey.charAt(0) === "{") {
            var newPrivateKey  = GibberishAES.enc(privateKey, key);
            userModel.parseUser.set('privateKey', newPrivateKey);
            userModel.parseUser.save();
        }
    },

    checkIn : function (placeId) {
        var place = placesModel.getPlaceModel(placeId);

        userModel.currentUser.set('currentPlace',place.name);
        userModel.currentUser.set('currentPlaceId', place.uuid);
        userModel.currentUser.set('isCheckedIn', true);

        userStatus.update();
    },

    checkOut : function () {
        userModel.currentUser.set('isCheckedIn', false);
    },

    initPubNub: function () {
        var uuid = userModel.currentUser.get('userUUID');

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

        userStatus.init();

       /* var InviteModel = Parse.Object.extend("invites");
        var InviteCollection = Parse.Collection.extend({
            model: InviteModel
        });

        var invites = new InviteCollection();

        invites.fetch({
            success: function(collection) {
                var models = new Array();
                for (var i = 0; i < collection.models.length; i++) {
                    models.push(collection.models[i].attributes);
                }

                APP.models.home.invitesDS.data(models);
            },
            error: function(collection, error) {
                handleParseError(error);
            }
        });


        var channelMapModel = Parse.Object.extend("channelmap");
        var channelMapCollection = Parse.Collection.extend({
            model: channelMapModel
        });

        var channelMap = new channelMapCollection();

        channelMap.fetch({
            success: function(collection) {
                var channels = new Array();
                for (var i = 0; i < collection.models.length; i++) {
                    channels.push(collection.models[i].attributes);
                }
            },
            error: function(collection, error) {
                handleParseError(error);
            }
        }); */
    },

    enableIdenticon : function () {
        $('.homeProfileImg').addClass('hidden');
        $('#homeProfileIdenticon').removeClass('hidden');

        $('#profileStatusPhoto').addClass('hidden');
        $('#profileStatusIdenticon').removeClass('hidden');

        var hash = userModel.currentUser.userUUID;
        if (hash === undefined) {
            hash = "01234567890ABCDE";
        } else {
            hash = hash.replace(/-/g,'');  //strip the dashes...
        }

        jdenticon.update("#homeProfileIdenticon", hash);

        jdenticon.update("#profileStatusIdenticon", hash);
    },

    disableIdenticon : function () {

        $('.homeProfileImg').removeClass('hidden');
        $('#homeProfileIdenticon').addClass('hidden');

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
            case 'photo' :
            case 'isAvailable' :
            case 'isVisible' :
            case 'isCheckedIn' :
            case 'statusMessage' :
            case 'currentPlace' :
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
        status.set('photo', userModel.currentUser.photo);
        status.set('isAvailable', userModel.currentUser.isAvailable);
        status.set('isVisible', userModel.currentUser.isVisible);
        status.set('statusMessage', userModel.currentUser.statusMessage);
        status.set('currentPlace', userModel.currentUser.currentPlace);
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
