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
        {term: "goto", category: "action", type: "event", composite: true, date: 1, place: -1, info: 0},
        {term: "show", category: "action", type: "tvshow", composite: true, date: 1, place: 0, info: 0}
    ],

    termsDS : null,


    init : function () {
        smartObject.termsDS = new kendo.data.DataSource({
            data: smartObject.termMap
        });
    }

};