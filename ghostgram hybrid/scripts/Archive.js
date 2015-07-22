'use strict';

var Archive = function Archive(id, schema) {
	this.initialize(id, schema);
};

Archive.prototype = {
	id: undefined,
	index: undefined,
	dataSource: undefined,

	initialize: function (id, schema) {
		this.id = id;

		// If the localStorage is already there (because the user has already opened the app once), then load
		// the stored lunr index
		if (localStorage.getItem(id+'Index')) {
			this.index = lunr.Index.load(JSON.parse(localStorage.getItem(id+'Index')));
		// If the localStorage wasn't set, create a new index
		} else {
			this.index = lunr(schema);
			localStorage.setItem(id+'Index', JSON.stringify(this.index.toJSON()));
		}

		this.dataSource = new kendo.data.DataSource({
			offlineStorage: id+'IndexDS',
			schema: {
				model: {
					id: 'id'
				}
			}
		});
		this.dataSource.online(false);
		this.dataSource.fetch();
	},

	add: function (model) {
		var doc = _.cloneDeep(model);

		// If the current field has a date, format it into a string
		if (doc.date) {
			var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
			doc.date = doc.date.getDate() + ' ' + months[doc.date.getMonth()] + ' ' + doc.date.getFullYear();
		}

		this.index.add(doc);
		// Update the local storage so the new doc in the index persists
		localStorage.setItem(this.id+'Index', JSON.stringify(this.index.toJSON()));

		// Add the model to the data source
		this.dataSource.add(model);
		this.dataSource.sync();
	},

	remove: function (model) {
		this.index.remove(model);
		// Update the local storage so the doc removal from the index persists
		localStorage.setItem(this.id+'Index', JSON.stringify(this.index.toJSON()));

		this.dataSource.remove(model);
		this.dataSource.sync();

		// Because we're using an offline dataSource, kendo expects the dataSource to come online
		// at some point so it can delete the model off the remote service as well. So it still stores
		// deleted values in localStorage, even after calling .sync. So we gotta open up the actual
		// localStorage and delete it out of there
		var dsLocalStorage = JSON.parse(localStorage.getItem(this.id+'IndexDS'));

		// Look for matching model, splice it out
		var spliceIndex;
		dsLocalStorage.forEach( function (dsModel, index) {
			if (dsModel.id === model.id) {
				spliceIndex = index;
			}
		});
		dsLocalStorage.splice(spliceIndex, 1);

		// Re-store the newly-trimmed dataSource
		localStorage.setItem(this.id+'IndexDS', JSON.stringify(dsLocalStorage));
	}
};


// Will probably move this to its own file if it gets too big
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
	},

	search: function (query) {

		query = utils.replaceTextWithNumbers(query);

		// Loop through all the archives
		for (var key in this) {
			// Ignore anything on the Object that's not an Archive (such as methods, other properties)
			if (this[key] instanceof Archive === false) {
				return;
			}

			var lunrMatches = this[key].index.search(query);

			var filter = {
				logic: 'or',
				filters: []
			};

			lunrMatches.forEach( function (lunrMatch) {
				filter.filters.push({ field: 'id', operator: 'eq', value: parseInt(lunrMatch.ref) });
			});

			this[key].dataSource.filter(filter);
		}
	}
}