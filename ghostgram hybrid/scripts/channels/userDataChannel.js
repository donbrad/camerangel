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
                this.lastAccess = ts;

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
        this.lastAccess = new Date().getTime();
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

            //  { type: 'privateInvite',  channelId: <channelUUID>,  owner: <ownerUUID>, message: <text>, time: current time}
            case 'privateInvite' : {
                this.processPrivateInvite(m.ownerId, m.channelId, m.message);
            } break;

            //  { type: 'channelInvite',  channelId: <channelUUID>, owner: <ownerUUID>}
            case 'channelInvite' : {
                this.processGroupInvite(m.ownerId, m.channelId, m.message);
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
        msg.ownerId = APP.models.profile.currentUser.get('userUUID');
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

    groupChannelInvite : function (contactUUID, channelUUID, channelName,  message) {
        var msg = {};

        msg.type = 'groupInvite';
        msg.ownerId = APP.models.profile.currentUser.get('userUUID');
        msg.channelId = channelUUID;
        msg.channelName = channelName;
        msg.message  = message;
        msg.time = new Date().getTime();


        APP.pubnub.publish({
            channel: contactUUID,
            message: msg,
            success: this.channelSuccess,
            error: this.channelError
        });
    },

    processPrivateInvite: function (ownerId, channelId, message) {
        var channel = findChannelModel(channelId);

        if (channel === undefined) {
            // No existing private channel need to create one
            var contactModel = getContactModel(ownerId);
            if (contactModel !== undefined) {
                var contactAlias = contactModel.get('alias');
                addPrivateChannel(ownerId, contactAlias, channelId);
                mobileNotify("Created Private Chat with " + contactAlias);

            } else {
                mobileNotify("Null contact in processPrivateInvite!!");
            }

        }


    },

    processGroupInvite: function (ownerId, channelId, message) {
        // Todo:  Does channel exist?  If not create,  if so notify user of request
        var channel = findChannelModel(channelId);
        if (channel === undefined) {
            // Todo: create a channelMember object for this user
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


