/**
 * Created by donbrad on 11/15/15.
 * serverPush.js -- all objects and methods for serverPush
 * Pubnub, apple, google...
 *
 */


var serverPush = {
    plugin : null,
    _initialized : false,
    _googleSenderId : "962500978306",   // contact donbrad before changing...
    _regId : null,
    _channelsProvisioned : false,

    init : function () {

        if (serverPush._initialized)
            return;

       // window.serverPush = serverPush;
        serverPush._initialized = true;

        serverPush.plugin = window.plugins.pushNotification;

        if (device.platform == 'android' || device.platform == 'Android' || device.platform == 'amazon-fireos' ) {
            serverPush.plugin.register(serverPush.onRegistration, serverPush.onError,
                {senderID: serverPush._googleSenderId, ecb: 'serverPush.onNotificationECM'});
        } else if (device.platform == 'iOS') {
            serverPush.plugin.register(serverPush.onRegistration, serverPush.onError,
                {badge: false, sound : false, alert: true, ecb : serverPush.onNotificationAPN});
        }


    },

    onRegistration : function (data) {

        mobileNotify("Server Push enabled : " + data);
        serverPush._regId =  data;

        deviceModel.setAppState('isDeviceRegistered', true);

        deviceModel.isPushProvisioned();

    },


    onNotificationAPN : function (e) {

        if (e.alert) {
            navigator.notification.alert(e.alert);
        }

       /* if (e.sound) {
            // playing a sound also requires the org.apache.cordova.media plugin
            var snd = new Media(e.sound);
            snd.play();
        }*/

        if (e.badge) {
            serverPush.plugin.setApplicationIconBadgeNumber(serverPush.onSuccess, e.badge);
        }
    },

    onNotificationECM : function (e) {

        switch( e.event )
        {
            case 'registered':
                if ( e.regid.length > 0 )
                {
                    // Your GCM push server needs to know the regID before it can push to this device
                    // here is where you might want to send it the regID for later use.
                    mobileNotify("Notification: Android regID = " + e.regid);
                    serverPush._regId =  e.regid;

                    deviceModel.setAppState('isDeviceRegistered', true);

                    deviceModel.isPushProvisioned();
                }
                break;

            case 'message':
                // if this flag is set, this notification happened while we were in the foreground.
                // you might want to play a sound to get the user's attention, throw up a dialog, etc.
                if (e.foreground)
                {
                   /* // on Android soundname is outside the payload.
                    // On Amazon FireOS all custom attributes are contained within payload
                    var soundfile = e.soundname || e.payload.sound;
                    // if the notification contains a soundname, play it.
                    // playing a sound also requires the org.apache.cordova.media plugin
                    var my_media = new Media("/android_asset/www/"+ soundfile);

                    my_media.play();*/

                    mobileNotify(e.payload.summary);

                }
                else
                {	// otherwise we were launched because the user touched a notification in the notification tray.
                    if (e.coldstart)
                        mobileNotify('Notification : Cold Start');

                }



                break;

            case 'error':

                mobileNotify("Notification Error : " + e.msg);
                break;

            default:
               mobileNotify('Notification Unknown: an event was received and we do not know what it is');
                break;
        }

    },

    onSuccess : function (e) {
        // e.message
        mobileNotify("Server push : " + e.message);
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

            var regId = serverPush._regId;
            var dataChannel = appDataChannel.channelId, userChannel = userDataChannel.channelId;

            APP.pubnub.mobile_gw_provision ({
                device_id: regId,
                op    : 'add',
                gw_type  : type,
                channel  :  dataChannel,
                callback : serverPush._success,
                error  : serverPush._error
            });

            APP.pubnub.mobile_gw_provision ({
                device_id: regId,
                op    : 'add',
                gw_type  :type,
                channel  : userChannel,
                callback : serverPush._success,
                error  : serverPush._error
            });

            serverPush._channelsProvisioned = true;

            mobileNotify("pubnub push provisioned!!!");

        }
    },

    _success : function (data) {
        mobileNotify("Data channel server push enabled!");
    },

    _error : function (error) {
        mobileNotify("Pubnub Push Channel Error " + error);
    }


};