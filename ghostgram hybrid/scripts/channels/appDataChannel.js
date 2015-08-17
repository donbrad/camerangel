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
        this.channelId = 'ghostgramsapp129195720';

        var ts = localStorage.getItem('ggAppDataTimeStamp');

        if (ts !== undefined)
            this.lastAccess = parseInt(ts);

        APP.pubnub.subscribe({
            channel: this.channelId,
            windowing: 50000,
            message: this.channelRead,
            connect: this.channelConnect,
            disconnect: this.channelDisconnect,
            reconnect:this.channelReconnect,
            error: this.channelError

        });

        // Load the appData message queue
        this.history();
    },

    updateTimeStamp : function () {
        this.lastAccess = new Date().getTime() * 10000000;
        localStorage.setItem('ggAppDataTimeStamp', this.lastAccess);
    },

    history : function () {

        if (this.lastAccess === 0) {
            // Get any messages in the channel
            APP.pubnub.history({
                channel: this.channelId,
                reverse: true,
                callback: function(messages) {
                    messages = messages[0];
                    messages = messages || [];
                    for (var i = 0; i < messages.length; i++) {
                        this.channelRead(messages[i]);
                    }

                }
            });
        } else {
            // Get any messages in the channel
            APP.pubnub.history({
                channel: this.channelId,
                start: this.lastAccess,
                reverse: true,
                callback: function(messages) {
                    messages = messages[0];
                    messages = messages || [];
                    for (var i = 0; i < messages.length; i++) {
                        this.channelRead(messages[i]);
                    }

                }
            });
        }

        this.updateTimeStamp();
    },

    channelRead : function (m) {

        this.updateTimeStamp();

        switch(m.type) {
            //  { type: 'newUser',  userId: <userUUID>,  phone: <phone>, email: <email>}
            // New user joined service -- enables users to update contact info
            case 'newUser' : {
                // Todo:  Scan contact list to see if this new user is a contact.   haven't seen userid so scan by phone.
                var contact = findContactByPhone(m.phone);
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
                var contact = findContactModel(m.userId);
                if (contact === undefined) {
                    contact = findContactByPhone(m.phone);
                }
                if (contact === undefined) {
                    return;
                }
                contact.set('contactUUID', m.userId);
                contact.set('contactEmail', m.email);
                contact.set('publicKey', m.publicKey);

                updateParseObject('contacts', 'uuid', contact.uuid, 'contactUUID', m.userId);
                updateParseObject('contacts', 'uuid', contact.uuid, 'contactEmail', m.email);
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
            channel: this.channelId,
            message: msg,
            success: this.channelSuccess,
            error: this.channelError
        });
    },

    userValidatedMessage : function (userUUID, phone, email, publicKey) {
        var msg = new Object();

        msg.type = 'userValidated';
        msg.userUUID = userUUID;
        msg.phone = phone;
        msg.email = email;
        msg.time = new Date().getTime();


        APP.pubnub.publish({
            channel: this.channelId,
            message: msg,
            success: this.channelSuccess,
            error: this.channelError
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