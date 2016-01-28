/**
 * Created by donbrad on 1/22/16.
 * noteModel.js -- manage local and cloud versions of private notes
 *
 */


'use strict';

var noteModel = {

    // Types of note...
    _private: 'private',
    _places: 'place',
    _group: 'group',
    _parseClass : 'note',
    _ggClass: 'Note',
    _version: 1,

    notesDS: new kendo.data.DataSource({
        offlineStorage: "note",
        sort: {
            field: "date",
            dir: "desc"
        }
    }),

    init: function () {

    },

    findNote: function (type, uuid) {
        var query = [
            {field: "type", operator: "eq", value: type},
            {field: "uuid", operator: "eq", value: uuid}
        ];

        return (noteModel.queryNote(query));
    },

    findNotesByObjectId: function (type, objectId) {
        var query = [
            {field: "objectType", operator: "eq", value: type},
            {field: "objectUUID", operator: "eq", value: objectId}
        ];

        return (noteModel.queryNotes(query));
    },

    queryNote: function (query) {
        if (query === undefined)
            return (undefined);
        var dataSource = notificationModel.notificationDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter(query);
        var view = dataSource.view();
        var item = view[0];

        dataSource.filter(cacheFilter);

        return (item);
    },

    queryNotes: function (query) {
        if (query === undefined)
            return (undefined);
        var dataSource = notificationModel.notificationDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter(query);
        var view = dataSource.view();

        // var contact = view[0].items[0];
        dataSource.filter(cacheFilter);

        return (view);
    },

    fetch: function () {
        var NoteModel = Parse.Object.extend(noteModel._parseClass);
        var query = new Parse.Query(NoteModel);
        query.limit(1000);
        query.find({
            success: function(collection) {
                var userNotifications = [];
                for (var i = 0; i < collection.length; i++) {
                    var object = collection[i];
                    var data = object.toJSON();

                   noteModel.notesDS.add(data);
                    deviceModel.setAppState('hasNotes', true);
                }

            },
            error: function(error) {
                handleParseError(error);
            }
        });
    },

    addNote : function (note) {
        var Notes = Parse.Object.extend(noteModel._parseClass);
        var noteParse = new Notes();


        if (note.isPrivate === undefined || note.isPrivate) {
            noteParse.setACL(userModel.parseACL);
        }
        noteParse.set('version', noteModel._version);
        noteParse.set('uuid', note.uuid);
        noteParse.set('userUUID', note.userUUID);
        noteParse.set('objectType', note.objectType);
        noteParse.set('objectUUID', note.objectUUID);
        noteParse.set('title', note.title);
        noteParse.set('tagString', note.tagString);
        noteParse.set('metaTagString',  note.metaTagString);
        noteParse.set('content', note.content);
        noteParse.set('tags', note.tags);
        var dateString = new Date().toISOString();
        var d = {"__type":"Date","iso":dateString};
        noteParse.set('date',  d);
        noteParse.set('expiration', Number(note.expiration));
        dateString = new Date(note.expirationDate).toISOString();
        d = {"__type":"Date","iso":dateString};
        noteParse.set('expirationDate', d);
        noteParse.set('isPrivate',  note.isPrivate);
        noteParse.set('isExpired',  note.isExpired);
        var noteObj = noteParse.toJSON();

        noteModel.notesDS.add(noteObj);
        noteModel.notesDS.sync();

        noteParse.save(null, {
            success: function(noteIn) {

                // Execute any logic that should take place after the object is saved.

            },
            error: function(note, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                handleParseError(error);
            }
        });
    },

    saveParseNote : function (noteParse) {


        var isPrivate = noteParse.get('isPrivate');

        if (isPrivate === undefined || isPrivate) {
            noteParse.setACL(userModel.parseACL);
        }

        noteParse.save(null, {
            success: function(noteIn) {
                var noteObj = noteIn.toJSON();
                noteModel.notesDS.add(noteObj);
                noteModel.notesDS.sync();
                // Execute any logic that should take place after the object is saved.

            },
            error: function(note, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                handleParseError(error);
            }
        });
    },

    // Creates an new note with field values to set defaults
    // type should be a note model type noteModel._x
    // object id is uuid / is for the parent object
    // private sets the acl on the note to available to this user only
    createNote : function (type, objectId, isPrivate) {
        var Notes = Parse.Object.extend(noteModel._parseClass);
        var note = new Notes();

        note.set('uuid',uuid.v4());

        note.set('ggType',noteModel._ggClass);
        note.set('version',noteModel._version);
        note.set('userUUID',  userModel.currentUser.userUUID);
        note.set('date',new Date());
        note.set('objectType', type);
        note.set('objectUUID',objectId);
        note.set('title', null);
        note.set('tagString',null);
        note.set('metaTagString', null);
        note.set('content',null);
        note.set('tags', []);
        note.set('expiration',30);
        var d = new Date();
        d.setFullYear(d.getFullYear()+1);
        note.set('expirationDate', d);
        note.set('isPrivate', isPrivate);
        note.set('isExpired', false);

        return(note);
    }


};