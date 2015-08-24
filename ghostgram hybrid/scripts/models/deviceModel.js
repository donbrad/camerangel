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
        pubnubInit: false
    },


    init: function() {

        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
            function(fileSystem) {
                var url = fileSystem.root.nativeURL;
                url = url.replace('file://', '');
                deviceModel.fileDirectory = url;
                APP.models.profile.appDirectory = url;
                //mobileNotify(APP.fileDirectory);
            },
            function(error) {
                mobileNotify("Filesystem error : " + JSON.stringify(error));
            });

        window.requestFileSystem(LocalFileSystem.TEMPORARY, 0,
            function(fileSystem) {
                var url = fileSystem.root.nativeURL;
                url = url.replace('file://', '');
                deviceModel.tempDirectory = url;
                APP.models.profile.tempDirectory = url;
                //mobileNotify(APP.tempDirectory);
            },
            function(error) {
                mobileNotify("Filesystem error : " + JSON.stringify(error));
            });

    },

    resetDeviceState: function ()  {
        this.state.inPrivacyMode = false;
        this.state.isVisible = true;
        this.state.isAvailable = true;
        this.state.rememberUsername = false;
        this.state.isOnline = true;
        this.state.inBackground= false;
        this.state.userNotifications = [];
        this.state.phoneVerified = false;
        this.state.hasContacts = false;
        this.state.hasChannels = false;
        this.state.hasPrivateChannels = false;
        this.state.hasPlaces = false;
        this.state.hasPhotos = false;
        this.state.introFetched =false;
        this.state.pubnubInit = false;

        // Reset App and User channel timestamps (should be rare on actual devices)
        localStorage.setItem('ggUserDataTimeStamp', 0);
        localStorage.setItem('ggAppDataTimeStamp', 0);
    },

    isParseSyncComplete: function () {

        var channels = deviceModel.state.hasChannels, privateChannels = deviceModel.state.hasPrivateChannels,
            contacts = deviceModel.state.hasContacts,
            places = deviceModel.state.hasPlaces, photos = deviceModel.state.hasPhotos;
        // Todo:  add places -- need to discuss with tucker

        if (channels && privateChannels && contacts && photos) {

            if (!deviceModel.state.pubnubInit) {
                userModel.initPubNub();
                deviceModel.setAppState('pubnubInit', true);
                channelModel.updateChannelsMessageCount();
                channelModel.init();
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
        contactModel.contactsDS.online(true);
        APP.models.places.placesDS.online(true);

        deviceModel.getNetworkState();
    },

    onOffline: function() {
        deviceModel.setAppState('isOnline', false);
        // Take all data sources offline

        APP.models.home.invitesDS.online(false);
        notificationModel.notificationDS.online(false);
        channelModel.channelsDS.online(false);
        photoModel.photosDS.online(false);
        contactModel.contactsDS.online(false);
        APP.models.places.placesDS.online(false);

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