/**
 * Created by donbrad on 1/20/16.
 */

'use strict';

var smartTrip = {

    _cloudClass : 'smartTrip',
    _ggClass : 'Trip',
    _version : 1,
    tripsDS : null,

    init : function (e) {
        smartTrip.tripsDS = new kendo.data.DataSource({  // this is the gallery datasource
            type: 'everlive',
            transport: {
                typeName: 'smartTrip'
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            autoSync: true
        });
        smartTrip.tripsDS.fetch();
    },

    sync : function () {
        smartTrip.tripsDS.sync();
    },

    findTrip: function (uuid) {
        var result = smartTrip.queryTrip({ field: "uuid", operator: "eq", value: uuid });

        return(result);
    },

    queryTrip : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = smartTrip.tripsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return (view[0]);
    },


    smartAddTrip : function (objectIn, callback) {
        var objectId = objectIn.uuid;

        var trip = smartTrip.findTrip(objectId);
        if ( event  === undefined) {
            // Event doesnt exist -- need to create it
            smartTrip.addTrip(objectIn, callback);
        } else {
            // Event exists, so just return current instance
            if (callback !== undefined && callback !== null) {
                callback(event);
            }
        }
    },


    addTrip : function (objectIn, callback) {

        var smartOb = new kendo.data.ObservableObject();

        mobileNotify("Creating IntelliTrip...");

        if (objectIn.senderUUID === undefined || objectIn.senderUUID === null) {
            objectIn.senderUUID = userModel._user.userUUID;
        }

        if (objectIn.uuid === undefined) {
            objectIn.uuid = uuid.v4();
        }

        //smartOb.setACL(userModel.parseACL);
        smartOb.set('version', smartTrip.version);
        smartOb.set('ggType', smartTrip._ggClass);
        smartOb.set('uuid', objectIn.uuid);
        //smartOb.set('Id', objectIn.uuid);
        smartOb.set('senderUUID', objectIn.senderUUID);
        smartOb.set('senderName', objectIn.senderName);

        smartOb.set('name', objectIn.name);
        smartOb.set('tripType', objectIn.tripType);
        smartOb.set('travelMode', objectIn.travelMode);
        smartOb.set('autoStatus', objectIn.autoStatus);
        smartOb.set('addToCalendar',  objectIn.addToCalendar);
        smartOb.set('leg1Complete',  objectIn.leg1Complete);
        smartOb.set('leg2Complete',  objectIn.leg2Complete);;
        smartOb.set('origin', objectIn.origin);
        smartOb.set('originName', objectIn.originName);
        smartOb.set('destination', objectIn.destination);
        smartOb.set('destinationName', objectIn.destinationName);
        smartOb.set('departure', objectIn.departure);
        smartOb.set('arrival', objectIn.arrival);
        smartOb.set('duration', objectIn.duration);

        smartTrip.tripsDS.add(smartOb);
        smartTrip.tripsDS.sync();
        if (callback !== undefined && callback !== null)
            callback(smartOb);

        everlive.createOne(smartTrip._cloudClass, smartOb, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating intelliTrip " + JSON.stringify(error));
            } else {
                // Add the everlive object with everlive created Id to the datasource

            }
        });

    }

};