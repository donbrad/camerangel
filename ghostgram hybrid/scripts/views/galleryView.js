/**
 * Created by donbrad on 9/10/15.
 *
 * The objects / functions behind all gallery and photos views
 */


'use strict';


/*
 * gallery
 */

var galleryView = {

    onInit : function (e) {
        _preventDefault(e);

        archiveView.init();

        var setSentinelHeight = function () {
            $('#search-archives').height(getSentinelHeight());
        };
        /*
         archiveView.sentinel.addListener('add', setSentinelHeight);
         archiveView.sentinel.addListener('remove', setSentinelHeight);
         setSentinelHeight();
         */


        // ToDo: Initialize list view
        var itemWidth = $(window).width()/4;
        photoModel.rotationAngle = 0;
        photoModel.optionsHidden = true;
        photoModel.previewSize = "33%";
        photoModel.optionsShown = true;


        $("#gallerySearch").keyup(function() {
            var query = $("#gallerySearch").val();
            if (query.length > 0) {

            }

        });

        // Kendo web bug is firing infinitely
        if (window.navigator.simulator === false) {
            $("#gallerySearch").on("focus", function(){
                $(".gallerySearchOptions").velocity("slideDown", {duration: 300});
                //$("#gallerySearch").unbind("focus");
                console.log("focus");
            });

            $("#gallerySearch").on("blur", function(){
                $(".gallerySearchOptions").velocity("slideUp", {duration: 300});
                //$("#gallerySearch").unbind("blur");
                console.log("blur");
            });
        } else {
            $(".gallerySearchOptions").velocity("slideDown", {duration: 300});
        }
        // hide archive options
        $(".gallerySearchOptions, #galleryPhotoDisplayOpts").css("display", "none");


        var scroller = e.view.scroller;
        //scroller.scrollTo(0,-44);
        /* Testing dynamic header
		var scroller = e.view.scroller;
		//scroller.scrollTo(0,-44);
		
		scroller.bind("scroll", function(){
			
			var scrollPos = scroller.scrollTop;
			var newHeight = 56 - scrollPos;
			console.log(scrollPos);
			if (scrollPos > 56){
				$("#gallery > div.km-header > div.km-widget.km-navbar").addClass("home-smallHeader");
				$("#gallery > div.km-header > .helperInfoBar").removeClass("hidden");
			} else {
				$("#gallery > div.km-header > div.km-widget.km-navbar").removeClass("home-smallHeader");
				$("#gallery > div.km-header > .helperInfoBar").addClass("hidden");
			}
		}); 
		*/  

    },

    onShow : function (e) {
        _preventDefault(e);

        photoModel.chatPhoto = false;
        if (e.view.params.action !== undefined && e.view.params.action === 'chat') {
            photoModel.chatPhoto = true;
            mobileNotify("Please select an image to send...")
        }
        photoModel.rotationAngle = 0;


        $("#gallery-listview li").css("width",photoModel.previewSize);
        $("#gallery-listview li").css("padding-bottom",photoModel.previewSize);


        switch(photoModel.previewSize) {
            case "33%" :
                //setButtonGroupIndex("#gallerySearchToolSelect", 0);
                break;

            case "50%" :
                //setButtonGroupIndex("#gallerySearchToolSelect", 1);
                break;

            case "100%" :
                //setButtonGroupIndex("#gallerySearchToolSelect", 2);
                break;
        }

        // Added until gallery/archive are fully merged
        //checkEmptyUIState("#archive-listview", "#archiveBox");

    },

    selectCategory : function (e){
        _preventDefault(e);

        var index = this.current().index();
        switch (index) {
            case 0:
                $(".gallerySearchOptions").velocity("slideDown");
                $("#galleryPhotoDisplayOpts").velocity("slideUp");

                $('#archive-listview').removeClass('hidden');
                $("#gallery-listview").addClass('hidden');

                break;

            case 1:
                $(".gallerySearchOptions").velocity("slideUp");
                $("#galleryPhotoDisplayOpts").velocity("slideDown");

                $('#archive-listview').addClass('hidden');
                $("#gallery-listview").removeClass("hidden");
                break;
        }
        $("#gallerySearch").attr("placeholder", "Search All");
    },

    galleryClick : function (e) {
        _preventDefault(e);

        var photoId = e.dataItem.id, photoUrl = e.dataItem.imageUrl;
        photoModel.currentPhotoModel = photoModel.findPhotoById(photoId);
        $('#photoViewImage').attr('src', photoUrl);
        $('#photoTagImage').attr('src', photoUrl);
        $('#photoEditImage').attr('src', photoUrl);

        if (photoModel.chatPhoto) {
            channelView.showChatImagePreview(photoUrl);
            APP.kendo.navigate('#:back');

        } else {
            APP.kendo.navigate('#photoView');
        }
    },

    selectZoom : function (e) {
        _preventDefault(e);
        var index = this.current().index();
        switch (index) {
            case 0:
                photoModel.previewSize = "33%";
                $("#gallery-listview li").css("width","33%");
                $("#gallery-listview li").css("padding-bottom","33%");
                break;
            case 1:
                photoModel.previewSize = "50%";
                $("#gallery-listview li").css("width","50%");
                $("#gallery-listview li").css("padding-bottom","50%");
                break;
            case 2:
                photoModel.previewSize = "100%";
                $("#gallery-listview li").css("width","100%");
                $("#gallery-listview li").css("padding-bottom","100%");
                break;

        }
    },

    optionsToggle : function (e) {
        _preventDefault(e);
        if (photoModel.optionsShown) {
            $("#galleryToggle").velocity("fadeOut",{duration: 150});
            $('.gallerySearchOptions').velocity("slideDown",{duration: 300});
            $("#galleryZoomSelect > li:first-child").velocity("fadeIn", {duration: 300});
            photoModel.optionsShown = false;
            $("#gallerySearch").focus();
        } else {
            $('.gallerySearchOptions').velocity("slideUp",{duration: 300});
            $("#galleryToggle").velocity("fadeIn",{delay: 150, duration: 150});
            $("#galleryZoomSelect > li:first-child").velocity("fadeOut", {duration: 300});
            //$('#gallerySearchOptions').removeClass('hidden');
            photoModel.optionsShown = true;

        }
    },

    selectSearchTool : function (e) {
        _preventDefault(e);

        var index = this.current().index();

        switch (index) {

            case 0: // Search
                $("#gallerySearch").attr("placeholder", "Search all");
                break;

            case 1: // Contacts
                $("#gallerySearch").attr("placeholder", "Search contacts");
                break;

            case 2: // Chats
                $("#gallerySearch").attr("placeholder", "Search chats");
                break;

            case 3: // Calendar
                $("#gallerySearch").attr("placeholder", "Search dates");
                break;

            case 4: // Places
                $("#gallerySearch").attr("placeholder", "Search places");
                break;
        }

    }
};