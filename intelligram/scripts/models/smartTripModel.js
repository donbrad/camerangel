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

        //smartOb.setACL(userModel.parseACL);
        smartOb.set('version', smartTrip.version);
        smartOb.set('ggType', smartTrip._ggClass);
        smartOb.set('uuid', objectIn.uuid);
        //smartOb.set('Id', objectIn.uuid);
        smartOb.set('senderUUID', objectIn.senderUUID);
        smartOb.set('senderName', objectIn.senderName);

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