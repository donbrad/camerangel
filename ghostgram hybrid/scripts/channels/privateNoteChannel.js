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

    decryptMessage : function (msg) {
        var RSAKey = cryptico.privateKeyFromString(userModel.currentUser.privateKey);
        var data = null;
        var content = cryptico.decrypt(msg.content.cipher, RSAKey).plaintext;
        if (msg.data !== undefined && msg.data !== null) {
            data = cryptico.decrypt(msg.data.cipher, RSAKey).plaintext;
            data = JSON.parse(data);
        }

        var parsedMsg = {
            type: 'privateNote',
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

    sendMessage: function (recipient, text, data, ttl) {
        if (ttl === undefined || ttl < 60)
            ttl = 86400;  // 24 hours
        // if (recipient in users) {
        var content = text;
        var contentData = data;
        var encryptMessage = '', encryptData = '';
        var currentTime =  ggTime.currentTime();


        APP.pubnub.uuid(function (msgID) {

            var message = {
                type: 'privateNote',
                recipient: userModel.currentUser.userUUID,
                sender: userModel.currentUser.userUUID,
                msgID: msgID,
                title: "",
                tagString: "",
                tags: [],
                channelId: userModel.currentUser.userUUID,
                content: content,
                data: contentData,       
                time: currentTime,
                fromHistory: false,
                ttl: ttl
            };


            userNoteChannel.notesDS.add(message);
            userNoteChannel.notesDS.sync();
            channelView.scrollToBottom();

        });

    },


    getMessageHistory: function (callBack) {

        var dataSource = userNoteChannel.notesDS;
        var messages = dataSource.data();

        callBack(messages);

     }
};