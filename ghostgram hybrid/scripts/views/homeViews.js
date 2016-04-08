/**
 * Created by donbrad on 9/29/15.
 * homeViews.js -- all view management for userstatus, login, logout, home and newuserhome
 */


'use strict';

/*
 * homeView -- for signed in users / members
 */

var homeView = {
    _radius: 90, // 90 meters or approx 300 ft

    openNotificationAction: function(e){
        // todo - wire notification action
    },


    openLocateMeModal: function () {
        ux.hideKeyboard();

        $('#modalview-locate-me').data('kendoMobileModalView').open();

        mapModel.getCurrentPosition(true, function (lat, lng) {
            var latlng = new google.maps.LatLng(lat, lng);
            var places = APP.map.googlePlaces;
            var nearbyResults = new kendo.data.DataSource();

            var userPlaces = placesView.matchLocationToUserPlace(lat, lng);

            userPlaces.forEach( function (userPlace ) {
                nearbyResults.add(userPlace);
            });

            places.nearbySearch({
                location: latlng,
                radius: homeView._radius
            }, function (placesResults, placesStatus) {
                if (placesStatus === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                    APP.map.geocoder.geocode({ 'latLng': latlng }, function (geoResults, geoStatus) {
                        if (geoStatus !== google.maps.GeocoderStatus.OK) {
                            mobileNotify('Something went wrong with the Google geocoding service.');
                            return;
                        }
                        if (geoResults.length === 0 || geoResults[0].types[0] !== 'street_address') {
                            mobileNotify('We couldn\'t match your position to a street address.');
                            return;
                        }

                        var address = placesView.getAddressFromComponents(geoResults[0].address_components);

                        var newAdd = nearbyResults.add({
                            uuid: uuid.v4(),
                            category: 'Street Address',   // valid categories are: Place and Location
                            placeUUID: '',
                            name: address.streetNumber+' '+address.street,
                            venueName: '',
                            streetNumber: address.streetNumber,
                            street: address.street,
                            city: address.city,
                            state: address.state,
                            zip: address.zip,
                            country: address.country,
                            googleId: '',
                            factualId: '',
                            lat: lat,
                            lng: lng,
                            publicName: '',
                            alias: '',
                            isVisible: true,
                            isPrivate: true,
                            autoCheckIn: false,
                            vicinity: address.city+', '+address.state
                        });
                    });
                } else if (placesStatus !== google.maps.places.PlacesServiceStatus.OK) {
                    mobileNotify('Something went wrong with the Google Places service. '+placesStatus);
                    return;
                }

                placesResults.forEach( function (placeResult) {
                    var alreadyAUserPlace = false;
                    userPlaces.forEach( function (userPlace) {
                        if (userPlace.googleId === placeResult.place_id) {
                            alreadyAUserPlace = true;
                            return;
                        }
                    });

                    nearbyResults.add({
                        uuid: '',
                        category: 'Street Address',   // valid categories are: Place and Location
                        placeUUID: '',
                        name: placeResult.name,
                        venueName: placeResult.name,
                        streetNumber: '',
                        street: '',
                        city: '',
                        state: '',
                        zip: '',
                        country: '',
                        googleId: placeResult.place_id,
                        factualId: '',
                        lat: placeResult.geometry.location.G,
                        lng: placeResult.geometry.location.K,
                        publicName: '',
                        alias: '',
                        isVisible: true,
                        isPrivate: true,
                        autoCheckIn: false,
                        vicinity: placeResult.vicinity
                    });

                    if (alreadyAUserPlace === false) {
                        nearbyResults.add(placeResult);
                    }
                });

                $('#nearby-results-list').data('kendoMobileListView').setDataSource(nearbyResults);

                // Show modal letting user select current place
            });
        });
    },

    closeLocateMeModal: function () {
        $('#modalview-locate-me').data('kendoMobileModalView').close();
    },

    onShowProfileStatus: function(e){

        if (e !== undefined && e.preventDefault !== undefined) {
            e.preventDefault();
        }

        var alias = userModel._user.alias;
        var verified = userModel._user.phoneValidated;
        var name = userModel._user.name;

        var status = userModel._user.statusMessage;
        var available = userModel._user.isAvailable;
        var location = userModel._user.currentPlace;

        ux.formatNameAlias(name, alias, "#modalview-profileStatus");

        // Set profile status
        $("#profileStatusMessage").text(status);

        // Set verified
        if(verified){
            $("#profileStatusVerified").removeClass("hidden");
        }
        // Set available
        if(available){
            $(".userAvailable").attr("src", "images/status-available.svg");
            $(".userAvailableRev").attr("src", "images/status-away.svg");
            $("#currentAvailableTxt").text("busy");

        } else {
            $(".userAvailable").attr("src", "images/status-away.svg");
            $(".userAvailableRev").attr("src", "images/status-available.svg");
            $("#currentAvailableTxt").text("available");
        }

        // set location
        if(location !== undefined){
            $("#profileLocation").removeClass("hidden");
            // todo - wire location
        }

        // set status charcter count
        statusCharCount();


    },

    checkInToPlace: function (e) {
        var item = e.item.children('div').first().data('item');

        var finishCheckingIn = function (item) {
            $('#checked-in-place > span').html(item.name);
            $('#checked-in-place').show(200);
            $('#modalview-locate-me').data('kendoMobileModalView').close();

           // APP.models.places.placesDS.add(item);

            userModel._user.set('currentPlace', item.name);
            userModel._user.set('currentPlaceUUID', item.uuid);
        };

        // If the item has a uuid it means we've already added it,
        // or it's a street address so we don't have to find the
        // address.
        if (item.uuid !== '') {
            finishCheckingIn(item);
            return;
        }

        var latlng = new google.maps.LatLng(item.lat, item.lng);

        // Otherwise it's a new place from Google so we find the address
        APP.map.geocoder.geocode({ 'latLng': latlng }, function (geoResults, geoStatus) {
            if (geoStatus !== google.maps.GeocoderStatus.OK) {
                navigator.notification.alert('Something went wrong with the Google geocoding service.');
                return;
            }
            if (geoResults.length === 0 || geoResults[0].types[0] !== 'street_address') {
                navigator.notification.alert('We couldn\'t match your position to a street address.');
                return;
            }

            var address = placesView.getAddressFromComponents(geoResults[0].address_components);
        });
    },

    checkOutOfPlace: function () {
        $('#checked-in-place').hide(200);

        userModel._user.set('currentPlace', '');
        userModel._user.set('currentPlaceUUID', '');
    },

    clearNotifications : function (e) {
        _preventDefault(e);
        notificationModel.deleteAllNotifications();
    },

    dismissNotification : function (e) {
        _preventDefault(e);
        var $currentBtn = $(e.button[0]);
        var uuid = e.sender.element[0].attributes['data-uuid'].value;
        /*var closeStatus = $currentBtn.hasClass("ggHome-close");

        if(closeStatus) {*/
        if (uuid !== undefined && uuid !== null)
            notificationModel.deleteNotificationById(uuid);
       /* }*/
    },

    onInit: function(e) {
        _preventDefault(e);

        if (userModel._user.currentPlace !== '') {
            $('#checked-in-place > span').html(userModel._user.currentPlace);
            $('#checked-in-place').show();
        }
        /*
         $('#homeSearchQuery').clearSearch({
         callback: function() {
         // todo - wire search
         }
         });
         */

        $(".home-status").kendoTouch(

            { doubletap: function (e) { mobileNotify("Double Tap: Open Hot Buttons!"); }
        });

        $(".footer-menu").kendoTouch({
            multiTouch: true,
            gesturestart: function (e) {
                mobileNotify("Two Finger: Open Hot Buttons!");
            }
        });



        $("#notification-listview").kendoMobileListView({
            dataSource: notificationModel.notificationDS,
            template: $("#notificationTemplate").html(),
            click: function(e){
                var $target = $(e.target);
                if($target.hasClass("textClamp")){
                    $(".notify-expand").addClass("textClamp").removeClass("notify-expand");
                    $target.removeClass("textClamp").addClass("notify-expand");
                } else {
                    $(".notify-expand").addClass("textClamp").removeClass("notify-expand");
                }
            },
            dataBound: function(e) {
                ux.checkEmptyUIState(notificationModel.notificationDS, "#home");
            }
        });
    },

    onShow: function (e) {
        _preventDefault(e);

        ux.setSearchPlaceholder("Search notifications");

        // set verified ui for start screen
        if(userModel._user.phoneValidated) {
            $("#startPhoneVerified").addClass("hidden");
        }

        // Set user availability
        ux.updateHeaderStatusImages();


        // Hide action button on home
        ux.showActionBtn(false, "#home");

        // Display Unread Chat Notifications
        notificationModel.processUnreadChannels();
    },

    onHide: function(e){
        _preventDefault (e);
        $(".homeToggleSetting").addClass("hidden");
        $(".homeToggleSearch").removeClass("hidden");
    },

    closeStatusModal: function(){
        $("#modalview-profileStatus").data("kendoMobileModalView").close();
    },

    changeAvailable: function(){
        var currentAvailable = userModel._user.get('isAvailable');

        if(currentAvailable){
            $(".userAvailableRev").attr("src", "images/status-available.svg");
            $("#currentAvailableTxt").text("available");
        } else {
            $(".userAvailableRev").attr("src", "images/status-away.svg");
            $("#currentAvailableTxt").text("busy");
        }
        ux.toggleIsAvailable();
    },

    closeModalViewProfileStatus: function(e){
        _preventDefault(e);

        $("#modalview-profileStatus").data("kendoMobileModalView").close();
        $(".userLocationUpdate").css("display", "none");
        var updatedStatus = $("#profileStatusUpdate").val();

        if(updatedStatus !== ""){
            // Save new status
            userModel._user.set("statusMessage", updatedStatus);
        }
        // clear status box
        $("#profileStatusUpdate").val("");
    },

    settingsOnInit: function(e){

    },

    settingsOnClose : function (e) {
        APP.kendo.navigate('#:back');
        userStatusView.openModal();
    },

    settingBigFont: function(e){
        _preventDefault(e);
        userModel._user.set("useLargeView", true);

        // Show sample size
        $("#sampleChatSize").removeClass("chat-message-text").addClass("userLgFontSize").text("Bigger Font Size");

    },


    settingRegFont: function(e){
        _preventDefault(e);
        userModel._user.set("useLargeView", false);

        // Show sample size
        $("#sampleChatSize").removeClass("userLgFontSize").addClass("chat-message-text").text("Regular Font Size");

    },

    handleNotificationAction : function (e) {
        // todo Don - refactor notifications to have a single action
        _preventDefault(e);

        var uuid = e.sender.element[0].attributes['data-uuid'].value;

        var notification = notificationModel.findNotificationModel(uuid);

        if (notification !== undefined) {
            var type = notification.type, href = notification.href;

            if (type === notificationModel._newPrivate) {
                var channelId = notification.privateId;
                var checkChannel = channelModel.findChannelModel(channelId);
                if (checkChannel === undefined || checkChannel === null) {
                    mobileNotify("Creating  : " + notification.title + "...");
                    var contact = contactModel.findContact(channelId);
                    if (contact !== null) {
                        channelModel.addPrivateChannel(channelId, contact.publicKey, contact.name);
                        APP.kendo.navigate(href);
                    }

                } else {
                    APP.kendo.navigate(href);
                }
            } else if (type === notificationModel._newChat) {
                var chanId = notification.privateId;
                var checkChan = channelModel.findChannelModel(chanId);
                if (checkChannel === undefined || checkChannel === null) {
                    mobileNotify("Looking up " + notification.title);
                   channelModel.queryChannelMap(chanId, function(error, chanObj){
                       mobileNotify("Creating chat : " + chanObj.name + "...");
                        channelModel.addMemberChannel(chanObj.channelUUID, chanObj.name, chanObj,description, chanObj.members,
                        chanObj.ownerUUID, chanObj.ownerName, chanObj.options, false);

                       APP.kendo.navigate(href);
                   });

                } else {
                    APP.kendo.navigate(href);
                }

            } else  if (type === notificationModel._unreadCount) {
                // For unread messages, new chats (including private chats) the action is to go to the the chat....
                APP.kendo.navigate(href);
            } else if (type === notificationModel._deleteChat || type === notificationModel._deletePrivateChat) {
                notificationModel.notificationDS.remove(notification);
            }
        }

    }
};
/*
 * userStatusView -- currently modalview
 */

