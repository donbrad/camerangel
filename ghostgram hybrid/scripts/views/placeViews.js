/**
 * Created by donbrad on 9/23/15.
 * placeViews.js
 */

'use strict';

/*
 * placesView
 */
var placesView = {
    _viewInitialized : false,

    placeListDS: new kendo.data.DataSource({
        sort: {
            field: "distance",
            dir: "asc"
        }
    }),

    onInit: function (e) {
        _preventDefault(e);

        placesModel.locatorActive = false;

        $("#places-listview").kendoMobileListView({
            dataSource: placesView.placeListDS,
            template: $("#placesTemplate").html(),
            dataBound: function(e){
                ux.checkEmptyUIState(placesView.placeListDS, "#placeListDiv >");
            },
            dataBinding: function(e){
            	// todo jordan - wire results UI
            }
        }).kendoTouch({
        	filter: ".list-box",
        	enableSwipe: true,
        	tap: function(e){
        		var place = e.touch.target[0].dataset["id"];
                var placeId = LZString.compressToEncodedURIComponent(place);

                APP.kendo.navigate("#placeView?place="+placeId+"&returnview=places");

        	},
        	swipe: function(e) {
                // 
                var selection = e.sender.events.currentTarget;
                
                if(e.direction === "left"){
                    var otherOpenedLi = $(".place-active");
                    $(otherOpenedLi).velocity({translateX:"0"},{duration: "fast"}).removeClass("place-active");
                    
                    if($(window).width() < 375){
                    	$(selection).velocity({translateX:"-50%"},{duration: "fast"}).addClass("place-active");
                    } else {
                    	$(selection).velocity({translateX:"-40%"},{duration: "fast"}).addClass("place-active");
                    }
                }
                if (e.direction === "right" && $(selection).hasClass("place-active")){
                    $(selection).velocity({translateX:"0"},{duration: "fast"}).removeClass("place-active");
                }

            }
        });


    },

    editPlaceBtn: function(e){
    	var place = e.button[0].dataset["id"];
    	var navStr = "#editPlace?place="+LZString.compressToEncodedURIComponent(place)+"&returnview=places";

        APP.kendo.navigate(navStr);
    },

    deletePlaceBtn: function(e){
        var placeId = e.button[0].dataset["id"];
    	placesModel.deletePlace(placeId);

    },

    onShow: function (e) {
        _preventDefault(e);

        if (!placesView._viewInitialized) {
            placesView._viewInitialized = true;
           

            // Filter current places and query google places on keyup
            $('#places .gg_mainSearchInput').on('input', function() {
                var query = this.value;
                if (query.length > 0) {
                    placesView.placeListDS.filter(  {"logic":"or",
                        "filters":[
                            {
                                "field":"address",
                                "operator":"contains",
                                "value":query},
                            {
                                "field":"name",
                                "operator":"contains",
                                "value":query},
                            {
                                "field":"city",
                                "operator":"contains",
                                "value":query},
                            {
                                "field":"state",
                                "operator":"contains",
                                "value":query},
                            {
                                "field":"zipcode",
                                "operator":"contains",
                                "value":query},
                            {
                                "field":"alias",
                                "operator":"contains",
                                "value":query}
                        ]});

						if(query.length > 1){
							$("#quickFindPlaceBtn").removeClass("hidden");
						} else {
							$("#quickFindPlaceBtn").addClass("hidden");
						}

						$('#places .enterSearch').removeClass('hidden');

                } else {
                	$("#quickFindPlaceBtn").addClass("hidden");
                	$('#places .enterSearch').addClass('hidden');
                   
                }
                
            });
			

			// bind clear search btn
			$("#places .enterSearch").on("click", function(){
					$("#places .gg_mainSearchInput").val('');
					
					// reset data filters
                    placesView.placeListDS.data(placesModel.placesDS.data());
                    placesView.placeListDS.filter([]);

                    // hide clear btn
                    $(this).addClass('hidden');

                    // hide quick find
                    $("#quickFindPlaceBtn").addClass("hidden");
			});
        }

        // Set placeholder
        $('#places .gg_mainSearchInput').attr('placeholder', 'Search places...');

        // Always display the add places button so users can create a new place (even if others exist)
        
        // update actionBtn
        ux.changeActionBtnImg("#places", "icon-gps-light");
        ux.showActionBtnText("#places", "3.5rem", "Add Place");

        var findPlaceUrl = "#findPlace?lat="+ mapModel.lat + "&lng=" +  mapModel.lng +"&returnview=places";
        ux.showActionBtn(true, "#places", findPlaceUrl);
        $("#quickFindPlaceBtn").attr("href", findPlaceUrl);


        //$("#places > div.footerMenu.km-footer > a").removeAttr('href').css("display", "none");


        mapModel.getCurrentAddress(function (isNew, address) {
            // Is this a new location
            if (isNew) {
                mapModel.computePlaceDSDistance();
               // modalView.openInfo("New Location","Are you somewhere new? Create a new Place!", "OK", null);
            }

            placesView.placeListDS.data(placesModel.placesDS.data());
        });
        

    },

    onHide: function (e) {
        //_preventDefault(e);

        ux.changeActionBtnImg("#places", "nav-add-white");

        // update actionBtn
        ux.showActionBtn(false, "#places");
      
        $("#quickFindPlaceBtn").addClass("hidden");
        
        ux.hideSearch();

    }

};

