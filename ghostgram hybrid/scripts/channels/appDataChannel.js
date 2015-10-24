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

    init: function () {

        // Generate a unique channel name for the app data channel that is recognizable to related userDataChannel
        // replacing - with _ should achive this...
        var channel = userModel.currentUser.userUUID.replace(/-/g,'_');

        appDataChannel.channelId = channel;

        var ts = localStorage.getItem('ggAppDataTimeStamp');

        if (ts !== undefined)
            appDataChannel.lastAccess = parseInt(ts);

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
        channelModel.updateChannelsMessageCount();
    },

    updateTimeStamp : function () {
        appDataChannel.lastAccess = ggTime.currentPubNubTime();
        localStorage.setItem('ggAppDataTimeStamp', appDataChannel.lastAccess);
    },

    getContactAppChannel : function (channelId) {
        return(channelId.replace(/-/g,'_'));
    },

    history : function () {
        // Just look back 7 days -- can expand or shorten this window.

        var timeStamp = ggTime.toPubNubTime(ggTime.lastWeek());
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
                userDataChannel.processGroupInvite( m.ownerName,  m.channelId, m.channelName);
            } break;

            //  { type: 'channelInvite',  channelId: <channelUUID>, owner: <ownerUUID>}
            case 'groupDelete' : {
                userDataChannel.processGroupDelete(m.ownerName, m.channelId, m.channelName);
            } break;

            case 'groupUpdate' : {
                userDataChannel.processGroupUpdate(m.ownerName, m.channelId, m.channelName);
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


    groupChannelInvite : function (contactUUID, channelUUID, channelName, channelDescription, durationDays,  message) {
        var msg = {};

        msg.type = 'groupInvite';
        msg.ownerId = userModel.currentUser.get('userUUID');
        msg.ownerName = userModel.currentUser.get('name');
        msg.channelId = channelUUID;
        msg.channelName = channelName;
        msg.channelDescription = channelDescription;
        msg.durationDays = durationDays;
        msg.message  = message;
        msg.time = new Date().getTime();

        var channel = appDataChannel.getContactAppChannel(contactUUID);

        APP.pubnub.publish({
            channel: channel,
            message: msg,
            callback: userDataChannel.publishCallback,
            error: userDataChannel.errorCallback,
        });
    },

    groupChannelDelete : function (contactUUID, channelUUID, channelName, message) {
        var msg = {};

        msg.type = 'groupDelete';
        msg.ownerId = userModel.currentUser.get('userUUID');
        msg.ownerName = userModel.currentUser.get('name');
        msg.channelId = channelUUID;
        msg.channelName = channelName;
        msg.message  = message;
        msg.time = new Date().getTime();

        var channel = appDataChannel.getContactAppChannel(contactUUID);



        APP.pubnub.publish({
            channel: channel,
            message: msg,
            callback: userDataChannel.publishCallback,
            error: userDataChannel.errorCallback

        });
    },

    groupChannelUpdate : function (contactUUID, channelUUID, channelName, message) {
        var msg = {};

        msg.type = 'groupUpdate';
        msg.ownerId = userModel.currentUser.get('userUUID');
        msg.ownerName = userModel.currentUser.get('name');
        msg.channelId = channelUUID;
        msg.channelName = channelName;
        msg.message  = message;
        msg.time = new Date().getTime();

        var channel = appDataChannel.getContactAppChannel(contactUUID);


        APP.pubnub.publish({
            channel: channel,
            message: msg,
            callback: userDataChannel.publishCallback,
            error: userDataChannel.errorCallback

        });
    },

    /* // This could be an initial request or a follow up to delete current channel
     // and create a new one -- effectively orphaning / deleting the data in the channel
     processPrivateInvite: function (ownerId, ownerPublicKey, channelId, message) {
     // Can be only one private channel per user -- need to lookup channel by ownerId
     var privateChannel = channelModel.findPrivateChannel(ownerId);
     var deleteFlag = false;

     // The private channel requester needs to be in the user's contact list...
     var contact = contactModel.findContact(ownerId);

     //mobileNotify("Private Chat Request from " + contact.get('name') + '\n ' + message);


     if (privateChannel !== undefined) {
     // Theres already a private channel for this user -- need to delete it
     if (privateChannel.channelId === channelId) {
     // Invite is trying to create a channel with same channelId -- just ignore this request
     mobileNotify("Private Chat Request from " + contact.get('name'));
     return;
     }
     deleteFlag = true;
     channelModel.deleteChannel(privateChannel.channelId, true);
     //deleteParseObject('channels', 'channelId', privateChannel.channelId);
     }


     if (contact !== undefined) {
     var contactAlias = contact.get('alias');
     channelModel.addPrivateChannel(ownerId, ownerPublicKey, contactAlias, channelId);
     if (deleteFlag) {
     mobileNotify("Updated Private Chat with " + contactAlias);
     } else {
     notificationModel.addNewPrivateChatNotification(channelId, "Private: " + contactAlias);
     }

     //mobileNotify("Created Private Chat with " + contactAlias);

     } else {
     mobileNotify("Null contact in processPrivateInvite!!");
     }



     },

     processPrivateDelete: function (ownerId, channelId, memberId,  message) {
     var channel = channelModel.findChannelModel(channelId),
     privateChannel = channelModel.findPrivateChannel(ownerId);
     var contact = contactModel.findContact(ownerId);

     if (channel === undefined) {
     // mobileNotify("Private Chat Delete Request from " + contact.get('name'));
     notificationModel.deletePrivateChatNotification(channelId,"Private Chat: " + contact.alias);
     channelModel.deleteChannel(channel);
     }

     },

     */

    processGroupInvite: function (ownerName, channelId, channelName, channelDescription, durationDays, message) {
        // Todo:  Does channel exist?  If not create,  if so notify user of request
        var channel = channelModel.findChannelModel(channelId);

        if (channel === undefined) {
            mobileNotify("Chat invite from  " + ownerName + ' " ' + channelName + '"');
            notificationModel.addNewChatNotification(channelId, channelName, channelDescription);
        }

        // Per discussion with ray -- sync all parse channels to have only entry point to sync member channels
        channelModel.syncParseChannels();



    },

    processGroupDelete: function (ownerName, channelId, channelName) {
        // Todo:  Does channel exist?  If not do nothing,  if so delete the channel
        var channel = channelModel.findChannelModel(channelId);
        if (channel === undefined) {
            // Todo: create a channelMember object for this user
            mobileNotify('Owner has deleted Chat: "' + channelName + '"');
            channelModel.deleteChannel(channel);
        }

    },

    processGroupUpdate: function (ownerName, channelId, channelName) {

        var channel = channelModel.findChannelModel(channelId);
        if (channel !== undefined) {

        }

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