var userStatusView = {
    _activeStatus : new kendo.data.ObservableObject(),
    _returnView : null,
    _modalId : "#modalview-profileStatus",
    _profileStatusMax: 35,

    _update : function () {
        var status = userStatusView._activeStatus, user = userModel._user;

        status.set('currentPlaceUUID', user.currentPlaceUUID);
        status.set('isCheckedIn', user.isCheckedIn);
        status.set('currentPlace', user.currentPlace);
        status.set('isAvailable', user.isAvailable);
        status.set('statusMessage', user.statusMessage);

        // Set name/alias layout
        ux.formatNameAlias(user.name, user.alias, "#modalview-profileStatus");


        // Zero the status character count
        $("#profileStatusUpdate").val('');
        $("#statusCharCount").text(userStatusView._profileStatusMax);
        $(".statusCharacterCount").css("color", "#979797");

       // if (user.isCheckedIn && user.currentPlaceUUID !== null) {
        if (user.isCheckedIn) {
            // hide location if the user is not checked in
            $("#profileLocation, #checked-in-place").removeClass("hidden");

        } else {
            $("#profileLocation, #checked-in-place").addClass("hidden");
        }


        // Set available
		if(user.isAvailable){
			$(".userAvailable").attr("src", "images/status-available.svg");
			$(".userAvailableRev").attr("src", "images/status-away.svg");
			$("#currentAvailableTxt").text("busy");

		} else {
			$(".userAvailable").attr("src", "images/status-away.svg");
			$(".userAvailableRev").attr("src", "images/status-available.svg");
			$("#currentAvailableTxt").text("available");
		}

        // set verified
        if(user.emailValidated){
            $("#profileStatusVerified").removeClass("hidden");
        } else {
            $("#profileStatusVerified").addClass("hidden");
        }
    },

    gotoSettings : function (e) {
        userStatusView.closeModal();
        APP.kendo.navigate('#settings');
    },

    doSignOut : function (e) {
        _preventDefault(e);


       // Parse.User.logOut();

        everlive.logout(function (status) {
            if (!status) {
                mobileNotify("Signout Error....");
            }

            userModel._user.unbind('change', userModel.sync);
            userModel._user.set('username', null);
            userModel._user.set('email', null);
            userModel._user.set('phone',null);
            userModel._user.set('alias', null);
            userModel._user.set('userUUID', null);
            userModel._user.set('rememberUsername', false);
            deviceModel.resetDeviceState();
            everlive.clearLocalStorage();
            userStatusView.closeModal();
            APP.kendo.navigate('#usersignin');
        });

    },

    // Main entry point for userstatus modal
    openModal : function (e) {
        _preventDefault(e);

        ux.hideKeyboard();

        //Cache the current view
        userStatusView._returnView = APP.kendo.view().id;

        mapModel.getCurrentAddress(function (isNew, address) {

            if (isNew) {
                mobileNotify("Are you at a new address?")
            }
            // Is this a new location
           /* if (isNew) {
                $('#profileCheckInLi').removeClass('hidden');
            } else {
                $('#profileCheckInLi').addClass('hidden');
            }*/
        });

        userStatusView._update();

        $(userStatusView._modalId).data("kendoMobileModalView").open();

    },

    openModalRestore : function (e) {
        _preventDefault(e);

        APP.kendo.navigate('#'+ userStatusView._returnView);
        userStatusView.openModal();

    },

    // close and redirect for user status
    closeModal : function () {

      	// if there's a return URL, need to close the modal and then redirect to original view
        $(userStatusView._modalId).data("kendoMobileModalView").close();

        var updatedStatus = $("#profileStatusUpdate").val();
        if(updatedStatus !== "") {
            // Save new status
            userModel._user.set("statusMessage", updatedStatus);
            userStatus.update();
            //updateParseObject('userStatus','userUUID', userModel._user.uuid, "statusMessage", updatedStatus);
        }
        // clear status box
        $("#profileStatusUpdate").val("");
        $(".statusCharCount").text(userStatusView._profileStatusMax);

        if (userStatusView._returnView !== null) {
            if (APP.kendo.view().id !== userStatusView._returnView)
                APP.kendo.navigate('#' + userStatusView._returnView);

            userStatusView._returnView = null;

        }

    },

    gotoPlace: function (e) {
        _preventDefault(e);

        var placeUUID = userModel._user.currentPlaceUUID;
        var placeUUID = LZString.compressToEncodedURIComponent(placeUUID);
        APP.kendo.navigate("#placeView?place="+placeUUID+"&returnmodal=userstatus");
    },

    openCheckIn : function (e) {
        _preventDefault(e);

        userStatusView.closeModal();

        checkInView.locateAndOpenModal(function () {
            userStatusView.openModal();
        })
    },

    checkOut : function (e) {
        _preventDefault(e);

       /* $('#profileCheckOutLi').velocity("slideUp", {complete: function(element){
        	$(element).addClass("hidden");
        	}
    	});*/
        userModel.checkOut();
        mapModel.checkOut();

        userStatusView._update();
       // $('#profileStatusCheckInPlace').text('');
    },

    syncUserStatus: function (e) {
        _preventDefault(e);

        userModel._user.set(e.field, this[e.field]);
        //updateParseObject('userStatus','userUUID', userModel._user.uuid, e.field, this[e.field]);

    },

    // Important to put all jquery and other event handlers here so created only once...
    onInit : function (e) {
        _preventDefault(e);

        userStatusView.statusCharCount(e);

        userStatusView._activeStatus.bind('change' , userStatusView.syncUserStatus);
    },

    statusCharCount: function(e) {
		// set max length
		var maxLength = userStatusView._profileStatusMax;
		var currentLength;
		
		// set current status count 
		$(".statusCharCount").text(maxLength);
		$("#profileStatusUpdate").keyup(function(e){
			var length = $(this).val().length;

			currentLength = maxLength - length;
			$(".statusCharCount").text(currentLength);

			if(currentLength < 8){
				$(".statusCharacterCount").css("color", "#EF5350");
			} else {
				$(".statusCharacterCount").css("color", "");
			}	
		});

	},

    camera : function (e) {
        devicePhoto.deviceCamera(
            1600, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            null  // Current channel Id for offers
             // Optional preview callback
        );
    },

    // Kendo open
    onOpen: function (e) {
        _preventDefault(e);
    },

    // Kendo close
    onClose: function (e) {
      //  _preventDefault(e);   calling on close prevents kendos normal modal handling

    }
};

