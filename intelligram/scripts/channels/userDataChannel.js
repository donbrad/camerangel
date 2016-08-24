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
    _fetched : false,
    _historyFetchComplete : false,
    needHistory : true,
    _inited : false,

    

    init: function (channelUUID) {

        if (userDataChannel._inited) {
            return;
        }

      userDataChannel._inited = true;
        userDataChannel.messagesDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'privatemessages',
                dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField }
            },
            sort : {
                field : "time",
                dir: 'asc'
            }

        });

        if (channelUUID !== undefined && channelUUID !== null) {
            userDataChannel.channelUUID = channelUUID;

            var ts = localStorage.getItem('ggUserDataTimeStamp');
            if (ts !== undefined && ts !== "NaN") {
                userDataChannel.lastAccess = parseInt(ts);

                // Was last access more than 1 week ago -- if yes set it to 1 week ago
                if (userDataChannel.lastAccess < ggTime.lastWeek() || userDataChannel.lastAccess) {

                    userDataChannel.lastAccess = ggTime.lastWeek();
                    localStorage.setItem('ggUserDataTimeStamp', userDataChannel.lastAccess);
                } else {
                    localStorage.setItem('ggUserDataTimeStamp', userDataChannel.lastAccess);
                }
            } else {
                userDataChannel.lastAccess = ggTime.lastWeek();
                localStorage.setItem('ggUserDataTimeStamp', userDataChannel.lastAccess);
            }

        }


        userDataChannel.messagesDS.bind("requestEnd", function (e) {
            var response = e.response,  type = e.type;

            if (type === 'read' && e.response) {

                if (!userDataChannel._fetched) {
                    userDataChannel._fetched = true;

                    //notificationModel.processUnreadChannels();

                   /* var total = response.length;
                    if (total === 0 ) {
                        var lastAccess = ggTime.lastWeek();
                    } else {
                        var lastMessage = response[(total-1)];
                        lastAccess =  lastMessage.time;
                    }
                    userDataChannel.lastAccess = lastAccess;
                    localStorage.setItem('ggUserDataTimeStamp', userDataChannel.lastAccess);*/

                    APP.pubnub.subscribe({
                        channel: userDataChannel.channelUUID,
                        windowing: 100,
                        message: userDataChannel.channelRead,
                        connect: userDataChannel.channelConnect,
                        disconnect:userDataChannel.channelDisconnect,
                        reconnect: userDataChannel.channelReconnect,
                        error: userDataChannel.channelError

                    });

                    userDataChannel.history();
                }
            }
        });

        userDataChannel.messagesDS.fetch();

        //userDataChannel.expireMessages = setInterval(function(){  userDataChannel.removeExpiredMessages(); }, 60000);

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
            cacheFilter = [];
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
    


    encryptBlock : function (block) {

        return (userDataChannel.encryptBlockWithKey(block, userModel._user.publicKey));
    },

    encryptBlockWithKey : function (block, publicKey) {
        var encryptContent = cryptico.encrypt(block, publicKey);
        if (encryptContent.status === "success") {
            return (encryptContent.cipher);
        }

        return (null);
    },

    decryptBlock : function (block) {
        var RSAKey = userModel.RSAKey;
        var decryptContent = cryptico.decrypt(block, RSAKey);

        return (decryptContent.plaintext);
    },

    decryptMessage : function (msg) {

        var data = null;

        var content = null;

        if (msg.content.cipher !== undefined) {
            content = userDataChannel.decryptBlock(msg.content.cipher);
        } else {
            content = userDataChannel.decryptBlock(msg.content);
        }

        if (content === undefined) {
            content = "<p>Unable to decrypt messages...</p>"
        }

        if (msg.data.cipher !== undefined) {
            data = userDataChannel.decryptBlock(msg.data.cipher);
        } else {
            data = userDataChannel.decryptBlock(msg.data);
        }

        if (data !== undefined) {
            data = JSON.parse(data);
        } else {
            data = {};
        }


        var parsedMsg = {
            type: msg.type,
            fromHistory : msg.fromHistory,
            msgID: msg.msgID,
            channelUUID: msg.channelUUID,  //For private channels, channelUUID is just sender ID
            content: content,
            dataBlob: JSON.stringify(data),
            TTL: msg.ttl,
            time: msg.time,
            sender: msg.sender,
            recipient: msg.recipient
        };

        return(parsedMsg);
    },

    addMessage : function (message) {
        if (userDataChannel.isDuplicateMessage(message.msgID))
            return;

       /* var content = userDataChannel.encryptBlock(message.content);
        message.content = content;*/

      /*  var data = userDataChannel.encryptBlock(JSON.stringify(message.data));
        message.data = data;*/

       // message.data = JSON.stringify(message.data)


        if (deviceModel.isOnline()) {
            everlive.createOne(userDataChannel._cloudClass, message, function (error, data){
                if (error !== null) {
                    ggError("Error creating private message " + JSON.stringify(error));
                }
            });
        } else {
            userDataChannel.messagesDS.add(message);
        }
        userDataChannel.messagesDS.sync();
    },

    archiveMessage : function (message) {
        // remap channelUUID to recipient id
        if (userDataChannel.isDuplicateMessage(message.msgID))
            return;

        message.channelUUID = message.recipient;

     /*  var content = userDataChannel.encryptBlock(message.content);
        message.content = content;*/


       /* var data = userDataChannel.encryptBlock(JSON.stringify(message.data));
        message.data = data;*/
        //message.data = JSON.stringify(message.data);




       if (deviceModel.isOnline()) {
           everlive.createOne(userDataChannel._cloudClass, message, function (error, data) {
               if (error !== null) {
                   ggError("Error archiving private message " + JSON.stringify(error));
               }
           });
       } else {
           userDataChannel.messagesDS.add(message);
       }
        userDataChannel.messagesDS.sync();
    },

    updateTimeStamp : function () {
        userDataChannel.lastAccess = ggTime.currentTime();
        localStorage.setItem('ggUserDataTimeStamp', userDataChannel.lastAccess);
    },


    // Iterative function to get all messages in the user data channel for the last 72 hours
    // Note: pubnubs api will only return a max of 100 messsges so need to iterate until
    // we have full 72 hours for all contacts
    _fetchHistory : function (start, end) {


        // Get any messages in the channel
        APP.pubnub.history({
            channel: userDataChannel.channelUUID,
            start: start.toString(),
            end: end.toString(),
            error: userDataChannel.error,
            callback: function(messages) {
                messages = messages[0];
                var pnStart = messages[1], pnEnd = messages[2];
                messages = messages || [];
                userDataChannel.updateTimeStamp();
                if (messages.length === 0) {
                    return;
                }
                if (userDataChannel.RSAKey === null) {
                    userDataChannel.RSAKey = cryptico.privateKeyFromString(userModel.privateKey);
                }
              
                var latestTime = 0;
                for (var i = 0; i < messages.length; i++) {
                    var msg  =  messages[i];
                    if (msg.type === 'privateMessage' && !userDataChannel.isDuplicateMessage(msg.msgID)) {
                        var msgClear= userDataChannel.decryptMessage(msg);
                        msgClear.fromHistory = true;
                        userDataChannel.addMessage(msgClear);
                        channelModel.updatePrivateUnreadCount(msg.channelUUID, 1);
                    }
                }

                var endTime = parseInt(pnStart);
                if (messages.length === 100 && endTime >= start) {

                    userDataChannel._fetchHistory(start, endTime );
                } else {
                    userDataChannel._historyFetchComplete = true;
                }

            }


        });
    },

    history : function () {

        if (!userDataChannel.needHistory) {
            return;
        }
        if (APP.pubnub === null || !userDataChannel._fetched || !channelModel._fetched || !contactModel._fetched || !notificationModel._fetched) {
            userDataChannel.needHistory = true;
            return;
        }
        userDataChannel.needHistory = false;

        mobileNotify ("Getting Private Messages...");

        var lastAccess = userDataChannel.lastAccess;


        var count = userDataChannel.messagesDS.total();
        if (userDataChannel.messagesDS.total() === 0) {
           lastAccess  = ggTime.lastWeek();
        }
        if ( lastAccess < ggTime.lastWeek()) {
            lastAccess = ggTime.lastWeek()
        }

        userDataChannel.lastAccess = lastAccess;

        localStorage.setItem('ggUserDataTimeStamp', userDataChannel.lastAccess);

       var start = ggTime.toPubNubTime(userDataChannel.lastAccess);
        
        var end = ggTime.toPubNubTime(ggTime.currentTime());


        userDataChannel._fetchHistory(start, end);

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

        var yesterday = ggTime.lastWeek();
       
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
        mobileNotify('Data Channel Error : ' + JSON.stringify(error));
    }
};


