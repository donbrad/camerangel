/**
 * Created by donbrad on 12/31/15.
 *
 * Smart Objects UX -- one modal for each action
 * Events - smartEventView
 * Flights - smartFlightView
 * Movies - smartMovieView
 */

'use strict';


var smartEventView = {
    _activeObject : new kendo.data.ObservableObject(),
    _date : new Date(),
    _placeId :null,
    _geoObj: null,
    _isInited : false,
    _callback : null,
    _eventList :[],
    response: false,
    userAccepted : null,

    onInit: function (e) {
        _preventDefault(e);


    },

    initActiveObject : function () {
        var thisObj = smartEventView._activeObject;
        // todo - review update to make date/time more useful as defaults
        var newDate = new Date();
        var newDateHour = newDate.getHours();
        var newDateDay = newDate.getDate();

        if(newDateHour < 20 && newDate > 0){
            newDateHour += 3;
            newDate.setHours(newDateHour);
            newDate.setMinutes(0);
        } else {
            newDateDay += 1;
            newDateHour = 10;
            newDate.setDate(newDateDay);
            newDate.setHours(newDateHour);
            newDate.setMinutes(0);
        }
        thisObj.set("uuid", uuid.v4());
        thisObj.set('senderUUID', userModel.currentUser.userUUID);
        thisObj.set('senderName', userModel.currentUser.name);
        thisObj.set('channelId', null);
        thisObj.set('calendarId', null);
        thisObj.set('eventChatId', null);
        thisObj.set('title', null);
        thisObj.set('type', "meeting");
        thisObj.set('action', null);
        thisObj.set('description', null);
        thisObj.set('address', null);
        thisObj.set('placeName', null);
        thisObj.set('placeType', null);
        thisObj.set('placeId', null);
        thisObj.set('googleId', null);
        thisObj.set('calendarId', null);
        thisObj.set('lat', null);
        thisObj.set('lng', null);
        thisObj.set('date', newDate);
        thisObj.set('duration', 60);
        thisObj.set('durationString', '1 hour');
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



        $('#smartEventView-placesearch').val(thisObj.placeName);
        //$('#smartEventView-datestring').val(new Date(thisObj.date).toString('dddd, MMMM dd, yyyy h:mm tt'));
        $('#smartEventView-date').val(new Date(thisObj.date).toString('MMM dd, yyyy'));
        $('#smartEventView-time').val(new Date(thisObj.date).toString('h:mm tt'));
        $("#smartEventView-placeadddiv").addClass('hidden');
        $("#searchEventPlace-input").removeClass('hidden');
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

        if (newObj.senderName === null) {
            if (newObj.senderUUID === userModel.currentUser.userUUID) {
                newObj.senderName = userModel.currentUser.name;
            } else {
                var contact = contactModel.findContact(newObj.senderUUID);
                if (contact !== undefined) {
                    newObj.senderName = contact.name;
                }
            }
        }
        thisObj.set('senderName', newObj.senderName);
        thisObj.set('action', newObj.action);
        thisObj.set('description', newObj.description);
        thisObj.set('address', newObj.address);
        thisObj.set('placeName', newObj.placeName);
        thisObj.set('placeType', newObj.placeType);
        thisObj.set('calendarId', newObj.calendarId);
        thisObj.set('placeId', newObj.placeId);
        thisObj.set('googleId', newObj.googleId);
        thisObj.set('lat', newObj.lat);
        thisObj.set('lng', newObj.lng);
        if (newObj.date === undefined || newObj.date === null) {
            newObj.date = new Date();
        }
        thisObj.set('date', newObj.date);
        thisObj.set('duration', newObj.duration);
        thisObj.set('durationString', newObj.durationString);
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
            smartEventView.setSenderMode();
        } else {
            smartEventView.setRecipientMode();
        }


    },

    onDropPlace: function(){
        $("#smartEventView-placeadddiv").addClass("hidden");
        $("#searchEventPlace-input").removeClass("hidden");
    },


    setSenderMode: function () {
        var thisEvent = smartEventView._activeObject;

        $(".event-owner, #event-viewMode").removeClass("hidden");
        $(".event-recipient, #event-editMode").addClass("hidden");
        $("#event-owner-edit").addClass("hidden");
        if(thisEvent.wasSent){
            $('#event-owner-save').addClass('hidden');
            $('#smartEventView-recipientListDiv').removeClass('hidden');

            // show/hide place btn
            if(thisEvent.placeId === null){
                $(".event-place").addClass("hidden");
            } else {
                $(".event-place").removeClass("hidden");
            }

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
            $('#smartEventView-recipientListDiv').addClass('hidden');
            // new event
            smartEventView.showEditMode();

        }

    },

    setRecipientMode : function () {
        var thisEvent = smartEventView._activeObject;

        $(".event-owner").addClass("hidden");
        $('#smartEventView-recipientListDiv').addClass('hidden');

        $(".event-recipient, #event-viewMode").removeClass("hidden");
        // if event is expired disable rsvp
        if(thisEvent.isExpired){
            $("#event-rsvp").data("kendoMobileButtonGroup").enable(false);
            smartEventView.setEventBanner("expired");
        } else {
            $("#event-rsvp").data("kendoMobileButtonGroup").enable(true);
            // set user response
            if(thisEvent.isAccepted){
                $("#event-rsvp").data("kendoMobileButtonGroup").select(0);
                smartEventView.setEventBanner("accepted");
            } else if(thisEvent.isDeclined){
                $("#event-rsvp").data("kendoMobileButtonGroup").select(1);
                smartEventView.setEventBanner("declined");
            } else {
                smartEventView.setEventBanner("pending");
            }
        }
        // show/hide place btn
        if(thisEvent.placeId === null){
            $(".event-place").addClass("hidden");
        } else {
            $(".event-place").removeClass("hidden");
        }

        smartEventView.setAcceptStatus();
    },

    showEditMode: function(){
        $("#event-owner-edit").addClass("hidden");
        $("#event-editMode").removeClass("hidden");
        $("#event-viewMode").addClass("hidden");

        // Set btm action btn
        $('#event-owner-save').removeClass('hidden');
        $('#event-owner-reschedule').addClass('hidden');

        // set event times
        var thisEvent = smartEventView._activeObject;
        $('#smartEventView-placesearch').val('');

        //$('#smartEventView-datestring').val(new Date(thisEvent.date).toString("MMM dd, yyyy h:mm tt"));
        $('#smartEventView-date').val(new Date(thisEvent.date).toString("MMM dd, yyyy"));
        $('#smartEventView-time').val(new Date(thisEvent.date).toString("h:mm tt"));
    },



    setAcceptStatus : function () {
        var thisEvent = smartEventView._activeObject;

        if (thisEvent.isAccepted) {
            $('#actionMeeting-acceptStatus').text("You've accepted this event");
        } else if (thisEvent.isDeclined) {
            $('#actionMeeting-acceptStatus').text("You've declined this event");
        } else {
            $('#actionMeeting-acceptStatus').text("Please accept or decline this event");

        }
    },

    onShow: function(e) {
        _preventDefault(e);
        smartEventView._placeId = null;
        smartEventView._geoObj = null;

        $("#smartEventView-placesearchBtn").text("");
        $("#smartEventView-placesearch").val("");
        //$("#smartEventView-datestring").val("");
        $("#smartEventView-date").val("");
        $("#smartEventView-time").val("");
        $('#smartEventView-comments').val("");

        $("#smartEventView-placeadddiv").addClass('hidden');
        $("#searchEventPlace-input").removeClass('hidden');
    },


    onAddPlace: function (e) {
        _preventDefault(e);

        placesModel.addPlace(smartEventView._geoObj, false, function () {
            mobileNotify("Adding place : " + smartEventView._geoObj.name);
        });

        $("#smartEventView-placeadddiv").addClass('hidden');
    },

    onPlaceSearch : function (e) {

        _preventDefault(e);

        var placeStr =  $("#smartEventView-placesearch").val();

           smartEventPlacesView.openModal(placeStr, function (geo) {
               if (geo === null) {
                   mobileNotify("Smart Place Search cancelled...");
                   return;
               }

               var thisObj = smartEventView._activeObject;

               thisObj.set('placeId', null);
               thisObj.set('googleId', geo.googleId);
               thisObj.set('placeName', geo.name);
               thisObj.set('address', geo.address);
               thisObj.set('placeType', geo.type);
               thisObj.set('lat', geo.lat);
               thisObj.set('lng', geo.lng);

               var addressArray = geo.address.split(','), address = addressArray[0];
               // Place addresses are just the Street Number and Street;
               geo.address = address;
               smartEventView._geoObj = geo;

               //
               $("#smartEventView-placesearch").val(geo.name);
               // hide place search btn
               $("#smartEventView-placesearchdiv").addClass('hidden');
               // show selected place
               $("#smartEventView-placeadddiv").removeClass('hidden');
               // hide input
               $("#searchEventPlace-input").addClass("hidden");
           });

    },

    checkExpired : function (date) {
        var thisObject = smartEventView._activeObject;

        if (moment(smartEventView._date).isAfter(date)) {
            thisObject.set('isExpired', true);
            smartEventView.setEventBanner("expired");

        } else {
            thisObject.set('isExpired', false);
            //smartEventView.setEventBanner();
        }
    },

    updateCalendar : function () {
        var thisObject = smartEventView._activeObject;

        if (thisObject.calendarId === null) {
            $("#smartEventView-view-calendar-add").removeClass('hidden');
            $("#smartEventView-view-calendar").addClass('hidden');
        } else {
            $("#smartEventView-view-calendar").removeClass('hidden');
            $("#smartEventView-view-calendar-add").addClass('hidden');
        }
    },

    updateDateString : function () {
        var date = $('#smartEventView-date').val();
        var time = $('#smartEventView-time').val();

        var finalDateStr = date + " " + time;
        //$("#smartEventView-datestring").val(finalDateStr);

        smartEventView._activeObject.set('date', new Date(finalDateStr));

    },

    validDateTime : function () {
        var timeIn =  $("#smartEventView-time").val(), dateIn = $("#smartEventView-time").val();

        if (timeIn === null || dateIn === null) {
            return (false);
        }
        var time = Date.parse(timeIn);

        var date = Date.parse(dateIn);

        if (time === null && date === null) {
            mobileNotify("Please enter a valid Date and Time");
            return(false);
        } else if (time === null) {
            mobileNotify("Please enter a valid Time");
        } else if (date === null) {
            mobileNotify("Please enter a valid Date");
        } else {
            var timeComp = new Date(time).toString("h:mm tt");
            var dateCome = new Date(date).toString('MMM dd, yyyy');
            smartEventView.updateDateString();
            return (true);
        }
    },

    openModal: function (actionObj, callback) {
        if (!smartEventView._isInited) {

            smartEventView._eventList = smartEvent.getActionNames();

            $("#smartEventView-title").kendoAutoComplete({
                dataSource: smartEventView._eventList,
                ignoreCase: true,
                change: function (e) {
                    var eventStr =  $("#smartEventView-title").val();
                    smartEventView._activeObject.set('title', eventStr);

                },
                select: function(e) {
                    var event = e.item;
                    var actionStr = e.item[0].textContent;
                    smartEventView._activeObject.set('action', actionStr);

                    // Use the selected item or its text
                },
                filter: "contains",
                placeholder: "Event title"
            });


            $('#smartEventView-date').pickadate({
                format: 'mmm, d yyyy',
                formatSubmit: 'mm d yyyy',
                min: true,
                onSet : function (context) {
                    smartEventView.updateDateString();
                }
            });
            //$('#smartEventView-time').pickatime();

           /* $("#smartEventView-date").on('blur', function () {

            });*/

            $("#smartEventView-duration").on('blur', function () {
                var durIn =  $("#smartEventView-duration").val();
                var duration = -1;
                if (durIn.length > 1) {
                    duration = juration.parse(durIn,{ defaultUnit: 'minutes' });
                    if (duration > 60) {
                        duration = duration / 60;
                        smartEventView._activeObject.duration = duration;
                        var durationStr = juration.stringify(duration * 60, { format: 'long' });
                        smartEventView._activeObject.durationString = durationStr;
                        $("#smartEventView-duration").val(durationStr);

                    }


                }
            });

            $("#smartEventView-time").on('blur', function () {
                var timeIn =  $("#smartEventView-time").val();
                if (timeIn.length > 2) {

                    var time = Date.parse(timeIn);
                    var timeComp = new Date(time).toString("h:mm tt");
                    $("#smartEventView-time").val(timeComp);
                    smartEventView.updateDateString();
                }
            });

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
                        smartEventView._activeObject.set('address', null);
                        smartEventView._activeObject.set('lat',null);
                        smartEventView._activeObject.set('lng',null);

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
                    smartEventView._activeObject.set('placeId', smartEventView._placeId);
                    smartEventView._activeObject.set('placeName',dataItem.name);
                    smartEventView._activeObject.set('address',dataItem.address +  ' ' + dataItem.city + ', ' + dataItem.state);
                    smartEventView._activeObject.set('lat',dataItem.lat);
                    smartEventView._activeObject.set('lng',dataItem.lng);


                    // Hide the Find Location button
                    $("#smartEventView-placesearchdiv").addClass('hidden');

                },
                filter: "contains",
                placeholder: "Select location... "
            });

            smartEventView._isInited = true;
        }

        if (callback === undefined) {
            callback = null;
        }

        smartEventView._callback = callback;

        smartEventView._date = new Date();

        $("#smartEventView-eventExpired").addClass('hidden');

        if (actionObj === undefined || actionObj === null) {
            smartEventView.initActiveObject();

        } else {
            // we have an existing event
            smartEventView.setActiveObject(actionObj);
        }
        var thisObject = smartEventView._activeObject;
        // setting send/receiver

        $('#smartEventView-organizer').text(thisObject.senderName);
        smartEventView.checkExpired(thisObject.date);

        if (thisObject.senderUUID === userModel.currentUser.userUUID) {
                smartEventView.setSenderMode();
        } else {
                smartEventView.setRecipientMode();

        }

            // setting event location
        if(thisObject.placeName !== null){
            $(".event-location").removeClass("hidden");
        } else {
            $(".event-location").addClass("hidden");
        }

        smartEventView.updateCalendar();

        var prettyDate = moment(thisObject.date).format('dddd MMMM, Do [at] h:mmA');
        $(".event-date").text(prettyDate);


        $("#smartEventView-placesearchdiv").addClass('hidden');

        if (thisObject.senderUUID === null || thisObject.senderUUID === userModel.currentUser.userUUID) {
            $("#smartEventView-organizer").text("You");
        } else {
            var contact = contactModel.findContactByUUID(thisObject.senderUUID);
            if (contact !== undefined) {
                $("#smartEventView-organizer").text(contact.name);
            }
        }

        smartEventView.checkExpired();
        $("#smartEventModal").data("kendoMobileModalView").open();
    },

    setEventBanner: function(state){
        // Styling for event banner state
        switch(state) {
            case "expired":
                $("#eventBanner").removeClass("hidden, eventPending, eventAccepted, eventDeclined").addClass("eventExpired");
                $(".eventBannerTitle").text("Event expired");
                $(".eventBannerImg").attr("src", "images/smart-time-light.svg");

                break;
            case "pending":
                $("#eventBanner").removeClass("hidden, eventAccepted, eventDeclined, eventExpired").addClass("eventPending");
                $(".eventBannerTitle").text("Awaiting your response");
                $(".eventBannerImg").attr("src", "images/icon-question.svg");

                break;
            case "accepted":
                $("#eventBanner").removeClass("hidden, eventDeclined, eventExpired, eventPending").addClass("eventAccepted");
                $(".eventBannerTitle").text("Accepted!");
                //$(".eventBannerImg").attr("src", "images/icon");

                break;
            case "declined":
                $("#eventBanner").removeClass("hidden, eventAccepted, eventExpired, eventPending").addClass("eventDeclined");
                $(".eventBannerTitle").text("Declined");

                break;
        }

    },

    onChangeCalendar: function(e){

        if(e.checked){
            $("#smartEventView-durationBox").removeClass("hidden");
        } else {
            $("#smartEventView-durationBox").addClass("hidden");
        }
    },

    eventMapLocation: function(e){
        _preventDefault(e);

        var event =  smartEventView._activeObject;

        if (event.placeId !== null) {
            var place = placesModel.getPlaceModel(event.placeId);
            if (place !== undefined) {

                var placeId = packParameter(event.placeId), channelUrl = packParameter('channel?channelId='+channelView._channelId);
                APP.kendo.navigate('#placeView?place=' + placeId + '&returnview=' + channelUrl);

            }

        } else {

            if (window.navigator.simulator === undefined) {
                if (event.lat !== null) {
                    launchnavigator.navigate(
                        [event.lat,event.lng],
                        null,
                        function(){
                            mobileNotify("Launching Navigation...");
                        },
                        function(error){
                            mobileNotify("Plugin error: "+ error);
                        });
                } else if (event.address !== null) {
                    launchnavigator.navigate(
                        event.address,
                        null,
                        function(){
                           mobileNotify("Launching Navigation...");
                        },
                        function(error){
                            mobileNotify("Plugin error: "+ error);
                        });
                }
            } else {
                mobileNotify("Navigation not yet supported in emulator...");
            }
        }

    },

    onCancelEvent: function (e) {
        _preventDefault(e);
        $(".event-owner, .event-recipient, #event-editMode, #event-viewMode").addClass("hidden");
       // Use onDone so the modal can redirect or restore state as required...  $("#smartEventModal").data("kendoMobileModalView").close();

        smartEventView._activeObject.set("wasCancelled", true);

        //smartEventView.setEventBanner();

        smartEventView.onDone();

    },

    changeStatus: function(e){
        var index = this.current().index();
        if(smartEventView.response !== true){
            $("#event-comment").velocity("slideDown");
            smartEventView.response = true;
        }
        if(index === 0){
            // User accepted
            smartEventView.userAccepted = true;
            $("#event-comment textarea").attr("placeholder", "Looking forward to it!");
        } else {
            // User declined
            smartEventView.userAccepted = false;
            $("#event-comment textarea").attr("placeholder", "Sorry can't make it.")
        }
    },

    sendRSVP: function(e){
        _preventDefault(e);

        if (smartEventView.userAccepted) {
            smartEventView.onAccept();
        }

        if (!smartEventView.userAccepted) {
            smartEventView.onDecline();
        }

    },

    onAccept : function (e) {
        var thisEvent = smartEventView._activeObject;

        var commentStr = $('#smartEventView-comments').text();
        if (commentStr === null || commentStr.length === 0) {
            commentStr = "Looking forward to it!"
        }

        smartEvent.smartAddObject(thisEvent, function (event) {

            mobileNotify("Graciously accepting " + event.title);

            smartEvent.accept(event.uuid, event.senderUUID, commentStr);

            smartEventView.setAcceptStatus();

        });

    },

    onDecline : function (e) {
        var thisEvent = smartEventView._activeObject;

        var commentStr = $('#smartEventView-comments').text();
        if (commentStr === null || commentStr.length === 0) {
            commentStr = "Sorry can't make it!"
        }


        smartEvent.smartAddObject(thisEvent, function (event) {

            mobileNotify("Respectfully declining " + event.title);

            smartEvent.decline(event.uuid, event.senderUUID, commentStr);

            smartEventView.setAcceptStatus();

        });
    },

    doEventChat : function (e) {
        _preventDefault(e);
        mobileNotify("Create Event Chat under development...");
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
        thisObject.duration = thisObj.duration;
        thisObject.durationString = thisObj.durationString;
        thisObject.placeId = thisObj.placeId;
        thisObject.googleId = thisObj.googleId;
        thisObject.placeName = thisObj.placeName;
        thisObject.address = thisObj.address;
        thisObject.senderUUID = userModel.currentUser.userUUID;
        thisObject.senderName = userModel.currentUser.name;
        thisObject.channelId = thisObj.channelId;
        thisObject.calendarId = thisObj.calendarId;
        thisObject.eventChatId = thisObj.eventChatId;
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

        smartEvent.addObject(thisObject);


    },

    addToCalendar : function (e) {
        _preventDefault(e);

        var thisObj = smartEventView._activeObject;
        var startDate = new Date(thisObj.date), endDate = new Date(moment(thisObj.date).add(thisObj.duration, 'minutes'));


        if (window.navigator.simulator !== undefined) {
            mobileNotify("Not supported in emulator");
        } else {
            window.plugins.calendar.createEvent(thisObj.title,
                thisObj.placeName + " " + thisObj.address,
                thisObj.description,
                startDate,
                endDate,
                function (message) {
                    thisObj.set('calendarId', message);
                    $('#smartEventView-view-calendar-add').addClass('hidden');
                    $('#smartEventView-view-calendar').removeClass('hidden');
                },
                function (message) {
                    mobileNotify('Calendar error :' + message);
                });
        }

    },

    showCalendar : function (e) {

        var thisObj = smartEventView._activeObject;
        var startDate = new Date(thisObj.date);
        if (window.navigator.simulator !== undefined) {
            mobileNotify("Not supported in emulator");
        } else {
            window.plugins.calendar.openCalendar(
                startDate,
                function (message) {

                },
                function (message) {
                    mobileNotify('Calendar error :' + message);
                });
        }
    },

    onUpdateEvent: function (e) {
        var thisObj = smartEventView._activeObject;

        // todo - wire event update
        smartEventView.onDone();
    },



    onSaveEvent : function (e) {

        if (!smartEventView.validDateTime()) {
            return;
        }

        var thisObj = smartEventView._activeObject;

        var title = smartEventView._activeObject.title;
        if (title === null || title.length < 3) {
            mobileNotify ('Events must have a valid title!');
            return;
        }

        //var finalDateStr = $("#smartEventView-datestring").val();
        var meetingDate = $("#smartEventView-date").val();
        var meetingTime = $("#smartEventView-time").val();
        var finalDateStr = meetingDate + " " + meetingTime;

        var saveDate = new Date(finalDateStr);

        if (saveDate === null) {
            mobileNotify (finalDateStr + " is not a valid date!");
            return;
        }

        thisObj.set('date', saveDate);
        thisObj.set('senderName', userModel.currentUser.name);

         if (thisObj.addToCalendar && thisObj.calendarId === null) {
            smartEventView.addToCalendar();
         }

         smartEventView.createSmartEvent(thisObj);

         smartEventView.onDone();
    },


    onCancel : function (e) {
        _preventDefault(e);
        $("#smartEventModal").data("kendoMobileModalView").close();
        $("#eventBanner").removeClass();
    },

    onDone: function (e) {
        //_preventDefault(e);

        $("#smartEventModal").data("kendoMobileModalView").close();
        if (smartEventView._callback !== null) {
            smartEventView._callback(smartEventView._activeObject);
        }
    }

};