/*
 * findPlacesView
 */
var findPlacesView = {
    _returnView : 'places',
    _returnModal : null,
    _radius: 500,   // set a larger radius for find places
    _currentLocation: {},

    placesDS :  new kendo.data.DataSource({
        sort: {
            field: "distance",
            dir: "asc"
        },
        group: 'category'
    }),

    onInit : function (e) {
        _preventDefault(e);


        // Filter current places and query google places on keyup
        $('#findPlaceSearchQuery').on('input', function() {
            var query = this.value;
            if (query.length > 0) {
                findPlacesView.placesDS.filter(  {"logic":"or",
                    "filters":[
                        {
                            "field":"vicinity",
                            "operator":"contains",
                            "value":query},
                        {
                            "field":"name",
                            "operator":"contains",
                            "value":query},
                        {
                            "field":"type",
                            "operator":"contains",
                            "value":query}
                    ]});

                	$("#findPlace .enterSearch").removeClass("hidden");

            } else {

            	$("#findPlace .enterSearch").addClass("hidden");
               	findPlacesView.placesDS.filter([]);
            }
        });

		// bind clear search btn
			$("#findPlace .enterSearch").on("click", function(){
					$("#findPlaceSearchQuery").val('');
					
					// reset data filters
                    findPlacesView.placesDS.filter([]);

                    // hide clear btn
                    $(this).addClass('hidden');
			});


        $("#findplace-listview").kendoMobileListView({
                dataSource: findPlacesView.placesDS,
                template: $("#findPlacesTemplate").html(),
                headerTemplate: $("#findPlacesHeaderTemplate").html(),
                fixedHeaders: true,
                click: function (e) {
                    var geo = e.dataItem;

                    delete geo._events;
                    delete geo.parent;
                    delete geo.__proto__;

                    addPlaceView.setActivePlace(geo);
                    var geoStr = LZString.compressToEncodedURIComponent(JSON.stringify(geo));

                    //var navStr = "addPlace?geo=" + geoStr + "&returnview=findPlace";

                    var navStr = "#addPlace?returnview=" + findPlacesView._returnView;
                    APP.kendo.navigate(navStr);

                },
                dataBinding: function(e){
                	// todo jordan - wire results UI
                }
            }
        );
    },

    onShow : function (e) {
        _preventDefault(e);

        var ds = findPlacesView.placesDS;

        var lat = findPlacesView._lat, lng = findPlacesView._lng;


        if (e.view.params !== undefined) {
            if (e.view.params.lat !== undefined) {
                lat = parseFloat(e.view.params.lat);
                lng = parseFloat(e.view.params.lng);

            } else {
                lat = mapModel.lat;
                lng = mapModel.lng;
            }

            if (e.view.params.returnview !== undefined){
                findPlacesView._returnView = e.view.params.returnview;
            }

            if (e.view.params.returnmodal !== undefined){
                findPlacesView._returnModal = e.view.params.returnmodal;
            }

        }

        var latlng = new google.maps.LatLng(lat, lng);

        // empty current data
        ds.data([]);


        // Geocode the current location
        mapModel.geocoder.geocode({ 'latLng': latlng }, function (geoResults, geoStatus) {
            if (geoStatus !== google.maps.GeocoderStatus.OK) {
                mobileNotify('Google geocoding service error!');
                return;
            }

            if (geoResults.length === 0 ) {
                mobileNotify('We couldn\'t match your position to an address.');
                return;
            }

            var address = findPlacesView.getAddressFromComponents(geoResults[0].address_components);

            var location = {
                category: 'Location',   // valid categories are: Place and Location
                name: address.streetNumber+' '+address.street,
                type: 'Street Address',
                googleId: null,
                icon: null,
                reference: null,
                streetNumber: address.streetNumber,
                street: address.street,
                address: address.streetNumber+' '+address.street,
                city:  address.city,
                state: address.state,
                zipcode: address.zip,
                country: address.country,
                lat: lat,
                lng: lng,
                vicinity: address.city+', '+address.state,
                distance: 0
            };

            findPlacesView._currentLocation = location;

            ds.add(location);

            findPlacesView.updatePlaces(lat,lng);
        });

		


    },

    onHide: function (e) {
       // _preventDefault(e);

    },

    getTypesFromComponents : function (types) {
       var typeString = '';

        if (types === undefined || types.length === 0) {
            return  "Establishment";
        }

        for (var i=0; i<types.length; i++) {
            if (types[i] !== 'point_of_interest' && types[i] !== 'establishment' && types[i] !== 'food') {
                var typeStr = types[i].replace(/_/g,' ');
                var typeStr = typeStr.charAt(0).toUpperCase() + typeStr.substring(1);
                typeString += typeStr + ", ";

            }
        }

        if (typeString.length > 3) {
            typeString = typeString.substring(0, typeString.length - 2);
        } else {
            typeString = "Establishment";
        }

        return(typeString);
    },

    truncatePlaceName : function (name) {

    },

    getAddressFromComponents: function (addressComponents) {
        var address = {};

        address.streetNumber = _.findWhere(addressComponents, { 'types': [ 'street_number' ] });
        address.streetNumber = address.streetNumber === undefined ? '' : address.streetNumber.short_name;

        address.street = _.findWhere(addressComponents, { 'types': [ 'route' ] });
        address.street = address.street === undefined ? '' : address.street.short_name;

        address.city = _.findWhere(addressComponents, { 'types': [ 'locality', 'political' ] });
        address.city = address.city === undefined ? '' : address.city.short_name;

        address.state = _.findWhere(addressComponents, { 'types': [ 'administrative_area_level_1', 'political' ] });
        address.state = address.state === undefined ? '' : address.state.short_name;

        address.zip = _.findWhere(addressComponents, { 'types': [ 'postal_code' ] });
        address.zip = address.zip === undefined ? '' : address.zip.short_name;

        address.country = _.findWhere(addressComponents, { 'types': [ 'country', 'political' ] });
        address.country = address.country === undefined ? '' : address.country.short_name;

        return address;
    },

    updatePlaces : function (lat, lng) {
        var latlng = new google.maps.LatLng(lat, lng);
        var places = mapModel.googlePlaces;
        var ds = findPlacesView.placesDS;

        // Search nearby places
        places.nearbySearch({
            location: latlng,
            radius: findPlacesView._radius,
            types: ['establishment']
        }, function (placesResults, placesStatus) {

            if (placesStatus !== google.maps.places.PlacesServiceStatus.OK) {
                //mobileNotify('Google Places error: '+ placesStatus);
                return;
            }

            placesResults.forEach( function (placeResult) {

                var address = findPlacesView._currentLocation;
                var distance = getDistanceInMiles(lat, lng, placeResult.geometry.location.lat(), placeResult.geometry.location.lng());
                ds.add({
                    category: 'Place',   // valid categories are: Place and Location
                    name: placeResult.name.smartTruncate(38, true).toString(),
                    type: findPlacesView.getTypesFromComponents(placeResult.types),
                    googleId: placeResult.place_id,
                    icon: placeResult.icon,
                    address: address.address,
                    city:  address.city,
                    state: address.state,
                    zipcode: address.zipcode,
                    country: address.country,
                    reference: placeResult.reference,
                    //lat: placeResult.geometry.location.H,
                    //lng: placeResult.geometry.location.L,
                    lat: placeResult.geometry.location.lat(),
                    lng: placeResult.geometry.location.lng(),
                    vicinity: placeResult.vicinity,
                    distance: distance.toFixed(2)
                });

            });


            // Show modal letting user select current place
        });
    },

    onDone : function (e) {
        _preventDefault(e);
        var navUrl = '#' + findPlacesView._returnView;

        APP.kendo.navigate(navUrl);
    }
};


