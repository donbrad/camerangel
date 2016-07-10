/* global archive, Sentinel */

'use strict';

var archiveView = {

	sentinel: undefined,

	init: function () {

		/*if (archive.dataSource.total() === 0 && 1) {
			// chat
			archive.add({
				message: {
					channelUUID: '1',
					channelName: 'myplacez design',

					sender: {
						id: '1',
						name: 'Don Bradford',
						image: 'http://files.parsetfss.com/b7762404-2bdf-4947-a141-9fdd3b9daf41/tfss-c1b74c69-deea-43a4-b36a-685f95b76f90-61ebcea2-9085-4a3d-99f2-58e7cfe04eb3.png'
					},

					placeUUID: '1',
					placeName: 'Home',
					address: '221 Davis St., Greenfield, MA',

					eventId: '1',
					eventName: 'Work at Don\'s',

					text: 'Some chat about myplacez',
					date: new Date()
				},
				type: 'Chat',
				tags: '',
				date: new Date(),
				object: {}
			});

			// events
			archive.add({
				message: {
					channelUUID: '1',
					channelName: 'myplacez design',

					sender: {
						id: '1',
						name: 'Don Bradford',
						image: 'http://files.parsetfss.com/b7762404-2bdf-4947-a141-9fdd3b9daf41/tfss-c1b74c69-deea-43a4-b36a-685f95b76f90-61ebcea2-9085-4a3d-99f2-58e7cfe04eb3.png'
					},

					placeUUID: '1',
					placeName: 'Home',
					address: '221 Davis St., Greenfield, MA',

					eventId: '1',
					eventName: 'Work at Don\'s',

					text: 'Awesome concert next weekend!',
					date: new Date()
				},
				type: 'Events',
				tags: '',
				date: new Date(),
				object: {
					name: 'Margot and the Nukes',

					placeUUID: '2',
					placeName: 'Iron Horse',
					address: '24 Main St., Northampton, MA',
					
					start: new Date(),
					end: new Date()
				}
			});
			
			// urls
			archive.add({
				message: {
					channelUUID: '2',
					channelName: 'ghostgram design',

					sender: {
						id: '1',
						name: 'Don Bradford',
						image: 'http://files.parsetfss.com/b7762404-2bdf-4947-a141-9fdd3b9daf41/tfss-c1b74c69-deea-43a4-b36a-685f95b76f90-61ebcea2-9085-4a3d-99f2-58e7cfe04eb3.png'
					},

					placeUUID: '1',
					placeName: 'Home',
					address: '221 Davis St., Greenfield, MA',

					eventId: '1',
					eventName: 'Work at Don\'s',

					text: 'Check out this refactoring thing',
					date: new Date()
				},
				type: 'Links',
				tags: '',
				date: moment().subtract(1, 'days').toDate(),
				object: {
					title: 'Refactoring',
					url: 'http://www.refactoring.com/'
				}
			});
			
			// photos
			archive.add({
				message: {
					channelUUID: '2',
					channelName: 'ghostgram design',

					sender: {
						id: '2',
						name: 'Jordan Escoto',
						image: 'https://pbs.twimg.com/profile_images/3365228794/6f017221480a3d8c4df6debf92240bb3_400x400.png'
					},

					placeUUID: '1',
					placeName: 'Home',
					address: '221 Davis St., Greenfield, MA',

					eventId: '1',
					eventName: 'Work at Don\'s',

					text: 'Check out this place photo',
					date: new Date()
				},
				type: 'Photos',
				tags: '',
				date: new Date(),
				object: {
					url: 'http://www.craterlakenational.com/image/crater_lake_large1.jpg',

					placeName: 'Crater Lake National Park',
					address: 'Klamath County, OR',

					date: new Date()
				}
			});
		}
*/
		//archiveView.checkIfEmpty();

		$('#search-archives input').clearSearch({ callback: archiveView.clearSearch });

		// Binding this manually because data-role="button" messes up the styles
		$('.cardAction > a').on('click', archiveView.openObject);

		// Gotta set on archiveView instead of this because kendo binds
		// .init to the kendo view
		archiveView.sentinel = new Sentinel($('#search-archives'));

		archiveView.sentinel.addListener('add', archiveView.search);
		archiveView.sentinel.addListener('remove', archiveView.search);

		/* HACK: Something's up with flex, so automatically calculating heights
		var adjustListHeight = function () {
			var searchArchivesHeight = $('#search-archives').height()+20;
			$('#archive-list').css('height', 'calc(100% - '+searchArchivesHeight+'px)');
		};
		adjustListHeight();
		archiveView.sentinel.addListener('add', adjustListHeight);
		archiveView.sentinel.addListener('remove', adjustListHeight);
		*/
	},

	onInitDateSelect: function(){
        
         $("#dateSelect").kendoCalendar({
         	change: function() {
            	var value = this.value();
            	// TODO - wire user selected date
        	}
         });

         $("#select-period").kendoMobileButtonGroup({
            select: function(e) {
            	var index = this.current().index();
                switch(index){
                	case 0:
	                	// Before
	                	break;
	                case 1:
	                	// On
	                	break;
	                case 2:
	                	// After
	                	break;
                }
            },
            index: 0
        });

	},
	openArchiveFilter: function(){
		$("#modalview-archive-filter").data("kendoMobileModalView").open();
	},

	closeArchiveFilter: function(){
		$("#modalview-archive-filter").data("kendoMobileModalView").close();
	},

	checkIfEmpty: function () {
		if (archive.dataSource.total() === 0) {
			// If the total still equals 0 after remove the filters
			archive.dataSource.filter({});
			if (archive.dataSource.total() === 0) {
				$('#archive-empty').show();
			}
		}
	},

	toggleSearch: function () {
		$('#search-archives > div').toggle(200);
	},

	search: function () {
		var filters = [];

		if (archiveView.sentinel.filters.contacts !== undefined) {
			filters.push({ field: 'message.sender.id', operator: 'eq', 'value': archiveView.sentinel.filters.contacts });
		}

		if (archiveView.sentinel.filters.chats !== undefined) {
			filters.push({ field: 'channelUUID', operator: 'eq', value: archiveView.sentinel.filters.chats });
		}

		if (archiveView.sentinel.filters.places !== undefined) {
			filters.push({ field: 'message.placeUUID', operator: 'eq', value: archiveView.sentinel.filters.places });
		}

		if (archiveView.sentinel.filters.date !== undefined) {
			filters.push({ field: 'message.date', operator: archiveView.sentinel.filters.date.operator, value: archiveView.sentinel.filters.date.value });
		}

		archive.search($('#search-archives input').val(), filters);

		if ($('#search-archives input').val() === '' && filters.length === 0) {
			archiveView.clearSearch();
			return;
		}

		if (archive.search($('#search-archives input').val(), filters) === false) {
			// Show nothing found
			$('#archive-search-empty').show();
			$('#archive-list').hide();
		}
		
		// Update the query results count
		var resultCount = 1 //filters.total();
		$("#resultCount").text(returnCount);

		// Show the results bar if results are found
		if(resultsCount > 0){
			$(".resultsBar").velocity("slideDown");
		} else {
			$(".resultsBar").velocity("slideUp");
		}
		
	},

	clearSearch: function () {
		$('#archive-search-empty').hide();
		$('#archive-list').show();
		archive.dataSource.filter({});
	},

	deleteDoc: function (e) {
		archive.remove(
			archive.dataSource.get($(e.target).data('id'))
		);

		archiveView.checkIfEmpty();
	},

	openObject: function (e) {
		var $object = $(e.currentTarget);
		if ($object.hasClass('link')) {
			window.open($object.data('url'), '_system');
		}
	},

	archiveClick: function(e){
		var selector = e.target.context;
		var selectorParent = e.target.context.parentElement;
		var $selectorUrl = $(selector).attr("src");
		// if photo card show full screen img
		if ($(selectorParent).hasClass("photoPreview") && $selectorUrl !== ""){
			$("#modalPhotoViewImage").attr("src", $selectorUrl);
			$("#modalPhotoView").data("kendoMobileModalView").open();
		}
	},
	archiveShare: function(){
		$("#testing").data("kendoMobileModalView").open();
		// todo - Wire up share
	},

	viewOpen: function(){
		$("#testing").data("kendoMobileModalView").open();
		// todo - wire up view options (map, web page, etc)
	},

	onFilterInit: function(){
		// TODO - replace tag ds
		var sampleTags = new kendo.data.DataSource({
		    data: [
		        { type: "chat", tag: "Don", id: 1 },
		        { type: "event", tag: "coachella", id: 2 },
		        { type: "photo", tag: "Grand Canyon", id: 3 },
		        { type: "link", tag: "google.com", id: 4 },
		        { type: "date", tag: "before Jan 19, 2015", id: 5 },
		        { type: "contact", tag: "John Smith", id: 6 },
		    ]
		});
		$(".tagList").kendoMobileListView({
			dataSource: sampleTags,
			template: $("#tag-template").html(),
			click: function(e){
				var selector = e.dataItem;
				var selectedLI = e.item[0];

				if($(selectedLI).hasClass("deletedLITag")){
					// if tag is toggled for delete remove delete
					$(selectedLI).removeClass("deletedLITag");
						
				} else {
					// highlight for delete
					$(selectedLI).addClass("deletedLITag");
				}

				// Show delete btn
				if($(".tagList > li").hasClass("deletedLITag")){
					$("#deleteTagBtn").removeClass("hidden");
				} else {
					$("#deleteTagBtn").addClass("hidden");
				}
				
				
			}
		});

	},

	filterChange: function(e){
		
		var selector = e.sender.element[0].id;
		var switcher = $("#"+selector).data("kendoMobileSwitch");

		// if filter is active show tag add input
		if(switcher.check()){
			$("."+selector+"-add").velocity("slideDown");
		} else {
			$("."+selector+"-add").velocity("slideUp");
		}
		
	},

	clearAllTags: function(e){
    	// Todo wire clear user query tags
    },

	saveFilters: function(e){
		// if user has deleted tags pending, alert them

		if($(".tagList > li").hasClass("deletedLITag")){
			$("#modal-OptionDialog").data("kendoMobileModalView").open();
		} else {
			// Todo - save filters
			APP.kendo.navigate('#:back');

			// Todo - Update filter count
			$("#filterCount").text("");
		}

		
	},
	openFilterDate: function(e){
		// TODO - wire up calendar 
		$("#modalview-dateFilter").data("kendoMobileModalView").open();
	},
	closeModalDateSelect: function(e){
		$("#modalview-dateFilter").data("kendoMobileModalView").close();
	},
	addFilter: function(e){
		// Todo - add to filter 
		var type = e.target[0].dataset["type"];

	}
};