/*
 * Generic parameterized modal dialog
 */
var modalView = {
    okAction: null,
    cancelAction: null,

    init: function() {
        modalView.okAction = null;
        modalView.cancelAction = null;
        $('#modalCancel').addClass('hidden');

    },

    // Open the standard Ok/Cancel dialog
    open: function (title, description, ok, okAction, cancel, cancelAction) {

       $('#modalTitle').html(title);
        if (description !== null) {
            $('#modalDescription').html(description);
        }

        $('#modalOk').html(ok);


        if (okAction !== null) {
            modalView.okAction = okAction;
        }

        if (cancelAction !== null) {
            modalView.cancelAction = cancelAction;
        }
        if (cancel !== null) {
            $('#modalCancel').html(cancel);
        }

        $('#modalCancel').removeClass('hidden');
        $('#modal-dialog').data('kendoMobileModalView').open();
    },

    // Open an info dialog -- just OK no cancel button or ux.
    openInfo : function (title, description, ok, okAction) {
        $('#modalTitle').html(title);
        if (description !== null) {
            $('#modalDescription').html(description);
        }

        $('#modalOk').html(ok);


        if (okAction !== null) {
            modalView.okAction = okAction;
        }

        $('#modalCancel').addClass('hidden');
        $('#modal-dialog').data('kendoMobileModalView').open();
    },

    close : function () {
        $('#modal-dialog').data('kendoMobileModalView').close();
    },

    okClick: function () {
        modalView.close();

        if (modalView.okAction !== null) {
            modalView.okAction();
        }
        modalView.init();
    },

    cancelClick: function () {
        modalView.close();

        if (modalView.cancelAction !== null) {
            modalView.cancelAction();
        }
        modalView.init();
    }


};


