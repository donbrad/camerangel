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





        var scroller = e.view.scroller;
        //scroller.scrollTo(0,-44);
        /* Testing dynamic header 
		
		scroller.bind("scroll", function(e){
			
			var scrollPos = scroller.scrollTop;
			var newHeight = 56 - scrollPos;
			console.log(scrollPos);
			if (scrollPos > 56){
				$("#gallery > div.km-header > div.km-widget.km-navbar").addClass("home-smallHeader");
				//$("#gallery > div.km-header > .helperInfoBar").removeClass("hidden");
			} else {
				$("#gallery > div.km-header > div.km-widget.km-navbar").removeClass("home-smallHeader");
				//$("#gallery > div.km-header > .helperInfoBar").addClass("hidden");
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
        
        // Set action btn
        var $actionBtn = $("#gallery > div.footerMenu.km-footer > a");
        var $actionBtnImg = $("#gallery > div.footerMenu.km-footer > a > span > img");
        var $actionBtnP = $("#gallery > div.footerMenu.km-footer > a > span > p");
        var scroller = e.view.scroller;
      	
        $actionBtn.removeAttr("href").on("click", function(e){
				galleryView.galleryActionView(e);
			
			});
        

        // Set img size for gallery
        $("#gallery-listview li").css("width",photoModel.previewSize);
        $("#gallery-listview li").css("padding-bottom",photoModel.previewSize);

        // if gallery photos are open, display actionBtn
        var galleryMenuIndex = $("#galleryMenuSelect").data("kendoMobileButtonGroup").current().index();
        if(galleryMenuIndex === 0){
        	$actionBtn.css("display", "inline-block");
        } 

        if(photoModel.previewSize === "33%"){
        	$actionBtnP.text("List view");
        	$actionBtnImg.attr("src", "images/gallery-list.svg");
        } else {
        	$actionBtnP.text("Grid view");
        	$actionBtnImg.attr("src", "images/gallery-grid.svg");
        }
        
        $actionBtnP.addClass("actionBtn-text-light");
        ux.showActionBtnText("#gallery", "3.5rem");

        // set filter count
        var filterCount = 0;
        $("#filterCount").text(filterCount);

        if(filterCount > 1){
        	$("#filterText").text("Filters");
        } else if(filterCount === 0) {
        	$("#filterCount").text("");
        	$("#filterText").text("Filter");
        } else {
        	$("#filterText").text("Filter");
        }
        
        $('#gallerySearchQuery').clearSearch({
	        callback: function() {
	        	// todo - wire search
	        }
	    });

    },

    onHide: function(e){
    	var $actionBtn = $("#gallery > div.footerMenu.km-footer > a");
        var $actionBtnImg = $("div.footerMenu.km-footer > a > span > img");
        var $actionBtnP = $("div.footerMenu.km-footer > a > span > p");

        $actionBtn.css("display", "none");
        $actionBtnImg.attr("src", "images/nav-add-white.svg");

        $actionBtnP.removeClass("actionBtn-text-light").text("");

    },

    galleryActionView: function(e){
    	_preventDefault(e);
    	var $actionBtnP = $("#gallery > div.footerMenu.km-footer > a > span > p");
    	
		if(photoModel.previewSize === "33%") {
			ux.changeActionBtnImg("#gallery", "gallery-grid");
			$actionBtnP.text("Grid view");
			
			photoModel.previewSize = "100%";
		} else {
			ux.changeActionBtnImg("#gallery", "gallery-list");
			$actionBtnP.text("List view");
			photoModel.previewSize = "33%";
			
		}
		$("#gallery-listview li").css("width",photoModel.previewSize);
        $("#gallery-listview li").css("padding-bottom",photoModel.previewSize);
    },

    selectCategory : function (e){
        _preventDefault(e);
        var index = this.current().index();
        switch (index) {
            case 0:
            	ux.showActionBtn(true, "#gallery");
                $('#archive-listview').addClass('hidden');
                $("#gallery-listview").removeClass("hidden");
                break;

            case 1:
                ux.showActionBtn(false, "#gallery");
                $('#archive-listview').removeClass('hidden');
                $("#gallery-listview").addClass('hidden');
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