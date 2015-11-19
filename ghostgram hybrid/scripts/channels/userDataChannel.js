/**
 * Created by donbrad on 8/10/15.
 * userDataChannel - handles all privateChat connect and requests
 *
 * !!! Must be included after pubnub and init must be called after pubnub is initialized
 */


'use strict';

var userDataChannel = {

    channelId: null,   // channelId is users uuid
    lastAccess: 0,   // last access time stamp
    timeStamp: 0,

    init: function (channelId) {

        if (channelId !== undefined) {
            userDataChannel.channelId = channelId;

            var ts = localStorage.getItem('ggUserDataTimeStamp');
            if (ts !== undefined)
                this.lastAccess = parseInt(ts);

            APP.pubnub.subscribe({
                channel: userDataChannel.channelId,
                windowing: 100,
                message: userDataChannel.channelRead,
                connect: userDataChannel.channelConnect,
                disconnect:userDataChannel.channelDisconnect,
                reconnect: userDataChannel.channelReconnect,
                error: userDataChannel.channelError

            });
        }

        userDataChannel.history();
    },

    updateTimeStamp : function () {
        userDataChannel.lastAccess = ggTime.currentTime();
        localStorage.setItem('ggUserDataTimeStamp', userDataChannel.lastAccess);
    },

    history : function () {

        var channelList = [], channelKeys = [];
        var timeStamp = ggTime.toPubNubTime(ggTime.lastDay());

 /*       if (userDataChannel.lastAccess === 0 || isNaN(userDataChannel.lastAccess)) {
            timeStamp = ggTime.toPubNubTime(timeStamp);
       } else {
            timeStamp = ggTime.toPubNubTime(userDataChannel.lastAccess - 86400);
        }
*/
        // Get any messages in the channel
        APP.pubnub.history({
            channel: userDataChannel.channelId,
            end: timeStamp,
            error: userDataChannel.error,
            callback: function(messages) {
                messages = messages[0];
                messages = messages || [];
                for (var i = 0; i < messages.length; i++) {

                    var lastAccess = ggTime.toPubNubTime(userDataChannel.lastAccess);

                    if ( messages[i].type === 'privateMessage') {

                        // Add the last 24 hours worth of messages to the private channel archive
                        if (messages[i].sender !== userModel.currentUser.userUUID) {
                            // if the sender isn't this user, update the channel list
                            channelList[messages[i].sender] = channelList[messages[i].sender]++;
                        }
                        channelModel.privateMessagesDS.add(messages[i]);

                    }
                }
                userDataChannel.updateTimeStamp();
                channelKeys = Object.keys(channelList);
                channelModel.updatePrivateChannels(channelKeys, channelList);
            }
        });


    },

    channelRead : function (m) {
        userDataChannel.updateTimeStamp();

        switch(m.type) {

          /*  //  { type: 'privateInvite',  channelId: <channelUUID>,  owner: <ownerUUID>, message: <text>, time: current time}
            case 'privateInvite' : {
                this.processPrivateInvite(m.ownerId, m.ownerPublicKey,  m.channelId, m.message);
            } break;

            case 'privateDelete' : {
                this.processPrivateDelete(m.ownerId, m.channelId, m.message);
            } break;*/



            case 'privateMessage' : {
                //Add the message to the privateChannel data source.
                channelModel.privateMessagesDS.add(m);
                // Is this private channel active?
                if (channelView._channelId == m.sender) {
                    //Its the active channel, receive the message
                    privateChannel.receiveHandler(m);
                }

            } break;


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