var smartNoteView = {
    _activeObject : new kendo.data.ObservableObject(),
    _date : new Date(),
    _expirationDate : null,
    _isInited : false,
    _callback : null,
    _redactorActive : false,

    onInit: function (e) {
        _preventDefault(e);
    },

    findTag: function (tag) {
        return(smartNoteView.query({ field: "tagname", operator: "eq", value: tag }));
    },

    queryTag : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = contactModel.contactTagsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var contact = view[0];

        dataSource.filter(cacheFilter);

        return(contact);
    },

    openModal: function (actionObj, callback) {
        if (!smartNoteView._isInited) {
            smartNoteView._isInited = true;
            $("#smartNoteView-tags").kendoMultiSelect({
                autoClose: false,
                dataTextField: "tagname",
                dataValueField: "uuid",
                itemTemplate: $("#smartNoteView-itemtmpl").html() ,
                tagTemplate: $("#smartNoteView-tagtmpl").html(),
                change: function (e) {
                    var value = this.value();

                },
                select : function (e) {
                    var item = e.item;
                    var text = item.text();
                },
                dataSource: contactModel.contactTagsDS
            });

        }

        smartNoteView._redactorActive = true;
        $('#smartNoteView-content').redactor({
            minHeight: 240,
            maxHeight: 420,
            focus: true,
            placeholder: 'Note ...',
            /* callbacks: {
             focus: function(e)
             {
             $('#messageTextArea').focus();
             }
             },*/
            buttons: [ 'bold', 'italic', 'lists', 'horizontalrule'],
            toolbarExternal: '#smartNoteView-contentToolbar'
        });


        if (actionObj === null) {
            smartNoteView._activeObject.set('title', '');
            smartNoteView._activeObject.set('tagString', '');
            smartNoteView._activeObject.set('tags', []);
            smartNoteView._activeObject.set('content', '');
            smartNoteView._activeObject.set('expiration', '30');
        } else {
            smartNoteView._activeObject.set('objectType', actionObj.objectType);
            smartNoteView._activeObject.set('uuid', actionObj.uuid);
            smartNoteView._activeObject.set('title', actionObj.title);
            smartNoteView._activeObject.set('tagString', actionObj.tagString);
            smartNoteView._activeObject.set('tags', actionObj.tags);
            smartNoteView._activeObject.set('content', actionObj.content);
            $('#smartNoteView-content').redactor('code.set', actionObj.content);
            smartNoteView._activeObject.set('expiration', actionObj.expiration);
        }


        if (callback === undefined) {
            callback = null;
        }

        smartNoteView._callback = callback;

        $("#smartNoteModal").data("kendoMobileModalView").open();

    },

    onSave : function (e) {
        _preventDefault(e);
        var exp = Number(smartNoteView._activeObject.get('expiration'));

        var text = $('#smartNoteView-content').redactor('code.get');
        var tags =  smartNoteView._activeObject.get('tags');
        var expDate = ggAddDays(new Date(), exp);

        var tagString = tagModel.createTagString(tags);
        smartNoteView._activeObject.set('tagString', tagString);
        smartNoteView._activeObject.set('content', text);
        smartNoteView._activeObject.set('expirationDate', expDate);


        if (smartNoteView._callback !== null) {
            smartNoteView._callback(smartNoteView._activeObject);
        }

        smartNoteView.onDone();

    },

    onCancel : function (e) {
        _preventDefault(e);

       // $("#smartNoteModal").data("kendoMobileModalView").close();
        $("#eventBanner").removeClass();

        smartNoteView.onDone();
    },

    onDone: function (e) {
        //_preventDefault(e);

        if (smartNoteView._redactorActive) {
            $('#smartNoteView-content').redactor('core.destroy');
            smartNoteView._redactorActive = false;

        }

        $("#smartNoteModal").data("kendoMobileModalView").close();

    }
};

var smartFlightView = {

};

var smartMovieView = {

};



