'use strict';

var archiveView = {

	init: function () {
		if (archive.dataSource.total() === 0 && 1) {
			archive.add({
				relID: 1,
				value: 'Testing yo',
				date: new Date(),
				internalTags: 'Don',
				userTags: 'blue, red',
				category: 'chat'

			});

			archive.add({
				relID: 2,
				value: 'More tests!',
				date: new Date(),
				internalTags: 'Don',
				userTags: 'green',
				category: 'chat'
			});
		}

		archiveView.checkIfEmpty();

		//archive.search('green since jan 1st 14');
	},

	checkIfEmpty: function () {
		if (archive.dataSource.total() === 0) {
			$('#archive .nothing-found').show();
			$('#archive main > *:not(.nothing-found)').hide();
		}
	},

	search: function () {
		if (archives.search($('#search-archives input').val()) === false) {
			// Show nothing found
		};
	},

	deleteDoc: function (e) {
		archive.remove(
			archive.dataSource.get($(e.target).data('id'))
		);

		archiveView.checkIfEmpty();
	}
};