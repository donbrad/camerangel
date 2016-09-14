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
    _fetched : false,
    _initialSync : false,
    _cloudClass : 'privatenote',
    _ggClass : 'PrivateNote',
    _note : 'Note',
    _gallery : 'Gallery',
    _movie : 'Movie',
    _event : 'Event',
    _link : 'Link',
    _account : 'Account',
    _flight : 'Flight',
    _trip: 'Trip',
    _medical : 'Medical',
    
    init: function () {
        privateNoteModel.notesDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'privatenote',
                dataProvider: APP.everlive
            },
            schema: {
                model: { id:  Everlive.idField}
            },
            sort: {
                field: "time",
                dir: "asc"
            },

            requestEnd : function (e) {
                var response = e.response,  type = e.type;

                if (!privateNoteModel._fetched && response) {
                    if (type === 'read') {
                        privateNoteModel._fetched = true;
                    }

                }
            }
        });

        privateNoteModel.notesDS.bind("change", function (e) {
            var changedNotes = e.items;
            var note = e.items[0];


            if (e.action === undefined) {
                if (changedNotes !== undefined && !privateNoteModel._initialSync) {

                    privateNoteModel._initialSync = true;

                }
            } else {
                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                        var noteId = note.uuid;
                        break;

                    case "remove" :
                        // delete from contact list
                        break;

                    case "add" :
                        note = e.items[0];

                        if (privateNoteModel.isDuplicateNote(note.uuid)) {
                            privateNoteModel.notesDS.remove(note);
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

        if (note.Id === undefined) {
            note.Id = uuid.v4();
        }

        privateNoteModel.notesDS.add(note);
        privateNoteModel.notesDS.sync();

        if (deviceModel.isOnline()) {
            everlive.createOne(privateNoteModel._cloudClass, note, function (error, data){
                if (error !== null) {
                    mobileNotify ("Error creating Private Note " + JSON.stringify(error));
                }
            });

        }

    },



    updateNote : function (note) {


        everlive.update(privateNoteModel._cloudClass, note, {'uuid' : note.uuid}, function (error, data) {
            //placeNoteModel.notesDS.remove(note);
        });


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

        var notes = privateNoteModel.queryNotes({ field: "uuid", operator: "eq", value: noteId });

        if (notes === undefined) {
            return (false);
        } else if (notes.length > 1) {
            return (true);
        } else {
            return(false);
        }
    },

    findNote : function (noteId) {
        var notes = privateNoteModel.queryNotes({ field: "uuid", operator: "eq", value: noteId });

        if (notes === undefined ) {
            return null;
        }
        if (notes.length === 0) {
            return null;
        }

        return notes[0];
    },


    findGallery : function (galleryId) {
        var galleries = privateNoteModel.queryNotes([{ field: "uuid", operator: "eq", value: galleryId },
            {field: "noteType", operator: "eq", value: privateNoteModel._gallery }]);

        if (galleries === undefined ) {
            return null;
        }
        if (galleries.length === 0) {
            return null;
        }

        return galleries[0];
    },

    deleteNote : function (note) {
         if (note !== undefined) {
             privateNoteModel.notesDS.remove(note);
             privateNoteModel.notesDS.sync();
         }

    },

    deleteNoteById : function (noteId) {
        var note = privateNoteModel.queryNotes({ field: "uuid", operator: "eq", value: noteId });
        if (note !== undefined && note !== null) {
            privateNoteModel.notesDS.remove(note);
            privateNoteModel.notesDS.sync();
        }

    }

};