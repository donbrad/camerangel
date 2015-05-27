
(function ($, doc) {
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
          invitesDS : new kendo.data.DataSource({offlineStorage: "invites-offline", sort: { field: "date", dir: "desc" }}),
          notificationDS : new kendo.data.DataSource({offlineStorage: "notifications-offline", sort: { field: "priority", dir: "asc" }}),
          Notification: function (type, title, date, description, actionTitle, action, href, dismissed, dismissable)
            {
                this.type = type ? type : 'system',
                this.title = title ? title : '',
                this.actionTitle = actionTitle ? actionTitle : '',
                this.action = action ? action : null,
                this.href = href ? href : null,
                this.description = description ? description : '',
                this.date = date ? date : new Date().getTime(),
			    this.dismissed = dismissed ? dismissed : false,
                this.dismissable = dismissable ? dismissable : false        
            }
          
        },
          
        profile: {
          title: 'Profile',
          parseUser: null,
		  tempDirectory: '',
		  appDirectory: '',
          currentUser: new kendo.data.ObservableObject({
              username: '',
              userUUID: '',
              email: '',
              phone: '',
              alias: '',
              aliasPhoto: '',
              publicAlias: '',
              publicAliasPhoto: '',
			  privateKey: '',
			  publicKey: '',
              udid: '',
              macAddress: '',
			  rememberUsername: false,
              emaiVerified: false,
              phoneVerified: false,
			  isVerified: false
          })
         
        },
        
		settings : {
			title: 'Settings',
			privacyModeEnabled: true,
			defaultVisible: false,
			locationTrigger: true,
			defaultTextSize: 14
			
		},
		  
		presence : {
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
		  
       channels: {
          title: 'Channels',
          pubnub: '',
          currentChannel: new kendo.data.ObservableObject(),
          channelsDS : new kendo.data.DataSource({offlineStorage: "channels-offline", sort: { field: "name", dir: "asc" }})
          //Todo: Add channel data source and sync if user is signed in
        },
        
        channel: {
            title: 'Channel', 
			currentChannel: {},
			currentModel: {},
			currentMessage: {},
			messageLock: true,
			potentialMembersDS:  new kendo.data.DataSource({
				sort: { field: "name", dir: "asc" },
				schema : {
					model : {
						id : "uuid"
					} 
				}   
    		}),
            membersDS: new kendo.data.DataSource({sort: { field: "name", dir: "asc" }}),
            messagesDS: new kendo.data.DataSource({sort: { field: "date", dir: "desc" }})
        },
		  
		privateChannel : {
			title: 'Private Channel',
			privateChannelsDS: new kendo.data.DataSource({sort: { field: "date", dir: "desc" }}),
			currentPrivateChannel: {},
			messagesDS: new kendo.data.DataSource({sort: { field: "date", dir: "desc" }}),
			channelUUID: null,
			contactUUID: null,
			contactAlias: null
		},
		  
		placeChannel: {
			title: 'Place Chat',
			placeChannelDS:  new kendo.data.DataSource({sort: { field: "date", dir: "desc" }}),
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
		  
		dataChannel: {
			title: 'Data Channel',
			messages: new kendo.data.DataSource({sort: { field: "date", dir: "desc" }})
		},
          
        gallery: {
          title: 'gallery',
		  currentPhoto: {},
		  parsePhoto: {},
          photosDS: new kendo.data.DataSource({offlineStorage: "gallery-offline"})
          //Todo: Add photo gallery data source and sync if user is signed in
        },
          
        contacts: {
          title: 'Contacts',
          contactsDS: new kendo.data.DataSource({offlineStorage: "contacts-offline",  sort: { field: "name", dir: "asc" }}),
          deviceContactsDS: new kendo.data.DataSource(),
          currentDeviceContact: {},
          currentContact: new kendo.data.ObservableObject(),
          phoneDS: new kendo.data.DataSource(),
          emailDS: new kendo.data.DataSource(),
          addressDS: new kendo.data.DataSource(),
          phoneArray: [],
          emailArray:  []
        },
          
        sync: {
            operation: '',
            requestActive: false
        },
          
        places: {
            title: 'Places',
            placesDS: new kendo.data.DataSource({offlineStorage: "places-offline"}),
			geoPlacesDS: new kendo.data.DataSource(),
			current: new kendo.data.ObservableObject({
				placeId: '',
				name: '',
				address: '',
				googleId: '',
				factualId: '',
				lat: 0,
				lng: 0,
				publicName: '',
				alias: ''
			})
        }
      },
       kendo: null,
       pubnub: null,
	   map: null,
	   checkPubnub: function () {
		   if (APP.pubnub === undefined || APP.pubnub === null) {
		   
				APP.pubnub = PUBNUB.init({ 
					 publish_key: 'pub-c-d4fcc2b9-2c1c-4a38-9e2c-a11331c895be', 
					 subscribe_key: 'sub-c-4624e1d4-dcad-11e4-adc7-0619f8945a4f',
					 secret_key: 'sec-c-NDFiNzlmNTUtNWEyNy00OGUzLWExZjYtNDc3ZTI2ZGRlOGMw',
					 ssl: true,
					 jsonp: true,
					 restore: true,
					 uuid: uuid
				 });
		   }
	   },
		
	  setAppState : function (field, value) {
			APP.state[field] = value;
			_app.saveAppState();
		},
		
		updateGeoLocation : function (callback) {
		APP.geoLocator.getCurrentPosition(function (position, error){
				if (error === null) {
					APP.location.position = position;
					if (callback !== undefined) {
						callback (position.coords.latitude, position.coords.longitude);
					}
					reverseGeoCode(position.coords.latitude, position.coords.longitude);
					//mobileNotify("Located you at " + position.coords.latitude + " , " + position.coords.longitude);
				} else {
					mobileNotify("GeoLocator error : " + error);
				}

			});		
		},
		
	   state: {
		   inPrivacyMode: false,
		   isVisible: true,
		   rememberUsername: false,
		   isOnline: true,
		   inBackground: false,
		   userNotifications: [],
		   phoneVerified: false,
		   hasContacts: false,
		   hasChannels: false,
		   hasPlaces: false,
		   introFetched: false
	   }
	  
    };

	//Private methods
	_private = {
		getLocation: function(options) {
			var dfd = new $.Deferred();

			//Default value for options
			if (options === undefined) {
				options = {enableHighAccuracy: true};
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
		init: function() {
			
		},
        
       	onPause : function() {
			APP.setAppState('inBackground', true);
   			
		},
		
		onResume : function () {
			APP.setAppState('inBackground', false);
		},
		
		onOnline : function () {
			APP.setAppState('isOnline', true);
		},
		
		onOffline : function () {
			APP.setAppState('isOnline', false);
		},
		
		
		
		saveAppState : function () {
			window.localStorage.setItem('ggAppState', JSON.stringify(APP.state));
		},
		
		getAppState : function () {
			var state = window.localStorage.getItem('ggAppState');
			if (state !== undefined && state !== null)
				APP.state = JSON.parse(state);	
			else
				_app.saveAppState();
		},
		
        newNotification: function (type, title, date, description, actionTitle, action, href, dismissable) {
            var notification = new APP.models.home.Notification(type, title, date, description, actionTitle, action, href, dismissable);
            APP.models.home.notificationDS.add(notification);        
        },
        
        fetchParseData : function () {
            var ChannelModel = Parse.Object.extend("channels");
            var ChannelCollection = Parse.Collection.extend({
              model: ChannelModel
            });
            
            var channels = new ChannelCollection();
            
            channels.fetch({
                  success: function(collection) {
                     var models = new Array();
                     for (var i=0; i<collection.models.length; i++) {
						 // Todo: check status of members
                         models.push(collection.models[i].attributes);
                     }
                     if (models.length > 0) {
						 APP.setAppState('hasChannels', true);
					 }    
                     APP.models.channels.channelsDS.data(models);
                  },
                  error: function(collection, error) {
                      handleParseError(error);
                  }
                });
            
            var ContactModel = Parse.Object.extend("contacts");
            var ContactCollection = Parse.Collection.extend({
              model: ContactModel
            });
            
            var contacts = new ContactCollection();
            
            contacts.fetch({
                  success: function(collection) {
                     var models = [];
                     for (var i=0; i<collection.models.length; i++) {
                         var model = collection.models[i];
                         // Load the contactPhoto data from parse and update the url
                         var contactPhoto = model.get("parsePhoto");
                         if (contactPhoto !== undefined && contactPhoto !== null)
                         model.set('photo', contactPhoto._url);
						 models.push(model.attributes);
						 
                     }
                     if (models.length > 0) {
						 APP.setAppState('hasContacts', true);
					 }   
                     APP.models.contacts.contactsDS.data(models);
                  },
                  error: function(collection, error) {
                      handleParseError(error);
                  }
                });
            
            var PhotoModel = Parse.Object.extend("photos");
            var PhotoCollection = Parse.Collection.extend({
              model: PhotoModel
            });
            
            var photos = new PhotoCollection();
            
            photos.fetch({
                  success: function(collection) {
                     var models = new Array();
                     for (var i=0; i<collection.models.length; i++) {
                         models.push(collection.models[i].attributes);
                     }
                     if (models.length > 0) {
						 APP.setAppState('hasPhotos', true);
					 }  
                     APP.models.gallery.photosDS.data(models);
                  },
                  error: function(collection, error) {
                      handleParseError(error);
                  }
                });
            
			 var PlacesModel = Parse.Object.extend("places");
            var PlacesCollection = Parse.Collection.extend({
              model: PlacesModel
            });
            
            var places = new PlacesCollection();
            
            places.fetch({
                  success: function(collection) {
                     var models = new Array();
                     for (var i=0; i<collection.models.length; i++) {
                         models.push(collection.models[i].attributes);
                     }
                     if (models.length > 0) {
						 APP.setAppState('hasPlaces', true);
					 }
                     APP.models.places.placesDS.data(models);
                  },
                  error: function(collection, error) {
                      handleParseError(error);
                  }
                });
            
            var InviteModel = Parse.Object.extend("invites");
            var InviteCollection = Parse.Collection.extend({
              model: InviteModel
            });
            
            var invites = new InviteCollection();
            
            invites.fetch({
                  success: function(collection) {
                     var models = new Array();
                     for (var i=0; i<collection.models.length; i++) {
                         models.push(collection.models[i].attributes);
                     }
                         
                     APP.models.home.invitesDS.data(models);
                  },
                  error: function(collection, error) {
                      handleParseError(error);
                  }
                });
			
			var p2pModel = Parse.Object.extend("p2pmap");
            var p2pCollection = Parse.Collection.extend({
              model: p2pModel
            });
            
            var p2pmap = new p2pCollection();
            
            p2pmap.fetch({
                  success: function(collection) {
                     var models = new Array();
                     for (var i=0; i<collection.models.length; i++) {
                         models.push(collection.models[i].attributes);
                     }
                  },
                  error: function(collection, error) {
                      handleParseError(error);
                  }
			});
			
			var channelMapModel = Parse.Object.extend("channelmap");
            var channelMapCollection = Parse.Collection.extend({
              model: channelMapModel
            });
            
            var channelMap = new channelMapCollection();
            
            channelMap.fetch({
                  success: function(collection) {
                     var channels = new Array();
                     for (var i=0; i<collection.models.length; i++) {
                         channels.push(collection.models[i].attributes);
                     }
                  },
                  error: function(collection, error) {
                      handleParseError(error);
                  }
			});
        },
        
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
        onUserSignIn: _app.fetchParseData
	});
    
	document.addEventListener("pause", _app.onPause, false);
	document.addEventListener("resume", _app.onResume, false);

    // this function is called by Cordova when the application is loaded by the device
    document.addEventListener('deviceready', function () {  
        var initialView = '#newuserhome';
		_app.getAppState();
		
		APP.geoLocator = new GeoLocator();
		APP.location = new Object();
		
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, 
			 function(fileSystem){ 
				var url = fileSystem.root.nativeURL;
				url = url.replace('file://','');
				APP.fileDirectory = url;
			  APP.models.profile.appDirectory = url;
				//mobileNotify(APP.fileDirectory);
			},
			function(error) {
			mobileNotify("Filesystem error : " + JSON.stringify(error));
		});
		
		window.requestFileSystem(LocalFileSystem.TEMPORARY, 0, 
			 function(fileSystem){ 
				var url = fileSystem.root.nativeURL;
				url = url.replace('file://','');
				APP.tempDirectory = url;
			    APP.models.profile.tempDirectory = url;
				//mobileNotify(APP.tempDirectory);
			},
			function(error) {
			mobileNotify("Filesystem error : " + JSON.stringify(error));
		});
								 
/*		if (window.navigator.simulator === undefined) {
			APP.map = plugin.google.maps.Map.getMap($("#places-mapview"));
			APP.mapReady = false;
			 APP.map.on(plugin.google.maps.event.MAP_READY, function () {
				 APP.mapReady = true;	 	 
			 });
		}
*/
		
		APP.geoLocator.getCurrentPosition(function (position, error){
			if (error === null) {
				APP.location.position = position;
				APP.map = new Object();
				APP.map.geocoder = new google.maps.Geocoder();
				APP.map.mapOptions = new Object();
				APP.map.mapOptions.center =  {lat: position.coords.latitude, lng: position.coords.longitude};
				APP.map.mapOptions.zoom = 14;
				APP.map.mapOptions.mapTypeId = google.maps.MapTypeId.ROADMAP;
				APP.map.googleMap = new google.maps.Map(document.getElementById('map-mapdiv'), APP.map.mapOptions);
				reverseGeoCode(position.coords.latitude, position.coords.longitude);
				//mobileNotify("Located you at " + position.coords.latitude + " , " + position.coords.longitude);
			} else {
				mobileNotify("GeoLocator error : " + error);
			}
			
		});
		
        // hide the splash screen as soon as the app is ready. otherwise
       
        navigator.splashscreen.hide();
        // Set status bar color
       	StatusBar.backgroundColorByHexString("#27476E");
        
        Parse.initialize("lbIysFqoATM1uTxebFf5s8teshcznua2GQLsx22F", "MmrJS8jR0QpKxbhS2cPjjxsLQKAuGuUHKtVPfVj5");

		if (!APP.state.introFetched) {
			
			var NotificationModel = Parse.Object.extend("notifications");
			var NotificationCollection = Parse.Collection.extend({
			  model: NotificationModel
			});

			var notifications = new NotificationCollection();

			notifications.fetch({
				  success: function(collection) {
					 var userNotifications = new Array();
					 for (var i=0; i<collection.models.length; i++) {
						 // Todo: check status of members
						 var date = collection.models[i].updatedAt;
						 collection.models[i].attributes.date = Date.parse(date);
						 userNotifications.push(JSON.stringify(collection.models[i].attributes));
						 APP.models.home.notificationDS.add(collection.models[i].attributes);
						 APP.setAppState('introFetched', true);
					 }
					 window.localStorage.setItem('ggUserNotifications', JSON.stringify(userNotifications));
					APP.state.userNotifications = userNotifications;
				  },
				  error: function(collection, error) {
					  handleParseError(error);
				  }
			});
		} else {
			var userNotifications =  window.localStorage.getItem('ggUserNotifications');
			
			userNotifications = JSON.parse(userNotifications);
			APP.state.userNotifications = [];
			if (userNotifications !== null && userNotifications.length > 0) {
				for (var j=0; j<userNotifications.length; j++) {
					var notification = JSON.parse(userNotifications[j]);
					 APP.models.home.notificationDS.add(notification);
					APP.state.userNotifications.push(notification);
				}
			}
		}
		 pruneNotifications();
        Parse.User.enableRevocableSession();
        APP.models.profile.parseUser = Parse.User.current();
        APP.models.profile.udid = device.uuid;
        APP.models.profile.platform = device.platform;
        APP.models.profile.device = device.name;
        APP.models.profile.model = device.model;
		APP.models.profile.rememberUsername = localStorage.getItem('ggRememberUsername');
		
		// If remembering Username, get it from localstorage and prefill signin.
		if (APP.models.profile.rememberUsername) {
			APP.models.profile.username = localStorage.getItem('ggUsername');
			if (APP.models.profile.username == undefined  || APP.models.profile.username === '') {
				localStorage.setItem('ggUsername', APP.models.profile.parseUser.get('username'));
			} else {
				$('#home-signin-username').val(APP.models.profile.username );
			}
			
		}
        
        if (APP.models.profile.parseUser !== null) {
             initialView = '#home';
            APP.models.profile.currentUser.set('username', APP.models.profile.parseUser.get('username'));
            APP.models.profile.currentUser.set('email', APP.models.profile.parseUser.get('email'));
            APP.models.profile.currentUser.set('phone', APP.models.profile.parseUser.get('phone'));
            APP.models.profile.currentUser.set('alias', APP.models.profile.parseUser.get('alias'));
            APP.models.profile.currentUser.set('userUUID', APP.models.profile.parseUser.get('userUUID'));
			 APP.models.profile.currentUser.set('publicKey', APP.models.profile.parseUser.get('publicKey'));
			APP.models.profile.currentUser.set('privateKey', APP.models.profile.parseUser.get('privateKey'));
			APP.models.profile.currentUser.set('aliasPublic', APP.models.profile.parseUser.get('aliasPublic'));
			 APP.models.profile.currentUser.set('rememberUsername', APP.models.profile.parseUser.get('rememberUsername'));
            APP.models.profile.currentUser.set('phoneVerified', APP.models.profile.parseUser.get('phoneVerified'));
            APP.models.profile.currentUser.set('emailVerified', APP.models.profile.parseUser.get('emailVerified'));
            APP.models.profile.parseACL = new Parse.ACL(APP.models.profile.parseUser);
            var uuid = APP.models.profile.currentUser.get('userUUID');
            APP.models.profile.currentUser.bind('change', syncProfile);
            
			if (APP.models.profile.currentUser.get('rememberUsername')){
				localStorage.setItem('ggRememberUsername', true);
				localStorage.setItem('ggUsername', APP.models.profile.currentUser.get('username'));
			}
			
            APP.pubnub = PUBNUB.init({ 
                 publish_key: 'pub-c-d4fcc2b9-2c1c-4a38-9e2c-a11331c895be', 
                 subscribe_key: 'sub-c-4624e1d4-dcad-11e4-adc7-0619f8945a4f',
				 secret_key: 'sec-c-NDFiNzlmNTUtNWEyNy00OGUzLWExZjYtNDc3ZTI2ZGRlOGMw',
                 ssl: true,
                 jsonp: true,
                 restore: true,
                 uuid: uuid
             });
            
             // Subscribe to the data / notifications channel
			//mobileNotify("Created data channel : " + uuid);
             APP.pubnub.subscribe({
                channel : uuid,
                windowing: 1000,    
                message : dataChannelRead,
                connect: function(){},
                disconnect: function(){},
                reconnect: function(){mobileNotify("Data Channel Reconnected")},
                error: function(){mobileNotify("Data Channel Network Error")} 
                 
             });
			
			APP.pubnub.subscribe({
                channel : 'ghostgramsapp129195720',
                windowing: 1000,    
                message : appChannelRead,
                connect: function(){},
                disconnect: function(){},
                reconnect: function(){mobileNotify("App Channel Reconnected")},
                error: function(){mobileNotify("App Channel Network Error")} 
                 
             });
			
			// Get any messages in the channel
             APP.pubnub.history({
				 channel: uuid,
				 count: 100,
				 callback: function(messages){
					 messages = messages[0];
					 messages = messages || [];
					 for(var i = 0; i < messages.length; i++) {
					 	dataChannelRead(messages[i]);
					 }
					
				 }
			 });
            _app.fetchParseData();
        }  

        APP.kendo = new kendo.mobile.Application(document.body, {

            // comment out the following line to get a UI which matches the look
            // and feel of the operating system
            skin: 'flat',

            // the application needs to know which view to load first
            initial: initialView
        });

		// Provide basic functionality in the simulator and deployable simulator
        if (window.navigator.simulator === true){
             APP.models.profile.version = "0.1.7.4";
        } else {
            cordova.getAppVersion(function (version) {
           	 	APP.models.profile.version = version;
            }); 
			
			cordova.plugins.notification.local.ontrigger = function (id, state, json) {
			  var message = 'ID: ' + id + (json == '' ? '' : '\nData: ' + json);
			  navigator.notification.alert(message, null, 'Notification received while the app was in the foreground', 'Close');
			};
			
			cordova.plugins.notification.local.hasPermission(function (granted) {
				if (!granted)
    				mobileNotify('Local notifications Disabled !!!');
				/*cordova.plugins.notification.local.cancelAll(
				  function() {
					MobileNotify("Local notifications cleared");
				  }
				);*/
				
			});
        }
		
		
		APP.emailAvailable = false;
	  /*  window.plugins.email.isAvailable(function (result){
			APP.emailAvailable = result;
		});
        */
       
    }, false);

   

}(jQuery, document));
