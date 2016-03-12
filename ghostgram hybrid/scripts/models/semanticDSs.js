'use strict';

var SemanticDSs = function () {
	this.initialize();
}

SemanticDSs.prototype = {

	contacts: undefined,
	places: undefined,
	chats: undefined,

	initialize: function () {

		this.contacts = this.makeSemanticDataSource('Contacts', contactModel.contactsDS, {
			name: 'name',
			alias: 'alias',
			value: 'name'
		});

		this.places = this.makeSemanticDataSource('Places', placesModel.placesDS, {
			name: 'name',
			alias: 'alias',
			value: 'address'
		});

		this.chats = this.makeSemanticDataSource('Chats', channelModel.channelsDS, {
			name: 'name',
			alias: 'alias',
			value: 'name'
		});

	this.master = new kendo.data.DataSource({
			schema: {
				model: {
					id: 'uuid',
					fields: {
						name: { type: 'string' },
						alias: { type: 'string' },
						value: { type: 'string' },
						uuid: { type: 'string' },
						category: { type: 'string' }
					}
				}
			}
		});

		// Putting this in the data property of the constructor above doesn't work for some reason,
		// so adding them manually

		var masterData = []
			.concat(this.contacts.data().toJSON())
			.concat(this.places.data().toJSON())
			.concat(this.chats.data().toJSON());

		masterData.forEach( function (item) {
			delete item.__state__;
			this.master.add(item);
		}.bind(this));
		

		this.bindToMaster(this.contacts);
		this.bindToMaster(this.places);
		this.bindToMaster(this.chats);
	},

	makeSemanticDataSource: function (category, masterDS, map) {
		// Offline data sources with a schema create an empty element for some reason.
		// Just gonna flag it if it's a new datasource and remove it below till Telerik fixes
		var newDataSource = false;
		if (localStorage.getItem('semantic'+category) === null) {
			newDataSource = true;
		}

		var dataSource = new kendo.data.DataSource({
			offlineStorage: 'semantic'+category,
			schema: {
				model: {
					id: 'uuid',
					fields: {
						name: { type: 'string' },
						alias: { type: 'string' },
						value: { type: 'string' },
						uuid: { type: 'string' },
						category: { type: 'string' }
					}
				}
			}
		});

		// Bug fix, see above
		if (newDataSource === true) {
			dataSource.remove(dataSource.at(0));
			dataSource.sync();
		}

		dataSource.online(false);
		dataSource.fetch( function () {
			// If the dataSource isn't empty, we're set, return out
			if (dataSource.data().length !== 0) {
				return;
			}

			// Otherwise, populate it from the masterDS
			var masterDSData = masterDS.data();
			masterDSData.forEach( function (masterData) {
				dataSource.add({
					name: masterData[map.name],
					alias: masterData[map.alias],
					value: masterData[map.value],
					uuid: masterData.uuid,
					category: category
				});
			});

			dataSource.sync();
		});

		masterDS.bind('change', function (e) {
			switch (e.action) {
				case 'add':
					dataSource.add({
						name: e.items[0][map.name],
						alias: e.items[0][map.alias],
						value: e.items[0][map.value],
						uuid: e.items[0].uuid,
						category: category
					});
					break;
				case 'remove':
					dataSource.filter({ field: 'uuid', operator: 'eq', value: e.items[0].uuid });
					var view = dataSource.view();
					dataSource.remove(view[0]);
					dataSource.filter({});
					break;
				case 'itemchange':
					dataSource.filter({ field: 'uuid', operator: 'eq', value: e.items[0].uuid });
					var view = dataSource.view();
					//Todo: tucker please review
					/*
					view[0].name = changedItem[map.name];
					view[0].alias = changedItem[map.alias];
					view[0].value = changedItem[map.value];
					*/
					dataSource.filter({});
					break;
			}

			dataSource.sync();
		});

		return dataSource;
	},

	bindToMaster: function (subDS) {
		subDS.bind('change', function (e) {
			switch (e.action) {
				case 'add':
					this.master.add(e.items[0]);
					break;
				case 'remove':
					this.master.filter([
						{ field: 'uuid', operator: 'eq', value: e.items[0].uuid },
						{ field: 'category', operator: 'eq', value: e.items[0].category }
					]);
					var view = this.master.view();
					this.master.remove(view[0]);
					this.master.filter({});
					break;
				case 'itemchange':
					this.master.filter([
						{ field: 'uuid', operator: 'eq', value: e.items[0].uuid },
						{ field: 'category', operator: 'eq', value: e.items[0].category }
					]);
					var view = this.master.view();
					//Todo: tucker please review
					/*
					view[0].name = changedItem[map.name];
					view[0].alias = changedItem[map.alias];
					view[0].value = changedItem[map.value];
					*/
					dataSource.filter({});
					break;
			}
		}.bind(this));
	}
};