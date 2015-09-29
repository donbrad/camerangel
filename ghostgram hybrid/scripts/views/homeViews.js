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

    // Main entry point for userstatus modal
    openModal : function (returnurl) {
        //if returnurl is undefined, need to look for data-return
        if (returnurl !== undefined) {
            userStatusView._returnView = returnurl;
        }
        $("#modalview-profileStatus").data("kendoMobileModalView").open();

    },

    closeModal : function () {

      // if there's a return URL, need to close the modal and then redirect to original view

        $("#modalview-profileStatus").data("kendoMobileModalView").close();
       /* $(".userLocationUpdate").css("display", "none");
        var updatedStatus = $("#profileStatusUpdate").val();
        if(updatedStatus !== ""){
            // Save new status
            userModel.currentUser.set("statusMessage", updatedStatus);
        }
        // clear status box
        $("#profileStatusUpdate").val("");*/

        if (userStatusView._returnView !== null) {
            APP.kendo.navigate('#'+userStatusView._returnView);
            userStatusView._returnView = null

        }
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