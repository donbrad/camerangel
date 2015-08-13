/**
 * Created by donbrad on 8/11/15.
 * userModel.js -- handles all user model interactions with parse, kendoDS and local storage
 */
'use strict';

var userModel = {

    parseUser: null,
    tempDirectory: '',
    appDirectory: '',
    parseACL : undefined,
    userName : '',
    rememberUserName : false,
    initialView : '#newuserhome',

    currentUser: new kendo.data.ObservableObject({
        username: '',
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
        emailVerified: false,
        phoneVerified: false,
        isVerified: false,
        isRetina: false,
        isWIFIOnly: false,
        isPhotoStored: false,
        isVisible: true,
        isAvailable: true,
        availImgUrl: 'images/status-available.svg',
        currentPlaceName: '',
        currentPlaceUUID: ''
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
        Parse.User.enableRevocableSession();
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
            userModel.initialView = '#home';
            userModel.currentUser.set('username', userModel.parseUser.get('username'));
            userModel.currentUser.set('name', userModel.parseUser.get('name'));
            userModel.currentUser.set('email', userModel.parseUser.get('email'));
            userModel.currentUser.set('phone', userModel.parseUser.get('phone'));
            userModel.currentUser.set('alias', userModel.parseUser.get('alias'));
            userModel.currentUser.set('userUUID', userModel.parseUser.get('userUUID'));
            userModel.currentUser.set('publicKey', userModel.parseUser.get('publicKey'));
            userModel.currentUser.set('privateKey', userModel.parseUser.get('privateKey'));
            userModel.currentUser.set('statusMessage', userModel.parseUser.get('statusMessage'));
            userModel.currentUser.set('currentPlaceUUID', userModel.parseUser.get('currentPlaceUUID'));
            userModel.currentUser.set('currentPlace', userModel.parseUser.get('currentPlace'));
            userModel.currentUser.set('aliasPublic', userModel.parseUser.get('aliasPublic'));
            userModel.currentUser.set('aliasPhoto', userModel.parseUser.get('aliasPhoto'));
            userModel.currentUser.set('photo', userModel.parseUser.get('photo'));
            userModel.currentUser.set('isAvailable', userModel.parseUser.get('isAvailable'));
            userModel.currentUser.set('isVisible', userModel.parseUser.get('isVisible'));
            userModel.currentUser.set('isRetina', userModel.parseUser.get('isRetina'));
            userModel.currentUser.set('isWIFIOnly', userModel.parseUser.get('isWIFIOnly'));
            userModel.currentUser.set('isPhotoStored', userModel.parseUser.get('isPhotoStored'));
            userModel.currentUser.set('saveToPhotoAlbum', userModel.parseUser.get('saveToPhotoAlbum'));
            userModel.currentUser.set('rememberUsername', userModel.parseUser.get('rememberUsername'));
            userModel.currentUser.set('phoneVerified', userModel.parseUser.get('phoneVerified'));
            userModel.currentUser.set('emailVerified', userModel.parseUser.get('emailVerified'));
            userModel.currentUser.set('availImgUrl', 'images/status-away.svg');
            updateHeaderStatusImages();

            userModel.parseACL = new Parse.ACL(userModel.parseUser);

            userModel.currentUser.bind('change', syncProfile);

            userModel.initPubNub();
            userModel.fetchParseData();

        }

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
        APP.models.places.placesDS.fetch();

        // fetch channel (chat) models (objects) from parse.
        channelModel.fetch();

        // fetch contact models (objects) from parse.
        contactModel.fetch();

        var PhotoModel = Parse.Object.extend("photos");
        var PhotoCollection = Parse.Collection.extend({
            model: PhotoModel
        });

        var photos = new PhotoCollection();

        photos.fetch({
            success: function(collection) {
                var models = new Array();
                for (var i = 0; i < collection.models.length; i++) {
                    models.push(collection.models[i].attributes);
                }
                if (models.length > 0) {
                    deviceModel.setAppState('hasPhotos', true);
                }
                APP.models.gallery.photosDS.data(models);
            },
            error: function(collection, error) {
                handleParseError(error);
            }
        });

        var InviteModel = Parse.Object.extend("invites");
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

        var p2pModel = Parse.Object.extend("p2pmap");
        var p2pCollection = Parse.Collection.extend({
            model: p2pModel
        });

        var p2pmap = new p2pCollection();

        p2pmap.fetch({
            success: function(collection) {
                var models = new Array();
                for (var i = 0; i < collection.models.length; i++) {
                    models.push(collection.models[i].attributes);
                }
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
        });
    }


};
