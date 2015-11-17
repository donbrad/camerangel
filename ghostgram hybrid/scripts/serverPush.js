/**
 * Created by donbrad on 11/15/15.
 * serverPush.js -- all objects and methods for serverPush
 * Pubnub, apple, google...
 *
 */


var serverPush = {
    plugin : null,
    _googleSenderId : "962500978306",   // contact donbrad before changing...
    _regId : null,
    _channelsProvisioned : false,

    init : function () {
        serverPush.plugin = window.PushNotification.init({ "android": {"senderID": serverPush._googleSenderId},
            "ios": {"alert": "true", "badge": "true", "sound": "true"}, "windows": {} } );

        serverPush.plugin.on('registration', this.onRegistration);

        serverPush.plugin.on('notification', this.onNotification);

        serverPush.plugin.on('error', this.onError);

    },

    onRegistration : function (data) {
        // data.registrationId
        mobileNotify("Server Push enabled : " + data.registrationId);
        serverPush._regId =  data.registrationId;

        deviceModel.setAppState('isDeviceRegistered', true);

        deviceModel.isPushProvisioned();

    },

    onNotification : function (data) {
        // data.message,
        // data.title,
        // data.count,
        // data.sound,
        // data.image,
        // data.additionalData
    },

    onError : function (e) {
        // e.message
        mobileNotify("Server push error : " + e.message);
    },

    provisionDataChannels : function () {

        if (!serverPush._channelsProvisioned) {
            var type = 'apns';

            if (device.platform === "Android") {
                type = 'gcm';
            }


            APP.pubnub.mobile_gw_provision ({
                device_id: serverPush._regId,
                op    : 'add',
                gw_type  : type,
                channel  :  appDataChannel.channelId,
                callback : serverPush._success,
                error  : serverPush._error
            });

            APP.pubnub.mobile_gw_provision ({
                device_id: serverPush._regId,
                op    : 'add',
                gw_type  :type,
                channel  : userDataChannel.channelId,
                callback : serverPush._success,
                error  : serverPush._error
            });

            serverPush._channelsProvisioned = true;

        }
    },

    _success : function (data) {
        mobileNotify("Data channel server push enabled!");
    },

    _error : function (error) {
        mobileNotify("Push Channel Error " + error);
    }


};