var ghostEditView = {
    _callback : null,
    _returnview : null,

    onInit: function (e) {

        _preventDefault(e);
        //autosize($('#ghostEmailEditor'));

        $("#ghostEmailEditor").kendoEditor({
            stylesheets:["styles/editor.css"],
            tools: [
                "bold",
                "italic",
                "underline",
                "insertUnorderedList",
                "indent",
                "outdent"
            ]
        });
    },

    onShow : function (e) {
        _preventDefault(e);
        if (e.view.params.callback !== undefined) {
            ghostEditView._callback = e.view.params.callback;
        } else {
            ghostEditView._callback = null;
        }

        if (e.view.params.returnview !== undefined) {
            ghostEditView._returnview = e.view.params.returnview;
        } else {
            ghostEditView._returnview = null;
        }

        //autosize.update($('#ghostEmailEditor'));
        $('#ghostEmailEditor').data("kendoEditor").value("");
        $('#ghostEmailEditor').data("kendoEditor").focus();
    },

    onDone : function (e) {
        _preventDefault(e);

        if (ghostEditView._returnview !== null) {
            APP.kendo.navigate('#'+ghostEditView._returnview);
        }

        if (ghostEditView._callback  === 'contactaction') {

            contactActionView.restoreModal();
        }
    },

    openModal : function(callback) {

        if (callback !== undefined) {
            ghostEditView._callback = callback;
        } else {
            ghostEditView._callback = null;
        }
        $('#ghostEmailEditor').data("kendoEditor").value("");
        $('#ghostEditModal').data('kendoMobileModalView').open();
        $('#ghostEmailEditor').data("kendoEditor").focus();

    },

    closeModal : function (e) {
        _preventDefault(e);
        $('#ghostEditModal').data('kendoMobileModalView').close();
        if (ghostEditView._callback  === 'contactaction') {

            contactActionView.restoreModal();
        }

        if (ghostEditView._returnview !== null) {
            APP.kendo.navigate('#'+ghostEditView._returnview);
        }

       /* if (ghostEditView._callback  !== null) {
            ghostEditView._callback();
        }*/
    },

    sendGhostEmail : function (e) {
        _preventDefault(e);

        var content = $('#ghostEmailEditor').data("kendoEditor").value();
        var contactKey = contactModel.currentContact.get('publicKey'), email = contactModel.currentContact.get('email');
       /* if (contactKey === null) {
            mobileNotify("Invalid Public Key for " + contactModel.currentContact.get('name'));
            return;
        }
        var encryptContent = cryptico.encrypt(content, contactKey);*/
        if (window.navigator.simulator === true){
            alert("Mail isn't supported in the emulator");
        } else {
            var thisUser = userModel._user.get('name');
            cordova.plugins.email.open({
                to:          [email],
                subject:     'ghostgram from ' + thisUser,
                body:        content,
                isHtml:      true
            }, function (msg) {
                mobileNotify("Email sent to " + thisUser);
                ghostEditView.onDone();
                // navigator.notification.alert(JSON.stringify(msg), null, 'EmailComposer callback', 'Close');
            });
        }

    },
    toggleTool: function(e){
        var tool = e.button[0].dataset['tool'];

        var editor = $("#ghostEmailEditor").data("kendoEditor");
        editor.exec(tool);

        // If a togglable tool, reflect state
        if (tool !== 'indent' && tool !== 'outdent'){

            var toolState = editor.state(tool);
            var $currentBtn = $(e.target[0]);
            var $currentBtnImg = $currentBtn.closest("img");

            if(toolState){
                $currentBtn.addClass("activeTool");
            } else {
                $currentBtn.removeClass("activeTool");
            }

        }
    },
    insertImage: function(e) {
        galleryPicker.openModal(function (photo) {

            photoModel.addPhotoOffer(photo.photoId, channelView._channelUUID, photo.thumbnailUrl, photo.imageUrl, true);

            var url = photo.thumbnailUrl;
            if (photo.imageUrl !== undefined && photo.imageUrl !== null){
                url = photo.imageUrl;
            }
            var editor = $('#ghostEmailEditor').data("kendoEditor");
            // Image styles are controled via editor.less
            editor.paste('<div class="img-sm"> <img src="' + url + '"/></div>', {split: true});
        });
    }
};

