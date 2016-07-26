/**
 * Created by donbrad on 1/20/16.
 */

'use strict';

var smartFlight = {

    _cloudClass : 'smartFlight',
    _ggClass : 'Flight',
    _version : 1,
    airline : null,
    flight: null,
    date: null,
    flightsDS : null,

    init : function (e) {
        smartFlight.flightsDS = new kendo.data.DataSource({  // this is the gallery datasource
            type: 'everlive',
            transport: {
                typeName: 'smartFlight'
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            autoSync: true
        });
        smartFlight.flightsDS.fetch();
    },

    create : function (flightObj) {

    },

    update : function (flightObj) {

    },

    delete : function (flightObj) {

    },

    getFlightStatusById : function (flightId, callback) {

    },

    getFlightStatus : function (flightId, callback) {

    }
};