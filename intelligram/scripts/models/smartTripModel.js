/**
 * Created by donbrad on 1/20/16.
 */

'use strict';

var smartTrip = {

    _cloudClass : 'smartTrip',
    _ggClass : 'Trip',
    _version : 1,
    _fetched : false,
    _initialSync : false,
    _todayArray : [],
    tripsDS : null,

    init : function (e) {
        smartTrip.tripsDS = new kendo.data.DataSource({  // this is the gallery datasource
            type: 'everlive',
            transport: {
                typeName: 'smartTrip'
            },
            schema: {
                model: { Id:  Everlive.idField}
            }
        });
        smartTrip.tripsDS.fetch();

        smartTrip.tripsDS.bind("change", function (e) {
            var changedTrips = e.items;
            if (e.action === undefined) {
                if (changedTrips !== undefined && !smartTrip._initialSync) {

                    smartTrip._initialSync = true;
                    smartTrip._todayArray = smartTrip.getTodayList();
                }

            } else {

                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                        var trip = e.items[0];
                        break;

                    case "remove" :
                        var trip = e.items[0];
                        todayModel.remove(trip);
                        break;

                    case "sync" :

                        break;

                    case "add" :
                        var today = moment();
                        var trip = e.items[0];
                        if (moment(today).isBetween(trip.departure, trip.arrival, 'day') ) {
                            todayModel.add(trip);
                        }
                        break;
                }
            }


        });

        smartTrip.tripsDS.bind("requestEnd", function (e) {
            var response = e.response,  type = e.type;

            if (type === 'read' && response) {
                if (!smartTrip._fetched) {
                    smartTrip._fetched = true;
                }
            }
        });
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

    getTodayList : function () {
        // Does flight span today
        var len = smartTrip.tripsDS.total();
        var todayArray = [];
        var today = moment();
        for (var i=0; i<len; i++) {
            var trip = smartTrip.tripsDS.at(i);
            var departure = moment(trip.departure), arrival = moment(trip.arrival);
            if (moment(today).isBetween(departure, arrival, 'day') ) {
                todayArray.push(trip);
            }

        }
        return(todayArray);
    },

    renderTrip : function (smartTrip) {
        var  objectId = smartTrip.uuid;

        var template = kendo.template($("#intelliTrip-chat").html());

        var dest = smartTrip.destination.address;
        var orig = smartTrip.origin.address;


        if (smartTrip.destination.name !== null) {
            dest = smartTrip.destination.name;
        }

        if (smartTrip.origin.name !== null) {
            orig = smartTrip.origin.name;
        }

        var dataObj = {
            ggType: "Trip",
            name: smartTrip.name,
            origin: orig,
            destination: dest,
            departure: moment(smartTrip.departure).format ("ddd, M/D @ h:mm a"),
            arrival: moment(smartTrip.arrival).format ("ddd, M/D @ h:mm a"),
            durationString: smartTrip.durationString,
            distanceString: smartTrip.distanceString,
            objectId : objectId,
            tripTimeType: smartTrip.tripTimeType
        };

        var objectUrl = template(dataObj);

        return(objectUrl);
    },

    smartAddTrip : function (objectIn, callback) {
        var objectId = objectIn.uuid;

        if (objectId === undefined) {
            smartTrip.addTrip(objectIn, callback);
        } else {
            var trip = smartTrip.findTrip(objectId);
            if ( trip  === undefined) {
                // Trip doesnt exist -- need to create it
                smartTrip.addTrip(objectIn, callback);
            } else {
                // Trip exists, so just return current instance
                if (callback !== undefined && callback !== null) {
                    callback(trip);
                }
            }
        }
    },


    addTrip : function (objectIn, callback) {

        var smartOb = new kendo.data.ObservableObject();

        mobileNotify("Creating IntelliTrip...");

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
        smartOb.set('version', smartTrip.version);
        smartOb.set('ggType', smartTrip._ggClass);
        smartOb.set('uuid', objectIn.uuid);
        //smartOb.set('Id', objectIn.uuid);
        smartOb.set('senderUUID', objectIn.senderUUID);
        smartOb.set('senderName', objectIn.senderName);

        if(objectIn.name !== null){
            smartOb.set('name', objectIn.name);
        } else {
            smartOb.set('name', "My Trip");
        }
        smartOb.set('tripType', objectIn.tripType);
        smartOb.set('travelMode', objectIn.travelMode);
        smartOb.set('autoStatus', objectIn.autoStatus);
        smartOb.set('addToCalendar',  objectIn.addToCalendar);
        smartOb.set('leg1Complete',  objectIn.leg1Complete);
        smartOb.set('leg2Complete',  objectIn.leg2Complete);
        smartOb.set('origin', objectIn.origin);
        smartOb.set('originName', objectIn.originName);
        smartOb.set('destination', objectIn.destination);
        smartOb.set('destinationName', objectIn.destinationName);
        smartOb.set('departure', getMomentDate(objectIn.departure));
        smartOb.set('arrival', getMomentDate(objectIn.arrival));
        smartOb.set('duration', objectIn.duration);
        smartOb.set('durationString', objectIn.durationString);
        smartOb.set('distance', objectIn.distance);
        smartOb.set('distanceString', objectIn.distanceString);
        smartOb.set('dateDeparture', objectIn.dateDeparture);
        smartOb.set('dateArrival', objectIn.dateArrival);
        smartOb.set('timeDeparture', objectIn.timeDeparture);
        smartOb.set('timeArrival', objectIn.timeArrival);
        smartOb.set('tripTimeType', objectIn.tripTimeType);

        smartOb.Id = uuid.v4();
        smartTrip.tripsDS.add(smartOb);
        smartTrip.tripsDS.sync();
        if (callback !== undefined && callback !== null)
            callback(smartOb);

        if (deviceModel.isOnline()) {
            everlive.createOne(smartTrip._cloudClass, smartOb, function (error, data){
                if (error !== null) {
                    mobileNotify ("Error creating intelliTrip " + JSON.stringify(error));
                }
            });
        }



    }

};