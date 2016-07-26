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

    enableHotButtons : function () {
        if (window.navigator.simulator === undefined) {
            shake.startWatch(function () {
                hotButtonView.openModal();
            }, 30 /*, onError */);
        }
    },

    goHome: function () {
        APP.kendo.navigate("#home");
    },

    goSettings: function () {
        APP.kendo.navigate("#settings");
    },

    goMyNotes: function () {
        APP.kendo.navigate("#privateNotes");
    },

    disableHotButtons : function () {
        shake.stopWatch();
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

        if(status !== null && status !== ""){
            $("#profileStatusMessage").removeClass("hidden");
        } else {
            $("#profileStatusMessage").addClass("hidden");
        }

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
        userStatusView.statusCharCount();


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
       // _preventDefault(e);

        if (userModel._user.currentPlace !== '') {
            $('#checked-in-place > span').html(userModel._user.currentPlace);
            $('#checked-in-place').show();
        }
/*
         $("#homeHeaderButton").kendoTouch({

         doubletap: function(e) {
         userStatusView.openModal();
         },

         tap: function (e) {
         $("#profilebuttonactionsheet").data("kendoMobileActionSheet").open();
         }

         });*/

        /*
         $('#homeSearchQuery').clearSearch({
         callback: function() {
         // todo - wire search
         }
         });
         */

        /*$(".home-status").kendoTouch(

            { doubletap: function (e) { mobileNotify("Double Tap: Open Hot Buttons!"); }
        });

        $(".footer-menu").kendoTouch({
            multiTouch: true,
            gesturestart: function (e) {
                mobileNotify("Two Finger: Open Hot Buttons!");
            }
        });*/



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
//
        ux.setSearchPlaceholder("Search notifications");

        // set verified ui for start screen
        if(userModel._user.phoneValidated) {
            $("#startPhoneVerified").addClass("hidden");
           // notificationModel.addVerifyPhoneNotification();
        }
      /*  if (!userModel._user.isValidated) {
            notificationModel.addVerifyEmailNotification();
        }*/
        // Set user availability
        ux.updateHeaderStatusImages();


        // Hide action button on home
        ux.showActionBtn(true, "#home", "#settingsAction");
        ux.changeActionBtnImg("home","nav-add-white");
        ux.showActionBtnText("#home", "3em", "Shortcuts");

        ux.addDataProp("rel", "actionsheet");

        everlive.syncCloud();

        // Todo:Don schedule unread channel notifications after sync complete
        //notificationModel.processUnreadChannels();
    },

    onHide: function(e){
        _preventDefault (e);
        $(".homeToggleSetting").addClass("hidden");
        $(".homeToggleSearch").removeClass("hidden");

        ux.removeDataProp("rel");
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

        userStatus.update();

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

        var noteuuid = e.sender.element[0].attributes['data-uuid'].value;

        var notification = notificationModel.findNotificationModel(noteuuid);

        if (notification !== undefined) {
            var type = notification.type, href = notification.href;

            if (type === notificationModel._newPrivate) {
                var channelId = notification.privateId;
                if (channelId === undefined || channelId === null) {
                    mobileNotify("Can't locate this chat...");
                    return;
                }
                var checkChannel = channelModel.findChannelModel(channelId);
                if (checkChannel === undefined || checkChannel === null) {
                    mobileNotify("Creating  : " + notification.title + "...");
                    var contact = contactModel.findContact(channelId);
                    if (contact !== undefined && contact !== null) {
                        channelModel.addPrivateChannel(channelId, contact.publicKey, contact.name);
                        APP.kendo.navigate(href);
                    } else {
                        mobileNotify("Finding member for new private chat...");
                        contactModel.createContact(channelId,  function (result) {
                            if (result !== null) {
                                mobileNotify("Adding private chat for " + result.name);
                                channelModel.addPrivateChannel(result.contactUUID, result.publicKey, result.name);
                                APP.kendo.navigate(href);
                            }
                        });
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

    doChangePassword : function (e) {
        userStatusView.closeModal();
        changePasswordView.openModal();
    },


    doSignOut : function (e) {
        _preventDefault(e);


        everlive.syncCloud();
       // Parse.User.logOut();
        appDataChannel.closeChannel();
        userDataChannel.closeChannel();
        
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
            // The user is signed out - so unprovision all push notifications
            serverPush.unprovisionGroupChannels();
            serverPush.unprovisionDataChannels();

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
        var returnUrl =  userStatusView._returnView;
        if (returnUrl.indexOf('#') === -1) {
            returnUrl = '#' + returnUrl;
        }
        APP.kendo.navigate(returnUrl);
       // APP.kendo.navigate('#'+ userStatusView._returnView);
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

    // close and redirect for user status
    closeModalNoReturn : function () {

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

    },

    gotoPlace: function (e) {
        _preventDefault(e);

        var placeUUID = userModel._user.currentPlaceUUID;
        var currentView = APP.kendo.view().id;

        userStatusView.closeModalNoReturn();
        if (placeUUID !== undefined && placeUUID !== null) {
            placeUUID = LZString.compressToEncodedURIComponent(placeUUID);

            APP.kendo.navigate("#placeView?place="+placeUUID+"&returnmodal=userstatus"+ "&returnview=" + packParameter(currentView));

        } else {
            var locObj = {
                lat: userModel._user.lat,
                lng: userModel._user.lng,
                name : userModel._user.currentPlace,
                title: "My Location",
                targetName: null,
                placeUUID: userModel._user.currentPlaceUUID
            };

            mobileNotify("Mapping Current Location....");


            mapViewModal.openModal(locObj, function () {
                userStatusView.openModal();
            });
        }

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

    onAutoStatusChange : function (e) {
        if (e.checked) {
            $('#profileEditStatusPanel').addClass('hidden');
            $('#profileAutoStatusPanel').removeClass('hidden');
            userModel._user.set('autoStatusEnabled', true);
        } else {
            $('#profileEditStatusPanel').removeClass('hidden');
            $('#profileAutoStatusPanel').addClass('hidden');
            userModel._user.set('autoStatusEnabled', false);
        }

    },

    // Important to put all jquery and other event handlers here so created only once...
    onInit : function (e) {
        //_preventDefault(e);

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
            devicePhoto._resolution, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            null  // Current channel Id for offers
             // Optional preview callback
        );
    },

    scanner : function (e) {
        cordova.plugins.barcodeScanner.scan(
            function (result) {
                mobileNotify("We got a barcode\n" +
                    "Result: " + result.text + "\n" +
                    "Format: " + result.format + "\n" +
                    "Cancelled: " + result.cancelled);
            },
            function (error) {
                mobileNotify("Scanning failed: " + error);
            },
            {
                "preferFrontCamera" : false, // iOS and Android
                "showFlipCameraButton" : true, // iOS and Android
                "prompt" : "Place a barcode inside the scan area", // supported on Android only
                "orientation" : "landscape" // Android only (portrait|landscape), default unset so it rotates with the device
            }
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

        //_preventDefault(e);
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
        //_preventDefault(e);
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

var signUpView = {
    _emailValid : false,
    _formSlideDown: true,

    onInit : function (e) {
        //_preventDefault(e);

       // Add strength meter to password
        //$("#home-signup-password").strength();



        // phone mask
        //   if (window.navigator.simulator === true) {
            $('#home-signup-phone')

                .keydown(function (e) {
                    var key = e.charCode || e.keyCode || 0;
                    var $phone = $(this);
                    if ($phone.val().length === 0) {
                        //user has deleted over the ( so add it back
                        $phone.val('(');
                    }
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
                    mobileNotify("Please wait - validating mobile phone number");
                    var phone  = $(this).val();
                    var validPhone  = addContactView.isValidPhone(phone);

                    if (validPhone === null) {
                        mobileNotify("Couldn't validate this phone number - please correct");
                        return;
                    }

                    var phoneString =  unformatPhoneNumber(phone);

                    isValidMobileNumber(phoneString, function (result) {
                        
                        if (result.status === 'ok') {
                            if (result.valid === true) {
                                $("#home-signup-phone").prop("readonly", true);
                                mobileNotify("Please wait - checking member directory...");
                                memberdirectory.findMemberByPhone(phoneString, function (member) {
                                    if (member === null) {
                                        // It's a valid mobile number and doesnt match an existing member
                                        mobileNotify(phone + " is confirmed!");
                                        signUpView.signUpPhoneValid();
                                        mobileNotify ("Looking up phone contacts....");
                                        deviceContacts.findContacts(phone, true, function (contactList) {
                                            if (contactList.length > 0) {
                                                mobileNotify('Found Me Card!');
                                                $("#home-signup-fullname").val(contactList[0].name);
                                                deviceContacts.unifyContacts(contactList);
                                                $('.signup-userEntry').addClass('hidden');
                                                $('.signup-contactPrefill').removeClass('hidden');
                                                if (contactModel.addressDS.total() === 0) {
                                                    $('#signup-addressSelect').addClass('hidden');
                                                    $('#create-user-address').removeClass('hidden');
                                                }
                                                if (contactModel.emailDS.total() === 0) {
                                                    $('#signup-emailSelect').addClass('hidden');
                                                    $('#create-user-email').removeClass('hidden');
                                                }
                                                signUpView.continueContactSignUp();
                                            } else {
                                                $('.signup-userEntry').removeClass('hidden');
                                                $('.signup-contactPrefill').addClass('hidden');
                                                signUpView.continueSignUp();
                                            }

                                        });

                                     } else {
                                        mobileNotify(phone + " matches an existing intelligram member!");
                                        //Todo:  we should a link to login / signin...
                                        signUpView.signUpPhoneReset();
                                        APP.kendo.navigate("#usersignin");
                                    }

                                });

                                //$('#home-signup-phone').unbind("keyup");
                            } else {
                                mobileNotify(phone + "isn't a recognized mobile number");
                                signUpView.signUpPhoneError();
                            }
                        }

                    });
                    
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
      //  }

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

        $("#home-signup-username").on("blur", function() {
            var email =  $("#home-signup-username").val();
            mobileNotify("Please wait - validating your email...");
            isValidEmail(email, function (result) {
                if (result.status === 'ok' && result.valid === true){
                    if (result.correctedEmail !== null) {
                        mobileNotify("Corrected " + email + " to " + result.correctedEmail);
                        $('#create-user-name').val(result.correctedEmail);
                    } else {
                        mobileNotify("Your email address is confirmed!!!");
                        $('#create-user-name').val(email);
                    }
                }
            });

        });


        $("#create-user-email, #create-user-name, #create-user-alias, .create-user-password, .create-user-password2, #create-user-address").css("display", "none");
        
    },

    unlockPhone: function(){
        $("#home-signup-phone").prop("readonly", false);
        signUpView.signUpPhoneReset();
    },

    onEmailChange : function (e) {
        var email = this.value();
        mobileNotify("Please wait - validating your email...");
        isValidEmail(email, function (result) {
            if (result.status === 'ok' && result.valid === true){
                if (result.correctedEmail !== null) {
                    mobileNotify("Corrected " + email + " to " + result.correctedEmail);
                    $('#create-user-name').val(result.correctedEmail);
                } else {
                    mobileNotify("Your email address is confirmed!!!");
                    $('#create-user-name').val(email);
                }

                $("#signup-emailSelect").addClass('hidden');
                $('#create-user-name').removeClass('hidden');
            }
        });
    },

    // Display a custom signup form with data collected from device contacts...
    continueContactSignUp : function () {
        //Todo: don - write some code here...

        if(signUpView._formSlideDown){
            $("#signup-emailSelect, #signup-addressSelect, #create-user-name, #create-user-alias, .create-user-password").velocity("slideDown", { delay: 500, duration: 300 }, [ 250, 15 ]);

            signUpView._formSlideDown = false;
        }

        $("#create-user-email, .create-user-password, #create-user-address").css("display", "none");


    },

    continueSignUp : function () {

        if(signUpView._formSlideDown){
            $("#create-user-email, #create-user-name, #create-user-alias, .create-user-password, #create-user-address").velocity("slideDown", { delay: 500, duration: 300 }, [ 250, 15 ]);

            signUpView._formSlideDown = false;
        }

        
        // ToDo - jordan - we should move Create Account button display to validation success
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
      //  _preventDefault(e);
        $("#home-signup-welcomebanner").removeClass('hidden');
        $("#signUpBox").velocity({translateY: "-10px;", opacity: 1}, {duration: 1000, easing: "easeIn"});
    },

    signUpPhoneValid: function(){
        $("#signup-countryCode").css("display", "none");
        $("#signup-confirmed").velocity("slideDown");
        $("#signup-error").css("display", "none");
        $(".mobile-countryCode").removeClass("gg-error").addClass("gg-success");

        // fade out txt and show revalidate btn
        $("#signup-info").velocity("fadeOut");
        $("#signup-revalidate").velocity("fadeIn");
        $("#signup-error-txt").velocity("slideUp");

        // enable submit btn
        $("#createAccountBtn").kendoButton({
            enable: true
        });
    },

    signUpPhoneError: function(){
        $("#signup-countryCode").css("display", "none");
        $("#signup-info").velocity("slideUp");
        $("#signup-error").velocity("slideDown");
        $("#signup-success").css("display", "none");
        $(".mobile-countryCode").addClass("gg-error");
        $("#signup-error-txt").velocity("fadeIn");
        console.log("error");
        // disable submit btn
        $("#createAccountBtn").kendoButton({
            enable: false
        });
    },

    signUpPhoneReset: function(){
        $(".mobile-countryCode").removeClass("gg-success gg-error");
        $("#signup-confirmed").velocity("slideUp");
        $("#home-signup-phone").val('');
        $("#signup-countryCode").velocity('slideDown', {delay: 300});
        $("#signup-info").velocity("fadeIn", {delay: 300});
        $("#signup-revalidate").velocity('fadeOut');

        // disable submit btn
        $("#createAccountBtn").kendoButton({
            enable: false
        });
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
        user.set('saveToPhotoAlbum', true);
        user.set('isRetina', true);
        user.set('homeIntro', false);
        user.set('autoStatusEnabled', false);


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
                title: 'Welcome to intelligram',
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
        mobileNotify('Welcome to intelligram!');
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

            } else {
                mobileNotify("This phone number is not a valid mobile number.");
                return;
            }


        });
    }

};


var newUserView = {
	_introRun : false,

    onInit : function (e) {
        //_preventDefault(e);


    },


    onShow : function (e) {

        newUserView._introRun = false;
       // _preventDefault(e);

        if(!newUserView._introRun){
        	
         // Animation
        	/*$("#messageIntro").velocity({opacity: 1}).velocity({left: "50%"},{delay: 1300});
        	
        	$("#feature1").velocity({opacity: 1, translateY: "0%"}, {delay: 2000, duration: 1000}).velocity({opacity: 0, translateY: "100%"});
        	$("#feature2").velocity({opacity: 1, translateY: "0%"}, {delay: 3000, duration: 1000}).velocity({opacity: 0, translateY: "100%"});
        	$("#feature3").velocity({opacity: 1, translateY: "0%"}, {delay: 4000, duration: 1000}) .velocity({opacity: 0, translateY: "100%"});
        	$("#messageIntro").velocity({opacity: 0, translateY: "-100%"}, {delay: 3000});*/


        	$("#newWelcome").velocity("fadeIn", {delay: 300});
        	$("#newLogo").velocity({opacity: 1}, {delay: 600, duration: 500, easing: "easeIn"});
        	
        	$("#featureCard1").velocity({opacity: 1, translateY: "-10px"}, {delay: 1000, duration: 1000});
        	$("#newUserHomeBtn").velocity({opacity: 1}, {delay: 1000,duration: 1000});
    		newUserView._introRun = true;
    		
        }

    }

};

var signInView = {

    onInit : function (e) {
        //_preventDefault(e);

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
       // _preventDefault(e);

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

        if (!deviceModel.isOnline()) {
            mobileNotify("Phone is offline - can't Sign In");
            return;
        }

        APP.everlive.online();
        
        mobileNotify("Signing you in to intelligram....");

        everlive.login(username, password , function (error, data) {

                if (error !== null) {
                    mobileNotify ("Sign In error : " + error.message);
                    http://res.cloudinary.com/ghostgrams/image/upload/v1461774012/userphoto/755c477043ab4bb394922aacb9ab76ed.jpg
                        return;

                }
                window.localStorage.setItem('ggHasAccount', true);
                window.localStorage.setItem('ggUsername', username);
                userModel._setRecoveryPassword(password);
                // Clear sign in form
                $("#home-signin-username, #home-signin-password").val("");

                everlive.loadUserData();
            
                channelModel.syncMemberChannels();
                
        });

    }

};

var changePasswordView = {

    onInit : function (e) {
       // _preventDefault(e);
        $('#newPassword1').strength({
        	strengthClass: 'strength',
        	strengthMeterClass: 'strength_meter',
        	strengthButtonClass: 'button_strength',
        	strengthButtonText: 'Show password',
        	strengthButtonTextToggle: 'Hide Password'
        });

    },

    onShow: function (e) {
       // _preventDefault(e);
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

    openModal : function (e) {
        _preventDefault(e);
        $("#modalview-changePassword").kendoMobileModalView("open");
    },
    
    closeModal : function (e) {
        _preventDefault(e);
        $("#modalview-changePassword").kendoMobileModalView("close");
    }
};

var verifyEmailModal = {

    onOpen: function (e) {
        _preventDefault(e);
    },
    
    onDone: function (e) {
        _preventDefault(e);
    },

    openModal: function (e) {
        
        $("#modalview-verifyEmail").data("kendoMobileModalView").open();
    },
    
    closeModal: function (e) {
        $("#modalview-verifyEmail").data("kendoMobileModalView").close();
    },

    sendEmail : function (e) {
        var email = userModel._user.get('email');
        everlive.resendEmailValidation(email);
        
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
                        title: 'Welcome to intelligram',
                        message: 'Please verify your phone',
                        autoCancel: true,
                        date: new Date(new Date().getTime() + 30)
                    });
                }
            }
        });
    },

    openModal: function (e) {
        if (window.navigator.simulator !== true) {
            $("#verifyPhone-code").mask("999999", {placeholder: " "})
        }

        $("#verifyPhone-code").on('keyup', function(e){
            var val = $(this).val();
            if(val.length > 4){
                $("#modalview-verifyPhone-btn").text("Verify").addClass('btnPrimary').removeClass('btnIncomplete');
            } else {
                $("#modalview-verifyPhone-btn").addClass('btnIncomplete').removeClass('btnPrimary').text("Cancel");
            }
        });
        $("#modalview-verifyPhone").data("kendoMobileModalView").open();
    },

    closeModal: function (e) {
        $("#verifyPhone-code").unbind('keyup').val('');
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
        var val = $("#verifyPhone-code").val().length;

        if(val > 4){
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
                mobileNotify("Sorry, your code didn't match. ");
            }

        } else {
            verifyPhoneModal.closeModal();
        }

    }
};
var recoverPasswordView = {

    openModal: function (e) {
        var email = $("#home-signin-username").val();

        // ux helper for quick user input
        if(email !== ''){
            $("#home-recoverPassword-email").val(email);
        } else{
            $("#home-recoverPassword-email").val('');
        }
        $("#modalview-recoverPassword").data("kendoMobileModalView").open();
    },

    closeModal: function (e) {
        $("#modalview-recoverPassword").data("kendoMobileModalView").close();
    },


    recoverPassword : function (e) {

        var emailAddress = $("#home-recoverPassword-email").val();
        
        everlive.recoverPassword(emailAddress, function(error, data) {
            if (error !== null) {
                mobileNotify ("Password recovery error : " + JSON.stringify(error));
            } else {
                mobileNotify ("Password recovery instructions sent to " + emailAddress);
                recoverPasswordView.closeModal();
            }
        })


    }
};

var hotButtonView = {
    openModal : function (e) {
        _preventDefault(e);
        $("#hotButtonModal").data("kendoMobileModalView").open();
    },

    doCamera : function (e) {

    },

    doMyNotes : function (e) {

    },

    doSignOut : function (e) {

    },

    closeModal : function (e) {
        _preventDefault(e);
        $("#hotButtonModal").data("kendoMobileModalView").close();
    }
};