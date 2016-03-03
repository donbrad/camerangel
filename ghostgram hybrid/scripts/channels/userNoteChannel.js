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
            type: 'everlive',
            offlineStorage: "privatenote",

            transport: {
                typeName: 'privatenote',
                dataProvider: APP.everlive
            },
            schema: {
                model: { id:  Everlive.idField}
            }
        });

        userNoteChannel.notesDS.bind("change", function (e) {
            var changedNotes = e.items;
            var note = e.items[0];
            if (e.action !== undefined) {
                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                        var noteId = note.msgID;
                        break;

                    case "remove" :
                        // delete from contact list
                        break;

                    case "add" :
                        note = e.items[0];

                        if (userNoteChannel.isDuplicateNote(note.msgID)) {
                            userNoteChannel.notesDS.remove(note);
                        }

                        // add to list if it's not a duplicate

                        break;
                }
            }


        });
        userNoteChannel.notesDS.fetch();

    },

    queryNotes: function (query) {
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

    isDuplicateNote : function (msgID) {
        var messages = userNoteChannel.queryNotes({ field: "msgID", operator: "eq", value: msgID });

        if (messages === undefined) {
            return (false);
        } else if (messages.length === 0) {
            return (false);
        } else {
            return(true);
        }
    }
};


