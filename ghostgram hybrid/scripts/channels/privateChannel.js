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

 /*       APP.pubnub.unsubscribe({
            channel: privateChannel.channelId
        });
*/    },

    open : function (channelUUID, userUUID, alias, name,  publicKey, privateKey, contactUUID, contactKey, contactName) {
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
        privateChannel.contactName = contactName;


        // A mapping of all currently connected users' usernames userUUID's to their public keys and aliases
        privateChannel.users = new Array();
        privateChannel.users[userUUID] = privateChannel.thisUser;
        privateChannel.channelId = channelUUID;

    },

    // archive the message in the private channel with this user's public key and send to user.
    // this provides a secure roamable private sent folder without localstorage and parse...
    archiveMessage : function (msg) {
        var archiveMsg = {};
        archiveMsg.type = 'privateMessage';
        archiveMsg.msgID = msg.msgID;
        archiveMsg.time = msg.time;
        archiveMsg.ttl = msg.ttl;
        archiveMsg.sender = msg.sender;
        archiveMsg.recipient = privateChannel.userId;
        archiveMsg.actualRecipient = msg.recipient;  // since we're echoing back to sender, need to store recipient.
        var encryptMessage = '', encryptData = '';
        var currentTime =  msg.time;  // use the current message time (time sent by this user)

        // encrypt the message with this users public key
        encryptMessage = cryptico.encrypt(msg.content, privateChannel.publicKey);
        archiveMsg.content = encryptMessage;

        if (msg.data !== undefined && msg.data !== null)
            encryptData = cryptico.encrypt(JSON.stringify(msg.data), privateChannel.publicKey);
        else
            encryptData = null;
        archiveMsg.data = encryptData;

        // Archive the message in this users data channel
        APP.pubnub.publish({
            channel: userDataChannel.channelId,
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
                type: 'privateMessage',
                msgID: msg.msgID,
                channelId: privateChannel.channelId,
                content: content,
                data: data,
                TTL: msg.ttl,
                time: msg.time,
                sender: msg.sender,
                recipient: msg.recipient
            };

            privateChannel.receiveMessage(parsedMsg);
           // deleteMessage(msg.sender, msg.msgID, msg.ttl);
        }
    },

    receiveMessage : function (message) {

        // Ensure that new messages get the timer
        if (message.fromHistory === undefined) {
            message.fromHistory = false;
        }

        // ignore echoed sender copies in read message
        // -- we add the message to the chat datasource at time of send
       // if (message.actualRecipient === undefined)
        channelModel.privateMessagesDS.add(message);

        // If this message is for the current channel, then display immediately
        if (message.channelId === channelView._channelId)
            channelView.messagesDS.add(message);

        //currentChannelModel.updateLastAccess();

        channelView.scrollToBottom();

        if (channelView.privacyMode) {
            kendo.fx($("#"+message.msgID)).fade("out").endValue(0.05).duration(6000).play();
        }
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
                    type: 'privateMessage',
                    recipient: recipient,
                    sender: privateChannel.userId,
                    pn_apns: {
                        aps: {
                            alert : "Private : " + userModel.currentUser.name,
                            badge: 1,
                            summary_for_mobile: "New private message..."
                        }
                    },
                    pn_gcm : {
                        data : {
                            title_for_mobile: "Private : " + userModel.currentUser.name,
                            summary_for_mobile: "New private message..."
                        }
                    },
                    msgID: msgID,
                    channelId: privateChannel.channelId,
                    content: encryptMessage,  // publish the encryptedMessage
                    data: encryptData,        // publish the encryptedData.
                    time: currentTime,
                    fromHistory: false,
                    ttl: ttl
                },
                callback: function () {
                    var parsedMsg = {
                        type: 'privateMessage',
                        recipient: recipient,
                        sender: privateChannel.userId,
                        msgID: msgID,
                        channelId: privateChannel.channelId,
                        content: content,
                        data: contentData,
                        time: currentTime,
                        fromHistory: false,
                        ttl: ttl

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

        var dataSource = channelModel.privateMessagesDS;

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
            if (content === undefined) {
                content = null;
            }
            if (msg.data !== undefined && msg.data !== null) {
                data = cryptico.decrypt(msg.data.cipher, privateChannel.RSAKey).plaintext;
                if (data === undefined) {
                    data = null;
                } else {
                    data = JSON.parse(data);
                }
            }

            if (content !== null) {
                parsedMsg = {
                    msgID: msg.msgID,
                    content: content,
                    data: data,
                    ttl: msg.ttl,
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
};