function onInitGallery(e){
    e.preventDefault();
    // ToDo: Initialize list view
    
     $("#gallery-listview").kendoMobileListView({
        dataSource: APP.models.gallery.galleryDS,
        template: $("#gallery-listview-template").html(),
        filterable: {
            field: "name",
            operator: "startswith"
        },
        endlessScroll: true
    }); 
}

