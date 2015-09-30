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

    // Main entry point for userstatus modal
    openModal : function (returnurl) {
        //if returnurl is undefined, need to look for data-return
        if (returnurl !== undefined) {
            userStatusView._returnView = returnurl;
        } else {
            userStatusView._returnView = APP.kendo.view.id();
        }

        var status = userStatusView._activeStatus, user = userModel.currentUser;
        userStatusView._activeStatus.unbind('change' , userStatusView.syncUserStatus);
        status.set('statusMessage', user.statusMessage);
        status.set('currentPlace', user.currentPlace);
        status.set('isAvailable', user.isAvailable);
        userStatusView._activeStatus.bind('change' , userStatusView.syncUserStatus);
        $(userStatusView._modalId).data("kendoMobileModalView").open();

    },
    // close and redirect for user status
    closeModal : function () {

      // if there's a return URL, need to close the modal and then redirect to original view

        $(userStatusView._modalId).data("kendoMobileModalView").close();
       /* $(".userLocationUpdate").css("display", "none");
        var updatedStatus = $("#profileStatusUpdate").val();
        if(updatedStatus !== ""){
            // Save new status
            userModel.currentUser.set("statusMessage", updatedStatus);
        }
        // clear status box
        $("#profileStatusUpdate").val("");*/

        if (userStatusView._returnView !== null) {
            if (APP.kendo.view.id() !== userStatusView._returnView)
                APP.kendo.navigate('#' + userStatusView._returnView);
            userStatusView._returnView = null

        }
    },

    checkIn : function (e) {
        _preventDefault(e);
    },

    checkOut : function (e) {
        _preventDefault(e);
    },

    syncUserStatus: function (e) {
        _preventDefault(e);

        userModel.currentUser.set(e.field, this[e.field]);
        updateParseObject('userStatus','userUUID', userModel.currentUser.uuid, e.field, this[e.field]);

    },

    // Kendo open
    onOpen: function (e) {
        _preventDefault(e);
    },

    // Kendo close
    onClose: function (e) {
        _preventDefault(e);
    }
};