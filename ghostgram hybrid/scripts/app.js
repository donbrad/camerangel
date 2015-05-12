
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
          notificationDS : new kendo.data.DataSource({offlineStorage: "notifications-offline", sort: { field: "date", dir: "desc" }}),
          Notification: function (type, title, date, description, actionTitle, action, href, dismissable )
            {
                this.type = type ? type : 'system',
                this.title = title ? title : '',
                this.actionTitle = actionTitle ? actionTitle : '',
                this.action = action ? action : null,
                this.href = href ? href : null,
                this.description = description ? description : '',
                this.date = date ? date : new Date().getTime(),
                this.dismissable = dismissable ? dismissable : false        
            }
          
        },
          
        profile: {
          title: 'Profile',
          parseUser: null,
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
          }),
         
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
			messageLock: true,
			potentialMembers:  new kendo.data.DataSource({sort: { field: "name", dir: "asc" }}),
            membersDS: new kendo.data.DataSource({sort: { field: "name", dir: "asc" }}),
            messagesDS: new kendo.data.DataSource({sort: { field: "date", dir: "desc" }})
        },
		  
		privateChannel : {
			title: 'Private Channel',
			privateChannelsDS: new kendo.data.DataSource({sort: { field: "date", dir: "desc" }}),
			currentPrivateChannel: {},
			messages: new kendo.data.DataSource({sort: { field: "date", dir: "desc" }}),
			channelUUID: null,
			contactUUID: null,
			contactAlias: null
		},
		  
		dataChannel: {
			title: 'Data Channel',
			messages: new kendo.data.DataSource({sort: { field: "date", dir: "desc" }})
		},
          
        gallery: {
          title: 'gallery',
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
            placesDS: new kendo.data.DataSource({offlineStorage: "places-offline"})
        }
      },
       kendo: null,
       pubnub: null
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
                     var models = new Array();
                     for (var i=0; i<collection.models.length; i++) {
                         var model = collection.models[i];
                         // Load the contactPhoto data from parse and update the url
                         var contactPhoto = model.get("parsePhoto");
                         if (contactPhoto !== undefined && contactPhoto !== null)
                         model.set('photo', contactPhoto._url);
						 models.push(model.attributes);
						 
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
            
            var photos = new ContactCollection();
            
            photos.fetch({
                  success: function(collection) {
                     var models = new Array();
                     for (var i=0; i<collection.models.length; i++) {
                         models.push(collection.models[i].attributes);
                     }
                         
                     APP.models.gallery.photosDS.data(models);
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
    
    // this function is called by Cordova when the application is loaded by the device
    document.addEventListener('deviceready', function () {  
        var initialView = '#newuserhome';

        // hide the splash screen as soon as the app is ready. otherwise
       
        navigator.splashscreen.hide();
       
        Parse.initialize("lbIysFqoATM1uTxebFf5s8teshcznua2GQLsx22F", "MmrJS8jR0QpKxbhS2cPjjxsLQKAuGuUHKtVPfVj5");

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
			$('#home-signin-username').val(App.models.profile.username );
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
                connect: function(){mobileNotify("Secure Data Channel Connected")},
                disconnect: function(){mobileNotify("Secure Data Channel Disconnected")},
                reconnect: function(){mobileNotify("Secure Data Channel Reconnected")},
                error: function(){mobileNotify("Secure Data Channel Network Error")} 
                 
             });
			
			APP.pubnub.subscribe({
                channel : 'ghostgramsapp129195720',
                windowing: 1000,    
                message : appChannelRead,
                connect: function(){mobileNotify("App Channel Connected")},
                disconnect: function(){mobileNotify("App Channel Disconnected")},
                reconnect: function(){mobileNotify("App Channel Reconnected")},
                error: function(){mobileNotify("App Channel Network Error")} 
                 
             });
			
			// Get any messages in the channel
             APP.pubnub.history({
				 channel: uuid,
				 count: 100,
				 callback: function(m){
					
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
             APP.models.profile.version = "1.4.1";
        } else {
            cordova.getAppVersion(function (version) {
            APP.models.profile.version = version;
            }); 
			
			cordova.plugins.notification.local.hasPermission(function (granted) {
    			mobileNotify('Permission has been granted: ' + granted);
			});
        }
		
		
		APP.emailAvailable = false;
	  /*  window.plugins.email.isAvailable(function (result){
			APP.emailAvailable = result;
		});
        */
       
    }, false);

   

}(jQuery, document));