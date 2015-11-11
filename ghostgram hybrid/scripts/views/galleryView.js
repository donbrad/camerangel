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


        

        var scroller = e.view.scroller;
        //scroller.scrollTo(0,-44);
        /* Testing dynamic header 
		
		scroller.bind("scroll", function(e){
			
			var scrollPos = scroller.scrollTop;
			var newHeight = 56 - scrollPos;
			console.log(scrollPos);
			if (scrollPos > 56){
				$("#gallery > div.km-header > div.km-widget.km-navbar").addClass("home-smallHeader");
				//$("#gallery > div.km-header > .helperInfoBar").removeClass("hidden");
			} else {
				$("#gallery > div.km-header > div.km-widget.km-navbar").removeClass("home-smallHeader");
				//$("#gallery > div.km-header > .helperInfoBar").addClass("hidden");
			}
		}); 
		*/

    },

    searchBind: function(){
    	$('.gg_mainSearchInput').attr('placeholder', 'Search memories...');

    	$(".gg_mainSearchInput").on('input', function() {
            var query = $(this).val();
            if (query.length > 0) {

            }

        }).clearSearch({
            callback: function() {
                // todo - wire search
            }
        });

    },

    onShow : function (e) {

        _preventDefault(e);


        if (e.view.params.mode !== undefined && e.view.params.mode === 'picker') {
            galleryView._pickerMode = true;
            mobileNotify("Please select an image to send...")
        } else {
            galleryView._pickerMode = false;
        }

        if (e.view.params.returnview !== undefined) {
            galleryView._returnView = e.view.params.returnview;
        }

        // set search 
        galleryView.searchBind();

        photoModel.rotationAngle = 0;
        
        // Set action btn
        var $actionBtn = $("#gallery > div.footerMenu.km-footer > a");
        var $actionBtnImg = $("#gallery > div.footerMenu.km-footer > a > span > img");
        var $actionBtnP = $("#gallery > div.footerMenu.km-footer > a > span > p");
        var scroller = e.view.scroller;
      	
        $actionBtn.removeAttr("href").on("click", function(e){
				galleryView.galleryActionView(e);
			
			});
        

        // Set img size for gallery
        $("#gallery-listview li").css("width",photoModel.previewSize);
        $("#gallery-listview li").css("padding-bottom",photoModel.previewSize);

        // if gallery photos are open, display actionBtn
        var galleryMenuIndex = $("#galleryMenuSelect").data("kendoMobileButtonGroup").current().index();
        if(galleryMenuIndex === 0){
        	$actionBtn.css("display", "inline-block");
        } 

        if(galleryView._previewSize === "33%"){
        	$actionBtnP.text("List view");
        	$actionBtnImg.attr("src", "images/gallery-list.svg");
        } else {
        	$actionBtnP.text("Grid view");
        	$actionBtnImg.attr("src", "images/gallery-grid.svg");
        }
        
        $actionBtnP.addClass("actionBtn-text-light");
        ux.showActionBtnText("#gallery", "3.5rem");

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

        $actionBtn.css("display", "none");
        $actionBtnImg.attr("src", "images/nav-add-white.svg");

        $actionBtnP.removeClass("actionBtn-text-light").text("");

        // reset search
        ux.resetSearch();
    },

    galleryActionView: function(e){
    	_preventDefault(e);
    	var $actionBtnP = $("#gallery > div.footerMenu.km-footer > a > span > p");
    	
		if(galleryView._previewSize === "33%") {
			ux.changeActionBtnImg("#gallery", "gallery-grid");
			$actionBtnP.text("Grid view");

            galleryView._previewSize = "100%";
		} else {
			ux.changeActionBtnImg("#gallery", "gallery-list");
			$actionBtnP.text("List view");
            galleryView._previewSize = "33%";
			
		}
		$("#gallery-listview li").css("width",galleryView._previewSize);
        $("#gallery-listview li").css("padding-bottom",galleryView._previewSize);
    },

    selectCategory : function (e){
        _preventDefault(e);
        var index = this.current().index();
        switch (index) {
            case 0:
            	ux.showActionBtn(true, "#gallery");
                $('#archive-listview').addClass('hidden');
                $("#gallery-listview").removeClass("hidden");
                break;

            case 1:
                ux.showActionBtn(false, "#gallery");
                $('#archive-listview').removeClass('hidden');
                $("#gallery-listview").addClass('hidden');
                break;
        }
        $("#gallerySearch").attr("placeholder", "Search All");
    },

    galleryClick : function (e) {
        _preventDefault(e);
        
        var photoId = e.dataItem.photoId, photoUrl = e.dataItem.imageUrl;
        
        galleryView._currentPhotoUrl = photoUrl;
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
        }
    },

    deletePhoto: function (e) {
        _preventDefault(e);

        photoModel.deletePhoto(galleryView._currentPhotoId);

        mobileNotify("Deleted current photo");

        // Navigate to previous page as the photo is gone...
        APP.kendo.navigate('#:back');
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
    _activePhoto: null,

    openModal : function (photo) {
        modalPhotoTag._activePhoto = photo;
        $("#modalview-photoTag").data("kendoMobileModalView").open();
    },

    closeModal : function () {
        $("#modalview-photoTag").data("kendoMobileModalView").close();
    },

    onDone : function(e) {
        _preventDefault(e);
        // Update data source and parse...

        var photoObj = photoModel.findPhotoById(modalPhotoTag._activePhoto.photoId);

        if (photoObj !== undefined) {
            photoObj.title = modalPhotoTag._activePhoto.title;
            photoObj.description = modalPhotoTag._activePhoto.description;
            photoObj.tagsString = modalPhotoTag._activePhoto.tagsString;
            photoObj.tags = photoObj.tagsString.split(',');

            updateParseObject('photos', "photoId", modalPhotoTag._activePhoto.photoId, "title", photoObj.title);
            updateParseObject('photos', "photoId", modalPhotoTag._activePhoto.photoId, "description", photoObj.description);
            updateParseObject('photos', "photoId", modalPhotoTag._activePhoto.photoId, "tags", photoObj.tags);
            updateParseObject('photos', "photoId", modalPhotoTag._activePhoto.photoId, "tagsString", photoObj.tagsString);

        } else {
            mobileNotify("Can't find photo model!!");
        }
        modalPhotoTag.closeModal();
    }

};

