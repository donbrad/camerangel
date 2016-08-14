

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

		deviceModel.loadGoogleMaps();
		
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
				mobileNotify("intelligram version: " + deviceModel.appVersion);

			});

			cordova.plugins.notification.local.hasPermission(function(granted) {

				cordova.plugins.notification.local.registerPermission(function (granted) {

					cordova.plugins.notification.local.schedule({
						id         : 1,
						title      : 'Welcome Back!',
						text       : 'intelligram missed you...',
						sound      : null,
						autoClear  : true,
						at         : new Date(new Date().getTime())
					});
				});

			});

			// Initialize AppBuilder App Feedback Plugin
			//feedback.initialize('152d2190-9201-11e5-94db-2f6555e1caa0');
			window.open = cordova.InAppBrowser.open;



			ThreeDeeTouch.isAvailable(function (avail) {

				if (avail) {
					mobileNotify("3d Touch Enabled!");
					ThreeDeeTouch.configureQuickActions([
						{
							type: 'autotrack', // optional, but can be used in the onHomeIconPressed callback
							title: 'AutoTrack', // mandatory
							subtitle: 'Start Autotracking...' // optional
						},
						{
							type: 'photo',
							title: 'Photo', 
							subtitle: 'Take a quick photo'

						},
						{
							type: 'panic',
							title: 'Panic Button',
							subtitle: 'Contact family & friends'
						},
						{
							type: 'emergency',
							title: 'Emergency - 911',
							subtitle: 'Call 911, notice ICE'

						}
					]);

					ThreeDeeTouch.onHomeIconPressed = function (payload) {
						console.log("3D Touch. Type: " + payload.type + ". Title: " + payload.title + ".");
						var actionObj = {action: null, timestamp: new Date() };
						switch (payload.type) {
							case 'autotrack' :
								actionObj.action = 'autotrack';
								deviceModel.initialAction = actionObj;
								break;

							case 'camera' :
								actionObj.action = 'camera';
								deviceModel.initialAction = actionObj;
								break;

							case 'panic' :
								actionObj.action = 'panic';
								deviceModel.initialAction = actionObj;
								break;

							case 'emergency' :
								actionObj.action = 'emergency';
								deviceModel.initialAction = actionObj;
								break;

						}


					}
				}
			});

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

		//emojione.ascii = true;
		emojione.imageType = 'png';
		emojione.sprites = true;
		//emojione.imagePathSVGSprites = './bower_components/emojione/assets/sprites/emojione.sprites.svg';

		$.Redactor.prototype.iconic = function()
		{
			return {
				init: function ()
				{
					var icons = {
						'format': '<img src="images/icon-editor.svg" height="18">',
						'bold': '<img src="images/icon-bold.svg" height="18">',
						'italic': '<img src="images/icon-italic.svg" height="18">',
						'lists': '<img src="images/icon-list.svg" height="18">',
						'horizontalrule': '<img src="images/icon-grid.svg" height="18">'
					};

					$.each(this.button.all(), $.proxy(function(i,s)
					{
						var key = $(s).attr('rel');

						if (typeof icons[key] !== 'undefined')
						{
							var icon = icons[key];
							var button = this.button.get(key);
							this.button.setIcon(button, icon);
						}

					}, this));
				}
			};
		};
		$.Redactor.prototype.photos = function()
		{
			return {
				init: function ()
				{
					var button = this.button.add('photos', 'Photos');
					this.button.addCallback(button, this.photos.showActionSheet);

					// Set icon
					this.button.setIcon(button, '<img src="images/chat-camera.svg" height="18">');
				},
				showActionSheet: function(buttonName)
				{
					$("#notePhotoActions").data("kendoMobileActionSheet").open();
				}
			};
		};

		
		/* $(".email-Autocomplete").emailautocomplete({
		     domains: _emailDomainList //additional domains (optional)
		 }); */

		//window.semanticDSs = new SemanticDSs();

	}, false);



}(jQuery, document));