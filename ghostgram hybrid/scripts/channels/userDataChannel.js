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
    messagesDS :  new kendo.data.DataSource({
        offlineStorage: "privatemessages"
        }),

    init: function (channelId) {

        if (channelId !== undefined) {
            userDataChannel.channelId = channelId;

            var ts = localStorage.getItem('ggUserDataTimeStamp');
            if (ts !== undefined) {
                userDataChannel.lastAccess = parseInt(ts);

                // Was last access more than 24 hours ago -- if yes set it to 24 hours ago
                if (userDataChannel.lastAccess < ggTime.lastDay()) {
                    userDataChannel.lastAccess = ggTime.lastDay();
                    localStorage.setItem('ggUserDataTimeStamp', userDataChannel.lastAccess);
                }
            } else {
                // No lastAccess stored so set it to 24 hours
                userDataChannel.lastAccess = ggTime.lastDay();
                localStorage.setItem('ggUserDataTimeStamp', userDataChannel.lastAccess);
            }

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

        userDataChannel.messagesDS.online(false);
        userDataChannel.messagesDS.fetch();
        userDataChannel.history();
        userDataChannel.removeExpiredMessages();
    },

    updateTimeStamp : function () {
        userDataChannel.lastAccess = ggTime.currentTime();
        localStorage.setItem('ggUserDataTimeStamp', userDataChannel.lastAccess);
    },

    history : function () {

        var channelList = [], channelKeys = [];
        var timeStamp = ggTime.toPubNubTime(userDataChannel.lastAccess);

        // Get any messages in the channel
        APP.pubnub.history({
            channel: userDataChannel.channelId,
            end: timeStamp,
            error: userDataChannel.error,
            callback: function(messages) {
                messages = messages[0];
                messages = messages || [];
                var RSAKey = cryptico.privateKeyFromString(userModel.currentUser.privateKey);
                var latestTime = 0;
                for (var i = 0; i < messages.length; i++) {

                    var lastAccess = ggTime.toPubNubTime(userDataChannel.lastAccess);

                    var msg  =  messages[i];
                    if (msg.type === 'privateMessage') {

                        // Add the last 24 hours worth of messages to the private channel archive
                        if (msg.sender !== userModel.currentUser.userUUID) {
                            // if the sender isn't this user, update the channel list
                            channelList[msg.sender] = channelList[msg.sender]++;
                        }

                        var data = null;
                        var content = cryptico.decrypt(msg.content.cipher, RSAKey).plaintext;
                        if (msg.data !== undefined && msg.data !== null) {
                            data = cryptico.decrypt(msg.data.cipher, RSAKey).plaintext;
                            if (data !== undefined) {
                                data = JSON.parse(data);
                            } else {
                                data = {};
                            }
                        }

                        var parsedMsg = {
                            type: 'privateMessage',
                            msgID: msg.msgID,
                            channelId: msg.sender,   // Private channelId is just contacts UUID...
                            content: content,
                            data: data,
                            TTL: msg.ttl,
                            time: msg.time,
                            sender: msg.sender,
                            recipient: msg.recipient
                        };

                        userDataChannel.messagesDS.add(parsedMsg);

                    }
                }
                userDataChannel.messagesDS.sync();
                userDataChannel.updateTimeStamp();
                channelKeys = Object.keys(channelList);
                channelModel.updatePrivateChannels(channelKeys, channelList);
            }
        });


    },

    channelRead : function (m) {


        switch(m.type) {

            case 'privateMessage' : {
                userDataChannel.updateTimeStamp();

                privateChannel.receiveHandler(m);

            } break;


        }
    },


    removeExpiredMessages : function () {

        var yesterday = ggTime.lastDay();
        var dataSource = userDataChannel.messagesDS;
        var queryCache = dataSource.filter();
        if (queryCache === undefined) {
            queryCache = [];
        }
        dataSource.filter({ field: "time", operator: "lt", value:  yesterday});
        var messageList = dataSource.view();
        dataSource.filter(queryCache);
        if (messageList.length > 0) {
            for (var i=0; i< messageList.length; i++) {
                var msg = messageList[i];
                dataSource.remove(msg);
            }
        }
        dataSource.sync();

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


