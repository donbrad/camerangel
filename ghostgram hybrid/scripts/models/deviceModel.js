/**
 * Created by donbrad on 8/13/15.
 *
 * deviceModel.js
 *
 */
'use strict';

var deviceModel = {

    fileDirectory: '',
    tempDirectory: '',
    appVersion: '',
    deviceIsReady: false,


    state: {
        inPrivacyMode: false,
        isVisible: true,
        isAvailable: true,
        rememberUsername: false,
        isOnline: true,
        inBackground: false,
        userNotifications: [],
        phoneVerified: false,
        hasContacts: false,
        hasChannels: false,
        hasPrivateChannels: false,
        hasPlaces: false,
        hasPhotos: false,
        introFetched: false,
        pubnubInit: false,
        isDeviceRegistered : false,
        devicePushEnabled : false,
    },


    init: function() {
        deviceModel.deviceIsReady = true;

        if (window.navigator.simulator !== true) {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
                function (fileSystem) {
                    var url = fileSystem.root.nativeURL;
                    url = url.replace('file://', '');
                    deviceModel.fileDirectory = url;
                    userModel.appDirectory = url;
                    //mobileNotify(APP.fileDirectory);
                },
                function (error) {
                    mobileNotify("Filesystem error : " + JSON.stringify(error));
                });

            window.requestFileSystem(LocalFileSystem.TEMPORARY, 0,
                function (fileSystem) {
                    var url = fileSystem.root.nativeURL;
                    url = url.replace('file://', '');
                    deviceModel.tempDirectory = url;
                    userModel.tempDirectory = url;
                    //mobileNotify(APP.tempDirectory);
                },
                function (error) {
                    mobileNotify("Filesystem error : " + JSON.stringify(error));
                });
        }

    },

    resetDeviceState: function ()  {
        deviceModel.state.inPrivacyMode = false;
        deviceModel.state.isVisible = true;
        deviceModel.state.isAvailable = true;
        deviceModel.state.rememberUsername = false;
        deviceModel.state.isOnline = true;
        deviceModel.state.inBackground= false;
        deviceModel.state.userNotifications = [];
        deviceModel.state.phoneVerified = false;
        deviceModel.state.hasContacts = false;
        deviceModel.state.hasChannels = false;
        deviceModel.state.hasMessages = false;
        deviceModel.state.hasPrivateChannels = false;
        deviceModel.state.hasPlaces = false;
        deviceModel.state.hasPhotos = false;
        deviceModel.state.introFetched =false;
        deviceModel.state.pubnubInit = false;

        // Reset App and User channel timestamps (should be rare on actual devices)
        localStorage.setItem('ggUserDataTimeStamp', 0);
        localStorage.setItem('ggAppDataTimeStamp', 0);
    },

    isPushProvisioned : function ()  {
        if (deviceModel.state.pubnubInit && deviceModel.state.isDeviceRegistered) {
            serverPush.provisionDataChannels();
            deviceModel.setAppState('devicePushEnabled', true);
        }

    },

    isParseSyncComplete: function () {

        var channels = deviceModel.state.hasChannels, photos = deviceModel.state.hasPhotos, contacts = deviceModel.state.hasContacts ;

        if (channels && photos && contacts) {

            if (!deviceModel.state.pubnubInit) {
                userModel.initPubNub();
                deviceModel.setAppState('pubnubInit', true);

                deviceModel.isPushProvisioned();

               // channelModel.updateChannelsMessageCount();
                //channelModel.init();
           }

        }
    },

    onPause: function() {
       deviceModel.setAppState('inBackground', true);

    },

    onResume: function() {
        deviceModel.setAppState('inBackground', false);
    },

    onOnline: function() {
        deviceModel.setAppState('isOnline', true);
        // Take all data sources online

        APP.models.home.invitesDS.online(true);
        notificationModel.notificationDS.online(true);
        channelModel.channelsDS.online(true);
        photoModel.photosDS.online(true);
       // contactModel.contactsDS.online(true);
       // placesModel.placesDS.online(true);

        deviceModel.getNetworkState();
    },

    onOffline: function() {
        deviceModel.setAppState('isOnline', false);
        // Take all data sources offline

        APP.models.home.invitesDS.online(false);
        notificationModel.notificationDS.online(false);
        channelModel.channelsDS.online(false);
        photoModel.photosDS.online(false);
        //contactModel.contactsDS.online(false);
       // placesModel.placesDS.online(false);

    },

    setAppState: function(field, value) {
        deviceModel.state[field] = value;
       // deviceModel.state.set(field,value);
        deviceModel.saveAppState();
    },

    saveAppState: function() {
        window.localStorage.setItem('ggAppState', JSON.stringify(deviceModel.state));
        //window.localStorage.setItem('ggAppState', JSON.stringify(deviceModel.state.toJSON()));
    },

    getAppState: function() {
        var state = window.localStorage.getItem('ggAppState');
        if (state !== undefined && state !== null && state !== 'undefined')
            deviceModel.state = JSON.parse(state);
        else
            deviceModel.saveAppState();
    },

    getNetworkState: function () {
        var networkState = navigator.connection.type;
        switch (networkState) {
            case Connection.ETHERNET:
            case Connection.WIFI:
                deviceModel.setAppState('connection', "internet");
                mobileNotify("Online via Wifi");
                break;
            case Connection.CELL:
            case Connection.CELL_2G:
            case Connection.CELL_3G:
            case Connection.CELL_4G:
                deviceModel.setAppState('connection', "cell");
                mobileNotify("Online via Cell");
                break;
        }
    }
};