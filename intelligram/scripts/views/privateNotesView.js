/**
 * Created by donbrad on 3/3/16.
 *
 * privateNotesView -- display for user's private notes - My Notes...
 *
 */

'use strict';

/*
 * privateNotesView
 */
var privateNotesView = {
    topOffset: 0,
    activeNote: new kendo.data.ObservableObject(),
    noteObjects: [],
    notePhotos: [],
    editorVisible : false,
    _titleTagActive: false,
    _editorActive: false,
    _editorExpanded : false,
    _editMode: false,
    _editorView: false,
    _editorMin : "3em", /// changing to relative sizing
    _editorMax : "16em", /// changing to relative sizing

    onInit : function (e) {
       // _preventDefault(e);

        $("#notesView-listview").kendoMobileListView({
            dataSource: privateNoteModel.notesDS,
            template: $("#privateNote-template").html()

        }).kendoTouch({
            filter: ".private-note",
            tap: privateNotesView.tapNote/*,
            hold: privateNotesView.holdNote*/
        });


       /* $('#privateNoteTextArea').click(function() {
            if (privateNotesView._editorExpanded)
                return;
            privateNotesView._editorExpanded = true;
            privateNotesView.activateEditor();
        });*/


       /* $("#privateNoteTags").kendoMultiSelect({
            dataTextField: "name",
            dataValueField: "uuid",
            autoBind: false,
            autoClose: false,
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
*/

    },


    // Initialize the channel specific view data sources.
    noteInit : function () {

        privateNotesView.noteObjects = [];
        privateNotesView.notePhotos = [];
        privateNotesView.activeNote.data = {};
        privateNotesView.activeNote.data.photos = [];
        privateNotesView.activeNote.data.objects = [];
        privateNotesView.activeNote.title = '';
        privateNotesView.activeNote.tagString = '';
        privateNotesView.activeNote.tags= [];
        privateNotesView.activeNote.content = '';
        privateNotesView.activeNote.uuid = uuid.v4();
        privateNotesView._editView = false;
       // privateNotesView.deactivateEditor();
      /* $('#privateNoteTitle').val("");
        $('#privateNoteTags').val("");
        $('#privateNoteTextArea').val('');
        $('#privateNoteTextArea').redactor('code.set', "");
*/
        ux.hideKeyboard();
       // $('#privateNote-SaveBtn').addClass('hidden');

    },

    onShow : function (e) {
      //  _preventDefault(e);
        ux.hideKeyboard();
        privateNotesView.topOffset = $("#notesView-listview").data("kendoMobileListView").scroller().scrollTop;
        privateNotesView.openEditor();
        privateNotesView.noteInit();
    },

    onHide : function (e) {
       // _preventDefault(e);
        ux.hideKeyboard();
        privateNotesView.deactivateEditor();
        privateNotesView.noteInit();
        privateNotesView.closeEditor();
    },

    hideKeyboardBtn: function(){

    },


    noteAddPhoto : function (photoId) {

        var photo = photoModel.findPhotoById(photoId);

        if (photo !== undefined) {

            var photoObj  = {
                photoId : photo.photoId,
                thumbnailUrl: photo.thumbnailUrl,
                imageUrl: photo.imageUrl,
                deviceUrl : photo.deviceUrl,
                cloudUrl : photo.cloudUrl
            };
        }

        privateNotesView.activeNote.data.photos.push(photoObj);
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

    /*saveNote: function () {
        var validNote = false; // If message is valid, send is enabled

        if (privateNotesView._editMode) {
            validNote = true;
        }

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


        // Are there any photos in the current message
        if (privateNotesView.notePhotos.length > 0) {
            validNote = true;

            //Need to make sure the user didn't delete the photo reference in the html...
            privateNotesView.validateNotePhotos();
        }

        if (privateNotesView.noteObjects.length > 0) {
            validNote = true;

            var smartObject = privateNotesView.noteObjects[0];
            if (smartObject.ggType === 'Event') {
                text = privateNotesView.addSmartEventToNote(smartObject, text);
            } else if (smartObject.ggType === 'Movie') {
                text = privateNotesView.addSmartMovieToNote(smartObject, text);
            }
        }

        if (validNote === true ) {

            if (privateNotesView._editMode) {
                var activeNote = privateNotesView.activeNote;
                var note = privateNoteModel.findNote(activeNote.noteUUID);

                var contentData = JSON.stringify(activeNote.data);
                var dataObj = JSON.parse(contentData);
                note.set('title', title);
                note.set('tagString', tagString);
                note.set('tags', tags);
                note.set('content', text);
                note.set('data', contentData);
                note.set('dataObject', dataObj);
                note.set('timestamp',ggTime.currentTime());

                privateNoteModel.updateNote(note);

            } else {
                
                privateNotesView.noteAddLocation();
                privateNotesView._saveNote(text, privateNotesView.activeNote);
            }


            privateNotesView.noteInit();

        }

    },

    _initNoteTextArea : function () {

        $('#privateNoteTextArea').val('');
        $('#privateNoteTextArea').redactor('code.set', "");

        ux.hideKeyboard();
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

       // content = '<div class="privateNote" id=note_'+ uuidNote + ' data-uuid='+ uuidNote + '>' + text + '</div>';

        if (data.ggType !== undefined) {
            ggType = data.ggType;
        }
        var note = {
            uuid: uuidNote,
            ggType: ggType,
            title: data.title,
            tagString: data.tagString,
            tags: data.tags,
            content: content,
            data: contentData,
            dataObject: data,
            time: currentTime,
            ttl: ttl
        };

       privateNoteModel.addNote(note);

      //  privateNoteModel.notesDS.sync();
        privateNotesView.scrollToBottom();

        privateNotesView._initNoteTextArea();
        privateNotesView.deactivateEditor();
        //deviceModel.syncEverlive();

    },*/

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
   /* activateEditor : function () {

        $(".redactor-editor").velocity({height: privateNotesView._editorMax},{duration: 10});
        privateNotesView.editorVisible = true;
        $("#privateNoteToolbar").removeClass('hidden');
        $('#privateNoteTitleTag').removeClass('hidden');
        $("#privateNote-hideKeyboard").removeClass('hidden');
        /!*$("#privateNoteToolbar").removeClass('hidden');
        $("#privateNote-editorBtnImg").attr("src","images/icon-editor-active.svg");*!/

    },

    deactivateEditor : function () {
        privateNotesView._editorView = false;
      // privateNotesView.hideEditor();
        $(".redactor-editor").velocity({height: privateNotesView._editorMin},{duration: 10});
        $("#privateNoteToolbar").addClass('hidden');
        privateNotesView.editorVisible = false;
        $('#privateNoteTitleTag').addClass('hidden');
        $("#privateNote-hideKeyboard").addClass('hidden');
        ux.hideKeyboard();

    },


    hideEditor : function () {
        $(".redactor-editor").velocity({height: "3em"},{duration: 10});
        $("#privateNoteToolbar").addClass('hidden');
        $('#privateNoteTitleTag').addClass('hidden');
        ux.hideKeyboard();
    },

    openEditor : function () {
        if (privateNotesView._editorActive === false) {

            privateNotesView._editorActive = true;

            $('#privateNoteTextArea').redactor({
               /!* minHeight: 72,
                maxHeight: 360,*!/
                minHeight: privateNotesView._editorMin,
                maxHeight: privateNotesView._editorMax,
                focus: true,
                toolbarExternal: "#privateNoteToolbar",
               /!* imageEditable: false, // disable image edit mode on click
                imageResizable: false, // disable image resize mode on click*!/
                placeholder: 'Add Note...',
                formatting: ['p', 'blockquote', 'h1', 'h2','h3'],
                buttons: [ 'bold', 'italic', 'lists', 'horizontalrule']/!*,
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
                     }*!//!*,

                    focus: function(e){
                        privateNotesView.activateEditor();


                    },
                    blur: function(e){
                        if (!privateNotesView._editorView) {
                            privateNotesView.deactivateEditor() ;
                        }


                    }*!//!*,
                    click : function (e) {

                    }*!/
                 /!*}*!/


                //toolbarExternal: '#privateNoteToolbar'
            });

           /!* $.Redactor.prototype.clear = function() {
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
            };*!/
        }

    },


    closeEditor : function () {

        privateNotesView.deactivateEditor();

        if (privateNotesView._editorActive) {
            privateNotesView._editorActive = false;
            $('#privateNoteTextArea').redactor('core.destroy');
        }


    },
*/

   _deleteNote : function () {
        var thisNote = privateNotesView.activeNote;

       if (thisNote.uuid !== null) {
           switch (thisNote.noteType) {
               case 'Event' :
                   smartEvent.removeEventById(thisNote.object.uuid);
                   break;

               case 'Flight' :
                   smartFlight.removeFlightById(thisNote.object.uuid);
                   break;

               case 'Movie' :
                   smartMovie.removeMovieById(thisNote.object.uuid);
                   break;

               case  'Trip' :
                   smartTrip.removeTripById(thisNote.object.uuid);
                   break;
           }
           privateNoteModel.deleteNote(privateNotesView.activeNote);
           privateNotesView.noteInit();
       }
   },

    deleteNote : function (e) {
        _preventDefault(e);

        var noteType = privateNotesView.activeNote.noteType;

        modalView.open("Are you sure?", "This " + noteType + " will be permanently deleted.", "Delete", privateNotesView._deleteNote, "Cancel", modalView.close);


    },

    editNote : function (e) {
        _preventDefault(e);

        var that = privateNotesView, note = privateNotesView.activeNote;

        if (note === undefined || note === null) {
            ggError("No active note!");
        }

        switch (note.noteType) {
            case 'Note' :
                if (note.uuid !== undefined) {

                    APP.kendo.navigate("#noteEditor?noteid="+privateNotesView.activeNote.uuid+'&returnview=gallery');

                }
                break;

            case 'Event' :
                smartEventView.openModal(note.object, function (event) {

                });
                break;

            case 'Flight' :
                smartFlightView.openModal(note.object, function (flight) {
                    if (flight !== null) {

                    }
                });
                break;

            case 'Movie' :
                smartMovieView.openModal( note.object, function (movie) {
                    if (movie !== null) {


                    }
                });
                break;

            case 'Trip' :
                smartTripView.openModal(note.object, function (trip) {
                    if (trip !== null) {

                    }
                });
                break;

        }


    },

    shareNote : function (e) {
        _preventDefault(e);

        if (window.navigator.simulator === true) {
            mobileNotify("Export and Sharing only on device...");

        } else {

            _socialShare(privateNotesView.activeNote.content, privateNotesView.activeNote.title, null, null);
            
        }
    },

    sendNote : function (e) {
        _preventDefault(e);

        sharePickerView.openModal(privateNotesView.activeNote, function (share) {
            if (share === null) {
                mobileNotify("Share cancelled.")
            } else {

                if (share.category === 'Group' || share.category === 'Chat') {

                    privateNotesView.sendNoteToChat(share.channelUUID);

                } else if (share.category === 'Contact') {
                    privateNotesView.sendNoteToContact(share.channelUUID);
                }

            }

        });
    },




    sendNoteToContact : function (contactUUID) {

        var contact = contactModel.findContact(contactUUID);

        var note = privateNotesView.activeNote;

        if (contact === undefined || contact === null) {
            ggError("Send Note: couldn't find contact");
        }

        var message = {
            canCopy: false,
            objects: [],
            photos: []
        };

        if (note.object !== null) {
            message.objects.push(note.object);
        }

        mobileNotify("Shared " + note.noteType +  " with " + contact.name + " (" + contact.alias + ")");
        privateChannel.sendMessage(contactUUID, note.content, message, 86400);

    },

    sendNoteToChat : function (channelUUID) {
        var channel = channelModel.findChannelModel(channelUUID);

        var note = privateNotesView.activeNote;

        if (channel === undefined || channel === null) {
            ggError("Send Note: couldn't find chat or group");
        }

        var message = {
            canCopy: false,
            objects: [],
            photos: []
        };

        if (note.object !== null) {
            message.objects.push(note.object);
        }

        mobileNotify("Shared " + note.noteType +  " to " + channel.channelName );
        groupChannel.sendMessage(channel.channelUUID,  channel.channelName, note.content, message, 86400);
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

    addSmartEventToNote: function (thisEvent, note) {

        //  var editor = $("#messageTextArea").data("kendoEditor");
        var date = new Date(thisEvent.date).toLocaleString(), objectId = thisEvent.uuid;

        var dateStr = moment(date).format('ddd MMM Do');
        var localTime = moment(date).format("LT");

        var placeName = thisEvent.placeName;
        if(placeName === null){
            placeName = "";
        }

        privateNotesView.activeNote.type = privateNoteModel._event;
        if (privateNotesView.activeNote.title === '') {
            privateNotesView.activeNote.title = thisEvent.title;
        }


        
        var objectUrl = '<div class="btnSmart btnSmartList" data-role="button" data-objectid="' + objectId +
            '" id="chatobject_' + objectId + '"'+
            'data-click="privateNotesView.onObjectClick" >' +
            '<div class="privateNote-event">' +
            '<img src="images/smart-event-home.svg" class="icon-smart-home left" />' +
            '<h3>' + thisEvent.title + '</h3>' +
            '<p>' + dateStr + ' at ' + localTime + '</p>' +
            '</div>' +
            '</div>';



            /*'<span class="btnSmart-content">' +
            '<span class="btnSmart-title">' + smartEvent.title + ' </span><br /> ' +
            '<span class="btnSmart-date">' + dateStr + ' at ' + localTime + '</span><br /> ' +
            '<span class="btnSmart-date">' + placeName + '</span> ' +
            '</span>' +
            '<span class="btnSmart-type">' +
            '<img src="images/smart-event-test.svg" class="icon-smartBtn" />' +
            '</span>' +
            '</span></div>';*/

        var fullMessage = note + objectUrl;

        privateNotesView.activeNote.data.objects.push(thisEvent);

        return (fullMessage);

    },

    addSmartMovieToNote: function (thisMovie, note) {

        //  var editor = $("#messageTextArea").data("kendoEditor");
        var date = thisMovie.showtime, objectId = thisMovie.uuid;

        var dateStr = moment(date).format('ddd MMM Do h:mm A');

        privateNotesView.activeNote.type = privateNoteModel._movie;
        
        if (privateNotesView.activeNote.title === '') {
            privateNotesView.activeNote.title = thisMovie.movieTitle;
        }

        var objectUrl = '<div><span class="btnSmartList" data-role="button" data-objectid="' + objectId +
            '" id="movieobject_' + objectId + '"'+
            'data-click="privateNotesView.onObjectClick" >' +
            '<div class="btnSmart-poster">' +
            '<img src="' + thisMovie.imageUrl + '" class="btnSmart-img" />' +
            '</div>' +
            '<div class="btnSmart-content">' +
            '<p class="btnSmart-title">' + thisMovie.movieTitle + ' </p> ' +
            '<p class="btnSmart-date textClamp">' + dateStr + '</p> ' +
            '<p class="btnSmart-date textClamp">' + thisMovie.theatreName + '</p> ' +
            '</div>' +
            '<span class="btnSmart-type">' +
            '<img src="images/smart-movie-circle.svg" />' +
            '</span>' +
            '</span></div>';

        var fullMessage = note + objectUrl;

        privateNotesView.activeNote.data.objects.push(thisMovie);

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
        privateNotesView.activeNote.data.geo= {lat: mapModel.lat, lng: mapModel.lng};
        privateNotesView.activeNote.data.address = mapModel.currentAddress;
        if (userModel._user.currentPlaceUUID !== null) {
            privateNotesView.activeNote.place = {name: userModel._user.currentPlace, uuid: userModel._user.currentPlaceUUID};
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

   /*     var selection =  $('#privateNoteTextArea').redactor('selection.save'); //cache the current selection
*/

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
                privateNotesView.winRef.addEventListener("exit", privateNotesView.messageSearchEnd);
                privateNotesView.winRef.addEventListener("loadstop", privateNotesView.messageSearchLoad);
                /* channelView.winRef.addEventListener('loaderror', channelView.messageSearchError); */
            }

        });

    },


    addImageToNote: function (photoId, displayUrl) {
        var photoObj = photoModel.findPhotoById(photoId);

        if (photoObj !== undefined) {
            $('#privateNote-SaveBtn').addClass('hidden');
           // privateNotesView.checkEditor();

            var imgUrl = '<img class="photo-chat" data-id="'+ photoId + '" id="notephoto_' + photoId + '" src="'+ photoObj.deviceUrl +'" />';

            $('#privateNoteTextArea').redactor('insert.node', $('<div />').html(imgUrl));

            privateNotesView.notePhotos.push(photoId);

        }

    },

    updateImageUrl : function (photoId, shareUrl) {
        $('#notephoto_' + photoId).attr('src', shareUrl);
        $('#privateNote-SaveBtn').removeClass('hidden');
    },

    addCamera : function (e) {
        _preventDefault(e);

        devicePhoto.deviceCamera(
            devicePhoto._resolution, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
           null,  // Current channel Id for offers
            privateNotesView.addImageToNote,  // Optional preview callback
            privateNotesView.updateImageUrl
        );
    },

    addPhoto : function (e) {
        _preventDefault(e);
        // Call the device gallery function to get a photo and get it scaled to gg resolution
        devicePhoto.deviceGallery(
            devicePhoto._resolution, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            null,  // Current channel Id for offers
            privateNotesView.addImageToNote,  // Optional preview callback
            privateNotesView.updateImageUrl
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


    noteEditor : function (e) {
        if (!privateNotesView.editorVisible) {
            privateNotesView.activateEditor();
        } else {
            privateNotesView.deactivateEditor();
        }
    },

    noteEvent : function (e) {
        _preventDefault(e);
        smartEventView.openModal(null, function (event) {

            if (event !== null) {

                var objectId = event.uuid;

                var content = smartEvent.renderEvent(event);

                var note = {};
                note.ggType = 'Note';
                note.noteType = 'Event';
                note.uuid = objectId;
                note.title = event.title;
                note.description = event.description;
                note.tagString = event.address;
                note.timestamp = event.date;
                note.content = content;
                note.object  = event;
                privateNoteModel.addNote(note);
            }

        });
    },


    noteMovie : function (e) {
        _preventDefault(e);
        movieListView.openModal( null, function (movie) {
            if (movie !== null) {
                var objectId = movie.uuid;


                var content = smartMovie.renderMovie(movie);

                var note = {};
                note.uuid = objectId;
                note.ggType = 'Note';
                note.noteType = 'Movie';
                note.title = movie.movieTitle;
                note.description = movie.description;
                note.tagString = '';
                note.timestamp = movie.showtime;
                note.content = content;
                note.object  = movie;
                privateNoteModel.addNote(note);

            }
        });
    },

    noteFlight : function (e) {
        _preventDefault(e);
        //channelView.messageMenuTag();

        smartFlightView.openModal(null,function (flight) {
            if (flight !== undefined && flight !== null) {
                smartFlight.smartAddFlight(flight, function (flightObj) {
                    var  objectId = flightObj.uuid;


                    var content = smartFlight.renderFlight(flightObj);

                    var note = {};
                    note.ggType = 'Note';
                    note.noteType = 'Flight';
                    note.uuid = objectId;
                    note.title = flightObj.name;
                    note.tagString = flightObj.departureCity + " " + flightObj.arrivalCity;
                    note.description = flightObj.departureAirport + '/' + flightObj.departureAirport + " via " + flightObj.airline + flightObj.flight;
                    note.timestamp = flightObj.estimatedDeparture;
                    note.content = content;
                    note.object  = flightObj;
                    privateNoteModel.addNote(note);
                });

            }
        });
    },

    noteTrip: function (e) {
        _preventDefault(e);
        smartTripView.openModal(null, function (trip) {
            if (trip !== undefined && trip !== null) {
                smartTrip.smartAddTrip(trip, function (tripObj) {
                    var  objectId = tripObj.uuid;

                    var content = smartTrip.renderTrip(tripObj);

                    var note = {};
                    note.ggType = 'Note';
                    note.noteType = 'Trip';
                    note.uuid = objectId;
                    note.title = tripObj.name;
                    note.tagString = '';
                    note.description = tripObj.tripType + " from " + tripObj.originName + " to " + tripObj.destinationName;
                    note.timestamp = tripObj.departure;
                    note.content = content;
                    note.object  = tripObj;
                    privateNoteModel.addNote(note);
                });

            }
        });
    },


    noteAccount : function (e) {
        _preventDefault(e);
        smartAccountView.openModal();
    },

    noteMedical : function (e) {
        _preventDefault(e);
        smartMedicalView.openModal();
    },


    tapNote : function (e) {
       // e.preventDefault();

        var $target = $(e.touch.initialTouch);
        var dataSource = privateNoteModel.notesDS;
        var noteId = null, note = null;


        // This only works if the user clicks / tpas on a bounding element
        if (e.touch.currentTarget !== undefined) {
            // Legacy IOS
            noteId =  $(e.touch.currentTarget).data("id");
        } else {
            // New Android
            noteId =   e.touch.target[0].attributes['data-id'].value;
        }

        if ($target.hasClass('photo-chat')) {

            var photoId = $target.attr('data-photoId');

            if (message.data !== undefined && message.data.photos !== undefined) {
                var photoList = message.data.photos;

                for (var i=0; i< photoList.length; i++) {
                    var photoObj = photoList[i];

                    if (photoObj.photoId === photoId) {
                        modalChatPhotoView.openModal(photoObj, false);
                        return;
                    }
                }
            }
        } else {
            if (noteId !== undefined && noteId !== null) {
                note = privateNoteModel.findNote(noteId);
                $('#privateNoteView-editTitle').text('View');

                if (note.noteType === 'Note') {
                    $('#privateNoteView-editTitle').text('Edit');
                }
                if (note !== undefined && note !== null) {
                    privateNotesView.activeNote = note;

                    $("#privateNoteViewActions").data("kendoMobileActionSheet").open();
                }
            }
        }

        /*if (noteId !== undefined && noteId !== null) {
            note = privateNoteModel.findNote(noteId);

            if (note !== undefined && note !== null) {
                privateNotesView.activeNote = note;
            }
               /!* privateNotesView.activeNote = note;
                if (note.noteType === 'Note') {
                    noteViewer.openModal(note.uuid, privateNotesView.activeNote);
                } else if (note.noteType === 'Gallery') {
                    APP.kendo.navigate('#galleryEditor?galleryid='+note.uuid+"&returnview=home");
                } else if (note.noteType === 'Movie') {
                    movieListView.openModal( note.object, function (movie) {
                       /!* if (movie !== null) {
                            privateNoteModel.updateNote(note);

                        }*!/
                    });
                } else if (note.noteType === 'Trip') {
                    smartTripView.openModal(note.object, function (trip) {

                    });
                } else if (note.noteType === 'Event') {
                    smartEventView.openModal(note.object, function (event) {

                    });
                }
            }*!/

        }*/

        // User actually clicked on the photo so show the open the photo viewer
       /* if ($target.hasClass('photo-chat')) {

            var photoId = $target.attr('data-photoId');

            if (message.data !== undefined && message.data.photos !== undefined) {
                var photoList = message.data.photos;

                for (var i=0; i< photoList.length; i++) {
                    var photoObj = photoList[i];

                    if (photoObj.photoId === photoId) {
                        modalChatPhotoView.openModal(photoObj, false);
                        return;
                    }
                }
            }
        }
*/
    },

    holdNote : function (e) {
       /* _preventDefault(e);
        var dataSource = privateNoteModel.notesDS;
        var noteUID = $(e.touch.currentTarget).data("uid");
        var note = dataSource.getByUid(noteUID);
        privateNotesView.activeNote = note;*/

        var $target = $(e.touch.initialTouch);
        var dataSource = privateNoteModel.notesDS;
        var noteId = null, note = null;


        // This only works if the user clicks / tpas on a bounding element
        if (e.touch.currentTarget !== undefined) {
            // Legacy IOS
            noteId =  $(e.touch.currentTarget).data("id");
        } else {
            // New Android
            noteId =   e.touch.target[0].attributes['data-id'].value;
        }


        if (noteId !== undefined && noteId !== null) {
            note = privateNoteModel.findNote(noteId);
            if (note !== undefined && note !== null) {
                privateNotesView.activeNote = note;
            }
        }


        $("#privateNoteViewActions").data("kendoMobileActionSheet").open();

    }





};