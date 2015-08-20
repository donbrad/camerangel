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

        if (this.lastAccess === 0) {
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
                this.processGroupInvite(m.ownerId, m.ownerName,  m.channelId, m.channelName, m.channelDescription,  m.message);
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
            success: this.channelSuccess,
            error: this.channelError
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
            success: this.channelSuccess,
            error: this.channelError
        });
    },

    groupChannelInvite : function (contactUUID, channelUUID, channelName, channelDescription,  message) {
        var msg = {};

        msg.type = 'groupInvite';
        msg.ownerId = userModel.currentUser.get('userUUID');
        msg.ownerName = userModel.currentUser.get('name');
        msg.channelId = channelUUID;
        msg.channelName = channelName;
        msg.channelDescription = channelDescription;
        msg.message  = message;
        msg.time = new Date().getTime();


        APP.pubnub.publish({
            channel: contactUUID,
            message: msg,
            success: this.channelSuccess,
            error: this.channelError
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
            success: this.channelSuccess,
            error: this.channelError
        });
    },

    processPrivateInvite: function (ownerId, ownerPublicKey, channelId, message) {
        var channel = channelModel.findChannelModel(channelId),
            privateChannel = channelModel.findPrivateChannel(ownerId);
        var contact = contactModel.getContactModel(ownerId);

        mobileNotify("Private Chat Request from " + contact.get('name') + '\n ' + message);


        if (channel === undefined && privateChannel === undefined) {
            // No existing private channel need to create one

            if (contact !== undefined) {
                var contactAlias = contact.get('alias');
                channelModel.addPrivateChannel(ownerId, ownerPublicKey, contactAlias, channelId);
                mobileNotify("Created Private Chat with " + contactAlias);

            } else {
                mobileNotify("Null contact in processPrivateInvite!!");
            }

        }

    },

    processPrivateDelete: function (ownerId, channelId, memberId,  message) {
        var channel = channelModel.findChannelModel(channelId),
            privateChannel = channelModel.findPrivateChannel(ownerId);
        var contact = contactModel.getContactModel(ownerId);

        if (channel === undefined) {

            mobileNotify("Private Chat Delete Request from " + contact.get('name'));
            channelModel.deleteChannel(channel);
        }

    },

    processGroupInvite: function (ownerId, ownerName, channelId, channelName, channelDescription, message) {
        // Todo:  Does channel exist?  If not create,  if so notify user of request
        var channel = channelModel.findChannelModel(channelId);

        if (channel === undefined) {
            mobileNotify("Chat invite from  " + ownerName + ' " ' + channelName + '"');

            channelModel.addChannel(channelName, channelDescription, false, channelId, ownerId, ownerName );
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


