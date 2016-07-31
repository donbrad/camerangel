/**
 * Created by donbrad on 7/25/16.
 *
 * userStatusTracker -- model for tracking events and time based status updates
 *
 */
'use strict';

var statusReporter = {

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
