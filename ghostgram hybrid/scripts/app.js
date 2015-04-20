
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
          privateMode: false
          
        },
          
        profile: {
          title: 'Profile',
          currentUser: '',
          username: '',
          email: '',
          phone: '',
          alias: '',
          udid: '',
          macAddress: '',
          emaiVerified: false,
        },
          
       channels: {
          title: 'Channels',
          pubnub: '',
          currentChannel: '',
          channelDS : new kendo.data.DataSource({pageSize: 64})
          //Todo: Add channel data source and sync if user is signed in
        },
          
        gallery: {
          title: 'gallery',
          galleryDS: new kendo.data.DataSource({pageSize: 64})
          //Todo: Add photo gallery data source and sync if user is signed in
        },
          
        contacts: {
          title: 'Contacts',
          contactsDS: new kendo.data.DataSource(),
          deviceContactsDS: new kendo.data.DataSource()
           //Todo: Add contacts cache data source and sync if user is signed in
            
        },
        places: {
            title: 'Places',
            placesDS: new kendo.data.DataSource({pageSize: 64})
        }
      },
       kendo: ''
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
        
        placesInit: function() {
			_mapElem = $("#places-mapview");
		},
        
		placesShow: function() {
			//Don't attempt to reload map/sb data if offline
			//console.log("ONLINE", _isOnline);
			if (_isOnline === false) {				
				alert("Please reconnect to the Internet to load locations.");
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
		onInitPlaces: _app.placesInit
	});
    
    // this function is called by Cordova when the application is loaded by the device
    document.addEventListener('deviceready', function () {  
        var initialView = '#newuserhome';

        // hide the splash screen as soon as the app is ready. otherwise
       
        navigator.splashscreen.hide();
       
        Parse.initialize("lbIysFqoATM1uTxebFf5s8teshcznua2GQLsx22F", "MmrJS8jR0QpKxbhS2cPjjxsLQKAuGuUHKtVPfVj5");

        Parse.User.enableRevocableSession();
        APP.models.profile.currentUser = Parse.User.current();
        APP.models.profile.udid = device.uuid;
        
        if (APP.models.profile.currentUser) {
             initialView = '#home';
            APP.models.profile.username =  APP.models.profile.currentUser.attributes.username;
            APP.models.profile.email =  APP.models.profile.currentUser.attributes.email;
            APP.models.profile.phone =  APP.models.profile.currentUser.attributes.phone;
            APP.models.profile.alias =  APP.models.profile.currentUser.attributes.alias;
            APP.models.profile.plaform = device.platform;
        }

         APP.models.channels.pubnub = PUBNUB.init({ 
             publish_key: 'pub-c-7344645a-12aa-4481-8ad8-01b2e29deba9', 
             subscribe_key: 'sub-c-4866fe96-dcb2-11e4-8fb9-0619f8945a4f' 
         });   

        APP.kendo = new kendo.mobile.Application(document.body, {

            // comment out the following line to get a UI which matches the look
            // and feel of the operating system
            skin: 'flat',

            // the application needs to know which view to load first
            initial: initialView
        });

    }, false);

   

}(jQuery, document));