/*
 * addPlaceView
 */
var addPlaceView = {

    _activeGeo : {},
    _activePlace : new kendo.data.ObservableObject(),
    _returnView : 'places',
    _returnModal : null,

    onInit : function (e) {
        _preventDefault(e);

        $("#addplace-typeBtns").data("kendoMobileButtonGroup");


    },

    onShow : function (e) {
        _preventDefault(e);

        //$('#addPlaceCreateChat').attr('checked', false);

        if (e.view.params !== undefined) {

            if (e.view.params.geo !== undefined) {
                var geo = LZString.decompressFromEncodedURIComponent(e.view.params.geo);
                var geoObj = JSON.parse(geo);
                addPlaceView.setActivePlace(geoObj);
            }

            if (e.view.params.returnview !== undefined){
                addPlaceView._returnView = e.view.params.returnview;
        	}

            if (e.view.params.returnmodal !== undefined){
                addPlaceView._returnModal = e.view.params.returnmodal;
            }
        }
    },

    onHide : function (e) {
        //_preventDefault(e);  Cant use here -- prevents navigation
    },

    onDone: function (e) {
        _preventDefault(e);

        var returnUrl = '#'+ addPlaceView._returnView;

        // unbind the activePlace change handler...
        addPlaceView._activePlace.unbind('change',addPlaceView.onSync);

        if (addPlaceView._returnModal !== null) {

        } else {
            APP.kendo.navigate(returnUrl);
        }



    },

    onSync : function (e) {
        if (e.field === 'name') {
            // check for duplicate name and prompt user


        }
    },


    placeTypeSelect: function(e){
    	var index = this.current().index();
    	
    	// if private
    	if(index === 0){
    		$("#addPlace-privateHelper").removeClass("hidden");
    		$("#addPlace-publicHelper").addClass("hidden");
    		
    		$("#placeTypePrivateImg").attr("src", "images/place-private-active.svg");
    		$("#placeTypePublicImg").attr("src", "images/place-public.svg");

    		$("#placeAutoCheckin").velocity("fadeOut");
    	} else {
    		$("#addPlace-publicHelper").removeClass("hidden");
    		$("#addPlace-privateHelper").addClass("hidden");
    		
    		$("#placeTypePrivateImg").attr("src", "images/place-private.svg");
    		$("#placeTypePublicImg").attr("src", "images/place-public-active.svg");

    		$("#placeAutoCheckin").velocity("fadeIn");
    	}
    },

    setActivePlace : function (geoPlace) {
        addPlaceView._activeGeo = geoPlace;

        addPlaceView._activePlace.unbind('change',addPlaceView.onSync);

        addPlaceView._activePlace.set('alias', geoPlace.alias);
        addPlaceView._activePlace.set('venueName', geoPlace.venueName);
        addPlaceView._activePlace.set('isAvailable',"true");
        addPlaceView._activePlace.set('isPrivate',"true");
        addPlaceView._activePlace.set('address',geoPlace.address);
        addPlaceView._activePlace.set('city',geoPlace.city);
        addPlaceView._activePlace.set('state',geoPlace.state);
        addPlaceView._activePlace.set('country',geoPlace.country);
        addPlaceView._activePlace.set('zipcode',geoPlace.zipcode);
        addPlaceView._activePlace.set('type', geoPlace.type);

        addPlaceView._activePlace.set('lat', geoPlace.lat);
        addPlaceView._activePlace.set('lng', geoPlace.lng);




        if (geoPlace.category === "Location") {
            // A location / street address
            addPlaceView._activePlace.set('category',"Location");
            addPlaceView._activePlace.set('googleId', '');
            addPlaceView._activePlace.set('icon', '');
            addPlaceView._activePlace.set('reference', '');

        } else {
            // A googlePlaces venue
            addPlaceView._activePlace.set('category',"Venue");
            addPlaceView._activePlace.set('icon', geoPlace.icon);
            addPlaceView._activePlace.set('reference', geoPlace.reference);
            addPlaceView._activePlace.set('googleId', geoPlace.googleId);
        }

        addPlaceView._activePlace.bind('change',addPlaceView.onSync);
        addPlaceView._activePlace.set('name', geoPlace.name);

    },

    addPlace : function (e) {
        _preventDefault(e);

        var Place = Parse.Object.extend("places");
        var placeParse = new Place();

        var newPlace = placesModel.newPlace();
        var place = addPlaceView._activePlace;

        // Check that the place name is unique (in this users place's)
        place.name = place.name.toString();

        if (!placesModel.isUniquePlaceName(place.name)) {
            mobileNotify(addPlaceView._activePlace.name + "is already one of your Places!");
            return;
        }

        var guid = uuid.v4();

        var createChatFlag = $('#addPlaceCreateChat').is('checked');
        placeParse.setACL(userModel.parseACL);
        placeParse.set('uuid', guid);
        placeParse.set('category', place.category);
        var name =  place.name.toString();
        placeParse.set('name', name);
        placeParse.set('venueName', place.venueName);
        placeParse.set('alias', place.alias);
        placeParse.set('googleId', place.googleId);
        placeParse.set('address', place.address);
        placeParse.set('lat', place.lat);
        placeParse.set('lng', place.lng);
        placeParse.set('type', place.type);
        placeParse.set('city', place.city);
        placeParse.set('state', place.state);
        placeParse.set('country', place.country);
        placeParse.set('zipcode', place.zipcode);

        placeParse.set('isAvailable', place.isAvailable === "true");
        placeParse.set('isPrivate', place.isPrivate === "true");
        placeParse.set('hasPlaceChat', createChatFlag);

        placeParse.save(null, {
            success: function(place) {
                // Execute any logic that should take place after the object is saved.

                var distance = getDistanceInMiles(mapModel.lat, mapModel.lng, place.get('lat'), place.get('lng'));

                // update the distance value for the local object...
                place.set('distance',distance.toFixed(2));

                placesModel.placesDS.add(place.attributes);
                mobileNotify(place.get('name') + " added to your Places...");

                addPlaceView.onDone();

            },
            error: function(place, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                handleParseError(error);
            }
        });

    }
};

