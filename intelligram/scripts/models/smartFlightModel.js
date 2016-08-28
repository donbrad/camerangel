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
    _fetched : false,
    _initialSync : false,
    _todayArray : [],
    flightsDS : null,

    init : function (e) {
        smartFlight.flightsDS = new kendo.data.DataSource({  // this is the gallery datasource
            type: 'everlive',
            transport: {
                typeName: 'smartFlight'
            },
            schema: {
                model: { Id:  Everlive.idField}
            }
        });

        smartFlight.flightsDS.bind("change", function (e) {
            var changedTrips = e.items;
            if (e.action === undefined) {
                if (changedTrips !== undefined && !smartFlight._initialSync) {

                    smartFlight._initialSync = true;
                    smartFlight._todayArray = smartTrip.getTodayList();
                }

            } else {

                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                        var flight = e.items[0];
                        break;

                    case "remove" :
                        var flight = e.items[0];
                        todayModel.remove(trip);
                        break;

                    case "sync" :

                        break;

                    case "add" :
                        var today = moment();
                        var flight = e.items[0];
                        if (moment(today).isBetween(flight.estimatedDeparture, flight.estimatedArrival, 'day') ) {
                            todayModel.add(flight);
                        }
                        break;
                }
            }


        });

        smartFlight.flightsDS.bind("requestEnd", function (e) {
            var response = e.response,  type = e.type;

            if (type === 'read' && response) {
                if (!smartFlight._fetched) {
                    smartFlight._fetched = true;
                }
            }
        });
        smartFlight.flightsDS.fetch();
    },

    sync : function ()  {
        smartFlight.flightsDS.sync();
    },

    getTodayList : function () {
        // Does flight span today
        var len = smartFlight.flightsDS.total();
        var todayArray = [];
        var today = moment();
        for (var i=0; i<len; i++) {
            var flight = smartFlight.flightsDS.at(i);
            if (moment(today).isBetween(flight.estimatedDeparture, flight.estimatedArrival, 'day') ) {
                todayArray.push(movie);
            }

        }
        return(todayArray);
    },

    queryFlight : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = smartFlight.flightsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return (view[0]);
    },


    findFlight: function (uuid) {
        var result = smartFlight.queryFlight({ field: "uuid", operator: "eq", value: uuid });

        return(result);
    },

    getFlightStatusById : function (flightId, callback) {

    },

    getFlightStatus : function (flightId, callback) {

    },

    smartAddFlight : function (objectIn, callback) {
        var objectId = objectIn.uuid;

        if (objectId === undefined) {
            smartFlight.addFlight(objectIn, callback);
        } else {
            var flight = smartFlight.findFlight(objectId);
            if ( flight  === undefined) {
                // Event doesnt exist -- need to create it
                smartFlight.addFlight(objectIn, callback);
            } else {
                // Event exists, so just return current instance
                if (callback !== undefined && callback !== null) {
                    callback(flight);
                }
            }
        }


    },

    addFlight : function (objectIn, callback) {

        var flight = new kendo.data.ObservableObject();
        mobileNotify("Creating IntelliFlight...");

        if (objectIn.senderUUID === undefined || objectIn.senderUUID === null) {
            objectIn.senderUUID = userModel._user.userUUID;
        }

        if (objectIn.senderName === undefined || objectIn.senderName === null) {
            objectIn.senderName = userModel._user.name;
        }

        if (objectIn.uuid === undefined) {
            objectIn.uuid = uuid.v4();
        }


        //smartOb.setACL(userModel.parseACL);
        flight.version =  smartFlight._version;
        objectIn.ggType = smartFlight._ggClass;


        smartFlight.flightsDS.add(objectIn);
        smartFlight.flightsDS.sync();
        if (callback !== undefined && callback !== null)
            callback(objectIn);

        everlive.createOne(smartFlight._cloudClass, objectIn, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating intelliFlight " + JSON.stringify(error));
            } else {
                // Add the everlive object with everlive created Id to the datasource

            }
        });

    }


};