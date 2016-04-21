/**
 * Created by donbrad on 8/10/15.
 * userDataChannel - handles all privateChat connect and requests
 *
 * !!! Must be included after pubnub and init must be called after pubnub is initialized
 */


'use strict';

var userDataChannel = {

    channelUUID: null,   // channelUUID is users uuid
    lastAccess: 0,   // last access time stamp
    messagesDS : null,
    _cloudClass : 'privatemessages',
    RSAKey : null,
    

    init: function (channelUUID) {

        userDataChannel.messagesDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'privatemessages',
                dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            }
        });

        if (channelUUID !== undefined) {
            userDataChannel.channelUUID = channelUUID;

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
                channel: userDataChannel.channelUUID,
                windowing: 100,
                message: userDataChannel.channelRead,
                connect: userDataChannel.channelConnect,
                disconnect:userDataChannel.channelDisconnect,
                reconnect: userDataChannel.channelReconnect,
                error: userDataChannel.channelError

            });
        }

       /* userDataChannel.messagesDS.online(false);*/
        userDataChannel.messagesDS.fetch();
       // userDataChannel.history();
        //userDataChannel.removeExpiredMessages();
        userDataChannel.expireMessages = setInterval(function(){  userDataChannel.removeExpiredMessages(); }, 60000);

    },

    closeChannel : function () {
        APP.pubnub.unsubscribe({
            channel: userDataChannel.channelUUID
        });
    },
    
    queryMessages : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = userDataChannel.messagesDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);
    },

    isDuplicateMessage : function (msgID) {
        var messages = userDataChannel.queryMessages({ field: "msgID", operator: "eq", value: msgID });

        if (messages === undefined) {
            return (false);
        } else if (messages.length === 0) {
            return (false);
        } else {
            return(true);
        }
    },

    addMessage : function (message) {
        if (message.Id === undefined) {
            message.Id = message.msgID;
        }
        var publicKey = userModel._user.publicKey;
        var encryptContent = cryptico.encrypt(message.content, publicKey);
        message.content = encryptContent;

       
        var encryptData = cryptico.encrypt(JSON.stringify(message.data), publicKey);
        message.data = encryptData;
        
        userDataChannel.messagesDS.add(message);
        everlive.createOne(userDataChannel._cloudClass, message, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating private message " + JSON.stringify(error));
                debugger;
            }
        });
    },

    updateTimeStamp : function () {
        userDataChannel.lastAccess = ggTime.currentTime();
        localStorage.setItem('ggUserDataTimeStamp', userDataChannel.lastAccess);
    },

    // Iterative function to get all messages in the user data channel for the last 24 hours
    // Note: pubnubs api will only return a max of 100 messsges so need to iterate until
    // we have full 24 hours for all contactc
    _fetchHistory : function (timeStamp) {

        var start = ggTime.toPubNubTime(ggTime.lastDay());    // Need to fetch the last 24 hours of private messages

        // Get any messages in the channel
        APP.pubnub.history({
            channel: userDataChannel.channelUUID,
            start: start.toString(),
            end: timeStamp,
            error: userDataChannel.error,
            callback: function(messages) {
                messages = messages[0];
                var start = messages[1], end = messages[2];
                messages = messages || [];
                if (messages.length === 0) {
                    userDataChannel.messagesDS.sync();
                    userDataChannel.updateTimeStamp();
                    return;
                }
                if (userDataChannel.RSAKey === null) {
                    userDataChannel.RSAKey = cryptico.privateKeyFromString(userModel.privateKey);
                }
              
                var latestTime = 0;
                for (var i = 0; i < messages.length; i++) {



                    var msg  =  messages[i];
                    if (msg.type === 'privateMessage' && !userDataChannel.isDuplicateMessage(msg.msgID)) {

                        // Add the last 24 hours worth of messages to the private channel archive
                       /* if (msg.sender !== userModel._user.userUUID) {
                            // if the sender isn't this user, update the channel list
                            channelList[msg.sender] = channelList[msg.sender]++;
                        }
*/
                        var data = null;
                        var content = cryptico.decrypt(msg.content.cipher, userDataChannel.RSAKey).plaintext;
                        if (msg.data !== undefined && msg.data !== null) {
                            data = cryptico.decrypt(msg.data.cipher, userDataChannel.RSAKey).plaintext;
                            if (data !== undefined) {
                                data = JSON.parse(data);
                            } else {
                                data = {};
                            }
                        }

                        var parsedMsg = {
                            type: 'privateMessage',
                            msgID: msg.msgID,
                            channelUUID: msg.sender,   // Private channelUUID is just contacts UUID...
                            content: content,
                            data: data,
                            TTL: msg.ttl,
                            time: msg.time,
                            sender: msg.sender,
                            recipient: msg.recipient
                        };

                        channelModel.updatePrivateUnreadCount(msg.channelUUID, 1);
                        userDataChannel.messagesDS.add(parsedMsg);

                    }
                }
                userDataChannel.messagesDS.sync();
                userDataChannel.updateTimeStamp();
                /*   channelKeys = Object.keys(channelList);
                 channelModel.updatePrivateChannels(channelKeys, channelList);*/

                var startTime = parseInt(start);
                if (messages.length === 100 && startTime >= start) {

                    userDataChannel._fetchHistory(end);
                }

            }


        });
    },

    history : function () {

        var timeStamp = ggTime.toPubNubTime(ggTime.currentTime());
        var lastAccess = ggTime.toPubNubTime(userDataChannel.lastAccess);

        userDataChannel._fetchHistory(timeStamp.toString());

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
        var dataSource = userDataChannel.messagesDS;
        
        if (dataSource === null ) {
            return;
        }
        if (dataSource.total() === 0) {
            return;
        }

        var yesterday = ggTime.lastDay();
       
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


