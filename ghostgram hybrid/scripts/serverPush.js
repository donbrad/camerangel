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

    init : function () {
        serverPush.plugin = PushNotification.init({ "android": {"senderID": serverPush._googleSenderId},
            "ios": {"alert": "true", "badge": "true", "sound": "true"}, "windows": {} } );

        push.on('registration', this.onRegistration);

        push.on('notification', this.onNotification);

        push.on('error', this.onError);
    },

    onRegistration : function (data) {
        // data.registrationId
        mobileNotify("Server Push enabled : " + data.registrationId);
        serverPush._regId =  data.registrationId;

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
    }

};