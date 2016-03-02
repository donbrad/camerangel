/**
 * Created by donbrad on 8/10/15.
 * userNoteChannel - handles all privateNote storage and retrieval
 *
 * !!! Must be included after pubnub and init must be called after pubnub is initialized
 */


'use strict';

var userNoteChannel = {

    notesDS :  new kendo.data.DataSource({
        offlineStorage: "privatenote",
        type: 'everlive',
        transport: {
            typeName: 'privatenote'
        },
        schema: {
            model: { id: Everlive.idField }
        }
    }),

    init: function () {

        userNoteChannel.notesDS.fetch();

    },

    queryMessages : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = userNoteChannel.notesDS;
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
        var messages = userNoteChannel.queryMessages({ field: "msgID", operator: "eq", value: msgID });

        if (messages === undefined) {
            return (false);
        } else if (messages.length === 0) {
            return (false);
        } else {
            return(true);
        }
    },

    updateTimeStamp : function () {
        userNoteChannel.lastAccess = ggTime.currentTime();
        localStorage.setItem('ggUserDataTimeStamp', userNoteChannel.lastAccess);
    },

    // Iterative function to get all messages in the user data channel for the last 24 hours
    // Note: pubnubs api will only return a max of 100 messsges so need to iterate until
    // we have full 24 hours for all contactc
    _fetchHistory : function (timeStamp) {

        var start = ggTime.toPubNubTime(ggTime.lastDay());    // Need to fetch the last 24 hours of private messages

        // Get any messages in the channel
        APP.pubnub.history({
            channel: userNoteChannel.channelId,
            start: start.toString(),
            end: timeStamp,
            error: userNoteChannel.error,
            callback: function(messages) {
                messages = messages[0];
                var start = messages[1], end = messages[2];
                messages = messages || [];
                var RSAKey = cryptico.privateKeyFromString(userModel.currentUser.privateKey);
                var latestTime = 0;
                for (var i = 0; i < messages.length; i++) {



                    var msg  =  messages[i];
                    if (msg.type === 'privateMessage' && !userNoteChannel.isDuplicateMessage(msg.msgID)) {

                        // Add the last 24 hours worth of messages to the private channel archive
                       /* if (msg.sender !== userModel.currentUser.userUUID) {
                            // if the sender isn't this user, update the channel list
                            channelList[msg.sender] = channelList[msg.sender]++;
                        }
*/
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

                        channelModel.updatePrivateUnreadCount(msg.channelId, 1);
                        userNoteChannel.notesDS.add(parsedMsg);

                    }
                }
                userNoteChannel.notesDS.sync();
                userNoteChannel.updateTimeStamp();
                /*   channelKeys = Object.keys(channelList);
                 channelModel.updatePrivateChannels(channelKeys, channelList);*/

                var startTime = parseInt(start);
                if (messages.length === 100 && startTime >= start) {

                    userNoteChannel._fetchHistory(end);
                }

            }


        });
    },

    history : function () {

        var timeStamp = ggTime.toPubNubTime(ggTime.currentTime());
        var lastAccess = ggTime.toPubNubTime(userNoteChannel.lastAccess);

        userNoteChannel._fetchHistory(timeStamp.toString());

    }
};


