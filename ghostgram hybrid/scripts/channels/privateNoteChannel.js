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

    sendMessage: function (text, data, ttl) {
        if (ttl === undefined || ttl < 60)
            ttl = 86400;  // 24 hours
        // if (recipient in users) {
        var content = text;
        var contentData = JSON.stringify(data);
        data = JSON.parse(contentData);
        var encryptMessage = '', encryptData = '';
        var currentTime =  ggTime.currentTime();

        var message = {
            type: 'privateNote',
            id: uuid.v4(),
            title: "",
            tagString: "",
            tags: [],
            content: content,
            data: contentData,
            dataObject: data,
            time: currentTime,
            ttl: ttl
        };

        channelView.messagesDS.add(message);
        userNoteChannel.notesDS.add(message);
        //userNoteChannel.notesDS.sync();
        channelView.scrollToBottom();



    },


    getMessageHistory: function (callBack) {

        var dataSource = userNoteChannel.notesDS;
        var messages = dataSource.data();

        callBack(messages);

     }
};