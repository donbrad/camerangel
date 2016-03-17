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
    userId : '',
    userName : '',
    userAlias : '',
    messageDS: [],
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
        APP.pubnub.subscribe({
            channel: groupChannel.channelUUID,
            windowing: 500,
            restore: true,
            callback: groupChannel.receiveHandler,
           presence: groupChannel.presenceHandler,
            // Set our state to our user object, which contains our username and public key.
            state: groupChannel.thisUser
        });
    },
    
    receiveHandler : function (msg) {
       
        groupChannel.receiveMessage(msg);
  
    },

    receiveMessage : function (message) {

        // Ensure that new messages get the timer
        if (message.fromHistory === undefined) {
            message.fromHistory = false;
        }

        if (channelView.isDuplicateMessage(message.msgID)) {
            return;
        }
        channelView.preprocessMessage(message);

        channelView.messagesDS.add(message);
        channelModel.cacheGroupMessage(message);
        channelModel.updateLastAccess(channelView._channelUUID, null);
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




    },

    presenceHandler : function (msg) {
        
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
           /* // Otherwise, we have to call `here_now` to get the state of the new subscriber to the channel.
            else {
                APP.pubnub.here_now({
                    channel: groupChannel.channelUUID,
                    state: true,
                    callback: groupChannel.hereNowHandler
                });
            }*/
           
        }
        // A user has left or timed out of ghostgrams so we remove them from our users object.
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

    },

    sendMessage: function (text, data, ttl) {
        if (ttl === undefined || ttl < 60)
            ttl = 86400;  // 24 hours


        var currentTime =  ggTime.currentTime();

        APP.pubnub.uuid(function (msgID) {
            var notificationString = "Group Chat : " + groupChannel.channelName ;
            var thisMessage = {
                msgID: msgID,
                channelUUID : groupChannel.channelUUID,
                pn_apns: {
                    aps: {
                        alert : notificationString,
                        badge: 1,
                        'content-available' : 1
                    },
                    senderId: userModel._user.userUUID,
                    target: '#channel?channelUUID='+ groupChannel.channelUUID,
                    channelUUID: groupChannel.channelUUID,
                    isMessage: true,
                    isPrivate: false
                },
                pn_gcm : {
                    data : {
                        title: notificationString,
                        message: "Message from " + userModel._user.name,
                        senderId: userModel._user.userUUID,
                        target: '#channel?channelUUID='+ groupChannel.channelUUID,
                        channelUUID: groupChannel.channelUUID,
                        isMessage: true,
                        isPrivate: false
                    }
                },
                sender: userModel._user.userUUID,
                content: text,
                data: data,
                time: currentTime,
                fromHistory: false,
                ttl: ttl
            };
            APP.pubnub.publish({
                channel: groupChannel.channelUUID,
                message: thisMessage,
                callback: function (m) {
                    if (m === undefined)
                        return;

                    var status = m[0], message = m[1], time = m[2];

                    if (status !== 1) {
                        mobileNotify('Group Channel publish error: ' + message);
                    }

                    /*var parsedMsg = {
                         msgID: msgID,
                         channelUUID: groupChannel.channelUUID,
                         content: message,
                         data: data,
                         ttl: ttl,
                         time: currentTime,
                         sender: userModel._user.userUUID,
                         fromHistory: false

                     };*/

                    channelModel.updateLastAccess(groupChannel.channelUUID, null);
                    channelView.scrollToBottom();
                   // groupChannel.receiveMessage(thisMessage);

                }
            });
        });

    },

    getAllMessages:  function(timetoken) {
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

    getMessageHistory: function (callBack) {
        var channel = channelModel.findChannelModel(groupChannel.channelUUID);
        var endTime = ggTime.currentTime() * 1000, lastTime = ggTime.lastMonth() * 1000;
        groupChannel.channelFetchCallBack = callBack;

        if (groupChannel.nextFetchEnd !== null) {
            if (groupChannel.nextFetchEnd <= lastTime)
                endTime = lastTime;
            else
                endTime = groupChannel.nextFetchEnd;
        }

        APP.pubnub.history({
            channel: groupChannel.channelUUID,
            end: endTime.toString(),
            error: function (error) {

            },
            callback: function (messages) {
                var messageList = messages[0];
                var start = messages[1];
                var end = messages[2];
                //messages = messages || [];

                groupChannel.nextFetchEnd = end;
                if(callBack)
                    callBack(messageList);
            }

        });
    }

};








