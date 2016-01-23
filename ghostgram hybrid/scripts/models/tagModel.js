/**
 * Created by donbrad on 1/22/16.
 *
 * New Tag semantic model that supports custom user tags
 */


'use strict';

var tagModel = {

    _parseClass : 'tag',
    _user : 'user',
    _version: 1,

    tagsDS: new kendo.data.DataSource({
        offlineStorage: "tags",
        sort: {
            field: "tagname",
            dir: "asc"
        }
    }),

    init : function () {

    },

    fetch: function () {
        var TagModel = Parse.Object.extend(tagModel._parseClass);
        var query = new Parse.Query(TagModel);
        query.limit(1000);
        query.find({
            success: function(collection) {
                var userNotifications = [];
                for (var i = 0; i < collection.length; i++) {
                    var object = collection[i];

                    var data = object.toJSON();

                    tagModel.tagsDS.add(data);
                    deviceModel.setAppState('hasTags', true);
                }

            },
            error: function(error) {
                handleParseError(error);
            }
        });
    },

    addTag : function (tag) {
        var Tags = Parse.Object.extend(tagModel._parseClass);
        var tagParse = new Tags();

        tagParse.setACL(userModel.parseACL);

        tagParse.set('version', noteModel._version);
        tagParse.set('uuid', tag.uuid);
        tagParse.set('name', tag.name);
        tagParse.set('type', tag.type);
        tagParse.set('alias', tag.alias);
        tagParse.set('description', tag.description);
        tagParse.set('ownerUUID', tag.ownerUUID);
        tagParse.set('category', tag.category);

        var tagObj = tagParse.toJSON();

        tagModel.tagsDS.add(tagObj);
        tagModel.tagsDS.sync();

        tagParse.save(null, {
            success: function(tagIn) {

                // Execute any logic that should take place after the object is saved.

            },
            error: function(contact, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                handleParseError(error);
            }
        });
    },

    createTag : function () {
        var tag = new Object();

        tag.uuid = uuid.v4();
        tag.name = null;
        tag.alias = null;
        tag.type = tagModel._user;
        tag.description = null;
        tag.ownerUUID = null;
        tag.category = null;
        tag.icon = null;

        return(tag);

    }

};