/*
 * Profile Photo Capture / Edit
 * parameterized for user profile and contact profile
 */

var editProfilePhotoView = {
    _callback : null,
    _photoUrl: null,
    _isUserProfile : true,
    _contactId : null,

    onInit : function (e) {
        _preventDefault(e);

    },

    onShow : function (e) {
        _preventDefault(e);

    },

    onDone : function (e) {

    },

    setCallback : function (callback) {
        if (callback !== undefined) {
            editProfilePhotoView._callback = callback;
        }
    },

    setPhotoUrl : function (url) {
        editProfilePhotoView._photoUrl = url;
        $("#profilePhotoImage").attr('src', url);
    },

    doCamera : function (e) {
      _preventDefault(e);

        devicePhoto.deviceCamera(
            512, // max resolution in pixels
            75,  // quality: 1-99.
            false,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
           editProfilePhotoView.setPhotoUrl  // Optional preview callback
        )
    },

    doPhotoGallery : function(e) {
        _preventDefault(e);

        devicePhoto.deviceGallery(
            512, // max resolution in pixels
            75,  // quality: 1-99.
            false,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            editProfilePhotoView.setPhotoUrl  // Optional preview callback
        );
    },

    doMemories : function (e) {
       _preventDefault(e);
        galleryPicker.openModal(function (photo) {

        });
    },

    updateUserPhotoUrl : function (e) {
        _preventDefault(e);
        userModel._user.set("photo", editProfilePhotoView._photoUrl);
    }
};

