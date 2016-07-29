/**
 * Created by donbrad on 1/20/16.
 */

'use strict';

var smartTrip = {

    _cloudClass : 'smartTrip',
    _ggClass : 'smarttrip',
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


    create : function (tripObj) {

    },

    update : function (tripObj) {

    },

    delete : function (tripObj) {

    }
};