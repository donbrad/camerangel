/**
 * Created by donbrad on 9/8/15.
 * groupChannel.js
 */

'use strict';

var groupChannel = {
    thisUser : {},
    users: [],
    channelUUID : '',
    channelName : '',

    _class : 'group',
    _message : 'message',   // message from member
    _addMember : 'addmember',           // add member (from owner)
    _removeMember : 'removemember',     // remove member (from owner)
    _deleteChannel : 'deletechannel',     // delete chat (from owner)
    _updateChannel : 'updatechannel',     // update (from owner)
    _recallMessage : 'recallmessage',
    _recallPhoto : 'recallphoto',
    userId : '',
    userName : '',
    userAlias : '',
    start: null,
    end: null,
    moreMessages: false,
    messageDS: new kendo.data.DataSource(),
    deferredDS : new kendo.data.DataSource(),
    recallDS : new kendo.data.DataSource(),
    nextFetchEnd : null,
    channelFetchCallBack : null,

    close: function () {
        if (groupChannel.channelUUID !== null) {
            APP.pubnub.unsubscribe({
                channel: groupChannel.channelUUID
            });

            groupChannel.channelUUID = null;
            groupChannel.channelName = null;
            groupChannel.users = [];
        }
    },
    
    open : function (channelUUID, channelName, userId, name, alias, phoneNumber) {
        groupChannel.channelUUID = channelUUID;
        groupChannel.channelName = channelName;
        groupChannel.userId = userId;
        groupChannel.thisUser.username = userId;
        groupChannel.thisUser.uuid = userId;
        groupChannel.thisUser.name = name;
        groupChannel.thisUser.alias = alias;
        groupChannel.thisUser.phone = phoneNumber;  // Use this to look up new members (don't have userId therefore no contactUUID)
        groupChannel.users = [];
        groupChannel.nextFetchEnd = null;
        groupChannel.users[userId] = groupChannel.thisUser;

        // Subscribe to our PubNub channel.
      /*  APP.pubnub.subscribe({
            channel: groupChannel.channelUUID,
            windowing: 500,
            restore: true,
            callback: groupChannel.receiveHandler/!*,
            presence: groupChannel.presenceHandler,
            // Set our state to our user object, which contains our username and public key.
            state: groupChannel.thisUser*!/
        });*/
    },

    subscribeChannelArray : function (channelArray) {
        APP.pubnub.subscribe({
            channel: channelArray
        });
    },

    subscribeChannel : function (channelId) {
        APP.pubnub.subscribe({
            channel:  channelId
        });
    },

    unsubscribeChannel : function (channelId) {
        APP.pubnub.unsubscribe({
            channel: channelId
        });
    },

    receiveHandler : function (msg) {

        if (msg.msgType === undefined) {
            msg.msgType = groupChannel._message;
        }

        switch (msg.msgType) {

            case groupChannel._message :
                    groupChannel.receiveMessage(msg);
                break;

            case groupChannel._addMember :
                    groupChannel.doAddMember(msg);
                break;

            case groupChannel._removeMember :
                    groupChannel.doRemoveMember(msg);
                break;

            case groupChannel._deleteChannel :
                    groupChannel.doDeleteChannel(msg);
                break;

            case groupChannel._updateChannel :
                groupChannel.doUpdateChannel(msg);
                break;

            case groupChannel._recallMessage :
                groupChannel.doRecallMessage(msg);
                break;

            case groupChannel._recallPhoto :
                groupChannel.doRecallPhoto(msg);
                break;


        }
       

  
    },

    doRecallMessage : function (msg) {
        var recallObj = {type: 'message', channelId: msg.channelUUID, messageId : channel.msgID};

        channelModel.recallDS.add(recallObj);

    },

    doRecallPhoto : function (msg) {
        var recallObj = {type: 'photo', channelId: msg.channelUUID, photoId : channel.photoId};
        channelModel.recallDS.add(recallObj);
    },

    doAddMember : function (msg) {
        var channelId = msg.channelUUID, memberId = msg.memberUUID;

        var channel = channelModel.findChannelModel(msg.channelUUID);

        if (channel !== undefined && channel !== null) {
            var members = channel.members;
            var found = false;

            for (var i=0; i<members.length; i++) {
                var member = members[i];

                if (member === memberId) {
                    found = true;
                }
            }

            if (!found) {
                members.push(memberId);
            }

            channel.set('members', members);
            channelModel.sync();

        }
    },

    doRemoveMember : function (msg) {
        var channelId = msg.channelUUID, memberId = msg.memberUUID;
        var channel = channelModel.findChannelModel(msg.channelUUID);

        if (channel !== undefined && channel !== null) {
            var members = channel.members, newMembers = [];


            for (var i=0; i<members.length; i++) {
                var member = members[i];

                if (member !== memberId) {
                    newMembers.push(member);
                }
            }


            channel.set('members', newMembers);

            channelModel.sync();

        }
    },

    doDeleteChannel : function (msg) {
        var channelId = msg.channelUUID;
        var channel = channelModel.findChannelModel(msg.channelUUID);
        if (channel !== undefined && channel !== null) {
            channelModel.deleteChannel(channelId, true);
        }
    },

    doUpdateChannel : function (msg) {
        var channelId = msg.channelUUID;
        var channelName = msg.name, channelDescription = msg.description, members = msg.members;
        var channel = channelModel.findChannelModel(msg.channelUUID);
        if (channel !== undefined && channel !== null) {
            channel.set('name', channelName);
            channel.set('description', channelDescription);
            channel.set('members', members);
        }
    },

    addMember : function (channelId, memberId) {
        var currentTime =  ggTime.currentTime();

        var msgID = uuid.v4();

        var thisMessage = {
            msgID: msgID,
            msgClass : groupChannel._class,
            msgType : groupChannel._addMember,
            time: currentTime,
            channelUUID : channelId,
            sender: userModel._user.userUUID,
            senderName :  userModel._user.name,
            memberId : memberId
        };

        if (!deviceModel.isOnline()) {

            thisMessage.wasSent = false;
            groupChannel.deferredDS.add(thisMessage);
            return;
        }

        APP.pubnub.publish({
            channel: channelId,
            message: thisMessage
        },
            function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Group Channel: Add Member -" + JSON.stringify(status.error));
                }
            }
        );
    },

    removeMember : function (channelId, memberId) {
        var currentTime =  ggTime.currentTime();

        var msgID = uuid.v4();

        var thisMessage = {
            msgID: msgID,
            msgClass : groupChannel._class,
            msgType : groupChannel._removeMember,
            time: currentTime,
            channelUUID : channelId,
            sender: userModel._user.userUUID,
            senderName :  userModel._user.name,
            memberId : memberId
        };

        if (!deviceModel.isOnline()) {

            thisMessage.wasSent = false;
            groupChannel.deferredDS.add(thisMessage);
            return;
        }

        APP.pubnub.publish({
            channel: channelId,
            message: thisMessage
        },
            function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Group Channel: Remove Member -" + JSON.stringify(status.error));
                }
            }
        );
    },

    updateChannel : function (channelId, name, description, memberList) {
        var currentTime =  ggTime.currentTime();

        var msgID = uuid.v4();

        var thisMessage = {
            msgID: msgID,
            msgClass : groupChannel._class,
            msgType : groupChannel._updateChannel,
            time: currentTime,
            channelUUID : channelId,
            sender: userModel._user.userUUID,
            senderName :  userModel._user.name,
            name : name,
            description : description,
            members : memberList
        };

        if (!deviceModel.isOnline()) {
            thisMessage.wasSent = false;
            groupChannel.deferredDS.add(thisMessage);
            return;
        }

        APP.pubnub.publish({
            channel: channelId,
            message: thisMessage
        },
            function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Group Channel: Update Channel -" + JSON.stringify(status.error));
                }
            }
        );
    },

    recallMessage : function (channelId, messageId) {
        var currentTime =  ggTime.currentTime();

        var msgID = uuid.v4();

        var thisMessage = {
            msgID: msgID,
            msgClass : groupChannel._class,
            msgType : groupChannel._recallMessage,
            channelUUID : channelId,
            time: currentTime,
            sender: userModel._user.userUUID,
            senderName :  userModel._user.name,
            messageId : messageId
        };

        if (!deviceModel.isOnline()) {

            thisMessage.wasSent = false;
            groupChannel.deferredDS.add(thisMessage);
            return;
        }

        APP.pubnub.publish({
            channel: channelId,
            message: thisMessage
        },
            function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Group Channel: Recall Message -" + JSON.stringify(status.error));
                }
            }
        );
    },

    recallPhoto : function (channelId,  photoId) {
        var currentTime =  ggTime.currentTime();

        var msgID = uuid.v4();


        var thisMessage = {
            msgID: msgID,
            msgClass : groupChannel._class,
            msgType : groupChannel._recallPhoto,
            channelUUID : channelId,
            time: currentTime,
            sender: userModel._user.userUUID,
            senderName :  userModel._user.name,
            photoId : photoId
        };

        if (!deviceModel.isOnline()) {

            thisMessage.wasSent = false;
            groupChannel.deferredDS.add(thisMessage);
            return;
        }

        APP.pubnub.publish({
            channel: channelId,
            message: thisMessage
        },
            function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Group Channel: Recall Photo -" + JSON.stringify(status.error));
                }
            }
        );
    },

    receiveMessage : function (message) {

        // Ensure that new messages get the timer
        if (message.fromHistory === undefined) {
            message.fromHistory = false;
        }

        if (channelView.isDuplicateMessage(message.msgID)) {
            return;
        }
        if (message.msgClass === undefined) {
            message.msgClass = groupChannel._class;
        }

        if (message.msgType === undefined) {
            message.msgType = groupChannel._message;
        }
        channelView.preprocessMessage(message);

        channelModel.cacheGroupMessage(message);
        channelModel.updateLastMessageTime(channelView._channelUUID, null);

        if (channelView._channelUUID === message.channelUUID) {
            channelView.messagesDS.add(message);
            if (message.data.photos !== undefined && message.data.photos.length > 0) {
                var selector = '#' + message.msgID + " img";
                var $img = $(selector), n = $img.length;
                if (n > 0) {
                    $img.on("load error", function () {
                        if(!--n) {
                            channelView.scrollToBottom();
                        }
                    });
                } else {
                    channelView.scrollToBottom();
                }
            } else {
                channelView.scrollToBottom();
            }
        }

    },

