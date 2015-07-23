'use strict';

var archive = {
	index: undefined,
	dataSource: undefined,

	initialize: function () {
		// If the localStorage is already there (because the user has already opened the app once), then load
		// the stored lunr index
		if (localStorage.getItem('archiveIndex')) {
			this.index = lunr.Index.load(JSON.parse(localStorage.getItem('archiveIndex')));
		// If the localStorage wasn't set, create a new index
		} else {
			this.index = lunr(function () {
				this.field('value');
				this.field('date');
				this.field('internalTags');
				this.field('userTags');
				this.field('category');
			});
			localStorage.setItem('archiveIndex', JSON.stringify(this.index.toJSON()));
		}

		// Used for auto-incrementing IDs in the add method
		if (localStorage.getItem('archiveID') === null) {
			localStorage.setItem('archiveID', 0);
		}

		// Offline data sources with a schema create an empty element for some reason.
		// Just gonna flag it if it's a new datasource and remove it below till Telerik fixes
		var newDataSource = false;
		if (localStorage.getItem('archiveDS') === null) {
			newDataSource = true;
		}

		this.dataSource = new kendo.data.DataSource({
			offlineStorage: 'archiveDS',
			group: { field: 'category' },
			schema: {
				model: {
					id: 'id',
					fields: {
						relID: { editable: false },
						value: { editable: false },
						date: { editable: false, type: 'date' },
						internalTags: { editable: false },
						userTags: { editable: false },
						category: { editable: false }
					}
				}
			}
		});
		this.dataSource.online(false);
		this.dataSource.fetch();

		// Bug fix, see above
		if (newDataSource === true) {
			this.dataSource.remove(this.dataSource.at(0));
			this.dataSource.sync();
		}
	},

	add: function (model) {

		// Auto increment ID
		model.id = parseInt(localStorage.getItem('archiveID'));
		localStorage.setItem('archiveID', model.id+1);

		// Model is what we're putting in the dataSource, doc is what we're putting the lunr index
		var doc = _.cloneDeep(model);
		delete doc.relID;

		// Format the doc date into a string
		var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		doc.date = doc.date.getDate() + ' ' + months[doc.date.getMonth()] + ' ' + doc.date.getFullYear();

		this.index.add(doc);
		// Update the local storage so the new doc in the index persists
		localStorage.setItem('archiveIndex', JSON.stringify(this.index.toJSON()));

		// Add the model to the data source
		this.dataSource.add(model);
		this.dataSource.sync();
	},

	remove: function (model) {
		this.index.remove(model);
		// Update the local storage so the doc removal from the index persists
		localStorage.setItem('archiveIndex', JSON.stringify(this.index.toJSON()));

		this.dataSource.remove(model);
		this.dataSource.sync();

		// Because we're using an offline dataSource, kendo expects the dataSource to come online
		// at some point so it can delete the model off the remote service as well. So it still stores
		// deleted values in localStorage, even after calling .sync. So we gotta open up the actual
		// localStorage and delete it out of there
		var dsLocalStorage = JSON.parse(localStorage.getItem('archiveDS'));

		// Look for matching model, splice it out
		var spliceIndex;
		dsLocalStorage.forEach( function (dsModel, index) {
			if (dsModel.id === model.id) {
				spliceIndex = index;
			}
		});
		dsLocalStorage.splice(spliceIndex, 1);

		// Re-store the newly-trimmed dataSource
		localStorage.setItem('archiveDS', JSON.stringify(dsLocalStorage));
	},

	search: function (query) {
		// Start the dataSource filter
		var filter = {
			logic: 'and',
			filters: [
				{
					logic: 'or',
					// ids from lunr go in here (id = this, or id = that, where this and that are lunr matches)
					filters: []
				}
				// Date filters would go here (less than certain date, greater than certain date)
			]
		};

		// Begin the epic regexs
		
		query = utils.replaceTextWithNumbers(query);

		// x days, weeks, etc. ago

		var xDaysAgo = /\d+\s(day|week|month|year)s?\sago/i;
		var matches = query.match(xDaysAgo);
		if (matches !== null) {
			var number = parseInt(query);
			var unit = matches[1];

			var middle = moment().subtract(number, unit+'s');
			var start = moment(middle).subtract(.5, unit+'s');
			var end = moment(middle).add(.5, unit+'s');

			filter.filters.push({ field: 'date', operator: 'gt', value: start.toDate() });
			filter.filters.push({ field: 'date', operator: 'lt', value: end.toDate() });

			query = query.replace(xDaysAgo, '');
		}

		// Get lunr matches

		var lunrMatches = this.index.search(query);

		if (lunrMatches.length === 0) {
			return false;
		}

		lunrMatches.forEach( function (lunrMatch) {
			filter.filters[0].filters.push({ field: 'id', operator: 'eq', value: parseInt(lunrMatch.ref) });
		});

		this.dataSource.filter(filter);

		return true;
	}
}

archive.initialize();