var signUpView = {
    onInit : function (e) {
        _preventDefault(e);

       // Add strength meter to password
        //$("#home-signup-password").strength();

        // Simple phone mask - http://jsfiddle.net/mykisscool/VpNMA/
        $('#home-signup-phone')

            .keydown(function (e) {
                var key = e.charCode || e.keyCode || 0;
                var $phone = $(this);

                // Auto-format- do not expose the mask as the user begins to type
                if (key !== 8 && key !== 9) {
                    if ($phone.val().length === 4) {
                        $phone.val($phone.val() + ')');
                    }
                    if ($phone.val().length === 5) {
                        $phone.val($phone.val() + ' ');
                    }
                    if ($phone.val().length === 9) {
                        $phone.val($phone.val() + '-');
                    }
                }

                // Allow numeric (and tab, backspace, delete) keys only
                return (key == 8 ||
                key == 9 ||
                key == 46 ||
                (key >= 48 && key <= 57) ||
                (key >= 96 && key <= 105));
            })
            .keyup(function(e){
                if ($(this).val().length === 14) {
                    homeView.continueSignUp();
                    $('#home-signup-phone').unbind("keyup");
                }
            })

            .bind('focus click', function () {
                var $phone = $(this);

                if ($phone.val().length === 0) {
                    $phone.val('(');
                }
                else {
                    var val = $phone.val();
                    $phone.val('').val(val); // Ensure cursor remains at the end
                }
            })

            .blur(function () {
                var $phone = $(this);

                if ($phone.val() === '(') {
                    $phone.val('');
                }
            });

        // Confirm password events
        $("#home-signup-password").on("keyup", function(){
            var pwd1Val = $(this).val();
            $("#home-signup-password2").val(pwd1Val);
        });

        $("#home-signup-password").on("focus", function(e) {
            _preventDefault(e);
            var pwdLength = $(this).val().length;
            $(".create-user-password2").css("display", "inline-block");

        }).blur(function(e){
            _preventDefault(e);
            $(".create-user-password2").css("display", "none");
        });



        $("#create-user-email, #create-user-name, #create-user-alias, .create-user-password, .create-user-password2").css("display", "none");
        
    },

    continueSignUp : function () {

        $("#create-user-email, #create-user-name, #create-user-alias, .create-user-password").velocity("slideDown", { delay: 500, duration: 300 }, [ 250, 15 ]);
        // ToDo - Add step form validation
        $("#createAccountBtn").velocity("fadeIn", {delay: 800});

    },

    validate : function (e) {
        e.preventDefault();
        var form = $("#formCreateAccount").kendoValidator().data("kendoValidator");

        if (form.validate()) {
            signUpView.doCreateAccount();
        }
    },

    onShow : function (e) {
        _preventDefault(e);


        $("#signUpBox").velocity({translateY: "-10px;", opacity: 1}, {duration: 1000, easing: "easeIn"});
    },



    _createAccount : function (username, password, name, phone) {
        var userUUID = uuid.v4(); var user = userModel._user;



        window.localStorage.setItem('ggUsername', username);
        window.localStorage.setItem('ggUserUUID', userUUID);

        userModel.setUserUUID(userUUID);

        userModel._setRecoveryPassword(password);  // Store encrypted recovery password


       // user.set('Id', data.result.Id);
        user.set("Username", username);
        user.set("version", 1);
        user.set("Email", username);
        user.set("email", username);
        user.set("name", name);
        user.set("DisplayName", name);
        user.set("phone", phone);
        user.set("alias", null);
        user.set("currentPlace", "");
        user.set("currentPlaceUUID", "");
        user.set("googlePlaceId", "");
        user.set("statusMessage", "");
        user.set('photo', null);
        user.set('publicPhoto', null);
        user.set('phoneVerificationCode', null);
        user.set("isAvailable", true);
        user.set("useIdenticon", true);
        user.set("isVisible", true);
        user.set("isCheckedIn", false);
        user.set("isValidated", false);
        user.set("availImgUrl", "images/status-available.svg");
        user.set("phoneValidated", false);
        user.set("useIdenticon", true);
        user.set("useLargeView", false);
        user.set("rememberUsername", false);
        user.set('addressList', []);
        user.set('emailList', []);
        user.set('phoneList', []);
        user.set('saveToPhotoAlbum', false);
        user.set('isRetina', false);
        user.set('homeIntro', false);

        userModel.generateNewPrivateKey(user);

        userModel.createIdenticon(userUUID);
        var photo = user.get('photo');
        if (photo === undefined || photo === null) {
            userModel._user.photo = userModel.identiconUrl;
        }
        //user.set("publicKey", publicKey);
        //user.set("privateKey", privateKey);




        userModel.hasAccount = true;
        window.localStorage.setItem('ggHasAccount', true);
        if (window.navigator.simulator === undefined) {

            cordova.plugins.notification.local.add({
                id: 'userWelcome',
                title: 'Welcome to ghostgrams',
                message: 'You have a secure connection to your family, friends and favorite places',
                autoCancel: true,
                date: new Date(new Date().getTime() + 120)
            });
        }

        verifyPhoneModal.sendAndOpenModal();


        everlive.updateUser();
        userModel.initCloudModels();
        userModel.initPubNub();
        userStatus.update();
        APP.kendo.navigate('#home');
        userModel._user.bind('change', userModel.sync);
        mobileNotify('Welcome to ghostgrams!');
    },

    doCreateAccount : function (e) {
        _preventDefault(e);

        var username = $('#home-signup-username').val();
        var name = $('#home-signup-fullname').val();
        var password = $('#home-signup-password').val();
        //var confirmPassword = $('#home-signup-password2').val();
        var phone = $('#home-signup-phone').val();
        var alias = $('#home-signup-alias').val();

        // clear any previous account informaton for this device
        everlive.clearAuthentication();
        everlive.clearLocalStorage();
        
        // clean up the phone number and ensure it's prefixed with 1
        // phone = phone.replace(/\+[0-9]{1-2}/,'');
        phone = unformatPhoneNumber(phone);

        isValidMobileNumber(phone, function (result) {
            if (result.status === 'ok' && result.valid === true) {
                isMemberPhone(phone, function (result) {
                    if (result.status !== 'ok') {
                        mobileNotify("isMemberPhone error!");
                        return;
                    }
                    if (result.found === true) {
                        mobileNotify("Your phone number matches existing user.");
                        return;
                    } else {

                        everlive.createAccount(username, name, password, function (error, data) {
                            if (error !== null) {

                                if (error.code === 201) {
                                    mobileNotify(username + " is an existing account.  Please Sign In.");
                                    APP.kendo.navigate('#usersignin');
                                    return;
                                }
                                mobileNotify("Error creating account : " + error.message);
                                return;
                            }

                            everlive.currentUser(function (err1, data1) {
                                if (err1 !== null) {
                                    signUpView._createAccount(username, password, name, phone);
                                } else {
                                    everlive.login(username, password, function (err2, data2) {
                                        if (err2 === null ){
                                            signUpView._createAccount(username, password, name, phone);
                                        } else {
                                            mobileNotify("Create Account Login error " + err2.message);
                                        }
                                    })
                                }

                            });

                        });

                    }

                });
    /*            Parse.Cloud.run('preflightPhone', {phone: phone}, { //Todo:  replace with memberdirectory search for phone.
                    success: function (data) {
                        if (data.status !== 'ok' || data.count !== 0) {
                            mobileNotify("Your phone number matches existing user.");
                            return;
                        } else {

                            window.localStorage.setItem('ggRecoveryPassword', password);
                            window.localStorage.setItem('ggUsername', username);
                            //Phone number isn't a duplicate -- create user
                            user.set("username", username);
                            user.set("password", password);
                            user.set("email", username);
                            user.set("name", name);
                            user.set("phone", phone);
                            user.set("alias", alias);
                            user.set("aliasPublic", "ghostgram user");
                            user.set("currentPlace", "");
                            user.set("currentPlaceUUID", "");
                            user.set('photo', null);
                            user.set('aliasPhoto', null);
                            user.set("isAvailable", true);
                            user.set("isVisible", true);
                            user.set("isCheckedIn", false);
                            user.set("availImgUrl", "images/status-available.svg");
                            user.set("phoneValidated", false);
                            user.set("useIdenticon", true);
                            user.set("useLargeView", false);
                            user.set("rememberUsername", false);
                            user.set("userUUID", userUUID);
                            user.set('addressList', []);
                            user.set('emailList', []);
                            user.set('phoneList', []);
                            user.set('archiveIntro', false);
                            user.set('homeIntro', false);
                            user.set('chatIntro', false);
                            user.set('contactIntro', false);
                            user.set('galleryIntro', false);
                            user.set('identiconIntro', false);
                            user.set('placesIntro', false);
                            user.set('firstMessage', false);
                            user.set('recoveryPassword', password);
                            //user.set("publicKey", publicKey);
                            //user.set("privateKey", privateKey);

                            user.signUp(null, {
                                success: function (user) {

                                    userModel.parseUser = user;
                                    userModel.generateUserKey();
                                    // Hooray! Let them use the app now.
                                    userModel._user.set('username', user.get('username'));
                                    userModel._user.set('recoveryPassword', user.get('recoveryPassword'));
                                    userModel._user.set('name', user.get('name'));
                                    userModel._user.set('email', user.get('email'));
                                    userModel._user.set('phone', user.get('phone'));
                                    userModel._user.set('alias', user.get('alias'));
                                    userModel._user.set('currentPlace', user.get('currentPlace'));
                                    userModel._user.set('currentPlaceUUID', user.get('currentPlaceUUID'));
                                    userModel._user.set('photo', user.get('photo'));
                                    userModel._user.set('isAvailable', user.get('isAvailable'));
                                    userModel._user.set('isVisible', user.get('isVisible'));
                                    userModel._user.set('isRetina', user.get('isRetina'));
                                    userModel._user.set('isWIFIOnly', user.get('isWIFIOnly'));
                                    userModel._user.set('isPhotoStored', user.get('isPhotoStored'));
                                    userModel._user.set('saveToPhotoAlbum', user.get('saveToPhotoAlbum'));
                                    userModel._user.set('aliasPhoto', user.get('aliasPhoto'));
                                    userModel._user.set('userUUID', user.get('userUUID'));
                                    userModel._user.set('phoneValidated', false);
                                    userModel._user.set('useLargeView', false);
                                    userModel._user.set('useIdenticon', user.get('useIdenticon'));
                                    userModel._user.set('emailValidated', user.get('emailValidated'));
                                    userModel.generateNewPrivateKey(user);

                                    userModel.createIdenticon(userUUID);

                                    var photo = user.get('photo');
                                    if (photo === undefined || photo === null) {
                                        userModel._user.photo = userModel.identiconUrl;
                                    }

                                    //userModel._user.set('publicKey',user.get('publicKey'));
                                    //userModel._user.set('privateKey',user.get('privateKey'));
                                    userModel._user.bind('change', userModel.sync);
                                    userModel.parseACL = new Parse.ACL(Parse.User.current());
                                    mobileNotify('Welcome to ghostgrams!');
                                    userModel.initPubNub();
                                    window.localStorage.setItem('ggHasAccount', true);
                                    if (window.navigator.simulator === undefined) {

                                        cordova.plugins.notification.local.add({
                                            id: 'userWelcome',
                                            title: 'Welcome to ghostgrams',
                                            message: 'You have a secure connection to your family, friends and favorite places',
                                            autoCancel: true,
                                            date: new Date(new Date().getTime() + 120)
                                        });
                                    }

                                    sendPhoneVerificationCode(phone, function (result) {
                                        if (result.status === 'ok') {
                                            userModel._user.set('phoneVerificationCode', result.code);
                                            mobileNotify("Phone Verification Code sent.  Please check your messages");
                                            if (window.navigator.simulator === undefined) {

                                                cordova.plugins.notification.local.add({
                                                    id: 'verifyPhone',
                                                    title: 'Welcome to ghostgrams',
                                                    message: 'Please verify your phone',
                                                    autoCancel: true,
                                                    date: new Date(new Date().getTime() + 30)
                                                });
                                            }
                                        }
                                    });

                                   /!* Parse.Cloud.run('sendPhoneVerificationCode', {phoneNumber: phone}, {
                                        success: function (result) {
                                            mobileNotify('Please verify your phone');
                                            $("#modalview-verifyPhone").data("kendoMobileModalView").open();
                                        },
                                        error: function (result, error) {
                                            mobileNotify('Error sending verification code ' + error);
                                        }
                                    });
*!/
                                    APP.kendo.navigate('#home');
                                },

                                error: function (user, error) {
                                    // Show the error message somewhere and let the user try again.
                                    mobileNotify("Error: " + error.code + " " + error.message);
                                }
                            });

                        }
                    },
                    error: function (error) {
                        mobileNotify("Error checking phone number" + error);
                    }
                });
*/            } else {
                mobileNotify("This phone number is not a valid mobile number.");
                return;
            }


        });
    }

};


