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
        privateNoteModel.notesDS = new kendo.data.DataSource({
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

        privateNoteModel.notesDS.bind("change", function (e) {
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

                        if (privateNoteModel.isDuplicateNote(note.msgID)) {
                           // privateNoteModel.notesDS.remove(note);
                            //e.preventDefault();
                        }

                        // add to list if it's not a duplicate

                        break;
                }
            }


        });

        privateNoteModel.notesDS.fetch();

    },

    queryNotes: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = privateNoteModel.notesDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);
    },

    isDuplicateNote : function (noteId) {
        var notes = this.queryNotes({ field: "noteId", operator: "eq", value: noteId });

        if (notes === undefined) {
            return (false);
        } else if (notes.length > 1) {
            return (true);
        } else {
            return(false);
        }
    },

    deleteNote : function (note) {
         if (note !== undefined) {
             privateNoteModel.notesDS.remove(note);
             privateNoteModel.notesDS.sync();
         }

    },

    deleteNoteById : function (noteId) {
        var note = privateNoteModel.queryNotes({ field: "noteId", operator: "eq", value: noteId });
        if (note !== undefined && note !== null) {
            privateNoteModel.notesDS.remove(note);
            privateNoteModel.notesDS.sync();
        }

    }

};