/*    presenceHandler : function (msg) {
        
        if (msg.action === "join" || msg.action === "state-change") {
            // If the presence message contains data aka *state*, add this to our users object.
            if ("data" in msg) {
                groupChannel.users[msg.data.username] = msg.data;
                // Only update presence if it's not THIS user...
                if (msg.data.username !== userModel._user.userUUID) {
                    mobileNotify(msg.data.name + ' (' + msg.data.alias +  ") has joined...");
                    groupChannel.presenceChange(msg.data.username,  true);
                }

            }
           /!* // Otherwise, we have to call `here_now` to get the state of the new subscriber to the channel.
            else {
                APP.pubnub.here_now({
                    channel: groupChannel.channelUUID,
                    state: true,
                    callback: groupChannel.hereNowHandler
                });
            }*!/
           
        }
        // A user has left or timed out of intelligram so we remove them from our users object.
        else if (msg.action === "timeout" || msg.action === "leave") {
            // Don't report presence for this user -- only other members
            if (msg.uuid !== userModel._user.userUUID) {
                if (groupChannel.users.length > 0) {
                    mobileNotify(msg.data.name + ' (' + msg.data.alias + ") has left ...");
                    delete groupChannel.users[msg.data.username];
                }

                groupChannel.presenceChange(msg.data.username, false);
            }


        }
    },

    presenceChange: function (userId, isPresent) {
        channelView.setPresence(userId, isPresent);
    },

    hereNow : function () {
        APP.pubnub.here_now({
            channel: groupChannel.channelUUID,
            state: true,
            callback: function(msg) {
                groupChannel.users[groupChannel.userId] = groupChannel.thisUser;
                for (var i = 0; i < msg.uuids.length; i++) {
                    if ("state" in msg.uuids[i]) {
                        groupChannel.users[msg.uuids[i].state.username] = msg.uuids[i].state;
                    }
                }
                channelView.updatePresence(groupChannel.users, msg.occupancy);
            }
        });

    },*/

    processDeferred : function () {
        var len = groupChannel.deferredDS.total();

        if (len > 0) {
            for (var i=0; i<len; i++) {
                if (deviceModel.isOnline()) {
                    var msg = groupChannel.deferredDS.at(i);
                    groupChannel.deferredSend(msg);
                    groupChannel.deferredDS.remove(msg);
                }
            }
        }
    },

    deferredSend : function (message) {

        message.set('wasSent', true);
        message.actualSend = ggTime.currentTimeInSeconds();
        if (message.channelUUID !== channelView._channelUUID) {
            mobileNotify("Deferred message sent...");
        }

        APP.pubnub.publish({
            channel: message.channelUUID,
            message: message
            },
            function (status, response) {
                if (status.error) {
                    ggError("Private Send - Deferred : " + JSON.stringify(status.error));
                }

            }
        );
    },

    sendMessage: function (channelId, channelName, text, data, ttl) {
        if (ttl === undefined || ttl < 60)
            ttl = 86400;  // 24 hours

        var currentTime =  ggTime.currentTime();

       var msgID = uuid.v4();

        var notificationString = "Chat : " + channelName + ' from: ' + userModel._user.name;
        var message = {
            msgID: msgID,
            msgClass : groupChannel._class,
            msgType : groupChannel._message,
            channelUUID : channelId,
            pn_apns: {
                aps: {
                    alert : notificationString,
                    badge: 1,
                    'content-available' : 1
                },
                senderId: userModel._user.userUUID,
                senderName :  userModel._user.name,
                target: '#channel?channelUUID='+ channelId,
                channelUUID: channelId,
                msgType : groupChannel._message,
                isMessage: true,
                isPrivate: false
            },
            pn_gcm : {
                data : {
                    title: notificationString,
                    message: "Message from " + userModel._user.name,
                    senderId: userModel._user.userUUID,
                    senderName :  userModel._user.name,
                    target: '#channel?channelUUID='+ channelId,
                    channelUUID: channelId,
                    msgType : groupChannel._message,
                    isMessage: true,
                    isPrivate: false
                }
            },
            sender: userModel._user.userUUID,
            senderName :  userModel._user.name,
            content: text,
            data: data,
            time: currentTime,
            fromHistory: false,
            wasSent : true,
            ttl: ttl
        };

        if (!deviceModel.isOnline()) {

            message.wasSent = false;
            groupChannel.deferredDS.add(message);
            return;
        }

        APP.pubnub.publish({
                channel: channelId,
                message: message
            },
            function (status, response) {
                if (status.error) {
                    // handle error
                    ggError("Group Channel: Send Message -" + JSON.stringify(status.error));
                } else {
                    if (channelView._active && channelView._channelUUID === channelId) {
                        channelView.messagesDS.add(message);
                        channelView.scrollToBottom();
                    }
                    channelModel.updateLastMessageTime(channelId, null);
                }
            }
        );

    },

   /* getAllMessages:  function(timetoken) {
        APP.pubnub.history({
            start: timetoken,
            channel: groupChannel.channelUUID,
            callback: function(payload) {
                var msgs = payload[0];
                var start = payload[1];
                var end = payload[2];
                // if msgs were retrieved, do something useful with them
                if (msgs != undefined && msgs.length > 0) {
                    // Add messages to the cache
                }
                // if 100 msgs were retrieved, there might be more; call history again
                if (msgs.length == 100)  {
                    groupChannel.getAllMessages(start);
                } else {

                }
            }
        });
    },
*/
    _fetchHistory : function (start, end) {
       
        APP.pubnub.history({
            channel: groupChannel.channelUUID,
            stringifiedTimeToken: true,
            start: start.toString(),
            end: end.toString(),
            callback: function (status, response) {
                if (status.error) {
                    ggError("Group History Error: " + JSON.stringify(status.error));
                } else {

                    var messages = response.messages;
                    var pnStart = response.startTimeToken;
                    var pnEnd = response.endTimeToken;
                    var length = messages.length;
                    var endTime = parseInt(pnStart);

                    var messageList = [];

                    for (var i=0; i< length; i++) {
                        messageList.push(messages[i].entry);
                    }

                    groupChannel.end = endTime;
                    if (length < 100) {
                        groupChannel.moreMessages = false;
                    } else if (length === 100) {
                        if (endTime >= groupChannel.start) {
                            groupChannel.moreMessages = true;
                        } else {
                            groupChannel.moreMessages = false;
                        }
                    }
                    if(groupChannel.channelFetchCallBack !== null)
                        groupChannel.channelFetchCallBack(messageList);
                }

            }

        });
    },
    
    getMoreMessages : function (callback) {
        if (!groupChannel.moreMessages) {
            callback([]);
            return;
        }
        groupChannel.channelFetchCallBack = callback;
        groupChannel._fetchHistory(groupChannel.start, groupChannel.end);
    },
    
    getMessageHistory: function (callBack) {
        var channel = channelModel.findChannelModel(groupChannel.channelUUID);

        groupChannel.end = ggTime.toPubNubTime(ggTime.currentTime());
        groupChannel.start = ggTime.toPubNubTime(ggTime.lastMonth());
        groupChannel.channelFetchCallBack = callBack;
        
        groupChannel._fetchHistory(groupChannel.start, groupChannel.end);

    }

};