/*
 * editPlaceView
 */
var editPlaceView = {

    _activePlaceId : null,
    _activePlaceModel : null,
    _activePlace : new kendo.data.ObservableObject(),
    _returnView : 'places',
    _returnModal : undefined,


    onInit : function (e) {
        _preventDefault(e);

        
    },

    onShow : function (e) {
        _preventDefault(e);

        if (e.view.params !== undefined) {
            if (e.view.params.place !== undefined) {
                var placeId = LZString.decompressFromEncodedURIComponent(e.view.params.place);
                editPlaceView.setActivePlace(placeId);
            }

            if (e.view.params.returnview !== undefined)
                editPlaceView._returnView = e.view.params.returnview;

            if (e.view.params.returnmodal !== undefined){
                editPlaceView._returnModal = e.view.params.returnmodal;
        	}

        }

        // Show place type
        var activePlace = editPlaceView._activePlace;
        if(activePlace.isPrivate){
        	$("#publicPlaceHelper").addClass("hidden");
        	$("#privatePlaceHelper").removeClass("hidden");
        } else {
        
        	$("#publicPlaceHelper").removeClass("hidden");
        	$("#privatePlaceHelper").addClass("hidden");
        }
    },

    /*update: function(){
    	var placeName = $("#placeEdit-name").val();
    	var placeAlias = $("#placeEdit-alias").val();
    	var placeAddress = $("#placeEdit-address").val();



        editPlaceView.onDone();


    },*/

    onHide : function (e) {
        //_preventDefault(e);  Cant use here -- prevents navigation
    },

    isUniquePlaceName : function () {
        var place = placesModel.findPlaceByName(editPlaceView._activePlace.name);

       // Is there already
        if (place === undefined)
            return true;

        // Make sure the matching place isn't the one we're currently editing...
        if (place.uuid !== editPlaceView._activePlace.placeId) {
            mobileNotify("You already have a place named " + editPlaceView._activePlace.name);
            return false;
        }

        return true;
    },

    onDone: function (e) {
        _preventDefault(e);

        if (!editPlaceView.isUniquePlaceName()) {
            return;
        }

        var model = editPlaceView._activePlaceModel, newModel = editPlaceView._activePlace;

        // Unbind the handler...
        editPlaceView._activePlace.unbind('change' , editContactView.validatePlace);

        model.set('name', newModel.name);
        model.set('alias', newModel.alias);
        model.set('address', newModel.address);
        model.set('isPrivate', newModel.isPrivate);
        model.set('isAvailable', newModel.isAvailable);

        updateParseObject('places', 'uuid', newModel.uuid, "name", newModel.name);
        updateParseObject('places', 'uuid', newModel.uuid,'alias', newModel.alias);
        updateParseObject('places', 'uuid', newModel.uuid,'address', newModel.address);
        updateParseObject('places', 'uuid', newModel.uuid, 'isPrivate', newModel.isPrivate);
        updateParseObject('places', 'uuid', newModel.uuid,'isAvailable', newModel.isAvailable);

        mobileNotify("Updated " + newModel.name);


        var returnUrl = '#'+ editPlaceView._returnView;

        APP.kendo.navigate(returnUrl);

    },

    validatePlace: function (e) {
        _preventDefault(e);

        _preventDefault(e);

        if (e.field === 'name') {
           
        }
    },

    setActivePlace : function (placeId) {
        editPlaceView._activePlaceId = placeId;

        var placeObj = placesModel.getPlaceModel(placeId);

        editPlaceView._activePlaceModel = placeObj;

        editPlaceView._activePlace.unbind('change' , editPlaceView.validatePlace);
        editPlaceView._activePlace.set('placeId', placeId);
        editPlaceView._activePlace.set('uuid', placeObj.uuid);
        editPlaceView._activePlace.set('name', placeObj.name);
        editPlaceView._activePlace.set('alias', placeObj.alias);
        editPlaceView._activePlace.set('address', placeObj.address);
        editPlaceView._activePlace.set('city', placeObj.city);
        editPlaceView._activePlace.set('state', placeObj.state);
        editPlaceView._activePlace.set('zipcode', placeObj.zipcode);
        editPlaceView._activePlace.set('isPrivate', placeObj.isPrivate);
        editPlaceView._activePlace.set('isAvailable', placeObj.isAvailable);
        editPlaceView._activePlace.bind('change' , editPlaceView.validatePlace);

    }

};

