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
				this.field('messageChannelName');
				this.field('messageSenderName');
				this.field('messagePlaceName');
				this.field('messageAddress');
				this.field('messageEventName');
				this.field('messageText');

				this.field('type');
				this.field('tags');
				this.field('date');
			});
			localStorage.setItem('archiveIndex', JSON.stringify(this.index.toJSON()));
		}

		// Offline data sources with a schema create an empty element for some reason.
		// Just gonna flag it if it's a new datasource and remove it below till Telerik fixes
		var newDataSource = false;
		if (localStorage.getItem('archiveDS') === null) {
			newDataSource = true;
		}

		this.dataSource = new kendo.data.DataSource({
			offlineStorage: 'archiveDS',
			group: { field: 'type' },
			schema: {
				model: {
					id: 'id',
					fields: {
						'date': { type: 'date' }
					}
				}
			},
			filter: {
				logic: 'and',
				filters: []
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
		// Model is what we're putting in the dataSource, doc is what we're putting the lunr index
		model.id = uuid.v4();

		var doc = {
			id: model.id,
			messageChannelName: model.message.channelName,
			messageSenderName: model.message.sender.name,
			messagePlaceName: model.message.placeName,
			messageAddress: model.message.address,
			messageEventName: model.message.eventName,
			messageText: model.message.text,

			type: model.type,
			tags: model.tags
		};

		// Format the doc date into a string
		var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		doc.date = model.message.date.getDate() + ' ' + months[model.message.date.getMonth()] + ' ' + model.message.date.getFullYear();

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

	search: function (query, filters) {

		// Get lunr matches if there are any
		if (query !== '') {
			var lunrMatches = this.index.search(query);

			if (lunrMatches.length === 0) {
				return false;
			} else {
				filters.push({
					logic: 'or',
					// ids from lunr go in here (id = this, or id = that, where this and that are lunr matches)
					filters: []
				});

				lunrMatches.forEach( function (lunrMatch) {
					filters[filters.length-1].filters.push({ field: 'id', operator: 'eq', value: lunrMatch.ref });
				});
			}
		}

		this.dataSource.filter(filters);

		return true;
	}

/*
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
		var regex = /\d+\s(day|week|month|year)s?\sago/i;
		var matches = query.match(regex);
		if (matches !== null) {
			var number = parseInt(query);
			var unit = matches[1];

			var middle = moment().subtract(number, unit+'s');
			var start = moment(middle).subtract(.5, unit+'s');
			var end = moment(middle).add(.5, unit+'s');
		}

		// yesterday
		regex = /yesterday/i;
		matches = query.match(regex);
		if ( matches !== null) {
			var start = moment().subtract(1, 'days').startOf('day');
			var end = moment().startOf('day');
		}

		// since/before
		regex = /(since|before)\s((january|february|march|april|may|june|july|august|september|october|november|december)|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))\s(\d){1,2}(st|nd|rd|th)?(\s\d{2,4})?/i;
		matches = query.match(regex);
		if (matches !== null) {
			var dateString = matches[2]+' '+matches[5];
			var pattern = '';
			// matches[3] is the full month name
			if (matches[3] !== undefined) {
				pattern += 'MMMM';
			// matches[4] is the 3-letter abbreviation of the month
			} else {
				pattern += 'MMM';
			}

			pattern += ' D';

			// matches[7] is the year
			if (matches[7] !== undefined) {
				dateString += matches[7];
				// If the year is only two digits long
				if (matches[7].length === 3) {
					pattern += ' YY';
				// If it's 4 digits long
				} else if(matches[7].length === 5) {
					pattern += ' YYYY';
				}
			}

			if (matches[0] === 'since') {
				var start = moment(dateString, pattern);
			} else if (matches[0] === 'before') {
				var end = moment(dateString, pattern);
			}
		}

		// Add the filters and remove the matched string from the query
		if (start !== undefined) {
			filter.filters.push({ field: 'date', operator: 'gt', value: start.toDate() });
		}
		if (end !== undefined) {
			filter.filters.push({ field: 'date', operator: 'lt', value: end.toDate() });
		}
		if (start !== undefined || end !== undefined) {
			query = query.replace(regex, '');
		}

		// Get lunr matches

		var lunrMatches = this.index.search(query);

		if (lunrMatches.length === 0) {
			return false;
		}

		lunrMatches.forEach( function (lunrMatch) {
			filter.filters[0].filters.push({ field: 'id', operator: 'eq', value: lunrMatch.ref });
		});

		this.dataSource.filter(filter);

		return true;
	}
	*/
};

archive.initialize();