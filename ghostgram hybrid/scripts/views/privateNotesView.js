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
    _titleTagActive: false,
    _editorActive: false,


    onInit : function (e) {
        _preventDefault(e);

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

    toggleTitleTag : function () {

        if (this._titleTagActive)
            $('#privateNoteTitleTag').removeClass('hidden');
        else
            $('#privateNoteTitleTag').addClass('hidden');
    },

    noteTitleTag : function (e) {
        _preventDefault(e);

        this._titleTagActive = !this._titleTagActive;
        this.toggleTitleTag();
    },

    activateEditor : function () {

        $("#privateNoteToolbar").removeClass('hidden');
        $("#privateNote-editorBtnImg").attr("src","images/icon-editor-active.svg");

    },

    deactivateEditor : function () {

        $("#privateNoteToolbar").addClass('hidden');
        $("#privateNote-editorBtnImg").attr("src","images/icon-editor.svg");

    },

    openEditor : function () {
        if (this._editorActive === false) {

            this._editorActive = true;

            $('#privateNoteTextArea').redactor({
                minHeight: 36,
                maxHeight: 360,
                focus: true,
                placeholder: 'Add Note...',
                /* callbacks: {
                 change: function(e)
                 {
                 $('#messageTextArea').focus();
                 }
                 },*/
                buttons: ['bold', 'italic', 'lists', 'horizontalrule'],
                plugins: ['source'],
                toolbarExternal: '#privateNoteToolbar'
            });
        }

    },


    closeEditor : function () {

        if (this._editorActive) {

            this._editorActive = false;
            $('#privateNoteTextArea').redactor('core.destroy');
        }

        $("#privateNoteToolbar").addClass('hidden');

    },

    noteEditor : function (e) {
        _preventDefault(e);
        this._editorActive = !this._editorActive;
        if (this._editorActive){
            this.activateEditor();

        } else {
            this.deactivateEditor();
        }
    },

    noteSearch : function (e) {
        _preventDefault(e);
    },

    addEvent : function (e) {
        _preventDefault(e);
    },

    addMovie : function (e) {
        _preventDefault(e);
    },

    addCamera : function (e) {
        _preventDefault(e);
    },

    addPhoto : function (e) {
        _preventDefault(e);
    },

    addGallery : function (e) {
        _preventDefault(e);
    },

    deleteNote : function (e) {
        _preventDefault(e);
    },

    editNote : function (e) {
        _preventDefault(e);
    },

    shareNote : function (e) {
        _preventDefault(e);
    }



};