var parseKendoDataSourceFactory = {};

/**
 * Strips Parse metadata from Parse results (we don't need to permanently store the ACL), 
 * and sets the id, which the kendo DataSource requires.
 */

parseKendoDataSourceFactory.makeDataArrayFromParseArray = function(results) {
	var dataArray = [];
	results.forEach(function(parseObject) {
		delete parseObject.attributes.ACL;
		var newObject = parseObject.attributes;
		newObject.id = parseObject.id;
		dataArray.push(newObject);
	});
	return dataArray;
};

/**
 * Makes a local-only kendo DataSource
 */

parseKendoDataSourceFactory.makeLocal = function (parseObjectName, schema) {
	var dataSource = new kendo.data.DataSource({
		offlineStorage: parseObjectName,
		schema: {
			model: schema
		}
	});

	dataSource.initialized = true;

	return dataSource;

	dataSource.trigger('init');
};

parseKendoDataSourceFactory.make = function (parseObjectName, schema, createLocalOnly) {
	if(createLocalOnly === true) {
		return parseKendoDataSourceFactory.makeLocal(parseObjectName, schema);
	}

	var dataSource = new kendo.data.DataSource({
		offlineStorage: parseObjectName,
		schema: {
			model: schema
		},

		transport: {
			create: function(options) {

				if(Parse.User.current() === null) {
					options.error('Not logged in.');
					return;
				}

				//console.log('create', options.data, 'on', parseObjectName);

				var ParseObject = Parse.Object.extend(parseObjectName);
				var parseObject = new ParseObject();

				parseObject.setACL(new Parse.ACL(Parse.User.current()));

				parseObject.save(options.data, {
					success: function(newParseObject) {

						// For some reason left to the gods of javascript, sometimes Parse adds
						// an ACL object to the attributes, and sometimes not.
						// 
						// Let's just remove that...
						
						if(newParseObject.attributes.ACL !== undefined) {
							delete newParseObject.attributes.ACL;
						}

						var newObject = newParseObject.attributes;
						newObject.id = newParseObject.id;
						options.success(newObject);
						dataSource.trigger('create');
					},
					error: function(newParseObject, error) {
						options.error(error);
					}
				});
			},

			read: function(options) {

				if(Parse.User.current() === null) {
					options.error('Not logged in.');
					return;
				}

				//console.log('read', parseObjectName);

				var ParseObject = Parse.Object.extend(parseObjectName);
				var query = new Parse.Query(ParseObject);
				query.find({
					success: function(results) {
						options.success(parseKendoDataSourceFactory.makeDataArrayFromParseArray(results));
						if (dataSource.initialized !== true) {
							dataSource.initialized = true;
							dataSource.trigger('init');
						}
					},
					error: function(error) {
						options.error(error);
					}
				});
			},

			update: function(options) {

				if(Parse.User.current() === null) {
					options.error('Not logged in.');
					return;
				}

				//console.log('update', options.data, 'on', parseObjectName);

				var ParseObject = Parse.Object.extend(parseObjectName);
				var query = new Parse.Query(ParseObject);
				query.get(options.data.id, {
					success: function(parseObject) {
						parseObject.save(options.data, {
							success: function(newParseObject) {
								delete newParseObject.attributes.ACL;
								var newObject = newParseObject.attributes;
								newObject.id = newParseObject.id;
								options.success(newObject);
							},
							error: function(results, error) {
								options.error(error);
							}
						});
					},
					error: function(results, error) {
						options.error(error);
					}
				});
			},

			destroy: function(options) {

				if(Parse.User.current() === null) {
					options.error('Not logged in.');
					return;
				}

				//console.log('destroy', options.data, 'on', parseObjectName);

				var ParseObject = Parse.Object.extend(parseObjectName);
				var query = new Parse.Query(ParseObject);
				query.get(options.data.id, {
					success: function(parseObject) {
						/*
						var newACL = new Parse.ACL();
						newACL.setPublicReadAccess(true);
						newACL.setPublicWriteAccess(true);
						parseObject.setACL(newACL);
						*/
						parseObject.destroy({
							success: function(results) {
								options.success(results.attributes);
							},
							error: function(results, error) {
								options.error(error);
							}
						});
					},
					error: function(results, error) {
						options.error(error);
					}
				});
			}
		}
	});

	dataSource.online(navigator.onLine);

	$(window).on('offline', function () {
		dataSource.online(false);
	});

	$(window).on('online', function () {
		dataSource.online(true);
	});

	dataSource.initialized = false;

	return dataSource;

};