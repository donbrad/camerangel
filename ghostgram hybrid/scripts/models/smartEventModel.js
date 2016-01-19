/**
 * Created by donbrad on 12/17/15.
 */
'use strict';

var smartEvent = {
    // date/place : -1 optional, 0 not used,  1  required
    termMap : [
        {term: "call", category: "action", type: "meeting", composite: true, date: 1, place: 0, info: 0},
        {term: "conference", category: "action", type: "meeting", composite: true, date: 1, place: 0, info: 1},
        {term: "coffee", category: "action", type: "meeting", composite: true, date: 1, place: 1, info: 0},
        {term: "beers", category: "action", type: "meeting", composite: true, date: 1, place: 1, info: 0},
        {term: "breakfast", category: "action", type: "meeting", composite: true, date: 1, place: 1, info: 0},
        {term: "brunch", category: "action", type: "meeting", composite: true, date: 1, place: 1, info: 0},
        {term: "lunch", category: "action", type: "meeting", composite: true, date: 1, place: 1, info: 0},
        {term: "dinner", category: "action", type: "meeting", composite: true, date: 1, place: 1, info: 0},
        {term: "drinks", category: "action", type: "meeting", composite: true, date: 1, place: 1, info: 0},
        {term: "cocktails", category: "action", type: "meeting", composite: true, date: 1, place: 1, info: 0},
        {term: "dessert", category: "action", type: "meeting", composite: true, date: 1, place: -1, info: 0},
        {term: "meeting", category: "action", type: "meeting", composite: true, date: 1, place: 1, info: 0},
        {term: "theatre", category: "action", type: "event", composite: true, date: 1, place: 1, info: 1},
        {term: "concert", category: "action", type: "event", composite: true, date: 1, place: 1, info: 0},
        {term: "flight", category: "action", type: "flight", composite: true, date: 1, place: 1, info: 1},
        {term: "rideshare", category: "action", type: "meeting", composite: true, date: 1, place: 1, info: 0},
        {term: "shopping", category: "action", type: "activity", composite: true, date: 1, place: 1, info: 0},
        {term: "run", category: "action", type: "activity", composite: true, date: 1, place: 1, info: 0},
        {term: "jog", category: "action", type: "activity", composite: true, date: 1, place: 1, info: 0},
        {term: "hike", category: "action", type: "activity", composite: true, date: 1, place: 1, info: 0},
        {term: "bike", category: "action", type: "activity", composite: true, date: 1, place: 1, info: 0},
        {term: "watch", category: "action", type: "tvshow", composite: true, date: 1, place: -1, info: 0},
        {term: "movie", category: "action", type: "meeting", composite: true, date: 1, place: -1, info: 0},
        {term: "movies", category: "action", type: "movies", composite: true},
        {term: "goto", category: "action", type: "event", composite: true, date: 1, place: -1, info: 0},
        {term: "tvshow", category: "action", type: "tvshow", composite: true, date: 1, place: 0, info: 0},
        {term: "tvmovie", category: "action", type: "tvmovie", composite: true, date: 1, place: 0, info: 0},
        {term: "showing", category: "action", type: "movie", composite: true, date: 1, place: 0, info: 0},
        {term: "am", category: "calendar", type: "time", composite: true},
        {term: "pm", category: "calendar", type: "time", composite: true},
        {term: "oclock", category: "calendar", type: "time", composite: true},
        {term: "tomorrow", category: "calendar", type: "datejs", composite: false},
        {term: "today", category: "calendar", type: "datejs", composite: false},
        {term: "week", category: "calendar", type: "datejs", composite: false},
        {term: "month", category: "calendar", type: "datejs", composite: false},
        {term: "morning", category: "calendar", type: "time-macro", composite: false, start: "5:00am", end: "11:00am" },
        {term: "early morning", category: "calendar", type: "time-macro", composite: false, start: "5:00am", end: "8:00am"},
        {term: "late morning", category: "calendar", type: "time-macro", composite: false, start: "9:00am", end: "11:00am"},
        {term: "midmorning", category: "calendar", type: "time-macro", composite: false, start: "8:00am", end: "10:00am"},
        {term: "afternoon", category: "calendar", type: "time-macro", composite: false, start: "1:00pm", end: "5:00pm"},
        {term: "early afternoon", category: "calendar", type: "time-macro", composite: false, start: "1:00pm", end: "3:00pm"},
        {term: "evening", category: "calendar", type: "time-macro", composite: false, start: "5:00am", end: "11:00am"},
        {term: "night", category: "calendar", type: "time-macro", composite: false, start: "7:00pm", end: "9:00pm"},
        {term: "late night", category: "calendar", type: "time-macro", composite: false, start: "10:00pm", end: "2:00am"},
        {term: "early evening", category: "calendar", type: "time-macro", composite: false, start: "5:00pm", end: "7:00pm"},
        {term: "next", category: "calendar", type: "datejs", composite: true},
        {term: "second", category: "calendar", type: "datejs", composite: true},
        {term: "mon", category: "calendar", type: "day", composite: true},
        {term: "tue", category: "calendar", type: "day", composite: true},
        {term: "wed", category: "calendar", type: "day", composite: true},
        {term: "thu", category: "calendar", type: "day", composite: true},
        {term: "fri", category: "calendar", type: "day", composite: true},
        {term: "sat", category: "calendar", type: "day", composite: true},
        {term: "sun", category: "calendar", type: "day", composite: true},
        {term: "monday", category: "calendar", type: "day", composite: true},
        {term: "tuesday", category: "calendar", type: "day", composite: true},
        {term: "wednesday", category: "calendar", type: "day", composite: true},
        {term: "thursday", category: "calendar", type: "day", composite: true},
        {term: "friday", category: "calendar", type: "day", composite: true},
        {term: "saturday", category: "calendar", type: "day", composite: true},
        {term: "sunday", category: "calendar", type: "day", composite: true},
        {term: "jan", category: "calendar", type: "month", composite: true},
        {term: "feb", category: "calendar", type: "month", composite: true},
        {term: "mar", category: "calendar", type: "month", composite: true},
        {term: "apr", category: "calendar", type: "month", composite: true},
        {term: "may", category: "calendar", type: "month", composite: true},
        {term: "jun", category: "calendar", type: "month", composite: true},
        {term: "jul", category: "calendar", type: "month", composite: true},
        {term: "aug", category: "calendar", type: "month", composite: true},
        {term: "sep", category: "calendar", type: "month", composite: true},
        {term: "oct", category: "calendar", type: "month", composite: true},
        {term: "nov", category: "calendar", type: "month", composite: true},
        {term: "dec", category: "calendar", type: "month", composite: true},
        {term: "january", category: "calendar", type: "month", composite: true},
        {term: "february", category: "calendar", type: "month", composite: true},
        {term: "march", category: "calendar", type: "month", composite: true},
        {term: "april", category: "calendar", type: "month", composite: true},
        {term: "may", category: "calendar", type: "month", composite: true},
        {term: "june", category: "calendar", type: "month", composite: true},
        {term: "july", category: "calendar", type: "month", composite: true},
        {term: "august", category: "calendar", type: "month", composite: true},
        {term: "september", category: "calendar", type: "month", composite: true},
        {term: "october", category: "calendar", type: "month", composite: true},
        {term: "november", category: "calendar", type: "month", composite: true},
        {term: "december", category: "calendar", type: "month", composite: true},
        {term: "near", category: "target", type: "location", composite: true},
        {term: "in", category: "target", type: "location", composite: true},
        {term: "at", category: "target", type: "ambig", composite: true},
        {term: "on", category: "target", type: "ambig", composite: true},
        {term: "title", category: "photo", type: "meta", composite: false},
        {term: "tags", category: "photo", type: "meta", composite: false},
        {term: "description", category: "photo", type: "meta", composite: false}


    ],

    timeMacroList : [
        {term: "morning", start: "6:30am", end: "8:30am"},
        {term: "midmorning", start: "8:30am", end: "10:30am"},
        {term: "noon", start: "11:30am", end: "12:30pm"},
        {term: "afternoon", start: "1:00pm", end: "5:00pm"},
        {term: "evening", start: "5:00pm", end: "9:00pm"},
        {term: "night", start: "8:00pm", end: "11:30pm"}
    ],

    termsDS : null,

    objectsDS: new kendo.data.DataSource({
        offlineStorage:"smartEvent",
        sort: {
            field: "date",
            dir: "desc"
        }
    }),

    init : function () {
        smartEvent.termsDS = new kendo.data.DataSource({
            data: smartEvent.termMap
        });
    },


    fetch : function () {
        var smartObjects = Parse.Object.extend("smartobject");
        var query = new Parse.Query(smartObjects);

        query.find({
            success: function(collection) {
                var models = [];
                for (var i = 0; i < collection.length; i++) {
                    var smartObj = collection[i];

                    models.push(smartObj.toJSON());
                }
                deviceModel.setAppState('hasSmartObjects', true);
                smartEvent.objectsDS.data(models);
                deviceModel.isParseSyncComplete();
            },
            error: function(error) {
                handleParseError(error);
            }
        });
    },

    queryTerm: function (query) {

        if (query === undefined)
            return(undefined);
        var dataSource = smartEvent.termsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);

    },

    queryObjects: function (query) {

        if (query === undefined)
            return(undefined);
        var dataSource = smartEvent.objectsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);

    },

    queryObject: function (query) {

        if (query === undefined)
            return(undefined);
        var dataSource = smartEvent.objectsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        if (view.items === undefined) {
            return(undefined)
        } else {
            return (view[0]);
        }



    },

    // Find all objects that aren't deleted...
    findObject: function (uuid) {
        var result = smartEvent.queryObject([{ field: "uuid", operator: "eq", value: uuid }, { field: "isDeleted", operator: "eq", value: false }]);

        return(result);
    },


    getActionNames : function () {

        var nameList = [], results = smartEvent.queryTerm({ field: "category", operator: "eq", value: 'action' });

        for (var i=0; i<results.length; i++) {
            nameList.push(results[i].term);
        }

        return(nameList);
    },

    isCurrentAction : function (termIn) {
        var target = termIn.toLowerCase();
        var termList = smartEvent.queryTerm({ field: "action", operator: "eq", value: target });

        if (termList.length > 0) {
            return(true);
        }

        return(false);
    },

    findTerm: function (termIn) {
        var target = termIn.toLowerCase();
        var termList = smartEvent.queryTerm({ field: "term", operator: "eq", value: target });

        return(termList);

    },

    containsTerm: function (termIn) {
        var target = termIn.toLowerCase();
        var termList = smartEvent.queryTerm({ field: "term", operator: "contains", value: target });

        return(termList);

    },

    startsWithTerm: function (termIn) {
        var target = termIn.toLowerCase();
        var termList = smartEvent.queryTerm({ field: "term", operator: "startswith", value: target });

        return(termList);

    },

    smartAddObject : function (objectIn, callback) {
        var objectId = objectIn.uuid;

        if (smartEvent.findObject(objectId) === undefined) {

            smartEvent.addObject(objectIn, callback);
        }
    },

    // process accept for this user as recipient (another user is creator / sender)
    accept : function (eventId, senderId, comment) {
        var event = smartEvent.findObject(eventId);
        if (event !== undefined) {
            event.set('isAccepted', true);
            event.set('isDeclined', false);

            appDataChannel.eventAccept(eventId, senderId, userModel.currentUser.userUUID, comment);
            updateParseObject('smartobject', 'uuid', eventId, 'isAccepted', true);
            updateParseObject('smartobject', 'uuid', eventId, 'isDeclined', false);
        }

    },
    // process decline for this user as recipient (another user is creator / sender)
    decline : function (eventId, senderId, comment) {
        var event = smartEvent.findObject(eventId);
        if (event !== undefined) {
            event.set('isAccepted', false);
            event.set('isDeclined', true);

            appDataChannel.eventDecline(eventId, senderId, userModel.currentUser.userUUID, comment);
            updateParseObject('smartobject', 'uuid', eventId, 'isAccepted', false);
            updateParseObject('smartobject', 'uuid', eventId, 'isDeclined', true);
        }
    },

    // Process accept from a recipeient
    recipientAccept : function (eventId, recipientId, comment) {
        var event = smartEvent.findObject(eventId);
        if (event !== undefined) {
            var rsvpList = event.rsvpList;


            var contact = contactModel.findContact(recipientId);
            if (contact !== undefined) {
                var commentObj = {
                    date: new Date(),
                    isAccepted: true,
                    contactId: recipientId,
                    contactName: contact.name,
                    comment: comment
                };

                event.rsvpList.push(commentObj);
                updateParseObject('smartobject', 'uuid', eventId, 'rsvpList', event.rsvpList);
            }

        }

    },

    recipientDecline : function (eventId, recipientId, comment) {
        var event = smartEvent.findObject(eventId);
        if (event !== undefined) {
            var rsvpList = event.rsvpList;


            var contact = contactModel.findContact(recipientId);
            if (contact !== undefined) {
                var commentObj = {
                    date: new Date(),
                    isAccepted: false,
                    contactId: recipientId,
                    contactName: contact.name,
                    comment: comment
                };

                event.rsvpList.push(commentObj);
                updateParseObject('smartobject', 'uuid', eventId, 'rsvpList', event.rsvpList);
            }

        }
    },


    update : function (eventId, eventObj, comment) {
        var event = smartEvent.findObject(eventId);
        if (event !== undefined) {


        }
    },

    cancel : function (eventId, comment) {
        var event = smartEvent.findObject(eventId);
        if (event !== undefined) {
            event.set('wasCancelled', true);
            updateParseObject('smartobject', 'uuid', eventId, 'wasCancelled', true);
        }
    },

    addObject : function (objectIn, callback) {
        var SmartObjects = Parse.Object.extend("smartobject");
        var smartOb = new SmartObjects();


        mobileNotify("Creating Smart Event...");

        if (objectIn.senderUUID === undefined || objectIn.senderUUID === null) {
            objectIn.senderUUID = userModel.currentUser.userUUID;
        }

        smartOb.setACL(userModel.parseACL);
        smartOb.set('uuid', objectIn.uuid);
        smartOb.set('senderUUID', objectIn.senderUUID);
        smartOb.set('senderName', objectIn.senderName);
        smartOb.set('channelId', objectIn.channelId);
        smartOb.set('calendarId', objectIn.calendarId);
        smartOb.set('eventChatId', objectIn.eventChatId);
        smartOb.set('action', objectIn.action);
        smartOb.set('type', objectIn.type);
        smartOb.set('title', objectIn.title);
        smartOb.set('description', objectIn.description);
        // Parse.com date gymnastics...
        var dateString = new Date(objectIn.date).toISOString();
        var d = {"__type":"Date","iso":dateString};
        smartOb.set('date', d);
        smartOb.set('duration', objectIn.duration);
        smartOb.set('durationString', objectIn.durationString);
        smartOb.set('approxTime', objectIn.approxTime);
        smartOb.set('approxPlace', objectIn.approxPlace);
        smartOb.set('address', objectIn.address);
        smartOb.set('lat', objectIn.lat);
        smartOb.set('lng', objectIn.lng);
        smartOb.set('placeId', objectIn.placeId);
        smartOb.set('placeFlexible', objectIn.placeFlexible);
        smartOb.set('timeFlexible', objectIn.timeFlexible);
        smartOb.set('isAccepted', objectIn.isAccepted);
        smartOb.set('isModified', objectIn.isModified);
        smartOb.set('isDeleted', objectIn.isDeleted);
        smartOb.set('wasCancelled', objectIn.wasCancelled);
        smartOb.set('inviteList', objectIn.inviteList);
        smartOb.set('rsvpList', objectIn.rsvpList);

        var smartObj = smartOb.toJSON();
        smartEvent.objectsDS.add(smartObj);

        smartOb.save(null, {
            success: function(thisObject) {
                // Execute any logic that should take place after the object is saved.;

                if (callback !== undefined) {
                    callback(thisObject.toJSON());
                }


            },
            error: function(contact, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                handleParseError(error);
            }
        });
    },

    removeFromList: function (list, target) {
        var filteredList = list.filter(function(elem){
            return elem != target;
        });

        return(filteredList);
    }


};