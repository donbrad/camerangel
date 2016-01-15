

(function($, doc) {
	var _app,
		_private,
		_isOnline = true;

	// create an object to store the models for each view
	window.APP = {
		version: "prealpha : 0.2.2.7",

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

		if (window.navigator.simulator === undefined) {
			// Initialize AppBuilder App Feedback Plugin
			feedback.initialize('152d2190-9201-11e5-94db-2f6555e1caa0');
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

		// Add undo and redo to chat editor
		/*$.Redactor.prototype.bufferbuttons = function()
		{
			return {
				init: function()
				{
					var undo = this.button.addFirst('undo', 'Undo');
					var redo = this.button.addAfter('undo', 'redo', 'Redo');

					this.button.addCallback(undo, this.buffer.undo);
					this.button.addCallback(redo, this.buffer.redo);
				}
			};
		};*/

		$.Redactor.prototype.source = function()
		{
			return {
				init: function()
				{
					var button = this.button.addFirst('html', 'HTML');
					this.button.addCallback(button, this.source.toggle);

					var style = {
						'width': '100%',
						'margin': '0',
						'background': '#111',
						'box-sizing': 'border-box',
						'color': 'rgba(255, 255, 255, .8)',
						'font-size': '14px',
						'outline': 'none',
						'padding': '16px',
						'line-height': '22px',
						'font-family': 'Menlo, Monaco, Consolas, "Courier New", monospace'
					};

					this.source.$textarea = $('<textarea />');
					this.source.$textarea.css(style).hide();

					if (this.opts.type === 'textarea')
					{
						this.core.box().append(this.source.$textarea);
					}
					else
					{
						this.core.box().after(this.source.$textarea);
					}

					this.core.element().on('destroy.callback.redactor', $.proxy(function()
					{
						this.source.$textarea.remove();

					}, this));

				},
				toggle: function()
				{
					return (this.source.$textarea.hasClass('open')) ? this.source.hide() : this.source.show();
				},
				setCaretOnShow: function()
				{
					this.source.offset = this.offset.get();
					var scroll = $(window).scrollTop();

					var	width = this.core.editor().innerWidth();
					var height = this.core.editor().innerHeight();

					// caret position sync
					this.source.start = 0;
					this.source.end = 0;
					var $editorDiv = $("<div/>").append($.parseHTML(this.core.editor().html(), document, true));
					var $selectionMarkers = $editorDiv.find("span.redactor-selection-marker");

					if ($selectionMarkers.length > 0)
					{
						var editorHtml = $editorDiv.html().replace(/&amp;/g, '&');

						if ($selectionMarkers.length === 1)
						{
							this.source.start = this.utils.strpos(editorHtml, $editorDiv.find("#selection-marker-1").prop("outerHTML"));
							this.source.end = this.source.start;
						}
						else if ($selectionMarkers.length === 2)
						{
							this.source.start = this.utils.strpos(editorHtml, $editorDiv.find("#selection-marker-1").prop("outerHTML"));
							this.source.end = this.utils.strpos(editorHtml, $editorDiv.find("#selection-marker-2").prop("outerHTML")) - $editorDiv.find("#selection-marker-1").prop("outerHTML").toString().length;
						}
					}

				},
				setCaretOnHide: function(html)
				{
					this.source.start = this.source.$textarea.get(0).selectionStart;
					this.source.end = this.source.$textarea.get(0).selectionEnd;

					// if selection starts from end
					if (this.source.start > this.source.end && this.source.end > 0)
					{
						var tempStart = this.source.end;
						var tempEnd = this.source.start;

						this.source.start = tempStart;
						this.source.end = tempEnd;
					}

					this.source.start = this.source.enlargeOffset(html, this.source.start);
					this.source.end = this.source.enlargeOffset(html, this.source.end);

					html = html.substr(0, this.source.start) + this.marker.html(1) + html.substr(this.source.start);

					if (this.source.end > this.source.start)
					{
						var markerLength = this.marker.html(1).toString().length;

						html = html.substr(0, this.source.end + markerLength) + this.marker.html(2) + html.substr(this.source.end + markerLength);
					}

					return html;

				},
				hide: function()
				{
					this.source.$textarea.removeClass('open').hide();
					this.source.$textarea.off('.redactor-source');

					var code = this.source.$textarea.val();

					code = this.paragraphize.load(code);
					code = this.source.setCaretOnHide(code);

					this.code.start(code);
					this.button.enableAll();
					this.core.editor().show().focus();
					this.selection.restore();
					this.code.sync();
				},
				show: function()
				{
					this.selection.save();
					this.source.setCaretOnShow();

					var height = this.core.editor().innerHeight();
					var code = this.code.get();

					code = code.replace(/\n\n\n/g, "\n");
					code = code.replace(/\n\n/g, "\n");

					this.core.editor().hide();
					this.button.disableAll('html');
					this.source.$textarea.val(code).height(height).addClass('open').show();
					this.source.$textarea.on('keyup.redactor-source', $.proxy(function()
					{
						if (this.opts.type === 'textarea')
						{
							this.core.textarea().val(this.source.$textarea.val());
						}

					}, this));

					this.marker.remove();

					$(window).scrollTop(scroll);

					if (this.source.$textarea[0].setSelectionRange)
					{
						this.source.$textarea[0].setSelectionRange(this.source.start, this.source.end);
					}

					this.source.$textarea[0].scrollTop = 0;

					setTimeout($.proxy(function()
					{
						this.source.$textarea.focus();

					}, this), 0);
				},
				enlargeOffset: function(html, offset)
				{
					var htmlLength = html.length;
					var c = 0;

					if (html[offset] === '>')
					{
						c++;
					}
					else
					{
						for(var i = offset; i <= htmlLength; i++)
						{
							c++;

							if (html[i] === '>')
							{
								break;
							}
							else if (html[i] === '<' || i === htmlLength)
							{
								c = 0;
								break;
							}
						}
					}

					return offset + c;
				}
			};
		};

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

		userModel.init();

		userModel.initParse();

		mapModel.init();

		placesModel.init();

		smartObject.init();

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
			deviceModel.appVersion = "emulator: 0.2.3.1";
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

			/*cordova.plugins.notification.local.ontrigger = function(id, state, json) {
				var message = 'ID: ' + id + (json == '' ? '' : '\nData: ' + json);
				navigator.notification.alert(message, null, 'Notification received while the app was in the foreground', 'Close');
			};*/


			// hiding the accessory bar
			//cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
		}
		
		APP.emailAvailable = false;

		/* $(".email-Autocomplete").emailautocomplete({
		     domains: _emailDomainList //additional domains (optional)
		 }); */

		window.semanticDSs = new SemanticDSs();

	}, false);



}(jQuery, document));