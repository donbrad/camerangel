/* global archive, Sentinel */

'use strict';

var archiveView = {

	sentinel: undefined,

	init: function () {
		if (archive.dataSource.total() === 0 && 1) {
			// chat
			archive.add({
				message: {
					channelId: '1',
					channelName: 'myplacez design',

					sender: {
						id: '1',
						name: 'Don Bradford',
						image: 'http://files.parsetfss.com/b7762404-2bdf-4947-a141-9fdd3b9daf41/tfss-c1b74c69-deea-43a4-b36a-685f95b76f90-61ebcea2-9085-4a3d-99f2-58e7cfe04eb3.png'
					},

					placeId: '1',
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
					channelId: '1',
					channelName: 'myplacez design',

					sender: {
						id: '1',
						name: 'Don Bradford',
						image: 'http://files.parsetfss.com/b7762404-2bdf-4947-a141-9fdd3b9daf41/tfss-c1b74c69-deea-43a4-b36a-685f95b76f90-61ebcea2-9085-4a3d-99f2-58e7cfe04eb3.png'
					},

					placeId: '1',
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

					placeId: '2',
					placeName: 'Iron Horse',
					address: '24 Main St., Northampton, MA',
					
					start: new Date(),
					end: new Date()
				}
			});
			
			// urls
			archive.add({
				message: {
					channelId: '2',
					channelName: 'ghostgram design',

					sender: {
						id: '1',
						name: 'Don Bradford',
						image: 'http://files.parsetfss.com/b7762404-2bdf-4947-a141-9fdd3b9daf41/tfss-c1b74c69-deea-43a4-b36a-685f95b76f90-61ebcea2-9085-4a3d-99f2-58e7cfe04eb3.png'
					},

					placeId: '1',
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
					channelId: '2',
					channelName: 'ghostgram design',

					sender: {
						id: '2',
						name: 'Jordan Escoto',
						image: 'https://pbs.twimg.com/profile_images/3365228794/6f017221480a3d8c4df6debf92240bb3_400x400.png'
					},

					placeId: '1',
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

		var returnCount = archive.dataSource.total();
		$("#resultCount").text(returnCount);

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
		$("#datepicker").kendoDatePicker();
			
		

		$("#select-easy-dates").kendoMobileButtonGroup({
            select: function(e) {
                //console.log("selected index:" + e.index);
            },
            index: 0
        });

        $("#multiselect").kendoMultiSelect();

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
				$('#archive main > *:not(#archive-empty)').hide();
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
			filters.push({ field: 'channelId', operator: 'eq', value: archiveView.sentinel.filters.chats });
		}

		if (archiveView.sentinel.filters.places !== undefined) {
			filters.push({ field: 'message.placeId', operator: 'eq', value: archiveView.sentinel.filters.places });
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
		var returnCount = archive.dataSource.total();
		$("#resultCount").text(returnCount);
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
	}
};