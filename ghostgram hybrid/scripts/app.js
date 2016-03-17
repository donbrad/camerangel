

(function($, doc) {
	var _app,
		_private,
		_isOnline = true;
	// create an object to store the models for each view
	window.APP = {
		version: "prealpha : 0.8",

		models: {


			sync: {
				operation: '',
				requestActive: false
			}/*,

			semantic: {
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
				contactsDS: new kendo.data.DataSource({
					sort: {
						field: "name",
						dir: "asc"
					}
				}),
				chatsDS: new kendo.data.DataSource({
					sort: {
						field: "name",
						dir: "asc"
					}
				}),
				placesDS: new kendo.data.DataSource({
					sort: {
						field: "name",
						dir: "asc"
					}
				}),
				datesDS: new kendo.data.DataSource({})
			}*/
		},


		kendo: null,
		pubnub: null,
		everlive: null,
		map: {}

	};


	// this function is called by Cordova when the application is loaded by the device
	document.addEventListener('deviceready', function() {

		if (window.navigator.simulator === undefined) {
			// Initialize AppBuilder App Feedback Plugin
			feedback.initialize('152d2190-9201-11e5-94db-2f6555e1caa0');
			window.open = cordova.InAppBrowser.open;
		}
		// Add event listeners
		document.addEventListener("pause", deviceModel.onPause, false);
		document.addEventListener("resume", deviceModel.onResume, false);


		document.addEventListener("online", deviceModel.onOnline, false);
		document.addEventListener("offline", deviceModel.onOffline, false);

		// special Pause / Resume for iOS related to locked and unlocked modes for the phone...
		document.addEventListener("resign", deviceModel.onResign, false);
		document.addEventListener("active", deviceModel.onActive, false);

		deviceModel.getAppState();

		deviceModel.getNetworkState();

		deviceModel.init();

		// hide the splash screen as soon as the app is ready. otherwise
		navigator.splashscreen.hide();
		// Set status bar color

		StatusBar.overlaysWebView(false);
		StatusBar.backgroundColorByHexString("#fff");
		StatusBar.styleDefault();

		var provider = Everlive.Constants.StorageProvider.FileSystem;
		if (window.navigator.simulator === undefined) {
			// Use local storage in the emulator
			provider = Everlive.Constants.StorageProvider.LocalStorage;
		}

		Parse.initialize("lbIysFqoATM1uTxebFf5s8teshcznua2GQLsx22F", "MmrJS8jR0QpKxbhS2cPjjxsLQKAuGuUHKtVPfVj5");
		//Parse.User.enableRevocableSession();

		APP.everlive = new Everlive({
			appId: 's2fo2sasaubcx7qe',
			scheme: 'https',
			offline: true,
			offlineStorage: {
				storage: {
					provider: provider
				}/*,
				conflicts: {
					strategy: Everlive.Constants.ConflictResolutionStrategy.ClientWins
				}*/
			},
			encryption: {
				provider: Everlive.Constants.EncryptionProvider.Default
				//key: 'intelligram'
			},
			authentication: {
				persist: true,
				onAuthenticationRequired: function() {
					APP.kendo.navigate('#usersignin');
				}
			}
		});


		// Wire up the everlive sync monitors
		APP.everlive.on('syncStart', everlive.syncStart);

		APP.everlive.on('syncEnd', everlive.syncEnd);


	/*	if (!deviceModel.state.introFetched) {

			notificationModel.parseFetch();

		} else {*/
			notificationModel.localStorageFetch();
		/*}*/

		userModel.init();

		userModel.initParse();

		contactModel.init();

		mapModel.init();

		placesModel.init();

		privateNoteModel.init();  // Depends on everlive...

		memberdirectory.init();

		photoModel.init();

		channelModel.init();

		smartEvent.init();

		smartMovie.init();

		tagModel.init();

		if (window.navigator.simulator === undefined) {
			serverPush.init();
		}

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
		if (window.navigator.simulator !== undefined) {
			deviceModel.appVersion = "emulator: 0.0.10";
			userModel.currentUser.set('appVersion', deviceModel.appVersion);
		} else {
			cordova.getAppVersion.getVersionCode(function(version) {

				if (typeof version === 'number') {
					version = 'android: ' + version.toString();
				}

				deviceModel.appVersion = version;
				userModel.currentUser.set('appVersion', version);
				mobileNotify("ghostgrams version: " + deviceModel.appVersion);

			});

			cordova.plugins.notification.local.hasPermission(function(granted) {

				cordova.plugins.notification.local.registerPermission(function (granted) {

					cordova.plugins.notification.local.schedule({
						id         : 1,
						title      : 'Welcome Back!',
						text       : 'ghostgrams missed you...',
						sound      : null,
						autoClear  : true,
						at         : new Date(new Date().getTime())
					});
				});



			});

			/*cordova.plugins.notification.local.ontrigger = function(id, state, json) {
				var message = 'ID: ' + id + (json == '' ? '' : '\nData: ' + json);
				navigator.notification.alert(message, null, 'Notification received while the app was in the foreground', 'Close');
			};*/

			window.addEventListener('native.keyboardshow', function (e) {
				// Hide the page header
			});

			window.addEventListener('native.keyboardhide', function (e) {
				// Show the page header

			});
			// hiding the accessory bar
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}
		
		APP.emailAvailable = false;

		/* $(".email-Autocomplete").emailautocomplete({
		     domains: _emailDomainList //additional domains (optional)
		 }); */

		//window.semanticDSs = new SemanticDSs();

	}, false);



}(jQuery, document));