/*
 * placeView
 */
var placeView = {
    _activePlace :  new kendo.data.ObservableObject(),
    _activePlaceId : null,
    _activePlaceModel : null,
    _lat: null,
    _lng: null,
    _returnView : 'places',

    onInit : function (e) {
        _preventDefault(e);
    },

    onShow : function (e) {
        _preventDefault(e);

        if (e.view.params !== undefined) {
            if (e.view.params.place !== undefined) {
                var placeId = LZString.decompressFromEncodedURIComponent(e.view.params.place);
                placeView.setActivePlace(placeId);
            } else {
                // No active place --
                placeView._activePlace = null;
                placeView._activePlaceId = null;
            }

            if (e.view.params.lat !== undefined) {
                placeView._lat = e.view.params.lat;
                placeView._lng = e.view.params.lng;
            }

            if (e.view.params.returnview !== undefined){
                placeView._returnView = e.view.params.returnview;
            }

        }
        var name = placeView._activePlace.name;
        var alias = placeView._activePlace.alias;
        var place = placeView._activePlace.isPrivate;
        var address = placeView._activePlace.address;

        ux.formatNameAlias(name, alias, "#placeView");

        // Toggle display of private/public icons 
        if (placeView._activePlace.isPrivate) {
            $('#publicPlaceView').addClass('hidden');
            $('#privatePlaceView').removeClass('hidden');
        } else {
            $('#privatePlaceView').addClass('hidden');
            $('#publicPlaceView').removeClass('hidden');
        }

        mapModel.setMapCenter(placeView._activePlaceModel.lat, placeView._activePlaceModel.lng);
    },

    onHide : function (e) {
        //_preventDefault(e);  Cant use here -- prevents navigation
    },

    onDone: function (e) {
        _preventDefault(e);

        var returnUrl = '#'+ placeView._returnView;

        APP.kendo.navigate(returnUrl);

    },

    setActivePlace : function (placeId) {
        placeView._activePlaceId = placeId;

        var placeObj = placesModel.getPlaceModel(placeId);

        placeView._activePlaceModel = placeObj;
        placeView._activePlace.set('placeId', placeId);
        placeView._activePlace.set('name', placeObj.name);
        placeView._activePlace.set('alias', placeObj.alias);
        placeView._activePlace.set('address', placeObj.address);
        placeView._activePlace.set('city', placeObj.city);
        placeView._activePlace.set('state', placeObj.state);
        placeView._activePlace.set('zipcode', placeObj.zipcode);
        placeView._activePlace.set('isPrivate', placeObj.isPrivate);
        placeView._activePlace.set('isAvailable', placeObj.isAvailable);

    },

    openPlaceMap: function(e){
        var placeId = LZString.compressToEncodedURIComponent(placeView._activePlaceId);
    	APP.kendo.navigate("#mapView?place=" + placeId );
    },

    takePhoto: function(e){
    	// TODO Don - wire camera feature
    },

    openChat: function(e){
    	// TODO Don - wire chat feature
    }
};

