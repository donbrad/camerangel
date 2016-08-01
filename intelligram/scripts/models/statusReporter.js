/**
 * Created by donbrad on 7/25/16.
 *
 * userStatusTracker -- model for tracking events and time based status updates
 *
 */
'use strict';

var statusReporter = {

    deltaMinutes : 5,    // Number of minutes between status updates
    _deltaFlight : 15,
    _deltaDriving : 5,
    _deltaWalking : 1,
    _deltaBiking : 1,
    _deltaEmergency : 1,

    trackingClass: 'auto', // could be "auto", "emergency", "flight", or "trip"
    _trackAuto: 'auto',
    _trackEmergency: 'emergency',
    _trackFlight :'flight',
    _trackTrip : 'trip',

    objectUUID : null,
    channelUUID : null,
    isActive : false,
    isPaused : false,
    isComplete : false,

    reportsDS : null,

    init : function () {
       statusReporter.reportsDS = new kendo.data.DataSource({  // this is the gallery datasource
            type: 'everlive',
            transport: {
                typeName: 'statusReport'
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            sort: {
                field: "date",
                dir: "desc"
            },
            autoSync: true
        });

        statusReporter.reportsDS.fetch();
    },

    sync : function () {
        statusReporter.reportsDS.sync();
    },


    startTracking : function (trackingClass, objectUUID, ChannelUUID, deltaMinutes) {

    },

    pauseTracking : function (objectUUID) {

    },

    stopTracking : function (objectUUID, isComplete) {

    },

    reportStatus : function (message, timestamp) {

    },

    reportLocation : function (lat, lng, timestamp)  {

    },

    reportEvent : function (lat, lng, timestamp, eventType, eventMessage) {

    }

};
