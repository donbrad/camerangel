

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
		
		//Parse.initialize("lbIysFqoATM1uTxebFf5s8teshcznua2GQLsx22F", "MmrJS8jR0QpKxbhS2cPjjxsLQKAuGuUHKtVPfVj5");
		//Parse.User.enableRevocableSession();
		userModel.init();
		
		everlive.init();

	/*	if (!deviceModel.state.introFetched) {

			notificationModel.parseFetch();

		} else {*/
			notificationModel.localStorageFetch();
		/*}*/



		//userModel.initCloud();

		
		// pruneNotifications();

		// Uncomment to load all device contacts at initialization - major performance hit!!
		//contactModel.importDeviceContacts();


		deviceModel.appVersion = "emulator: 0.0.28";
		userModel._user.set('appVersion', deviceModel.appVersion);
		// Provide basic functionality in the simulator and deployable simulator
		if (window.navigator.simulator === undefined) {
			cordova.getAppVersion.getVersionCode(function(version) {

				if (typeof version === 'number') {
					version = 'android: ' + version.toString();
				}

				deviceModel.appVersion = version;
				userModel._user.set('appVersion', version);
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

			// Initialize AppBuilder App Feedback Plugin
			//feedback.initialize('152d2190-9201-11e5-94db-2f6555e1caa0');
			window.open = cordova.InAppBrowser.open;

/*			var projectKey = "7a8cc314b41f44299fd03db24685b341";


			window.analytics = {
				start: function() {
					var factory = window.plugins.EqatecAnalytics.Factory,
						monitor = window.plugins.EqatecAnalytics.Monitor,
						settings = factory.CreateSettings( projectKey, version );

					settings.LoggingInterface = factory.CreateTraceLogger();
					factory.CreateMonitorWithSettings( settings,
						function() {
							console.log( "Monitor created" );
							monitor.Start(function() {
								console.log( "Monitor started" );
							});
						},
						function( msg ) {
							console.log( "Error creating monitor: " + msg );
						});
				},
				stop: function() {
					var monitor = window.plugins.EqatecAnalytics.Monitor;
					monitor.Stop();
				},
				monitor: function() {
					return window.plugins.EqatecAnalytics.Monitor;
				}
			};

			window.analytics.start();
			document.addEventListener( "pause", function() {
				window.analytics.stop();
			});
			document.addEventListener( "resume", function() {
				window.analytics.start();
			});

			window.onerror = function( message, url, lineNumber, columnNumber, error ) {
				window.analytics.monitor().TrackExceptionMessage( error, message );
			};*/

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
			// hiding the accessory bar -- Apple will reject all apps that do this!!!!!!
			//cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}
		
		APP.emailAvailable = false;

		emojione.imageType = 'svg';
		emojione.sprites = true;
		emojione.imagePathSVGSprites = 'bower_components/emojione/assets/sprites/emojione.sprites.svg';
		
		if (window.navigator.simulator === undefined) {
			shake.startWatch(function () {
				hotButtonView.openModal();
			}, 25 /*, onError */);
		}

		
		/* $(".email-Autocomplete").emailautocomplete({
		     domains: _emailDomainList //additional domains (optional)
		 }); */

		//window.semanticDSs = new SemanticDSs();

	}, false);



}(jQuery, document));