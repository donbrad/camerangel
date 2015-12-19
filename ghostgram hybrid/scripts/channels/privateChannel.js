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
    contactId : '',
    contactKey: '',
    contactName : '',
    last24hours : 0,


    close: function () {

    },

    open : function (channelUUID, userUUID, alias, name, contactUUID, contactKey, contactName) {


        privateChannel.userId = userUUID;
        privateChannel.thisUser = {
            alias: alias,
            name: name,
            username: userUUID,
            publicKey: userModel.currentUser.get('publicKey')
        };

        privateChannel.contactId = contactUUID;
        privateChannel.contactKey = contactKey;
        privateChannel.contactName = contactName;


        // A mapping of all currently connected users' usernames userUUID's to their public keys and aliases
        privateChannel.users = new Array();
        privateChannel.users[userUUID] = privateChannel.thisUser;
        privateChannel.channelId = channelUUID;
        privateChannel.last24Hours = ggTime.lastDay();

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
        archiveMsg.channelId = msg.recipient;   // private channelId is just the contacts Id;
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

        // If this message is for the current channel, then display immediately
        if (channelView._active && message.channelId === channelView._channelId) {
            channelModel.updateLastAccess(channelView._channelId, null);
            channelView.messagesDS.add(message);
            channelView.scrollToBottom();
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
        encryptMessage = cryptico.encrypt(text, privateChannel.contactKey);
        if (data !== undefined && data !== null)
            encryptData = cryptico.encrypt(JSON.stringify(data), privateChannel.contactKey);
        else
            encryptData = null;

        APP.pubnub.uuid(function (msgID) {
            var notificationString = "Private : " + userModel.currentUser.name;
            var message = {
                type: 'privateMessage',
                recipient: recipient,
                sender: userModel.currentUser.userUUID,
                pn_apns: {
                    aps: {
                        alert : notificationString,
                        badge: 1,
                        'content-available' : 1
                    },
                    target: '#channel?channelId=' + privateChannel.userId,
                    channelId : privateChannel.userId,
                    isMessage: true,
                    isPrivate: true
                },
                pn_gcm : {
                    data : {
                        title: notificationString,
                        message: 'Private Message from ' + userModel.currentUser.name,
                        target: '#channel?channelId=' + privateChannel.userId,
                        image: "icon",
                        channelId : privateChannel.userId,
                        isMessage: true,
                        isPrivate: true
                    }
                },
                msgID: msgID,
                channelId: privateChannel.userId,
                content: encryptMessage,  // publish the encryptedMessage
                data: encryptData,        // publish the encryptedData.
                time: currentTime,
                fromHistory: false,
                ttl: ttl
            };

            APP.pubnub.publish({
                channel: privateChannel.contactId,
                message: message,
                callback: function (m) {
                    var status = m[0], statusText = m[1];

                    if (status !== 1) {
                        mobileNotify("Private Channel Publish error "  + statusText);
                    }

                    // Store a local copy of the sent message.  Need to update channelId :
                    // for the recipient, its this users uuid.
                    // for the sender, it's the recipients uuid
                    var parsedMsg = {
                        type: 'privateMessage',
                        recipient: message.recipient,
                        sender: userModel.currentUser.userUUID,
                        msgID: message.msgID,
                        channelId: message.recipient, //
                        content: content,
                        data: contentData,
                        time: currentTime,
                        fromHistory: false,
                        ttl: ttl

                    };

                    channelModel.updateLastAccess(parsedMsg.channelId, null);
                    channelView.messagesDS.add(parsedMsg);
                    userDataChannel.messagesDS.add(parsedMsg);
                    userDataChannel.messagesDS.sync();

                }
            });
        });

    },


    getMessageHistory: function (callBack) {

        var dataSource = userDataChannel.messagesDS;
        var queryCache = dataSource.filter();
        if (queryCache === undefined) {
            queryCache = [];
        }

        privateChannel.last24Hours = ggTime.lastDay();
        dataSource.filter(
            [
            { field: "channelId", operator: "eq", value: privateChannel.channelId },
            { field: "time", operator: "gte", value:  privateChannel.last24Hours}
        ]);

        var messages = dataSource.view();
        var clearMessageArray = [];

        for(var i = 0; i < messages.length; i++) {
            var msg = messages[i];

            if (msg.sender === undefined)
                msg.sender = privateChannel.channelId;

            clearMessageArray.push(msg);
        }

        dataSource.filter(queryCache);

        if(callBack)
            callBack(clearMessageArray);

        userDataChannel.removeExpiredMessages();

     }
};