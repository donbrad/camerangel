/**
 * Created by donbrad on 8/13/15.
 *
 * deviceModel.js
 *
 */
'use strict';

var deviceModel = {

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
        hasPlaces: false,
        introFetched: false
    },
    fileDirectory: '',
    tempDirectory: '',

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
        APP.models.home.notificationDS.online(true);
        channelModel.channelsDS.online(true);
        APP.models.gallery.photosDS.online(true);
        contactModel.contactsDS.online(true);
        APP.models.places.placesDS.online(true);

        deviceModel.getNetworkState();
    },

    onOffline: function() {
        deviceModel.setAppState('isOnline', false);
        // Take all data sources offline

        APP.models.home.invitesDS.online(false);
        APP.models.home.notificationDS.online(false);
        channelModel.channelsDS.online(false);
        APP.models.gallery.photosDS.online(false);
        contactModel.contactsDS.online(false);
        APP.models.places.placesDS.online(false);

    },


    setAppState: function(field, value) {
        deviceModel.state[field] = value;
        deviceModel.saveAppState();
    },

    saveAppState: function() {
        window.localStorage.setItem('ggAppState', JSON.stringify(deviceModel.state));
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