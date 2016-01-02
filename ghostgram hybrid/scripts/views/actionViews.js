/**
 * Created by donbrad on 12/31/15.
 */

'use strict';

var modalActionMeeting = {
    _activeObject : new kendo.data.ObservableObject(),
    _date : new Date(),
    _isInited : false,

    onInit: function (e) {
        _preventDefault(e);


    },

    initActiveObject : function () {
        var thisObj = modalActionMeeting._activeObject;

        thisObj.set('title', 'Meeting Invite');
        thisObj.set('action', null);
        thisObj.set('descrption', null);
        thisObj.set('address', null);
        thisObj.set('placeId', null);
        thisObj.set('lat', 0);
        thisObj.set('lng', 0);
        thisObj.set('date', new Date());
        thisObj.set('approxTime', false);
        thisObj.set('approxPlace', false);
        thisObj.set('timeFlexible', false);
        thisObj.set('placeFlexible', false);
    },

    setActiveObject : function (newObj) {
        var thisObj = modalActionMeeting._activeObject;

        thisObj.set('title', newObj.title);
        thisObj.set('action', newObj.action);
        thisObj.set('descrption', newObj.description);
        thisObj.set('address', newObj.address);
        thisObj.set('placeId', newObj.placeId);
        thisObj.set('lat', newObj.lat);
        thisObj.set('lng', newObj.lng);
        if (newObj.date === undefined || newObj.date === null) {
            newObj.date = new Date ();
        }
        thisObj.set('date', newObj.date);
        thisObj.set('approxTime', newObj.approxTime);
        thisObj.set('approxPlace', newObj.approxPlace);
        thisObj.set('timeFlexible', newObj.timeFlexible);
        thisObj.set('placeFlexible', newObj.placeFlexible);
    },


    onShow: function (e) {
        _preventDefault(e);


    },


    openModal: function (actionObj) {
        if (!modalActionMeeting._isInited) {

           /* $("#modalActionMeeting-datetimepicker").kendoDateTimePicker({
                value: this._date
            });*/

            $("#modalActionMeeting-datetime").on('input', function (e) {
                var value = $("#modalActionMeeting-date").val();

                if (value.length > 4) {

                }
            });

            $("#modalActionMeeting-placesearch").kendoAutoComplete({
                dataSource: placesModel.placesDS,
                ignoreCase: true,
                dataTextField: "name",
                dataValueField: "uuid",
                select: function(e) {
                    var item = e.item;
                    var text = item.text();
                    // Use the selected item or its text
                },
                filter: "startswith",
                placeholder: "Select location... "
            });

            $("#modalActionMeeting-placesearch").on('input', function (e) {
                var placeStr =  $("#modalActionMeeting-placesearch").val();

            });
            modalActionMeeting._isInited = true;
        }
        modalActionMeeting._date = new Date();

        if (actionObj === undefined || actionObj === null) {
            modalActionMeeting.initActiveObject();
        } else {
            modalActionMeeting.setActiveObject(actionObj);
        }

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