/*
 * checkInView
 */
var checkInView = {

    _returnModal : null,
    _callback: null,

    placesDS :  new kendo.data.DataSource({
        sort: {
            field: "distance",
            dir: "asc"
        },
        group: 'category'
    }),

    onInit : function (e) {
        _preventDefault(e);
        $("#checkin-listview").kendoMobileListView({
            dataSource: checkInView.placesDS,
            template: $("#checkinPlacesTemplate").html(),
            click: function (e) {
                var place = e.dataItem, placeId = place.uuid;
                mapModel.checkIn(placeId);
                userModel.checkIn(placeId);
                userStatus.update();
                mobileNotify("You're checked in to " + place.name);
                checkInView.closeModal();
            }
        });

    },

    locateAndOpenModal : function (callBack) {

        checkInView._returnView = APP.kendo.view().id;
        if (callBack !== undefined && callBack !== null) {
            checkInView._callback = callBack;
        } else {
            checkInView._callback = null;
        }
        mapModel.matchPlaces(function (placeArray) {
            // Just compute the distance of matches
            mapModel.computePlaceArrayDistance(placeArray);
            checkInView.openModal(placeArray, checkInView.onDone);
        });


    },

    openModal : function (placeArray, callback) {

        if (callback !== undefined && callback !== null) {
            checkInView.callback = callback;
        }

        if (placeArray.length > 0) {
            checkInView.placesDS.data(placeArray);
        }

        $("#modalview-checkin").data("kendoMobileModalView").open();
    },

    closeModal : function () {
        $("#modalview-checkin").data("kendoMobileModalView").close();
        userStatusView._update();
        if (checkInView.callback !== null) {
            checkInView.callback();
        }
    },

    addPlace: function (e) {
        /*checkInView.closeModal();
        APP.kendo.navigate('#'+"findPlace?returnmodal=checkin");*/
    },

    onDone: function (e) {
        _preventDefault(e);

        if (checkInView._callback !== undefined && checkInView._callback !== null) {
            checkInView._callback();
        }

       /* var returnUrl = '#'+ checkInView._returnView;

        APP.kendo.navigate(returnUrl);*/

    }

};


