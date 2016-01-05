/**
 * Created by donbrad on 12/31/15.
 */

'use strict';

var modalActionMeeting = {
    _activeObject : new kendo.data.ObservableObject(),
    _date : new Date(),
    _isInited : false,
    _eventList :[],

    onInit: function (e) {
        _preventDefault(e);


    },

    initActiveObject : function () {
        var thisObj = modalActionMeeting._activeObject;

        thisObj.set('title', null);
        thisObj.set('type', null);
        thisObj.set('uuid', null);
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

        if (newObj.uuid === undefined || newObj.uuid === null) {
            newObj.uuid = uuid.v4();
        }

        thisObj.set('title', newObj.title);
        thisObj.set('type', newObj.type);
        thisObj.set('uuid', newObj.uuid);
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
        $("#modalActionMeeting-placesearchBtn").text("");
        $("#modalActionMeeting-placesearch").val("");
    },

    placeSearch : function (e) {
        _preventDefault(e);

        var placeStr =  $("#modalActionMeeting-placesearch").val();

        mobileNotify("SearchPlaces : "  + placeStr);

    },

    openModal: function (actionObj) {
        if (!modalActionMeeting._isInited) {

            modalActionMeeting._eventList = smartObject.getActionNames();

            $("#modalActionMeeting-title").kendoAutoComplete({
                dataSource: modalActionMeeting._eventList,
                ignoreCase: true,
                change: function (e) {
                    var eventStr =  $("#modalActionMeeting-title").val();
                    modalActionMeeting._activeObject.set('title', eventStr);

                },
                select: function(e) {
                    var event = e.item;
                    var actionStr = e.item[0].textContent;
                    modalActionMeeting._activeObject.set('action', actionStr);

                    // Use the selected item or its text
                },
                filter: "contains",
                placeholder: "Select Event... "
            });

            $("#modalActionMeeting-placesearch").on('input', function () {
                var placeStr =  $("#modalActionMeeting-placesearch").val();
                if (placeStr.length > 3) {
                    $("#modalActionMeeting-placesearchBtn").text("Find " + placeStr);
                    $("#modalActionMeeting-placesearchdiv").removeClass('hidden');
                } else {
                    $("#modalActionMeeting-placesearchdiv").addClass('hidden');
                }
            });

            $("#modalActionMeeting-placesearch").kendoAutoComplete({
                dataSource: placesModel.placesDS,
                ignoreCase: true,
                dataTextField: "name",
                dataValueField: "uuid",
                change: function (e) {
                    // event fired on blur -- if a place wasn't selected, need to do a nearby search
                    var placeStr =  $("#modalActionMeeting-placesearch").val();
                    if (placeStr.length > 3) {
                        $("#modalActionMeeting-placesearchBtn").text("Find " + placeStr);
                        $("#modalActionMeeting-placesearchdiv").removeClass('hidden');
                    } else {
                        $("#modalActionMeeting-placesearchdiv").addClass('hidden');
                    }
                },
                select: function(e) {
                    // User has selected one of their places
                    var place = e.item;

                },
                filter: "contains",
                placeholder: "Select location... "
            });

            modalActionMeeting._isInited = true;
        }
        modalActionMeeting._date = new Date();

        if (actionObj === undefined || actionObj === null) {
            modalActionMeeting.initActiveObject();
        } else {
            modalActionMeeting.setActiveObject(actionObj);
        }

        $("#modalActionMeeting-placesearchdiv").addClass('hidden');
        $("#modalActionMeeting-datetime").val(modalActionMeeting._activeObject.get('date'));
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
