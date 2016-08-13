/**
 * Created by donbrad on 8/13/16.
 */

'use strict';

var groupModel = {

    _version: 1,
    _cloudClass : 'group',
    _ggClass : 'Group',
    groupsDS : null,

    init : function() {
        groupModel.groupsDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'group'
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            autoSync: true
        });

        // Reflect any core contact changes to contactList
        groupModel.groupsDS.bind("change", function (e) {
            // Rebuild the contactList cache when the underlying list changes: add, delete, update...
            //placesModel.syncPlaceListDS();
            var changedGroups = e.items;

            if (e.action !== undefined) {
                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                        var group = e.items[0], groupUUID = place.uuid;
                        var groupList = placesModel.findPlaceListUUID(placeUUID);

                        // if the places's name or alias has been updated, need to update the tag...
                        var tagList = tagModel.findTagByCategoryId(place.uuid);
                        if (tagList.length > 0) {
                            var placeTag = tagList[0];
                            placeTag.set('alias',place.alias);
                            placeTag.set('name', place.name);
                        }


                        if (groupList !== undefined)
                        //placeList[field] = place [field];
                            placeList.set(field, place[field]);

                        break;

                    case "remove" :
                        // delete from places
                        break;

                    case "sync" :
                        // syncing all places...
                        if (changedGroups !== undefined) {
                            var len = changedGroups.len;
                        }
                        break;

                    case "add" :
                        var group = e.items[0];
                        // add to group tags
                        tagModel.addGroupTag(group.name, group.alias, '', group.uuid);
                        break;
                }
            }


        });

        groupModel.groupsDS.fetch();
    },

    normalizeGroup : function (groupString) {

        var normGroup = groupString.toLowerCase();

        // normTag = normTag.replace(' ', '_');

        return (normGroup);
    },

    unnormalizeGroup: function (groupString) {

        // var tag = normTag.replace('_', ' ');

        var group = groupString.capitalize('title');

        return(group);

    },

    queryGroups: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = groupModel.groupsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);
    },

    findGroup : function (group) {
        var normGroup = tagModel.normalizeTag(group);
        var groups = tagModel.queryTags({field: "nameNorm", operator: "eq", value: normGroup});

        return (groups);
    }
};