/**
 * Created by donbrad on 8/10/15.
 * userDataChannel - handles all communication of user specific information
 * eg: invites, invite responses, offers, archive requests,  channel_clear, channel_delete,
 *
 * !!! Must be included after pubnub and init must be called after pubnub is initialized
 */


'use strict';

var userDataChannel = {

    channelId: '',   // channelId is users uuid
    lastAccess: 0,   // last access time stamp

    init: function (channelId) {
        if (channelId !== undefined) {
            this.channelId = channelId;

            var ts = localStorage.getItem('ggUserDataTimeStamp');
            if (ts !== undefined)
                this.lastAccess = parseInt(ts);

            APP.pubnub.subscribe({
                channel: this.channelId,
                windowing: 50000,
                message: this.channelRead,
                connect: this.channelConnect,
                disconnect:this.channelDisconnect,
                reconnect: this.channelReconnect,
                error: this.channelError

            });
        }

        this.history();
    },

    updateTimeStamp : function () {
        this.lastAccess = ggTime.currentPubNubTime();
        localStorage.setItem('ggUserDataTimeStamp', this.lastAccess);
    },

    history : function () {

        if (this.lastAccess === 0 || isNaN(this.lastAccess)) {
            // Get any messages in the channel
            APP.pubnub.history({
                channel: this.channelId,
                reverse: true,
                callback: function(messages) {
                    messages = messages[0];
                    messages = messages || [];
                    for (var i = 0; i < messages.length; i++) {
                        userDataChannel.channelRead(messages[i]);
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
                        if (messages[i].time >= userDataChannel.lastAccess)
                            userDataChannel.channelRead(messages[i]);
                    }

                }
            });
        }


        this.updateTimeStamp();
    },

    channelRead : function (m) {
        this.updateTimeStamp();

        switch(m.type) {

            //  { type: 'privateInvite',  channelId: <channelUUID>,  owner: <ownerUUID>, message: <text>, time: current time}
            case 'privateInvite' : {
                this.processPrivateInvite(m.ownerId, m.ownerPublicKey,  m.channelId, m.message);
            } break;

            case 'privateDelete' : {
                this.processPrivateDelete(m.ownerId, m.channelId, m.message);
            } break;

            //  { type: 'channelInvite',  channelId: <channelUUID>, ownerID: <ownerUUID>,  ownerName: <text>, channelName: <text>, channelDescription: <text>}
            case 'channelInvite' : {
                this.processGroupInvite(m.ownerId, m.ownerName,  m.channelId, m.channelName, m.channelDescription, m.durationDays,  m.message);
            } break;

            //  { type: 'channelInvite',  channelId: <channelUUID>, owner: <ownerUUID>}
            case 'channelDelete' : {
                this.processGroupDelete(m.ownerId, m.channelId, m.message);
            } break;

            //  { type: 'packageOffer',  channelId: <channelUUID>, owner: <ownerUUID>, packageId: <packageUUID>, private: true|false, type: 'text'|'pdf'|'image'|'video', title: <text>, message: <text>}
            case 'packageOffer' : {

            } break;

            //  { type: 'packageRequest',  channelId: <channelUUID>, owner: <ownerUUID>, packageId: <packageUUID>, private: true|false, message: <text>}
            case 'packageRequest' : {

            } break;


        }
    },

    privateChannelInvite : function (contactUUID, channelUUID, message) {
        var msg = {};

        msg.type = 'privateInvite';
        msg.ownerId = userModel.currentUser.get('userUUID');
        msg.ownerPublicKey = userModel.currentUser.get('publicKey');
        msg.channelId = channelUUID;
        msg.message  = message;
        msg.time = new Date().getTime();


        APP.pubnub.publish({
            channel: contactUUID,
            message: msg,
            callback: userDataChannel.publishCallback,
            error: userDataChannel.errorCallback
        });
    },

    privateChannelDelete : function (contactUUID, channelUUID, message) {
        var msg = {};

        msg.type = 'privateDelete';
        msg.ownerId = userModel.currentUser.get('userUUID');
        msg.ownerPublicKey = userModel.currentUser.get('publicKey');
        msg.channelId = channelUUID;
        msg.message  = message;
        msg.time = new Date().getTime();


        APP.pubnub.publish({
            channel: contactUUID,
            message: msg,
            callback: userDataChannel.publishCallback,
            error: userDataChannel.errorCallback
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


        APP.pubnub.publish({
            channel: contactUUID,
            message: msg,
            callback: userDataChannel.publishCallback,
            error: userDataChannel.errorCallback,
        });
    },

    groupChannelDelete : function (contactUUID, channelUUID, message) {
        var msg = {};

        msg.type = 'groupDelete';
        msg.ownerId = userModel.currentUser.get('userUUID');
        msg.ownerName = userModel.currentUser.get('name');
        msg.channelId = channelUUID;
        msg.message  = message;
        msg.time = new Date().getTime();


        APP.pubnub.publish({
            channel: contactUUID,
            message: msg,
            callback: userDataChannel.publishCallback,
            error: userDataChannel.errorCallback

        });
    },

    // This could be an initial request or a follow up to delete current channel
    // and create a new one -- effectively orphaning / deleting the data in the channel
    processPrivateInvite: function (ownerId, ownerPublicKey, channelId, message) {
        // Can be only one private channel per user -- need to lookup channel by ownerId
        var privateChannel = channelModel.findPrivateChannel(ownerId);
        var deleteFlag = false;

        // The private channel requester needs to be in the user's contact list...
        var contact = contactModel.getContactModel(ownerId);

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
        var contact = contactModel.getContactModel(ownerId);

        if (channel === undefined) {
           // mobileNotify("Private Chat Delete Request from " + contact.get('name'));
            notificationModel.deletePrivateChatNotification(channelId,"Private Chat: " + contact.alias);
            channelModel.deleteChannel(channel);
        }

    },

    processGroupInvite: function (ownerId, ownerName, channelId, channelName, channelDescription, durationDays, message) {
        // Todo:  Does channel exist?  If not create,  if so notify user of request
        var channel = channelModel.findChannelModel(channelId);

        if (channel === undefined) {
            mobileNotify("Chat invite from  " + ownerName + ' " ' + channelName + '"');

            channelModel.addChannel(channelName, channelDescription, false, durationDays,  channelId, ownerId, ownerName );
            notificationModel.addNewChatNotification(channelId, channelName, channelDescription);
        }

    },

    processGroupDelete: function (ownerId, channelId, memberId, message) {
        // Todo:  Does channel exist?  If not do nothing,  if so delete the channel
        var channel = channelModel.findChannelModel(channelId);
        if (channel === undefined) {
            // Todo: create a channelMember object for this user
            mobileNotify('Owner has deleted Chat: "' + channelId + '"');
            channelModel.deleteChannel(channel);
        }

    },

    publishCallback : function (m) {
        if (m === undefined)
            return;

        var status = m[0], message = m[1], time = m[2];

        if (status !== 1) {
            mobileNotify('Error publishing invite: ' + message);
        }

    },

    errorCallback : function (error) {
        mobileNotify('UserDataChannel Error : ' + error);
    },

    channelConnect: function () {

    },

    channelDisconnect: function () {
        mobileNotify("Data Channel Disconnected");
    },

    channelReconnect: function () {
        mobileNotify("Data Channel Reconnected");
    },

    channelSuccess : function (status) {

    },

    channelError : function (error) {
        mobileNotify('Data Channel Error : ' + error)
    }
};


