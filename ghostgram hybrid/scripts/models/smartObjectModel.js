/**
 * Created by donbrad on 12/17/15.
 */
'use strict';

var smartObject = {
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
        {term: "morning", category: "calendar", type: "time-macro", composite: false},
        {term: "midmorning", category: "calendar", type: "time-macro", composite: false},
        {term: "afternoon", category: "calendar", type: "time-macro", composite: false},
        {term: "evening", category: "calendar", type: "time-macro", composite: false},
        {term: "night", category: "calendar", type: "time-macro", composite: false},
        {term: "next", category: "calendar", type: "datejs", composite: true},
        {term: "second", category: "calendar", type: "datejs", composite: true},
        {term: "mon", category: "calendar", type: "day", composite: true},
        {term: "tue", category: "calendar", type: "day", composite: true},
        {term: "wed", category: "calendar", type: "day", composite: true},
        {term: "thu", category: "calendar", type: "day", composite: true},
        {term: "fri", category: "calendar", type: "day", composite: true},
        {term: "sat", category: "calendar", type: "day", composite: true},
        {term: "sun", category: "calendar", type: "day", composite: true},
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


    init : function () {
        smartObject.termsDS = new kendo.data.DataSource({
            data: smartObject.termMap
        });
    },

    queryTerm: function (query) {

        if (query === undefined)
            return(undefined);
        var dataSource = smartObject.termsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);

    },


    findTerm: function (termIn) {
        var target = termIn.toLowerCase();
        var termList = smartObject.queryTerm({ field: "term", operator: "eq", value: target });

        return(termList);

    },

    containsTerm: function (termIn) {
        var target = termIn.toLowerCase();
        var termList = smartObject.queryTerm({ field: "term", operator: "contains", value: target });

        return(termList);

    },

    startsWithTerm: function (termIn) {
        var target = termIn.toLowerCase();
        var termList = smartObject.queryTerm({ field: "term", operator: "startswith", value: target });

        return(termList);

    }


};