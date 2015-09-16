/**
 * Created by donbrad on 9/8/15.
 * privateChannel.js
 */


'use strict';

var privateChannel = {

    thisUser: {},
    userId: '',
    users: [],
    channelId: '',
    RSAKey: '',
    contactId : '',
    contactKey: '',
    contactName : '',



    close: function () {
        APP.pubnub.unsubscribe({
            channel: privateChannel.channelId
        });
    },

    open : function (channelUUID, userUUID, alias, name,  publicKey, privateKey, contactUUID, contactKey) {
        privateChannel.RSAKey = cryptico.privateKeyFromString(privateKey);


        privateChannel.userId = userUUID;
        privateChannel.publicKey = publicKey;
        privateChannel.thisUser = {
            alias: alias,
            name: name,
            username: userUUID,
            publicKey: publicKey
        };

        privateChannel.contactId = contactUUID;
        privateChannel.contactKey = contactKey;

        // A mapping of all currently connected users' usernames userUUID's to their public keys and aliases
        privateChannel.users = new Array();
        privateChannel.users[userUUID] = privateChannel.thisUser;
        privateChannel.channelId = channelUUID;

        // Subscribe to our PubNub channel.
        APP.pubnub.subscribe({
            channel: privateChannel.channelId,
            windowing: 5000,
            restore: true,
            callback: privateChannel.receiveHandler,
            presence: privateChannel.presenceHandler,
            // Set our state to our user object, which contains our username and public key.
            state: privateChannel.thisUser
        });
    },

    // archive the message in the private channel with this user's public key and send to user.
    // this provides a secure roamable private sent folder without localstorage and parse...
    archiveMessage : function (msg) {
        var archiveMsg = {};
        archiveMsg.msgID = msg.msgID;
        archiveMsg.time = msg.time;
        archiveMsg.TTL = msg.TTL;
        archiveMsg.sender = msg.sender;
        archiveMsg.recipient = privateChannel.userId;
        archiveMsg.actualRecipient = msg.recipient;  // since we're echoing back to sender, need to store recipient.
        var encryptMessage = '', encryptData = '';
        var currentTime =  msg.time;  // use the current message time (time sent by this user)
        encryptMessage = cryptico.encrypt(msg.content, privateChannel.publicKey);
        archiveMsg.content = encryptMessage;
        if (msg.data !== undefined && msg.data !== null)
            encryptData = cryptico.encrypt(JSON.stringify(msg.data), privateChannel.publicKey);
        else
            encryptData = null;
        archiveMsg.data = encryptData;

        APP.pubnub.publish({
            channel: privateChannel.channelId,
            message: archiveMsg,
            error: function (error) {
                mobileNotify("Archive message error : " + error);
            }
        });

    },

    receiveHandler : function (msg) {
        if (msg.recipient === privateChannel.userId) {
            var data = null;
            var content = cryptico.decrypt(msg.content.cipher, privateChannel.RSAKey).plaintext;
            if (msg.data !== undefined && msg.data !== null) {
                data = cryptico.decrypt(msg.data.cipher, privateChannel.RSAKey).plaintext;
                data = JSON.parse(data);
            }

            var parsedMsg = {
                msgID: msg.msgID,
                channelId: privateChannel.channelId,
                content: content,
                data: data,
                TTL: msg.ttl,
                time: msg.time,
                sender: msg.sender,
                actualRecipient: msg.actualRecipient,
                recipient: msg.recipient
            };

            privateChannel.receiveMessage(parsedMsg);
           // deleteMessage(msg.sender, msg.msgID, msg.ttl);
        }
    },

    receiveMessage : function (message) {
        if (message.content !== null) {
            message.formattedContent = formatMessage(message.content);
        } else {
            message.formattedContent = '';
        }

        // Ensure that new messages get the timer
        if (message.fromHistory === undefined) {
            message.fromHistory = false;
        }

        // ignore echoed sender copies in read message
        // -- we add the message to the chat datasource at time of send
        if (message.actualRecipient === undefined)
            channelView.messagesDS.add(message);

        currentChannelModel.updateLastAccess();

        channelView.scrollToBottom();

        if (channelView.privacyMode) {
            kendo.fx($("#"+message.msgID)).fade("out").endValue(0.05).duration(6000).play();
        }
    },

    presenceHandler : function (msg) {
        if (msg.action === "join" || msg.action === "state-change") {
            // If the presence message contains data aka *state*, add this to our users object.
            if ("data" in msg) {
                privateChannel.users[msg.data.username] = msg.data;
                if (msg.data.username === privateChannel.contactId) {
                    mobileNotify(privateChannel.users[msg.uuid].name + " has joined...");
                }

            }
            // Otherwise, we have to call `here_now` to get the state of the new subscriber to the channel.
            else {
                APP.pubnub.here_now({
                    channel: privateChannel.channelId,
                    state: true,
                    callback: privateChannel.hereNowHandler
                });
            }
            privateChannel.presenceChange();
        }
        // A user has left or timed out of ghostgrams so we remove them from our users object.
        else if (msg.action === "timeout" || msg.action === "leave") {
            if (message.uuid === privateChannel.contactId)
                mobileNotify(privateChannel.contactName + " has left ...");
            //delete privateChannel.users[msg.uuid];
            privateChannel.presenceChange();
        }
    },

    presenceChange: function (userId, isPresent) {
        if (userId === privateChannel.contactId) {
            if (isPresent) {
                if (privateChannel.users[userId] === undefined) {

                }
            }
        }

    },

    hereNowHandler : function (msg) {
        privateChannel.users[privateChannel.userId] = privateChannel.thisUser;
        for (var i = 0; i < msg.uuids.length; i++) {
            if ("state" in msg.uuids[i]) {
                privateChannel.users[msg.uuids[i].state.username] = msg.uuids[i].state;
            }
        }
        privateChannel.presenceChange();
    },

    sendMessage: function (recipient, message, data, ttl) {
        if (ttl === undefined || ttl < 60)
            ttl = 86400;  // 24 hours
        // if (recipient in users) {
        var content = message;
        var contentData = data;
        var encryptMessage = '', encryptData = '';
        var currentTime =  ggTime.currentTime();
        encryptMessage = cryptico.encrypt(message, privateChannel.contactKey);
        if (data !== undefined && data !== null)
            encryptData = cryptico.encrypt(JSON.stringify(data), privateChannel.contactKey);
        else
            encryptData = null;

        APP.pubnub.uuid(function (msgID) {
            APP.pubnub.publish({
                channel: privateChannel.contactId,
                message: {
                    recipient: recipient,
                    msgID: msgID,
                    sender: privateChannel.userId,
                    content: encryptMessage,  // publish the encryptedMessage
                    data: encryptData,        // publish the encryptedData.
                    time: currentTime,
                    fromHistory: false,
                    ttl: ttl
                },
                callback: function () {
                    var parsedMsg = {
                        msgID: msgID,
                        channelId: privateChannel.channelId,
                        content: content,
                        data: contentData,
                        TTL: ttl,
                        time: currentTime,
                        sender: privateChannel.userId,
                        fromHistory: false,
                        recipient: recipient
                    };

                    // echo the message
                    privateChannel.receiveMessage(parsedMsg);

                    // archive message in the current channel
                    privateChannel.archiveMessage(parsedMsg);
                    //deleteMessage(recipient, msgID, ttl);
                }
            });
        });

    },

    getMessageHistory: function (callBack) {

        var dataSource = channelModel.privateChannelsDS;


        dataSource.filter(  {"logic":"or",
            "filters":[
                { field: "sender", operator: "eq", value: privateChannel.contactId },
                { field: "actualRecipient", operator: "eq", value: privateChannel.contactId }
            ]});
        var view = dataSource.view();
        var messages = view;
        var clearMessageArray = [];
        dataSource.filter([]);
        for(var i = 0; i < messages.length; i++) {
            var msg = messages[i];
            var content = '';
            var parsedMsg;

            // Process
            var data = null;
            var content = cryptico.decrypt(msg.content.cipher, privateChannel.RSAKey).plaintext;
            if (msg.data !== undefined && msg.data !== null) {
                data = cryptico.decrypt(msg.data.cipher, privateChannel.RSAKey).plaintext;
                data = JSON.parse(data);
            }
            parsedMsg = {
                msgID: msg.msgID,
                content: content,
                data: data,
                TTL: msg.ttl,
                time: msg.time,
                sender: msg.sender,
                fromHistory: true,
                recipient: msg.recipient
            };

            clearMessageArray.push(parsedMsg);

        }

        if(callBack)
            callBack(clearMessageArray);

 /*       var timeStamp = ggTime.lastDay();

        APP.pubnub.history({
            channel: privateChannel.channelId,
            end: timeStamp * 10000,
            error: function (error) {

            },
            callback: function (messages) {
                var clearMessageArray = [];
                messages = messages[0];
                messages = messages || [];

                for(var i = 0; i < messages.length; i++) {
                    var msg = messages[i];
                    var content = '';
                    if (msg.recipient === privateChannel.userId)  {
                        // Process all messages (private send messages are also stored with users public key!!!
                        var data = null;
                        var content = cryptico.decrypt(msg.content.cipher, privateChannel.RSAKey).plaintext;
                        if (msg.data !== undefined && msg.data !== null) {
                            data = cryptico.decrypt(msg.data.cipher, privateChannel.RSAKey).plaintext;
                            data = JSON.parse(data);
                        }
                        var parsedMsg = {
                            msgID: msg.msgID,
                            content: content,
                            data: data,
                            TTL: msg.ttl,
                            time: msg.time,
                            sender: msg.sender,
                            fromHistory: true,
                            recipient: msg.recipient
                        };

                        clearMessageArray.push(parsedMsg);
                    }
                }

                if(callBack)
                    callBack(clearMessageArray);
            }

        });
*/    }
};