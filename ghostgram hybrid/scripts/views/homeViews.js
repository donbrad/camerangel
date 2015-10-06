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

        // Set name/alias layout
        ux.formatNameAlias(user.name, user.alias, "#modalview-profileStatus");
        $('#profileStatusMessage').text(user.statusMessage);

        // Zero the status character count
        $( "#profileStatusCount").text(userStatusView._profileStatusMax);
        $( "#profileStatusUpdate").val('');
        // Setup syncing for automatic update
        userStatusView._activeStatus.unbind('change' , userStatusView.syncUserStatus);
            status.set('statusMessage', user.statusMessage);
        if (userModel.isCheckedIn) {
            status.set('checkedInPlace', userModel.checkedInPlace);
        } else {
            status.set('checkedInPlace','');
        }
        status.set('currentPlace', user.currentPlace);
        status.set('isAvailable', user.isAvailable);
        userStatusView._activeStatus.bind('change' , userStatusView.syncUserStatus);

        // if there's a current checked in place -- select it in the list
        if (userStatusView._checkInPlaceId !== null) {
           // Is the current place in the list of candidate places?
            // Yes - select it

            // No - Select the first place in the list...
            //Todo: don - wire this up
        }

        $(userStatusView._modalId).data("kendoMobileModalView").open();

    },

    // close and redirect for user status
    closeModal : function () {

      // if there's a return URL, need to close the modal and then redirect to original view

        $(userStatusView._modalId).data("kendoMobileModalView").close();
       /* $(".userLocationUpdate").css("display", "none");*/

        var updatedStatus = $("#profileStatusUpdate").val();
        if(updatedStatus !== "") {
            // Save new status
            userModel.currentUser.set("statusMessage", updatedStatus);
            updateParseObject('userStatus','userUUID', userModel.currentUser.uuid, "statusMessage", updatedStatus);
        }
        // clear status box
        $("#profileStatusUpdate").val("");

        if (userStatusView._returnView !== null) {
            if (APP.kendo.view().id !== userStatusView._returnView)
                APP.kendo.navigate('#' + userStatusView._returnView);

            userStatusView._returnView = null;

        }
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

        // Update the status message when the text area loses focus
        $('#profileStatusUpdate').blur(function () {
            var updateText = $('#profileStatusUpdate').text();
            // Set the text in the ux
            $('#profileStatusMessage').val(updateText);

            userStatusView._activeStatus.set('statusMessage', updateText );
        });

        // Add key handler for character count
        $( "#profileStatusUpdate" ).keyup(function() {

            var status =  $( "#profileStatusUpdate").val(), length = status.length;
            if (length <= userStatusView._profileStatusMax) {
                var currentLength = userStatusView._profileStatusMax - length;
                $("#profileStatusCount").text(currentLength);

                if(currentLength < 8){
                    $(".statusCharacterCount").css("color", "#EF5350");
                } else {
                    $(".statusCharacterCount").css("color", "#979797");  //Had to hack this -- was setting color to background
                }

            } else {
                // Exceeds max characters, slice the extra and dont update that count
                $( "#profileStatusUpdate").val(status.slice(0, 39));
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
        modalView.init();
        if (modalView.okAction !== null) {
            modalView.okAction();
        }

    },

    cancelClick: function () {
        modalView.close();
        modalView.init();
        if (modalView.cancelAction !== null) {
            modalView.cancelAction();
        }

    }


};