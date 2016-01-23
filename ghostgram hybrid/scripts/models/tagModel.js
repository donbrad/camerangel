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