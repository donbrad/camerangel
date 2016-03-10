/**
 * Created by donbrad on 3/3/16.
 *
 * placeNoteModel -- local and cloud management of place Notes
 *
 */

'use strict';

var placeNoteModel = {
    notesDS: null,

    init: function () {
        placeNoteModel.notesDS = new kendo.data.DataSource({
            type: 'everlive',
            offlineStorage: "placenote",

            transport: {
                typeName: 'placenote',
                dataProvider: APP.everlive
            },
            schema: {
                model: { id:  Everlive.idField}
            }
        });

        placeNoteModel.notesDS.bind("change", function (e) {
            var changedNotes = e.items;
            var note = e.items[0];
            if (e.action !== undefined) {
                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                        var noteId = note.noteId;
                        break;

                    case "remove" :
                        // delete from contact list
                        break;

                    case "add" :
                        note = e.items[0];

                        if (placeNoteModel.isDuplicateNote(note.noteId)) {
                           // placeNoteModel.notesDS.remove(note);
                            //e.preventDefault();
                        }

                        // add to list if it's not a duplicate

                        break;
                }
            }


        });

        placeNoteModel.notesDS.fetch();

    },

    queryNotes: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = placeNoteModel.notesDS;
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

    findNote : function (noteId) {
        var notes = this.queryNotes({ field: "noteId", operator: "eq", value: noteId });

        if (notes === undefined ) {
            return null;
        }
        if (notes.length === 0) {
            return null;
        }

        return notes[0];
    },

    deleteNote : function (note) {
         if (note !== undefined) {
             placeNoteModel.notesDS.remove(note);
             placeNoteModel.notesDS.sync();
         }

    },

    deleteNoteById : function (noteId) {
        var note = placeNoteModel.queryNotes({ field: "noteId", operator: "eq", value: noteId });
        if (note !== undefined && note !== null) {
            placeNoteModel.notesDS.remove(note);
            placeNoteModel.notesDS.sync();
        }

    }

};