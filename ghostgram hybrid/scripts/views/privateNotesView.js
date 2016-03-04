/**
 * Created by donbrad on 3/3/16.
 *
 * privateNotesView -- display for user's private notes - My Notes...
 *
 */

'use strict';

/*
 * placesView
 */
var privateNotesView = {
    notesDS : null,


    onInit : function (e) {
        _preventDefault(e);
        privateNoteModel.init();
    },


    onShow : function (e) {
        _preventDefault(e);
    },

    onHide : function (e) {
        _preventDefault(e);
    },

    saveNote: function (text, data, ttl) {
        if (ttl === undefined || ttl < 60)
            ttl = 86400;  // 24 hours
        // if (recipient in users) {
        var content = text;
        var contentData = JSON.stringify(data);
        data = JSON.parse(contentData);
        var encryptMessage = '', encryptData = '';
        var currentTime =  ggTime.currentTime();
        var uuidNote = uuid.v4();
        var message = {
            type: 'privateNote',
            noteId: uuidNote,
            title: "",
            tagString: "",
            tags: [],
            content: content,
            data: contentData,
            dataObject: data,
            time: currentTime,
            ttl: ttl
        };


        privateNotesModel.notesDS.add(message);
        //channelView.messagesDS.add(message);
        //  channelView.scrollToBottom();

        deviceModel.syncEverlive();



    },



};