var newUserView = {
	_introRun : false,

    onInit : function (e) {
        _preventDefault(e);


    },


    onShow : function (e) {

        newUserView._introRun = false;
        _preventDefault(e);

        if(!newUserView._introRun){
        	
         // Animation
        	$("#messageIntro").velocity({opacity: 1}).velocity({left: "50%"},{delay: 1300});
        	
        	$("#feature1").velocity({opacity: 1, translateY: "0%"}, {delay: 2000, duration: 1000}).velocity({opacity: 0, translateY: "100%"});
        	$("#feature2").velocity({opacity: 1, translateY: "0%"}, {delay: 3000, duration: 1000}).velocity({opacity: 0, translateY: "100%"});
        	$("#feature3").velocity({opacity: 1, translateY: "0%"}, {delay: 4000, duration: 1000}) .velocity({opacity: 0, translateY: "100%"});
        	$("#messageIntro").velocity({opacity: 0, translateY: "-100%"}, {delay: 3000});


        	$("#newWelcome").velocity("fadeIn", {delay: 5500});
        	$("#newLogo").velocity({opacity: 1}, {delay: 6000, duration: 500, easing: "easeIn"});
        	
        	$("#featureCard1").velocity({opacity: 1, translateY: "-10px"}, {delay: 6000, duration: 1000});
        	$("#newUserHomeBtn").velocity({opacity: 1}, {delay: 6000,duration: 1000});
    		newUserView._introRun = true;
    		
        }

    }

};

