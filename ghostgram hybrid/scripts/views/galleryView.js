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

    onInit : function (e) {
        _preventDefault(e);

        archiveView.init();

        var setSentinelHeight = function () {
            $('#search-archives').height(getSentinelHeight());
        };

        /*
         archiveView.sentinel.addListener('add', setSentinelHeight);
         archiveView.sentinel.addListener('remove', setSentinelHeight);
         setSentinelHeight();
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



    onShow : function (e) {

        _preventDefault(e);

        ux.hideKeyboard();

        if (!galleryView._viewInitialized) {
            galleryView._viewInitialized = true;


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

            })
           
            // bind clear search btn
			$("#gallery .enterSearch").on("click", function(){
					$("#gallery .gg_mainSearchInput").val('');
					
					// reset data filters
                   photoModel.photosDS.filter([]);

                   // hide clear btn
                   $(this).addClass('hidden');
			})

        }

        $('#gallery .gg_mainSearchInput').attr('placeholder', 'Search memories...');


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
        

        var scroller = e.view.scroller;


        // Set action btn
        ux.showActionBtn(true, "#gallery", "");
        ux.changeActionBtnImg("#gallery", "icon-camera");
        ux.showActionBtnText("#gallery", "3.5rem", "Camera");



        $("#gallery > div.footerMenu.km-footer > a").removeAttr("href").on("click", function(e){
            _preventDefault(e);
            $("#galleryActions1").data("kendoMobileActionSheet").open();
        });


        // if gallery photos are open, display actionBtn
        var galleryMenuIndex = $("#galleryMenuSelect").data("kendoMobileButtonGroup").current().index();
        if(galleryMenuIndex === 0){
        	//$actionBtn.css("display", "inline-block");
        } else {

        }

        // set result count
        var photoCount = photoModel.photosDS._total;
        if(photoCount > 0){
            $(".results").css("visibility", "visible");
            $("#resultCount").text(photoCount);
        } else {
            $(".results").css("visibility", "hidden");
        }
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
                ux.showActionBtn(true, "#gallery");
                $('#archive-listview').addClass('hidden');
                $("#gallery-listview").removeClass("hidden");
                $(".resultsBar").removeClass("hidden");
                break;

            case 1:
                ux.showActionBtn(false, "#gallery");
                $('#archive-listview').removeClass('hidden');
                $("#gallery-listview").addClass('hidden');
                $(".resultsBar").addClass("hidden");
                break;
        }
        $("#gallerySearch").attr("placeholder", "Search All");
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

        // Navigate to previous page as the photo is gone...
        APP.kendo.navigate('#:back');
    },

    galleryCamera : function (e) {
        _preventDefault(e);

        devicePhoto.deviceCamera(
            1600, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            null  // Current channel Id for offers
        );
    },

    galleryPhoto : function (e) {
        _preventDefault(e);
        // Call the device gallery function to get a photo and get it scaled to gg resolution
        devicePhoto.deviceGallery(
            1600, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            null // Current channel Id for offers
        );
    },
    sharePhoto: function (e)  {
        _preventDefault(e);

    },

    editPhoto: function (e) {
        _preventDefault(e);
    },

    selectSearchTool : function (e) {
        _preventDefault(e);

        var index = this.current().index();

        switch (index) {

            case 0: // Search
                $("#gallerySearch").attr("placeholder", "Search all");
                break;

            case 1: // Contacts
                $("#gallerySearch").attr("placeholder", "Search contacts");
                break;

            case 2: // Chats
                $("#gallerySearch").attr("placeholder", "Search chats");
                break;

            case 3: // Calendar
                $("#gallerySearch").attr("placeholder", "Search dates");
                break;

            case 4: // Places
                $("#gallerySearch").attr("placeholder", "Search places");
                break;
        }

    }
};


var photoView = {
    _activePhoto: {},
    _activePhotoId: null,
    _activePhotoUrl: null,

    onInit: function (e) {
        _preventDefault(e);

    },

    onShow : function (e) {
        _preventDefault(e);

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
        _preventDefault(e);

    },

    onShow : function (e) {
        _preventDefault(e);

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

    /*        updateParseObject('photos', "photoId", modalPhotoTag._activePhoto.photoId, "title", photoObj.title);
            updateParseObject('photos', "photoId", modalPhotoTag._activePhoto.photoId, "description", photoObj.description);
            updateParseObject('photos', "photoId", modalPhotoTag._activePhoto.photoId, "tags", photoObj.tags);
            updateParseObject('photos', "photoId", modalPhotoTag._activePhoto.photoId, "tagsString", photoObj.tagsString);
*/
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
    _activePhoto : new kendo.data.ObservableObject(),

    onInit: function(e){
        var showInfo =  modalPhotoView._showInfo;


    },

    updatePhotoStatus : function (photo) {
        if (photo.ownerId === userModel._user.userUUID) {
            $("#modalChatPhotoRecipient").addClass('hidden');
            $("#modalChatPhotoSender").removeClass('hidden');
            if (photo.canCopy) {
                $("#modalChatPhotoViewDecline").addClass('hidden');
                $("#modalChatPhotoViewUnlock").addClass('hidden');
                $("#modalChatPhotoViewApprove").addClass('hidden');
                $("#modalChatPhotoViewOwnerUnlocked").removeClass('hidden');

            } else {
                $("#modalChatPhotoViewDecline").addClass('hidden');
                $("#modalChatPhotoViewUnlock").removeClass('hidden');
                $("#modalChatPhotoViewApprove").addClass('hidden');
                $("#modalChatPhotoViewOwnerUnlocked").addClass('hidden');
            }

        } else {
            // If the user already has a copy of this photo -- hide all recipient options
            if (modalChatPhotoView._userHasCopy) {
                $("#modalChatPhotoView-recipientlist").addClass('hidden');
            } else {
                $("#modalChatPhotoView-recipientlist").removeClass('hidden');
            }
            $("#modalChatPhotoOwnerName").text(photo.ownerName + "'s Photo");
            $("#modalChatPhotoRecipient").removeClass('hidden');
            $("#modalChatPhotoSender").addClass('hidden');
            if (photo.canCopy) {
                $("#modalChatPhotoViewLocked").addClass('hidden');
                $("#modalChatPhotoViewRequestSent").addClass('hidden');
                $("#modalChatPhotoViewUnlocked").removeClass('hidden');
            } else {
                $("#modalChatPhotoViewUnlocked").addClass('hidden');
                if (photo.requestSent === undefined) {
                    $("#modalChatPhotoViewLocked").removeClass('hidden');
                    $("#modalChatPhotoViewRequestSent").addClass('hidden');
                } else {
                    $("#modalChatPhotoViewRequestSent").removeClass('hidden');
                    $("#modalChatPhotoViewLocked").addClass('hidden');
                }
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

     openModal : function (photo) {

        modalChatPhotoView._photo = photo;
        var url = photo.thumbnailUrl;
        if (photo.imageUrl !== null)
            url = photo.imageUrl;

         $.ajax({
             url:url,
             error:
                 function(){
                    mobileNotify("Sender has deleted this photo...");
                 },
             success:
                 function(){
                     modalChatPhotoView._photoUrl = url;
                     modalChatPhotoView._activePhoto.set('photoUrl', url);
                     modalChatPhotoView._activePhoto.set('photoId', photo.photoId);

                     var photoObj = photoModel.findPhotoById(photo.photoId);

                     modalChatPhotoView._userHasCopy = false;
                     $('#modalChatPhotoView-userhascopy').addClass('hidden');
                     if (photoObj !== undefined) {
                         // This user already has a copy of this photo
                         modalChatPhotoView._userHasCopy = true;
                         $('#modalChatPhotoView-userhascopy').removeClass('hidden');

                         if (photoObj.canCopy === undefined) {
                             photoObj.canCopy = true;
                         }
                     }

                     modalChatPhotoView.updatePhotoStatus(photo);

                     $("#modalChatPhotoView").data("kendoMobileModalView").open();
                 }
         });

    },

    closeModal : function () {
        $("#modalChatPhotoView").data("kendoMobileModalView").close();
    },


};

var modalPhotoView = {
    _photo: null,
    _photoUrl : null,
    _dummyTitle : '',
    _dummyDescription : '',
    _dummyTagsString : '',
    _activePhoto : new kendo.data.ObservableObject(),
    _showInfo: true,

    onInit: function(e){
    	var showInfo =  modalPhotoView._showInfo;

    	$(".photoViewBox").kendoTouch({
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
    	});
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
            dataSource: contactModel.contactTagsDS
        });
    },

    openModal : function (photo) {
        modalPhotoView._photo = photo;

        var url = photo.thumbnailUrl;
        if (photo.imageUrl !== null)
            url = photo.imageUrl;
        modalPhotoView._photoUrl = url;

        modalPhotoView._activePhoto.set('photoId', photo.photoId);
        if (photo.title === null) {
            photo.title = modalPhotoView._dummyTitle;
        }
        modalPhotoView._activePhoto.set('title', photo.title);
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

        if (photo.placeString !== undefined && photo.placeString !== null) {
            $("#photo-location").val(modalPhotoView._activePhoto.placeString);
        } else {
            $("#photo-location").val(modalPhotoView._activePhoto.addressString);
        }


        // Date
        var createdDate = moment(photo.createdAt).format("MMM Do, YYYY");
        $("#photoTitle-date").text(createdDate);

        $("#modalPhotoView").data("kendoMobileModalView").open();

        // Confirm that we have a valid local copy of this photo
        photoModel.isPhotoCached(photo);
    },

    closeModal : function () {
        $("#modalPhotoView").data("kendoMobileModalView").close();
    },

    openTagEditor : function (e) {
        _preventDefault(e);

        $(".photoTitleBox").velocity({height: "20rem"}, {duration: 800, easing: "spring"});
        $(".photoTitleText").addClass("hidden");
        $(".photoTitleInput").removeClass("hidden");

        modalPhotoView._showInfo = true;

        // Hide actionBtn
        $("#modalPhotoView .actionBtn").velocity("fadeOut", {duration: 0});

        // bug - can't access data-click so have to have 2 btns
        $("#modalPhotoView-close").addClass("hidden");
        $("#modalPhotoView-update").removeClass("hidden");

    },

    closeTagEditor: function(e){
    	// Update data source and parse...

        var photoObj = photoModel.findPhotoById(modalPhotoView._activePhoto.photoId);

        if (photoObj !== undefined) {
            photoObj.title = modalPhotoView._activePhoto.title;
            photoObj.description = modalPhotoView._activePhoto.description;
            photoObj.tagsString = modalPhotoView._activePhoto.tagsString;
            if (photoObj.tagsString.length > 0){
                photoObj.tags = photoObj.tagsString.split(',');
            } else {
                photoObj.tags = [];
            }

            /*updateParseObject('photos', "photoId", modalPhotoView._activePhoto.photoId, "title", photoObj.title);
            updateParseObject('photos', "photoId", modalPhotoView._activePhoto.photoId, "description", photoObj.description);
            updateParseObject('photos', "photoId", modalPhotoView._activePhoto.photoId, "tags", photoObj.tags);
            updateParseObject('photos', "photoId", modalPhotoView._activePhoto.photoId, "tagsString", photoObj.tagsString);
*/
        } else {
            mobileNotify("Can't find photo model!!");
        }

    	// UI reset
    	$(".photoTitleBox").velocity({height: "10rem"}, {duration: 400});
        $(".photoTitleText").removeClass("hidden");
        $(".photoTitleInput").addClass("hidden");

        $("#modalPhotoView .actionBtn").velocity("fadeIn", {delay: 300});

        $("#modalPhotoView-close").removeClass("hidden");
        $("#modalPhotoView-update").addClass("hidden");
    },

    deletePhoto : function (e) {
        _preventDefault(e);

        // Overlapping modals, need to close photoView first
        modalPhotoView.closeModal();

        modalView.open("Delete Photo?", "This action will delete this photo and any offers",
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

// Removing this legacy view -- gallerypicker is new replacement.  just keeping the code for reference...
/*var modalGalleryView = {

    _callback: null,

    openModal: function (callback) {

        if (callback !== undefined) {
            modalGalleryView._callback = callback;
        }

        $("#modalgallery-listview li").css("width","100%");
        $("#modalgallery-listview li").css("padding-bottom","100%");
        $("#modalGalleryView").data("kendoMobileModalView").open();

    },

    closeModal: function (e) {
        _preventDefault(e);
        $("#modalGalleryView").data("kendoMobileModalView").close();
    },

    galleryClick : function (e) {
        _preventDefault(e);

        var photoId = e.dataItem.photoId, photoUrl = e.dataItem.imageUrl, thumbUrl = e.dataItem.thumbnailUrl;

        currentChannelModel.currentMessage.photo = {thumbnailUrl: thumbUrl, imageUrl: photoUrl};
        if (modalGalleryView._callback !== null) {
            modalGalleryView._callback(photoUrl);
            modalGalleryView.closeModal();
        }
       /!* galleryView._currentPhotoUrl = photoUrl;
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
        }*!/
    }

};*/


var galleryPicker = {
    _photo: null,
    _photoId : null,
    _callback : null,
    _isGridView: true,

    onInit : function (e) {
        _preventDefault(e);

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
        galleryPicker.photo = photo;

        galleryPicker.closeModal();
        if (galleryPicker._callback !== null) {
            galleryPicker._callback(photo);
        }
    },

    openModal : function (callback)  {
        if (callback !== undefined) {
            galleryPicker._callback = callback;
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