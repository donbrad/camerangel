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
    activeNote: {objects: [], photos: []},
    noteObjects: [],
    notePhotos: [],
    _titleTagActive: false,
    _editorActive: false,
    _editorExpanded : false,
    _editMode: false,
    _editorView: false,

    onInit : function (e) {
        _preventDefault(e);

        $("#privateNotesView-listview").kendoMobileListView({
            dataSource: privateNoteModel.notesDS,
            template: $("#privateNote-template").html()

        }).kendoTouch({
            filter: "li",
            tap: privateNotesView.tapNote,
            hold: privateNotesView.holdNote
        });


        $('#privateNoteTextArea').click(function() {
            if (privateNotesView._editorExpanded)
                return;

            privateNotesView.expandEditor();
        });


        $("#privateNoteTags").kendoMultiSelect({
            placeholder: "Add tags...",
            dataTextField: "name",
            dataValueField: "uuid",
            autoBind: false,
            tagMode: "multiple",
            ignoreCase: true,
            dataSource: tagModel.tagsDS,
            select: function (e) {
                var item = e.item;
                var text = item.text();
            },
            change: function(e) {
                var value = this.value();
                // Use the value of the widget
            }
        });

        $.Redactor.prototype.clear = function()
        {
            return {
                init: function ()
                {
                    var button = this.button.add('clear', 'Clear');
                    this.button.addCallback(button, this.clear.clear);
                },
                clear: function()
                {
                   privateNotesView.noteInit();
                }
            };
        };

        $.Redactor.prototype.save = function()
        {
            return {
                init: function ()
                {
                    var button = this.button.add('save', 'Save');
                    this.button.addCallback(button, this.save.save);
                },
                save: function()
                {
                    privateNotesView.saveNote();
                }
            };
        };
    },

    // Initialize the channel specific view data sources.
    noteInit : function () {

        privateNotesView.noteObjects = [];
        privateNotesView.activeNote = {objects: [], photos:[], tags: []};
        privateNotesView._editView = false;
        privateNotesView.deactivateEditor();
       $('#privateNoteTitle').val("");
        $('#privateNoteTags').val("");
        $('#privateNoteTextArea').val('');
        $('#privateNoteTextArea').redactor('code.set', "");

    },

    onShow : function (e) {
        _preventDefault(e);
        ux.hideKeyboard();
        privateNotesView.topOffset = $("#privateNotesView-listview").data("kendoMobileListView").scroller().scrollTop;
        privateNotesView.openEditor();
    },

    onHide : function (e) {
        _preventDefault(e);
        privateNotesView.closeEditor();
    },

    expandEditor : function () {
        $('#privateNoteTextArea').css( "height","360" );
        privateNotesView._editorExpanded = true;
    },

    shrinkEditor : function ()  {
        $('#privateNoteTextArea').css( "height","36" );
        privateNotesView._editorExpanded = false;
    },

    _initTextArea : function () {

        $('#privateNoteTextArea').val('');
        $('#privateNoteTextArea').redactor('code.set', "");

        if (privateNotesView._editorActive) {
            privateNotesView._editorActive = false;
            privateNotesView.deactivateEditor();
        }

    },

    noteAddPhoto : function (photoId) {

        var photo = photoModel.findPhotoById(photoId);

        if (photo !== undefined) {

            var photoObj  = {
                photoId : photo.photoId,
                thumbnailUrl: photo.thumbnailUrl,
                imageUrl: photo.imageUrl,
                deviceUrl : photo.deviceUrl,
                cloudUrl : photo.cloudUrl,
            };
        }

        privateNotesView.notePhotos.push(photoObj);
        // photoModel.addPhotoOffer(photo.photoId, channelView._channelUUID, photo.thumbnailUrl, photo.imageUrl, canCopy);
    },


    validateNotePhotos : function () {
        var validPhotos = [];
        // var messageText = $('#messageTextArea').data("kendoEditor").value();
        var messageText = $('#privateNoteTextArea').redactor('code.get');

        for (var i=0; i< privateNotesView.notePhotos.length; i++) {
            var photoId = privateNotesView.notePhotos[i];

            if (messageText.indexOf(photoId) !== -1) {
                //the photoId is in the current message text

                privateNotesView.noteAddPhoto(photoId);

            }
        }

    },

    saveNote: function () {
        var validNote = false; // If message is valid, send is enabled
        if (privateNotesView._editMode) {
            validNote = true;
        } else {
            // Initialize the activeNote if we're not editing.
            privateNotesView.activeNote = {objects: [], photos: []};
        }


        //var text = $('#messageTextArea').val();
        //var text = $('#messageTextArea').data("kendoEditor").value();
        var text = $('#privateNoteTextArea').redactor('code.get');
        var title = $('#privateNoteTitle').val();
        var tagString =  $('#privateNoteTags').val();

        var tags = tagModel.parseTagString(tagString);


        if (text.length > 0) {
            validNote = true;
        }

        privateNotesView.activeNote.title = title;
        privateNotesView.activeNote.tagString = tagString;
        privateNotesView.activeNote.tags = tags;


        privateNotesView.noteAddLocation();

        // Are there any photos in the current message
        if (privateNotesView.notePhotos.length > 0) {
            validNote = true;

            //Need to make sure the user didn't delete the photo reference in the html...
            privateNotesView.validateNotePhotos();
        }

        if (privateNotesView.noteObjects.length > 0) {
            validNote = true;

            var smartObject = channelView.messageObjects[0];
            if (smartObject.ggType === 'Event') {
                text = privateNotesView.addSmartEventToNote(smartObject, text);
            } else if (smartObject.ggType === 'Movie') {
                text = privateNotesView.addSmartMovieToNote(smartObject, text);
            }
        }

        if (validNote === true ) {

            if (privateNotesView._editMode) {
                var activeNote = privateNotesView.activeNote;
                var note = privateNoteModel.findNote(activeNote.noteId);

                var contentData = JSON.stringify(activeNote.dataObject);
                var dataObj = JSON.parse(contentData);
                note.set('title', _cleanString(title));
                note.set('tagString', _cleanString(tagString));
                note.set('tags', tags);
                note.set('content', _cleanString(text));
                note.set('data', contentData);
                note.set('dataObject', dataObj);
                note.set('time',ggTime.currentTime());

                var Id = note.Id;
                if (Id !== undefined){
                    everlive.updateOne(privateNoteModel._cloudClass, note, function (error, data) {
                        //placeNoteModel.notesDS.remove(note);
                    });
                }



            } else {
                privateNotesView._saveNote(text, privateNotesView.activeNote);
            }

            //privateNotesView._initTextArea();

            privateNotesView.noteInit();
        }

    },

    _saveNote: function (text, data, ttl) {
        if (ttl === undefined || ttl < 60)
            ttl = 86400;  // 24 hours
        // if (recipient in users) {
        var content = text;
        var contentData = JSON.stringify(data);
        data = JSON.parse(contentData);
        var currentTime =  ggTime.currentTime();
        var uuidNote = uuid.v4();

        var ggType = 'Note';

        if (data.ggType !== undefined) {
            ggType = data.ggType;
        }
        var message = {
            Id: uuidNote,
            noteId: uuidNote,
            type: 'Note',
            ggType: ggType,
            title: _data.title,
            tagString: _data.tagString,
            tags: data.tags,
            content: content,
            data: contentData,
            dataObject: data,
            time: currentTime,
            ttl: ttl
        };

        privateNoteModel.notesDS.add(message);
        privateNoteModel.notesDS.sync();

        everlive.createOne(privateNoteModel._cloudClass, message, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating Private Note " + JSON.stringify(error));
            } else {
                // Add the everlive object with everlive created Id to the datasource

            }
        });

      //  privateNoteModel.notesDS.sync();
        privateNotesView.scrollToBottom();

        //deviceModel.syncEverlive();

    },

  /*  toggleTitleTag : function () {

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
*/
    activateEditor : function () {

        $(".redactor-editor").velocity({height: "15em"},{duration: 300});
        privateNotesView._editorView = true;
        $("#privateNoteToolbar").removeClass('hidden');
        $('#privateNoteTitleTag').removeClass('hidden');

        /*$("#privateNoteToolbar").removeClass('hidden');
        $("#privateNote-editorBtnImg").attr("src","images/icon-editor-active.svg");*/

    },

    deactivateEditor : function () {

        privateNotesView._editorView = false;
       privateNotesView.hideEditor();


    },


    hideEditor : function () {
        $(".redactor-editor").velocity({height: "3em"},{duration: 300});
        $("#privateNoteToolbar").addClass('hidden');
        $('#privateNoteTitleTag').addClass('hidden');
        ux.hideKeyboard();
    },

    openEditor : function () {
        if (privateNotesView._editorActive === false) {

            privateNotesView._editorActive = true;

            $('#privateNoteTextArea').redactor({
                minHeight: 36,
                maxHeight: 380,
                focus: false,
                imageEditable: false, // disable image edit mode on click
                imageResizable: false, // disable image resize mode on click
                placeholder: 'Add Note...',
                plugins: ['clear', 'save'],
                callbacks: {
                     paste: function(content)
                     {
                        var contentOut = '<a data-role="button" class="smart-link btnClear-link" data-click="ggSmartLink" data-url="';
                         var re = /<\s*a\s+[^>]*href\s*=\s*[\"']?([^\"' >]+)[\"' >]/;
                         var match;

                         if ((match = re.exec(content)) !== null) {
                            var url = match[1];
                             contentOut += encodeURI(url) + '"> ' + privateNotesView.searchQuery + '</a>';
                         }
                         this.selection.restore();
                         this.selection.replace("");
                         return(contentOut);
                     },

                    focus: function(e){
                        privateNotesView.activateEditor();


                    },
                    blur: function(e){
                        if (!privateNotesView._editorView) {
                            privateNotesView.deactivateEditor() ;
                        }


                    },
                    click : function (e) {

                    }
                 },

                formatting: ['p', 'blockquote', 'h1', 'h2','h3'],
                buttons: ['format', 'bold', 'italic', 'lists', 'horizontalrule'],
                toolbarExternal: '#privateNoteToolbar'
            });
        }

    },


    closeEditor : function () {
        if (privateNotesView._editorActive) {
            privateNotesView._editorActive = false;
            $('#privateNoteTextArea').redactor('core.destroy');
        }

        privateNotesView.deactivateEditor();

    },



    addEvent : function (e) {
        _preventDefault(e);
    },

    addMovie : function (e) {
        _preventDefault(e);
    },


    deleteNote : function (e) {
        _preventDefault(e);
       if (privateNotesView.activeNote.noteId !== undefined) {

           var note = privateNotesView.activeNote;
           var Id = note.Id;

           if (Id !== undefined){
               everlive.deleteOne(privateNoteModel._cloudClass, Id, function (error, data) {
                   privateNoteModel.deleteNote(privateNotesView.activeNote);
                   privateNotesView.activeNote = {objects: [], photos: []};
               });
           }           
       }

    },

    editNote : function (e) {
        _preventDefault(e);

        if (privateNotesView.activeNote.noteId !== undefined) {
            var content='<p></p>';
            if (privateNotesView.activeNote.content !== undefined) {
               content =  privateNotesView.activeNote.content;
            }
            privateNotesView._editMode = true;
            $('#privateNoteTitle').val(privateNotesView.activeNote.title);
            $('#privateNoteTags').val(privateNotesView.activeNote.tagString);
            $('#privateNoteTextArea').redactor('code.set', content);

            privateNotesView.activateEditor();
            $("#privateNoteViewActions").data("kendoMobileActionSheet").close();
        }

    },

    shareNote : function (e) {
        _preventDefault(e);

        if (window.navigator.simulator === true) {
            mobileNotify("Export and Sharing only on device...");

        } else {

            _socialShare(privateNotesView.activeNote.content, privateNotesView.activeNote.title, null, null);

            // _socialShare(null, null,  null, photoView._activePhoto.image);
        }
    },

    sendNote : function (e) {
        _preventDefault(e);
    },

    sendChatNote : function (e) {
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

        var uuid = e.sender.element[0].attributes['data-objectid'].value, id = e.sender.element[0].id;
        var note = $('#'+id).closest('.private-note');
        var noteId = note[0].attributes.id.value;

        if (noteId === null) {
            mobileNotify("Can't find this Smart Event!");
            return;
        }

        var noteObj = privateNoteModel.findNotesByObjectId(noteId);

        if (noteObj !== undefined) {

            if (noteObj.data.objects !== undefined && noteObj.data.objects.length > 0) {
                var objectList = noteObj.data.objects,object = null;

                for (var i=0; i<objectList.length; i++ ) {
                    if (objectList[i].uuid === uuid) {
                        object = objectList[i];
                    }
                }

                if (object !== null) {
                    // User is interacting with the object so add it, if it doesn't already exist
                    if (object.ggType === 'Event') {
                        smartEventView.openModal(object);
                    } else if (object.ggType === 'Movie') {
                        smartMovieView.openModal(object);
                    }

                }

            } else {
                mobileNotify("Can't find this Smart Event!");
            }
        }

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
            'data-click="privateNotesView.onObjectClick" >' +
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
            'data-click="privateNotesView.onObjectClick" >' +
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
        if (userModel._user.currentPlaceUUID !== null) {
            channelView.activeMessage.place = {name: userModel._user.currentPlace, uuid: userModel._user.currentPlaceUUID};
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

    noteSearchLoad : function (event) {
        privateNotesView.searchUrl =  event.url;
    },

    noteSearchError : function (event) {
        mobileNotify('error: ' + event.message);
    },

    noteSearchEnd : function (event) {
        var exitUrl = event.url;

        if (privateNotesView.winRef !== undefined && privateNotesView.winRef !== null) {
            privateNotesView.winRef.removeEventListener("loadstop", privateNotesView.messageSearchLoad);
            privateNotesView.winRef.removeEventListener("exit", privateNotesView.messageSearchEnd);
            privateNotesView.winRef = null;
        }

    },

    noteSearch : function (e) {
        _preventDefault(e);


        var searchUrl =  'http://www.google.com/search';
        var query = privateNotesView.getSelectionText();

        var selection =  $('#privateNoteTextArea').redactor('selection.save'); //cache the current selection


        privateNotesView.searchQuery = query;

        if (query !== '') {
            searchUrl += '?q='+query;
        }

        SafariViewController.isAvailable(function (available) {
            if (available) {
                SafariViewController.show({
                        url: encodeURI(searchUrl),
                        hidden: false, // default false. You can use this to load cookies etc in the background (see issue #1 for details).
                        animated: true, // default true, note that 'hide' will reuse this preference (the 'Done' button will always animate though)
                        transition: 'curl', // unless animated is false you can choose from: curl, flip, fade, slide (default)
                        enterReaderModeIfAvailable: true // default false
                    },
                    // this success handler will be invoked for the lifecycle events 'opened', 'loaded' and 'closed'
                    function (result) {
                        /*if (result.event === 'opened') {
                            alert('opened');
                        } else if (result.event === 'loaded') {
                            alert('loaded');
                        } else */if (result.event === 'closed') {
                           mobileNotify(query + ' closed');
                        }
                    },
                    function (msg) {
                        mobileNotify("SafariView Error : " + msg);
                    })
            } else {
                // potentially powered by InAppBrowser because that (currently) clobbers window.open
                privateNotesView.searchUrl = searchUrl;
                privateNotesView.winQuery = '?q=' + query;
                privateNotesView.winRef = window.open(encodeURI(searchUrl), '_blank', 'location=yes');
                /* privateNotesView.winRef.addEventListener("exit", privateNotesView.messageSearchEnd);
                 privateNotesView.winRef.addEventListener("loadstop", privateNotesView.messageSearchLoad);*/
                /* channelView.winRef.addEventListener('loaderror', channelView.messageSearchError); */
            }

        });

    },


    addImageToNote: function (photoId, displayUrl) {
        var photoObj = photoModel.findPhotoById(photoId);

        if (photoObj !== undefined) {

            var imgUrl = '<img class="photo-chat" data-photoid="'+ photoId + '" id="notephoto_' + photoId + '" src="'+ photoObj.deviceUrl +'" />';

            $('#privateNoteTextArea').redactor('insert.node', $('<div />').html(imgUrl));

        }

        privateNotesView.notePhotos.push(photoId);
    },

    addCamera : function (e) {
        _preventDefault(e);

        devicePhoto.deviceCamera(
            1600, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
           null,  // Current channel Id for offers
            privateNotesView.addImageToNote  // Optional preview callback
        );
    },

    addPhoto : function (e) {
        _preventDefault(e);
        // Call the device gallery function to get a photo and get it scaled to gg resolution
        devicePhoto.deviceGallery(
            1600, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            null,  // Current channel Id for offers
            privateNotesView.addImageToNote  // Optional preview callback
        );
    },

    addGallery : function (e) {
        _preventDefault(e);

        galleryPicker.openModal(function (photo) {

            var url = photo.thumbnailUrl;
            if (photo.imageUrl !== undefined && photo.imageUrl !== null)
                url = photo.imageUrl;

            privateNotesView.addImageToNote(photo.photoId, url);
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
            privateNotesView.saveNote();
        });
    },


    noteMovie : function (e) {
        _preventDefault(e);
        movieListView.openModal( null, function (movie) {
            if (movie !== null) {
                privateNotesView.noteAddSmartMovie(movie);
                mobileNotify("Sending Smart Movie...");
                privateNotesView.saveNote();
            }
        });
    },

    noteEvent : function(e) {
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
       // e.preventDefault();

        // User has clicked in message area, so hide the keyboard
       privateNotesView.hideEditor();


        var $target = $(e.touch.initialTouch);
        var dataSource = privateNoteModel.notesDS;
        var noteId = null;


        if (e.touch.currentTarget !== undefined) {
            // Legacy IOS
            noteId =  $(e.touch.currentTarget).data("uid");
        } else {
            // New Android
            noteId =   e.touch.target[0].attributes['data-uid'].value;
        }

        if (noteId === undefined || noteId === null) {
            mobileNotify("No Note content to display...");
        }

        var note = dataSource.getByUid(noteId);

        if (note !== undefined) {
            privateNotesView.activeNote = note;
        }

        // User actually clicked on the photo so show the open the photo viewer
        if ($target.hasClass('photo-chat')) {

            var photoId = $target.attr('data-photoId');

            if (message.data !== undefined && message.data.photos !== undefined) {
                var photoList = message.data.photos;

                for (var i=0; i< photoList.length; i++) {
                    var photoObj = photoList[i];

                    if (photoObj.photoId === photoId) {
                        modalChatPhotoView.openModal(photoObj);
                        return;
                    }
                }
            }
        }

    },

    holdNote : function (e) {
        _preventDefault(e);
        var dataSource = privateNoteModel.notesDS;
        var noteUID = $(e.touch.currentTarget).data("uid");
        var note = dataSource.getByUid(noteUID);
        privateNotesView.activeNote = note;

        $("#privateNoteViewActions").data("kendoMobileActionSheet").open();

    }





};