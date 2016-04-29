'use strict';

var sharedPhotoModel = {
    _version: 1,
    _cloudClass: 'sharedphoto',
    _ggClass: 'SharedPhoto',


    sharedPhotosDS : null,
    
    init : function () {
        sharedPhotoModel.sharedPhotosDS = new kendo.data.DataSource({  // this is the gallery datasource
            type: 'everlive',
            transport: {
                typeName: 'sharedphoto',
                 dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            sort: {
                field: "timestamp",
                dir: "desc"
            }
        });


    }

};
