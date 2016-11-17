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

       serverPush.plugin = window.plugins.pushNotification;

        if (serverPush.plugin === undefined) {
            ggError("Server Push: Plug In Error!");
            return;
        }

        serverPush._initialized = true;
        if (device.platform === 'android' || device.platform === 'Android' || device.platform === 'amazon-fireos' ) {
            serverPush.plugin.register(serverPush.onRegistration, serverPush.onError,
                {senderID: serverPush._googleSenderId, icon: 'icon', iconColor: '#FFFFFF', ecb: 'serverPush.onNotificationECM', badge: true});
        } else if (device.platform === 'iOS') {
            serverPush.plugin.register(serverPush.onRegistration, serverPush.onError,
                {badge: true, clearBadge: true, sound : true, alert: true, ecb : 'serverPush.onNotificationAPN'});
        }


    },

    onRegistration : function (data) {

        if (serverPush._registered)
            return;

        serverPush._registered = true;
        mobileNotify("Server Push enabled : " + data);

        serverPush._regId =  data;

        //console.log("Device Id : " + data);

        deviceModel.setAppState('isDeviceRegistered', true);

        deviceModel.isPushProvisioned();

    },

    // Handle iOS / Apple Notifications
    onNotificationAPN : function (e) {

        //console.log("Notification : " + JSON.stringify(e));

        // If this is a message and there's a channelUUID, update activeChannels so we can
        // build inApp notifications on launch.
        if (e.isMessage !== undefined && e.isMessage) {
            //This is userDataChannel Notification
            if (e.channelUUID !== undefined) {
                // Update unread  unless it's the current channel
                if (e.channelUUID !== channelView._channelUUID) {
                    if (e.senderId !== undefined && e.senderId !== userModel._user.userUUID) {
                        if (e.isPrivate) {
                            channelModel.updatePrivateUnreadCount(e.channelUUID);
                        } else {
                            channelModel.updateUnreadCount(e.channelUUID, 1);
                            channelModel.updateActiveChannel(e.channelUUID);
                        }
                    }
                }
            }
        } else if (e.isAlert !== undefined && e.isAlert) {

        } else {
            //This is an appDataChannel Notification
            if (e.isEvent !== undefined && e.isEvent) {

            }

        }

        if (e.foreground !== undefined && e.foreground === '1') {
            // Just show gg quick notification is the app is running in the foreground
            // and the channel isn't the current channel
            if (e.alert) {
                if (e.isMessage !== undefined && e.isMessage === true && e.channelUUID !== undefined) {
                    if (e.channelUUID !== channelView._channelUUID) {
                        mobileNotify(e.alert);
                    }
                }

                /*if (e.isEvent !== undefined && e.isEvent) {
                 mobileNotify(e.alert);
                 }*/

                if (e.isAlert !== undefined && e.isAlert) {
                    mobileNotify(e.alert);
                }


            }
            serverPush._badgeCount = 0;
            serverPush.plugin.setApplicationIconBadgeNumber(serverPush.onSuccess, serverPush.onError, serverPush._badgeCount);

        }

        if (e.badge) {
            if (e.badge === 0) {
                serverPush._badgeCount = 0;
            } else {
                serverPush._badgeCount += e.badge;
            }

            serverPush.plugin.setApplicationIconBadgeNumber(serverPush.onSuccess, serverPush.onError, serverPush._badgeCount);
            serverPush.plugin.finish();
        }


    },

    // Handle Android / Google Notifications
    onNotificationECM : function (e) {

        //console.log("Notification : " + JSON.stringify(e));

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

                    console.log("Device Id " +  e.regid);

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
                        console.log('Notification : Cold Start');
                    else {
                        console.log('Notification : Background');
                    }

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
        //mobileNotify("Server push : " + e.message);
    },

    onError : function (e) {
        // e.message
        ggError("Server push error : " + e.message);
    },

    provisionGroupChannels : function () {

        if (!serverPush._channelsProvisioned) {

            serverPush._channelsProvisioned = true;

            var channels = channelModel.queryChannels([{ field: "isPrivate", operator: "eq", value: false },
                { field: "isEmergency", operator: "eq", value: true }]);

            if (channels !== undefined && channels.length > 0) {
                for (var i=0; i< channels.length; i++) {
                    var channel = channels[i];

                    serverPush.provisionGroupChannel(channel.channelUUID)
                }
            }
        }
    },

    unprovisionGroupChannels : function () {

        if (!serverPush._channelsProvisioned) {

            serverPush._channelsProvisioned = true;

            var channels = channelModel.queryChannels([{ field: "isPrivate", operator: "eq", value: false },
                { field: "isEmergency", operator: "eq", value: true }]);

            if (channels !== undefined && channels.length > 0) {
                for (var i=0; i< channels.length; i++) {
                    var channel = channels[i];

                    serverPush.unprovisionGroupChannel(channel.channelUUID)
                }
            }
        }
    },

    provisionGroupChannel : function (channelUUID) {

        if (channelUUID === undefined || channelUUID === null) {
            mobileNotify("Can't provision null channnel");
            return;

        }
        var regId = serverPush._regId;
        var type = 'apns';

        if (device.platform === "Android") {
            type = 'gcm';
        }

        APP.pubnub.push.addChannels ({
            device: regId,
            pushGateway  : type,
            channels  :  [channelUUID],
            callback : function (status, response) {
                    if (status.error) {
                        ggError("Provision Group Channels Error; ", JSON.stringify(status.error));
                    } else {

                    }

            }
        });
    },

    unprovisionGroupChannel : function (channelUUID) {
        if (channelUUID === undefined || channelUUID === null) {
            mobileNotify("Can't provision null channnel");
            return;

        }
        var regId = serverPush._regId;
        var type = 'apns';

        if (device.platform === "Android") {
            type = 'gcm';
        }

        APP.pubnub.push.removeChannels ({
            device: regId,
            pushGateway  : type,
            channels  :  [channelUUID],
            callback : function (status, response) {
                    if (status.error) {
                        ggError("UnProvision Data Channels Error; ", JSON.stringify(status.error));
                    } else {

                    }

            }
        });

       /* APP.pubnub.mobile_gw_provision ({
            device_id: regId,
            op    : 'remove',
            gw_type  : type,
            channel  :  channelUUID,
            callback : serverPush._successProvision,
            error  : serverPush._errorProvision
        });*/
    },

    setBadge: function(count) {
        serverPush.setApplicationIconBadgeNumber(function () {}, function () {mobileNotify("Error setting badge count....");}, count);
    },

    provisionDataChannels : function () {

        if (!serverPush._dataChannelsProvisioned) {

            if (APP.pubnub === undefined || APP.pubnub === null ) {
                ggError("Provision Push - Pubnub not initialized");
                return;
            }

            var type = 'apns';

            if (device.platform === "Android") {
                type = 'gcm';
            }

            var regId = serverPush._regId;
            var dataChannel = appDataChannel.channelUUID, userChannel = userDataChannel.channelUUID;


            APP.pubnub.push.addChannels ({
                device: regId,
                pushGateway  : type,
                channels  :  [userChannel, dataChannel],
                callback : function (status, response) {
                        if (status.error) {
                            ggError("Provision Data Channels Error; ", JSON.stringify(status.error));
                        } else {

                        }
                    }

            });

            /*APP.pubnub.mobile_gw_provision ({
                device_id: regId,
                op    : 'add',
                gw_type  : type,
                channel  :  dataChannel,
                callback : serverPush._successProvision,
                error  : serverPush._errorProvision
            });

            APP.pubnub.mobile_gw_provision ({
                device_id: regId,
                op    : 'add',
                gw_type  :type,
                channel  : userChannel,
                callback : serverPush._successProvision,
                error  : serverPush._errorProvision
            });
*/
            serverPush._dataChannelsProvisioned = true;

            //mobileNotify("pubnub push provisioned!!!");

        }
    },

    unprovisionDataChannels : function () {

        if (serverPush._dataChannelsProvisioned) {

            if (APP.pubnub === undefined || APP.pubnub === null ) {
                ggError("Provision Push - Pubnub not initialized");
                return;
            }

            var type = 'apns';

            if (device.platform === "Android") {
                type = 'gcm';
            }

            var regId = serverPush._regId;
            var dataChannel = appDataChannel.channelUUID, userChannel = userDataChannel.channelUUID;

            APP.pubnub.push.removeChannels ({
                device: regId,
                pushGateway  : type,
                channels  :  [userChannel, dataChannel],
                callback : function (status, response) {
                        if (status.error) {
                            ggError("Provision Data Channels Error; ", JSON.stringify(status.error));
                        } else {

                        }
                }
            });


            serverPush._dataChannelsProvisioned = false;


        }
    },

    _successProvision : function (data) {

    },

    _success : function (data) {
        ggError("Data channel server push enabled!");
    },

    _error : function (error) {
        if (error !== undefined)
            ggError("Pubnub Push Channel Error " + JSON.stringify(error));
    },

    _errorProvision : function (error) {
        if (error !== undefined)
            ggError("Pubnub Provision Error " + JSON.stringify(error));
    },

    _status : function(status) {
        if (status.error) {
            ggError("Pubnub Push Channel Error " + JSON.stringify(status));
        } else {

        }
    }

};