'use strict';

var archiveView = {

	init: function () {
		if (archive.dataSource.total() === 0 && 1) {
			// chat
			archive.add({
				message: {
					channelId: '1',
					channelName: 'myplacez design',

					sender: {
						id: 'asdf',
						name: 'Don Bradford',
						image: 'http://files.parsetfss.com/b7762404-2bdf-4947-a141-9fdd3b9daf41/tfss-c1b74c69-deea-43a4-b36a-685f95b76f90-61ebcea2-9085-4a3d-99f2-58e7cfe04eb3.png'
					},

					placeId: 'asdf',
					placeName: 'Home',
					address: '221 Davis St., Greenfield, MA',

					eventId: 'asdf',
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
						id: 'asdf',
						name: 'Don Bradford',
						image: 'http://files.parsetfss.com/b7762404-2bdf-4947-a141-9fdd3b9daf41/tfss-c1b74c69-deea-43a4-b36a-685f95b76f90-61ebcea2-9085-4a3d-99f2-58e7cfe04eb3.png'
					},

					placeId: 'asdf',
					placeName: 'Home',
					address: '221 Davis St., Greenfield, MA',

					eventId: 'asdf',
					eventName: 'Work at Don\'s',

					text: 'Awesome concert next weekend!',
					date: new Date()
				},
				type: 'Events',
				tags: '',
				date: new Date(),
				object: {
					name: 'Margot and the Nukes',

					placeId: 'asdf',
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
						id: 'asdf',
						name: 'Don Bradford',
						image: 'http://files.parsetfss.com/b7762404-2bdf-4947-a141-9fdd3b9daf41/tfss-c1b74c69-deea-43a4-b36a-685f95b76f90-61ebcea2-9085-4a3d-99f2-58e7cfe04eb3.png'
					},

					placeId: 'asdf',
					placeName: 'Home',
					address: '221 Davis St., Greenfield, MA',

					eventId: 'asdf',
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
						id: 'asdf',
						name: 'Don Bradford',
						image: 'http://files.parsetfss.com/b7762404-2bdf-4947-a141-9fdd3b9daf41/tfss-c1b74c69-deea-43a4-b36a-685f95b76f90-61ebcea2-9085-4a3d-99f2-58e7cfe04eb3.png'
					},

					placeId: 'asdf',
					placeName: 'Home',
					address: '221 Davis St., Greenfield, MA',

					eventId: 'asdf',
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
					address: 'OR',

					date: new Date()
				}
			});
		}

		archiveView.checkIfEmpty();

		$('#search-archives input').clearSearch({ callback: archiveView.clearSearch });

		// Binding this manually because data-role="button" messes up the styles
		$('#archive-list').on('click', '.object', archiveView.openObject);

		new Sentinel($('#search-archives input'));
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

	search: function () {
		if ($('#search-archives input').val() === '') {
			archiveView.clearSearch();
			return;
		}

		if (archive.search($('#search-archives input').val()) === false) {
			// Show nothing found
			$('#archive-search-empty').show();
			$('#archive-list').hide();
		};
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
			window.open($object.data('url'), '_system');;
		}
	}
};