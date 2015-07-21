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


// Will probably move this below to its own file if it gets too big
var archives = {
	chat: new Archive('chat', function () {
		this.field('channel', { boost: 5 });
		this.field('tags', { boost: 5 });

		this.field('message', { boost: 10 });
		this.field('sender');
		this.field('date');
	}),

	contacts: new Archive('contacts', function () {
		this.field('channel', { boost: 5 });
		this.field('tags', { boost: 5 });

		this.field('name', { boost: 10 });
		this.field('alias');
		this.field('phone');
	}),

	locations: new Archive('locations', function () {
		this.field('channel', { boost: 5 });
		this.field('tags', { boost: 5 });

		this.field('name', { boost: 10 });
		this.field('address');
	}),

	events: new Archive('events', function () {
		this.field('channel', { boost: 5 });
		this.field('tags', { boost: 5 });

		this.field('name', { boost: 10 });
		this.field('venue');
		this.field('date');
	}),

	urls: new Archive('urls', function () {
		this.field('channel', { boost: 5 });
		this.field('tags', { boost: 5 });

		this.field('title', { boost: 10 });
		this.field('url');
		this.field('sender');
		this.field('date');
	}),

	photos: new Archive('photos', function () {
		this.field('channel', { boost: 5 });
		this.field('tags', { boost: 5 });

		this.field('date');
	}),

	areEmpty: function () {
		if (
			this.chat.index.toJSON().documentStore.length === 0 &&
			this.contacts.index.toJSON().documentStore.length === 0 &&
			this.locations.index.toJSON().documentStore.length === 0 &&
			this.events.index.toJSON().documentStore.length === 0 &&
			this.urls.index.toJSON().documentStore.length === 0 &&
			this.photos.index.toJSON().documentStore.length === 0
		) {
			return true;
		}

		return false;
	}
}