var modalPhotoView = {
    _photo: null,
    _photoUrl : null,
    _activePhoto : new kendo.data.ObservableObject(),

    onInit: function(e){
    	$(".photoViewBox").kendoTouch({
    		filter: "img",
    		tap: function(e){

    		}
    	});
    },

    openModal : function (photo) {
        modalPhotoView._photo = photo;
        modalPhotoView._photoUrl = url;
        modalPhotoView._activePhoto.set('photoId', photo.photoId);
        modalPhotoView._activePhoto.set('title', photo.title);
        modalPhotoView._activePhoto.set('description', photo.description);
        modalPhotoView._activePhoto.set('tags', photo.tags);
        modalPhotoView._activePhoto.set('tagsString', photo.tagsString);
        var tagString = '';

        if (photo.tags !== undefined && photo.tags.length > 0) {
            for (var i=0; i++; i< photo.tags.length) {
                tagString += photo.tags[i] + ', ';
            }

            // Remove the trailing comma and space...
            tagString.substring(0,tagString.length - 2);

            modalPhotoView._activePhoto.set('tagsString', tagString);
        }

        if (photo.title !== undefined && photo.title !== null)
            $("#modalPhotoViewTitle").text(photo.title);


        $("#modalPhotoView").data("kendoMobileModalView").open();
    },

    closeModal : function () {
        $("#modalPhotoView").data("kendoMobileModalView").close();
    },

    openTagEditor : function (e) {
        _preventDefault(e);
        modalPhotoTag.openModal(modalPhotoView._activePhoto);
    },

    deletePhoto : function (e) {
        _preventDefault(e);

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


var modalGalleryView = {

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

        currentChannelModel.currentMessage.photo = {thumb: thumbUrl, photo: photoUrl};
        if (modalGalleryView._callback !== null) {
            modalGalleryView._callback(photoUrl);
            modalGalleryView.closeModal();
        }
       /* galleryView._currentPhotoUrl = photoUrl;
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
    }

};


var galleryPicker = {
    _photo: null,
    _photoId : null,
    _callback : null,

    onInit : function (e) {
        _preventDefault(e);
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
        $("#modalview-galleryPicker").kendoMobileModalView("close");
    },

    setListView : function (e) {
        $("#galleryPicker-listview li").css("width","100%");
        $("#galleryPicker-listview li").css("padding-bottom","100%");
    },

    setGridView : function (e) {
        $("#galleryPicker-listview li").css("width","33%");
        $("#galleryPicker-listview li").css("padding-bottom","33%");
    }

};