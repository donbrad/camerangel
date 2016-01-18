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
    _callback : null,
    _eventList :[],
    response: false,
    userAccepted : null,

    onInit: function (e) {
        _preventDefault(e);


    },

    initActiveObject : function () {
        var thisObj = modalActionMeeting._activeObject;

        var newDate = Date.today();
        thisObj.set("uuid", uuid.v4());
        thisObj.set('senderUUID', null);
        thisObj.set('senderName', null);
        thisObj.set('channelId', null);
        thisObj.set('calendarId', null);
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
        thisObj.set('wasCancelled', false);
        thisObj.set('isModified', false);
        thisObj.set('isDeclined', false);
        thisObj.set('isAccepted', false);
        thisObj.set('addToCalendar', false);
        thisObj.set('rsvpList', []);
        thisObj.set('comment', null);
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
        thisObj.set('senderName', newObj.senderName);
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
        thisObj.set('rsvpList', newObj.rsvpList);
        thisObj.set('inviteList', newObj.inviteList);
        thisObj.set('approxTime', newObj.approxTime);
        thisObj.set('approxPlace', newObj.approxPlace);
        thisObj.set('timeFlexible', newObj.timeFlexible);
        thisObj.set('placeFlexible', newObj.placeFlexible);
        thisObj.set('isModified', newObj.isModified);
        thisObj.set('isDeleted', newObj.isDeleted);
        thisObj.set('isAccepted', newObj.isAccepted);
        thisObj.set('isDeclined', newObj.isDeclined);
        thisObj.set('wasCancelled', newObj.wasCancelled);

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
            $('#event-owner-save').addClass('hidden');
            $('#modalActionMeeting-recipientListDiv').removeClass('hidden');
            // owner of a previously created event
            if(thisEvent.isExpired){
                $('#event-owner-reschedule').removeClass('hidden');
                $('#event-owner-edit').addClass('hidden');
                $("#event-owner-cancel").addClass("hidden");

            } else {

                $('#actionMeeting-reschedule').addClass('hidden');
                $("#event-owner-cancel").removeClass("hidden");
                // show edit button in header
                $("#event-owner-edit").removeClass("hidden");
            }
        } else {
            $('#event-owner-save').removeClass('hidden');
            // new event
            modalActionMeeting.showEditMode();
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

    showEditMode: function(){
        $("#event-owner-edit").addClass("hidden");
        $("#event-editMode").removeClass("hidden");
        $("#event-viewMode").addClass("hidden");

        // Set btm action btn
        $('#event-owner-save').removeClass('hidden');
        $('#event-owner-reschedule').addClass('hidden');

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

    checkExpired : function (date) {
        var thisObject = modalActionMeeting._activeObject;

        if (moment(modalActionMeeting._date).isAfter(date)) {
            thisObject.set('isExpired', true);
            modalActionMeeting.setEventBanner("expired");

        } else {
            thisObject.set('isExpired', false);
            modalActionMeeting.setEventBanner();
        }
    },

    updateDateString : function () {
        var date = $('#modalActionMeeting-date').val();
        var time = $('#modalActionMeeting-time').val();

        var finalDateStr = date + " " + time;
        $("#modalActionMeeting-datestring").val(finalDateStr);

        modalActionMeeting._activeObject.set('date', new Date(finalDateStr));

    },

    openModal: function (actionObj, callback) {
        if (!modalActionMeeting._isInited) {

            modalActionMeeting._eventList = smartEvent.getActionNames();

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
                if (dateStr.length > 5) {
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
                format: 'ddd,  mmm, d yyyy',
                formatSubmit: 'mm d yyyy',
                min: true,
                onSet : function (context) {
                    modalActionMeeting.updateDateString();
                }
            });
            //$('#modalActionMeeting-time').pickatime();

           /* $("#modalActionMeeting-date").on('blur', function () {

            });*/



            $("#modalActionMeeting-time").on('blur', function () {
                var timeIn =  $("#modalActionMeeting-time").val();
                if (timeIn.length > 3) {

                    var time = Date.parse(timeIn);
                    var timeComp = new Date(time).toString("h:mm tt");
                    $("#modalActionMeeting-time").val(timeComp);
                    modalActionMeeting.updateDateString();
                }
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

        if (callback === undefined) {
            callback = null;
        }

        modalActionMeeting._callback = callback;

        modalActionMeeting._date = new Date();

        $("#modalActionMeeting-eventExpired").addClass('hidden');

        if (actionObj === undefined || actionObj === null) {
            modalActionMeeting.initActiveObject();

        } else {
            // we have an existing event
            modalActionMeeting.setActiveObject(actionObj);
        }
        var thisObject = modalActionMeeting._activeObject;
        // setting send/receiver

        $('#modalActionMeeting-organizer').text(thisObject.senderName);
        modalActionMeeting.checkExpired(thisObject.date);

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

        var prettyDate = moment(thisObject.date).format('dddd MMMM, Do [at] h:mmA');
        $(".event-date").text(prettyDate);



        $("#modalActionMeeting-placesearchdiv").addClass('hidden');

        if (thisObject.senderUUID === null || thisObject.senderUUID === userModel.currentUser.userUUID) {
            $("#modalActionMeeting-organizer").text("You");
        } else {
            var contact = contactModel.findContactByUUID(thisObject.senderUUID);
            if (contact !== undefined) {
                $("#modalActionMeeting-organizer").text(contact.name);
            }
        }

        modalActionMeeting.checkExpired();

        $("#modalview-actionMeeting").data("kendoMobileModalView").open();
    },

    setEventBanner: function(state){
        // Styling for event banner state
        switch(state) {
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
       // Use onDone so the modal can redirect or restore state as required...  $("#modalview-actionMeeting").data("kendoMobileModalView").close();

        modalActionMeeting._activeObject.set("wasCancelled", true);

        modalActionMeeting.setEventBanner();

        modalActionMeeting.onDone();

    },

    changeStatus: function(e){
        var index = this.current().index();
        if(modalActionMeeting.response !== true){
            $("#event-comment").velocity("slideDown");
            modalActionMeeting.response = true;
        }
        if(index === 0){
            // User accepted
            modalActionMeeting.userAccepted = true;
            $("#event-comment textarea").attr("placeholder", "Looking forward to it!");
        } else {
            // User declined
            modalActionMeeting.userAccepted = false;
            $("#event-comment textarea").attr("placeholder", "Sorry can't make it.")
        }
    },

    sendRSVP: function(e){
        _preventDefault(e);
        var thisEvent = modalActionMeeting._activeObject;
        var commentStr = $('#modalActionMeeting-comments').val();

        if (modalActionMeeting.userAccepted) {

            smartEvent.accept(thisEvent.uuid, thisEvent.senderUUID, commentStr);

            modalActionMeeting.setAcceptStatus();

            modalActionMeeting.onDone();
        }

        if (!modalActionMeeting.userAccepted) {

            smartEvent.accept(thisEvent.uuid, thisEvent.senderUUID, commentStr);

            modalActionMeeting.setAcceptStatus();

            modalActionMeeting.onDone();
        }

    },

    onAccept : function (e) {
        var thisEvent = modalActionMeeting._activeObject;

        var commentStr = $('#modalActionMeeting-comments').val();

        smartEvent.accept(thisEvent.uuid, thisEvent.senderUUID, commentStr);

        modalActionMeeting.setAcceptStatus();

        modalActionMeeting.onDone();
    },

    onDecline : function (e) {
        var thisEvent = modalActionMeeting._activeObject;

        var commentStr = $('#modalActionMeeting-comments').val();

        smartEvent.accept(thisEvent.uuid, thisEvent.senderUUID, commentStr);

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
            if (!smartEvent.isCurrentAction(thisObj.action)) {
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
        thisObject.senderName = userModel.currentUser.name;
        thisObject.channelId = thisObj.channelId;
        thisObject.calendarId = thisObj.calendarId;
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
        thisObject.wasCancelled = false;
        thisObject.isAccepted = thisObj.isAccepted;
        thisObject.isDeclined = thisObj.isDeclined;
        thisObject.rsvpList = thisObj.rsvpList;
        thisObject.inviteList = thisObj.inviteList;

        //channelView.addSmartObjectToMessage(thisObj.uuid, thisObject);

    },

    onUpdateEvent: function (e) {
        var thisObj = modalActionMeeting._activeObject;
        // todo - wire event update
        modalActionMeeting.onDone();
    },

    onSaveEvent : function (e) {
        var thisObj = modalActionMeeting._activeObject;
        
        var finalDateStr = $("#modalActionMeeting-datestring").val();
        var saveDate = new Date(finalDateStr);

        modalActionMeeting._activeObject.set('date', saveDate);


        modalActionMeeting.createSmartEvent(thisObj);

      //  smartEvent.addObject(thisObj);

        modalActionMeeting.onDone();
    },

    onCancelEvent: function (e) {
        var thisObj = modalActionMeeting._activeObject;


        modalActionMeeting.onDone();
    },

    onDone: function (e) {
        //_preventDefault(e);

        $("#modalview-actionMeeting").data("kendoMobileModalView").close();
        if (modalActionMeeting._callback !== null) {
            modalActionMeeting._callback(modalActionMeeting._activeObject);
        }
    }

};




