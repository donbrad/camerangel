/**
 * Created by donbrad on 9/10/15.
 *
 * The objects / functions behind all gallery and photos views
 */


'use strict';


/*  
 * gallery
 */

var galleryView = {
    _returnView : null,
    _mode: 'gallery',  // two modes: gallery or picker (photo picker)
    _pickerMode: false,  // simple flag if in photo picker mode
    _currentPhoto: {},
    _currentPhotoId: null,
    _currentPhotoUrl: null,
    _previewSize: "33%",
    _viewInitialized : false,
    _activeView: 0,
    scroller: null,

    // todo - delete, testing ui
    notesAddOpts: new kendo.data.DataSource({
        group: 'category',
        data: [
            {
                title: "Add Note",
                imgUrl: "icon-note",
                category: "intelligram",
                type: "note"
            },
            {
                title: "Add from Camera",
                imgUrl: "action-camera",
                category: "photos",
                type: "camera"
            },
            {
                title: "Add from Device",
                imgUrl: "action-device",
                category: "photos",
                type: "device"
            },
            {
                title: "Add Gallery",
                imgUrl: "nav-gallery",
                category: "photos",
                type: "gallery"
            },
            {
                title: "Add Flight",
                imgUrl: "intelliFlight-icon",
                category: "intelligram",
                type: "flight"
            },
            {
                title: "Add Event",
                imgUrl: "icon-event",
                category: "intelligram",
                type: "event"
            },
            {
                title: "Add Trip",
                imgUrl: "intelliTrip-icon",
                category: "intelligram",
                type: 'trip'
            },
            {
                title: "Add Movie",
                imgUrl: "intelliMovie-icon",
                category: "intelligram",
                type: "movie"
            }

        ]
    }),


    _noteNote : 'Note',
    _noteGallery : 'Gallery',
    _noteEvent : 'Event',
    _noteFlight : 'Flight',
    _noteTrip : 'Trip',
    _noteMovie : 'Movie',


    onInit : function (e) {
        //_preventDefault(e);

        /*archiveView.init();

        var setSentinelHeight = function () {
            $('#search-archives').height(getSentinelHeight());
        };
*/
        // ToDo: Initialize list view
        var itemWidth = $(window).width()/4;
        photoModel.rotationAngle = 0;
        photoModel.optionsHidden = true;

        photoModel.optionsShown = true;


        // Set img size for gallery
        //$("#gallery-listview li").css("width",galleryView._previewSize);
        //$("#gallery-listview li").css("padding-bottom",galleryView._previewSize);

    },

    onAddListViewClick: function(e){
        var type = e.dataItem.type;
        switch(type){
            case "medical":
                privateNotesView.noteMedical();
                break;
            case "account":
                privateNotesView.noteAccount();
                break;
            case "movie":
                privateNotesView.noteMovie();
                break;
            case "trip":
                privateNotesView.noteTrip();
                break;
            case "event":
                privateNotesView.noteEvent();
                break;
            case "device":
                galleryView.galleryPhoto();
                break;
            case "camera":
                galleryView.galleryCamera();
                break;
            case "flight":
                privateNotesView.noteFlight();
                break;
            case "note":
                APP.kendo.navigate("#noteEditor?returnview=gallery");
                break;
            case "gallery":
                APP.kendo.navigate("#galleryEditor?returnview=gallery");
                break;
        }

        $("#galleryView-noteAdd").data("kendoMobilePopOver").close();
    },

    setStuffView : function () {
        $('#gallery-photos').addClass("hidden");
        $('#gallery-notes').removeClass("hidden");

        galleryView._activeView = 0;
    },

    setPhotoView: function () {
        $('#gallery-photos').removeClass("hidden");
        $('#gallery-notes').addClass("hidden");
        ux.setSearchPlaceholder("Search Photos...");
        galleryView._activeView = 1;
    },

    selectView : function (index) {
        switch (index) {
            case 0: // Alerts
               galleryView.setStuffView();
                break;
            case 1: // Notes
                galleryView.setPhotoView();
                break;

        }
    },

    openGalleryPicker : function () {
        galleryListView.openModal(function (galleryId) {
            if (galleryId !== null) {

                APP.kendo.navigate("#galleryEditor?galleryid="+galleryId+"&returnview=gallery");

            }
        })
    },

    updateTotalPhotos : function () {
        // set result count
        var photoCount = photoModel._totalPhotos;

        if(photoModel._totalPhotos > 0){
            /// single photo
            if(photoModel._totalPhotos == 1) {
                $("#resultsName").text("Photo");
            } else {
            /// multiple photos
                $("#resultsName").text("Photos");
            }
            $(".results").css("visibility", "visible");
            $("#resultCount").text(photoCount);
        } else {
            $(".results").css("visibility", "hidden");
            $("#resultsName").text("No Photos");
        }
    },

    onShow : function (e) {

       // _preventDefault(e);

        ux.hideKeyboard();

        // Make sure all the local photos have been uploaded
        photoModel.syncPhotosToCloud();
        photoModel.syncPhotosToDevice();

        if (!galleryView._viewInitialized) {
            galleryView._viewInitialized = true;

            /*$('#gallery-buttongroup').kendoMobileButtonGroup({
                select: function(e) {
                    var index = e.index;
                    if (index != galleryView._activeView) {
                        galleryView._activeView = index;
                        galleryView.selectView(galleryView._activeView);
                    }
                },
                index: galleryView._activeView
            });*/

            $("#gallery-listview").kendoMobileListView({
                dataSource: photoModel.photosDS,
                template: $("#gallery-template").html(),
                click : function (e) {
                    _preventDefault(e);

                    var photo = e.dataItem, photoId = e.dataItem.photoId, photoUrl = e.dataItem.imageUrl;

                    modalPhotoView.openModal(photo);
                }

            });

            //data-source="photoModel.photosDS" data-template="gallery-template" data-click="galleryView.galleryClick"
            $("#gallery .gg_mainSearchInput").on('input', function() {
                var query = this.value;
                if (query.length > 0) {

				photoModel.photosDS.filter( {"logic":"or",
                        "filters":[
                            {
                                "field":"title",
                                "operator":"contains",
                                "value":query},
                            {
                                "field":"description",
                                "operator":"contains",
                                "value":query},
                            {
                                "field":"tagsString",
                                "operator":"contains",
                                "value":query},
                            {
                                "field":"dateString",
                                "operator":"contains",
                                "value":query},
                            {
                                "field":"addressString",
                                "operator":"contains",
                                "value":query},
                            {
                                "field":"placeString",
                                "operator":"contains",
                                "value":query},
                            {
                                "field":"senderName",
                                "operator":"contains",
                                "value":query}
                        ]});

                	$("#gallery .enterSearch").removeClass('hidden');
                } else {
                	$("#gallery .enterSearch").addClass('hidden');
                	photoModel.photosDS.filter([]);
                }

            });
           
            // bind clear search btn
			$("#gallery .enterSearch").on("click", function(){
					$("#gallery .gg_mainSearchInput").val('');
					
					// reset data filters
                   photoModel.photosDS.filter([]);

                   // hide clear btn
                   $(this).addClass('hidden');
			});

            $("#notesView-listview").kendoMobileListView({
                dataSource: privateNoteModel.notesDS,
                template: $("#privateNote-template").html()

            }).kendoTouch({
                filter: ".private-note",
                tap: galleryView.tapNote,
                hold: galleryView.holdNote
            });

        }

        ux.setSearchPlaceholder("Search safe...");


        if (e.view.params.mode !== undefined && e.view.params.mode === 'picker') {
            galleryView._pickerMode = true;
            mobileNotify("Please select an image to send...")
        } else {
            galleryView._pickerMode = false;
        }

        if (e.view.params.returnview !== undefined) {
            galleryView._returnView = e.view.params.returnview;
        }

        photoModel.rotationAngle = 0;
        

        galleryView.scroller = e.view.scroller;

        galleryView.scroller.setOptions({
            pullToRefresh: true,
            pull: function() {
                photoModel.photosDS.sync();
                ux.toggleSearch();
                galleryView.scroller.pullHandled();

            }
        });


        galleryView.updateTotalPhotos();

        ux.setAddTarget(null, null, galleryView.onAddGallery);
        // set filter count
        var filterCount = 0;
        $("#filterCount").text(filterCount);

        if(filterCount > 1){
        	$("#filterText").text("Filters");
        } else if(filterCount === 0) {
        	$("#filterCount").text("");
        	$("#filterText").text("Filter");
        } else {
        	$("#filterText").text("Filter");
        }

    },

    onTabSelect: function(e){
        var tab;
        if(_.isNumber(e)){
            tab = e;
        } else {
            tab = $(e.item[0]).data("tab");
        }

        if(tab == 0){
            // Notes
            $("#gallery-photos").addClass("hidden");
            $("#gallery-notes").removeClass("hidden");

            $("#galleryView-tab-notes").attr("src", "images/icon-myNotes-alt.png");
            $("#galleryView-tab-photos").attr("src", "images/icon-Photo.png");

            ux.setSearchPlaceholder("Search Notes...");

        } else {
            // Photos
            $("#gallery-photos").removeClass("hidden");
            $("#gallery-notes").addClass("hidden");

            $("#galleryView-tab-notes").attr("src", "images/icon-myNotes.png");
            $("#galleryView-tab-photos").attr("src", "images/icon-photo-active.png");

            ux.setSearchPlaceholder("Search Photos...");

        }
        galleryView._activeView = tab;
    },

    onAddGallery : function (e) {
        //$("#galleryActionsPhoto").data("kendoMobileActionSheet").open();
        $("#galleryView-noteAdd").data("kendoMobilePopOver").open(".user-settings")
    },

    onHide: function(e){
    	var $actionBtn = $("#gallery > div.footerMenu.km-footer > a");
        var $actionBtnImg = $("div.footerMenu.km-footer > a > span > img");
        var $actionBtnP = $("div.footerMenu.km-footer > a > span > p");

        $actionBtnP.removeClass("actionBtn-text-light").text("");
        ux.changeActionBtnImg("#gallery", "nav-add-white");
        ux.showActionBtn(false, "#gallery");
        $actionBtn.unbind();

        ux.hideSearch();

    },

    galleryActionView: function(e){
    	_preventDefault(e);
        if(e.index === 0){
            $(".galleryImg").addClass("galleryImg-grid").removeClass("galleryImg-full");
            $(".gallerySelectBtn-grid img").attr("src", "images/icon-grid-active.svg");
            $(".gallerySelectBtn-list img").attr("src", "images/icon-list-alt.svg");
            $("#gallery-listview").data("kendoMobileListView").scroller().reset();
        } else{
            $(".galleryImg").addClass("galleryImg-full").removeClass("galleryImg-grid");
            $(".gallerySelectBtn-grid img").attr("src", "images/icon-grid.svg");
            $(".gallerySelectBtn-list img").attr("src", "images/icon-list-alt-active.svg");
            $("#gallery-listview").data("kendoMobileListView").scroller().reset();
        }
    },

    selectCategory : function (e){
        _preventDefault(e);
        var index = this.current().index();
        switch (index) {
            case 0:
                //ux.showActionBtn(true, "#gallery");
                $('#archive-listview').addClass('hidden');
                $("#gallery-listview").removeClass("hidden");
                $(".resultsBar").removeClass("hidden");
                break;

            case 1:
               // ux.showActionBtn(false, "#gallery");
                $('#archive-listview').removeClass('hidden');
                $("#gallery-listview").addClass('hidden');
                $(".resultsBar").addClass("hidden");
                break;
        }
        $("#gallerySearch").attr("placeholder", "Search All");
    },

    getDisplayUrl : function (photouuid, device, cloud, thumb) {
        if (cloud === null) {
            return(device);
        }
        var filename = photouuid.replace(/-/g,'');
        var uniqueNewFilename = "photo_" + filename + ".jpg";
        var store = deviceModel.fileDirectory;
        var localUrl = store +  uniqueNewFilename;

        window.resolveLocalFileSystemURL(localUrl, 
            function() {
                
            },
            function () {
                var fileTransfer = new FileTransfer();
                fileTransfer.download(cloud, localUrl,
                    function(entry) {
                        photoModel.updateLocalUrl(photouuid, localUrl);
                    },
                    function(err) {
                        ggError("Photo cache error " + JSON.stringify(err));
                    });
            });
        
        return(device);
    },


    galleryClick : function (e) {
        _preventDefault(e);
        
        var photo = e.dataItem, photoId = e.dataItem.photoId, photoUrl = e.dataItem.imageUrl;

        modalPhotoView.openModal(photo);

        /*galleryView._currentPhotoUrl = photoUrl;
        galleryView._currentPhotoId = photoId;

       	galleryView._currentPhoto = photoModel.findPhotoById(photoId);

        $('#photoViewImage').attr('src', photoUrl);
        $('#photoTagImage').attr('src', photoUrl);
 //       $('#photoEditImage').attr('src', photoUrl);

        if (galleryView._pickerMode) {
            channelView.showChatImagePreview(photoUrl);
            APP.kendo.navigate('#:back');

        } else {
            var photoParam = LZString.compressToEncodedURIComponent(photoId);
            APP.kendo.navigate('#photoView?photo='+photoParam);
        }*/
    },

    deletePhoto: function (e) {
        _preventDefault(e);

        photoModel.deletePhoto(galleryView._currentPhotoId);

        mobileNotify("Deleted current photo");
        galleryView.updateTotalPhotos();
        // Navigate to previous page as the photo is gone...
        APP.kendo.navigate('#:back');
    },

    galleryCamera : function (e) {
        _preventDefault(e);

        devicePhoto.deviceCamera(
            devicePhoto._resolution, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            null,  // Current channel Id for offers
            function (photoUUID, displayUrl) {
                galleryView.updateTotalPhotos();
            },
            function (photoUUID, displayUrl) {

            }

        );
    },

    galleryPhoto : function (e) {
        _preventDefault(e);

        // Call the device gallery function to get a photo and get it scaled to gg resolution
        devicePhoto.deviceGallery(
            devicePhoto._resolution, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            null, // Current channel Id for offers
            function (photoUUID, displayUrl) {
                galleryView.updateTotalPhotos();
            },
            function (photoUUID, displayUrl) {
                // share callback -- photo is stored in the cloud
            }
        );
    },

    sharePhoto: function (e)  {
        _preventDefault(e);

    },

    editPhoto: function (e) {
        _preventDefault(e);
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


        if (noteId !== undefined && noteId !== null) {
            note = privateNoteModel.findNote(noteId);
            if (note !== undefined && note !== null) {
               var dataObj = userDataChannel.decryptBlock(note.dataBlob);
                if(dataObj !== null) {
                    dataObj = JSON.parse(dataObj);
                }
                note.dataObj = dataObj;

                if (note.noteType === 'Note') {
                    noteViewer.openModal(note.uuid, note);
                } else if (note.noteType === 'Gallery') {
                    APP.kendo.navigate('#galleryEditor?galleryid='+note.uuid+"&returnview=gallery");
                } else if (note.noteType === 'Movie') {
                   smartMovieView.openModal( note.dataObj, function (movie) {
                        /*if (movie !== null) {
                            privateNoteModel.updateNote(note);

                        }*/
                    });
                } else if (note.noteType === 'Trip') {
                    smartTripView.openModal( note.dataObj, function (trip) {
                        /*if (movie !== null) {
                         privateNoteModel.updateNote(note);

                         }*/
                    });
                } else if (note.noteType === 'Event') {
                    smartEventView.openModal( note.dataObj, function (trip) {
                        /*if (movie !== null) {
                         privateNoteModel.updateNote(note);

                         }*/
                    });
                } else if (note.noteType === 'Place') {
                    var locObj = {placeId: null, lat: dataObj.lat, lng: dataObj.lng, title: "IntelliPlace" , name: dataObj.name,  targetName: dataObj.name, address: dataObj.address};
                    mapViewModal.openModal(locObj, function () {

                    });

                }
            }
        }

        // User actually clicked on the photo so show the open the photo viewer
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
        }

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

    },

    createNote : function (type, title, tags, tagString,  content, obj) {
        var activeNote = {};
        activeNote.uuid = uuid.v4();
        activeNote.timestamp = new Date();
        activeNote.ggType = privateNoteModel._ggClass;
        activeNote.noteType = type;
        activeNote.title = title;
        activeNote.tags = tags;
        activeNote.tagString = tagString;
        activeNote.content = content;
        var dataBlob = userDataChannel.encryptBlock(JSON.stringify(obj));
        activeNote.dataBlob = dataBlob;

        privateNoteModel.addNote(activeNote);

    },

    noteEvent : function (e) {
        _preventDefault(e);
        smartEventView.openModal(null, function (smartEvent) {
            if (smartEvent !== undefined && smartEvent !== null) {
                var date = moment(smartEvent.date).format("ddd MMM Do YYYY h:mm A"), objectId = smartEvent.uuid;

                var placeName = smartEvent.placeName;
                if(placeName === null){
                    placeName = "";
                }


                var template = kendo.template($("#intelliEvent-chat").html());
                var tempObj = {
                    ggType: "Event",
                    title : smartEvent.title,
                    date : date,
                    placeName: placeName,
                    objectId : objectId
                };

                var content = template(tempObj);


                galleryView.createNote(galleryView._noteEvent, tempObj.title, [], '', content, smartEvent);

            }

        });
    },


    noteMovie : function (e) {
        _preventDefault(e);
        movieListView.openModal( null, function (smartMovie) {

            if (smartMovie !== undefined && smartMovie !== null) {
                var date = smartMovie.showtime, objectId = smartMovie.uuid;

                var dateStr = moment(date).format('ddd MMM Do YYYY h:mm A');


                var template = kendo.template($("#intelliMovie-chat").html());
                var tempObj = {
                    ggType: "Movie",
                    imageUrl: smartMovie.imageUrl,
                    movieTitle : smartMovie.movieTitle,
                    dateStr : dateStr,
                    theatreName: smartMovie.theatreName,
                    objectId : objectId,
                    rating: smartMovie.rating,
                    runtime: smartMovie.runtime
                };

                var content = template(tempObj);

                galleryView.createNote(galleryView._noteMovie, tempObj.movieTitle, [], '', content, smartMovie);
            }

        });
    },

    noteFlight : function (e) {
        _preventDefault(e);
        //channelView.messageMenuTag();

        smartFlightView.openModal(null,function (smartFlight) {
            if (smartFlight !== undefined && smartFlight !== null) {
                var  objectId = smartFlight.uuid;

                var template = kendo.template($("#intelliFlight-chat").html());
                var tempObj = {
                    ggType : "Flight",
                    objectId : objectId,
                    name: smartFlight.name,
                    departureAirport : smartFlight.departureAirport,
                    departureCity : smartFlight.departureCity,
                    arrivalAirport : smartFlight.arrivalAirport,
                    arrivalCity : smartFlight.arrivalCity,
                    estimatedDeparture : smartFlight.estimatedDeparture,
                    ui_estimatedDeparture : smartFlight.ui_estimatedDeparture,
                    timeDeparture: smartFlight.timeDeparture,
                    dateDeparture: smartFlight.dateDeparture,
                    timeArrival : smartFlight.timeArrival,
                    dateArrival: smartFlight.dateArrival,
                    estimatedArrival : smartFlight.estimatedArrival,
                    ui_estimatedArrival : smartFlight.ui_estimatedArrival,
                    durationString : smartFlight.durationString

                };

                var content= template(tempObj);
                galleryView.createNote(galleryView._noteFlight, tempObj.name, [], '', content, smartFlight);
            }

        });
    },

    noteTrip: function (e) {
        _preventDefault(e);
        smartTripView.openModal(null, function (smartTrip) {
            if (smartTrip !== undefined && smartTrip !== null) {
                var  objectId = smartTrip.uuid;

                var template = kendo.template($("#intelliTrip-chat").html());

                var dest = smartTrip.destination.address;
                var orig = smartTrip.origin.address;


                if (smartTrip.destination.name !== null) {
                    dest = smartTrip.destination.name;
                }

                if (smartTrip.origin.name !== null) {
                    orig = smartTrip.origin.name;
                }

                var tempObj = {
                    ggType: "Trip",
                    name: smartTrip.name,
                    origin: orig,
                    destination: dest,
                    departure: moment(smartTrip.departure).format ("ddd, M/D @ h:mm a"),
                    arrival: moment(smartTrip.arrival).format ("ddd, M/D @ h:mm a"),
                    durationString: smartTrip.durationString,
                    distanceString: smartTrip.distanceString,
                    objectId : objectId,
                    tripTimeType: smartTrip.tripTimeType
                };

                var content = template(tempObj);

                galleryView.createNote(galleryView._noteTrip, tempObj.name, [], '', content, smartTrip);
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
    }
};


var photoView = {
    _activePhoto: {},
    _activePhotoId: null,
    _activePhotoUrl: null,

    onInit: function (e) {
        //_preventDefault(e);

    },

    onShow : function (e) {
       // _preventDefault(e);

        if (e.view.params.photo !== undefined) {
            photoView._activePhotoId = LZString.decompressFromEncodedURIComponent(e.view.params.photo);
        } else {
            // If there's no parameter in call just default to the current selected gallery photo
            photoView._activePhotoId = galleryView._currentPhotoId;
        }

        if (photoView._activePhotoId !== null) {
            photoView._activePhoto = photoModel.findPhotoById(photoView._activePhotoId);
            photoView._activePhotoUrl = photoView._activePhoto.imageUrl;
        }

        ux.hideKeyboard();
    },

    onHide: function (e) {

    },

    setImageUrl : function (url) {
        $('#photoViewImage').attr('src', url);
    },

    deletePhoto: function (e) {
        _preventDefault(e);

        modalView.open("Delete this photo", "Click Delete to remove this photo or Keep to cancel delete ",
        "Delete", function() {
                photoModel.deletePhoto(photoView._activePhotoId);
                mobileNotify("Deleted the current photo");
                // Navigate to previous page as the photo is gone...
                APP.kendo.navigate('#:back');
            },
        "Keep", function() {
                mobileNotify("Delete cancelled.");
            }
        );


    },
 
    sharePhoto: function (e)  {
        _preventDefault(e);

        if (window.navigator.simulator === true) {
            mobileNotify("Export and Sharing only on device...");

        } else {

            _socialShare(null, null, photoView._activePhotoUrl, null);

           // _socialShare(null, null,  null, photoView._activePhoto.image);
        }
    },

    editPhoto: function (e) {
        _preventDefault(e);

        var urlParam =  LZString.compressToEncodedURIComponent(photoView._activePhotoId);

        APP.kendo.navigate("#photoEditor?source=gallery&photo="+urlParam);
    }


};


var photoEditor = {
    _activePhoto: {},
    _activePhotoId: null,
    _activePhotoUrl: null,
    _rotationAngle : 0,
    _source: null,

    onInit: function (e) {
        //_preventDefault(e);

    },

    onShow : function (e) {
       // _preventDefault(e);

        photoEditor._source = e.view.params.source;
        if (photoEditor._source === 'profile') {
            // Photo isn't created yet -- just have the url
            photoEditor._activePhotoUrl = LZString.decompressFromEncodedURIComponent(e.view.params.url);
        } else {
            photoEditor._activePhotoId = LZString.decompressFromEncodedURIComponent(e.view.params.photo);
            photoEditor._activePhoto = photoModel.findPhotoById(photoEditor._activePhotoId);
            photoEditor._activePhotoUrl =  photoEditor._activePhoto.imageUrl;
        }

       photoEditor.setImageUrl(photoEditor._activePhoto.imageUrl);

        // Reset rotation angle on each show...
        photoEditor._rotationAngle = 0;

        // TODO Don - add photo tags and photo info
    },

    setImageUrl : function (url) {
        $('#photoEditImage').attr('src', url);
    },

    onHide: function (e) {
        $('#photoEditImage').cropper('destroy');
    },

    crop: function (e) {
        _preventDefault(e);

        var $image = $('#photoEditImage');
        var cropCanvas = $image.cropper('getCroppedCanvas');
        var cropUrl = cropCanvas.toDataURL("image/jpeg");

        $image.cropper('replace', cropUrl);
        $('#photoEditImage').attr('src', cropUrl);
        $('#photoEditSaveDiv').removeClass('hidden');
    },

    rotateLeft : function (e) {
        _preventDefault(e);
        photoEditor._rotationAngle -= 90;
        $('#photoEditImage').cropper('rotate', photoEditor._rotationAngle);

    },

    rotateRight: function (e) {
        _preventDefault(e);
        photoEditor._rotationAngle += 90;
        $('#photoEditImage').cropper('rotate', photoEditor._rotationAngle);
    },

    savePhoto : function (e) {
        _preventDefault(e);
        var urlToSave = $('#photoEditImage').attr('src');

        // TODO Don - wire photo save

        mobileNotify("Photo updated");
        // in the meantime 
        APP.kendo.navigate('#:back');

        /*
        if ( photoEditor._source === 'chat') {
            channelView.showChatImagePreview(urlToSave);
            // Save image to chat image preview
        } else if ( photoEditor._source === 'gallery') {
            // Save image to gallery
        } else if  (photoEditor._source === 'profile') {
            // Save image to user profile
            saveUserProfilePhoto(urlToSave);
        }
        */
    }



};

var modalPhotoTag = {
    _activePhoto: new kendo.data.ObservableObject(),

    openModal : function (photo) {
        modalPhotoTag._activePhoto.set('photoId', photo.photoId);
        modalPhotoTag._activePhoto.set('title', photo.title);
        modalPhotoTag._activePhoto.set('thumbnailUrl', photo.thumbnailUrl);
        modalPhotoTag._activePhoto.set('imageUrl', photo.imageUrl);
        modalPhotoTag._activePhoto.set('description', photo.description);
        modalPhotoTag._activePhoto.set('tags', photo.tags);
        modalPhotoTag._activePhoto.set('tagsString', photo.tagsString);
        $("#modalview-photoTag").data("kendoMobileModalView").open();
    },

    closeModal : function () {
        $("#modalview-photoTag").data("kendoMobileModalView").close();
    },

    onCancel: function (e) {
        modalPhotoTag.closeModal();
        modalPhotoView.openModal(modalPhotoTag._activePhoto);
    },

    onDone : function(e) {
        _preventDefault(e);
        // Update data source and parse...

        var photoObj = photoModel.findPhotoById(modalPhotoTag._activePhoto.photoId);

        if (photoObj !== undefined) {
            photoObj.title = modalPhotoTag._activePhoto.title;
            photoObj.description = modalPhotoTag._activePhoto.description;
            photoObj.tagsString = modalPhotoTag._activePhoto.tagsString;
            if (photoObj.tagsString.length > 0){
                photoObj.tags = photoObj.tagsString.split(',');
            } else {
                photoObj.tags = [];
            }

        } else {
            mobileNotify("Can't find photo model!!");
        }
        modalPhotoTag.closeModal();
        modalPhotoView.openModal( modalPhotoTag._activePhoto)
    }

};


var modalChatPhotoView = {
    _photo: null,
    _photoUrl : null,
    _dummyTitle : 'Title',
    _dummyDescription : '',
    _dummyTagsString : '',
    _userHasCopy: false,
    _galleryMode: false,
    _currentPhotoPage : 0,
    _photoCount : 0,
    _activePhoto : new kendo.data.ObservableObject(),

    onInit: function(e) {

        $('#modalChatPhotoView-photoView').kendoTouch({
            enableSwipe:true,
            swipe:function (e) {
                var direction = e.direction;

                if (direction === 'right') {
                    modalChatPhotoView._currentPhotoPage++;
                    if (modalChatPhotoView._currentPhotoPage === modalChatPhotoView._photoCount) {
                        modalChatPhotoView._currentPhotoPage = 0;  // wrap to first photo...
                    }
                } else if (direction === 'left') {
                    modalChatPhotoView._currentPhotoPage--;
                    if (modalChatPhotoView._currentPhotoPage < 0) {
                        modalChatPhotoView._currentPhotoPage = modalChatPhotoView._photoCount - 1;  // wrap to last photo...
                    }
                }
                var photo = channelView.photosDS.at(modalChatPhotoView._currentPhotoPage);
                var url = null;

                if (photo.imageUrl !== null)
                    url = photo.imageUrl;
                if (url === null && photo.deviceUrl !== null) {
                    if (photoModel.isValidDeviceUrl(photo.deviceUrl)) {
                        url = photo.deviceUrl;
                    }
                }

                modalChatPhotoView._photoUrl = url;

                $('#modalChatPhotoView-photoView').attr('src', url);
                modalChatPhotoView._activePhoto.set('photoUrl', url);
                modalChatPhotoView._activePhoto.set('photoId', photo.photoId);
                modalChatPhotoView.updatePhotoStatus(photo);
            },

            minXDelta: 50,
            maxYDelta:40,
            maxDuration:2000

        });

    },

    confirmRecall: function(){
        /// close model
        modalChatPhotoView.closeModal();

        modalView.open("Are you sure?", "The photo will be removed from this chat.", "Recall", modalChatPhotoView.recallPhoto, "Cancel", modalView.close);
    },

    // Need to update Ux when the user scrolls to a new photo
    changePhoto : function (e) {
        var page = e.page, photo = null;

        modalChatPhotoView._currentPhotoPage = page;
        photo = channelView.photosDS.at(page);
        modalChatPhotoView.updatePhotoStatus(photo);
    },

    recallPhoto : function (e) {
        var photo = channelView.photosDS.at(modalChatPhotoView._currentPhotoPage);
        
        appDataChannel.recallPhoto(channelView._channelUUID, photo.photoUUID, userModel._user.userUUID, channelView.isPrivateChat);
        sharedPhotoModel.recallPhoto(photo.photoUUID, channelView._channelUUID);
    },
    

    updatePhotoStatus : function (photo) {
        if (photo === undefined) {
            return;
        }

        var photoId = photo.photoId;
        if (photoId === undefined) {
            photoId = photo.photoUUID;
        }

        modalChatPhotoView._userHasCopy = false;
        var photoObj = photoModel.findPhotoById(photoId);
        if (photoObj != undefined) {
            modalChatPhotoView._userHasCopy = true;
        }
        // Does the user have copy of this photo?
        if (modalChatPhotoView._userHasCopy) {
           // $("#modalChatPhotoView-inGallery").removeClass('hidden');
            $('#modalChatPhotoView-userhascopy').text("In Memories Gallery");
            $('#modalChatPhotoViewUnlocked').addClass('hidden');
        } else {
           // $("#modalChatPhotoView-inGallery").addClass('hidden');
            if (photo.canCopy) {
                $('#modalChatPhotoView-userhascopy').text("Copy to Memories Gallery");
                $('#modalChatPhotoViewUnlocked').removeClass('hidden');

            } else {
                $('#modalChatPhotoView-userhascopy').text("Locked by Sender");
                $('#modalChatPhotoViewUnlocked').addClass('hidden');
            }
        }


        // photo owner
        if (photo.ownerUUID === userModel._user.userUUID) {

            $("#modalChatPhotoRecipient").addClass('hidden');
            $("#modalChatPhotoSender").removeClass('hidden');
            $("#modalChatPhotoView-confirmRecallBtn").removeClass('hidden');

            /*if (photo.canCopy) {
                $("#modalChatPhotoViewDecline").addClass('hidden');
                $("#modalChatPhotoViewUnlock").addClass('hidden');
                $("#modalChatPhotoViewApprove").addClass('hidden');
                $("#modalChatPhotoViewOwnerUnlocked").removeClass('hidden');

            } else {
                $("#modalChatPhotoViewDecline").addClass('hidden');
                $("#modalChatPhotoViewUnlock").removeClass('hidden');
                $("#modalChatPhotoViewApprove").addClass('hidden');
                $("#modalChatPhotoViewOwnerUnlocked").addClass('hidden');
            }*/
            $("#modalChatPhotoOwnerName").text("you");

            // Todo: don - need to do hide / show if phot has been shared
            $("#modalChatPhotoView-recipientlist").removeClass('hidden');

        } else {
            // user does not own the photo
            $("#modalChatPhotoOwnerName").text(photo.ownerName);

            $("#modalChatPhotoRecipient").removeClass('hidden');

            $("#modalChatPhotoSender").addClass('hidden');

            $("#modalChatPhotoView-confirmRecallBtn").addClass('hidden');
            
            // If the user already has a copy of this photo -- hide all recipient options
            $("#modalChatPhotoView-recipientlist").addClass('hidden');


            // Copy photo allowed

            if (photo.canCopy) {
                $("#modalChatPhotoViewLocked").addClass('hidden');
                $("#modalChatPhotoViewRequestSent").addClass('hidden');
                $("#modalChatPhotoViewUnlocked").removeClass('hidden');
            } else {
                $("#modalChatPhotoViewUnlocked").addClass('hidden');

                /*if (photo.requestSent === undefined) {
                    $("#modalChatPhotoViewLocked").removeClass('hidden');
                    $("#modalChatPhotoViewRequestSent").addClass('hidden');
                } else {
                    $("#modalChatPhotoViewRequestSent").removeClass('hidden');
                    $("#modalChatPhotoViewLocked").addClass('hidden');
                }*/
            }
        }
    },

    savePhoto : function (e) {
        _preventDefault(e);

        photoModel.addChatPhoto(modalChatPhotoView._photo, function () {
            modalChatPhotoView._userHasCopy = true;
            ("#modalChatPhotoView-recipientlist").addClass('hidden');
            $('#modalChatPhotoView-userhascopy').removeClass('hidden');
        });


    },

    requestCopy : function (e) {
        _preventDefault(e);
        // Todo: wire up photo request

    },

    unlockPhoto : function (e) {
        _preventDefault(e);
    },

    approveRequest: function (e) {
        _preventDefault(e);
    },

     openModal : function (photo, galleryMode) {

         var photoId = photo.photoId;
         if (photoId === undefined) {
             photoId = photo.photoUUID;
         }

         modalChatPhotoView._galleryMode = galleryMode;
         var url = photo.thumbnailUrl;
         if (photo.imageUrl !== null)
             url = photo.imageUrl;

         if (url === null  ) {
             if (photo.deviceUrl !== undefined && photo.deviceUrl !== null) {
                 if (photoModel.isValidDeviceUrl(photo.deviceUrl)) {
                     url = photo.deviceUrl;
                 }
             } else {
                 // No valid cloud or local url in the photo -- need to query memories
                 var localPhoto = photoModel.findPhotoById(photoId);
                 if (localPhoto !== undefined && localPhoto !== null) {
                     url = localPhoto.deviceUrl;
                 }
             }

         }

         if (galleryMode) {

             var index = channelView.getPhotoIndex(photoId);
             if (index < 0) 
                 index = 0;

             modalChatPhotoView._currentPhotoPage = index;
             modalChatPhotoView._photoCount = channelView.photosDS.total();
             modalChatPhotoView._photoUrl = url;
             $('#modalChatPhotoView-photoView').attr('src', url);
             modalChatPhotoView._activePhoto.set('photoUrl', url);
             modalChatPhotoView._activePhoto.set('photoId', photoId);
             modalChatPhotoView.updatePhotoStatus(photo);

             $("#modalChatPhotoView-photoView").velocity("fadeIn");
             $("#modalChatPhotoView").data("kendoMobileModalView").open();

         } else {

             modalChatPhotoView._photo = photo;


             $.ajax({
                 url: url,
                 error: function () {
                     mobileNotify("This Photo isn't available...");
                 },
                 success: function () {
                     modalChatPhotoView._photoUrl = url;
                     modalChatPhotoView._activePhoto.set('photoUrl', url);
                     modalChatPhotoView._activePhoto.set('photoId', photoId);

                     $('#modalChatPhotoView-photoView').attr('src', url);
                     modalChatPhotoView.updatePhotoStatus(photo);

                     $("#modalChatPhotoView").data("kendoMobileModalView").open();
                 }
             });
         }

    },

    closeModal : function () {
        $("#modalChatPhotoView").data("kendoMobileModalView").close();
    }


};

var modalPhotoView = {
    _photo: null,
    _photoUrl : null,
    _address : null,
   
    _dummyTitle : '',
    _dummyDescription : '',
    _dummyTagsString : '',
    _activePhoto : new kendo.data.ObservableObject(),
    _showInfo: false,

    onInit: function(e){
    	var showInfo =  modalPhotoView._showInfo;

    	/*$(".photoViewBox").kendoTouch({
    		filter: "img",
    		tap: function(e){
    			if(!showInfo){
    				$(".photoTitleBox").velocity({height: "10rem"}, {duration: 300});
    				showInfo = true;
    			} else {
    				$(".photoTitleBox").velocity({height: "6rem"}, {duration: 300});
    				showInfo = false;
    			}
   
    		}
    	});*/
        // todo - wire new photo DS
        $("#photo-smartTag").kendoMultiSelect({
            autoClose: false,
            dataTextField: "tagname",
            dataValueField: "uuid",
            itemTemplate: '<div style="vertical-align: middle;"><img height="18"src="#:data.icon#"/><span>#:data.tagname#</span> <span style="font-size: 9px;"> #:data.name#</span> </div>' ,
            tagTemplate: '<div style="vertical-align: middle;"><img height="18" src="#:data.icon#"/>#:data.tagname#</div>',
            change: function (e) {
                var value = this.value();

            },
            select : function (e) {
                var item = e.item;
                var text = item.text();
            },
            dataSource: tagModel.tagsDS
        });
    },

    openModal : function (photo) {
        modalPhotoView._photo = photo;

        // User is inspected / editing -- make sure the photo exists in the cloud and on the device...
        photoModel.isPhotoCached(photo);
        var url = null;

        var deviceUrl = photo.deviceUrl;

        if (deviceUrl.indexOf('file://') === -1 ) {
            deviceUrl = 'file://' + deviceUrl;
            photo.set('deviceUrl', deviceUrl);
        }

        if (photoModel.isValidDeviceUrl(photo.deviceUrl)) {
            url = photo.deviceUrl;
        } else if (photoModel.isValidCloudUrl(photo.cloudUrl)){
            url = photo.cloudUrl;
        }


        // temporary fix for munged images
        if (url === null && photo.cloudinaryPublicId !== null) {
            url = photo.imageUrl;
        }

        if (url === null) {
            ggError("Can't access photo " + photo.photoId);
            return;
        }

        modalPhotoView._photoUrl = url;

        modalPhotoView._activePhoto.set('photoId', photo.photoId);
        if (photo.title === null) {
            photo.title = modalPhotoView._dummyTitle;
        }
        modalPhotoView._activePhoto.set('title', photo.title);

        // set title - should be handled by data-bind and then autoupdated from edit
        /*if(modalPhotoView._activePhoto.title !== ''){
            $("#modalPhotoView-title").text(modalPhotoView._activePhoto.title);
        } else {
            $("#modalPhotoView-title").text("Title");
        }
*/


        modalPhotoView._activePhoto.set('thumbnailUrl', photo.thumbnailUrl);
        modalPhotoView._activePhoto.set('imageUrl', photo.imageUrl);
        if (photo.description === null) {
            photo.description = modalPhotoView._dummyDescription;
        }
        modalPhotoView._activePhoto.set('description', photo.description);

        // Tags
        modalPhotoView._activePhoto.set('tags', photo.tags);
        if (photo.tagsString === undefined || photo.tagsString === null) {
            photo.tagsString = modalPhotoView._dummyTagsString;
        }
        modalPhotoView._activePhoto.set('tagsString', photo.tagsString);
        if(modalPhotoView._activePhoto.tagsString === ""){
            $("#photoTitle-tags").addClass("hidden");
        } else {
            $("#photoTitle-tags").removeClass("hidden");
        }

        // Address
        modalPhotoView._activePhoto.set('addressString', photo.addressString);
        modalPhotoView._activePhoto.set('placeString', photo.placeString);
        modalPhotoView._activePhoto.set('dateString', photo.dateString);
        modalPhotoView._activePhoto.set('placeUUID', photo.placeUUID);
        modalPhotoView._activePhoto.set('lat', photo.lat);
        modalPhotoView._activePhoto.set('lng', photo.lng);

        /*if (photo.placeString !== undefined && photo.placeString !== null) {
            $("#photo-location").val(modalPhotoView._activePhoto.placeString);
            modalPhotoView._address = photo.placeString;
        } else {
            $("#photo-location").val(modalPhotoView._activePhoto.addressString);
            modalPhotoView._address = photo.addressString;

        }*/


        // Date  -- this doesnt work for gallery photos...
        /*  var createdDate = moment(photo.createdAt).format("MMM Do, YYYY");
        $("#photoTitle-date").text(createdDate);*/

        $("#modalPhotoView").data("kendoMobileModalView").open();

        // Confirm that we have a valid local copy of this photo
        photoModel.isPhotoCached(photo);
    },

    closeModal : function () {
        modalPhotoView.closeTagEditor();
        $("#modalPhotoView").data("kendoMobileModalView").close();
    },

    openTagEditor : function (e) {
        _preventDefault(e);

        if(!modalPhotoView._showInfo){
            $("#modalPhotoView-editPhoto").velocity("slideDown");
            modalPhotoView._showInfo = true;
        }
    },

    closeTagEditor: function(e){
    	// Update data source and parse...

        var photoObj = photoModel.findPhotoById(modalPhotoView._activePhoto.photoId);

        if (photoObj !== undefined) {
            photoObj.set('title',modalPhotoView._activePhoto.title);
            photoObj.set('description',modalPhotoView._activePhoto.description);
            photoObj.set('addressString', modalPhotoView._activePhoto.addressString);
            photoObj.set('placeName', modalPhotoView._activePhoto.placeName);
            photoObj.set('lat', modalPhotoView._activePhoto.lat);
            photoObj.set('lng', modalPhotoView._activePhoto.lng);
            photoObj.set('placeUUID', modalPhotoView._activePhoto.placeUUID);
            photoObj.set('tagsString', modalPhotoView._activePhoto.tagsString);
            if (photoObj.tagsString.length > 0){
                photoObj.tags = photoObj.tagsString.split(',');
            } else {
                photoObj.tags = [];
            }

        } else {
            mobileNotify("Can't find photo model!!");
        }

        photoModel.sync();
        $("#modalPhotoView-editPhoto").velocity("slideUp");
        modalPhotoView._showInfo = false;

    },

    updatePlace : function (e) {
        var address = modalPhotoView._activePhoto.addressString, lat = modalPhotoView._activePhoto.lat,
            lng = modalPhotoView._activePhoto.lng;

        $("#modalPhotoView").data("kendoMobileModalView").close();
        smartEventPlacesView.openModalTargeted(address, "Memory Photo", lat, lng, function (placeObj) {
            modalPhotoView._activePhoto.set('addressString', placeObj.address);
            modalPhotoView._activePhoto.set('lat', placeObj.lat);
            modalPhotoView._activePhoto.set('lng', placeObj.lng);
            modalPhotoView._activePhoto.set('placeName', placeObj.name);

            $("#modalPhotoView").data("kendoMobileModalView").open();
        });
        
    },
    
    updateAddress : function (e) {
        var address = modalPhotoView._activePhoto.addressString, lat = modalPhotoView._activePhoto.lat,
            lng = modalPhotoView._activePhoto.lng;

        if (lat !== undefined && lat !== null) {
            mobileNotify("Looking up address...");
            // Reverse geocode based on lat/lng -- also need to match current places
            mapModel.reverseGeoCode(lat, lng, function (results, error){
                if (results !== null) {
                    var addressObj = mapModel._updateAddress(results[0].address_components);

                    address = addressObj.streetNumber + ' ' + addressObj.street  +  ', ' + addressObj.city + ', ' + addressObj.state;
                    modalPhotoView._activePhoto.set('addressString', address);

                }
            });
        } else {
            $("#modalPhotoView").data("kendoMobileModalView").close();
            smartEventPlacesView.openModal(address, "Address for Photo", function (placeObj) {
                $("#modalPhotoView").data("kendoMobileModalView").open();
            });
        }


    },

    deletePhoto : function (e) {
        _preventDefault(e);

        // Overlapping modals, need to close photoView first
        modalPhotoView.closeModal();

        modalView.open("Delete Photo?", "This action will delete this photo and any shares",
            "Delete" ,
            function() {
                //User wants to delete the photo
                photoModel.deletePhoto(modalPhotoView._activePhoto.photoId);
                modalView.close();
            },
            "Cancel",
            function() {
                // Just cancel the delete request
                modalView.close();
            });

    },

    editPhotoData : function (e) {
        _preventDefault(e);
        mobileNotify("In backlog....");
    },

    managePhoto : function (e) {
        _preventDefault(e);
        mobileNotify("In backlog....");
    },

    viewOnMap : function (e) {
        _preventDefault(e);
        var locObj = {placeId: null, lat: modalPhotoView._activePhoto.lat, lng: modalPhotoView._activePhoto.lng, title: "Photo", name: modalPhotoView._activePhoto.title, targetName: modalPhotoView._activePhoto.addressString};

        if (locObj.lat === undefined || locObj.lat === null) {
            mobileNotify("No location information for this photo!");
            return;
        }
        $("#modalPhotoView-PhotoActions").data("kendoMobileActionSheet").close();
        modalPhotoView.closeModal();
        mapViewModal.openModal(locObj, function () {
            $("#modalPhotoView").data("kendoMobileModalView").open();
        });
    },

    sendViaGhostgrams : function (e) {
        $("#modalPhotoView-PhotoActions").data("kendoMobileActionSheet").close();
        modalPhotoView.closeModal();
        var shareObj = {type: "photo", objectId : modalPhotoView._activePhoto.photoId};
        sharePickerView.openModal(shareObj, function () {
            $("#modalPhotoView").data("kendoMobileModalView").open();
        });

    },

   sharePhoto: function (e) {
       _preventDefault(e);
       if (window.navigator.simulator === true) {
           mobileNotify("Export and Sharing only on device...");

       } else {
           var url = $('#modalPhotoViewImage').attr('src');
           _socialShare(null, null, url , null);
       }
   }
};

var gallerySharedPhotoModal = {
    commentDS: new kendo.data.DataSource({
        data: [
        {
            authorName: "John Smith",
            content: "Nice photo!"
        },
        {
            authorName: "Jane Doe",
            content: "Looks like fun!"
        },
        {
            authorName: "Jane Doe",
            content: "This is a really long comment and the best comment. This is a great photo and I wish I was there."
        },
        {
            authorName: "John Smith",
            content: "Nice photo!"
        },
        {
            authorName: "Jane Doe",
            content: "Looks like fun!"
        },
        {
            authorName: "Jane Doe",
            content: "This is a really long comment and the best comment. This is a great photo and I wish I was there."
        }
    ]}),
    activePhoto : new kendo.data.ObservableObject({
        title: "My Photo title",
        thumbnailUrl: "images/photo-default.png",
        ux_isLiked: false,
        ux_commentCount: 8
    }),

    onInit: function(){

        $("#galleryShared-commentList").kendoMobileListView({
            dataSource: gallerySharedPhotoModal.commentDS, // todo - wire comments data source
            template: $("#galleryShared-commentTmpl").html()
        });


    },

    onOpen: function(){
        var dataCount = gallerySharedPhotoModal.commentDS._total;
        console.log(dataCount);
    },

    addComment: function(){
        var comment = $("#galleryShared-commentContent").val();
        // todo - wire comment

        gallerySharedPhotoModal.closeComments();
    },

    toggleShareDialog: function(){
        console.log("Sharing");
    },

    toggleComments: function(e){
        $("#galleryShared-commentPopover").data("kendoMobilePopOver").open("#galleryShared-toggleComment");
        console.log("Comment");
    },

    closeComments: function(){
        $("#galleryShared-commentPopover").data("kendoMobilePopOver").close();
    },

    toggleLike: function(e){
        if(gallerySharedPhotoModal.activePhoto.ux_isLiked){
            gallerySharedPhotoModal.activePhoto.set("ux_isLiked", false);
        } else {
            gallerySharedPhotoModal.activePhoto.set("ux_isLiked", true);
        }

    },

    setActivePhoto: function(photo){

        if(photo !== undefined && photo.uuid !== null){
            gallerySharedPhotoModal.activePhoto.set("title", photo.title);
            gallerySharedPhotoModal.activePhoto.set("thumbnailUrl", photo.thumbnailUrl);
            // todo - wire all properties
        } else {
            mobileNotify("Error loading photo");
        }
    },

    openModal: function(photo){
        gallerySharedPhotoModal.setActivePhoto(photo);

        $("#gallerySharedPhotoModal").data("kendoMobileModalView").open();
    },

    onDone: function(e) {
        // todo - clear active photo
        $("#gallerySharedPhotoModal").data("kendoMobileModalView").close();
    }
};

// Removing this legacy view -- gallerypicker is new replacement.  just keeping the code for reference...
var galleryListView = {

    _callback: null,
    _initialized : false,

    onInit: function(){

    },

    openModal: function (callback) {

        if (callback !== undefined) {
            galleryListView._callback = callback;
        }

        if (!galleryListView._initialized) {
            galleryListView._initialized = true;
            $("#galleryListModal-listview").kendoMobileListView({
                dataSource: galleryModel.galleryDS,
                template: $("#galleryList-template").html(),
                click: function (e) {
                    galleryListView.galleryClick(e);
                }
            });
        }

       /* $("#modalgallery-listview li").css("width","100%");
        $("#modalgallery-listview li").css("padding-bottom","100%");*/
        $("#galleryListModal").data("kendoMobileModalView").open();

    },

    closeModal: function (e) {

        $("#galleryListModal").data("kendoMobileModalView").close();
    },

    galleryClick : function (e) {
        _preventDefault(e);

        var galleryId = e.dataItem.uuid;

        if (galleryListView._callback !== null) {
            galleryListView._callback(galleryId);
            galleryListView.closeModal();
        }

    }

};


var galleryPicker = {
    _photo: null,
    _photoId : null,
    _callback : null,
    _isGridView: true,
    _viewInitialized : false,

    onInit : function (e) {
        //_preventDefault(e);

        $('#galleryPickerSearch').on('input', function() {
            var query = this.value;
            if (query.length > 0) {
                photoModel.photosDS.filter( {"logic":"or",
                    "filters":[
                        {
                            "field":"title",
                            "operator":"contains",
                            "value":query},
                        {
                            "field":"description",
                            "operator":"contains",
                            "value":query},
                        {
                            "field":"tagsString",
                            "operator":"contains",
                            "value":query},
                        {
                            "field":"dateString",
                            "operator":"contains",
                            "value":query},
                        {
                            "field":"addressString",
                            "operator":"contains",
                            "value":query}
                    ]});

                $("#modalview-galleryPicker .enterSearch").removeClass("hidden");
            } else {
                photoModel.photosDS.filter([]);
                $("#modalview-galleryPicker .enterSearch").addClass("hidden");
            }
        });

        $("#modalview-galleryPicker .enterSearch").on("click", function(){
            $("#modalview-galleryPicker .gg_mainSearchInput").val('');

            // reset data filters
            photoModel.photosDS.filter([]);

            // hide clear btn
            $(this).addClass('hidden');
        });

        ux.toggleSearch();
        ux.setSearchPlaceholder("Search photos...");

    },

    onOpen : function (e) {
        _preventDefault(e);
    },

    onClose : function (e) {
        _preventDefault(e);
    },

    onGalleryClick : function (e) {
        var photo = e.dataItem;
        galleryPicker._photo = photo;

        galleryPicker.closeModal();
        if (galleryPicker._callback !== null) {
            galleryPicker._callback(photo);
        }
    },

    openModal : function (callback)  {
        ux.setSearchPlaceholder("Search gallery");

        if (callback !== undefined) {
            galleryPicker._callback = callback;
        }

        if (!galleryPicker._viewInitialized) {
            galleryPicker._viewInitialized = true;

            $("#galleryPicker-listview").kendoMobileListView({
                dataSource: photoModel.photosDS,
                template: $("#galleryPicker-template").html(),
                click: function (e) {
                    _preventDefault(e);

                    var photo = e.dataItem, photoId = e.dataItem.photoId, photoUrl = e.dataItem.imageUrl;
                    galleryPicker._photo = photo;

                    galleryPicker.closeModal();
                    if (galleryPicker._callback !== null) {
                        galleryPicker._callback(photo);
                    }
                }

            });
        }

        $("#modalview-galleryPicker").kendoMobileModalView("open");
    },

    closeModal : function ()  {
        // reset photos
        $("#modalview-galleryPicker > div.footer.km-footer > a img").attr("src", "images/gallery-list.svg");
        $("#galleryPicker-listview li .galleryImg").addClass("galleryImg-grid").removeClass("galleryImg-full");
        galleryPicker._isGridView = true;

        // Reset the photo filter...
        photoModel.photosDS.filter([]);
        $("#modalview-galleryPicker").kendoMobileModalView("close");
    },

    setView: function(){
        if(galleryPicker._isGridView){
            $("#modalview-galleryPicker > div.footer.km-footer > a img").attr("src", "images/gallery-grid.svg");
            $("#galleryPicker-listview li .galleryImg").addClass("galleryImg-full").removeClass("galleryImg-grid");
            galleryPicker._isGridView = false;
        } else {

            $("#modalview-galleryPicker > div.footer.km-footer > a img").attr("src", "images/gallery-list.svg");
            $("#galleryPicker-listview li .galleryImg").addClass("galleryImg-grid").removeClass("galleryImg-full");
            galleryPicker._isGridView = true;
        }
    }

};


var sendViaModal = {
    _contact: null,
    _channel: null,
    _callback : null,
    sendListDS : new kendo.data.DataSource(),
    _viewInitialized : false,

    onInit : function (e) {
        //_preventDefault(e);

    },

    onOpen : function (e) {
        _preventDefault(e);
    },

    onClose : function (e) {
        _preventDefault(e);
    },

    buildSendList : function () {
        // build list of: 1) all group chats and 2) all member contacts
        var contacts = contactModel.getMemberContacts();
        var channels = channelModel.getGroupChannels();
    },
    
    openModal : function (callback)  {
        if (callback !== undefined) {
            sendViaModal._callback = callback;
        }

        if (!sendViaModal._viewInitialized) {
            sendViaModal._viewInitialized = true;

            $("#sendVia-listview").kendoMobileListView({
                dataSource: sendViaModal.sendListDS,
                template: $("#sendVia-template").html(),
                click: function (e) {
                    _preventDefault(e);

                    var contact = e.dataItem, photoId = e.dataItem.photoId, photoUrl = e.dataItem.imageUrl;

                    galleryPicker.photo = photo;

                    galleryPicker.closeModal();
                    if (galleryPicker._callback !== null) {
                        galleryPicker._callback(photo);
                    }
                }

            });
        }

        $("#sendViaModal").kendoMobileModalView("open");
    },

    closeModal : function ()  {


        $("#sendViaModal").kendoMobileModalView("close");
    }

};


var galleryEditView = {
    _callback : null,
    _initialized : false,
    _returnview : null,
    _mode : 'create',
    _galleryUUID : null,
    activeObj : new kendo.data.ObservableObject({title: null, tagString: null, shareString: null}),
    tags : null,
    tagString: null,
    members : null,
    memberString: null,
    photosDS:  new kendo.data.DataSource(),
    membersDS:  new kendo.data.DataSource(),

    onInit: function (e) {

        $('#galleryEditor-tagString').click(function(){

            var string = $('#galleryEditor-tagString').val();

            smartTagView.openModal(galleryEditView.tags, galleryEditView.tagString, function (tags, tagString ) {

            })

        });

        $('#galleryEditor-shareBtn').on("click", function(){

            var string = $('#galleryEditor-shareString').val();

            sharePickerView.openModal(galleryEditView.members, galleryEditView.memberString, function (members, memberString) {

            })

        });

        // track photo count on adds and deletes
        galleryEditView.photosDS.bind("change", function (e) {
            var changedPhotos = e.items;
            var photo = e.items[0];

            var photoCount = galleryEditView.photosDS.total();

            galleryEditView.activeObj.photoCount = photoCount;

            if (e.action !== undefined) {
                switch (e.action) {

                    case "remove" :
                        //
                        break;

                    case "add" :

                        break;
                }
            }


        });

        galleryEditView.activeObj.bind("change", function (e) {

            if (e.field === 'title') {
                var title = galleryEditView.activeObj.get('title');

                if (galleryEditView._mode === 'create') {
                    if (title.length > 2) {
                        galleryEditView.showSaveButton(true);
                    } else {
                        galleryEditView.showSaveButton(false);
                    }
                }
            }

        });

    },

    openSharePicker: function(){
        sharePickerView.openModal(galleryEditView.members, galleryEditView.memberString, function (members, memberString) {

        })
    },

    showSaveButton : function (show) {
        if (show) {
           $('#galleryEditor-saveBtn').removeClass('hidden');
        } else {
            $('#galleryEditor-saveBtn').addClass('hidden');
        }
    },


    initGallery : function (gallery) {
        var that = galleryEditView;

        if (gallery === null) {
            that.activeObj.noteType = privateNoteModel._gallery;
            that.activeObj.uuid = uuid.v4();
            that.activeObj.Id = that.activeObj.uuid;
            that.activeObj.photos= [];
            that.activeObj.set('photoCount', 0);
            that.activeObj.set('title','');
            that.activeObj.description = '';
            that.activeObj.set('tagString','');
            that.activeObj.tags = [];
            that.activeObj.set("isShared", false);
            that.activeObj.isOpen = false;
            that.activeObj.set("isTracked", false);
            that.activeObj.senderUUID = userModel._user.userUUID;
            that.activeObj.senderName = userModel._user.name;
            that.activeObj.timestamp = new Date();
            that.activeObj.ggType = galleryModel._ggClass;
            that.activeObj.set("ux_title", "New Gallery");
            galleryEditView._mode = 'create';
        } else {
            that.activeObj.Id = gallery.Id;
            that.activeObj.uuid = gallery.uuid;
            that.activeObj.photos =  gallery.photos;
            that.activeObj.set('photoCount',  gallery.photoCount);
            that.activeObj.set('title',  gallery.title);
            that.activeObj.set('description',  gallery.description);
            that.activeObj.set('tagString',  gallery.tagString);
            that.activeObj.tags = gallery.tags;
            that.activeObj.set("isShared", gallery.isShared);
            that.activeObj.isOpen = gallery.isOpen;
            that.activeObj.set("isTracked", gallery.isTracked);
            that.activeObj.senderUUID = gallery.senderUUID;
            that.activeObj.senderName = gallery.senderName;
            that.activeObj.timestamp = gallery.timestamp;
            that.activeObj.lastUpdate = gallery.lastUpdate;
            that.activeObj.ggType = gallery.ggType;
            that.activeObj.set("ux_title", gallery.title);
            galleryEditView._mode = 'edit';
        }

    },

    setSave : function (enable) {
        if (enable) {
            $('#galleryEditor-saveBtn').removeClass('hidden');
        } else {
            $('#galleryEditor-saveBtn').addClass('hidden');
        }
    },

    toggleTracking: function(){
        if(galleryEditView.activeObj.isTracked){
            galleryEditView.activeObj.set("isTracked", false);
        } else {
            galleryEditView.activeObj.set("isTracked", true);
        }
    },

    onShow : function (e) {
        //_preventDefault(e);

        if (!galleryEditView._initialized) {
            galleryEditView._initialized = true;
            $("#galleryEdit-listview").kendoMobileListView({
                dataSource: galleryEditView.photosDS,
                template: $("#gallery-template").html(),
                click : function (e) {
                    // _preventDefault(e);
                    var photo = e.dataItem, photoId = e.dataItem.photoId, photoUrl = e.dataItem.imageUrl;

                    // toggle private/public photo modal
                    if(galleryEditView.activeObj.isShared){
                        gallerySharedPhotoModal.openModal(photo);
                    } else {
                        modalPhotoView.openModal(photo);
                    }
                }
                /*dataBound: function(e){
                 ux.checkEmptyUIState(photoModel.photosDS, "#channelListDiv");
                 }*/
            });
        }
        // viewing an existing gallery
        if (e.view.params.galleryid !== undefined) {
            galleryEditView._galleryUUID = e.view.params.galleryid;
            var galleryList  =  galleryModel.findGallery(galleryEditView._galleryUUID);

            var gallery = null;

            if (galleryList.length > 0) {
                gallery = galleryList[0];

            } else {
                ggError("Invalid Gallery!");
                galleryEditView.onDone();
            }

            if (gallery.tags === undefined) {
                gallery.tags = [];
            }
            if (gallery.tagString === undefined) {
                gallery.tagString = null;
            }
            galleryEditView._mode = 'edit';
            galleryEditView.initGallery(gallery);

            //galleryEditView.photos = gallery.photos;

            $("#galleryEditor .createMode").addClass("hidden");
            $("#galleryEditor .viewerMode").removeClass("hidden");

            // is the user the owner
            if (galleryEditView.activeObj.senderUUID === userModel._user.userUUID) {
                galleryEditView.activeObj.set("ux_isOwner", true);
                galleryEditView.activeObj.set("ux_sender", "Me");
                galleryEditView.setSave(true);

            } else {
                // user can just view gallery
                galleryEditView.setSave(false);
                galleryEditView.activeObj.set("ux_isOwner", false);
                galleryEditView.activeObj.set("ux_sender", galleryEditView.activeObj.senderName);

            }
            // process gallery photos
            if(gallery.isShared){
                galleryEditView.processSharedPhotos();
            } else {
                galleryEditView.processPrivatePhotos();
            }

        } else {
            // Create a new gallery
            galleryEditView._galleryUUID = null;
            galleryEditView._mode = "create";
            galleryEditView.initGallery(null);
            $("#galleryEditor .createMode").removeClass("hidden");
            $("#galleryEditor .viewerMode").addClass("hidden");
            galleryEditView.activeObj.set("ux_isOwner", true);
        }


        if (e.view.params.callback !== undefined) {
            galleryEditView._callback = e.view.params.callback;
        } else {
            galleryEditView._callback = null;
        }

        if (e.view.params.returnview !== undefined) {
            galleryEditView._returnview = e.view.params.returnview;
        } else {
            galleryEditView._returnview = null;
        }



    },

    onHide: function (e) {


    },

    onDone : function (e) {
        // _preventDefault(e);

        if (galleryEditView._returnview !== null) {
            APP.kendo.navigate('#'+galleryEditView._returnview);
        }

    },

    addPhotoToGallery : function (photoId, displayUrl) {
        var photoObj = photoModel.findPhotoById(photoId);

        if (photoObj !== undefined) {

            galleryEditView.photosDS.add(photoObj);
            galleryEditView.photosDS.sync();
        }

    },


    updateImageUrl : function (photoId, shareUrl) {
        var photoObj = photoModel.findPhotoById(photoId);

        if (photoObj !== undefined) {
            // update the cloud url for this gallery photo
        }

    },


    onSave : function (e) {

        galleryEditView.saveGallery();
        galleryEditView.onDone();
    },

    addCamera : function (e) {
        _preventDefault(e);

        devicePhoto.deviceCamera(
            devicePhoto._resolution, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            null,  // Current channel Id for offers
            galleryEditView.addPhotoToGallery,  // Optional preview callback
            galleryEditView.updateImageUrl
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
            galleryEditView.addPhotoToGallery,  // Optional preview callback
            galleryEditView.updateImageUrl
        );
    },

    addGallery : function (e) {
        _preventDefault(e);

        galleryPicker.openModal(function (photo) {

            var url = photo.thumbnailUrl;
            if (photo.imageUrl !== undefined && photo.imageUrl !== null)
                url = photo.imageUrl;

            galleryEditView.addPhotoToGallery(photo.photoId, url);
        });

    },

    processSharedPhotos : function () {
        var obj = galleryEditView.activeObj;
        // todo - wire shared photos
    },

    processPrivatePhotos : function () {
        var obj = galleryEditView.activeObj;
        var len = galleryEditView.photosDS.total();
        var photoArray = [];
        for (var i=0; i<len; i++) {
            var photo = galleryEditView.photosDS.at(i);
            photoArray.push(photo.uuid);
        }
        obj.photos = photoArray;
    },

    saveGallery: function () {

        var title = $('#galleryEditor-title').val();
        var tagString =  $('#galleryEditor-tagString').val();

        var activeGallery = galleryEditView.activeObj;


        if (galleryEditView._mode === 'edit') {

            var gallery = privateNoteModel.findGallery(activeGallery.uuid);

            gallery.set('title', title);
            gallery.set('tagString', tagString);
            gallery.set('tags', []);
            gallery.set('photoCount', galleryEditView.photosDS.total());
            if (gallery.isShared) {
                galleryEditView.processSharedPhotos();
            } else {
                galleryEditView.processPrivatePhotos();
            }
            gallery.set('lastUpdate',ggTime.currentTime());
            gallery.set('timestamp',ggTime.currentTime());

            galleryModel.updateGallery(gallery);

        } else {

            activeGallery.title = title;
            activeGallery.tags = [];
            activeGallery.tagString = tagString;
            activeGallery.timestamp = ggTime.currentTime();
            activeGallery.lastUpdate = ggTime.currentTime();
            activeGallery.set("photoCount", galleryEditView.photosDS.total());
            if (activeGallery.isShared) {
                galleryEditView.processSharedPhotos();
            } else {
                galleryEditView.processPrivatePhotos();
            }

            galleryModel.addGallery(activeGallery);
        }


    }


};

var userGalleryView = {
    _modelWindow: '#',
    onDone: function(){

    }
};