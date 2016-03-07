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
    topOffset: 0,
    notesDS : null,
    activeNote: {},
    noteObjects: [],
    _titleTagActive: false,
    _editorActive: false,


    onInit : function (e) {
        _preventDefault(e);

        $("#privateNoteView-listview").kendoMobileListView({
            dataSource: privateNoteModel.notesDS,
            template: $("#messagesTemplate").html()

        }).kendoTouch({
            filter: "li",
            tap: privateNotesView.tapNote,
            hold: privateNotesView.holdNote
        });

    },

    // Initialize the channel specific view data sources.
    noteInit : function () {
        privateNotesView.noteObjects = [];
        privateNotesView.activeNote = {objects: []};
    },

    onShow : function (e) {
        _preventDefault(e);
        ux.hideKeyboard();
        privateNotesView.openEditor();
    },

    onHide : function (e) {
        _preventDefault(e);
        privateNotesView.closeEditor();
    },

    saveNote: function () {

    },

    _saveNote: function (text, data, ttl) {
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

        privateNoteModel.notesDS.add(message);
        //channelView.messagesDS.add(message);
        //  channelView.scrollToBottom();

        deviceModel.syncEverlive();



    },

    toggleTitleTag : function () {

        if (privateNotesView._titleTagActive)
            $('#privateNoteTitleTag').removeClass('hidden');
        else
            $('#privateNoteTitleTag').addClass('hidden');
    },

    noteTitleTag : function (e) {
        _preventDefault(e);

        privateNotesView._titleTagActive = !privateNotesView._titleTagActive;
        privateNotesView.toggleTitleTag();
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
        if (privateNotesView._editorActive === false) {

            privateNotesView._editorActive = true;

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
        if (privateNotesView._editorActive) {
            privateNotesView._editorActive = false;
            $('#privateNoteTextArea').redactor('core.destroy');
        }

        $("#privateNoteToolbar").addClass('hidden');

    },

    noteEditor : function (e) {
        _preventDefault(e);
        privateNotesView._editorActive = !privateNotesView._editorActive;
        if (privateNotesView._editorActive){
            privateNotesView.activateEditor();

        } else {
            privateNotesView.deactivateEditor();
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
    },

    updateTimeStamps: function () {
        $("#privateNote-listview").data("kendoMobileListView").refresh();
        $("#privateNote-listview").data("kendoMobileListView").scroller().reset();
        privateNotesView.scrollToBottom();

    },

    // Handle a click on a smart object
    onNoteClick : function (e) {
        _preventDefault(e);
/*
        var uuid = e.sender.element[0].attributes['data-objectid'].value, id = e.sender.element[0].id;
        var chatmessage = $('#'+id).closest('.chat-message');
        var messageId = chatmessage[0].attributes.id.value;

        if (messageId === null) {
            mobileNotify("Sender deleted this Smart Event!");
            return;
        }

        var message = channelView.findMessageById(messageId);

        if (message !== undefined) {

            if (message.data.objects !== undefined && message.data.objects.length > 0) {
                var objectList = message.data.objects,object = null;

                for (var i=0; i<objectList.length; i++ ) {
                    if (objectList[i].uuid === uuid) {
                        object = objectList[i];
                    }
                }

                if (object !== null) {
                    // User is interacting with the object so add it, if it doesn't already exist
                    if (object.ggType === 'Event') {
                        smartEvent.smartAddEvent(object);
                        smartEventView.openModal(object);
                    } else if (object.ggType === 'Movie') {
                        smartMovie.smartAddMovie(object);
                        smartMovieView.openModal(object);
                    }

                }

            } else {
                mobileNotify("Sender deleted this Smart Event!");
            }
        }
*/

    },

    addSmartEventToNote: function (smartEvent, note) {

        //  var editor = $("#messageTextArea").data("kendoEditor");
        var date = new Date(smartEvent.date).toLocaleString(), objectId = smartEvent.uuid;

        var dateStr = moment(date).format('ddd MMM Do');
        var localTime = moment(date).format("LT");

        var placeName = smartEvent.placeName;
        if(placeName === null){
            placeName = "";
        }

        var objectUrl = '<div><span class="btnSmart" data-role="button" data-objectid="' + objectId +
            '" id="chatobject_' + objectId + '"'+
            'data-click="channelView.onObjectClick" >' +
            '<span class="btnSmart-content">' +
            '<span class="btnSmart-title">' + smartEvent.title + ' </span><br /> ' +
            '<span class="btnSmart-date">' + dateStr + ' at ' + localTime + '</span><br /> ' +
            '<span class="btnSmart-date">' + placeName + '</span> ' +
            '</span>' +
            '<span class="btnSmart-type">' +
            '<img src="images/smart-event-test.svg" class="icon-smartBtn" />' +
            '</span>' +
            '</span></div>';

        var fullMessage = note + objectUrl;

        privateNotesView.activeNote.objects.push(smartEvent);

        return (fullMessage);

    },

    addSmartMovieToNote: function (smartMovie, note) {

        //  var editor = $("#messageTextArea").data("kendoEditor");
        var date = smartMovie.showtime, objectId = smartMovie.uuid;

        var dateStr = moment(date).format('ddd MMM Do h:mm A');

        var objectUrl = '<div><span class="btnSmart-movie" data-role="button" data-objectid="' + objectId +
            '" id="movieobject_' + objectId + '"'+
            'data-click="channelView.onObjectClick" >' +
            '<div class="btnSmart-poster">' +
            '<img src="' + smartMovie.imageUrl + '" class="btnSmart-img" />' +
            '</div>' +
            '<div class="btnSmart-content">' +
            '<p class="btnSmart-title">' + smartMovie.movieTitle + ' </p> ' +
            '<p class="btnSmart-date textClamp">' + dateStr + '</p> ' +
            '<p class="btnSmart-date textClamp">' + smartMovie.theatreName + '</p> ' +
            '</div>' +
            '<span class="btnSmart-type">' +
            '<img src="images/smart-movie-circle.svg" />' +
            '</span>' +
            '</span></div>';

        var fullMessage = note + objectUrl;

        privateNotesView.activeNote.objects.push(smartMovie);

        return (fullMessage);

    },

    scrollToBottom : function () {
        // topOffset set when the view loads like the following
        var topOffset = privateNotesView.topOffset;

        if (topOffset === undefined)
            topOffset = APP.kendo.scroller().scrollTop;

        var position = 0;
        var scrollerHeight =  APP.kendo.scroller().scrollHeight();
        var viewportHeight =  APP.kendo.scroller().height();

        if (scrollerHeight > viewportHeight) {
            position = -1 * (scrollerHeight - viewportHeight - topOffset);
            // APP.kendo.scroller().animatedScrollTo(0, position);
        } //else {
        APP.kendo.scroller().scrollTo(0, position);
        // }

    },

    updateNoteTimeStamps : function () {
        var dataSource = privateNoteModel.notesDS, length = dataSource.total();
        var formattedTime = '';

        for (var i=0; i<length; i++) {
            var msg = dataSource.at(i);
            formattedTime = timeSince(msg.time);
            if(formattedTime === "0 seconds"){
                formattedTime = "Just now";
            } else {
                formattedTime = formattedTime + " ago"
            }
            msg.set('formattedTime', formattedTime);
        }

    },


    noteAddLocation : function  () {
        channelView.activeMessage.geo= {lat: mapModel.lat, lng: mapModel.lng};
        channelView.activeMessage.address = mapModel.currentAddress;
        if (userModel.currentUser.currentPlaceUUID !== null) {
            channelView.activeMessage.place = {name: userModel.currentUser.currentPlace, uuid: userModel.currentUser.currentPlaceUUID};
        }
    },


    noteAddSmartEvent : function (smartObj) {


        smartEvent.smartAddEvent(smartObj);

        privateNotesView.noteObjects.push(smartObj);

    },

    noteAddSmartMovie : function (smartObj) {

        smartMovie.smartAddMovie(smartObj);

        privateNotesView.noteObjects.push(smartObj);

    },
    messageSearch : function (e) {
        _preventDefault(e);


        var searchUrl =  'http://www.google.com/search';
        var query = channelView.getSelectionText();

        if (query !== '') {
            searchUrl += '?q='+query;
        }
        channelView.searchUrl = searchUrl;
        channelView.winQuery = '?q='+query;
        channelView.winRef =  window.open(encodeURI(searchUrl), '_blank', 'location=yes');
        channelView.winRef.addEventListener("exit", channelView.messageSearchEnd);
        channelView.winRef.addEventListener("loadstop", channelView.messageSearchLoad);
        /* channelView.winRef.addEventListener('loaderror', channelView.messageSearchError); */


    },

    messageCamera : function (e) {
        _preventDefault(e);

        devicePhoto.deviceCamera(
            1600, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            channelView._channelId,  // Current channel Id for offers
            channelView.addImageToMessage  // Optional preview callback
        );
    },

    messagePhoto : function (e) {
        _preventDefault(e);
        // Call the device gallery function to get a photo and get it scaled to gg resolution
        devicePhoto.deviceGallery(
            1600, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            channelView._channelId,  // Current channel Id for offers
            channelView.addImageToMessage  // Optional preview callback
        );
    },

    messageGallery : function (e) {
        _preventDefault(e);

        galleryPicker.openModal(function (photo) {

            // photoModel.addPhotoOffer(photo.photoId, channelView._channelId,  photo.thumbnailUrl, photo.imageUrl, true);

            var url = photo.thumbnailUrl;
            if (photo.imageUrl !== undefined && photo.imageUrl !== null)
                url = photo.imageUrl;

            channelView.addImageToMessage(photo.photoId, url);
        });
        //  APP.kendo.navigate("views/gallery.html#gallery?mode=picker");

    },

    getSelectionText: function (event){
        var selectedText = "";
        if (window.getSelection){ // all modern browsers and IE9+
            selectedText = window.getSelection().toString();
        }
        return selectedText;
    },


    noteCalendar : function (e) {
        _preventDefault(e);
        //channelView.messageMenuTag();
        smartEventView.openModal(null, function (event) {

            privateNotesView.noteAddSmartEvent(event);
            mobileNotify("Sending Smart Event...");
            privateNotesView.messageSend();
        });
    },


    noteMovie : function (e) {
        _preventDefault(e);
        movieListView.openModal( null, function (movie) {
            if (movie !== null) {
                privateNotesView.noteAddSmartMovie(movie);
                mobileNotify("Sending Smart Movie...");
                privateNotesView.noteSave();
            }
        });
    },

    noteEvent : function (e) {
        _preventDefault(e);
        mobileNotify("Chat Event isn't wired up yet");
    },

    noteFlight : function (e) {
        _preventDefault(e);
        mobileNotify("Note Flight isn't wired up yet");
    },

    noteMusic : function (e) {
        _preventDefault(e);
        mobileNotify("Note Music isn't wired up yet");
    },

    tapNote : function (e) {
        e.preventDefault();

        var $target = $(e.touch.initialTouch);
        var dataSource = privateNotesView.notesDS;
        var noteId = null;


        if (e.touch.currentTarget !== undefined) {
            // Legacy IOS
            noteId =  $(e.touch.currentTarget).data("uid");
        } else {
            // New Android
            noteId =   e.touch.target[0].attributes['data-uid'].value;
        }

        if (messageId === undefined || messageId === null) {
            mobileNotify("No message content to display...");
        }

        var note = dataSource.getByUid(note);
        // User has clicked in message area, so hide the keyboard
        // ux.hideKeyboard();

        // User actually clicked on the photo so show the open the photo viewer
        if ($target.hasClass('photo-chat')) {
            // Todo: Don map chat photos to note photos -- ?convert photos from data to objects.
      /*      var photoId = $target.attr('data-photoId');

            // todo Don - review photos source
            if (message.data !== undefined && message.data.photos !== undefined) {
                var photoList = message.data.photos;

                for (var i=0; i< photoList.length; i++) {
                    var photoObj = photoList[i];

                    if (photoObj.photoId === photoId) {
                        modalChatPhotoView.openModal(photoObj);
                        return;
                    }
                }
            }*/


        }

    },

    holdNote : function (e) {
        e.preventDefault();
        var dataSource = privateNoteModel.notesDS;
        var noteUID = $(e.touch.currentTarget).data("uid");
        var note = dataSource.getByUid(noteUID);
        privateNotesView.activeNote = note;

        $("#privateNoteViewActions").data("kendoMobileActionSheet").open();

    }





};