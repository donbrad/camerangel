
(function ($, doc) {
    var _app,
    	_mapElem,
    	_mapObj,
    	_storeListElem,
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
          emaiVerified: false,
        },
          
       channels: {
          title: 'Channels',
          pubnub: '',
          currentChannel: '',
          channelDS : ''
          //Todo: Add channel data source and sync if user is signed in
        },
          
        gallery: {
          title: 'gallery',
          galleryDS: ''
          //Todo: Add photo gallery data source and sync if user is signed in
        },
          
        contacts: {
          title: 'Contacts',
          contactsDS: ''
           //Todo: Add contacts cache data source and sync if user is signed in
            
        },
        places: {
            title: 'Places',
            placesDS: ''
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
			latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				
			myOptions = {
				zoom: 11,
				center: latlng,
				mapTypeControl: false,
				navigationControlOptions: { style: google.maps.NavigationControlStyle.SMALL },
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			    
			mapObj = new google.maps.Map(mapElem, myOptions);
			_mapObj = mapObj; //Cache at app level
			    
			pin = [
				{
					position: latlng,
					title: "Your Location"
				}
			];

			_private.addMarkers(pin, mapObj);
			
		},
        
		addMarkers: function(locations, mapObj) {
			var marker,
			    currentMarkerIndex = 0;
            
            
            function createMarker(index) {
                if (index < locations.length) {
					var tmpLocation = locations[index];

					marker = new google.maps.Marker({
						position:tmpLocation.position,
						map:mapObj,
						title:tmpLocation.title,
						icon: tmpLocation.icon,
						shadow: tmpLocation.shadow,
						animation: tmpLocation.animation
					});
					oneMarkerAtTime();
				}
			}
            
			function oneMarkerAtTime() {
				google.maps.event.addListener(marker, "animation_changed", function() {
                    if (marker.getAnimation() === null) {
                        createMarker(currentMarkerIndex+=1);
					}
				});
			}				
            
            createMarker(0);
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
            
			if (_isOnline === true) {
                google.maps.event.trigger(map, "resize");
			}
			else {
				alert("Offline....");
			}
		}
    };

    // this function is called by Cordova when the application is loaded by the device
    document.addEventListener('deviceready', function () {  
        var initialView = '#newuserhome';

        // hide the splash screen as soon as the app is ready. otherwise
       
        navigator.splashscreen.hide();

        Parse.initialize("lbIysFqoATM1uTxebFf5s8teshcznua2GQLsx22F", "MmrJS8jR0QpKxbhS2cPjjxsLQKAuGuUHKtVPfVj5");

        Parse.User.enableRevocableSession();
        APP.models.profile.currentUser = Parse.User.current();

        if (APP.models.profile.currentUser) {
             initialView = '#home';
            APP.models.profile.username =  APP.models.profile.currentUser.attributes.username;
            APP.models.profile.email =  APP.models.profile.currentUser.attributes.email;
            APP.models.profile.phone =  APP.models.profile.currentUser.attributes.phone;
            APP.models.profile.alias =  APP.models.profile.currentUser.attributes.alias;
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

    $.extend(window, {
		
		onPlacesShow: _app.placesShow,
		onPlacesInit: _app.placesInit
	});

}(jQuery, document));