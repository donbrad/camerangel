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
                connect: function() {},
                disconnect: function() {},
                reconnect: function() {
                    mobileNotify("Data Channel Reconnected")
                },
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

                // Todo:  Does private channel exist?  If not create,  if so notify user of request
            } break;

            //  { type: 'channelInvite',  channelId: <channelUUID>, owner: <ownerUUID>}
            case 'channelInvite' : {
                // Todo:  Does c channel exist?  If not create,  if so notify user of request
            } break;

            //  { type: 'packageOffer',  channelId: <channelUUID>, owner: <ownerUUID>, packageId: <packageUUID>, private: true|false, type: 'text'|'pdf'|'image'|'video', title: <text>, message: <text>}
            case 'packageOffer' : {

            } break;

            //  { type: 'packageRequest',  channelId: <channelUUID>, owner: <ownerUUID>, packageId: <packageUUID>, private: true|false, message: <text>}
            case 'packageRequest' : {

            } break;


        }
    },

    channelSuccess : function (status) {

    },

    channelError : function (error) {
        mobileNotify('Channel Error : ' + error)
    }
};


