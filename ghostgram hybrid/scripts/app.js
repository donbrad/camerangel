(function($, doc) {
	var _app,
		_mapElem,
		_mapObj,
		_private,
		_appData = new AppData(),
		_isOnline = true;

	// create an object to store the models for each view
	window.APP = {

		models: {
			home: {
				title: 'ghostgrams',
				privateMode: false,
				invitesDS: new kendo.data.DataSource({
					offlineStorage: "invites-offline",
					sort: {
						field: "date",
						dir: "desc"
					}
				})
			},

			settings: {
				title: 'Settings',
				privacyModeEnabled: true,
				defaultVisible: false,
				locationTrigger: true,
				defaultTextSize: 14

			},

			presence: {
				title: 'Presence',
				current: new kendo.data.ObservableObject({
					isAvailable: true,
					isVisible: true,
					location: "",
					locationId: "",
					activity: "",
					activityInfo: "",
					message: "No personal message"
				})

			},


			placeChannel: {
				title: 'Place Chat',
				placeChannelDS: new kendo.data.DataSource({
					sort: {
						field: "date",
						dir: "desc"
					}
				}),
				placeArchiveDS: new kendo.data.DataSource(),
				current: new kendo.data.ObservableObject({
					placeId: '',
					googleId: '',
					factualId: '',
					lat: 0,
					lng: 0,
					publicName: '',
					alias: ''
				})

			},


			gallery: {
				title: 'gallery',
				currentPhoto: {},
				previewSize: "33%",
				parsePhoto: {},
				photosDS: new kendo.data.DataSource({  // this is the gallery datasource
						offlineStorage: "gallery-offline"
					})

			},



			sync: {
				operation: '',
				requestActive: false
			},

			semantic : {
				masterDS: new kendo.data.DataSource({
					group: 'category',
					sort: {
						field: "name",
						dir: "asc"
					},
					schema: {
						model: {
							id: "uuid"
						}
					}
				}),
				contactsDS : new kendo.data.DataSource({
					sort: {
						field: "name",
						dir: "asc"
					}
				}),
				chatsDS : new kendo.data.DataSource({
					sort: {
						field: "name",
						dir: "asc"
					}
				}),
				placesDS : new kendo.data.DataSource({
					sort: {
						field: "name",
						dir: "asc"
					}
				}),
				datesDS : new kendo.data.DataSource({

				})
			},

			places: {
				title: 'Places',
				locatorActive: false,

				placesDS: parseKendoDataSourceFactory.make('places', {
					id: 'id',
					fields: {
						uuid: {
							editable: false,
							nullable: false
						},
						category: {  // Place or CheckIn
							editable: true,
							nullable: false,
							defaultValue: 'Place'
						},
						placeChatId: {
							editable: false,
							defaultValue: ''
						},
						name: {   // Name chosen by the user
							editable: true,
							nullable: false,
							defaultValue: ''
						},
						venueName: {  // Name from googlePlaces or factual
							editable: false,
							nullable: true,
							defaultValue: ''
						},
						address: {  // Composite field for display - built from streetNumber, street, city, state and zip
							editable: false,
							nullable: false,
							defaultValue: ''
						},
						streetNumber: {
							editable: true,
							nullable: false,
							defaultValue: ''
						},
						street: {
							editable: false,
							defaultValue: ''
						},
						city: {
							editable: false,
							defaultValue: ''
						},
						state: {
							editable: false,
							defaultValue: ''
						},
						zip: {
							editable: false,
							defaultValue: ''
						},
						country: {
							editable: false,
							defaultValue: ''
						},
						googleId: {   // googleid - from googlePlaces
							editable: false,
							defaultValue: ''
						},
						factualId: {  // factualId -- optional if place exists in factual
							editable: false,
							defaultValue: ''
						},
						lat: {
							editable: false,
							type: 'number'
						},
						lng: {
							editable: false,
							type: 'number'
						},
						isAvailable: {  // Is the user avaiable or busy here?  Sets default value, user can override
							editable: true,
							nullable: false,
							type: 'boolean',
							defaultValue: true
						},
						isVisible: {  // Is the user visible here?  Sets default value, user can override
							editable: true,
							nullable: false,
							type: 'boolean',
							defaultValue: true
						},
						isPrivate: {   // Private place = only members can see it, Public Place = visible to gg users
							editable: true,
							nullable: false,
							type: 'boolean',
							defaultValue: true
						}
					}
				})
			}
		},
		kendo: null,
		pubnub: null,
		map: {},

		/*checkPubnub: function() {

		updateGeoLocation: function(callback) {
			APP.geoLocator.getCurrentPosition(function(position, error) {
				if (error === null) {
					APP.location.position = position;
					if (callback !== undefined) {
						callback(position.coords.latitude, position.coords.longitude);
					}
					reverseGeoCode(position.coords.latitude, position.coords.longitude);
					//mobileNotify("Located you at " + position.coords.latitude + " , " + position.coords.longitude);
				} else {
					mobileNotify("GeoLocator error : " + error);
				}

			});
		},

	/*	state: {
			inPrivacyMode: false,
			isVisible: true,
			isAvailable: true,
			rememberUsername: false,
			isOnline: true,
			inBackground: false,
			userNotifications: [],
			phoneVerified: false,
			hasContacts: false,
			hasChannels: false,
			hasPlaces: false,
			introFetched: false
		}*/

	};

	//Private methods
	_private = {
		getLocation: function(options) {
			var dfd = new $.Deferred();

			//Default value for options
			if (options === undefined) {
				options = {
					enableHighAccuracy: true
				};
			}

			navigator.geolocation.getCurrentPosition(
				function(position) {
					dfd.resolve(position);
				},
				function(error) {
					dfd.reject(error);
				},
				options);

			return dfd.promise();
		},

		initMap: function(position) {
			//Delcare function variables
			var myOptions,
				mapObj = _mapObj,
				mapElem = _mapElem,
				pin,
				locations = [],
				latlng;

			_mapElem = mapElem; //Cache DOM element

			// Use Google API to get the location data for the current coordinates
			latlng = [position.coords.latitude, position.coords.longitude];

			APP.models.places.latlng = latlng;
			APP.models.places.lat = position.coords.latitude;
			APP.models.places.lng = position.coords.longitude;
			APP.models.places.mapZoom = 12;

			/*			mapObj = $("#places-mapview").kendoMap({
			                center: [position.coords.latitude, position.coords.longitude],
			                zoom: 12,
			            layers: [{
			            type: "tile",
			            urlTemplate: "http://tile.openstreetmap.org/#= zoom #/#= x #/#= y #.png",
			            attribution: "&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
			        }],
			                    markers: [{
			                        location: [APP.models.places.lat,  APP.models.places.lng],
			                        shape: "here",
			                        title: "Current Location"
			                    }]
			        });
						_mapObj = mapObj; //Cache at app level
					*/

		}
	};

	_app = {
/*
		init: function() {

		},

		onPause: function() {
			APP.setAppState('inBackground', true);

		},

		onResume: function() {
			APP.setAppState('inBackground', false);
		},

		onOnline: function() {
			APP.setAppState('isOnline', true);
			// Take all data sources online

			APP.models.home.invitesDS.online(true);
			APP.models.home.notificationDS.online(true);
			channelModel.channelsDS.online(true);
			photoModel.photosDS.online(true);
			contactModel.contactsDS.online(true);
			APP.models.places.placesDS.online(true);

			getNetworkState();
		},

		onOffline: function() {
			APP.setAppState('isOnline', false);
			// Take all data sources offline

			APP.models.home.invitesDS.online(false);
			APP.models.home.notificationDS.online(false);
			channelModel.channelsDS.online(false);
			photoModel.photosDS.online(false);
			contactModel.contactsDS.online(false);
			APP.models.places.placesDS.online(false);

		},


		saveAppState: function() {
			window.localStorage.setItem('ggAppState', JSON.stringify(APP.state));
		},

		getAppState: function() {
			var state = window.localStorage.getItem('ggAppState');
			if (state !== undefined && state !== null)
				APP.state = JSON.parse(state);
			else
				_app.saveAppState();
		},
*/




		placesInit: function() {
			_mapElem = $("#places-mapview");

		},

		placesShow: function() {
			//Don't attempt to reload map/sb data if offline
			//console.log("ONLINE", _isOnline);
			if (_isOnline === false) {
				mobileNotify("Please reconnect to the Internet to load locations.");
				return;
			}

			_private.getLocation()
				.done(function(position) {
					_private.initMap(position);
				})
				.fail(function(error) {
					alert(error.message); /*TODO: Better handling*/
				});

		}
	};

	$.extend(window, {

		onShowPlaces: _app.placesShow,
		onInitPlaces: _app.placesInit,
	});

	// Add event listeners
	document.addEventListener("pause", deviceModel.onPause, false);
	document.addEventListener("resume", deviceModel.onResume, false);


	document.addEventListener("online", deviceModel.onOnline, false);
	document.addEventListener("offline", deviceModel.onOffline, false);



	// this function is called by Cordova when the application is loaded by the device
	document.addEventListener('deviceready', function() {

		deviceModel.getAppState();

		deviceModel.getNetworkState();

		deviceModel.init();


		// hide the splash screen as soon as the app is ready. otherwise

		navigator.splashscreen.hide();
		// Set status bar color

		StatusBar.overlaysWebView(false);
		StatusBar.backgroundColorByHexString("#fff");
		StatusBar.styleDefault();
		
		Parse.initialize("lbIysFqoATM1uTxebFf5s8teshcznua2GQLsx22F", "MmrJS8jR0QpKxbhS2cPjjxsLQKAuGuUHKtVPfVj5");
		Parse.User.enableRevocableSession();

		contactModel.init();

	/*	if (!deviceModel.state.introFetched) {

			notificationModel.parseFetch();

		} else {*/
			notificationModel.localStorageFetch();
		/*}*/

		userModel.initParse();

		mapModel.init();

		placesModel.init();

		pruneNotifications();

		// Uncomment to load all device contacts at initialization - major performance hit!!
		//contactModel.importDeviceContacts();

		APP.kendo = new kendo.mobile.Application(document.body, {

			// comment out the following line to get a UI which matches the look
			// and feel of the operating system
			skin: 'material',

			// the application needs to know which view to load first
			initial: userModel.initialView
		});

		// Provide basic functionality in the simulator and deployable simulator
		if (window.navigator.simulator === true) {
			deviceModel.appVersion = "0.1.9.8";
		} else {
			cordova.getAppVersion.getVersionNumber(function(version) {
				deviceModel.appVersion = version;
			});

			cordova.plugins.notification.local.ontrigger = function(id, state, json) {
				var message = 'ID: ' + id + (json == '' ? '' : '\nData: ' + json);
				navigator.notification.alert(message, null, 'Notification received while the app was in the foreground', 'Close');
			};

			cordova.plugins.notification.local.hasPermission(function(granted) {
				if (!granted)
					mobileNotify('Local notifications Disabled !!!');
				/*cordova.plugins.notification.local.cancelAll(
				  function() {
					MobileNotify("Local notifications cleared");
				  }
				);*/

			});

			// hiding the accessory bar
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}
		
		APP.emailAvailable = false;
		/*  window.plugins.email.isAvailable(function (result){
			APP.emailAvailable = result;
		});
        */




		/* $(".email-Autocomplete").emailautocomplete({
		     domains: _emailDomainList //additional domains (optional)
		 }); */

		window.semanticDSs = new SemanticDSs();

	}, false);



}(jQuery, document));