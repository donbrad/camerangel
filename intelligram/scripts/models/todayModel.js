/**
 * Created by donbrad on 7/29/16.
 * todayModel.js -- today object interface to  kendo and localstorage
 *
 * Notification types: 'unread', 'newchat', 'newprivate', 'deletechat', 'newmember',
 */

'use strict';

var todayModel = {

    objectsDS : new kendo.data.DataSource({
        schema: {
            model: {
                id: 'uuid',
                fields: {
                    date:  { type: "date" },
                    content:  { type: "string" }
                }
            }
        },
        sort: {
            field: "date",
            dir: "asc"
        }
    }),
    _cloudClass : 'today',
    _ggClass : 'Today',

    init : function () {

    },

    sync: function () {
        todayModel.objectsDS.sync();
    },

    buildTodayDS : function () {
        todayModel.objectsDS.data([]);

        var movies = smartMovie.getTodayList();
        var events = smartEvent.getTodayList();
        var trips = smartTrip.getTodayList();
        var flights = smartTrip.getTodayList();

        todayModel.addList(movies);
        todayModel.addList(events);
        todayModel.addList(flights);
        todayModel.addList(trips);

    },

    addList : function (array) {
        if (array === null || array.length === 0 ) {
            return;
        }

        for (var i=0; i<array.length; i++) {
            todayModel.add(array[i]);
        }
    },


    queryToday : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = todayModel.objectsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var object = view[0];

        dataSource.filter(cacheFilter);

        return(object);
    },

    findTodayById : function (todayUUID) {

        var obj = todayModel.queryToday([{ field: "uuid", operator: "eq", value: todayUUID }])

        if (obj === undefined)
            obj = null;

        return(obj);
    },

    findTodayByObjectId : function (objectUUID) {
        var obj = todayModel.queryToday([{ field: "objectId", operator: "eq", value: objectUUID }])

        if (obj === undefined)
            obj = null;

        return(obj);
    },

    add : function (obj, date) {
        var todayObj = {uuid: uuid.v4, date: date, objectId : obj.uuid, objectType: obj.ggType, object: obj};

        var testObj = todayModel.findTodayByObjectId(obj.uuid);

        if(testObj === null) {
            todayModel.objectsDS.add(obj);
        }

    },

    remove : function (obj) {
        var testObj = todayModel.findTodayByObjectId(obj.uuid);

        if(testObj !== null) {
            todayModel.objectsDS.remove(testObj);
        }
    },

    update : function (obj) {

    }
};
