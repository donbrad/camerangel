/**
 * Created by donbrad on 8/10/15.
 * userNoteChannel - handles all privateNote storage and retrieval
 *
 * !!! Must be included after pubnub and init must be called after pubnub is initialized
 */


'use strict';

var userNoteChannel = {

    notesDS : null,

    init: function () {

        userNoteChannel.notesDS = new kendo.data.DataSource({
            offlineStorage: "privatenote",
            type: 'everlive',
            transport: {
                typeName: 'privatenote',
                dataProvider: APP.everlive
            },
            schema: {
                model: { id: 'msgID' }
            }
        });
        userNoteChannel.notesDS.fetch();

    },

    queryMessages : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = userNoteChannel.notesDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);
    },

    isDuplicateMessage : function (msgID) {
        var messages = userNoteChannel.queryMessages({ field: "msgID", operator: "eq", value: msgID });

        if (messages === undefined) {
            return (false);
        } else if (messages.length === 0) {
            return (false);
        } else {
            return(true);
        }
    }
};


