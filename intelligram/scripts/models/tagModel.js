/**
 * Created by donbrad on 1/22/16.
 *
 * New Tag semantic model that supports custom user tags
 *
 * Categories: contact, place, event, account, list, movie, show, sport,
 */


'use strict';

var tagModel = {

    _ggClass : 'Tag',
    _cloudClass : 'tags',
    _user : 'user',
    _version: 1,
    _tagsSynced : false,
    _group: 'group',
    _contact: 'contact',
    _ice: 'ice',
    _icefamily : 'icefamily',
    _iceneighbor : 'iceneighbor',
    _place: 'place',
    _event: 'event',
    _movie: 'movie',
    _family : 'family',
    _friend : 'friend',


    tagsDS: null,

    init : function () {
        
        tagModel.tagsDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'tags'
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            sort: {
                field: "tagName",
                dir: "asc"
            },
            autoSync : true
        });


        tagModel.tagsDS.fetch();
    },


    sync : function () {
        tagModel.tagsDS.sync();
    },


    addTag : function (tag, description, category, categoryId, semanticCategory) {

        var normTag = tagModel.normalizeTag(tag);

        var tagExists = tagModel.findTagByCategory(category, normTag);

        if (tagExists.length > 0) {
            return;
        }

        var tagObj = tagModel.newTag();


        tagObj.name = tag;
        tagObj.tagName = tagModel.normalizeTag(tag);
        tagObj.description = description;
        tagObj.category = category;
        tagObj.categoryId = categoryId;
        tagObj.semanticCategory = semanticCategory;

        tagModel.tagsDS.add(tagObj);
        tagModel.tagsDS.sync();

        everlive.createOne(tagModel._cloudClass, tagObj, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating photo " + JSON.stringify(error));
            } else {
                // Add the everlive object with everlive created Id to the datasource
                //tagModel.tagsDS.add(tagObj);

            }
        });

    },

    addGroupTag : function (tag, description) {
        var normTag = tagModel.normalizeTag(tag);

        var tagExists = tagModel.findTagByCategory(tagModel._group, normTag);

        if (tagExists.length > 0) {
            return;
        }

        var tagObj = tagModel.newTag();


        tagObj.name = tag;
        tagObj.tagName = tagModel.normalizeTag(tag);
        tagObj.description = description;
        tagObj.category = tagModel._group;
        tagObj.categoryId = null;
        tagObj.semanticCategory = 'Group';

        tagModel.tagsDS.add(tagObj);
        tagModel.tagsDS.sync();

        everlive.createOne(tagModel._cloudClass, tagObj, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating photo " + JSON.stringify(error));
            } else {
                // Add the everlive object with everlive created Id to the datasource


            }
        });
    },

    addContactTag : function (tag, alias, description, categoryId) {

        var normTag = tagModel.normalizeTag(tag);

        var tagExists = tagModel.findTagByCategory(tagModel._contact, normTag);

        if (tagExists.length > 0) {
            return;
        }

        var tagObj = tagModel.newTag();
        
        tagObj.name = tag;
        tagObj.alias = alias;
        tagObj.tagName = tagModel.normalizeTag(tag);
        tagObj.description = description;
        tagObj.category = tagModel._contact;
        tagObj.categoryId = categoryId;
        tagObj.semanticCategory = 'Contact';

        tagModel.tagsDS.add(tagObj);
        tagModel.tagsDS.sync();

        everlive.createOne(tagModel._cloudClass, tagObj, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating photo " + JSON.stringify(error));
            } else {
                // Add the everlive object with everlive created Id to the datasource


            }
        });
    },

    addPlaceTag : function (tag, alias, description, categoryId) {
        var normTag = tagModel.normalizeTag(tag);
        var tagExists = tagModel.findTagByCategory(tagModel._place, normTag);

        if (tagExists.length > 0) {
            return;
        }

        var tagObj = tagModel.newTag();


        tagObj.name = tag;
        tagObj.alias = alias;
        tagObj.tagName = tagModel.normalizeTag(tag);
        tagObj.description = description;
        tagObj.category = tagModel._place;
        tagObj.categoryId = categoryId;
        tagObj.semanticCategory = 'Place';

        tagModel.tagsDS.add(tagObj);
        tagModel.tagsDS.sync();

        everlive.createOne(tagModel._cloudClass, tagObj, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating photo " + JSON.stringify(error));
            } else {
                // Add the everlive object with everlive created Id to the datasource
                tagModel.tagsDS.add(tagObj);

            }
        });
    },


    newTag : function () {
        var tag = {};

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
        tag.ownerUUID = userModel._user.userUUID;

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


    findTagByCategory : function (category, tag) {
        var normTag = tagModel.normalizeTag(tag);
        var tags = tagModel.queryTags([{field: "tagName", operator: "eq", value: normTag},
            {field: "category", operator: "eq", value: category}]);

        return (tags);
    },

    findTagByCategoryId : function (tagId) {
        var tags = tagModel.queryTags({field: "categoryId", operator: "eq", value: tagId});
        return (tags);
    },

    findTagByHash : function (hash) {
        var tags = tagModel.queryTags({field: "tagHash", operator: "eq", value: hash});

        return (tags);
    },

    findContactTags : function (tag, alias) {
        var normTag = tagModel.normalizeTag(tag);
        var tags = tagModel.queryTags([{field: "tagName", operator: "eq", value: normTag},
            {field: "category", operator: "eq", value: tagModel._contact}]);

        return (tags);
    },



    syncTags : function () {

        //deviceModel.syncEverlive();
    }

};