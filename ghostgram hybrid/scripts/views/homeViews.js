/**
 * Created by donbrad on 9/29/15.
 * homeViews.js -- all view management for userstatus, login, logout, home and newuserhome
 */


'use strict';

/*
 * userStatusView -- currently modalview
 */

var userStatusView = {
    _activeStatus : new kendo.data.ObservableObject(),
    _returnView : null,
    _modalId : "#modalview-profileStatus",
    _profileStatusMax: 40,

    _update : function () {
        var status = userStatusView._activeStatus, user = userModel.currentUser;
        
       	/// setting up user

        // Set name/alias layout
        ux.formatNameAlias(user.name, user.alias, "#modalview-profileStatus");
        $('#profileStatusMessage').text(user.get('statusMessage'));

        // Zero the status character count
        $("#profileStatusUpdate").val('');
        $("#statusCharCount").text(userStatusView._profileStatusMax);
        /* Setup syncing for automatic update
        userStatusView._activeStatus.unbind('change' , userStatusView.syncUserStatus);
        */

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

		/// Setting up status

        status.set('statusMessage', user.statusMessage);

        if (user.isCheckedIn) {
            status.set('currentPlace', user.currentPlace);
        } else {
            status.set('currentPlace','');
        }

        status.set('isAvailable', user.isAvailable);

        // if there's a current checked in place -- select it in the list
        if (user.currentPlaceUUID !== null && user.isCheckedIn) {

        	$("#profileCheckOutLi").removeClass("hidden");
        	$("#checkOut-text").text(user.currentPlace);

        } else {
            $('#profileCheckOutLi').addClass('hidden');
        	// hide checkout if not checked in
        	$("#checked-in-place").addClass("hidden");

        	// hide checkin selection 
        	$("#userStatusLocationBox").addClass("hidden");

        }

    },

    // Main entry point for userstatus modal
    openModal : function (e) {
        _preventDefault(e);

        //Cache the current view
        userStatusView._returnView = APP.kendo.view().id;

       // mobileNotify("Updating your location...");

        if (userModel.currentUser.isCheckedIn && userModel.currentUser.currentPlaceUUID !== null) {
            // hide location if the user is not checked in
            $("#profileLocation, #checked-in-place").removeClass("hidden");
        } else {
            $("#profileLocation, #checked-in-place").addClass("hidden");
        }

        $(".statusCharacterCount").css("color", "#979797");

        mapModel.getCurrentAddress(function (isNew, address) {
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

    // close and redirect for user status
    closeModal : function () {

      	// if there's a return URL, need to close the modal and then redirect to original view
        $(userStatusView._modalId).data("kendoMobileModalView").close();

        var updatedStatus = $("#profileStatusUpdate").val();
        if(updatedStatus !== "") {
            // Save new status
            userModel.currentUser.set("statusMessage", updatedStatus);
            updateParseObject('userStatus','userUUID', userModel.currentUser.uuid, "statusMessage", updatedStatus);
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

    checkIn : function (e) {
        _preventDefault(e);

        if (mapModel.currentPlaceId !== null) {

            userModel.checkIn(mapModel.currentPlaceId);
            mapModel.checkIn(mapModel.currentPlaceId);
            mobileNotify("You're checked in!");
            $('#profileCheckOutLi').velocity("slideDown", {begin: function(element){
            	$(element).removeClass("hidden");
            }
        });
        } else {
            mobileNotify("No place to check in to...");
        }

    },

    checkOut : function (e) {
        _preventDefault(e);

        $('#profileCheckInLi').removeClass('hidden');
        $('#profileCheckOutLi').velocity("slideUp", {complete: function(element){
        	$(element).addClass("hidden");
        	}
    	});
        userModel.checkOut();
        mapModel.checkOut();
        $('#profileStatusCheckInPlace').text('');
    },

    syncUserStatus: function (e) {
        _preventDefault(e);

        userModel.currentUser.set(e.field, this[e.field]);
        updateParseObject('userStatus','userUUID', userModel.currentUser.uuid, e.field, this[e.field]);

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
        autosize($('#ghostEmailEditor'));

        $("#ghostEmailEditor").kendoEditor({
            tools: [
                "bold",
                "italic",
                "underline",
                "justifyLeft",
                "justifyCenter",
                "justifyRight",
                "insertUnorderedList",
                "indent",
                "outdent",
                "createTable",
                "fontSize",
                {
                    name: "insertImage",
                    exec: function (e) {
                        e.preventDefault();
                        modalGalleryView.openModal(function(imageUrl){
                            $('#ghostEmailEditor').data("kendoEditor").paste('<div style="max-width: 50%; max-height: 50%;>" <img src="'+imageUrl+'"/></div>', {split: true});
                        });
                    }

                }
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

        autosize.update($('#ghostEmailEditor'));
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
        if (ghostEditView._callback  !== null) {
            ghostEditView._callback();
        }
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
            var thisUser = userModel.currentUser.get('name');
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

    }
};