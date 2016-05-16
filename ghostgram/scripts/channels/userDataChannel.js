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
            },
            autoSync: true
        });

        if (channelUUID !== undefined) {
            userDataChannel.channelUUID = channelUUID;

            var ts = localStorage.getItem('ggUserDataTimeStamp');
            if (ts !== undefined) {
                userDataChannel.lastAccess = parseInt(ts);

                // Was last access more than 24 hours ago -- if yes set it to 24 hours ago
                if (userDataChannel.lastAccess < ggTime.last72hours()) {
                    userDataChannel.lastAccess = ggTime.last72Hours();
                    localStorage.setItem('ggUserDataTimeStamp', userDataChannel.lastAccess);
                }
            } else {
                // No lastAccess stored so set it to 24 hours
                userDataChannel.lastAccess = ggTime.last72Hours();
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
    
    addMessage : function (message) {
        if (userDataChannel.isDuplicateMessage(message.msgID))
            return;

        /*var content = userDataChannel.encryptBlock(message.content);
        message.content = content;

       
        var data = userDataChannel.encryptBlock(JSON.stringify(message.data));
        message.data = data;*/
        
        userDataChannel.messagesDS.add(message);
        userDataChannel.messagesDS.sync();
        everlive.createOne(userDataChannel._cloudClass, message, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating private message " + JSON.stringify(error));
                debugger;
            }
        });
    },

    archiveMessage : function (message) {
        // remap channelUUID to recipient id
        if (userDataChannel.isDuplicateMessage(message.msgID))
            return;

        message.channelUUID = message.recipient;

        var content = userDataChannel.encryptBlock(message.content);
        message.content = content;


        var data = userDataChannel.encryptBlock(JSON.stringify(message.data));
        message.data = data;

        userDataChannel.messagesDS.add(message);
        userDataChannel.messagesDS.sync();
        everlive.createOne(userDataChannel._cloudClass, message, function (error, data){
             if (error !== null) {
                 mobileNotify ("Error archiving private message " + JSON.stringify(error));
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

        var start = ggTime.toPubNubTime(ggTime.last72Hours());    // Need to fetch the last 24 hours of private messages

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
                        
                        channelModel.updatePrivateUnreadCount(msg.channelUUID, 1);
                        userDataChannel.addMessage(msg);

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

        var yesterday = ggTime.last72Hours();
       
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


