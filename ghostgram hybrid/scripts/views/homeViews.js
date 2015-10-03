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
    _checkInPlaceId : null,
    _profileStatusMax: 40,
    _placesDS : new kendo.data.DataSource({
        sort: {
            field: "name",
            dir: "asc"
        }
    }),

    // Main entry point for userstatus modal
    openModal : function (e) {
        _preventDefault(e);

        //Cache the current view
        userStatusView._returnView = APP.kendo.view().id;

        userStatusView._placesDS.data([]);
        userStatusView._placesDS.add({placeuuid: null, name: "New Place"});


        var status = userStatusView._activeStatus, user = userModel.currentUser;
        
       	/// setting up user

        // Set name/alias layout
        ux.formatNameAlias(user.name, user.alias, "#modalview-profileStatus");
        $('#profileStatusMessage').text(user.statusMessage);

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
        status.set('currentPlace', user.currentPlace);
        status.set('isAvailable', user.isAvailable);
        userStatusView._activeStatus.bind('change' , userStatusView.syncUserStatus);


        // if there's a current checked in place -- select it in the list
        if (userStatusView._checkInPlaceId !== null) {

           // Is the current place in the list of candidate places?

            // Yes - select it

            // No - Select the first place in the list...
            //Todo: don - wire this up
        } else {
        	// hide checkout if not checked in
        	$("#checked-in-place").addClass("hidden");

        	// hide checkin selection 
        	$("#userStatusLocationBox").addClass("hidden");

        }

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

        // hide location
        $("#profileLocation, #checked-in-place").addClass("hidden");
    },

    checkIn : function (e) {
        _preventDefault(e);

        if (userStatusView._checkInPlaceId !== null) {
            userModel.checkIn(userStatusView._checkInPlaceId);
            mobileNotify("You're checked in to " + userModel.checkedInPlace.name);
        } else {
            mobileNotify("No place to check in to...");
        }

    },

    checkOut : function (e) {
        _preventDefault(e);

        userStatusView._checkInPlaceId = null;
        userModel.checkOut();
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

        // Wire up the select since html wiring doesn't seem to be working
        $('#userStatusLocationSelect').kendoDropDownList({
            autoBind: false,
            dataTextField: "placeuuid",
            dataValueField: "name",
            dataSource: userStatusView._placesDS,
            change: function(e) {
                var value = this.value();
                if (value === null) {
                    //User wants to create a new place to check in to...
                } else {
                    // Set the current place target this elements
                    userStatusView._checkInPlaceId = value;
                }
            }
        });

        userStatusView.statusCharCount(e);
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