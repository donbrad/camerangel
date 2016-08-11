/**
 * Created by donbrad on 3/3/16.
 *
 * privateNoteModel -- local and cloud management of user's private notes - My Notes...
 *
 */

'use strict';

/*
 * privateNoteModel
 */
var privateNoteModel = {
    notesDS: null,
    _cloudClass : 'privatenote',
    _ggClass : 'Note',
    _note : 'Note',
    _movie : 'Movie',
    _event : 'Event',
    _link : 'Link',
    _account : 'Account',
    
    init: function () {
        privateNoteModel.notesDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'privatenote'
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            sort: {
                field: "time",
                dir: "desc"
            },
            autoSync: true
        });

        privateNoteModel.notesDS.bind("change", function (e) {
            var changedNotes = e.items;
            var note = e.items[0];

            if (e.action !== undefined) {
                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                        var noteId = note.noteUUID;
                        break;

                    case "remove" :
                        // delete from contact list
                        break;

                    case "add" :
                        note = e.items[0];

                        if (privateNoteModel.isDuplicateNote(note.noteUUID)) {
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

    sync : function () {
        privateNoteModel.notesDS.sync();
    },
    
    addNote : function (note) {
        privateNoteModel.notesDS.add(note);
        privateNoteModel.notesDS.sync();

        everlive.createOne(privateNoteModel._cloudClass, note, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating Private Note " + JSON.stringify(error));
            } else {
                // Add the everlive object with everlive created Id to the datasource

            }
        });
    },

    updateNote : function (note) {

        var Id = note.Id;
        if (Id !== undefined){
            everlive.update(privateNoteModel._cloudClass, note, {'noteUUID' : note.noteUUIE}, function (error, data) {
                //placeNoteModel.notesDS.remove(note);
            });
        }
    },

    encryptNote : function (note) {
        var content = userDataChannel.encryptBlock(note.content);
        var data = userDataChannel.encryptBlock(JSON.stringify(note.dataObject));
        
        note.content = content;
        note.data = data;
    },

    decryptNote : function (note) {
        var content = userDataChannel.decryptBlock(note.content);
        var data = userDataChannel.decryptBlock(note.data);
        
        note.content = content;
        note.data = JSON.parse(data);
        note.dataObject = note.data;
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

        var notes = privateNoteModel.queryNotes({ field: "noteUUID", operator: "eq", value: noteId });

        if (notes === undefined) {
            return (false);
        } else if (notes.length > 1) {
            return (true);
        } else {
            return(false);
        }
    },

    findNote : function (noteId) {
        var notes = this.queryNotes({ field: "noteUUID", operator: "eq", value: noteId });

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
             privateNoteModel.notesDS.remove(note);
             privateNoteModel.notesDS.sync();
         }

    },

    deleteNoteById : function (noteId) {
        var note = privateNoteModel.queryNotes({ field: "noteUUID", operator: "eq", value: noteId });
        if (note !== undefined && note !== null) {
            privateNoteModel.notesDS.remove(note);
            privateNoteModel.notesDS.sync();
        }

    }

};