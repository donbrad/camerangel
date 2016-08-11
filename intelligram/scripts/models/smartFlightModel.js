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
            autoSync: true,
            change : todayModel.change(e, smartFlight._ggClass)
        });


        smartFlight.flightsDS.fetch();
    },

    sync : function ()  {
        smartFlight.flightsDS.sync();
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