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
    _fetched : false,
    processingDeferred : false,
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
    _trip: 'trip',
    _flight: 'flight',
    _team: 'team',
    _band: 'band',
    _artist: 'artist',
    _book: 'book',
    _tvshow: 'tv',


    tagsDS: null,
    deferredList : [],

    init : function () {
        
        tagModel.tagsDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'tags',
                dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            sort: {
                field: "tagName",
                dir: "asc"
            },/*

            requestEnd : function (e) {
                var response = e.response,  type = e.type;

                if (!tagModel._fetched) {
                    if (type === 'read') {
                        tagModel._fetched = true;
                        tagModel.processDeferred();
                    }
                }
            },*/

            autoSync : true
        });

        tagModel.tagsDS.bind("change", function (e) {
            // Rebuild the contactList cache when the underlying list changes: add, delete, update...
            //placesModel.syncPlaceListDS();
            var changedTags = e.items;

            if (e.action === undefined) {
                if (changedTags !== undefined) {
                    tagModel.tagsFetched = true;
                    tagModel.processDeferred();
                }
            }
        });

        tagModel.tagsDS.fetch();
    },


    processDeferred : function () {
        // If the list is empty -- just return
        if (tagModel.deferredList.length === 0 || tagModel.processingDeferred) {
            return;
        }

        tagModel.processingDeferred = true;
        for (var i=0; i<tagModel.deferredList.length; i++ ) {
            var tagObj = tagModel.deferredList[i];

            switch (tagObj.category){
                case tagModel._group:
                    tagModel.addGroupTag(tagObj.tag, tagObj.alias, tagObj.description, tagObj.categoryId);
                    break;

                case tagModel._contact:
                    tagModel.addContactTag(tagObj.tag, tagObj.alias, tagObj.description, tagObj.categoryId);

                    break;

                case tagModel._place:
                    tagModel.addPlaceTag(tagObj.tag, tagObj.alias, tagObj.description, tagObj.categoryId);

                    break;

            }
        }
    },

    defer : function (tag, alias, description, categoryId, category) {
        var deferObj = {
            tag: tag,
            alias: alias,
            description: description,
            categoryId : categoryId,
            category : category
        };

        tagModel.deferredList.push(deferObj);
    },


    sync : function () {
        tagModel.tagsDS.sync();
    },

    change : function (obj, category) {

    },

    addTag : function (tag, alias, description, category, categoryId, semanticCategory) {

        var normTag = tagModel.normalizeTag(tag);

        var tagExists = tagModel.findTagByCategory(category, normTag);

        if (tagExists.length > 0) {
            return;
        }

        var tagObj = tagModel.newTag();

        tagObj.ggClass = tagModel._class;
        tagObj.name = tag;
        tagObj.alias = alias;
        tagObj.nameCombo = tagObj.name;
        if (tagObj.alias !== undefined && tagObj.alias !== null) {
            tagObj.nameCombo = tagObj.name + ' ('+ tagObj.alias + ')';
        }
        tagObj.nameCombo = tagObj.name;
        tagObj.tagNorm = normTag;
        tagObj.description = description;
        tagObj.category = category;
        tagObj.categoryId = categoryId;
        tagObj.semanticCategory = semanticCategory;
        tagObj.tagHash = tagObj.category + '|' + tagObj.tagNorm;

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

    addGroupTag : function (tag, alias, description, categoryId) {
        if (!tagModel.tagsFetched) {
            tagModel.defer(tag, alias, description, categoryId, tagModel._group);
            return;
        }

        var normTag = tagModel.normalizeTag(tag);

        var tagExists = tagModel.findTagByCategory(tagModel._group, normTag);

        if (tagExists.length > 0) {
            return;
        }

        var tagObj = tagModel.newTag();


        tagObj.name = tag;
        tagObj.alias = alias;
        tagObj.nameCombo = tagObj.name;
        if (tagObj.alias !== undefined && tagObj.alias !== null) {
            tagObj.nameCombo = tagObj.name + ' ('+ tagObj.alias + ')';
        }

        tagObj.tagNorm = normTag;
        tagObj.description = description;
        tagObj.category = tagModel._group;
        tagObj.categoryId = categoryId;
        tagObj.semanticCategory = 'Group';
        tagObj.tagHash = tagObj.category + '|' + tagObj.tagNorm;

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
        if (!tagModel.tagsFetched) {
            tagModel.defer(tag, alias, description, categoryId, tagModel._contact);
            return;
        }
        var normTag = tagModel.normalizeTag(tag);

        var tagExists = tagModel.findTagByCategoryId(categoryId);

        if (tagExists.length > 0) {
            return;
        }

        var tagObj = tagModel.newTag();
        
        tagObj.name = tag;
        tagObj.alias = alias;
        tagObj.nameCombo = tagObj.name;
        if (tagObj.alias !== undefined && tagObj.alias !== null) {
            tagObj.nameCombo = tagObj.name + ' ('+ tagObj.alias + ')';
        }
        tagObj.tagNorm = normTag;
        tagObj.description = description;
        tagObj.category = tagModel._contact;
        tagObj.categoryId = categoryId;
        tagObj.semanticCategory = 'Contact';
        tagObj.tagHash = tagObj.category + '|' + tagObj.tagNorm;

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
        if (!tagModel.tagsFetched) {
            tagModel.defer(tag, alias, description, categoryId, tagModel._place);
            return;
        }
        var normTag = tagModel.normalizeTag(tag);
        var tagExists = tagModel.findTagByCategoryId(categoryId);

        if (tagExists.length > 0) {
            return;
        }

        var tagObj = tagModel.newTag();


        tagObj.name = tag;
        tagObj.alias = alias;
        tagObj.nameCombo = tagObj.name;
        if (tagObj.alias !== undefined && tagObj.alias !== null) {
            tagObj.nameCombo = tagObj.name + ' ('+ tagObj.alias + ')';
        }
        tagObj.description = description;
        tagObj.category = tagModel._place;
        tagObj.categoryId = categoryId;
        tagObj.semanticCategory = 'Place';
        tagObj.tagNorm = normTag;
        tagObj.tagHash = tagObj.category + '|' + tagObj.tagNorm;

        tagModel.tagsDS.add(tagObj);
        tagModel.tagsDS.sync();

        everlive.createOne(tagModel._cloudClass, tagObj, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating photo " + JSON.stringify(error));
            } else {
                // Add the everlive object with everlive created Id to the datasource
               // tagModel.tagsDS.add(tagObj);

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
        tag.tagNorm = null;
        tag.tagHash = null;
        tag.nameCombo = null;
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

            tagString += tagArray[0].name + ', ';

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
        var tags = tagModel.queryTags({field: "tagNorm", operator: "eq", value: normTag});

        return (tags);
    },


    findTagByCategory : function (category, tag) {
        var normTag = tagModel.normalizeTag(tag);
        var tags = tagModel.queryTags([{field: "tagNorm", operator: "eq", value: normTag},
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
        var tags = tagModel.queryTags([{field: "tagNorm", operator: "eq", value: normTag},
            {field: "category", operator: "eq", value: tagModel._contact}]);

        return (tags);
    },



    syncTags : function () {

        //deviceModel.syncEverlive();
    }

};