var signInView = {

    onInit : function (e) {
        _preventDefault(e);

        $("#home-signin-username").on("input", function(e) {

            // Add additional validation / helper code...
        });

        $("#home-signin-password").on("input", function(e){

        });

        $(".signupForm").on("keyup", function(e){
            if(e.keyCode === 13){
                signInView.validate();
            }
        });

    },

    onShow : function (e) {
        _preventDefault(e);

        ux.hideKeyboard();

        if (userModel.rememberUsername && userModel.username !== '') {
            $('#home-signin-username').val(userModel.username)
        }


        $("#signInBox").velocity({opacity: 1, translateY: "-10px"}, {duration: 1000});

    },

    openForgotPassword: function(){
    	var email = $("#home-signin-username").val();

    	$("#modalview-recoverPassword").data("kendoMobileModalView").open();
    	
    	// ux helper for quick user input 
    	if(email !== ''){
    		$("#home-recoverPassword-email").val(email);
    	} else{
    		$("#home-recoverPassword-email").val('');
    	}
    },

    // todo - delete 
    testingAnimation: function(){
    	$("#signUpBox").velocity({translateY: "-10px;", opacity: 1}, {delay: 500, duration: 1000, easing: "easeIn"});
    	$("#signInBox").css("display","none");


    },

    onClear : function (e) {
        $('#home-signin-username').val('');
        $('#home-signin-password').val('');

    },

    validate : function () {
        var form = $("#formSignIn").kendoValidator().data("kendoValidator");

        if (form.validate()) {
            // If the form is valid, run sign in
            signInView.doSignIn();
        }
    },

    doSignIn : function () {
        // hide keyboard
        ux.hideKeyboard();

        // clear any previous account informaton for this device
        everlive.clearAuthentication();
        

        var username = $('#home-signin-username').val(), password = $('#home-signin-password').val();

        mobileNotify("Signing you in to ghostgrams....");

        everlive.login(username, password , function (error, data) {

                if (error !== null) {
                    mobileNotify ("Sign In error : " + error.message);
                    return;

                }
                window.localStorage.setItem('ggHasAccount', true);
                window.localStorage.setItem('ggUsername', username);
                userModel._setRecoveryPassword(password);
                // Clear sign in form
                $("#home-signin-username, #home-signin-password").val("");

                everlive.loadUserData();
                
        });

    }

};

var changePasswordView = {

    onInit : function (e) {
        _preventDefault(e);
        $('#newPassword1').strength({
        	strengthClass: 'strength',
        	strengthMeterClass: 'strength_meter',
        	strengthButtonClass: 'button_strength',
        	strengthButtonText: 'Show password',
        	strengthButtonTextToggle: 'Hide Password'
        });

    },

    onShow: function (e) {
        _preventDefault(e);
        $("#newPassword1").val('');
        ux.hideKeyboard();

    },

    onDone : function (e) {
        _preventDefault(e);

        var pass1 = $("#newPassword1").val();

        if (pass1 === null || pass1.length < 6) {
            mobileNotify("Password must be 6 or more characters");
            return;
        }

        everlive.changePassword(pass1, function (error, status){
            if (error === null && status === true) {
                mobileNotify("Your password was changed");
                changePasswordView.closeModal();

                // Clear forms
                $("#newPassword1").val("");
            } else {
                mobileNotify("Error updating password" + JSON.stringify(error));
            }

        });

    },

    closeModal : function (e) {
        _preventDefault(e);
        $("#modalview-changePassword").kendoMobileModalView("close");
    }
};

var verifyPhoneModal = {

    onOpen: function (e) {
        _preventDefault(e);
    },
    
    onDone: function (e) {
        _preventDefault(e);
    },

    sendAndOpenModal : function (e) {

        var phone = userModel._user.get('phone');
        sendPhoneVerificationCode(phone, function (result) {
            if (result.status === 'ok') {
                userModel._user.set('phoneVerificationCode', result.code);
                verifyPhoneModal.openModal();
                if (window.navigator.simulator === undefined) {

                    cordova.plugins.notification.local.add({
                        id: 'verifyPhone',
                        title: 'Welcome to ghostgrams',
                        message: 'Please verify your phone',
                        autoCancel: true,
                        date: new Date(new Date().getTime() + 30)
                    });
                }
            }
        });
    },

    openModal: function (e) {
        $("#modalview-verifyPhone").data("kendoMobileModalView").open(); 
    },
    
    closeModal: function (e) {
        $("#modalview-verifyPhone").data("kendoMobileModalView").close();
    },

    sendCode : function (e) {
        var phone = userModel._user.get('phone');
        sendPhoneVerificationCode(phone, function (result) {
            if (result.status === 'ok') {
                userModel._user.set('phoneVerificationCode', result.code);

            }
        });
    },

    verifyCode : function (e) {
        
        e.preventDefault();
        var userCode = $('#verifyPhone-code').val();
        var sentCode = userModel._user.get('phoneVerificationCode');
        
        // all verification codes are 5 or 6 numbers
        if (userCode.length < 5) {
            mobileNotify("Invalid verification code, please try again");
            return;
        }

        if (Number(userCode) === sentCode) {
                mobileNotify("Your phone number is verified.  Thank You!");
                var thisUser = userModel._user;
                thisUser.set('phoneValidated', true);
                thisUser.set('isValidated', true);
                var isVerified = thisUser.get('isVerified');

                appDataChannel.userValidatedMessage(thisUser.userUUID, thisUser.phone, thisUser.email, thisUser.publicKey);
                verifyPhoneModal.closeModal();
            } else {
                mobileNotify("Sorry, your verification number: ' + result.recieved + ' didn't match. ");
            }

        }
}
