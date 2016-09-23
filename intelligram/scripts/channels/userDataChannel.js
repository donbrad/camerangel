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
    _initialSync: false,

    

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
                model: { id:  Everlive.idField }
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

        userDataChannel.messagesDS.bind("change", function (e) {
            var changedMessages = e.items;
            if (e.action === undefined) {
                if (changedMessages !== undefined && !userDataChannel._initialSync) {
                    userDataChannel._initialSync = true;

                    APP.pubnub.subscribe({
                        channel: userDataChannel.channelUUID,
                        windowing: 100,
                        restore: true,
                        message: userDataChannel.channelRead,
                        connect: userDataChannel.channelConnect,
                        disconnect: userDataChannel.channelDisconnect,
                        reconnect: userDataChannel.channelReconnect,
                        error: userDataChannel.channelError

                    });

                    userDataChannel.history();
                }
            }
        });

        userDataChannel.messagesDS.bind("requestEnd", function (e) {
            var response = e.response,  type = e.type;

            if (type === 'read' && e.response) {

                if (!userDataChannel._fetched) {
                    userDataChannel._fetched = true;
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

    findMessage : function (msgID) {
        var messages = userDataChannel.queryMessages({ field: "msgID", operator: "eq", value: msgID });

        if (messages === undefined) {
            return (null);
        } else if (messages.length === 0) {
            return (null);
        } else {
            return(messages);
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

        if (decryptContent.status === 'failure' || decryptContent.plaintext === undefined) {
            return(null);
        }
        return (decryptContent.plaintext);
    },


    addMessage : function (message) {
        if (userDataChannel.isDuplicateMessage(message.msgID))
            return;

        if (message.Id === undefined) {
            message.Id = uuid.v4();
        }
        userDataChannel.messagesDS.add(message);
        userDataChannel.messagesDS.sync();
        if (deviceModel.isOnline()) {
            everlive.createOne(userDataChannel._cloudClass, message, function (error, data){
                if (error !== null) {
                    ggError("Error creating private message " + JSON.stringify(error));
                }
            });
        }

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
            include_token : true,
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

    resumeHistory : function () {
        userDataChannel.needHistory = true;
        userDataChannel.history();
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

        if (lastAccess === undefined || lastAccess === null) {
            lastAccess = ggTime.lastWeek();
        }

        var count = userDataChannel.messagesDS.total();
        if (userDataChannel.messagesDS.total() === 0) {
           lastAccess  = ggTime.lastWeek();
        }
        if ( lastAccess < ggTime.lastWeek()) {
            lastAccess = ggTime.lastWeek();
        }

        userDataChannel.lastAccess = lastAccess;

        localStorage.setItem('ggUserDataTimeStamp', userDataChannel.lastAccess);

       var start = ggTime.toPubNubTime(userDataChannel.lastAccess);
        
        var end = ggTime.toPubNubTime(ggTime.currentTime());


        userDataChannel._fetchHistory(start, end);

    },


    channelRead : function (m) {

        privateChannel.receiveHandler(m);

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
        console.log('UserDataChannel Error : ' + error);
    },

    channelConnect: function () {

    },

    channelDisconnect: function () {
        console.log("Data Channel Disconnected");
    },

    channelReconnect: function () {
        console.log("Data Channel Reconnected");
    },

    channelSuccess : function (status) {

    },

    channelError : function (error) {
        console.log('Data Channel Error : ' + JSON.stringify(error));
    }
};


