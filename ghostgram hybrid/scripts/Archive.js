'use strict';

var Archive = function (id, schema) {
	this.initialize(id, schema)
};

Archive.prototype = {
	index: undefined,

	initialize: function (id, schema) {

		// If the localStorage is already there (because the user has already opened the app once), then load
		// the stored lunr index
		if (localStorage.getItem(id+'Index')) {
			this.index = lunr.Index.load(JSON.parse(localStorage.getItem(id+'Index')));
			return;
		}

		// If the localStorage wasn't set, create a new index
		this.index = lunr(schema);
		localStorage.setItem(id+'Index', JSON.stringify(this.index.toJSON()));

		// Update the localStorage item any time there's a change to the index
		this.index.on('add', function () {
			localStorage.setItem(id+'Index', JSON.stringify(this.index.toJSON()));
		});

		this.index.on('update', function () {
			localStorage.setItem(id+'Index', JSON.stringify(this.index.toJSON()));
		});

		this.index.on('remove', function () {
			localStorage.setItem(id+'Index', JSON.stringify(this.index.toJSON()));
		});
	}
};