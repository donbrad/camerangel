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
    lastEverliveSync: null,


    state: {
        inPrivacyMode: false,
        isVisible: true,
        isAvailable: true,
        rememberUsername: false,
        isOnline: true,
        connection: 'none',
        inBackground: false,
        userNotifications: [],
        phoneValidated: false,
        hasContacts: false,
        hasChannels: false,
        hasPrivateChannels: false,
        parseSyncComplete: false,
        hasPlaces: false,
        hasPhotos: false,
        hasNotes: false,
        hasNotifications: false,
        hasSmartEvents: false,
        hasSmartMovies: false,
        hasTags: false,
        introFetched: false,
        pubnubInit: false,
        isDeviceRegistered : false,
        devicePushEnabled : false,
        hasAccount : false
    },


    init: function() {
        deviceModel.deviceIsReady = true;

        deviceModel.lastEverliveSync = ggTime.currentTimeInSeconds() + 61;

        if (window.navigator.simulator !== true) {
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
                function (fileSystem) {
                    var url = fileSystem.root.nativeURL;
                    url = url.replace('file://', '');
                    deviceModel.fileDirectory = url;
                    console.log("fileDirectory = " + url);
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
                    console.log("tempDirectory = " + url);
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
        deviceModel.state.phoneValidated = false;
        deviceModel.state.hasContacts = false;
        deviceModel.state.hasChannels = false;
        deviceModel.state.hasMessages = false;
        deviceModel.state.hasPrivateChannels = false;
        deviceModel.state.hasPlaces = false;
        deviceModel.state.hasPhotos = false;
        deviceModel.state.hasSmartEvents = false;
        deviceModel.state.hasSmartMovies = false;
        deviceModel.state.hasTags = false;
        deviceModel.state.hasNotes = false;
        deviceModel.state.hasNotifications = false;
        deviceModel.state.introFetched =false;
        deviceModel.state.pubnubInit = false;
        deviceModel.state.isDeviceRegistered = false;
        deviceModel.state.devicePushEnabled = false;
        deviceModel.state.hasAccount = false;
        deviceModel.state.parseSyncComplete = false;

        // Reset App and User channel timestamps (should be rare on actual devices)
        localStorage.setItem('ggUserDataTimeStamp', 0);
        localStorage.setItem('ggAppDataTimeStamp', 0);
    },

    isPushProvisioned : function ()  {
        if (deviceModel.state.pubnubInit && deviceModel.state.isDeviceRegistered) {
            mobileNotify("Provisioning Server Push");
            serverPush.provisionDataChannels();
            serverPush.provisionGroupChannels();
            deviceModel.setAppState('devicePushEnabled', true);
        }

    },

    isParseSyncComplete: function () {

       /* var channels = deviceModel.state.hasChannels, photos = deviceModel.state.hasPhotos,
            contacts = deviceModel.state.hasContacts, objects = deviceModel.state.hasSmartEvents,
            notes = deviceModel.state.hasNotes, tags = deviceModel.state.hasTags;

        if (channels && photos && contacts && objects /!* & notes & tags*!/) {

            deviceModel.state.parseSyncComplete = true;

            if (!deviceModel.state.pubnubInit) {
                userModel.initPubNub();
                deviceModel.setAppState('pubnubInit', true);

                deviceModel.isPushProvisioned();
           }

            tagModel.syncTags();
        }*/
    },

    onResign : function () {
        deviceModel.setAppState('inBackground', true);
        //console.log("Resign");
    },


    onPause: function() {
        deviceModel.setAppState('inBackground', true);
       // console.log("Pause");


    },

    onActive : function () {
        deviceModel.setAppState('inBackground', false);
       /* var channels = channelModel.getUnreadChannels();

        for (var i=0; i<channels.length; i++) {
            var channel = channels[i];

            notificationModel.addUnreadNotification(channel.channelUUID, channel.name, channel.unreadCount);
        }*/
    },


    onResume: function() {
       deviceModel.setAppState('inBackground', false);

        notificationModel.processUnreadChannels();
        

    },



    syncEverlive: function () {

        if (deviceModel.state.connection === 'none') {

            APP.everlive.offline();
            return;
        }

        everlive.syncCloud();
        

    },


    onOnline: function() {
        deviceModel.setAppState('isOnline', true);
        // Take all data sources online

        if (APP.everlive !== null) {
            if (userModel._needSync) {
                everlive.updateUser();
            }
            if (userModel._needStatusSync) {
                everlive.updateUserStatus();
            }
           everlive.syncCloud();

        }


        deviceModel.getNetworkState();
    },


    inBackground : function () {
        return(deviceModel.state.inBackground);
    },

    onOffline: function() {
        deviceModel.setAppState('isOnline', false);
        $("#network-offline").removeClass('hidden');
        // Take all data sources offline
        if (APP.everlive !== null)
            APP.everlive.offline();
    },

    isOnline : function () {
        $("#network-offline").addClass('hidden');
        return(deviceModel.state.isOnline);
    },
    
    isWifi : function () {
       return(deviceModel.state.connection === 'internet');
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
            case Connection.NONE:
                deviceModel.setAppState('connection', "none");
                deviceModel.setAppState('isOnline', false);
                mobileNotify("Offline");
                break;
            case Connection.ETHERNET:
            case Connection.WIFI:
                deviceModel.setAppState('connection', "internet");
                deviceModel.setAppState('isOnline', true);
                mobileNotify("Online via Wifi");
                break;
            case Connection.CELL:
            case Connection.CELL_2G:
            case Connection.CELL_3G:
            case Connection.CELL_4G:
                deviceModel.setAppState('connection', "cell");
                deviceModel.setAppState('isOnline', true);
                mobileNotify("Online via Cell");
                break;
        }
    }
};