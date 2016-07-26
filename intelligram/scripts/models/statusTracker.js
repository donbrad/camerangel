/**
 * Created by donbrad on 7/25/16.
 *
 * userStatusTracker -- model for tracking events and time based status updates
 *
 */
'use strict';

var statusTracker = {
    deltaMinutes : 5,    // Number of minutes between status updates

    trackingClass: 'auto', // call be "event", "movie", "auto", "emergency", "flight", or "trip"

    objectsDS : null,

    init : function () {
        statusTracker.objectsDS = new kendo.data.DataSource({  // this is the gallery datasource
            type: 'everlive',
            transport: {
                typeName: 'statusTrack'
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
    },

    create : function () {

    },

    delete : function () {

    },

    update : function () {

    },

    // Process status-able object lists to statusTracker objects Data Source
    syncObjects : function () {

    },

    refreshObjects : function () {

    }

};