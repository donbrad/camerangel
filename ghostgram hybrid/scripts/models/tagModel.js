/**
 * Created by donbrad on 1/22/16.
 *
 * New Tag semantic model that supports custom user tags
 *
 * Categories: contact, place, event, account, list, movie, show, sport,
 */


'use strict';

var tagModel = {

    _ggClass : 'tag',
    _user : 'user',
    _version: 1,

    tagsDS: null,

    init : function () {


        tagModel.tagsDS = new kendo.data.DataSource({
            type: 'everlive',
            offlineStorage: "tags",

            transport: {
                typeName: 'tags',
                dataProvider: APP.everlive
            },
            schema: {
                model: { id:  Everlive.idField}
            },
            sort: {
                field: "tagName",
                dir: "asc"
            }
        });


        tagModel.tagsDS.fetch();
    },



    addTag : function (tag, description, category, categoryId, semanticCategory) {

        var tagObj = tagModel.newTag();


        tagObj.name = tag;
        tagObj.tagName = tagModel.normalizeTag(tag);
        tagObj.description = description;
        tagObj.category = category;
        tagObj.categoryId = categoryId;
        tagObj.semanticCategory = semanticCategory;

        tagModel.tagsDS.add(tagObj);
        tagModel.tagsDS.sync();

    },

    addGroupTag : function (tag, description) {
        var tagObj = tagModel.newTag();


        tagObj.name = tag;
        tagObj.tagName = tagModel.normalizeTag(tag);
        tagObj.description = description;
        tagObj.category = 'Group';
        tagObj.categoryId = null;
        tagObj.semanticCategory = 'Group';

        tagModel.tagsDS.add(tagObj);
        tagModel.tagsDS.sync();
    },

    addContactTag : function (tag, alias, description, categoryId) {
        var tagObj = tagModel.newTag();


        tagObj.name = tag;
        tagObj.alias = alias;
        tagObj.tagName = tagModel.normalizeTag(tag);
        tagObj.description = description;
        tagObj.category = 'Contact';
        tagObj.categoryId = categoryId;
        tagObj.semanticCategory = 'Contact';

        tagModel.tagsDS.add(tagObj);
        tagModel.tagsDS.sync();
    },

    addPlaceTag : function (tag, alias, description, categoryId) {
        var tagObj = tagModel.newTag();


        tagObj.name = tag;
        tagObj.alias = alias;
        tagObj.tagName = tagModel.normalizeTag(tag);
        tagObj.description = description;
        tagObj.category = 'Place';
        tagObj.categoryId = categoryId;
        tagObj.semanticCategory = 'Place';

        tagModel.tagsDS.add(tagObj);
        tagModel.tagsDS.sync();
    },


    newTag : function () {
        var tag = new Object();

        tag.uuid = uuid.v4();
        tag.version = tagModel._version;
        tag.ggType = tagModel._ggClass;
        tag.name = null;
        tag.alias = null;
        tag.tagName = null;
        tag.category = tagModel._user;
        tag.categoryId = null;
        tag.semanticCategory = null;
        tag.description = null;
        tag.ownerUUID = userModel.currentUser.userUUID;

        return(tag);

    },

    normalizeTag : function (tagString) {

        var normTag = tagString.toLowerCase();

       // normTag = normTag.replace(' ', '_');

        return (normTag);
    },

    unnormalizeTag: function (normTag) {

       // var tag = normTag.replace('_', ' ');

        var tag = normTag.capitalize('title');

        return(tag);

    },

    parseTagString : function (tagString) {

        if (tagString === undefined || tagString === null || tagString.length === 0) {
            return [];
        }
        var tagArray = tagString.split(",");

        for (var i=0; i< tagArray.length; i++) {
            tagArray[i] = tagModel.normalizeTag(tagArray[i]);
        }

        return(tagArray);
    },


    createTagString : function (tagArray) {

        var tagString = '';
        if (tagArray === undefined || tagArray === null || tagArray.lengh === 0) {
            return(null)
        }

        for (var i=0; i<tagArray.length; i++) {

            tagString += tagArray[0].tagname + ', ';

        }

        tagString = tagString.trim();

        tagString = tagString.substr(0, tagString.length-1);

        return(tagString);

    },

    queryTags: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = tagModel.tagsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);
    },

    findTag : function (tag) {
        var normTag = tagModel.normalizeTag(tag);
        var tags = tagModel.queryTags({field: "tagName", operator: "eq", value: normTag});

        return (tags);
    },

    findContactTag : function (tag, alias) {
        var normTag = tagModel.normalizeTag(tag);
        var tags = tagModel.queryTags({field: "tagName", operator: "eq", value: normTag});

        return (tags);
    },

    syncContactTags : function () {
        var ds = contactModel.contactsDS;

        var length = ds.total;

        for (var i=0; i<length; i++) {
            var contact = ds.at(i);

            if (contact.category === 'member' || contact.category === 'new') {

                var tags = tagModel.findTag(contact.name);
                if (tags !== undefined && tags.length > 1) {

                } else {
                    tagModel.addContactTag(contact.name, contact.alias, '', contact.uuid);
                }
            }
        }

    },

    syncPlaceTags : function () {
        var ds = placesModel.placesDS;

        var length = ds.total;

        for (var i=0; i<length; i++) {
            var place = ds.at(i);

            var tags = tagModel.findTag(place.name);
            if (tags !== undefined && tags.length > 1) {

            } else {
                tagModel.addPlaceTag(place.name, place.alias, '', place.uuid);
            }

        }
    },

    syncTags : function () {
        tagModel.syncPlaceTags();
        tagModel.syncContactTags();

        deviceModel.syncEverlive();
    }

};