/**
 * Created by donbrad on 8/10/15.
 * appDataChannel - handles all communication app level communication
 *
 * !!! Must be included after pubnub and init must be called after pubnub is initialized
 */


'use strict';

var appDataChannel = {


    channelId: 'ghostgramsapp129195720',   // current app channel
    lastAccess: 0,   // last access time stamp

    init: function () {
        appDataChannel.channelId = 'ghostgramsapp129195720';

        var ts = localStorage.getItem('ggAppDataTimeStamp');

        if (ts !== undefined)
            appDataChannel.lastAccess = parseInt(ts);

        APP.pubnub.subscribe({
            channel: appDataChannel.channelId,
            windowing: 50000,
            message: appDataChannel.channelRead,
            connect: appDataChannel.channelConnect,
            disconnect: appDataChannel.channelDisconnect,
            reconnect:appDataChannel.channelReconnect,
            error: appDataChannel.channelError

        });

        // Load the appData message queue
        this.history();
        channelModel.updateChannelsMessageCount();
    },

    updateTimeStamp : function () {
        appDataChannel.lastAccess = ggTime.currentPubNubTime();
        localStorage.setItem('ggAppDataTimeStamp', appDataChannel.lastAccess);
    },

    history : function () {

        if (appDataChannel.lastAccess === 0 || isNaN(appDataChannel.lastAccess)) {
            // Get any messages in the channel
            APP.pubnub.history({
                channel: appDataChannel.channelId,
                reverse: true,
                callback: function(messages) {
                    messages = messages[0];
                    messages = messages || [];
                    for (var i = 0; i < messages.length; i++) {
                        appDataChannel.channelRead(messages[i]);
                    }

                }
            });
        } else {
            // Get any messages in the channel
            APP.pubnub.history({
                channel: appDataChannel.channelId,
                start: appDataChannel.lastAccess,
                reverse: true,
                callback: function(messages) {
                    messages = messages[0];
                    messages = messages || [];
                    for (var i = 0; i < messages.length; i++) {
                        appDataChannel.channelRead(messages[i]);
                    }

                }
            });
        }

        appDataChannel.updateTimeStamp();
    },

    channelRead : function (m) {

        appDataChannel.updateTimeStamp();

        switch(m.type) {
            //  { type: 'newUser',  userId: <userUUID>,  phone: <phone>, email: <email>}
            // New user joined service -- enables users to update contact info
            case 'newUser' : {
                // Todo:  Scan contact list to see if this new user is a contact.   haven't seen userid so scan by phone.
                var contact = contactModel.findContactByPhone(m.phone);
                if (contact !== undefined) {
                    contact.set('contactUUID', m.userId);
                    contact.set('contactEmail', m.email);
                    updateParseObject('contacts', 'uuid', contact.uuid, 'contactUUID', m.userId);
                    updateParseObject('contacts', 'uuid', contact.uuid, 'contactEmail', m.email);
                }
            } break;

            //  { type: 'userValidated',  userId: <userUUID>,  phone: <phone>, email: <email>, publicKey: <publicKey>}
            // User has validated phone and email -- enables users to update contact info and get private key for P2P and Secure Package
            case 'userValidated' : {
                // Todo: Scan contact list for useruuid and then by phone.
                var contact = contactModel.getContactModel(m.userId);
                if (contact === undefined) {
                    contact = contactModel.findContactByPhone(m.phone);
                }
                if (contact === undefined) {
                    return;
                }
                contact.set('contactUUID', m.userId);
                contact.set('contactPhone', m.phone);
                contact.set('contactEmail', m.email);
                contact.set('publicKey', m.publicKey);

                updateParseObject('contacts', 'uuid', contact.uuid, 'contactUUID', m.userId);
                updateParseObject('contacts', 'uuid', contact.uuid, 'contactEmail', m.email);
                updateParseObject('contacts', 'uuid', contact.uuid, 'contactPhone', m.phone);
                updateParseObject('contacts', 'uuid', contact.uuid, 'publicKey', m.publicKey);
            } break;


            //  { type: 'userBlock',  userID: <userUUID>,  phone: <phone>, email: <email>}
            case 'userBlock' : {
                // Todo:  user has violated terms of service or is spamming.  notify all contacts
            } break;


            //  { type: 'appInfo',  level: 'info'|'update'|issue', id: <id>  message: <text>, url: <url>}
            case 'appInfo' : {

            } break;
        }

    },

    newUserMessage : function (userUUID, phone, email) {
        var msg = {};

        msg.type = 'newUser';
        msg.userUUID = userUUID;
        msg.phone = phone;
        msg.email = email;
        msg.time = new Date().getTime();


        APP.pubnub.publish({
            channel: appDataChannel.channelId,
            message: msg,
            success: appDataChannel.channelSuccess,
            error: appDataChannel.channelError
        });
    },

    userValidatedMessage : function (userUUID, phone, email, publicKey) {
        var msg = new Object();

        msg.type = 'userValidated';
        msg.userUUID = userUUID;
        msg.phone = phone;
        msg.email = email;
        msg.publicKey = publicKey;
        msg.time = new Date().getTime();


        APP.pubnub.publish({
            channel: appDataChannel.channelId,
            message: msg,
            success: appDataChannel.channelSuccess,
            error: appDataChannel.channelError
        });
    },

    channelConnect: function () {

    },

    channelDisconnect: function () {
        mobileNotify("App Data Channel Disconnected");
    },

    channelReconnect: function () {
        mobileNotify("App Data Channel Reconnected");
    },

    channelSuccess : function (status) {

    },

    channelError : function (error) {
        mobileNotify('App Channel Error : ' + error)
    }
};