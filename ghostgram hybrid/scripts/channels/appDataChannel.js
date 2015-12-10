/**
 * Created by donbrad on 8/10/15.
 * appDataChannel - handles all notifications and updates
 *
 * !!! Must be included after pubnub and init must be called after pubnub is initialized
 */


'use strict';

var appDataChannel = {


    channelId: '',   // current app channel
    lastAccess: 0,   // last access time stamp
    _channelName: 'app',
    _version: 1,

    init: function () {

        // Generate a unique channel name for the app data channel that is recognizable to related userDataChannel
        // replacing - with _ should achive this...
        var channel = userModel.currentUser.userUUID.replace(/-/g,'_');

        appDataChannel.channelId = channel;

        var ts = localStorage.getItem('appDataChannel');

        if (ts !== undefined) {
            appDataChannel.lastAccess = parseInt(ts);
            // Was last access more than a month ago -- if yes set it to a month ago
            if (appDataChannel.lastAccess < ggTime.lastMonth()) {
                appDataChannel.lastAccess = ggTime.lastMonth();
                localStorage.setItem('appDataChannel', appDataChannel.lastAccess);
            }
        } else {
            appDataChannel.lastAccess = ggTime.lastMonth();
            localStorage.setItem('appDataChannel', appDataChannel.lastAccess);
        }


        APP.pubnub.subscribe({
            channel: appDataChannel.channelId,
            windowing: 500,
            message: appDataChannel.channelRead,
            connect: appDataChannel.channelConnect,
            disconnect: appDataChannel.channelDisconnect,
            reconnect:appDataChannel.channelReconnect,
            error: appDataChannel.channelError

        });

        // Load the appData message queue
        appDataChannel.history();
    },

    updateTimeStamp : function () {
        appDataChannel.lastAccess = ggTime.currentTime();
        localStorage.setItem('ggAppDataTimeStamp', appDataChannel.lastAccess);
    },

    getContactAppChannel : function (channelId) {
        return(channelId.replace(/-/g,'_'));
    },

    history : function () {
        // Just look back 7 days -- can expand or shorten this window.

        var timeStamp = ggTime.toPubNubTime(appDataChannel.lastAccess);
        // Get any messages in the channel

        APP.pubnub.history({
            channel: appDataChannel.channelId,
            start: timeStamp,
            reverse: true,
            callback: function(messages) {
                messages = messages[0];
                messages = messages || [];
                for (var i = 0; i < messages.length; i++) {
                    appDataChannel.channelRead(messages[i]);
                }

            }
        });

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
                var contact = contactModel.findContact(m.userId);
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

            //  { type: 'channelInvite',  channelId: <channelUUID>, ownerID: <ownerUUID>,  ownerName: <text>, channelName: <text>, channelDescription: <text>}
            case 'groupInvite' : {
                if (m.version === appDataChannel._version)
                    appDataChannel.processGroupInvite( m.channelId, m.channelName, m.channelDescription,  m.channelMembers, m.ownerId, m.ownerName,  m.options);
            } break;

            //  { type: 'channelInvite',  channelId: <channelUUID>, owner: <ownerUUID>}
            case 'groupDelete' : {
                if (m.version === appDataChannel._version)
                    appDataChannel.processGroupDelete(m.channelId, m.channelName, m.ownerId, m.ownerName);
            } break;

            case 'groupUpdate' : {
                if (m.version === appDataChannel._version)
                    appDataChannel.processGroupUpdate(m.channelId, m.channelName, m.channelDescription, m.channelMembers, m.ownerId, m.ownerName);
            } break;


            case 'placeAdd' : {
                appDataChannel.processPlaceAdd(m.placeId, m.placeName, m.ownerId,  m.ownerName);
            } break;



            //  { type: 'connectRequest',  contactId: <contactUUID>, owner: <ownerUUID>}
            case 'connectRequest' : {

            } break;

            //  { type: 'connectResponse',  contactId: <contactUUID>, owner: <ownerUUID>. accepted: true|false}
            case 'connectResponse' : {

            } break;

            //  { type: 'packageOffer',  channelId: <channelUUID>, owner: <ownerUUID>, packageId: <packageUUID>, private: true|false, type: 'text'|'pdf'|'image'|'video', title: <text>, message: <text>}
            case 'packageOffer' : {

            } break;

            //  { type: 'packageRequest',  channelId: <channelUUID>, owner: <ownerUUID>, packageId: <packageUUID>, private: true|false, message: <text>}
            case 'packageRequest' : {

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
        msg.version = appDataChannel._version;
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
        msg.version = appDataChannel._version;
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


    groupChannelInvite : function (contactUUID, channelUUID, channelName, channelDescription,  members, options) {
        var msg = {};

        var notificationString = "Chat Invite : " + channelName;
        msg.type = 'groupInvite';
        msg.version = appDataChannel._version;
        msg.ownerId = userModel.currentUser.get('userUUID');
        msg.ownerName = userModel.currentUser.get('name');
        msg.channelId = channelUUID;
        msg.channelName = channelName;
        msg.channelDescription = channelDescription;
        msg.channelMembers = members;
        msg.message  = "You've been invited to " + channelName;
        if (options === undefined) {
            options = null;
        }
        msg.options = options;

        msg.time = new Date().getTime();
        msg.pn_apns = {
            aps: {
                alert : notificationString,
                badge: 1,
                'content-available' : 1
            },
            isMessage: false,
            target: '#channel?channelId=' + channelUUID,
            channelId :channelUUID
        };
        msg.pn_gcm = {
            data : {
                title: notificationString,
                message: "You've been invited to " + channelName,
                target: '#channel?channelId=' + channelUUID,
                image: "icon",
                isMessage: false,
                channelId : channelUUID
            }
        };

        var channel = appDataChannel.getContactAppChannel(contactUUID);

        APP.pubnub.publish({
            channel: channel,
            message: msg,
            callback: appDataChannel.publishCallback,
            error: appDataChannel.errorCallback
        });
    },

    groupChannelDelete : function (contactUUID, channelUUID, channelName, message) {
        var msg = {};

        var notificationString = channelName + " has been deleted...";
        msg.type = 'groupDelete';
        msg.version = appDataChannel._version;
        msg.ownerId = userModel.currentUser.get('userUUID');
        msg.ownerName = userModel.currentUser.get('name');
        msg.channelId = channelUUID;
        msg.channelName = channelName;
        msg.message  = message;
        msg.time = new Date().getTime();
        msg.pn_apns = {
            aps: {
                alert : notificationString,
                badge: 1
            },
            isMessage: false,
            target: '#channels',
            channelId :channelUUID
        };
        msg.pn_gcm = {
            data : {
                title: notificationString,
                message: "The owner has deleted : " + channelName,
                target: "#channels",
                image: "icon",
                isMessage: false,
                channelId : channelUUID
            }
        };

        var channel = appDataChannel.getContactAppChannel(contactUUID);

        APP.pubnub.publish({
            channel: channel,
            message: msg,
            callback: appDataChannel.publishCallback,
            error: appDataChannel.errorCallback

        });
    },

    groupChannelUpdate : function (contactUUID, channelUUID, channelName, channelDescription,  members) {
        var msg = {};

        var notificationString = "Chat Update : " + channelName;
        msg.type = 'groupUpdate';
        msg.version = appDataChannel._version;
        msg.ownerId = userModel.currentUser.get('userUUID');
        msg.ownerName = userModel.currentUser.get('name');
        msg.channelId = channelUUID;
        msg.channelName = channelName;
        msg.channelDescription = channelDescription;
        msg.channelMembers = members;
        msg.message  = "Chat " + channelName + " has been updated...";
        msg.time = new Date().getTime();
        msg.time = new Date().getTime();
        msg.pn_apns = {
            aps: {
                alert : notificationString,
                badge: 1,
                'content-available' : 1
            },
            isMessage: false,
            target: '#channel?channelId=' + channelUUID,
            channelId :channelUUID
        };
        msg.pn_gcm = {
            data : {
                title: notificationString,
                message: "Owner has updated  " + channelName,
                target: '#channel?channelId=' + channelUUID,
                image: "icon",
                isMessage: false,
                channelId : channelUUID
            }
        };
        var channel = appDataChannel.getContactAppChannel(contactUUID);

        APP.pubnub.publish({
            channel: channel,
            message: msg,
            callback: appDataChannel.publishCallback,
            error: appDataChannel.errorCallback

        });
    },


    processGroupInvite: function (channelId, channelName, channelDescription, channelMembers, ownerId, ownerName, options) {
        // Todo:  Does channel exist?  If not create,  if so notify user of request
        var channel = channelModel.findChannelModel(channelId);

        if (channel === undefined && channelMembers !== undefined && typeof (channelMembers) === 'array') {
            mobileNotify("Chat invite from  " + ownerName + ' " ' + channelName + '"');

            channelModel.addMemberChannel(channelId, channelName, channelDescription, channelMembers, ownerId, ownerName, options);
            //notificationModel.addNewChatNotification(channelId, channelName, "new channel...");

        }

    },

    processGroupDelete: function (channelId, channelName, ownerId, ownerName) {
        // Todo:  Does channel exist?  If not do nothing,  if so delete the channel
        var channel = channelModel.findChannelModel(channelId);
        if (channel === undefined) {
            mobileNotify('Owner has deleted Chat: "' + channelName + '"');
            channelModel.deleteChannel(channel);
        }

    },

    processGroupUpdate: function (channelId, channelName, channelDescription, channelMembers, ownerId, ownerName) {

        if (channelMembers !== undefined && channelMembers !== null && channelMembers.length > 0)
            channelModel.updateChannel(channelId, channelName, channelDescription, channelMembers);

    },


    publishCallback : function (m) {
        if (m === undefined)
            return;

        var status = m[0], message = m[1], time = m[2];

        if (status !== 1) {
            mobileNotify('appDataChannel: Error publishing invite: ' + message);
        }

    },

    errorCallback : function (error) {
        mobileNotify('appDataChannel Error : ' + error);
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
        mobileNotify('appDataChannel Error : ' + error)
    }
};