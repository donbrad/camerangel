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
        //_preventDefault(e);

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

            $("#gallery-listview").kendoMobileListView({
                dataSource: photoModel.photosDS,
                template: $("#gallery-template").html(),
                click : function (e) {
                    _preventDefault(e);

                    var photo = e.dataItem, photoId = e.dataItem.photoId, photoUrl = e.dataItem.imageUrl;

                    modalPhotoView.openModal(photo);
                }
                /*dataBound: function(e){
                    ux.checkEmptyUIState(photoModel.photosDS, "#channelListDiv");
                }*/
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

        galleryView.updateTotalPhotos();


        $("#gallery > div.footerMenu.km-footer > a").removeAttr("href").on("click", function(e){
            _preventDefault(e);
            $("#galleryActions1").data("kendoMobileActionSheet").open();
        });
        




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
                var url = photo.thumbnailUrl;
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
        //console.log(photo);

        // photo owner
        if (photo.ownerUUID === userModel._user.userUUID) {
            //$('#modalChatPhotoView-userhascopy').addClass('hidden');
            $("#modalChatPhotoRecipient").addClass('hidden');
            $("#modalChatPhotoSender").removeClass('hidden');


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
        } else {
            // user does not own the photo
            $("#modalChatPhotoOwnerName").text(photo.ownerName);

            $("#modalChatPhotoRecipient").removeClass('hidden');

            $("#modalChatPhotoSender").addClass('hidden');

            // If the user already has a copy of this photo -- hide all recipient options
            if (modalChatPhotoView._userHasCopy) {
                $("#modalChatPhotoView-recipientlist").addClass('hidden');
            } else {
                $("#modalChatPhotoView-recipientlist").removeClass('hidden');
            }

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
             if (photo.deviceUrl !== null) {
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

                     var photoObj = photoModel.findPhotoById(photoId);

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
            dataSource: contactModel.contactTagsDS
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
            modalPhotoView._activePhoto.set('placeName', placeObj.lng);

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
            smartEventPlacesView.openModal(address, "Memory Photo", function (placeObj) {
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
        var locObj = {placeId: null, lat: modalPhotoView._activePhoto.lat, lng: modalPhotoView._activePhoto.lng, name: "Photo", targetName: modalPhotoView._address};

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
        _preventDefault(e);
        sendViaModal.openModal();
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

        if (!galleryPicker._viewInitialized) {
            galleryPicker._viewInitialized = true;

            $("#galleryPicker-listview").kendoMobileListView({
                dataSource: photoModel.photosDS,
                template: $("#galleryPicker-template").html(),
                click: function (e) {
                    _preventDefault(e);

                    var photo = e.dataItem, photoId = e.dataItem.photoId, photoUrl = e.dataItem.imageUrl;

                    galleryPicker.photo = photo;

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