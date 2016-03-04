/**
 * Created by donbrad on 3/3/16.
 *
 * privateNoteModel -- local and cloud management of user's private notes - My Notes...
 *
 */

'use strict';

/*
 * placesView
 */
var privateNoteModel = {
    notesDS: null,

    init: function () {
        this.notesDS = new kendo.data.DataSource({
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

        this.notesDS.bind("change", function (e) {
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

                        if (this.isDuplicateNote(note.msgID)) {
                            this.notesDS.remove(note);
                        }

                        // add to list if it's not a duplicate

                        break;
                }
            }


        });
        this.notesDS.fetch();

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
        var messages = this.queryNotes({ field: "noteId", operator: "eq", value: noteId });

        if (messages === undefined) {
            return (false);
        } else if (messages.length > 1) {
            return (true);
        } else {
            return(false);
        }
    },

    deleteNote : function (note) {
         if (note !== undefined) {
             this.notesDS.remove(note);
             this.notesDS.sync();
         }

    },

    deleteNoteById : function (noteId) {
        var note = this.queryNotes({ field: "noteId", operator: "eq", value: noteId });
        if (note !== undefined && note !== null) {
            this.notesDS.remove(note);
            this.notesDS.sync();
        }

    }

};