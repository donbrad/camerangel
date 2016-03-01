/**
 * Created by donbrad on 9/8/15.
 * privateChannel.js
 */


'use strict';

var privateNoteChannel = {

    thisUser: {},
    userId: '',
    users: [],
    channelId: null,
    publicKey: null,


    close: function () {

    },

    open : function () {

        privateNoteChannel.channelId = userNoteChannel._prefix + userModel.currentUser.userUUID;
        privateNoteChannel.publicKey = userModel.currentUser.publicKey;

    },

    // archive the message in the private channel with this user's public key and send to user.
    // this provides a secure roamable private sent folder without localstorage and parse...
    archiveMessage : function (msg) {
        var archiveMsg = {};
        archiveMsg.type = 'privateNote';
        archiveMsg.msgID = msg.msgID;
        archiveMsg.time = msg.time;
        archiveMsg.ttl = msg.ttl;
        archiveMsg.sender = userModel.currentUser.userUUID;
        archiveMsg.recipient = userModel.currentUser.userUUID;
        archiveMsg.channelId =  privateNoteChannel.channelId;   // private channelId is just the contacts Id;
        archiveMsg.actualRecipient = userModel.currentUser.userUUID;  // since we're echoing back to sender, need to store recipient.
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

        var parsedMsg = privateChannel.decryptMessage(msg);

        privateChannel.receiveMessage(parsedMsg);
       // deleteMessage(msg.sender, msg.msgID, msg.ttl);

    },

    decryptMessage : function (msg) {
        var RSAKey = cryptico.privateKeyFromString(userModel.currentUser.privateKey);
        var data = null;
        var content = cryptico.decrypt(msg.content.cipher, RSAKey).plaintext;
        if (msg.data !== undefined && msg.data !== null) {
            data = cryptico.decrypt(msg.data.cipher, RSAKey).plaintext;
            data = JSON.parse(data);
        }

        var parsedMsg = {
            type: 'privateMessage',
            msgID: msg.msgID,
            channelId: msg.channelId,  //For private channels, channelID is just sender ID
            content: content,
            data: data,
            TTL: msg.ttl,
            time: msg.time,
            sender: msg.sender,
            recipient: msg.recipient
        };

        return(parsedMsg);
    },


    receiveMessage : function (message) {

        // Ensure that new messages get the timer
        if (message.fromHistory === undefined) {
            message.fromHistory = false;
        }

        channelView.preprocessMessage(message);
        // If this message is for the current channel, then display immediately
        if (channelView._active && message.channelId === channelView._channelId) {
            channelModel.updateLastAccess(channelView._channelId, null);
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
        } else {
            // Is there a private channel for this sender?
            channelModel.confirmPrivateChannel(message.channelId);
            channelModel.incrementUnreadCount(message.channelId, 1, null);
        }

        userDataChannel.messagesDS.add(message);
        userDataChannel.messagesDS.sync();

        channelView.scrollToBottom();

        if (channelView.privacyMode) {
            kendo.fx($("#"+message.msgID)).fade("out").endValue(0.05).duration(6000).play();
        }
    },


    sendMessage: function (recipient, text, data, ttl) {
        if (ttl === undefined || ttl < 60)
            ttl = 86400;  // 24 hours
        // if (recipient in users) {
        var content = text;
        var contentData = data;
        var encryptMessage = '', encryptData = '';
        var currentTime =  ggTime.currentTime();

        if (text === undefined || text === null)
            text = '';
        encryptMessage = cryptico.encrypt(text, privateNoteChannel.publicKey);
        if (data !== undefined && data !== null)
            encryptData = cryptico.encrypt(JSON.stringify(data), privateNoteChannel.publicKey);
        else
            encryptData = null;

        APP.pubnub.uuid(function (msgID) {

            var message = {
                type: 'privateNote',
                recipient: recipient,
                sender: userModel.currentUser.userUUID,
                msgID: msgID,
                channelId: userModel.currentUser.userUUID,
                content: encryptMessage,  // publish the encryptedMessage
                data: encryptData,        // publish the encryptedData.
                time: currentTime,
                fromHistory: false,
                ttl: ttl
            };

            APP.pubnub.publish({
                channel: recipient,
                message: message,
                error: userDataChannel.channelError,
                callback: function (m) {
                    var status = m[0], statusText = m[1];

                    if (status !== 1) {
                        mobileNotify("Private Note Publish error "  + statusText);
                    }

                    // Store a local copy of the sent message.  Need to update channelId :
                    // for the recipient, its this users uuid.
                    // for the sender, it's the recipients uuid
                    var parsedMsg = {
                        type: 'privateNote',
                        recipient: userModel.currentUser.userUUID,
                        sender: userModel.currentUser.userUUID,
                        msgID: message.msgID,
                        channelId: userModel.currentUser.userUUID,
                        content: content,
                        data: contentData,
                        time: currentTime,
                        ttl: ttl

                    };


                    userNoteChannel.notesDS.add(parsedMsg);
                    userNoteChannel.notesDS.sync();
                    channelView.scrollToBottom();

                }
            });
        });

    },


    getMessageHistory: function (callBack) {

        var dataSource = userNoteChannel.notesDS;
        var messages = dataSource.data();

        callBack(messages);

     }
};