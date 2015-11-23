(function($, doc) {
	var _app,
		_private,
		_isOnline = true;

	// create an object to store the models for each view
	window.APP = {

		models: {


			sync: {
				operation: '',
				requestActive: false
			},

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
			}
		},


		kendo: null,
		pubnub: null,
		map: {}

	};




	// this function is called by Cordova when the application is loaded by the device
	document.addEventListener('deviceready', function() {

		// Initialize AppBuilder App Feedback Plugin
		feedback.initialize('152d2190-9201-11e5-94db-2f6555e1caa0');

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
		
		Parse.initialize("lbIysFqoATM1uTxebFf5s8teshcznua2GQLsx22F", "MmrJS8jR0QpKxbhS2cPjjxsLQKAuGuUHKtVPfVj5");
		//Parse.User.enableRevocableSession();

		contactModel.init();

	/*	if (!deviceModel.state.introFetched) {

			notificationModel.parseFetch();

		} else {*/
			notificationModel.localStorageFetch();
		/*}*/

		userModel.initParse();

		mapModel.init();

		placesModel.init();

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
			deviceModel.appVersion = "emulator: 0.2.1.5";
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
						at         : new Date(new Date().getTime() + 100)
					});
				});



			});

			cordova.plugins.notification.local.ontrigger = function(id, state, json) {
				var message = 'ID: ' + id + (json == '' ? '' : '\nData: ' + json);
				navigator.notification.alert(message, null, 'Notification received while the app was in the foreground', 'Close');
			};


			// hiding the accessory bar
			//cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}
		
		APP.emailAvailable = false;


		/* $(".email-Autocomplete").emailautocomplete({
		     domains: _emailDomainList //additional domains (optional)
		 }); */

		window.semanticDSs = new SemanticDSs();

	}, false);



}(jQuery, document));