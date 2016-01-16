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
    response: false,

    onInit: function (e) {
        _preventDefault(e);


    },

    initActiveObject : function () {
        var thisObj = modalActionMeeting._activeObject;

        var newDate = Date.today();
        thisObj.set("uuid", uuid.v4());
        thisObj.set('senderUUID', null);
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
        thisObj.set('comment', null);
        thisObj.set('commentList', []);
        thisObj.set('wasSent', false);


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
        thisObj.set("wasSent", true);
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
            newObj.date = new Date();
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

        if (newObj.senderUUID === null || newObj.senderUUID === userModel.currentUser.userUUID) {
            modalActionMeeting.setSenderMode();
        } else {
            modalActionMeeting.setRecipientMode();
        }


    },


    setSenderMode: function () {
        var thisEvent = modalActionMeeting._activeObject;

        $(".event-owner, #event-viewMode").removeClass("hidden");
        $(".event-recipient, #event-editMode").addClass("hidden");
        $("#event-owner-edit").addClass("hidden");
        if(thisEvent.wasSent){
            // owner of a previously created event
            if(thisEvent.isExpired){
                $('#actionMeeting-reschedule').removeClass('hidden');
                $('#actionMeeting-update').addClass('hidden');
                $("#event-owner-cancel").addClass("hidden");

            } else {
                $('#actionMeeting-reschedule').addClass('hidden');
                $("#event-owner-cancel").removeClass("hidden");
                // show edit button in header
                $("#event-owner-edit").removeClass("hidden");
            }
        } else {
            // new event
            modalActionMeeting.showEditMode();
        }


    },

    showEditMode: function(){
        $("#event-owner-edit").addClass("hidden");
        $("#event-editMode").removeClass("hidden");
        $("#event-viewMode").addClass("hidden");

        // Set btm action btn
        $('#actionMeeting-save').removeClass('hidden');
        $('#actionMeeting-reschedule').addClass('hidden');

        // set event times
        var thisEvent = modalActionMeeting._activeObject;
        $('#modalActionMeeting-placesearch').val('');
        $('#modalActionMeeting-datestring').val(new Date(thisEvent.date).toString("MMMM dd, yyyy h:mm tt"));
        $('#modalActionMeeting-date').val(new Date(thisEvent.date).toString("MMMM dd, yyyy"));
        $('#modalActionMeeting-time').val(new Date(thisEvent.date).toString("h:mm tt"));
    },

    setAcceptStatus : function () {
        var thisEvent = modalActionMeeting._activeObject;

        if (thisEvent.isAccepted) {
            $('#actionMeeting-acceptStatus').text("You've accepted this event");
        } else if (thisEvent.isDeclined) {
            $('#actionMeeting-acceptStatus').text("You've declined this event");
        } else {
            $('#actionMeeting-acceptStatus').text("Please accept or decline this event");

        }
    },

    setRecipientMode : function () {
        var thisEvent = modalActionMeeting._activeObject;

        $(".event-owner").addClass("hidden");
        $(".event-recipient, #event-viewMode").removeClass("hidden");
        // if event is expired disable rsvp
        if(thisEvent.isExpired){
            $("#event-rsvp").data("kendoMobileButtonGroup").enable(false);
        } else {
            $("#event-rsvp").data("kendoMobileButtonGroup").enable(true);
            // set user response
            if(thisEvent.isAccepted){
                $("#event-rsvp").data("kendoMobileButtonGroup").select(0);
                modalActionMeeting.setEventBanner("accepted");
            } else if(thisEvent.isDeclined){
                $("#event-rsvp").data("kendoMobileButtonGroup").select(1);
                modalActionMeeting.setEventBanner("declined");
            } else {
                modalActionMeeting.setEventBanner("pending");
            }
        }
    },

    onShow: function (e) {
        _preventDefault(e);
        modalActionMeeting._placeId = null;

        $("#modalActionMeeting-placesearchBtn").text("");
        $("#modalActionMeeting-placesearch").val("");
        $("#modalActionMeeting-datestring").val("");
        $("#modalActionMeeting-date").val("");
        $("#modalActionMeeting-time").val("");
        $('#modalActionMeeting-comments').val("");
    },

    placeSearch : function (e) {
        _preventDefault(e);

        var placeStr =  $("#modalActionMeeting-placesearch").val();

        mobileNotify("SearchPlaces : "  + placeStr);

    },

    updateDateString : function () {
        var date = $('#modalActionMeeting-date').val();
        var time = $('#modalActionMeeting-time').val();

        var finalDateStr = date + " " + time;
        $("#modalActionMeeting-datestring").val(finalDateStr);

        modalActionMeeting._activeObject.set('date', new Date(finalDateStr));

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
                placeholder: "Event title"
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
            
            $('#modalActionMeeting-date').pickadate({
                weekdaysShort: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
                showMonthsShort: true,
                onClose: function(){
                    modalActionMeeting.updateDateString();
                }
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
            // setup as a new event
            modalActionMeeting.setSenderMode();
        } else {
            // we have an existing event
            modalActionMeeting.setActiveObject(actionObj);
            var thisObject = modalActionMeeting._activeObject;

            if (moment(modalActionMeeting._date).isAfter(thisObject.date)) {
                // event is expired
                modalActionMeeting.setEventBanner("expired");
                thisObject.set('isExpired', true);

            } else {
                // event is in the future
                thisObject.set('isExpired', false);
            }

            // setting send/receiver
            if (thisObject.senderUUID === undefined || thisObject.senderUUID === null) {
                modalActionMeeting.setSenderMode();
            } else if (thisObject.senderUUID === userModel.currentUser.userUUID) {
                modalActionMeeting.setSenderMode();
            } else {
                modalActionMeeting.setRecipientMode();
            }

            // setting event location
            if(thisObject.placeName !== null){
                $(".event-location").removeClass("hidden");
            } else {
                $(".event-location").addClass("hidden");
            }

            var prettyDate = moment(thisObject.date).format('ddd MMM Do [at] hA');
            $(".event-date").text(prettyDate);

        }

        $("#modalActionMeeting-placesearchdiv").addClass('hidden');


        $("#modalview-actionMeeting").data("kendoMobileModalView").open();
    },

    setEventBanner: function(state){
        // Styling for event banner state
        switch(state){
            case "expired":
                $(".eventBanner").removeClass("hidden").addClass("eventExpired");
                $(".eventBannerTitle").text("Event expired");
                $(".eventBannerImg").attr("src", "images/smart-time-light.svg");

                break;
            case "pending":
                $(".eventBanner").removeClass("hidden").addClass("eventPending");

                break;
            case "accepted":
                $(".eventBanner").removeClass("hidden").addClass("eventAccepted");

                break;
            case "declined":
                $(".eventBanner").removeClass("hidden").addClass("eventDeclined");

                break;
            default:
                $(".eventBanner").addClass("hidden");
                $(".eventBannerTitle").text("");
                $(".eventBannerImg").attr("src", "");
        }

    },

    eventMapLocation: function(e){
        _preventDefault(e);
        // todo - wire map view of event location

    },

    onCancel: function (e) {
        _preventDefault(e);
        $(".event-owner, .event-recipient, #event-editMode, #event-viewMode").addClass("hidden");
        $("#modalview-actionMeeting").data("kendoMobileModalView").close();
        modalActionMeeting.setEventBanner();
    },

    sendEventStatus: function(e){
        // todo - wire event status
        modalActionMeeting.onDone();
    },

    onAccept : function (e) {
        var thisEvent = modalActionMeeting._activeObject;

        var commentStr = $('#modalActionMeeting-comments').val();

        smartObject.accept(thisEvent.uuid, thisEvent.senderUUID, commentStr);

        modalActionMeeting.setAcceptStatus();

        modalActionMeeting.onDone();
    },

    onDecline : function (e) {
        var thisEvent = modalActionMeeting._activeObject;

        var commentStr = $('#modalActionMeeting-comments').val();

        smartObject.accept(thisEvent.uuid, thisEvent.senderUUID, commentStr);

        modalActionMeeting.setAcceptStatus();

        modalActionMeeting.onDone();
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
        thisObject.senderUUID = userModel.currentUser.userUUID;
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

    onUpdateEvent: function (e) {
        var thisObj = modalActionMeeting._activeObject;
        // todo - wire event update
        modalActionMeeting.onDone();
    },

    onSaveEvent : function (e) {
        var thisObj = modalActionMeeting._activeObject;
        // todo - wire create new event

        
        var finalDateStr = $("#modalActionMeeting-datestring").val();

        modalActionMeeting._activeObject.set('date', new Date(finalDateStr));
        modalActionMeeting.createSmartEvent(thisObj);


        modalActionMeeting.onDone();
    },

    onCancelEvent: function (e) {
        var thisObj = modalActionMeeting._activeObject;
        // todo - wire conformation and delete
        modalActionMeeting.onDone();
    },

    onDone: function (e) {
        //_preventDefault(e);

        $("#modalview-actionMeeting").data("kendoMobileModalView").close();
    }

};



var smartEventView = {
    _activeObject : new kendo.data.ObservableObject(),
    _date : new Date(),
    _placeId :null,
    _isInited : false,
    _eventList :[],

    onInit: function (e) {
        _preventDefault(e);


    },

    initActiveObject : function () {
        var thisObj = smartEventView._activeObject;

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
        thisObj.set('comment', null);
        thisObj.set('commentList', []);
        thisObj.set('wasSent', false);


        $('#smartEventView-placesearch').val(thisObj.placeName);
        $('#smartEventView-datestring').val(new Date(thisObj.date).toString('dddd, MMMM dd, yyyy h:mm tt'));
        $('#smartEventView-date').val(new Date(thisObj.date).toString('MMMM dd, yyyy'));
        $('#smartEventView-time').val(new Date(thisObj.date).toString('h:mm tt'));
    },

    setActiveObject : function (newObj) {
        var thisObj = smartEventView._activeObject;

        if (newObj.uuid === undefined || newObj.uuid === null) {
            newObj.uuid = uuid.v4();
        }
        thisObj.set("wasSent", true);
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
            $('#smartEventView-addToCalendar').prop('readonly', true);
        } else {
            $('#smartEventView-addToCalendar').prop('readonly', false);
        }

        if (newObj.senderUUID === undefined || newObj.senderUUID === userModel.currentUser.userUUID) {
            smartEventView.setSenderMode();
        } else {
            smartEventView.setRecipientMode();
        }

        $('#smartEventView-placesearch').val(newObj.placeName);
        $('#smartEventView-datestring').val(new Date(newObj.date).toString('dddd, MMMM dd, yyyy h:mm tt'));
        $('#smartEventView-date').val(new Date(newObj.date).toString('MMMM dd, yyyy'));
        $('#smartEventView-time').val(new Date(newObj.date).toString('h:mm tt'));
    },


    setSenderMode: function (wasSent) {

        if (wasSent) {
            $('#smartEventView-update').removeClass('hidden');
            $('#smartEventView-save').addClass('hidden');
        } else {
            $('#smartEventView-save').removeClass('hidden');
            $('#smartEventView-update').addClass('hidden');
        }

        $('#smartEventView-accept').addClass('hidden');
        $('#smartEventView-commentsLi').addClass('hidden');

        $('#smartEventView-title').prop('readonly', false);
        $('#smartEventView-desc').prop('readonly', false);
        $('#smartEventView-datestring').prop('readonly', false);
        $('#smartEventView-date').prop('readonly', false);
        $('#smartEventView-time').prop('readonly', false);
    },

    setRecipientMode : function () {

        $('#smartEventView-save').addClass('hidden');
        $('#smartEventView-accept').removeClass('hidden');
        $('#smartEventView-commentsLi').removeClass('hidden');
        $('#smartEventView-title').prop('readonly', true);
        $('#smartEventView-desc').prop('readonly', true);
        $('#smartEventView-datestring').prop('readonly', true);
        $('#smartEventView-date').prop('readonly', true);
        $('#smartEventView-time').prop('readonly', true);
    },



    placeSearch : function (e) {
        _preventDefault(e);

        var placeStr =  $("#smartEventView-placesearch").val();

        mobileNotify("SearchPlaces : "  + placeStr);

    },

    updateDateString : function () {
        var date = $('#smartEventView-date').val();
        var time = $('#smartEventView-time').val();

        var finalDateStr = date + " " + time;
        $("#smartEventView-datestring").val(finalDateStr);

        smartEventView._activeObject.set('date', new Date(finalDateStr));

    },

    onShow: function (e) {
        _preventDefault(e);
        modalActionMeeting._placeId = null;

        $("#smartEventView-placesearchBtn").text("");
        $("#smartEventView-placesearch").val("");
        $("#smartEventView-datestring").val("");
        $("#smartEventView-comments").val("");


        if (!smartEventView._isInited) {

            smartEventView._eventList = smartObject.getActionNames();

            $("#smartEventView-title").kendoAutoComplete({
                dataSource: smartEventView._eventList,
                ignoreCase: true,
                change: function (e) {
                    var eventStr =  $("#modalActionMeeting-title").val();
                    smartEventView._activeObject.set('title', eventStr);

                },
                select: function(e) {
                    var event = e.item;
                    var actionStr = e.item[0].textContent;
                    smartEventView._activeObject.set('action', actionStr);

                    // Use the selected item or its text
                },
                filter: "contains",
                placeholder: "Select Event... "
            });

            $("#smartEventView-datestring").on('blur', function () {
                var dateStr =  $("#smartEventView-datestring").val();
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

                    $('#smartEventView-date').val(dateComp);
                    $('#smartEventView-time').val(timeComp);
                    smartEventView._activeObject.set('date', new Date(finalDateStr));

                }
            });

            $('#smartEventView-date').pickadate();

            // edit event date
            $("#smartEventView-date").on('blur', function () {
                smartEventView.updateDateString();
            });

            // Edit event time
            $("#smartEventView-time").on('blur', function () {
                var timeIn =  $("#smartEventView-time").val();
                var time = Date.parse(timeIn);
                var timeComp = new Date(time).toString("h:mm tt");
                $("#smartEventView-time").val(timeComp);
                smartEventView.updateDateString();
            });

            // Search Places for event
            $("#smartEventView-placesearch").on('input', function () {
                var placeStr =  $("#smartEventView-placesearch").val();
                if (placeStr.length > 3) {
                    $("#smartEventView-placesearchBtn").text("Find " + placeStr);
                    $("#smartEventView-placesearchdiv").removeClass('hidden');
                } else {
                    $("#smartEventView-placesearchdiv").addClass('hidden');
                }
            });

            $("#smartEventView-placesearch").kendoAutoComplete({
                dataSource: placesModel.placesDS,
                ignoreCase: true,
                dataTextField: "name",
                dataValueField: "uuid",
                change: function (e) {
                    var placeStr = $("#smartEventView-placesearch").val();

                    if (smartEventView._placeId !== null) {
                        var place = placesModel.getPlaceModel(smartEventView._placeId);

                        if (placeStr === place.name) {
                            return;
                        }
                        smartEventView._placeId = null;
                        smartEventView._activeObject.set('placeId', smartEventView._placeId);
                        smartEventView._activeObject.set('placeName',placeStr);
                        smartEventView._activeObject.set('address',placeStr);

                    }
                    // event fired on blur -- if a place wasn't selected, need to do a nearby search

                    if (placeStr.length > 3) {
                        $("#smartEventView-placesearchBtn").text("Find " + placeStr);
                        $("#smartEventView-placesearchdiv").removeClass('hidden');
                    } else {
                        $("#smartEventView-placesearchdiv").addClass('hidden');
                    }

                },
                select: function(e) {
                    // User has selected one of their places
                    var place = e.item;
                    var dataItem = this.dataItem(e.item.index());
                    smartEventView._placeId = dataItem.uuid;
                    smartEventView._activeObject.set('placeId', modalActionMeeting._placeId);
                    smartEventView._activeObject.set('placeName',dataItem.name);
                    smartEventView._activeObject.set('address',dataItem.address);



                    // Hide the Find Location button
                    $("#smartEventView-placesearchdiv").addClass('hidden');

                },
                filter: "contains",
                placeholder: "Select location... "
            });

            smartEventView._isInited = true;
        }
        smartEventView._date = new Date();


        if (actionObj === undefined || actionObj === null) {
            smartEventView.initActiveObject();
        } else {
            smartEventView.setActiveObject(actionObj);
        }

        $("#smartEventView-placesearchdiv").addClass('hidden');
        var thisObject = smartEventView._activeObject;
        if (thisObject.senderUUID === undefined || thisObject.senderUUID === null) {
            smartEventView.setSenderMode();
        } else if (thisObject.senderUUID === userModel.currentUser.userUUID) {
            smartEventView.setSenderMode();
        } else {
            smartEventView.setRecipientMode();
        }


    },

    changeStatus: function(e){
        var index = this.current().index();
        if(modalActionMeeting.response !== true){
            $("#event-comment").velocity("slideDown");
            modalActionMeeting.response = true;
        }
        if(index === 0){
            // User accepted
            $("#event-comment textarea").attr("placeholder", "Looking forward to it!");
        } else {
            // User declined
            $("#event-comment textarea").attr("placeholder", "Sorry can't make it.")
        }
    },

    onCancel: function (e) {
        //_preventDefault(e);

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

    onUpdateEvent: function (e) {
        var thisObj = modalActionMeeting._activeObject;

        modalActionMeeting.onDone();
    },

    onSaveEvent : function (e) {
        var thisObj = smartEventView._activeObject;
        if (thisObj.senderUUID === userModel.currentUser.userUUID) {
            var finalDateStr = $("#smartEventView-datestring").val();

            smartEventView._activeObject.set('date', new Date(finalDateStr));
            smartEventView.createSmartEvent(thisObj);
        }

        smartEventView.onDone();
    },

    onCancelEvent: function (e) {
        var thisObj = smartEventView._activeObject;

        smartEventView.onDone();
    },

    onDone: function (e) {
        //_preventDefault(e);

        APP.kendo.navigate('#:back');

    }

};

