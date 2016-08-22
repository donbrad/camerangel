/**
 * Created by donbrad on 9/8/15.
 * privateChannel.js
 */


'use strict';

var privateChannel = {

    thisUser: {},
    userId: '',
    users: [],
    channelUUID: '',
    contactId : '',
    contactKey: '',
    publicKey : null,
    contactName : '',
    last72hours : 0,
    RSAKey : null,



    close: function () {

    },

    open : function ( userUUID, alias, name, contactUUID, contactKey, contactName) {


        privateChannel.userId = userUUID;
        privateChannel.thisUser = {
            alias: alias,
            name: name,
            username: userUUID,
            publicKey: userModel._user.get('publicKey')
        };

        privateChannel.contactId = contactUUID;
        privateChannel.contactKey = contactKey;
        privateChannel.contactName = contactName;


        // A mapping of all currently connected users' usernames userUUID's to their public keys and aliases
        privateChannel.users = new Array();
        privateChannel.users[userUUID] = privateChannel.thisUser;
        privateChannel.channelUUID = contactUUID;
        privateChannel.publicKey = userModel._user.get('publicKey');
        privateChannel.RSAKey = cryptico.privateKeyFromString(userModel.privateKey);
        privateChannel.last72Hours = ggTime.last72Hours();

    },

    // archive the message in the private channel with this user's public key and send to user.
    // this provides a secure roamable private sent folder without localstorage and parse...
/*
    archiveMessage : function (msg) {
        var archiveMsg = {};
        archiveMsg.type = 'privateMessage';
        archiveMsg.msgID = msg.msgID;
        archiveMsg.time = msg.time;
        archiveMsg.ttl = msg.ttl;
        archiveMsg.sender = msg.sender;
        archiveMsg.recipient = privateChannel.userId;
        archiveMsg.channelUUID = msg.recipient;   // private channelUUID is just the contacts Id;
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
            channel: userDataChannel.channelUUID,
            message: archiveMsg,
            error: function (error) {
                mobileNotify("Archive message error : " + error);
            }
        });

    },
*/

    receiveHandler : function (msg) {


        privateChannel.receiveMessage(msg);
       // deleteMessage(msg.sender, msg.msgID, msg.ttl);

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
            type: 'privateMessage',
            msgID: msg.msgID,
            channelUUID: msg.channelUUID,  //For private channels, channelUUID is just sender ID
            content: content,
            data: data,
            TTL: msg.ttl,
            time: msg.time,
            sender: msg.sender,
            recipient: msg.recipient
        };

        return(parsedMsg);
    },


    receiveMessage : function (msg) {

        // Ensure that new messages get the timer
        if (msg.fromHistory === undefined) {
            msg.fromHistory = false;
        }

        // Add the message to the archive
        userDataChannel.addMessage(msg);
        channelModel.updateLastMessageTime(channelView._channelUUID, null);
        
        // If this message is for the current channel, then display immediately
        if (channelView._active && msg.channelUUID === channelView._channelUUID) {
            var message = privateChannel.decryptMessage(msg);

            channelView.preprocessMessage(message);
            channelModel.updateLastAccess(channelView._channelUUID, null);
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
            
            channelView.scrollToBottom();

            if (channelView.privacyMode) {
                kendo.fx($("#"+message.msgID)).fade("out").endValue(0.05).duration(6000).play();
            }
        } else {
            // Is there a private channel for this sender?
            channelModel.updatePrivateUnreadCount(msg.channelUUID, 1);
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
        
        encryptMessage = userDataChannel.encryptBlockWithKey(text, privateChannel.contactKey);
        
        if (data !== undefined && data !== null)
            encryptData =userDataChannel.encryptBlockWithKey(JSON.stringify(data), privateChannel.contactKey);
        else
            encryptData = null;

        APP.pubnub.uuid(function (msgID) {
            var notificationString = "Message from: " + userModel._user.name;
            var message = {
                type: 'privateMessage',
                recipient: recipient,
                sender: userModel._user.userUUID,
                pn_apns: {
                    aps: {
                        alert : notificationString,
                        badge: 1,
                        'content-available' : 1
                    },
                    target: '#channel?channelUUID=' + privateChannel.userId,
                    channelUUID : privateChannel.userId,
                    senderId: userModel._user.userUUID,
                    isMessage: true,
                    isPrivate: true
                },
                pn_gcm : {
                    data : {
                        title: notificationString,
                        message: 'You have an new private message from ' + userModel._user.name,
                        target: '#channel?channelUUID=' + privateChannel.userId,
                        image: "icon",
                        channelUUID : privateChannel.userId,
                        senderId: userModel._user.userUUID,
                        isMessage: true,
                        isPrivate: true
                    }
                },
                msgID: msgID,
                channelUUID: privateChannel.userId,
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
                        ggError("Private Channel Publish error "  + statusText);
                    }

                    // Store a local copy of the sent message.  Need to update channelUUID :
                    // for the recipient, its this users uuid.
                    // for the sender, it's the recipients uuid
                    var parsedMsg = {
                        type: 'privateMessage',
                        recipient: message.recipient,
                        sender: userModel._user.userUUID,
                        msgID: message.msgID,
                        channelUUID: message.recipient,
                        content: content,
                        data: contentData,
                        time: message.time,
                        wasSent: true,
                        fromHistory: false,
                        ttl: ttl

                    };

                    //channelModel.updateLastAccess(parsedMsg.channelUUID, null);
                    channelModel.updateLastMessageTime(parsedMsg.channelUUID, null);
                    channelView.preprocessMessage(parsedMsg);
                    channelView.messagesDS.add(parsedMsg);
                    // archive sedn message
                    userDataChannel.archiveMessage(parsedMsg);

                    channelView.scrollToBottom();

                }
            });
        });

    },


    getMessageHistory: function (callBack) {


        var dataSource = userDataChannel.messagesDS;
        var queryCache = dataSource.filter();
        if (queryCache === undefined) {
            queryCache = {};
        }

        privateChannel.last72Hours = ggTime.last72Hours();
        dataSource.filter(
            [
            { field: "channelUUID", operator: "eq", value: privateChannel.channelUUID },
            { field: "time", operator: "gte", value:  privateChannel.last72Hours}
        ]);

        var messages = dataSource.view();
        dataSource.filter(queryCache);

        var clearMessageArray = [];

        // Does this channel have recalled messages
        var recalledMessages = channelModel.getRecalledMessages(privateChannel.channelUUID);

        if (recalledMessages.length > 0) {
            // Has recalled messages -- remove by brute force
            for(var i = 0; i < messages.length; i++) {
                var msg = messages[i];
                if (!channelModel.isMessageRecalled(msg.msgID))
                    clearMessageArray.push(msg);
            }
            messages = clearMessageArray;
        }

        for (var m=0; m<messages.length; m++) {
            var message  = privateChannel.decryptMessage(messages[m]);
            messages[m] = message;
        }


        if (callBack)
            callBack(messages);





     }
};