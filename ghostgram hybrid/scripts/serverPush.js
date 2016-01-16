/**
 * Created by donbrad on 11/15/15.
 * serverPush.js -- all objects and methods for serverPush
 * Pubnub, apple, google...
 *
 */


var serverPush = {
    plugin : null,
    _initialized : false,
    _registered : false,
    _googleSenderId : "962500978306",   // contact donbrad before changing...
    _regId : null,
    _channelsProvisioned : false,
    _dataChannelsProvisioned : false,
    _badgeCount : 0,

    init : function () {

        if (serverPush._initialized)
            return;

       // window.serverPush = serverPush;
        serverPush._initialized = true;

        serverPush.plugin = window.plugins.pushNotification;

        if (device.platform === 'android' || device.platform === 'Android' || device.platform === 'amazon-fireos' ) {
            serverPush.plugin.register(serverPush.onRegistration, serverPush.onError,
                {senderID: serverPush._googleSenderId, icon: 'icon', iconColor: 'white', ecb: 'serverPush.onNotificationECM'});
        } else if (device.platform === 'iOS') {
            serverPush.plugin.register(serverPush.onRegistration, serverPush.onError,
                {badge: true, clearBadge: true, sound : true, alert: true, ecb : 'serverPush.onNotificationAPN'});
        }


    },

    onRegistration : function (data) {

        if (serverPush._registered)
            return;

        serverPush._registered = true;
       // mobileNotify("Server Push enabled : " + data);

        serverPush._regId =  data;

        deviceModel.setAppState('isDeviceRegistered', true);

        deviceModel.isPushProvisioned();

    },

    // Handle iOS / Apple Notifications
    onNotificationAPN : function (e) {

        // If this is a message and there's a channelId, update activeChannels so we can
        // build inApp notifications on launch.
        if (e.isMessage !== undefined && e.isMessage) {
            //This is userDataChannel Notification
            if (e.channelId !== undefined) {
                // Update unread  unless it's the current channel
                if (e.channelId !== channelView._channelId) {
                    if (e.senderId !== undefined && e.senderId !== userModel.currentUser.userUUID) {
                        if (e.isPrivate) {
                            channelModel.updatePrivateUnreadCount(e.channelId);
                        } else {
                            channelModel.updateUnreadCount(e.channelId,1);
                            channelModel.updateActiveChannel(e.channelId);
                        }
                    }
                }
            }
        } else {
            //This is an appDataChannel Notification
            if (e.isEvent !== undefined && e.isEvent) {

            }

        }

        if (e.foreground !== undefined && e.foreground === '1') {
            // Just show gg quick notification is the app is running in the foreground
            // and the channel isn't the current channel
            if (e.alert) {
                if (e.isMessage !== undefined && e.isMessage === true && e.channelId !== undefined) {
                    if (e.channelId !== channelView._channelId) {
                        mobileNotify(e.alert);
                    }

                }

                if (e.isEvent !== undefined && e.isEvent) {
                    mobileNotify(e.alert);
                }


            }
            serverPush._badgeCount = 0;
            serverPush.plugin.setApplicationIconBadgeNumber(serverPush.onSuccess, serverPush.onError, serverPush._badgeCount);

        } else {
            //if (e.badge) {
                serverPush._badgeCount++;
                serverPush.plugin.setApplicationIconBadgeNumber(serverPush.onSuccess, serverPush.onError, serverPush._badgeCount);
                serverPush.plugin.finish();
           // }


        }


       /* if (e.sound) {
            // playing a sound also requires the org.apache.cordova.media plugin
            var snd = new Media(e.sound);
            snd.play();
        }*/


    },

    // Handle Android / Google Notifications
    onNotificationECM : function (e) {

        switch( e.event )
        {
            case 'registered':
                if ( e.regid.length > 0 )
                {
                    // Your GCM push server needs to know the regID before it can push to this device
                    // here is where you might want to send it the regID for later use.
                    if (serverPush._registered)
                        return;

                    serverPush._registered = true;

                    //mobileNotify("Notification: Android regID = " + e.regid);
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


                    mobileNotify(e.payload.message);

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
               mobileNotify('Unknown notification : contact support');
                break;
        }

    },

    onSuccess : function (e) {
        // e.message
       // mobileNotify("Server push : " + e.message);
    },

    onError : function (e) {
        // e.message
        mobileNotify("Server push error : " + e.message);
    },

    provisionGroupChannels : function () {

        if (!serverPush._channelsProvisioned) {

            serverPush._channelsProvisioned = true;

            var channels = channelModel.queryChannels({ field: "isPrivate", operator: "eq", value: false });

            if (channels !== undefined && channels.length > 0) {
                for (var i=0; i< channels.length; i++) {
                    var channel = channels[i];

                    serverPush.provisionGroupChannel(channel.channelId)
                }
            }
        }
    },

    provisionGroupChannel : function (channelId) {

        if (channelId === undefined || channelId === null) {
            mobileNotify("Can't provision null channnel");
            return;

        }
        var regId = serverPush._regId;
        var type = 'apns';

        if (device.platform === "Android") {
            type = 'gcm';
        }

        APP.pubnub.mobile_gw_provision ({
            device_id: regId,
            op    : 'add',
            gw_type  : type,
            channel  :  channelId,
            callback : serverPush._success,
            error  : serverPush._error
        });
    },

    unprovisionGroupChannel : function (channelId) {
        if (channelId === undefined || channelId === null) {
            mobileNotify("Can't provision null channnel");
            return;

        }
        var regId = serverPush._regId;
        var type = 'apns';

        if (device.platform === "Android") {
            type = 'gcm';
        }

        APP.pubnub.mobile_gw_provision ({
            device_id: regId,
            op    : 'remove',
            gw_type  : type,
            channel  :  channelId,
            callback : serverPush._success,
            error  : serverPush._error
        });
    },


    provisionDataChannels : function () {

        if (!serverPush._dataChannelsProvisioned) {
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

            serverPush._dataChannelsProvisioned = true;

            //mobileNotify("pubnub push provisioned!!!");

        }
    },

    _success : function (data) {
        mobileNotify("Data channel server push enabled!");
    },

    _error : function (error) {
        if (error !== undefined)
            mobileNotify("Pubnub Push Channel Error " + error);
    }


};