/*
 * mapView
 *
 */

var mapView = {
    _activePlace :  new kendo.data.ObservableObject(),
    _activePlaceId : null,
    _activePlaceModel : null,
    _lat: null,
    _lng: null,
    _marker: null,
    _zoom: 14,  // Default zoom for the map.
    _returnView : '#:back',   // Default return is just calling view

    onInit: function (e) {
        _preventDefault(e);
    },

    onShow: function (e) {
        _preventDefault(e);
        var valid = false;

        if (e.view.params !== undefined) {
            if (e.view.params.place !== undefined) {
                var placeId = LZString.decompressFromEncodedURIComponent(e.view.params.place);
                mapView.setActivePlace(placeId);
                valid = true;
            } else {
                // No active place --
                mapView._activePlace = null;
                mapView._activePlaceModel = null;
                mapView._activePlaceId = null;
            }

            if (e.view.params.lat !== undefined) {

                if (valid) {
                    mobileNotify("mapView: Showing Place and ignoring lat & lng");
                } else {
                    mapView._lat = e.view.params.lat;
                    mapView._lng = e.view.params.lng;
                    valid = true;
                }
            }

            if (e.view.params.returnview !== undefined){
                mapView._returnView = e.view.params.returnview;
            }

            if (!valid) {
                mobileNotify("mapView : No place or location to map!");
                mapView.onDone();
            }

            mapView.displayActivePlace();

        }
    },

    displayActivePlace : function () {
        var point = new google.maps.LatLng(mapView._lat, mapView._lng);
        // Center the map.
        
        mapModel.googleMap.setZoom(mapView._zoom);

        // Set a default label in case we're called with just a lat & lng.
        var label = "Current Place";

        // If there's a valid currentPlace, use the name as the marker label
        if (mapView._activePlaceModel !== null) {
            label = mapView._activePlaceModel.name;
        }
        mapView._marker = new google.maps.Marker({
            position: point,
            label: label,
            map: mapModel.googleMap
        });

        // resize the map to fit the view
       	google.maps.event.trigger(mapModel.googleMap, "resize");
       	mapModel.googleMap.setCenter(point);
    },

    setActivePlace : function (placeId) {
        mapView._activePlaceId = placeId;

        var placeObj = placesModel.getPlaceModel(placeId);

        mapView._activePlaceModel = placeObj;

        mapView._lat = placeObj.lat;
        mapView._lng = placeObj.lng;

        // Todo: cull this list based on what we show in ux...
        mapView._activePlace.set('lat', placeObj.lat);
        mapView._activePlace.set('lng', placeObj.lng);
        mapView._activePlace.set('placeId', placeId);
        mapView._activePlace.set('name', placeObj.name);
        mapView._activePlace.set('alias', placeObj.alias);
        mapView._activePlace.set('address', placeObj.address);
        mapView._activePlace.set('city', placeObj.city);
        mapView._activePlace.set('state', placeObj.state);
        mapView._activePlace.set('zipcode', placeObj.zipcode);
        mapView._activePlace.set('isPrivate', placeObj.isPrivate);
        mapView._activePlace.set('isAvailable', placeObj.isAvailable);

    },

    onDone: function (e) {
        _preventDefault(e);

        var returnUrl = '#'+ mapView._returnView;

        APP.kendo.navigate(returnUrl);

    }
};