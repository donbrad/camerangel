/**
 * Created by donbrad on 7/29/16.
 * todayModel.js -- today object interface to  kendo and localstorage
 *
 * Notification types: 'unread', 'newchat', 'newprivate', 'deletechat', 'newmember',
 */

'use strict';

var todayModel = {

    objectsDS : null,

    _cloudClass : 'today',
    _ggClass : 'Today',

    init : function () {
        todayModel.objectsDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'today'
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

        todayModel.objectsDS.fetch();
    },

    sync: function () {
        todayModel.objectsDS.sync();
    },

    change : function (e, dataType) {
        var action = e.action;
        var data = e.items;
        var dataLength  = 0;
        if (data !== undefined) {
            dataLength = data.length;
        }
        switch(action) {
            case 'itemchange' :
                break;

            case 'sync' :
                break;

            case 'add' :
                break;

            case 'remove' :
                break;

        }
    }
};
