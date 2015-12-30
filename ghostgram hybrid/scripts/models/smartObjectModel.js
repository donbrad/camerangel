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
        {term: "shopping", category: "action", type: "meeting", composite: true, date: 1, place: 1, info: 0},
        {term: "run", category: "action", type: "meeting", composite: true, date: 1, place: 1, info: 0},
        {term: "jog", category: "action", type: "meeting", composite: true, date: 1, place: 1, info: 0},
        {term: "hike", category: "action", type: "meeting", composite: true, date: 1, place: 1, info: 0},
        {term: "bike", category: "action", type: "meeting", composite: true, date: 1, place: 1, info: 0},
        {term: "watch", category: "action", type: "meeting", composite: true, date: 1, place: -1, info: 0},
        {term: "movie", category: "action", type: "meeting", composite: true, date: 1, place: -1, info: 0},
        {term: "goto", category: "action", type: "event", composite: true, date: 1, place: -1, info: 0},
        {term: "show", category: "action", type: "tvshow", composite: true, date: 1, place: 0, info: 0},
        {term: "tomorrow", category: "calendar", type: "date", composite: false},
        {term: "today", category: "calendar", type: "date", composite: false},
        {term: "week", category: "calendar", type: "date", composite: false},
        {term: "month", category: "calendar", type: "date", composite: false},
        {term: "morning", category: "calendar", type: "time", composite: false},
        {term: "afternoon", category: "calendar", type: "time", composite: false},
        {term: "evening", category: "calendar", type: "time", composite: false},
        {term: "night", category: "calendar", type: "time", composite: false},
        {term: "next", category: "calendar", type: "time", composite: true},
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
        {term: "title", category: "photo", type: "meta", composite: false},
        {term: "tags", category: "photo", type: "meta", composite: false},
        {term: "description", category: "photo", type: "meta", composite: false}


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