/*


function groupChannel( channelUUID, userUUID, alias, publicKey) {
    var channel = channelUUID;
    
	
    var thisUser = {
		alias: alias,
        username: userUUID,
        name: name
    };

    // A mapping of all currently connected users' usernames userUUID's to their public keys.
    var users = new Array();
	users[userUUID] = thisUser;     


    // `receiveMessage` and `presenceChange` are called when a message 
    // intended for the user is received and when someone connects to 
    // or leaves the PubNub channel respectively. Both methods can be changed 
    // by the publicly accessible methods `onMessage` and `onPresence`.
    var receiveMessage = function(){};
    var presenceChange = function(){};
 

    // messageHandler
    // ---
    // `messageHandler` is called whenever a message is received.
    // If the recipient of the message is this user, it will decrypt
    // and store the message inside the messages object,
    //  then call `receiveMessage` with the decrypted message.
    var messageHandler = function (msg) {
        if (msg.recipient === userUUID) {
            var parsedMsg = {
                msgID: msg.msgID,
                channelUUID: channelUUID,
                content: msg.content,
                data: msg.data,
                TTL: msg.ttl,
				time: msg.time,
                sender: msg.sender,
                recipient: msg.recipient
            };

            receiveMessage(parsedMsg);
            deleteMessage(msg.sender, msg.msgID, msg.ttl);
        }
    };

    // presenceHandler
    // ---
    // `presenceHandler` is called whenever a user leaves, joins, or
    // times out of Babel. After updating our `users` object, it calls
    // `presenceChange()`.
    var presenceHandler = function (msg) {
        // A user has joined , so we add them to our users object.
        if (msg.action === "join" || msg.action === "state-change") {
            // If the presence message contains data aka *state*, add this to our users object. 
            if ("data" in msg) { 
                users[msg.data.username] = msg.data;
            } 
            // Otherwise, we have to call `here_now` to get the state of the new subscriber to the channel.
            else {
                APP.pubnub.here_now({
                    channel: channel,
                    state: true,
                    callback: herenowUpdate
                });
            }
            presenceChange();
        } 
        // A user has left or timed out of Babel so we remove them from our users object.
        else if (msg.action === "timeout" || msg.action === "leave") {
            delete users[msg.uuid];
            presenceChange();
        } 
    };


    // secureChannel Private Methods
    // ---
    // `herenowUpdate` is only called as a callback to 'here_now'. 
    // It does a complete update of our `users` object and then
    // calls `presenceChange()`.
    var herenowUpdate = function (msg) {
       users[userUUID] = publicKey;
        for (var i = 0; i < msg.uuids.length; i++) {
            if ("state" in msg.uuids[i]) {
                users[msg.uuids[i].state.username] = msg.uuids[i].state.publicKey;
            }
        }
        presenceChange();
    };

    // Delete a message from the `messages` object, after `TTL` seconds.
    // (If you *sent* the message, `username` is the username of the recipient.
    // If you *received* the message, `username` is the username of the sender.)
    var deleteMessage = function (username, msgID, TTL) {
        var z = setInterval(function() {
            for (var i = 0; i < messages[username].length; i++) {
                if (messages[username][i].msgID === msgID) {
                    if (messages[username][i].TTL === 0) {
                        messages[username].splice(i, 1);
                        clearInterval(z);
                        break;
                    }
                    messages[username][i].TTL--;
                }
            }
        }, 1000);
    };

    // secureChannel public methods
    // ---
    return {
        // Sends `message` to `recipient`. After `ttl` seconds, the message
        // will self-destruct, and neither you or the recipient will be able 
        // to retrieve the message from your `messages` object.
        sendMessage: function (recipient, message, data, ttl) {
            if (ttl === undefined || ttl < 60)
                ttl = 86400;  // 24 hours

            var currentTime =  ggTime.currentTime();

            APP.pubnub.uuid(function (msgID) {
                APP.pubnub.publish({
                        channel: channel,
                        message: {
                            recipient: recipient,
                            msgID: msgID,
                            sender: userUUID,
                            content: message,
                            data: data,
							time: currentTime,
                            ttl: ttl
                        },
                        callback: function () {
                           var parsedMsg = {
                                msgID: msgID,
                               channelUUID: channelUUID,
                                content: message,
                                data: data,
                                TTL: ttl,
								time: currentTime,
                                sender: userUUID,
                                recipient: recipient
                            };
                            receiveMessage(parsedMsg);
                            deleteMessage(recipient, msgID, ttl);
                        }
                    });
                });
          //  }
        },
        // Changes the function that is called when you are sent a message or
        // when you send a message.
        //
        // An argument of this form is passed to the callback.
        //
        //      {msgID: "487f703e-3189-4f66-87a1-62cb0ffb52fd",
        //      content: "very example message", TTL: 86400, sender: "foobar",
        //      recipient: "barfoo"}
        onMessage: function (callback) {
            receiveMessage = callback;
        },
        // Change the function that is called when a user joins, leaves, or
        // times out of Babel. No arguments are passed to the callback.
        onPresence: function (callback) {
            presenceChange = callback;
        },
        // Returns a mapping of all usernames and their respective public keys.
        listUsers: function () {
            return users;
        },
		
        // Returns a mapping of usernames and the messages they've sent.
        // (Messages you've sent are mapped by the the username of the reciever)
        returnMessages: function () {
            return messages;
        },
		
		// Get any messages that are in the channel
		getMessageHistory: function (callBack) {
            APP.pubnub.history({
				channel: channel,
				limit: 100,
				callback: function (messages) {
					messages = messages[0];
					messages = messages || [];
					
					if(callBack)
						callBack(messages);
				}

			});
		},

        // Quits groupChannel. Other users will no longer be able to retrieve your
        closeChannel: function () {
            APP.pubnub.unsubscribe({
                channel: channel
            });
         },
        // Starting up PubNub
        // ---

        openChannel : function () {
            // Subscribe to our PubNub channel.
            APP.pubnub.subscribe({
                channel: channel,
                windowing: 50000,
                restore: true,
                callback: messageHandler,
                presence: presenceHandler,
                // Set our state to our user object, which contains our username and public key.
                state: thisUser
            });
        }

    };
}
*/
