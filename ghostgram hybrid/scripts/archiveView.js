'use strict';

var archiveView = {

	init: function () {
		if (archives.chat.dataSource.total() === 0 && 1) {
			archives.chat.add({
				id: 1,
				message: 'Testing yo',
				sender: 'Don',
				tags: 'red, blue',
				date: new Date()
			});

			archives.chat.add({
				id: 2,
				message: 'More tests!',
				sender: 'Don',
				tags: 'green',
				date: new Date()
			});
		}

		archiveView.checkIfEmpty();
	},

	checkIfEmpty: function () {
		if (archives.areEmpty() === true) {
			$('#archive .nothing-found').show();
			$('#archive main > *:not(.nothing-found)').hide();
			return;
		}
	},

	search: function () {
		archives.search($('#search-archives input').val());
	},

	deleteDoc: function (e) {
		archives.chat.remove(
			archives.chat.dataSource.get($(e.target).data('id'))
		);

		archiveView.checkIfEmpty();
	}
};