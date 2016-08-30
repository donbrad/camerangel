/**
 * Created by donbrad on 9/8/15.
 * privateChannel.js
 */


'use strict';

var privateChannel = {

    _class : 'private',
    _version : 1,
    _message : 'message',
    _alert : 'alert',
    _recallMessage : 'recallmessage',
    _recallPhoto : 'recallphoto',
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
    deferredDS : new kendo.data.DataSource(),



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


    receiveHandler : function (msg) {

        if (msg.msgType === undefined) {
            msg.msgType = privateChannel._message;
        }

        if (msg.version === undefined) {
            return;
        }

        switch (msg.msgType) {

            case privateChannel._message :
                privateChannel.receiveMessage(msg);
                break;

            case privateChannel._alert :
                privateChannel.doAlertMessage(msg);
                break;

            case privateChannel._recallMessage :
                privateChannel.doRecallMessage(msg);
                break;

            case privateChannel._recallPhoto :
                privateChannel.doRecallPhoto(msg);
                break;


        }

    },

    alertMessage : function (channelId, alertText) {

    },

    recallMessage : function (channelId, messageId) {
        var currentTime =  ggTime.currentTime();

        var msgID = uuid.v4();

        var thisMessage = {
            msgID: msgID,
            version : privateChannel._version,
            msgClass : privateChannel._class,
            msgType : privateChannel._recallMessage,
            channelUUID : channelId,
            sender: userModel._user.userUUID,
            senderName :  userModel._user.name,
            messageId : messageId
        };

        if (!deviceModel.isOnline()) {

            thisMessage.wasSent = false;
            privateChannel.deferredDS.add(thisMessage);
            return;
        }

        APP.pubnub.publish({
            channel: channelId,
            message: thisMessage,
            callback: function (m) {
                if (m === undefined)
                    return;

                var status = m[0], message = m[1], time = m[2];

                if (status !== 1) {
                    mobileNotify('Group Channel publish error: ' + message);
                }

            }
        });
    },


    recallPhoto : function (channelId, photoId) {
        var currentTime =  ggTime.currentTime();

        var msgID = uuid.v4();

        var thisMessage = {
            msgID: msgID,
            version : privateChannel._version,
            msgClass : privateChannel._class,
            msgType : privateChannel._recallPhoto,
            channelUUID : channelId,
            sender: userModel._user.userUUID,
            senderName :  userModel._user.name,
            photoId : photoId
        };

        if (!deviceModel.isOnline()) {

            thisMessage.wasSent = false;
            privateChannel.deferredDS.add(thisMessage);
            return;
        }

        APP.pubnub.publish({
            channel: channelId,
            message: thisMessage,
            callback: function (m) {
                if (m === undefined)
                    return;

                var status = m[0], message = m[1], time = m[2];

                if (status !== 1) {
                    mobileNotify('recall photo publish error: ' + message);
                }

            }
        });
    },

    doAlertMessage : function (msg) {

    },

    doRecallPhoto : function (msg) {
        var recallObj = {type: 'photo', channelId: msg.channelUUID, photoId : channel.photoId};
        channelModel.recallDS.add(recallObj);
    },

    doRecallMessage : function (msg) {
        var recallObj = {type: 'message', channelId: msg.channelUUID, messageId : channel.msgID};

        channelModel.recallDS.add(recallObj);
    },

    decryptMessage : function (msg) {

        var data = null;
        
        var content = null;
        
        if (msg.contentBlob.cipher !== undefined) {
            content = userDataChannel.decryptBlock(msg.contentBlob.cipher);
        } else {
            content = userDataChannel.decryptBlock(msg.contentBlob);
        }

        if (content === undefined) {
            content = "<p>Unable to decrypt messages...</p>"
        }

        if (msg.dataBlob.cipher !== undefined) {
            data = userDataChannel.decryptBlock(msg.dataBlob.cipher);
        } else {
            data = userDataChannel.decryptBlock(msg.dataBlob);
        }

        if (data !== undefined) {
            data = JSON.parse(data);
        } else {
            data = {};
        }
        if (msg.msgClass === undefined) {
            msg.msgClass = privateChannel._class;
        }

        if (msg.msgType === undefined) {
            msg.msgType = privateChannel._message;
        }
        
        var parsedMsg = {
            type: 'privateMessage',
            msgID: msg.msgID,
            msgClass : msg.msgClass,
            msgType : msg.msgType,
            channelUUID: msg.channelUUID,  //For private channels, channelUUID is just sender ID
            contentBlob: msg.contentBlob,
            content: content,
            dataBlob: msg.dataBlob,
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

        if (msg.sender !== userModel._user.userUUID) {
            // The user is a recipient.  Set the channelUUID to the sender id
            msg.channelUUID = msg.sender;

        }
        // Archive the encrypted message
        userDataChannel.archiveMessage(msg);

        var message = privateChannel.decryptMessage(msg);
        // Add the message to the archive

        channelModel.updateLastMessageTime(channelView._channelUUID, null);

        if (message.msgClass === undefined) {
            message.msgClass = privateChannel._class;
        }

        if (message.msgType === undefined) {
            message.msgType = privateChannel._message;
        }


        // If this message is for the current channel, then display immediately
        if (channelView._active && msg.channelUUID === channelView._channelUUID) {

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
            channelModel.updatePrivateUnreadCount(message.channelUUID, 1);
        }

        // create the blob and delete the offending key word before we ask kendo to save


    },

    processDeferred : function () {
        var len = privateChannel.deferredDS.total();

        if (len > 0) {
            for (var i=0; i<len; i++) {
                if (deviceModel.isOnline()) {
                    var msg = privateChannel.deferredDS.at(i);
                    privateChannel.deferredSend(msg);
                    privateChannel.deferredDS.remove(msg);
                }
            }
        }
    },


    sendMessage: function (recipient, text, data, ttl, deferredTime) {
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
            encryptData = userDataChannel.encryptBlockWithKey(JSON.stringify(data), privateChannel.contactKey);
        else
            encryptData = null;



        var msgID = uuid.v4();

        var notificationString = "Message from: " + userModel._user.name;
        var message = {
            msgID: msgID,
            version : privateChannel._version,
            msgClass : privateChannel._class,
            msgType : privateChannel._message,
            type: 'privateMessage',
            recipient: recipient,
            sender: userModel._user.userUUID,
            wasSent : false,
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

            channelUUID: privateChannel.userId,
            contentBlob: encryptMessage,  // publish the encryptedMessage
            dataBlob: encryptData,        // publish the encryptedData.
            time: currentTime,
            fromHistory: false,
            ttl: ttl
        };

        if (deferredTime !== undefined) {
            message.deferredFrom = deferredTime;

        }

        if (!deviceModel.isOnline()) {

            privateChannel.deferredDS.add(message);
            userDataChannel.archiveMessage(message);

            // Add the clear content to the message before passing to channelview
            message.data = contentData;
            message.content = content;
            channelView.preprocessMessage(message);
            channelView.messagesDS.add(message);
            return;
        }

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
                if (message.msgClass === undefined) {
                    message.msgClass = privateChannel._class;
                }

                if (message.msgType === undefined) {
                    message.msgType = privateChannel._message;
                }

                // Encrypt the send message with this users key...
                message.dataBlob = userDataChannel.encryptBlockWithKey(JSON.stringify(data), userModel._user.publicKey);
                message.contentBlob = userDataChannel.encryptBlockWithKey(JSON.stringify(text), userModel._user.publicKey);
                userDataChannel.archiveMessage(message);


                var parsedMsg = {
                    type: 'privateMessage',
                    recipient: message.recipient,
                    sender: userModel._user.userUUID,
                    msgID: message.msgID,
                    msgClass : message.msgClass,
                    msgType: message.msgType,
                    channelUUID: message.recipient,
                    contentBlob: message.contentBlob,
                    content: content,
                    dataBlob: message.dataBlob,
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


                channelView.scrollToBottom();

            }
        });

    },


    deferredSend : function (message) {
        var recipient = message.recipient;

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
                if (message.msgClass === undefined) {
                    message.msgClass = privateChannel._class;
                }

                if (message.msgType === undefined) {
                    message.msgType = privateChannel._message;
                }


                var savedMessage = userDataChannel.findMessage(message.msgID);

                if (savedMessage === null) {
                    ggError("Deferred message - can't find message " + message.msgID);
                } else {
                    savedMessage.set("wasSent", true);
                    savedMessage.set("actualSend", ggTime.currentTimeInSeconds());
                }
                var chatMessage = channelView.findMessageById(message.msgID);

                if (chatMessage !== undefined && chatMessage !== null) {
                    chatMessage.set('wasSent', true);
                    chatMessage.set("actualSend", ggTime.currentTimeInSeconds());
                }

            }
        });
    },

    getMessageHistory: function (channelUUID, callBack) {


        var messages = userDataChannel.queryMessages( [{ field: "channelUUID", operator: "eq", value: channelUUID }]);

        var clearMessageArray = [];

        // Does this channel have recalled messages
        var recalledMessages = channelModel.getRecalledMessages(channelUUID);

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