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

    tagsDS: new kendo.data.DataSource({
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
    }),

    init : function () {
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


    newTag : function () {
        var tag = new Object();

        tag.uuid = uuid.v4();
        tag.version = tagModel._version;
        tag.ggType = tagModel._ggClass;
        tag.name = null;
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

        normTag = normTag.replace(' ', '_');

        return (normTag);
    },

    unnormalizeTag: function (normTag) {

        var tag = normTag.replace('_', ' ');

        return(tag.capitalize('title'));

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
        var tags = tagModel.queryTags([{field: "name", operator: "eq", value: tag},
            {field: "tagName", operator: "eq", value: normTag}]);

        return (tags);
    }


};