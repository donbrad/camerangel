/**
 * Created by donbrad on 12/31/15.
 */

'use strict';

var modalActionMeeting = {
    _activeObject : new kendo.data.ObservableObject(),
    _date : new Date(),

    onInit: function (e) {
        _preventDefault(e);
        $("#actionMeeting-datetimepicker").kendoDateTimePicker({
            value: this._date
        });
    },

    onShow: function (e) {
        _preventDefault(e);

        var thisObj = modalActionMeeting._activeObject;

        thisObj.set('title', 'Meeting Invite');
        thisObj.set('timeFlexible', true);
        modalActionMeeting._date = new Date();
    },


    openModal: function (actionObj) {

        $("#modalview-actionMeeting").data("kendoMobileModalView").open();
    },

    onCancel: function (e) {
        //_preventDefault(e);
        $("#modalview-actionMeeting").data("kendoMobileModalView").close();
    },


    onDone: function (e) {
        //_preventDefault(e);
        $("#modalview-actionMeeting").data("kendoMobileModalView").close();
    }

};

