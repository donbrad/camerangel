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
    _placeUUID :null,
    _geoObj: null,
    _isInited : false,
    _callback : null,
    _eventList :[],
    response: false,
    userAccepted : null,

    onInit: function (e) {
       // _preventDefault(e);


    },

    initActiveObject : function () {
        var thisObj = smartEventView._activeObject;
        var newDate = ux.setDefaultTime(false, 3);

        thisObj.set("uuid", uuid.v4());
        thisObj.set("ggType", smartEvent._ggClass);
        thisObj.set('senderUUID', userModel._user.userUUID);
        thisObj.set('senderName', userModel._user.name);
        thisObj.set('channelUUID', null);
        thisObj.set('calendarId', null);
        thisObj.set('eventChatId', null);
        thisObj.set('title', null);
        thisObj.set('type', "meeting");
        thisObj.set('action', null);
        thisObj.set('description', null);
        thisObj.set('address', null);
        thisObj.set('placeName', null);
        thisObj.set('placeType', null);
        thisObj.set('placeUUID', null);
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
        thisObj.set('channelUUID', newObj.channelUUID);
        thisObj.set('eventChatId', newObj.eventChatId);
        thisObj.set('title', newObj.title);
        thisObj.set('type', newObj.type);
        thisObj.set('uuid', newObj.uuid);
        thisObj.set('senderUUID', newObj.senderUUID);

        if (newObj.senderName === null) {
            if (newObj.senderUUID === userModel._user.userUUID) {
                newObj.senderName = userModel._user.name;
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
        thisObj.set('placeUUID', newObj.placeUUID);
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

        if (newObj.senderUUID === null || newObj.senderUUID === userModel._user.userUUID) {
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
            if(thisEvent.placeUUID === null){
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
        if(thisEvent.placeUUID === null){
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
        $(".eventBanner").addClass("hidden");
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
       // _preventDefault(e);
        smartEventView._placeUUID = null;
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

           smartEventPlacesView.openModal(placeStr, null, function (geo) {
               if (geo === null) {
                   mobileNotify("Smart Place Search cancelled...");
                   return;
               }

               var thisObj = smartEventView._activeObject;

               thisObj.set('placeUUID', null);
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
            smartEventView.setEventBanner();
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

    getDefaultTime : function () {
        
        // Get the new whole hour...
        var d = new Date();
        d.setMinutes (d.getMinutes() + 30);
        d.setMinutes (0);

        var timeStr = moment(d).format('h:mm a');
        
        return(timeStr);
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
        ux.hideKeyboard();

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

                    if (smartEventView._placeUUID !== null) {
                        var place = placesModel.getPlaceModel(smartEventView._placeUUID);

                        if (placeStr === place.name) {
                            return;
                        }
                        smartEventView._placeUUID = null;
                        smartEventView._activeObject.set('placeUUID', smartEventView._placeUUID);
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
                    smartEventView._placeUUID = dataItem.uuid;
                    smartEventView._activeObject.set('placeUUID', smartEventView._placeUUID);
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

        $('#smartEventView-time').val(smartEventView.getDefaultTime());
        
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

        //$('#smartEventView-organizer').text(thisObject.senderName);
        smartEventView.checkExpired(thisObject.date);

        if (thisObject.senderUUID === userModel._user.userUUID) {
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



        smartEventView.checkExpired();
        $("#smartEventModal").data("kendoMobileModalView").open();
    },

    setEventBanner: function(state, params){
        // Styling for event banner state
        switch(state) {
            case "expired":
                $(".eventBanner").removeClass("hidden");
                $(".eventBanner > div").removeClass().addClass("eventExpired");
                $(".eventBannerTitle").text("Event expired");
                $(".eventBannerImg").attr("src", "images/smart-time-light.svg");

                break;
            case "pending":
                $(".eventBanner").removeClass("hidden");
                $(".eventBanner > div").removeClass("hidden, eventAccepted, eventDeclined, eventExpired").addClass("eventPending");
                $(".eventBannerTitle").text("Awaiting your response");
                $(".eventBannerImg").removeClass("hidden").attr("src", "images/icon-question.svg");

                break;
            case "accepted":
                $(".eventBanner").removeClass("hidden");
                $(".eventBanner > div").removeClass("hidden, eventDeclined, eventExpired, eventPending").addClass("eventAccepted");
                $(".eventBannerTitle").text("Accepted!");
                //$(".eventBannerImg").attr("src", "images/icon");

                break;
            case "declined":
                $(".eventBanner").removeClass("hidden");
                $(".eventBanner > div").removeClass("hidden, eventAccepted, eventExpired, eventPending").addClass("eventDeclined");
                $(".eventBannerTitle").text("Declined");

                break;
            case "organizer":
                $(".eventBanner").removeClass("hidden");
                $(".eventBanner > div").removeClass().addClass("eventOrganizer");
                $(".eventBannerTitle").text("Event organized by " + params);
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

        if (event.placeUUID !== null) {
            var place = placesModel.getPlaceModel(event.placeUUID);
            if (place !== undefined) {

                var placeUUID = packParameter(event.placeUUID), channelUrl = packParameter('channel?channelUUID='+channelView._channelUUID);
                APP.kendo.navigate('#placeView?place=' + placeUUID + '&returnview=' + channelUrl);

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

        smartEvent.smartAddEvent(thisEvent, function (event) {

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


        smartEvent.smartAddEvent(thisEvent, function (event) {

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
        thisObject.placeUUID = thisObj.placeUUID;
        thisObject.googleId = thisObj.googleId;
        thisObject.placeName = thisObj.placeName;
        thisObject.address = thisObj.address;
        thisObject.senderUUID = userModel._user.userUUID;
        thisObject.senderName = userModel._user.name;
        thisObject.channelUUID = channelView._channelUUID;
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

        smartEvent.addEvent(thisObject);


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
        thisObj.set('senderName', userModel._user.name);

         if (thisObj.addToCalendar && thisObj.calendarId === null) {
            smartEventView.addToCalendar();
         }

         smartEventView.createSmartEvent(thisObj);

         smartEventView.onDone();
    },


    onCancel : function (e) {
        _preventDefault(e);
        $("#smartEventModal").data("kendoMobileModalView").close();
        ux.bannerReset();
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
       // _preventDefault(e);
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
        ux.hideKeyboard();

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

var movieListView = {
    activeObject : new kendo.data.ObservableObject(),

    moviesDS :  new kendo.data.DataSource({
        //group: { field: "theatreString" }
        sort: { field: "movieTitle", dir: "asc" }
    }),


    posterArray : [],
    movieArray : [],
    _radius: 15,
    _movieQuery: null,
    _lat: null,
    _lng: null,
    _date : new Date(),
    _dateString: 'Today',
    _minTime : null,
    _maxTime: null,
    callback: null,

    initActiveObject: function () {
        var obj = movieListView.activeObject;

        obj.set('query', null);
        obj.set('date', movieListView._date);
        obj.set('dateString', movieListView._dateString);
        obj.set('lat', mapModel.lat);
        obj.set('lng', mapModel.lng);
        obj.set('allDay', true);
        obj.set('radius', movieListView._radius);
        obj.set('placeUUID', null);
        obj.set('googleId', null);
        obj.set('placeName', null);
        obj.set('address', mapModel.currentCity);
        obj.set('placeType', null);

    },

    setActiveObject: function (activeObj) {
        var obj = movieListView.activeObject;

        var dateStr = new moment(activeObj.date).format("ddd, MMM Do");
        obj.set('query', activeObj.query);
        obj.set('date', activeObj.date);
        obj.set('dateString', dateStr);
        obj.set('lat', activeObj.lat);
        obj.set('lng', activeObj.lng);
        obj.set('allDay', activeObj.allDay);
        obj.set('radius', activeObj.radius);
        obj.set('address', activeObj.address);
        obj.set('placeUUID',  activeObj.placeUUID);
        obj.set('googleId',  activeObj.googleId);
        obj.set('placeName',  activeObj.placeName);
        obj.set('placeType',  activeObj.placeType);

    },

    onInit: function (e) {
        //_preventDefault(e);

        $("#movieListView-query").kendoAutoComplete({
            dataSource: movieListView.moviesDS,
            dataTextField: "movieTitle",
            ignoreCase: true,
            select: function(e) {
                var movieName = e.item[0].textContent;
                var offset = e.item[0].attributes['data-offset-index'].value;
                if (offset !== undefined) {
                    offset = Number(offset);
                }
                var movie = movieListView.moviesDS.at(offset);

                // Call movie detail view with this movie...
            },
            change: function (e) {
               var  query = $("#movieListView-query").val();
                var ds = movieListView.moviesDS;
                if (query.length === 0) {
                    ds.filter([]);
                } else {
                    ds.filter([ {
                        "field":"movieTitle",
                        "operator":"contains",
                        "value":query}]);
                }
            },
            filter: "contains",
            placeholder: "Movie title..."
        });

        $("#movieListView-listview").kendoMobileListView({
                dataSource: movieListView.moviesDS,
                template: $("#movieListTemplate").html(),
                //headerTemplate: $("#findPlacesHeaderTemplate").html(),
                //fixedHeaders: true,
                click: function (e) {
                    var movie = e.dataItem;
                    var activeObj = movieListView.activeObject;

                    movie.date = activeObj.date;
                    movie.dateString = moment(movie.date).format('dddd, MMMM Do');
                    mobileNotify("Getting latest info for " + movie.movieTitle);
                    smartMovieView._getMovieDetails(movie.movieTitle, function (movieIn){

                        if (movieIn !== null) {
                            movie.runtime = movieIn.runtime;
                            movie.rating = movieIn.rating;
                            movie.imdbId = movieIn.imdbId;
                            movie.imdbRating = movieIn.imdbRating;
                            movie.imdbVotes = movieIn.imdbVotes;
                            movie.awards = movieIn.awards;
                            movie.metaScore = movieIn.metaScore;
                        }

                        smartMovieView.openModalSelectShowtime(movie, movieListView.callback);
                        movieListView.onDone();
                    });


                }
            }
        );

   },

    onShowMovieList: function (e) {
      //  _preventDefault(e);
        ux.hideKeyboard();
        $('#movieListView').removeClass('hidden');
        $('#movieDetailView').addClass('hidden')
    },

    onShow: function (e) {
       // _preventDefault(e);
        movieListView.moviesDS.data([]);
        movieListView.showtimesDS.data([]);

        $('#movieListView').removeClass('hidden');
        $('#movieDetailView').addClass('hidden');
        $('#movieListView-doneBtn').addClass('hidden');

    },

    _findMovies :function  () {
        var activeObj = movieListView.activeObject;
        var lat = activeObj.lat, lng = activeObj.lng, date = activeObj.date;

        movieListView.moviesDS.data([]);

        movieListView.movieArray = [];
        var dateStr = moment(date).format('YYYY-MM-DD');
        var url = 'http://data.tmsapi.com/v1.1/movies/showings?startDate='+ dateStr +'&lat=' + lat + '&lng=' + lng + '&radius=' + movieListView._radius + '&api_key=9zah4ggnfz9zpautmrx4bh32';
        $.ajax({
            url: url,
            // dataType:"jsonp",
            //  contentType: 'application/json',
            success: function(results, textStatus, jqXHR) {
                var movie = null, movieArray = [];

                for (var i=0; i< results.length; i++) {
                    var movieObj = {};
                    movie = results[i];
                    if (movie.entityType === 'Movie') {
                        movieObj.movieTitle = movie.title.replace('No. ', ''); // Todo: add movie title normalization
                        movieObj.rating = '';
                        if (movie.ratings !== undefined && movie.ratings.length > 0)
                            movieObj.rating = movie.ratings[0].code;
                        movieObj.description = movie.shortDescription;
                        movieObj.genre = '';
                        if (movie.genres !== undefined && movie.genres.length > 0)
                            movieObj.genre = movie.genres[0];

                        var imageUrl = '';
                        if (movie.preferredImage.category !== undefined && movie.preferredImage.category === 'Poster Art') {
                            imageUrl = 'http://developer.tmsimg.com/movies/' + movie.preferredImage.uri +'?api_key=9zah4ggnfz9zpautmrx4bh32';
                         } else {
                             imageUrl = 'http://developer.tmsimg.com/' + movie.preferredImage.uri +'?api_key=9zah4ggnfz9zpautmrx4bh32';
                         }
                        movieObj.imageUrl = imageUrl;
                        movieObj.officialUrl = movie.officialUrl;
                        movieObj.tmsId = movie.tmsId;
                        movieObj.imdbId = null;
                        movieObj.imdbRating = null;
                        movieObj.imdbVotes = null;
                        movieObj.metaScore = null;
                        movieObj.runtime = movieListView.processRuntime(movie.runTime);
                        movieObj.showtimes = movie.showtimes;
                        //movieObj.showTimes = movieListView.processShowTimes(movie.showtimes);

                        /* for (var s=0; s<movie.showtimes.length; s++) {

                         var showtimeObj = {};
                         var showtime = movie.showtimes[0];

                         showtimeObj.movieTitle = movieObj.movieTitle;
                         showtimeObj.movieId = movieObj.tmsId;
                         showtimeObj.theatreName = showtime.theatre.name;
                         showtimeObj.theatreId = showtime.theatre.id;
                         showtimeObj.date = moment(showtime.dateTime);
                         showtimeObj.dateStr = moment(showtime.dateTime).format('h:mm A');

                         if (allDay === false) {
                         if (showtimeObj.date >= movieListView._minTime && showtimeObj.date <= movieListView._maxTime)
                         movieListView.showtimesDS.add(showtimeObj);
                         } else {
                         movieListView.showtimesDS.add(showtimeObj);
                         }

                         }
                         */
                        movieListView.movieArray.push(movieObj);
                    }

                }

                movieListView.processMoviePosters();
                /* movieListView.moviesDS.data(movieArray);
                 movieListView.moviesDS.sync();
                 $("#movieListView-searchbox").removeClass('hidden');*/
            }
        });
    },

    openModal : function (obj,  callback) {
        ux.hideKeyboard();

        if (obj === null) {
            movieListView.initActiveObject();
        } else {
            movieListView.setActiveObject(obj);
        }

        var activeObj = movieListView.activeObject;

        $("#movieListView-searchbox").addClass('hidden');

        if (callback !== undefined) {
            movieListView.callback = callback;
        } else {
            movieListView.callback = null;
        }

        var date = activeObj.date;
        movieListView._minTime = moment(date).subtract(2, 'hours');
        movieListView._maxTime = moment(date).add(2, 'hours');

        movieListView._findMovies();

        $("#movieListModal").data("kendoMobileModalView").open();

    },

    processRuntime : function (runtime) {
        var runTimeStr = null;
        if (runtime === undefined || runtime === null) {
            runTimeStr = " ?? min";
        } else {
            runTimeStr = runtime.replace('PT0', '');
            runTimeStr = runtime.replace('PT', '');
            runTimeStr = runTimeStr.replace('H', ' hr ');
            runTimeStr = runTimeStr.replace('M', ' min');
        }
        return(runTimeStr);

    },

    finalizeMovieList : function () {
        var movieArray = movieListView.movieArray;

        for (var i=0; i< movieArray.length; i++) {
            var movie = movieArray[i];
            var poster = movieListView.posterArray[movie.tmsId];

            if (poster !== undefined && poster !== null) {

                movie.imageUrl = poster.imageUrl;
                movie.runtime = poster.runtime;
                movie.awards = poster.awards;
                movie.genre = poster.genre;
                movie.metaScore = poster.metaScore;
                movie.rating = poster.rating;
                movie.imdbId = poster.imdbId;
                movie.imdbUrl = poster.imdbUrl;
                movie.imdbRating = poster.imdbRating;
                movie.imdbVotes = poster.imdbVotes;
            }

        }
        movieListView.moviesDS.data(movieArray);
        movieListView.moviesDS.sync();
        $("#movieListView-searchbox").removeClass('hidden');
    },

    finalizeMoviePosters : function () {
        var movieArray = movieListView.movieArray;

        for (var i=0; i< movieArray.length; i++) {
            var movie = movieArray[i];
            var poster = movieListView.posterArray[movie.tmsId];

            if (poster !== undefined && poster !== null) {

                movie.imageUrl = poster.imageUrl;

            }

        }
        movieListView.moviesDS.data(movieArray);
        movieListView.moviesDS.sync();
        $("#movieListView-searchbox").removeClass('hidden');
    },

    _findPoster : function (movieTitle, tmsId, callback) {

        var cache = movieListView.posterArray[tmsId];

        if ( cache !== undefined) {
            callback(cache);
            return;
        }

        var title = movieTitle.replace(': The IMAX Experience', '');
        title = title.replace('3D', '');
        // Todo: don add movie title normalization

        var imageUrl = null;
        var poster = {tmsId : tmsId, imageUrl : null};

        var theMovieDBUrl = 'http://api.themoviedb.org/3/search/movie?api_key=4b2d2dd99958a2e41bb9b342195e74c1&query='+encodeURIComponent(title);
        $.ajax({
            url: theMovieDBUrl,
            // dataType:"jsonp",
            //  contentType: 'application/json',
            success: function (result, textStatus, jqXHR) {
                if (result.total_results >= 1) {
                    var imageUrl = 'http://image.tmdb.org/t/p/w342/';
                    if (result.results.length > 0) {

                        poster.imageUrl = imageUrl + result.results[0].poster_path;
                        movieListView.posterArray[poster.tmsId] = poster;
                    }
                }
                callback(poster);
            },
            error: function () {
                callback(null);
            }
        });
    },

    processMoviePosters : function () {
        var movieArray = movieListView.movieArray, len = movieArray.length, counter = len;

        mobileNotify("Getting Movie Posters and ratings...");

        // Fetch the movie posters
        for (var i=0; i< len; i++) {
            var movie = movieArray[i];
           this._findPoster(movie.movieTitle, movie.tmsId, function (poster) {

              /*  if (poster !== null) {
                    movieListView.posterArray[poster.tmsId] = poster;
                }*/

                // Decrement the counter as we get the data...
                if (--counter === 0) {
                    movieListView.finalizeMoviePosters(movieArray);
                }

            });
        }


    },

    processMovieDetails : function () {
        var movieArray = movieListView.movieArray, len = movieArray.length, counter = len;

        mobileNotify("Getting Movie Posters and ratings...");

        // Fetch the movie poster and rating data
        for (var i=0; i< len; i++) {
            var movie = movieArray[i];
            moviePosterPhoto.addPoster(movie.movieTitle, movie.tmsId, function (poster) {

                if (poster !== null) {
                    movieListView.posterArray[poster.tmsId] = poster;
                }

                // Decrement the counter as we get the data...
                if (--counter === 0) {
                    movieListView.finalizeMovieList(movieArray);
                }

            });
        }


    },


    processShowTimes: function (showTimes) {
        var theatreArray = [], theatreNames = [], showtime = null, time = null, timeStr = null;

        for (var s=0; s<showTimes.length; s++) {
            showtime = showTimes[s];

            time = moment(showtime.dateTime);

            if (time >= movieListView._minTime && time <+ movieListView._maxTime) {
                timeStr = moment(showtime.dateTime).format('h:mm A');
                if (timeStr !== undefined) {
                    if (theatreArray[showtime.theatre.name] === undefined)
                        theatreArray[showtime.theatre.name] = "";
                    theatreArray[showtime.theatre.name] +=  timeStr  + " ";
                }
            }

        }
        theatreNames = Object.keys(theatreArray);

        var result = {theatres : theatreNames, showTimes: theatreArray};

        var showTimesString = '';
        for (var i=0; i<theatreNames.length; i++) {

            showTimesString += theatreNames[i] + ' : </br>' + theatreArray [theatreNames[i]] + '</br>';

        }

        result.showTimesString = showTimesString;

        return (result);
    },

    closeModal : function () {

    },

    onEdit : function (e) {
        _preventDefault(e);

        smartMovieEdit.openModal(null, function (obj) {
            movieListView.setActiveObject(obj);
            movieListView._findMovies();
        })
    },

    onDone: function (e) {
        _preventDefault(e);
        $("#movieListModal").data("kendoMobileModalView").close();
        ux.bannerReset();
    },

    onCancel: function (e) {
        _preventDefault(e);
        $("#movieListModal").data("kendoMobileModalView").close();
        if (movieListView.callback !== null) {
            movieListView.callback(null);
        }
        ux.bannerReset();
    }

};

var smartMovieEdit = {
    _activeObject : new kendo.data.ObservableObject(),
    _date : new Date(),
    _placeUUID :null,
    _geoObj: null,
    _isInited : false,
    _callback : null,
    _movieId: null,
    _theatreId: null,
    _radius: 15,


    onChangeCalendar: function (e) {
        _preventDefault(e);


    },

    checkExpired : function (date) {
        var thisObject = smartMovieEdit._activeObject;

        if (moment(smartMovieEdit._date).isAfter(date)) {
            thisObject.set('isExpired', true);
            smartEventView.setEventBanner("expired");

        } else {
            thisObject.set('isExpired', false);
            //smartEventView.setEventBanner();
        }
    },

    updateDateString : function () {
        var date = $('#smartMovieEdit-date').val();
        var time = $('#smartMovieEdit-time').val();

        var finalDateStr = date + " " + time;
        //$("#smartEventView-datestring").val(finalDateStr);

        smartMovieEdit._activeObject.set('date', new Date(finalDateStr));
    },

    onSave: function (e) {
        _preventDefault(e);

        smartMovieEdit.onDone();
    },

    onInit: function (e) {
       // _preventDefault(e);



    },


    initActiveObject : function () {
        var thisObj = smartMovieEdit._activeObject;
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

        thisObj.set('lat', mapModel.lat);
        thisObj.set('lng', mapModel.lng);
        thisObj.set('date', newDate);
        thisObj.set('placeUUID', null);
        thisObj.set('googleId', null);
        thisObj.set('placeName', null);
        thisObj.set('address', mapModel.address);
        thisObj.set('placeType', null);

        // $('#smartEventView-placesearch').val(thisObj.placeName);
        //$('#smartEventView-datestring').val(new Date(thisObj.date).toString('dddd, MMMM dd, yyyy h:mm tt'));
        $('#smartMovieEdit-date').val(new Date(thisObj.date).toString('MMM dd, yyyy'));
        $('#smartMovieEdit-time').val(new Date(thisObj.date).toString('h:mm tt'));

        $('#smartMovieEdit-placesearch').val(thisObj.get('placeString'));
        //$("#smartEventView-placeadddiv").addClass('hidden');
        //$("#searchEventPlace-input").removeClass('hidden');
    },

    setActiveObject: function (obj) {
        var thisObj = smartMovieEdit._activeObject;


        thisObj.set('lat', obj.lat);
        thisObj.set('lng', obj.lng);
        thisObj.set('date', obj.date);
        thisObj.set('placeUUID', obj.placeUUID);
        thisObj.set('googleId', obj.googleId);
        thisObj.set('placeName', obj.name);
        thisObj.set('address', obj.address);
        thisObj.set('placeType', obj.type);

    },

    onPlaceSearch : function (e) {

        _preventDefault(e);

        var placeStr =  $("#smartMovieEdit-placesearch").val();

        smartLocationView.openModal(placeStr, function (geo) {
            if (geo === null) {
                mobileNotify("Smart Location cancelled...");
                return;
            }

            var thisObj = smartMovieEdit._activeObject;

            thisObj.set('placeUUID', null);
            thisObj.set('googleId', geo.googleId);
            thisObj.set('placeName', geo.name);
            thisObj.set('city', geo.city);
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

    openModal: function (actionObj, callback) {
        ux.hideKeyboard();

        if (!smartMovieEdit._isInited) {

            $('#smartMovieEdit-date').pickadate({
                format: 'mmm, d yyyy',
                formatSubmit: 'mm d yyyy',
                min: true,
                onSet : function (context) {
                    smartMovieEdit.updateDateString();
                }
            });

            /*$('#smartMovieEdit-time').pickatime({
                interval: 60,
                min: [10,0],
                max: [23,0],
                clear: false
            });*/

            /* $("#smartEventView-date").on('blur', function () {

             });*/


            /* $("#smartMovieEdit-time").on('blur', function () {
             var timeIn =  $("#smartMovieEditor-time").val();
             if (timeIn.length > 2) {

             var time = Date.parse(timeIn);
             var timeComp = new Date(time).toString("h:mm tt");
             $("#smartMovieEdit-time").val(timeComp);
             smartMovieEdit.updateDateString();
             }
             });*/

            $("#smartMovieEdit-placesearch").on('input', function () {
                var placeStr =  $("#smartMovieEdit-placesearch").val();
                if (placeStr.length > 3) {
                    $("#smartMovieEdit-placesearchBtn").text("Find " + placeStr);
                    $("#smartMovieEdit-placesearchdiv").removeClass('hidden');
                } else {
                    $("#smartMovieEdit-placesearchdiv").addClass('hidden');
                }
            });


            smartMovieEdit._isInited = true;
        }

        if (callback === undefined) {
            callback = null;
        } else {
            smartMovieEdit._callback = callback;
        }

        // Get the new whole hour...
        var d = new Date();
        d.setMinutes (d.getMinutes() + 30);
        d.setMinutes (0);

        var timeStr = moment(d).format('h:mm a');

        $("#smartMovieEdit-time").val(timeStr);

        smartMovieEdit._date = new Date();


        if (actionObj === undefined || actionObj === null) {
            smartMovieEdit.initActiveObject();

        } else {
            // we have an existing event
            smartMovieEdit.setActiveObject(actionObj);
        }
        var thisObject = smartMovieEdit._activeObject;
        // setting send/receiver


        // setting event location
        if(thisObject.placeName !== null){
            $(".event-location").removeClass("hidden");
        } else {
            $(".event-location").addClass("hidden");
        }

        // smartMovieEdit.updateCalendar();

        var prettyDate = moment(thisObject.date).format('dddd MMMM, Do [at] h:mmA');
        $(".event-date").text(prettyDate);



        smartMovieEdit.checkExpired();
        $("#smartMovieEditor").data("kendoMobileModalView").open();
    },

    onShow: function (e) {
       // _preventDefault(e);
        $("#smartMovieEditor").data("kendoMobileModalView").open();

    },

    onCancel : function (e) {
        _preventDefault(e);
        $("#smartMovieEditor").data("kendoMobileModalView").close();
        ux.bannerReset();
    },

    onDone: function (e) {
        //_preventDefault(e);

        $("#smartMovieEditor").data("kendoMobileModalView").close();
        if (smartMovieEdit._callback !== null) {
            smartMovieEdit._callback(smartMovieEdit._activeObject);
        }

        ux.bannerReset();
    }
};


var smartMovieView = {
    activeObject : new kendo.data.ObservableObject(),
    showtimesDS :  new kendo.data.DataSource({
        //group: { field: "theatreString" }
        sort: { field: "showtime", dir: "asc" }
    }),

    _date : new Date(),
    _placeUUID :null,
    _geoObj: null,
    _isInited : false,
    _callback : null,
    _movieId: null,
    _theatreId: null,
    _showTimeSelected: false,
    _radius: 15,

    onChangeCalendar: function (e) {
        _preventDefault(e);


    },

    checkExpired : function (date) {
        var thisObject = smartMovieView.activeObject;

        if (moment(smartMovieView._date).isAfter(date)) {
            thisObject.set('isExpired', true);
            smartEventView.setEventBanner("expired");

        } else {
            thisObject.set('isExpired', false);
            //smartEventView.setEventBanner();
        }
    },

    addToCalendar : function (e) {
        _preventDefault(e);

        var thisObj = smartMovieView.activeObject;
        var startDate = new Date(thisObj.showtime), endDate = new Date(moment(thisObj.showtime).add(150, 'minutes'));


        if (window.navigator.simulator !== undefined) {
            mobileNotify("Not supported in emulator");
        } else {
            window.plugins.calendar.createEvent(thisObj.movieTitle,
                thisObj.theatreName,
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

    onSave: function (e) {
        _preventDefault(e);

        var thisObj = smartMovieView.activeObject;

        thisObj.set('channelUUID', channelView._channelUUID);
        thisObj.set('senderName', userModel._user.name);

        if (thisObj.addToCalendar && thisObj.calendarId === null) {
            smartMovieView.addToCalendar();
        }

        mobileNotify("Getting Info for " + thisObj.theatreName);
        smartMovieView._getTheatreDetails(thisObj.theatreId, function (theatre){
            smartMovie.addMovie(smartMovieView.activeObject);

            smartMovieView.onDone();
        });

    },

    onCallTheatre : function (e) {
        _preventDefault(e);
        var thisObj = smartMovieView.activeObject;
        if (thisObj.theatrePhone === undefined || thisObj.theatrePhone === null) {
            mobileNotify("No phone number for " + thisObj.theatreName);
        } else {


            if (window.navigator.simulator === true){
                mobileNotify("Phone Calls are't supported in the emulator");
                return;
            }

            var phone = thisObj.theatrePhone;

            if (addContactView.isValidPhone(phone) === null) {
                mobileNotify(phone + " is not valid US phone number");
                return;
            }

            mobileNotify("Calling  " + thisObj.theatreName);

            window.plugins.CallNumber.callNumber(

                function(success) {
                    mobileNotify("Dialing " + number);
                },
                function(err) {
                    mobileNotify("Dailer error: " + err);
                },
                thisObj.theatrePhone
            );
        }
    },

    onTheatreDirections : function (e) {
        _preventDefault(e);
        var thisObj = smartMovieView.activeObject;
        if (window.navigator.simulator === undefined) {
            if (thisObj.theatreLat !== null) {
                launchnavigator.navigate(
                    [thisObj.theatreLat,thisObj.theatreLng],
                    null,
                    function(){
                        mobileNotify("Launching Navigation...");
                    },
                    function(error){
                        mobileNotify("Plugin error: "+ error);
                    });
            } else if (thisObj.theatreAddress !== null) {
                launchnavigator.navigate(
                    thisObj.theatreAddress,
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
    },


    onInit: function (e) {
       // _preventDefault(e);

        $("#smartMovieView-listview").kendoMobileListView({
                dataSource: smartMovieView.showtimesDS,
                template: $("#movieShowtimeTemplate").html(),
                //headerTemplate: $("#smartMovieView-headline").html(),
                //fixedHeaders: true,
                click: function (e) {
                    var showtime = e.dataItem;
                    var activeObj = smartMovieView.activeObject;

                    smartMovieView.selectShowtime(showtime);



                }
            }
        );


    },

    selectShowtime : function (showtime) {
        var obj = smartMovieView.activeObject;

        obj.set('theatreId', showtime.theatreId);
        obj.set('theatreName', showtime.theatreName);
        obj.set('showtime', showtime.showtime);
        obj.set('showtimeString', showtime.showtimeString);
        obj.set('ticketUrl', showtime.ticketUrl);
        if (showtime.ticketUrl !== null) {
            $('#smartMovieView-fandangoLink').removeClass('hidden');
        } else {
            $('#smartMovieView-fandangoLink').addClass('hidden');
        }
        smartMovieView.setMovieSelected(true);
        smartMovieView.enableSave(true);

    },

    enableSave: function (enabled) {
        if (enabled) {
            $('#smartMovieViewSaveBtn').removeClass('hidden');
        } else {
            $('#smartMovieViewSaveBtn').addClass('hidden');
        }
    },

    processShowTimes : function (showtimes) {
        smartMovieView.showtimesDS.data([]);

        if (showtimes !== undefined && showtimes.length > 0) {

            for (var i=0; i< showtimes.length; i++) {
                var showtime = showtimes[i], stObj = {};

                stObj.theatreId = showtime.theatre.id;
                stObj.theatreName = showtime.theatre.name;
                stObj.showtime = moment(showtime.dateTime);
                stObj.showtimeString = moment(showtime.dateTime).format('h:mm A');
                stObj.ticketUrl = null;
                if (showtime.ticketURI !== undefined && showtime.ticketURI !== null) {
                    stObj.ticketUrl = showtime.ticketURI;
                }
                smartMovieView.showtimesDS.add(stObj);

            }
        }
    },

    setCreatorMode : function () {
        $('.movie-creator').removeClass('hidden');
        $('#smartMovieView-showtimes').removeClass('hidden');
        $('.movie-viewer').addClass('hidden');
        $('#smartMovieViewSaveBtn').addClass('hidden');
        $('#smartMovieViewDoneBtn').addClass('hidden');
    },

    setViewerMode : function () {
        var activeObj = smartMovieView.activeObject;


        $('.movie-creator').addClass('hidden');
        $('.movie-viewer').removeClass('hidden');
        $('#smartMovieViewSaveBtn').addClass('hidden');
        $('#smartMovieView-showtimes').addClass('hidden');
        $('#smartMovieViewDoneBtn').removeClass('hidden');
        $('#movieBanner').removeClass("hidden");
        smartEventView.setEventBanner("organizer", activeObj.senderName);
    },

    setMovieSelected : function (isSelected) {
        smartMovieView._showTimeSelected = isSelected;
        var activeObj = smartMovieView.activeObject;

        if (activeObj.ticketUrl !== undefined && activeObj.ticketUrl !== null) {
            $('#smartMovieView-fandangoLink').removeClass('hidden');
        } else {
            $('#smartMovieView-fandangoLink').addClass('hidden');
        }
        if (isSelected) {
            $('.movie-selected').removeClass('hidden');
            $('#smartMovieView-showtimes').addClass('hidden');
            //$('.movie-preselected').velocity("fadeOut");
        } else {
            $('.movie-selected').addClass('hidden');
            $('#smartMovieView-showtimes').removeClass('hidden');
            //$('.movie-preselected').velocity("fadeIn");
        }
    },

    updateMovieLinks : function () {
        var activeObj = smartMovieView.activeObject;
        $('.movie-links').addClass('hidden');

        if (activeObj.imdbId !== null) {
            $('#smartMovieView-imdbLink').removeClass('hidden');
        }

        if (activeObj.officialUrl !== null) {
            $('#smartMovieView-webLink').removeClass('hidden');
        }

        if (activeObj.ticketUrl !== undefined && activeObj.ticketUrl !== null) {
            $('#smartMovieView-fandangoLink').removeClass('hidden');
        }
    },

    initActiveObject : function (movie) {
        var thisObj = smartMovieView.activeObject;

        this.setCreatorMode();
        this.setMovieSelected(false);

        // Build the smartMovie / movieGram object

        thisObj.set("uuid", uuid.v4());
        thisObj.set("ggType", smartMovie._ggClass);
        thisObj.set('senderUUID', userModel._user.userUUID);
        thisObj.set('senderName', userModel._user.name);
        thisObj.set('placeString', movie.address);
        thisObj.set('movieTitle', movie.movieTitle);
        thisObj.set('tmsId', movie.tmsId);
        thisObj.set('imdbId', movie.imdbId);
        if (movie.imdbUrl === undefined)
            movie.imdbUrl = null;
        thisObj.set('imdbUrl', movie.imdbUrl);
        thisObj.set('imdbRating', movie.imdbRating);
        thisObj.set('imdbVotes', movie.imdbVotes);
        thisObj.set('metaScore', movie.metaScore);
        if (movie.officialUrl === undefined)
            movie.officialUrl = null;
        thisObj.set('officialUrl', movie.officialUrl);
        if (movie.ticketUrl === undefined)
            movie.ticketUrl = null;
        thisObj.set('ticketUrl', movie.ticketUrl);
        thisObj.set('rating', movie.rating);
        thisObj.set('runtime', movie.runtime);
        thisObj.set('date', movie.date);
        thisObj.set('type', "movie");
        thisObj.set('theatreId', null);
        thisObj.set('theatreName', null);
        thisObj.set('theatrePhone', null);
        thisObj.set('theatreAddress', null);
        thisObj.set('theatreLat', null);
        thisObj.set('theatreLng', null);
        thisObj.set('showtime', null);
        thisObj.set('showtimeString', null);
        thisObj.set('action', null);
        thisObj.set('description', movie.description);
        thisObj.set('imageUrl', movie.imageUrl);
        thisObj.set('address', null);
        thisObj.set('googleId', null);
        thisObj.set('calendarId', null);
        thisObj.set('genre', movie.genre);
        thisObj.set('lat', movie.lat);
        thisObj.set('lng', movie.lng);
        thisObj.set('isDeleted', false);
        thisObj.set('wasCancelled', false);
        thisObj.set('movieSelected', false);  // if false, no movie selected - "let's see a movie at this theatre around this time
        thisObj.set('addToCalendar', false);
        thisObj.set('comment', null);
        thisObj.set('wasSent', false);

        smartMovieView.processShowTimes(movie.showtimes);

        this.updateMovieLinks()
    },

    setActiveObject: function (obj) {
        var thisObj = smartMovieView.activeObject;

        thisObj.set("uuid", obj.uuid);
        thisObj.set("ggType",obj.ggType);
        thisObj.set('senderUUID', obj.senderUUID);
        thisObj.set('senderName', obj.senderName);
        thisObj.set('placeString', obj.placeString);
        thisObj.set('channelUUID', obj.channelUUID);
        thisObj.set('movieTitle', obj.movieTitle);
        thisObj.set('tmsId', obj.tmsId);
        thisObj.set('imdbId', obj.imdbId);
        thisObj.set('imdbRating', obj.imdbRating);
        thisObj.set('imdbVotes', obj.imdbVotes);
        thisObj.set('metaScore', obj.metaScore);
        thisObj.set('type', obj.type);
        thisObj.set('theatreId', obj.theatreId);
        thisObj.set('theatreName', obj.theatreName);
        thisObj.set('theatreAddress', obj.theatreAddress);
        thisObj.set('theatrePhone', obj.theatrePhone);
        thisObj.set('theatreLat', obj.theatreLat);
        thisObj.set('theatreLng', obj.theatreLng);
        thisObj.set('showtimes', obj.showtimes);
        thisObj.set('showtimeString', obj.showtimeString);
        thisObj.set('genre', obj.genre);
        thisObj.set('runtime', obj.runtime);
        thisObj.set('action', obj.action);
        thisObj.set('description', obj.description);
        thisObj.set('imageUrl', obj.imageUrl);
        thisObj.set('officialUrl', obj.officialUrl);
        thisObj.set('ticketUrl', obj.ticketUrl);
        thisObj.set('address', obj.address);
        thisObj.set('googleId', obj.googleId);
        thisObj.set('calendarId', obj.calendarId);
        thisObj.set('lat', obj.lat);
        thisObj.set('lng', obj.lng);
        thisObj.set('date', obj.date);
        thisObj.set('isDeleted', obj.isDeleted);
        thisObj.set('wasCancelled', obj.wasCancelled);
        thisObj.set('addToCalendar', obj.addToCalendar);
        thisObj.set('comment', obj.comment);
        thisObj.set('wasSent', obj.wasSent);

        this.setViewerMode();
        this.setMovieSelected(true);
        this.updateMovieLinks();


    },

    openModalSelectShowtime: function (movie, callback) {
        ux.hideKeyboard();

        if (!smartMovieView._isInited) {

            smartMovieView._isInited = true;
        }

        if (callback === undefined) {
            callback = null;
        } else {
            smartMovieView._callback = callback;
        }

        smartMovieView.initActiveObject(movie);

        var movieImgSrc = smartMovieView.showRating(movie.rating, false);

        $("#smartMovie-ratingImg").attr("src", movieImgSrc);

        $("#smartMovieModal").data("kendoMobileModalView").open();
    },


    openModal: function (actionObj, callback) {
        ux.hideKeyboard();

        if (!smartMovieView._isInited) {

            smartMovieView._isInited = true;
        }

        if (callback === undefined) {
            callback = null;
        } else {
            smartMovieView._callback = callback;
        }


        if (actionObj === undefined || actionObj === null) {
           mobileNotify("Invalid MovieGram....");
            smartMovieView.onCancel();
        } else {
            // we have an existing event
            smartMovieView.setActiveObject(actionObj);
        }
        var thisObject = smartMovieView.activeObject;
        // setting send/receiver



        if (thisObject.senderUUID === null || thisObject.senderUUID === userModel._user.userUUID) {
            $("#smartMovieView-organizer").text("You");
        } else {
            var contact = contactModel.findContactByUUID(thisObject.senderUUID);
            if (contact !== undefined) {
                $("#smartMovieView-organizer").text(contact.name);
            }
        }
        smartMovieView.enableSave(false);

        smartMovieView.checkExpired();
        $("#smartMovieModal").data("kendoMobileModalView").open();
    },

    showLinkImdb: function (e) {
        _preventDefault(e);
        var imdbUrl = 'http://www.imdb.com/title/'+ smartMovieView.activeObject.imdbId + '/';

        var ref = window.open(imdbUrl, '_blank', 'location=no');

    },

    showLinkWebSite: function (e) {
        _preventDefault(e);
        var webUrl = smartMovieView.activeObject.officialUrl;
        var ref = window.open(webUrl, '_blank', 'location=no');
    },

    showLinkFandango: function (e) {
        _preventDefault(e);
        var fandangoUrl = smartMovieView.activeObject.ticketUrl;
        var ref = window.open(fandangoUrl, '_blank', 'location=no');
    },

    onShow: function (e) {
      //  _preventDefault(e);

        $("#smartMovieModal").data("kendoMobileModalView").open();

    },

    onCancel : function (e) {
        _preventDefault(e);
        if (smartMovieView._showTimeSelected) {
            smartMovieView.setMovieSelected(false);
            $("#smartMovieModal").data("kendoMobileModalView").close();
        } else {
            $("#smartMovieModal").data("kendoMobileModalView").close();
            if (smartMovieView._callback !== null) {
                smartMovieView._callback(null);
            }
        }
        ux.bannerReset();

    },

    onDone: function (e) {
        //_preventDefault(e);

        $("#smartMovieModal").data("kendoMobileModalView").close();
        if (smartMovieView._callback !== null) {
            smartMovieView._callback(smartMovieView.activeObject);
        }
    },

    onViewDone: function (e) {
        $("#smartMovieModal").data("kendoMobileModalView").close();
    },

    showRating: function(rating, lightStyle){
        var ratingImgStr = "";
        switch(rating){
            case 'G':
                if(lightStyle){
                    ratingImgStr = "images/gg-rated-g.svg";
                } else {
                    ratingImgStr = "images/gg-rated-g-dark.svg";
                }
                return ratingImgStr;
                break;
            case 'PG':
                if(lightStyle){
                    ratingImgStr = "images/gg-rated-pg.svg";
                } else {
                    ratingImgStr = "images/gg-rated-pg-dark.svg";
                }
                return ratingImgStr;
                break;
            case "PG-13":
                if(lightStyle){
                    ratingImgStr = "images/gg-rated-pg13.svg";
                } else {
                    ratingImgStr = "images/gg-rated-pg13-dark.svg";
                }
                return ratingImgStr;
                break;
            case "R":
                if(lightStyle){
                    ratingImgStr = "images/gg-rated-r.svg";
                } else {
                    ratingImgStr = "images/gg-rated-r-dark.svg";
                }
                return ratingImgStr;
                break;
            case "NC-17":
                if(lightStyle){
                    ratingImgStr = "images/gg-rated-nc17.svg";
                } else {
                    ratingImgStr = "images/gg-rated-nc17-dark.svg";
                }
                return ratingImgStr;
                break;
            case "N/A":
                return ratingImgStr = "";
                break;
            default:
                return ratingImgStr = "";
                break;
                //console.log("Movie did not have any rating");
        }
    },


    _getTheatreDetails : function (theatreId, callback) {
        var theatreUrl = 'http://data.tmsapi.com/v1.1/theatres/'+ theatreId + '?api_key=9zah4ggnfz9zpautmrx4bh32';
        $.ajax({
            url: theatreUrl,
            // dataType:"jsonp",
            //  contentType: 'application/json',
            success: function (result, textStatus, jqXHR) {
                if (result.error_code === undefined) {
                    var obj = smartMovieView.activeObject;

                    obj.theatreLat = result.location.geoCode.latitude;
                    obj.theatreLng = result.location.geoCode.longitude;

                    if (result.location.telephone !== undefined) {
                        obj.theatrePhone = result.location.telephone;
                    }

                    obj.theatreAddress = result.location.address.street + ', ' + result.location.address.city + ",  " + result.location.address.state;

                    callback(result);
                }

            },
            error: function () {
                mobileNotify("Can't get poster info for " + movieTitle);
                callback(null);
            }
        });

    },


    _getMovieDetails : function (movieTitle, callback) {

        var title = movieTitle.replace(': The IMAX Experience', '');
        title = title.replace('3D', '');
        var title = encodeURIComponent(title);
        var imdbUrl = 'http://www.omdbapi.com/?t=' + title + '&y=&plot=full&r=json';
        $.ajax({
            url: imdbUrl,
            // dataType:"jsonp",
            //  contentType: 'application/json',
            success: function (result, textStatus, jqXHR) {
                if (result.Response === 'True') {
                    var obj = {};

                    var awards = '';
                    if (result.Awards !== undefined)
                        awards = result.Awards;
                    obj.movieTitle = movieTitle;
                    obj.awards = awards;
                    obj.metaScore  = result.Metascore;
                    obj.imdbRating = result.imdbRating;
                    obj.imdbVotes = result.imdbVotes;
                    obj.imdbId = result.imdbID;
                    obj.imdbUrl = null;
                    if (obj.imdbId !== undefined && obj.imdbId !== null)
                        obj.imdbUrl = 'www.imdb.com/title/'+obj.imdbId+'/';
                    if (result.Runtime === undefined) {
                        result.Runtime = "0";
                    }
                    obj.runtime = result.Runtime;
                    obj.genre = result.Genre;
                    obj.rating  = result.Rated;

                    callback(obj);

                } else {
                    mobileNotify("Can't get poster info for " + movieTitle);
                    callback(null);
                }


            },
            error: function () {
                mobileNotify("Can't get poster info for " + movieTitle);
                callback(null);
            }
        });

    }
};


var smartTripView = {
    activeObject : new kendo.data.ObservableObject(),
    callback : null,
    _inited: false,
    name: null,
    origin: null,
    destination: null,
    validOrigin: false,
    validDestination: false,
    departure : null,
    arrival: null,
    autoStatus: false,
    addToCalendar: false,
    mode: 'create',
    tripType: 'drive',
    travelMode : null,
    validTime: false,
    validName : false,
    leg1Complete : false,
    leg2Complete : false,
    placesDS : new kendo.data.DataSource(),
    initialized: false,

    onInit : function (e) {


        smartTripView.activeObject.bind("change", function (e) {
            switch (e.field) {
                case 'tripType' :
                    smartTripView.validate();
                    break;

                case 'origin' :
                    break;

                case 'destination' :
                    break;

                case 'timeArrival' :
                    smartTripView.processArrivalTime();
                    break;

                case 'timeDeparture' :
                    smartTripView.processDepartureTime();
                    break;
            }
        });


        smartTripView.initialized = false;

       /* $( "#smartTripView-timeArrival" ).blur(function() {
            smartTripView.processArrivalTime();
        });

        $( "#smartTripView-timeDeparture" ).blur(function() {
            smartTripView.processDepartureTime();
        });*/


        $('#smartTripView-dateDeparture').pickadate({
            format: 'mmm, d yyyy',
            formatSubmit: 'mm d yyyy',
            min: true,
            onSet : function (context) {
                smartTripView.processDepartureTime();
            }
        });


        $('#smartTripView-dateArrival').pickadate({
            format: 'mmm, d yyyy',
            formatSubmit: 'mm d yyyy',
            min: true,
            onSet : function (context) {
                smartTripView.processArrivalTime();
            }
        });


        $("#smartTripView-origin").kendoAutoComplete({
            dataSource: smartTripView.placesDS,
            ignoreCase: true,
            dataTextField: "name",
            select: function(e) {
                // User has selected one of their places
                var dataItem = this.dataItem(e.item.index());

                var oplace = {};

                oplace.lat = dataItem.lat;
                oplace.lng = dataItem.lng;
                oplace.name  = dataItem.name;
                oplace.address = dataItem.address + ", " + dataItem.city + ", " + dataItem.state;
                oplace.googleId = dataItem.googleId;
                oplace.placeUUID = dataItem.uuid;

                smartTripView.activeObject.set('origin', oplace);

                smartTripView.validOrigin = true;

                smartTripView.validateRoute();

                // Hide and clear btn
                $("#smartTripView-origin").trigger("change");
                // Show origin step
                $("#smartTripView-origin-box").removeClass("hidden");
            },

            change: function(e){
                var val = this.value();

                if(val.length > 0){
                    $(".smartTrip-currentLocation").addClass("hidden");

                    if(smartTripView.origin == null){
                        $("#smartTripView-originSearchBtn").removeClass("hidden").text('Find "' + val + '"');
                    }

                } else {
                    $("#smartTripView-originSearchBtn").addClass("hidden").text('');
                    $(".smartTrip-currentLocation").removeClass("hidden");
                }

            },

            filtering: function(e) {
                //get filter descriptor
                var filter = e.filter;

                if(filter.value > 0){
                    $(".smartTrip-currentLocation").addClass("hidden");

                    if(smartTripView.activeObject.origin === null){
                        $("#smartTripView-originSearchBtn").removeClass("hidden").text('Find "' + val + '"');
                    }

                } else {
                    $("#smartTripView-originSearchBtn").addClass("hidden").text('');
                    $(".smartTrip-currentLocation").removeClass("hidden");
                }
            },
            filter: "contains",
            placeholder: "Place, address, or location"
        });

        $("#smartTripView-destination").kendoAutoComplete({
            dataSource: smartTripView.placesDS,
            ignoreCase: true,
            dataTextField: "name",
            select: function(e) {
                // User has selected one of their places;
                var dataItem = this.dataItem(e.item.index());

                var dplace = {};

                dplace.lat = dataItem.lat;
                dplace.lng = dataItem.lng;
                dplace.name  = dataItem.name;
                dplace.address = dataItem.address + ", " + dataItem.city + ", " + dataItem.state;
                dplace.googleId = dataItem.googleId;
                dplace.placeUUID = dataItem.uuid;

                smartTripView.activeObject.set('destination', dplace);

                if (dplace.name !== null && dplace.name !== '') {
                    smartTripView.activeObject.set('destinationName', dplace.name);
                } else {
                    smartTripView.activeObject.set('destinationName', dplace.address);
                }
                smartTripView.validDestination = true;

                smartTripView.validateRoute();

                // Hide and clear btn
                smartTripView.lockLocation(true, "destination");
                // Show origin step
                $(".smartTripView-origin-box").removeClass("hidden");
            },

            change: function(e){
                var val = this.value();

                if(val.length > 0 && smartTripView.activeObject.destination === null){
                    $("#smartTripView-destinationSearchBtn").removeClass("hidden").text('Find "' + val + '"');

                } else {
                    $("#smartTripView-destinationSearchBtn").addClass("hidden").text('');
                }

            },
            filter: "contains",
            placeholder: "Place, address, or location"
        });

        $('input[type=radio][name=arrival]').on("change", function() {
            var value = $(this).val();

            if(value === "true"){
                $("#smartTripView-arrival-time").removeClass("hidden");
                $("#smartTripView-departure-time").addClass("hidden");

                $("#smartTripView-travelTime-box").addClass('hidden');

                // Show calculate btn
                //$("#smartTripView-calculateArrival")
            } else {
                $("#smartTripView-departure-time").removeClass("hidden");
                $("#smartTripView-arrival-time").addClass("hidden");

                // set default time
                var currentTime = smartTripView.getDefaultTime();

                $("#smartTripView-timeDeparture").val(currentTime);
                smartTripView.processDepartureTime();

                $("#smartTripView-routeTimeBtn").removeClass('hidden');
            }


        });


    },

    setActiveObject : function (tripObj) {

        var obj = smartTripView.activeObject;

        if (tripObj === null) {
            smartTripView.validTime = false;
            smartTripView.validName = false;
            smartTripView.validOrigin = false;
            smartTripView.validDestination = false;

            obj.set('senderUUID', userModel._user.userUUID);
            obj.set('senderName', userModel._user.name);
            obj.set('name', userModel._user.name + "'s Trip");
            obj.set('tripType', 'driving');
            obj.set('travelMode', google.maps.TravelMode.DRIVING);
            obj.set('autoStatus', false);
            obj.set('addToCalendar',  false);
            obj.set('leg1Complete',  false);
            obj.set('leg2Complete',  false);
            obj.set('duration', null);
            obj.set('durationString', null);
            obj.set('origin', null);
            obj.set('originName', null);
            obj.set('destination', null);
            obj.set('destinationName', null);
            obj.set('departure', null);
            obj.set('arrival', null);
            var d = new Date();
            var dateStr = moment(d).format('MM/DD/YYYY');
            obj.set('dateDeparture', dateStr);
            obj.set('dateArrival', dateStr);
            var timeStr = moment(d).format('h:mm a');
            obj.set('timeDeparture', timeStr);
            obj.set('timeArrival', timeStr);

        } else {

            smartTripView.validTime = true;
            smartTripView.validName = true;
            smartTripView.validOrigin = true;
            smartTripView.validDestination = true;

            obj.set('senderUUID', tripObj.senderUUID);
            obj.set('senderName', tripObj.senderName);

            obj.set('name', tripObj.name);
            obj.set('tripType', tripObj.tripType);
            obj.set('travelMode', tripObj.travelMode);
            obj.set('autoStatus', tripObj.autoStatus);
            obj.set('addToCalendar',  tripObj.addToCalendar);
            obj.set('leg1Complete',  tripObj.leg1Complete);
            obj.set('leg2Complete',  tripObj.leg2Complete);
            obj.set('origin', tripObj.origin);
            obj.set('originName', tripObj.originName);
            obj.set('destination', tripObj.destination);
            obj.set('destinationName', tripObj.destinationName);
            obj.set('departure', tripObj.departure);
            obj.set('arrival', tripObj.arrival);
            obj.set('dateDeparture', tripObj.dateDeparture);
            obj.set('dateArrival', tripObj.dateArrival);
            obj.set('timeDeparture', tripObj.timeDeparture);
            obj.set('timeArrival', tripObj.timeArrival);
            obj.set('duration', tripObj.duration);
            obj.set('durationString', tripObj.durationString);
        }
    },


    openModal : function (tripObj, callback) {

        if (tripObj === null) {
            smartTripView.mode = 'create';
            smartTripView.setCreator();
            smartTripView.setActiveObject(null);

        } else if (tripObj.senderUUID === userModel._user.userUUID) {
            smartTripView.mode = 'edit';
            smartTripView.setActiveObject(tripObj);
            smartTripView.setEditor();
        } else {
            smartTripView.mode = 'view';
            smartTripView.setActiveObject(tripObj);
            smartTripView.setViewer();
        }
        
        /*var d = new Date();*/

       /* $('#smartTripView-name').attr("placeholder", userModel._user.name + "'s Trip");
        $('#smartTripView-owner').text(userModel._user.name);
        $('#smartTripView-origin').val("");
        $('#ssmartTripView-destination').val("");

        // Set up default dates as today
        var dateStr = moment(d).format('MM/DD/YYYY');
        $('#smartTripView-dateDeparture').val(dateStr);
        $('#smartTripView-dateArrival').val(dateStr);

        //Set up default arrival and departure times as rounded up hour
        $('#smartTripView-timeDeparture').val(smartTripView.getDefaultTime());*/
        //$('#smartTripView-timeArrival').val(smartTripView.getDefaultTime());

        var placesArray = placesModel.placesDS.data();
        smartTripView.placesDS.data(placesArray);
        smartTripView.placesDS.filter([]);

       /* smartTripView.tripType = 'drive';
        smartTripView.autoStatus = false;
        smartTripView.addToCalendar = false;
        smartTripView.leg1Complete = false;
        smartTripView.leg2Complete = false;
        smartTripView.validName = false;
        smartTripView.validTime = false;
        smartTripView.validOrigin = false;
        smartTripView.validDestination = false;
        smartTripView.arrivalSet = false;
        smartTripView.departureSet = false;
        smartTripView.origin = null;
        smartTripView.destination = null;
        smartTripView.departure = null;
        smartTripView.arrival = null;*/

        // Setup Trip Map and Directions renderer just once
        if (!smartTripView._inited) {
            smartTripView.googleMap = new google.maps.Map(document.getElementById('smartTripView-mapDiv'), mapModel.mapOptions);
            smartTripView.directionsDisplay = new google.maps.DirectionsRenderer();
            smartTripView.directionsDisplay.setMap(smartTripView.googleMap);

            smartTripView._inited = true;
        }
        $("#smartTripModal").data("kendoMobileModalView").open();
    },

    setMapCenter: function () {

        smartTripView.googleMap.setCenter({lat: smartTripView.activeObject.origin.lat, lng: smartTripView.activeObject.origin.lng});
    },

    lockLocation: function(boolean, type){
        var $origin = $("#smartTripView-origin").data("kendoAutoComplete");
        var $destination = $("#smartTripView-destination").data("kendoAutoComplete");

        if(type === undefined){
            // for use with btns
            var btn = boolean.button[0];
            type = $(btn).data("type");
            boolean = $(btn).data("lock");
        }

        if(boolean){

            if(type === 'origin'){
                $origin.readonly(true);
                $("#smartTripView-origin-change").removeClass('hidden');

            } else {
                    $destination.readonly(true);
                    $("#smartTripView-destination-change").removeClass('hidden');
            }
        } else {

            if(type === 'origin'){
                $origin.readonly(false);
                $("#smartTripView-origin-change").addClass('hidden');
                smartTripView.activeObject.origin = null;
                smartTripView.validOrigin = false;
                $("#smartTripView-origin").trigger("change").val('');

            } else {
                $destination.readonly(false);
                $("#smartTripView-destination-change").addClass('hidden');
                smartTripView.activeObject.destination = null;
                smartTripView.validDestination = false;
                $("#smartTripView-destination").trigger("change").val('');
            }
        }

        smartTripView.validateRoute();
    },

    selectTransitMode: function(e){
        var index = this.current().index();
        /// Set transit mode in label
        var transit = this.current()[0].dataset["transit"];
        smartTripView.activeObject.set('tripType', transit);

        $("#smartTrip-transit").text(transit);

        switch (index) {
            case 0 :
                smartTripView.activeObject.set('travelMode', google.maps.TravelMode.DRIVING);
                break;
            case  1 :
                smartTripView.activeObject.set('travelMode', google.maps.TravelMode.TRANSIT);
                break;
            case  2 :
                smartTripView.activeObject.set('travelMode', google.maps.TravelMode.BICYCLING);
                break;
            case 3 :
                smartTripView.activeObject.set('travelMode', google.maps.TravelMode.WALKING);
                break;

        }
        smartTripView.validate();
    },

    displayRouteOnMap : function () {

        var org = smartTripView.activeObject.origin.address,
            dest = smartTripView.activeObject.destination.address,
            mode = smartTripView.activeObject.travelMode;
        var request = {
            origin: org,
            destination: dest,
            travelMode: mode
        };

        smartTripView.setMapCenter();

        mapModel.googleDirections.route(request, function(result, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                smartTripView.directionsDisplay.setDirections(result);
            }
        });
    },

    computeTravelTime : function (callback) {
        var origin = smartTripView.activeObject.origin.address, dest = smartTripView.activeObject.destination.address;

        var depart = null, arrive = null;

        if (smartTripView.activeObject.departure !== null) {
            depart = smartTripView.activeObject.departure;
        } else if (smartTripView.arrival !== null) {
            arrive = smartTripView.activeObject.arrival;
        }

        mapModel.getTravelTime(origin, dest, depart, arrive, function (result) {
            if (result.valid) {
                smartTripView.activeObject.duration = result.duration;
                smartTripView.activeObject.durationString = result.durationString;
                $("#smartTripView-travelTime").text(result.durationString);
                $("#smartTripView-travelTime-dist").text(result.distanceString);

                if (callback !== undefined && callback !== null) {
                    callback(result);
                }
            } else {
                ggError ("Google Distance Matrix Error " + JSON.stringify(result.error));
                if (callback !== undefined && callback !== null) {
                    callback(null);
                }
            }
        }, smartTripView.activeObject.tripType);
    },

    //Tag = 'Arrival' or 'Departure'
    updateCalendarUX : function (tag, fulldate) {
        var date = moment(fulldate).format('ddd, MMM Do YYYY'), time = moment(fulldate).format("HH:mm");

        var timeTag = "smartTripView-time"+tag, dateTag =  "smartTripView-date"+tag;
        
        $('#'+timeTag).val(time).change();
        $('#'+dateTag).val(date);
    },

    validateRoute : function () {
        if (smartTripView.validDestination && smartTripView.validOrigin) {
            $(".tripEditRouteNext").removeClass('hidden');

        } else {
            $(".tripEditRouteNext").addClass('hidden');
        }
    },

    validate : function () {
        if (smartTripView.validTime  && smartTripView.validDestination &&
        smartTripView.validOrigin) {
            $("#smartTripModal-saveBtn").removeClass('hidden');
            smartTripView.computeTravelTime(function(result) {
                /*var name = $('#smartTripView-name').val();

                if (name === null || name === '' || name === undefined) {
                    name = smartTripView.tripType + " From " + smartTripView.origin.name + " To " + smartTripView.destination.name;

                    name = name.toLowerCase().capitalize;

                    $('#smartTripView-name').val(name);
                }*/

                if (smartTripView.arrivalSet) {
                    smartTripView.activeObject.departure = moment(smartTripView.activeObject.arrival).add(smartTripView.activeObject.duration, 's');
                    smartTripView.updateCalendarUX('Departure', smartTripView.activeObject.departure);
                    smartTripView.updateCalendarUX('Arrival', smartTripView.activeObject.arrival);
                } else {
                    smartTripView.activeObject.arrival = moment(smartTripView.activeObject.departure).add(smartTripView.activeObject.duration, 's');
                    smartTripView.updateCalendarUX('Arrival', smartTripView.activeObject.arrival);
                    smartTripView.updateCalendarUX('Departure', smartTripView.activeObject.departure);
                }

                // Show trip travel time
                $("#smartTripView-travelTime-box").removeClass("hidden");

                smartTripView.setMapCenter();
                smartTripView.displayRouteOnMap();
            });
        } else {
            $("#smartTripModal-saveBtn").addClass('hidden');
        }
    },

    getDefaultTime : function () {

        // Get the new whole hour...
        var d = ux.setDefaultTime(true, 1);
        var timeStr = moment(d).format('H:mm');

        return(timeStr);
    },
    
    onAutoStatus : function (e) {
        
        smartTripView.autoStatus = e.checked;

    },

    onAddToCalendar : function (e) {

        smartTripView.addToCalendar = e.checked;

    },

    processDepartureTime : function () {
        var date =  $("#smartTripView-dateDeparture").val() , time = $("#smartTripView-timeDeparture").val();

        var combined = date +  " " + time;

        smartTripView.activeObject.set('departure', moment(combined).toDate());

        smartTripView.departureSet = true;
        smartTripView.arrivalSet = false;

        smartTripView.validTime = true;
        smartTripView.validate();

    },

    processArrivalTime : function ()  {
        var date =  $("#smartTripView-dateArrival").val() , time = $("#smartTripView-timeArrival").val();

        var combined = date +  " " + time;

        smartTripView.activeObject.set('arrival',moment(combined).toDate());

        smartTripView.departureSet = false;
        smartTripView.arrivalSet = true;

        smartTripView.validTime = true;
        smartTripView.validate();
    },



    onOpen : function (e) {
       
    },

    switchCards: function(e, direction){
        var next_card;
        var card_id = "#" + e.button[0].id;
        var card_num = parseInt($(card_id).data("card"), 10);
        var card_direction = $(card_id).data("direction");


        if(card_direction === "reverse"){
            $("#smartTripView-step-" + card_num).velocity({translateX: "102.5%"});

            if(card_num > 0){
                next_card = card_num - 1;
                $("#smartTripView-step-" + next_card).velocity({translateX: "0%"});
            }
        } else {
            $("#smartTripView-step-" + card_num).velocity({translateX: "-102.5%"});
            // next card
            next_card = card_num + 1;

            $("#smartTripView-step-" + next_card).velocity({translateX: "0%", delay: 750, opacity: 1, "z-index": 1});

        }
    },

    onOriginSearch : function (e) {
        var query = $('#smartTripView-origin').val();

        smartEventPlacesView.openModal(query, "Origin", function (placeObj) {
            if (placeObj !== undefined && placeObj !== null) {
                 var place = {};

                 place.lat = placeObj.lat;
                 place.lng = placeObj.lng;
                 place.name  = placeObj.name;
                 place.address = placeObj.address;
                 place.googleId = placeObj.googleId;
                 place.placeUUID = null;


                 smartTripView.validOrigin = true;

                var value = place.name;
                if (value === null) {
                    value = place.address;
                }

                smartTripView.activeObject.set('origin', place);

                smartTripView.activeObject.set('originName', value);

                smartTripView.validDestination = true;

                smartTripView.validateRoute();

                $('#smartTripView-origin').val(value);


                // hide destination search
                $("#smartTripView-destinationSearchBtn").text("").addClass("hidden");

                smartTripView.lockLocation(true, 'origin');

                // Hide search btn
                $("#smartTripView-originSearchBtn").text("").addClass("hidden");

                $(".smartTrip-currentLocation").addClass("hidden");
                smartTripView.validateRoute();
            }
        });
    },

    onDestinationSearch : function (e) {
        var query = $('#smartTripView-destination').val();

        smartEventPlacesView.openModal(query, "Destination", function (placeObj) {
            if (placeObj !== undefined && placeObj !== null) {
                var place = {};

                place.lat = placeObj.lat;
                place.lng = placeObj.lng;
                place.name  = placeObj.name;
                place.address = placeObj.address;
                place.googleId = placeObj.googleId;
                place.placeUUID = null;

                smartTripView.activeObject.set('destination',  place);
                smartTripView.validDestination = true;
                var value = place.name;
                if (value === null) {
                    value = place.address;
                }
                smartTripView.activeObject.set('destinationName',  value);
                $('#smartTripView-destination').val(value);

                // Show origin search
                $(".smartTripView-origin-box").removeClass("hidden");

                // hide destination search
                $("#smartTripView-destinationSearchBtn").text("").addClass("hidden");

                smartTripView.lockLocation(true, 'destination');

                smartTripView.validateRoute();
            }
        });
    },

    getCurrentLocation: function() {
        mobileNotify("Checking your current address...");

        mapModel.getCurrentAddress(function (newAddressFlag, address) {

            var place = {};

            place.lat = mapModel.lat;
            place.lng = mapModel.lng;
            place.name = null;
            place.address = mapModel.address;
            place.googleId = null;
            place.placeUUID = null;

            smartTripView.activeObject.set('origin', place);
            smartTripView.validOrigin = true;

            smartTripView.activeObject.set('originName', place.address);
            $('#smartTripView-origin').val(place.address);

            // hide destination search
            $("#smartTripView-originSearchBtn").text("").addClass("hidden");

            smartTripView.lockLocation(true, 'origin');

            smartTripView.validateRoute();

        });
    },

    setCreator : function () {
        $('.tripView').addClass('hidden');
        $('.tripEditRoute').removeClass('hidden');
        $('.tripEditRouteNext').addClass('hidden');
        $('.tripEditTime').addClass('hidden');
    },

    setViewer : function () {
        $('.tripView').removeClass('hidden');
        $('.tripEdit').addClass('hidden');
    },

    setEditor : function () {
        $('.tripEdit').addClass('hidden');
        $('.tripView').removeClass('hidden');
        $('.tripEditTime').removeClass('hidden');
        $('.tripViewTime').addClass('hidden');
    },

    setUpdate : function () {

    },

    onEnableEdit : function () {
        $('.tripEditRoute').removeClass('hidden');
        $('.tripEditRouteNext').removeClass('hidden');
        //$('.tripView').addClass('hidden');
    },

    onEnableTimeEdit : function () {
        $('.tripEditTime').removeClass('hidden');
        $('.tripViewTime').addClass('hidden');
    },

    onRouteComplete : function (e) {
        smartTripView.name = $('#smartTripView-name').val();
        $('#smartTripView-tripTitle').text(smartTripView.name);

        smartTripView.switchCards(e, "next");
    },

    onTimeComplete : function (e) {
        //$('.tripEditOptions').removeClass('hidden');
        //$('.tripEditTime').addClass('hidden');
        smartTripView.switchCards(e, "next");
        smartTripView.validate();
    },

    initUX : function ()  {
        smartTripView.lockLocation(false, "destination");
        smartTripView.lockLocation(false, "origin");

        $(".intelliCard").css("transform", "translateX(0%)");
        $("#smartTripView-step-1").css("z-index", 1);
        $("#smartTripView-step-2, #smartTripView-step-3").css({"opacity": 0, "z-index": 0});
        $("input[name=arrival]").prop("checked", false);
        $("#smartTripView-departure-time, #smartTripView-arrival-time").addClass('hidden');
    },

    onCancel : function (e) {

        smartTripView.setActiveObject(null);


        smartTripView.initUX();


        $("#smartTripModal").data("kendoMobileModalView").close();
    },

    onSave : function (e) {


        smartTripView.initUX();
        smartTripView.onDone();
    },

    onViewDone : function (e) {
        $("#smartTripModal").data("kendoMobileModalView").close();
    }
};

var smartFlightView = {
    regExAirline : '^([A-Za-z]{2})',
    regExFlight: '([0-9]{1,4})',
    regExA : null,
    regExF : null,
    airline : null,
    airlineName : null,
    flight: null,
    date: null,
    flightCode : null,
    returnAirline: null,
    returnFlight : null,
    returnFlightCode : null,
    validAirline : false,
    validFlight: false,
    validDate: false,
    status: new kendo.data.ObservableObject(),
    callback : null,

    checkFlight: function () {
        if (smartFlightView.validAirline &&smartFlightView.validFlight && smartFlightView.validDate) {
            mobileNotify("Looking up " + smartFlightView.airlineName + " " + smartFlightView.flight);
            getFlightStatus(smartFlightView.airline, smartFlightView.flight, smartFlightView.date, function (result) {
                smartFlightView.processFlightStatus(result);
            })
        } else {
            return;
        }
    },

    setFlightSTatus : function (statusObj) {
        if (statusObj === null) {
            smartFlightView.status.set('carrierCode', null);
            smartFlightView.status.set('flightNumber',null);
            smartFlightView.status.set('arrivalAirport', null);
            smartFlightView.status.set('departureAirport',null);

            smartFlightView.status.set('departureTerminal', null);
            smartFlightView.status.set('departureGate',null);

            smartFlightView.status.set('arrivalTerminal', null);
            smartFlightView.status.set('arrivalGate', null);
            smartFlightView.status.set('baggageClaim',  null);
            smartFlightView.status.set('durationMinutes', null);

            smartFlightView.status.set('estimatedDeparture', null);
            smartFlightView.status.set('estimatedArrival',  null);

            smartFlightView.status.set('actualDeparture', null);
            smartFlightView.status.set('actualArrival', null);

        } else {
            smartFlightView.status.set('carrierCode', statusObj.carrierCode);
            smartFlightView.status.set('flightNumber',statusObj.flightNumber);
            smartFlightView.status.set('arrivalAirport', statusObj.arrivalAirport);
            smartFlightView.status.set('departureAirport',statusObj.departureAirport);

            smartFlightView.status.set('departureTerminal', statusObj.departureTerminal);
            smartFlightView.status.set('departureGate',statusObj.departureGate);

            smartFlightView.status.set('arrivalTerminal', statusObj.arrivalTerminal);
            smartFlightView.status.set('arrivalGate', statusObj.arrivalGate);
            smartFlightView.status.set('baggageClaim',  statusObj.baggageClaim);
            smartFlightView.status.set('durationMinutes', statusObj.durationMinutes);

            smartFlightView.status.set('estimatedDeparture', statusObj.estimatedDeparture);
            smartFlightView.status.set('estimatedArrival',  statusObj.estimatedArrival);

            smartFlightView.status.set('actualDeparture', statusObj.actualDeparture);
            smartFlightView.status.set('actualArrival', statusObj.actualArrival);
        }

    },
    
    processFlightStatus : function (statusObj) {

        var status = statusObj.flightStatus[0];


        smartFlightView.status.set('carrierCode',status.primaryCarrierFsCode);
        smartFlightView.status.set('flightNumber',status.flightNumber);
        smartFlightView.status.set('arrivalAirport', status.arrivalAirportFsCode);
        smartFlightView.status.set('departureAirport',status.departureAirportFsCode);

        smartFlightView.status.set('departureTerminal', status.airportResources.departureTerminal);
        smartFlightView.status.set('departureGate',status.airportResources.departureGate);

        smartFlightView.status.set('arrivalTerminal', status.airportResources.arrivalTerminal);
        smartFlightView.status.set('arrivalGate', status.airportResources.arrivalGate);
        smartFlightView.status.set('baggageClaim',  status.airportResources.baggage);
        smartFlightView.status.set('durationMinutes', status.flightDurations.scheduledBlockMinutes);

        var depDate = moment(status.operationalTimes.estimatedGateDeparture.dateUtc), arrDate = moment(status.operationalTimes.estimatedGateArrival.dateUtc);
        smartFlightView.status.set('estimatedDeparture', depDate.format("M/D/YYYY h:mm a"));
        smartFlightView.status.set('estimatedArrival',  arrDate.format("M/D/YYYY h:mm a"));

        smartFlightView.status.set('actualDeparture', null);
        if (status.operationalTimes.actualGateDeparture !== undefined) {
            var depDateAct = moment(status.operationalTimes.actualGateDeparture.dateUtc);
            smartFlightView.status.set('actualDeparture', depDateAct.format("M/D/YYYY h:mm a"));
        }

        smartFlightView.status.set('actualArrival', null);
        if (status.operationalTimes.actualGateArrival !== undefined) {
            var arrDateAct = moment(status.operationalTimes.actualGateArrival.dateUtc);
            smartFlightView.status.set('actualArrival', arrDateAct.format("M/D/YYYY h:mm a"));
        }

        ux.hideKeyboard();
        $('#smartFlightView-flightStatus').removeClass('hidden');
        $('#smartFlightView-DoneBtn').addClass('hidden');
        $('#smartFlightView-SaveBtn').removeClass('hidden');
        $('.flightCreator').addClass('hidden');
    },

    onChangeFlight : function () {
        $('#smartFlightView-flightStatus').addClass('hidden');
        $('.flightCreator').removeClass('hidden');
    },

    onInit: function () {


        smartFlightView.regExA = new RegExp(smartFlightView.regExAirline);
        smartFlightView.regExF= new RegExp(smartFlightView.regExFlight);

        $('#smartFlight-flight').change(function () {
            var code = $('#smartFlight-flight').val();

            if (code.length > 1) {
                var amatch =  smartFlightView.regExA.exec(code);
                var fmatch =  smartFlightView.regExF.exec(code);
                smartFlightView.validFlight = false;
                if (amatch !== null ) {
                    smartFlightView.airline = amatch[0];
                    smartFlightView.validAirline = true;
                    smartFlightView.checkFlight();
                }
                if ( fmatch !== null) {
                    smartFlightView.flight = fmatch[0];
                    smartFlightView.validFlight = true;
                    smartFlightView.checkFlight();
                }

            }

        });

        $('#smartFlight-flightDate').change(function () {
            smartFlightView.date = $('#smartFlight-flightDate').val();
            smartFlightView.validDate = true;
            smartFlightView.checkFlight();
        });

        $('#smartFlight-returnFlightCode').change(function () {
            var retcode = $('#smartFlight-returnFlightCode').val();
            if (retcode.length > 2) {
                var retmatch = smartFlightView.regExA.exec(retcode);
                if (retmatch === null) {
                    $('#smartFlight-returnAirlineLi').addClass('hidden');
                } else {
                    smartEventView.returnAirline = retmatch[0];
                    $('#smartFlight-returnAirlineLi').addClass('hidden');

                }
            }
        });

        $("#smartFlight-airline").kendoAutoComplete({
            dataSource: airlineArray,
            ignoreCase: true,
            dataTextField: "name",
            select: function(e) {
                //var airline = e.item;
                var airline = this.dataItem(e.item.index());
                smartFlightView.airline = airline.abbrev;
                smartFlightView.airlineName = airline.name;
                smartFlightView.validAirline = true;
                smartFlightView.checkFlight();
            },
            filter: "contains",
            placeholder: "Enter airline... "
        });

        $("#smartFlight-returnAirline").kendoAutoComplete({
            dataSource: airlineArray,
            ignoreCase: true,
            dataTextField: "name",
            select: function(e) {

                //var airline = e.item;
                var airline = this.dataItem(e.item.index());
                smartFlightView.returnAirline = airline.abbrev;
            },
            filter: "contains",
            placeholder: "Enter airline... "
        });


    },


    onOpen : function () {

    },

    onReturnFlight : function () {
        $('#smartFlight-airlineLi').removeClass('hidden');
    },

    onFlightSearch : function () {
        smartFlightView.closeModal();
        smartFlightSearchView.openModal(function (flight){
            smartFlightView.openModal(flight);
        })
    },

    initUx : function () {
        $('#smartFlightView-SaveBtn').addClass('hidden');
        $('#smartFlightView-DoneBtn').removeClass('hidden');
        $('#smartFlightView-flightStatus').addClass('hidden');
    },

    setCreatorMode: function () {
        $("#smartFlight-flightDate").val(new Date());
        $('.flightCreator').removeClass('hidden');
    },

    setViewerMode : function ()  {
        $('.flightCreator').addClass('hidden');
    },


    openModal : function (flight, callback) {

        smartFlightView.callback = null;

        smartFlightView.initUx();

        if (callback !== undefined) {
            smartFlightView.callback = callback;
        }

        if ( flight === null) {
            // No current flight - set editor state
           smartFlightView.setCreatorMode();
        } else {
            smartFlightView.setViewerMode();
        }

        smartFlightView.setFlightSTatus(flight);

        $("#modalview-smartFlight").data("kendoMobileModalView").open();

    },

    closeModal : function () {
        $("#modalview-smartFlight").data("kendoMobileModalView").close();
    },

    onDone: function () {
        if (smartFlightView.callback !== null) {
            smartFlightView.callback(null);
        }
        $("#modalview-smartFlight").data("kendoMobileModalView").close();
    },

    onSave : function () {
        if (smartFlightView.callback !== null) {
            smartFlightView.callback(status);
        }
        $("#modalview-smartFlight").data("kendoMobileModalView").close();
    }
};

var smartFlightSearchView = {
    callback : null,
    flight : null,

    onInit: function () {

    },
    onOpen : function () {

    },

    onFlightSearch : function () {

    },

    openModal : function (callback) {

        smartFlightSearchView.callback = callback;
        smartFlightSearchView.flight = null;

        $("#modalview-smartFlightSearch").data("kendoMobileModalView").open();
    },

    closeModal : function () {
        $("#modalview-smartFlightSearch").data("kendoMobileModalView").close();
    },

    onDone: function () {
        $("#modalview-smartFlightSearch").data("kendoMobileModalView").close();
        if (callback !== null) {
            smartFlightSearchView.callback(smartFlightSearchView.flight);
        }
    },

    onSearch : function () {
        //$("#modalview-smartFlightSearch").data("kendoMobileModalView").close();
    }
};

var smartAccountView = {
    onInit: function () {

    },
    onOpen : function () {

    },
    openModal : function () {
        $("#modalview-smartAccount").data("kendoMobileModalView").open();
    },
    closeModal : function () {
        $("#modalview-smartAccount").data("kendoMobileModalView").close();
    },

    onDone: function () {
        $("#modalview-smartAccount").data("kendoMobileModalView").close();
    },

    onSave : function () {
        $("#modalview-smartAccount").data("kendoMobileModalView").close();
    }
};

var smartMedicalView = {
    onInit: function () {
        $('#smartMedical-category').change(function () {

            var value =  $('#smartMedical-category').val();
            $('.smartMedicalTopic').addClass('hidden');

            switch (value) {
                case 'allergy' :
                    $('.smartMedicalAllergy').removeClass('hidden');
                    break;
                case 'medication' :
                    $('.smartMedicalMedication').removeClass('hidden');
                    break;
                case 'practitioner' :
                    $('.smartMedicalPractitioner').removeClass('hidden');
                    break;
                case 'caregiver' :
                    $('.smartMedicalCaregiver').removeClass('hidden');
                    break;
            }
        });
    },
    onOpen : function () {

    },
    openModal : function () {
        // Set the defaults
        $('#smartMedical-category').val('allergy');
        $('.smartMedicalTopic').addClass('hidden');
        $('.smartMedicalAllergy').removeClass('hidden');

        $("#modalview-smartMedical").data("kendoMobileModalView").open();
    },
    closeModal : function () {
        $("#modalview-smartMedical").data("kendoMobileModalView").close();
    },

    onDone: function () {
        $("#modalview-smartMedical").data("kendoMobileModalView").close();
    },

    onSave : function () {
        $("#modalview-smartMedical").data("kendoMobileModalView").close();
    }
};

var smartParkView = {
    onInit: function () {

    },
    onOpen : function () {

    },
    openModal : function () {
        $("#modalview-smartPark").data("kendoMobileModalView").open();
    },
    closeModal : function () {
        $("#modalview-smartPark").data("kendoMobileModalView").close();
    },

    onDone: function () {
        $("#modalview-smartPark").data("kendoMobileModalView").close();
    },

    onSave : function () {

    }
};


var smartAlertView = {
    channelUUID : null,
    channelName : null,

    onInit: function () {
       $('#smartAlertModal-message').change(function (){
           var message = $('#smartAlertModal-message').val();
           if (message.length > 6) {
               $('#smartAlertModal-saveBtn').removeClass('hidden');
           } else {
               $('#smartAlertModal-saveBtn').addClass('hidden');
           }
        });
    },

    onOpen : function () {

    },

    openModal : function (channelUUID, channelName) {

        smartAlertView.channelUUID = channelUUID;
        smartAlertView.channelName = channelName;
        $('#smartAlertModal-message').val("");
        $('#smartAlertModal-saveBtn').addClass('hidden');
        $("#smartAlertModal").data("kendoMobileModalView").open();
    },

    closeModal : function () {
        $("#smartAlertModal").data("kendoMobileModalView").close();
    },

    onDone: function () {
        $("#smartAlertModal").data("kendoMobileModalView").close();
    },

    onSave : function () {
        var message = $('#smartAlertModal-message').val();

        appDataChannel.userAlert(smartAlertView.channelUUID, smartAlertView.channelName, message);
        mobileNotify("Sending IntelliAlert to " + smartAlertView.channelName);
        $("#smartAlertModal").data("kendoMobileModalView").close();
    }
};


var airlineArray = [
    {abbrev: '6A', name: 'AVIACSA'},
    {abbrev: '9K', name: 'Cape Air'},
    {abbrev: 'A0', name: "L'Avion"},
    {abbrev: 'A7', name: 'Air Plus Comet'},
    {abbrev: 'AA', name: 'American'},
    {abbrev: 'AC', name: 'Air Canada'},
    {abbrev: 'AF', name: 'Air France'},
    {abbrev: 'AI', name: 'Air India'},
    {abbrev: 'AM', name: 'Aeromexico'},
    {abbrev: 'AR', name: 'Aerolineas Argentinas'},
    {abbrev: 'AS', name: 'Alaska'},
    {abbrev: 'AT', name: 'Royal Air Maroc'},
    {abbrev: 'AV', name: 'Avianca'},
    {abbrev: 'AY', name: 'Finnair'},
    {abbrev: 'AZ', name: 'Alitalia'},
    {abbrev: 'B6', name: 'JetBlue'},
    {abbrev: 'BA', name: 'British Airways'},
    {abbrev: 'BD', name: 'bmi british midland'},
    {abbrev: 'BR', name: 'EVA Airways'},
    {abbrev: 'C6', name: 'CanJet Airlines'},
    {abbrev: 'CA', name: 'Air China'},
    {abbrev: 'CI', name: 'China'},
    {abbrev: 'CO', name: 'Continental'},
    {abbrev: 'CX', name: 'Cathay'},
    {abbrev: 'CZ', name: 'China Southern'},
    {abbrev: 'DL', name: 'Delta'},
    {abbrev: 'EI', name: 'Aer Lingus'},
    {abbrev: 'EK', name: 'Emirates'},
    {abbrev: 'EO', name: 'EOS'},
    {abbrev: 'F9', name: 'Frontier'},
    {abbrev: 'FI', name: 'Icelandair'},
    {abbrev: 'FJ', name: 'Air Pacific'},
    {abbrev: 'FL', name: 'AirTran'},
    {abbrev: 'G4', name: 'Allegiant'},
    {abbrev: 'GQ', name: 'Big Sky'},
    {abbrev: 'HA', name: 'Hawaiian'},
    {abbrev: 'HP', name: 'America West'},
    {abbrev: 'HQ', name: 'Harmony'},
    {abbrev: 'IB', name: 'Iberia'},
    {abbrev: 'JK', name: 'Spanair'},
    {abbrev: 'JL', name: 'JAL'},
    {abbrev: 'JM', name: 'Air Jamaica'},
    {abbrev: 'KE', name: 'Korean'},
    {abbrev: 'KU', name: 'Kuwait'},
    {abbrev: 'KX', name: 'Cayman'},
    {abbrev: 'LA', name: 'LanChile'},
    {abbrev: 'LH', name: 'Lufthansa'},
    {abbrev: 'LO', name: 'LOT'},
    {abbrev: 'LT', name: 'LTU'},
    {abbrev: 'LW', name: 'Pacific Wings'},
    {abbrev: 'LX', name: 'SWISS'},
    {abbrev: 'LY', name: 'El Al'},
    {abbrev: 'MA', name: 'MALEV'},
    {abbrev: 'MH', name: 'Malaysia'},
    {abbrev: 'MU', name: 'China Eastern'},
    {abbrev: 'MX', name: 'Mexicana'},
    {abbrev: 'NH', name: 'ANA'},
    {abbrev: 'NK', name: 'Spirit'},
    {abbrev: 'NW', name: 'Northwest'},
    {abbrev: 'NZ', name: 'Air New Zealand'},
    {abbrev: 'OS', name: 'Austrian'},
    {abbrev: 'OZ', name: 'Asiana'},
    {abbrev: 'PN', name: 'Pan American'},
    {abbrev: 'PR', name: 'Philippine'},
    {abbrev: 'QF', name: 'Qantas'},
    {abbrev: 'QK', name: 'Air Canada Jazz'},
    {abbrev: 'RG', name: 'VARIG'},
    {abbrev: 'SA', name: 'South African'},
    {abbrev: 'SK', name: 'SAS'},
    {abbrev: 'SN', name: 'SN Brussels'},
    {abbrev: 'SQ', name: 'Singapore'},
    {abbrev: 'SU', name: 'Aeroflot'},
    {abbrev: 'SY', name: 'Sun Country'},
    {abbrev: 'TA', name: 'Taca'},
    {abbrev: 'TG', name: 'Thai'},
    {abbrev: 'TK', name: 'Turkish'},
    {abbrev: 'TN', name: 'Air Tahiti Nui'},
    {abbrev: 'TP', name: 'TAP'},
    {abbrev: 'TS', name: 'Air Transat'},
    {abbrev: 'U5', name: 'USA 3000'},
    {abbrev: 'UA', name: 'United'},
    {abbrev: 'UP', name: 'Bahamasair'},
    {abbrev: 'US', name: 'US Air'},
    {abbrev: 'V3', name: 'Copa'},
    {abbrev: 'VS', name: 'Virgin Atlantic'},
    {abbrev: 'VX', name: 'Virgin America'},
    {abbrev: 'WA', name: 'Western'},
    {abbrev: 'WN', name: 'Southwest'},
    {abbrev: 'WS', name: 'WestJet'},
    {abbrev: 'XE', name: 'ExpressJet'},
    {abbrev: 'Y2', name: 'Globespan'},
    {abbrev: 'Y7', name: 'Silverjet'},
    {abbrev: 'YV', name: 'Mesa'},
    {abbrev: 'YX', name: 'Midwest'},
    {abbrev: 'ZK', name: 'Great Lakes '}
];