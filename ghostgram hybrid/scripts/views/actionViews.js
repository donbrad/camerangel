/**
 * Created by donbrad on 12/31/15.
 *
 * Smart Objects UX -- one modal for each action
 * Events - modalActionMeeting
 * Flights - modalActionFlight
 * Movies - modalActionMovies
 */

'use strict';

var modalActionMeeting = {
    _activeObject : new kendo.data.ObservableObject(),
    _date : new Date(),
    _placeId :null,
    _isInited : false,
    _eventList :[],

    onInit: function (e) {
        _preventDefault(e);


    },

    initActiveObject : function () {
        var thisObj = modalActionMeeting._activeObject;

        var newDate = Date.today();
        thisObj.set("uuid", uuid.v4());
        thisObj.set('senderUUID', userModel.currentUser.userUUID);
        thisObj.set('channelId', null);
        thisObj.set('eventChatId', null);
        thisObj.set('title', null);
        thisObj.set('type', "meeting");
        thisObj.set('action', null);
        thisObj.set('description', null);
        thisObj.set('address', null);
        thisObj.set('placeName', null);
        thisObj.set('placeId', null);
        thisObj.set('calendarId', null);
        thisObj.set('lat', null);
        thisObj.set('lng', null);
        thisObj.set('date', newDate);
        thisObj.set('approxTime', false);
        thisObj.set('approxPlace', false);
        thisObj.set('timeFlexible', false);
        thisObj.set('placeFlexible', false);
        thisObj.set('isDeleted', false);
        thisObj.set('isModified', false);
        thisObj.set('isAccepted', false);
        thisObj.set('isAccepted', false);
        thisObj.set('addToCalendar', false);
        thisObj.set('declineList', []);
        thisObj.set('acceptList', []);
        thisObj.set('inviteList', []);
        thisObj.set('commentList', []);


        $('#modalActionMeeting-placesearch').val(thisObj.placeName);
        $('#modalActionMeeting-datestring').val(new Date(thisObj.date).toString('dddd, MMMM dd, yyyy h:mm tt'));
        $('#modalActionMeeting-date').val(new Date(thisObj.date).toString('MMMM dd, yyyy'));
        $('#modalActionMeeting-time').val(new Date(thisObj.date).toString('h:mm tt'));
    },

    setActiveObject : function (newObj) {
        var thisObj = modalActionMeeting._activeObject;

        if (newObj.uuid === undefined || newObj.uuid === null) {
            newObj.uuid = uuid.v4();
        }
        thisObj.set('channelId', newObj.channelId);
        thisObj.set('eventChatId', newObj.eventChatId);
        thisObj.set('title', newObj.title);
        thisObj.set('type', newObj.type);
        thisObj.set('uuid', newObj.uuid);
        thisObj.set('senderUUID', newObj.senderUUID);
        thisObj.set('action', newObj.action);
        thisObj.set('description', newObj.description);
        thisObj.set('address', newObj.address);
        thisObj.set('placeName', newObj.placeName);
        thisObj.set('calendarId', newObj.calendarId);
        thisObj.set('placeId', newObj.placeId);
        thisObj.set('lat', newObj.lat);
        thisObj.set('lng', newObj.lng);
        if (newObj.date === undefined || newObj.date === null) {
            newObj.date = new Date ();
        }
        thisObj.set('date', newObj.date);
        thisObj.set('acceptList', newObj.acceptList);
        thisObj.set('declineList', newObj.declineList);
        thisObj.set('inviteList', newObj.inviteList);
        thisObj.set('commentList', newObj.commentList);
        thisObj.set('approxTime', newObj.approxTime);
        thisObj.set('approxPlace', newObj.approxPlace);
        thisObj.set('timeFlexible', newObj.timeFlexible);
        thisObj.set('placeFlexible', newObj.placeFlexible);
        thisObj.set('isModified', newObj.isModified);
        thisObj.set('isDeleted', newObj.isDeleted);
        thisObj.set('isAccepted', newObj.isAccepted);
        thisObj.set('isDeclined', newObj.isDeclined);

        thisObj.set('addToCalendar', false);
        if (newObj.calendarId !== undefined || newObj.calendarID !== null) {
            thisObj.set('addToCalendar', true);
            $('#actionMeeting-addToCalendar').prop('readonly', true);
        } else {
            $('#actionMeeting-addToCalendar').prop('readonly', false);
        }

        if (newObj.senderUUID === undefined || newObj.senderUUID === userModel.currentUser.userUUID) {
            $('#actionMeeting-save').removeClass('hidden');
            $('#actionMeeting-accept').addClass('hidden');
        } else {
            $('#actionMeeting-save').addClass('hidden');
            $('#actionMeeting-accept').removeClass('hidden');
        }

        $('#modalActionMeeting-placesearch').val(newObj.placeName);
        $('#modalActionMeeting-datestring').val(new Date(newObj.date).toString('dddd, MMMM dd, yyyy h:mm tt'));
        $('#modalActionMeeting-date').val(new Date(newObj.date).toString('MMMM dd, yyyy'));
        $('#modalActionMeeting-time').val(new Date(newObj.date).toString('h:mm tt'));
    },


    onShow: function (e) {
        _preventDefault(e);
        modalActionMeeting._placeId = null;
        $("#modalActionMeeting-placesearchBtn").text("");
        $("#modalActionMeeting-placesearch").val("");
        $("#modalActionMeeting-datestring").val("");
    },

    placeSearch : function (e) {
        _preventDefault(e);

        var placeStr =  $("#modalActionMeeting-placesearch").val();

        mobileNotify("SearchPlaces : "  + placeStr);

    },

    updateDateString : function () {
        var date = $('#modalActionMeeting-date').val();
        var time = $('#modalActionMeeting-time').val();

        $("#modalActionMeeting-datestring").val(date + " " + time);

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

            $("#modalActionMeeting-datestring").on('blur', function () {
                var dateStr =  $("#modalActionMeeting-datestring").val();
                if (dateStr.length > 6) {
                    var timeString = dateStr.match(/\d{1,2}([:.]?\d{1,2})?([ ]?[a|p]m)/ig);
                    var date = Date.today();
                    var timeComp = '';
                    if (timeString !== null && timeString.length > 0) {

                        dateStr = dateStr.replace(timeString[0], '');
                        dateStr = dateStr.trim();


                        var time = Date.parse(timeString[0]);
                        timeComp = new Date(time).toString("h:mm tt");



                    }
                    if (dateStr.length > 4) {
                        date = Date.parse(dateStr);
                    }
                    var dateComp = new Date(date).toString("MMMM dd, yyyy");
                    var finalDateStr  =  dateComp;

                    if(timeComp !== '')
                        finalDateStr += " " +  timeComp;

                    $('#modalActionMeeting-date').val(dateComp);
                    $('#modalActionMeeting-time').val(timeComp);
                    modalActionMeeting._activeObject.set('date', new Date(finalDateStr));

                }
            });

            $('#modalActionMeeting-date').pickadate();
            //$('#modalActionMeeting-time').pickatime();

            $("#modalActionMeeting-date").on('blur', function () {
                modalActionMeeting.updateDateString();
            });

            $("#modalActionMeeting-time").on('blur', function () {
                var timeIn =  $("#modalActionMeeting-time").val();
                var time = Date.parse(timeIn);
                var timeComp = new Date(time).toString("h:mm tt");
                $("#modalActionMeeting-time").val(timeComp);
                modalActionMeeting.updateDateString();
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
                    var placeStr = $("#modalActionMeeting-placesearch").val();

                    if (modalActionMeeting._placeId !== null) {
                        var place = placesModel.getPlaceModel(modalActionMeeting._placeId);

                        if (placeStr === place.name) {
                            return;
                        }
                        modalActionMeeting._placeId = null;
                        modalActionMeeting._activeObject.set('placeId', modalActionMeeting._placeId);
                        modalActionMeeting._activeObject.set('placeName',placeStr);
                        modalActionMeeting._activeObject.set('address',placeStr);

                    }
                    // event fired on blur -- if a place wasn't selected, need to do a nearby search

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
                    var dataItem = this.dataItem(e.item.index());
                    modalActionMeeting._placeId = dataItem.uuid;
                    modalActionMeeting._activeObject.set('placeId', modalActionMeeting._placeId);
                    modalActionMeeting._activeObject.set('placeName',dataItem.name);
                    modalActionMeeting._activeObject.set('address',dataItem.address);



                    // Hide the Find Location button
                    $("#modalActionMeeting-placesearchdiv").addClass('hidden');

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
        $("#modalview-actionMeeting").data("kendoMobileModalView").open();
    },

    onCancel: function (e) {
        //_preventDefault(e);
        $("#modalview-actionMeeting").data("kendoMobileModalView").close();
    },

    onAccept : function (e) {

    },

    onDecline : function (e) {

    },

    doEventChat : function (e) {
        _preventDefault(e);
        mobileNotify("Create Event Chat in progress...");
    },

    createSmartEvent : function (thisObj) {
        var thisObject = {};
        if (thisObj.action === null) {
            // User has submitted a custom action
            var titleArray = thisObj.title.split(' ');
            thisObj.action = titleArray[0].toLowerCase();
            if (!smartObject.isCurrentAction(thisObj.action)) {
                // Todo: add new action to users private dictionary
            }
        }

        thisObject.uuid = thisObj.uuid;
        thisObject.action = thisObj.action;
        thisObject.type = thisObj.type;
        thisObject.title = thisObj.title;
        thisObject.description = thisObj.description;
        thisObject.date = thisObj.date;
        thisObject.placeId = thisObj.placeId;
        thisObject.placeName = thisObj.placeName;
        thisObject.address = thisObj.address;
        thisObject.senderUUID = thisObj.senderUUID;
        thisObject.channelId = thisObj.channelId;
        thisObject.eventChatId = thisObj.eventChatId;
        thisObject.calendarId = thisObj.calendarId;
        thisObject.lat = thisObj.lat;
        thisObject.lng = thisObj.lng;
        thisObject.approxTime = thisObj.approxTime;
        thisObject.approxPlace = thisObj.approxPlace;
        thisObject.timeFlexible = thisObj.timeFlexible;
        thisObject.placeFlexible = thisObj.placeFlexible;
        thisObject.isDeleted = false;
        thisObject.isModified = true;
        thisObject.isAccepted = thisObj.isAccepted;
        thisObject.isDeclined = thisObj.isDeclined;
        thisObject.declineList = thisObj.declineList;
        thisObject.acceptList = thisObj.acceptList;
        thisObject.inviteList = thisObj.inviteList;
        thisObject.commentList = thisObj.commentList;

        channelView.addSmartObjectToMessage(thisObj.uuid, thisObject);

    },

    onDone: function (e) {
        //_preventDefault(e);

        var thisObj = modalActionMeeting._activeObject;

        if (thisObj.senderUUID === userModel.currentUser.userUUID) {
            modalActionMeeting.createSmartEvent(thisObj);
        } else {
            mobileNotify("Invitee features in progress...");
        }


        $("#modalview-actionMeeting").data("kendoMobileModalView").close();
    }

};

