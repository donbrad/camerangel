/**
 * Created by donbrad on 8/13/16.
 */

'use strict';

var galleryModel = {

    _version: 1,
    _cloudClass : 'gallery',
    _ggClass : 'Gallery',
    galleryDS : null,

    init : function() {
        galleryModel.galleryDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'gallery'
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            autoSync: true
        });

        // Reflect any core contact changes to contactList
        galleryModel.galleryDS.bind("change", function (e) {
            // Rebuild the contactList cache when the underlying list changes: add, delete, update...
            //placesModel.syncPlaceListDS();
            var changedGalleries = e.items;

            if (e.action !== undefined) {
                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                       /* var group = e.items[0], groupUUID = place.uuid;
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
                            placeList.set(field, place[field]);*/

                        break;

                    case "remove" :
                        // delete from places
                        break;

                    case "sync" :
                        // syncing all places...
                       
                        break;

                    case "add" :
                        var group = e.items[0];
                        // add to group tags
                        //tagModel.addGalleryTag(group.name, group.alias, '', group.uuid);
                        break;
                }
            }


        });

        galleryModel.galleryDS.fetch();
    },

    sync : function () {
        galleryModel.galleryDS.sync();
    },


    queryGalleries: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = galleryModel.galleryDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);
    },

    findGallery: function (uuid) {

        var galleries = galleryModel.queryGalleries({field: "uuid", operator: "eq", value: uuid});

        return (galleries);
    }
};
