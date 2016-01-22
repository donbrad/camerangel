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
    isActive : false,

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
            dataBound: function(e) {
                ux.checkEmptyUIState(placesModel.placesDS, "#placeListDiv >");
            }
        }).kendoTouch({
        	filter: ".list-box",
        	enableSwipe: true,
        	tap: function(e){
        		var place = e.touch.target[0].dataset["uuid"];
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

    queryPlace : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = placesView.placeListDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var place = view[0];

        dataSource.filter(cacheFilter);

        return(place);
    },


    editPlaceBtn: function(e){
        _preventDefault(e);
    	var place = e.button[0].dataset["uuid"];

        var navStr = "#editPlace?place="+LZString.compressToEncodedURIComponent(place)+"&returnview=places";

        APP.kendo.navigate(navStr);
    },

    deletePlaceBtn: function(e){
        _preventDefault(e);

        var placeId = e.button[0].dataset["uuid"];
        var place = placesModel.getPlaceModel(placeId);
        if (place !== undefined)
    	    placesModel.deletePlace(placeId);


    },

    onShow: function (e) {
        _preventDefault(e);

        placesView.isActive = true;

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

                    placesView.placeListDS.filter([]);

                    // hide clear btn
                    $(this).addClass('hidden');

                    // hide quick find
                    $("#quickFindPlaceBtn").addClass("hidden");
			});

            placesView.placeListDS.data(placesModel.placesDS.data());
            placesView.computePlaceDSDistance();


            placesModel.placesDS.bind("change", placesView.syncPlacesListDS);

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
                placesView.computePlaceDSDistance();
                // modalView.openInfo("New Location","Are you somewhere new? Create a new Place!", "OK", null);
            }

        });

    },

    // do an intelligent sync with underlying data source: placesModel.placesDS
    syncPlacesListDS : function (e) {
        if (e.action === undefined) {
            return;
        }

        if (e.action === 'add') {
            var newPlaces = e.items;
            for (var a=0; a< newPlaces.length; a++) {
                var newPlace = newPlaces[a];
                var place = placesView.queryPlace({ field: "uuid", operator: "eq", value: newPlace.uuid });
                if (place === undefined) {
                    placesView.placeListDS.add(newPlace);
                    placesView.placeListDS.sync();
                }
            }

        } else if (e.action === 'remove') {
            var remPlaces = e.items;
            for (var r=0; r< remPlaces.length; r++) {
                placesView.placeListDS.remove(remPlaces[r]);
                placesView.placeListDS.sync();
            }

        } else if (e.action === 'itemchange') {
            var field = e.field;
            var changes = e.items,
            newItem = changes[0];

            var oldPlace = placesView.queryPlace({ field: "uuid", operator: "eq", value: newItem.uuid });
            var newValue = newItem[field];

            if (oldPlace !== undefined) {
                oldPlace.set(field, newValue);
            }


        } else if (e.action === 'sync') {
            var changeList = e.items;

        }

    },

    computePlaceDSDistance : function() {
        var length = placesModel.placesDS.total();

        for (var i=0; i< length; i++) {
            var place = placesModel.placesDS.at(i);
            var distance = getDistanceInMiles(mapModel.lat, mapModel.lng, place.lat, place.lng);
            place.set('distance', distance.toFixed(2));
        }

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
 * searchPlacesView
 */
var searchPlacesView = {
    _returnView : 'places',
    _returnModal : null,
    _radius: 500,   // set a larger radius for find places
    _currentLocation: {},
    _queryString: null,

    placesDS :  new kendo.data.DataSource({
        sort: {
            field: "distance",
            dir: "asc"
        },
        group: 'category'
    }),

    onInit : function (e) {
        _preventDefault(e);


       /* // Filter current places and query google places on keyup
        $('#searchPlaceSearchQuery').on('input', function() {
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

                $("#searchPlaces .enterSearch").removeClass("hidden");

            } else {

                $("#searchPlaces .enterSearch").addClass("hidden");
                findPlacesView.placesDS.filter([]);
            }
        });

        // bind clear search btn
        $("#searchPlaces .enterSearch").on("click", function(){
            $("#searchPlacesSearchQuery").val('');

            // reset data filters
            searchPlacesView.placesDS.filter([]);

            // hide clear btn
            $(this).addClass('hidden');
        });
*/

        $("#searchplaces-listview").kendoMobileListView({
                dataSource: searchPlacesView.placesDS,
                template: $("#findPlacesTemplate").html(),
                headerTemplate: $("#findPlacesHeaderTemplate").html(),
                fixedHeaders: true,
                click: function (e) {
                    var geo = e.dataItem;

                    /*delete geo._events;
                    delete geo.parent;
                    delete geo.__proto__;

                    addPlaceView.setActivePlace(geo);
                    var geoStr = LZString.compressToEncodedURIComponent(JSON.stringify(geo));

                    //var navStr = "addPlace?geo=" + geoStr + "&returnview=findPlace";

                    var navStr = "#addPlace?returnview=" + findPlacesView._returnView;
                    if (searchPlacesView._returnModal !== null) {
                        navStr += "&returnmodal=" + findPlacesView._returnModal;
                    }
                    APP.kendo.navigate(navStr);
*/
                },
                dataBinding: function(e){
                    // todo jordan - wire results UI
                }
            }
        );
    },

    onShow : function (e) {
        _preventDefault(e);

        var ds = searchPlacesView.placesDS;

        var lat = searchPlacesView._lat, lng = searchPlacesView._lng;


        if (e.view.params !== undefined) {
            if (e.view.params.lat !== undefined) {
                lat = parseFloat(e.view.params.lat);
                lng = parseFloat(e.view.params.lng);

            } else {
                lat = mapModel.lat;
                lng = mapModel.lng;
            }

            if (e.view.params.query !== undefined){
                searchPlacesView._queryString = e.view.params.query;
            }

            if (e.view.params.returnview !== undefined){
                searchPlacesView._returnView = e.view.params.returnview;
            }

            if (e.view.params.returnmodal !== undefined){
                searchPlacesView._returnModal = e.view.params.returnmodal;
            } else {
                searchPlacesView._returnModal = null;
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

            searchPlacesView._currentLocation = location;

            ds.add(location);

            searchPlacesView.updatePlaces(lat,lng);
        });




    },

    onHide: function (e) {
        // _preventDefault(e);

    },
/*

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
*/

    onDone : function (e) {
        _preventDefault(e);
        var navUrl = '#' + searchPlacesView._returnView;

        if (searchPlacesView._returnModal === "checkin") {
            APP.kendo.navigate(navUrl);
        } else {
            APP.kendo.navigate(navUrl);
        }

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
                    if (findPlacesView._returnModal !== null) {
                        navStr += "&returnmodal=" + findPlacesView._returnModal;
                    }
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
            } else {
                findPlacesView._returnModal = null;
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

        if (findPlacesView._returnModal === "checkin") {
            checkInView.locateAndOpenModal();
            APP.kendo.navigate(navUrl);
        } else {
            APP.kendo.navigate(navUrl);
        }

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

        // validated form
        $("#addPlace-form").kendoValidator();

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
            if (addPlaceView._returnModal === "checkin") {
                checkInView.locateAndOpenModal(userStatusView.openModalRestore);
            }
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
            addPlaceView._activePlace.set('googleId', null);
            addPlaceView._activePlace.set('factualId', null);
            addPlaceView._activePlace.set('icon', '');
            addPlaceView._activePlace.set('reference', '');

        } else {
            // A googlePlaces venue
            addPlaceView._activePlace.set('category',"Venue");
            addPlaceView._activePlace.set('icon', geoPlace.icon);
            addPlaceView._activePlace.set('reference', geoPlace.reference);
            addPlaceView._activePlace.set('googleId', geoPlace.googleId);
            addPlaceView._activePlace.set('factualId', null);
        }

        addPlaceView._activePlace.bind('change',addPlaceView.onSync);
        addPlaceView._activePlace.set('name', geoPlace.name);

    },

    validate: function(e){
    	_preventDefault(e);

    	var form = $("#addPlace-form").kendoValidator().data("kendoValidator");

    	if(form.validate()){
    		addPlaceView.addPlace();
    	}
    },

    addPlace : function (e) {
        _preventDefault(e);

        var createChatFlag = $('#addPlaceCreateChat').is('checked');

        var place = addPlaceView._activePlace;
        placesModel.addPlace(place, createChatFlag, function (placeObj) {


            mobileNotify(placeObj.name + " added to your Places...");

            addPlaceView.onDone();

            if (createChatFlag) {
                channelModel.addPlaceChannel(placeObj.placeChatId, placeObj.uuid, placeObj.name, placeObj.isPrivate);
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

        if(editPlaceView._activePlace.get('isPrivate')){
        	$("#publicPlaceHelper").addClass("hidden");
        	$("#privatePlaceHelper").removeClass("hidden");
        } else {
        
        	$("#publicPlaceHelper").removeClass("hidden");
        	$("#privatePlaceHelper").addClass("hidden");
        }

        if (editPlaceView._activePlace.get('hasPlaceChat')) {
            $("#editplace-placechat").text("Edit Place Chat");
        } else {
            $("#editplace-placechat").text("Add Place Chat");
        }
    },

    doPlaceChat : function (e) {
        _preventDefault(e);


        if (editPlaceView._activePlace.get('hasPlaceChat')) {
            var placeChatId =  editPlaceView._activePlace.get('placeChatId');
            // Already had a place chat -- jump to editChat
            APP.kendo.navigate("#editChannel?channel=" + placeChatId);
        } else {
            // No placechat yet, create and then jump to edit
            var placeChatguid = uuid.v4(), placeId = editPlaceView._activePlace.get('uuid');

            // Todo: need to add place name collision detection here...
            channelModel.addPlaceChannel(placeChatguid, placeId, editPlaceView._activePlace.get('name'), true);

            editPlaceView._activePlace.set('placeChatId', placeChatguid);
            editPlaceView._activePlace.set('hasPlaceChat', true);

            editPlaceView._activePlaceModel.set('placeChatId', placeChatguid);
            editPlaceView._activePlaceModel.set('hasPlaceChat', true);


            updateParseObject('places', 'uuid', placeId,'hasPlaceChat', true);
            updateParseObject('places', 'uuid', placeId,'placeChatId', placeChatguid);

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
        var place = placesModel.findPlaceByName(editPlaceView._activePlace.get('name'));

       // Is there already
        if (place === undefined)
            return true;

        // Make sure the matching place isn't the one we're currently editing...
        if (place.uuid !== editPlaceView._activePlace.get('placeId')) {
            mobileNotify("You already have a place named " + editPlaceView._activePlace.get('name'));
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
        editPlaceView._activePlace.unbind('change' , editPlaceView.validatePlace);

        model.set('name', newModel.name);
        model.set('alias', newModel.alias);
        model.set('address', newModel.address);
        model.set('isPrivate', newModel.isPrivate);
        model.set('isAvailable', newModel.isAvailable);
        model.set('hasPlaceChat', newModel.hasPlaceChat);
        model.set('placeChatId', newModel.placeChatId);


        updateParseObject('places', 'uuid', newModel.uuid, "name", newModel.name);
        updateParseObject('places', 'uuid', newModel.uuid,'alias', newModel.alias);
        updateParseObject('places', 'uuid', newModel.uuid,'address', newModel.address);
        updateParseObject('places', 'uuid', newModel.uuid, 'isPrivate', newModel.isPrivate);
        updateParseObject('places', 'uuid', newModel.uuid,'isAvailable', newModel.isAvailable);
        updateParseObject('places', 'uuid', newModel.uuid,'hasPlaceChat', newModel.hasPlaceChat);
        updateParseObject('places', 'uuid', newModel.uuid,'placeChatId', newModel.placeChatId);


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
        editPlaceView._activePlace.set('placeChatId', placeObj.placeChatId);
        editPlaceView._activePlace.set('uuid', placeObj.uuid);
        editPlaceView._activePlace.set('name', placeObj.name);
        editPlaceView._activePlace.set('placeName', placeObj.placeName);
        editPlaceView._activePlace.set('alias', placeObj.alias);
        editPlaceView._activePlace.set('address', placeObj.address);
        editPlaceView._activePlace.set('city', placeObj.city);
        editPlaceView._activePlace.set('state', placeObj.state);
        editPlaceView._activePlace.set('zipcode', placeObj.zipcode);
        editPlaceView._activePlace.set('hasPlaceChat', placeObj.hasPlaceChat);
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
    _returnModal: null,
    _memoriesDS : new kendo.data.DataSource({
        sort: {
            field: "date",
            dir: "desc"
        }
    }),

    onInit : function (e) {
        _preventDefault(e);
    },

    loadMemories : function () {
        var photos = photoModel.photosDS,
            notes = noteModel.notesDS;
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
                placeView._returnView = unpackParameter(e.view.params.returnview);
            }

            if (e.view.params.returnmodal !== undefined){
                placeView._returnModal = e.view.params.returnmodal;
            } else {
                placeView._returnModal = null;
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

        if (placeView._activePlace.hasPlaceChat === true && placeView._activePlace.placeChatId !== null) {
            $('#placeView-gotochat').removeClass('hidden');
        } else {
            $('#placeView-gotochat').addClass('hidden');
        }


        //mapModel.setMapCenter(placeView._activePlaceModel.lat, placeView._activePlaceModel.lng);
    },

    onHide : function (e) {
        //_preventDefault(e);  Cant use here -- prevents navigation
    },

    onDone: function (e) {
        _preventDefault(e);

        if (placeView._returnModal === 'userstatus') {
            userStatusView.openModalRestore();
            return;
        } else if (placeView._returnView !== null) {
            var returnUrl = '#'+ placeView._returnView;

            APP.kendo.navigate(returnUrl);
        } else {
            APP.kendo.navigate("#:back");
        }


    },

    setActivePlace : function (placeId) {
        placeView._activePlaceId = placeId;

        var placeObj = placesModel.getPlaceModel(placeId);

        placeView._activePlaceModel = placeObj;
        placeView._activePlace.set('placeId', placeId);
        placeView._activePlace.set('name', placeObj.name);
        placeView._activePlace.set('alias', placeObj.alias);
        placeView._activePlace.set('lat', placeObj.lat);
        placeView._activePlace.set('lng', placeObj.lng);
        placeView._activePlace.set('address', placeObj.address);
        placeView._activePlace.set('city', placeObj.city);
        placeView._activePlace.set('state', placeObj.state);
        placeView._activePlace.set('zipcode', placeObj.zipcode);
        placeView._activePlace.set('isPrivate', placeObj.isPrivate);
        placeView._activePlace.set('isAvailable', placeObj.isAvailable);
        placeView._activePlace.set('hasPlaceChat', placeObj.hasPlaceChat);
        placeView._activePlace.set('placeChatId', placeObj.placeChatId);


    },

    camera : function (e) {
        devicePhoto.deviceCamera(
            1600, // max resolution in pixels
            75,  // quality: 1-99.
            false,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            null,  // Current channel Id for offers
            placeView.photoComplete  // Optional preview callback
        );
    },

    gallery : function (e) {
        devicePhoto.deviceGallery(
            1600, // max resolution in pixels
            75,  // quality: 1-99.
            false,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            null,  // Current channel Id for offers
            placeView.photoComplete // Optional preview callback
        );
    },

    photoComplete : function (photoId, imageUrl) {

        var photo = photoModel.findPhotoById(photoId);



        if (photo !== undefined) {

            // Override the place info the photo with information from this place
            photo.set('placeId',  placeView._activePlace.placeId);
            photo.set('placeString',  placeView._activePlace.name);
            var addressString = placeView._activePlace.city + ', ' + placeView._activePlace.state + "  " +  placeView._activePlace.zipcode;
            photo.set('addressString', addressString);

            updateParseObject('photos','photoId', photoId, 'placeId',  placeView._activePlace.placeId);
            updateParseObject('photos','photoId', photoId, 'placeString',  placeView._activePlace.name);
            updateParseObject('photos','photoId', photoId, 'addressString',  addressString);
            modalPhotoView.openModal(photo);
        }
    },

    doDirections : function (e) {
        _preventDefault(e);

        var place = placesModel.getPlaceModel(placeView._activePlace.placeId);
        if (place === undefined) {
            mobileNotify("Oops, Couldn't find this place");
            return;
        }
        if (window.navigator.simulator === undefined) {
            if (event.lat !== null) {
                launchnavigator.navigate(
                    [place.lat,place.lng],
                    null,
                    function(){
                        mobileNotify("Launching Navigation...");
                    },
                    function(error){
                        mobileNotify("Plugin error: "+ error);
                    });
            } else if (event.address !== null) {
                launchnavigator.navigate(
                    event.address,
                    null,
                    function(){
                        mobileNotify("Launching Navigation...");
                    },
                    function(error){
                        mobileNotify("Plugin error: "+ error);
                    });
            }
        } else {
            mobileNotify("Navigation not yet supported in emulator...");
        }
    },

   addNote : function (e) {
        _preventDefault(e);

       smartNoteView.openModal(null, function (note) {

       });
    },


    openPlaceMap: function(e){
        //_preventDefault(e);
        var placeId = LZString.compressToEncodedURIComponent(placeView._activePlaceId);
    	APP.kendo.navigate("#mapView?place=" + placeId );
    },

  /*  takePhoto: function(e){
        _preventDefault(e);
    	// TODO Don - wire camera feature
    },
*/
    openChat: function(e){
        _preventDefault(e);

        if (placeView._activePlace.hasPlaceChat) {

           APP.kendo.navigate('#channel?channelId=' + placeView._activePlace.placeChatId);
        }
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
        checkInView.closeModal();
        APP.kendo.navigate('#'+"findPlace?returnmodal=checkin");
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


/*
 * smartEventPlacesView
 */
var smartEventPlacesView = {
    _returnView : 'null',
    _returnModal : null,
    _radius: 16000,   // set a larger radius for find places
    _currentLocation: {},
    _autocomplete : null,
    _autocompletePlace : null,
    _autocompletePlaceOptions : {},
    _query: null,
    _placeQuery: null,
    _lat: null,
    _lng: null,
    _location: null,
    _bounds: null,
    _inited : false,
    _selectPlaceFirst: false,

    placesDS :  new kendo.data.DataSource({
      /*  sort: {
            field: "distance",
            dir: "asc"
        }*/
    }),

    onInit : function (e) {
        _preventDefault(e);




        $("#smartEventPlaces-listview").kendoMobileListView({
                dataSource: smartEventPlacesView.placesDS,
                template: $("#smartEventPlacesTemplate").html(),
                click: function (e) {
                    var geo = e.dataItem;
                    var request = {
                        placeId: geo.placeId
                    };

                    if (geo.category === 'Area') {
                        // Geocoded address

                        mapModel.googlePlaces.getDetails(request, function(place, status) {
                            if (status == google.maps.places.PlacesServiceStatus.OK) {
                                smartEventPlacesView._lat = place.geometry.location.lat();
                                smartEventPlacesView._lng = place.geometry.location.lng();
                                $('#smartEventPlaces-place').val(place.formatted_address);
                                smartEventPlacesView.setLocationAndBounds();

                                if (smartEventPlacesView._selectPlaceFirst) {
                                    smartEventPlacesView._selectPlaceFirst = false;
                                    $('#searchEventPlaces-selectPlace').addClass('hidden');
                                    $('#searchEventPlaces-searchDiv').removeClass('hidden');

                                    $('#smartEventPlaces-query').val(smartEventPlacesView._query);

                                }
                                smartEventPlacesView._processQuery(smartEventPlacesView._query);
                            }
                        });


                    } else {
                        mapModel.googlePlaces.getDetails(request, function(place, status) {
                            if (status == google.maps.places.PlacesServiceStatus.OK) {

                                // Provide the default fields for Places...
                                var address = smartEventPlacesView.getAddressFromComponents(place.address_components);
                                var placeObj = {
                                    googleId : place.place_id,
                                    name: place.name.smartTruncate(38, true).toString(),
                                    lat : place.geometry.location.lat().toFixed(6),
                                    lng : place.geometry.location.lng().toFixed(6),
                                    vicinity : place.vicinity,
                                    address : address.streetNumber + ' ' + address.street + ", " + address.city + ", " + address.state +
                                        "  " + address.zip,
                                    city:  address.city,
                                    state: address.state,
                                    zipcode: address.zipcode,
                                    country: address.country,
                                    type :  smartEventPlacesView.getTypesFromComponents(place.types),
                                    phone : place.formatted_phone_number
                                };
                                placeObj.veneuName = placeObj.name;
                                placeObj.alias = placeObj.alias;
                                placeObj.category = smartEventPlacesView.getCategoryFromComponents(place.types);
                                $("#smartEventPlacesModal").data("kendoMobileModalView").close();
                                if (smartEventPlacesView._callback !== null) {
                                    smartEventPlacesView._callback(placeObj);
                                }
                            }
                        });

                    }

                }
            }
        );
    },

    initDataSource : function () {
        smartEventPlacesView.placesDS.data([]);
    },


    setLocationAndBounds : function () {
        var geolocation = {
            lat: smartEventPlacesView._lat,
            lng: smartEventPlacesView._lng
        };

        smartEventPlacesView._location = geolocation;
        var circle = new google.maps.Circle({
            center: geolocation,
            radius: smartEventPlacesView._radius
        });

        var bounds = circle.getBounds();
        smartEventPlacesView._bounds = bounds;

    },

    preprocessQuery : function (query) {
        var queryArray = query.toLowerCase().split('near'), thisQuery = null, thisPlace = null;

        if (queryArray.length > 1) {
            thisQuery = queryArray[0];
            thisPlace = queryArray[1];

            smartEventPlacesView._query = thisQuery.trim();
            smartEventPlacesView._placeQuery = thisPlace.trim();
            smartEventPlacesView._selectPlaceFirst = true;
            $('#searchEventPlaces-selectPlace').removeClass('hidden');
            $('#searchEventPlaces-searchDiv').addClass('hidden');

            $('#smartEventPlaces-place').val(smartEventPlacesView._placeQuery);
            smartEventPlacesView._processPlaceQuery(smartEventPlacesView._placeQuery);

        } else {

            smartEventPlacesView._selectPlaceFirst = false;
            $('#searchEventPlaces-selectPlace').addClass('hidden');
            $('#searchEventPlaces-searchDiv').removeClass('hidden');

            smartEventPlacesView._query = query.toLowerCase().trim();
            $('#smartEventPlaces-query').val(smartEventPlacesView._query);
            smartEventPlacesView._processQuery(smartEventPlacesView._query);
        }

    },


    _processQuery : function (query) {

        smartEventPlacesView.setLocationAndBounds();
        var location = smartEventPlacesView._location;
        var bounds = smartEventPlacesView._bounds;

        smartEventPlacesView._autocomplete.getPlacePredictions({ input: query, options: {location: location, bounds: bounds } }, function(predictions, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                var ds = smartEventPlacesView.placesDS;
                ds.data([]);
                predictions.forEach( function (prediction) {
                    var desObj = {category:"Place",description: prediction.description};
                    if (prediction.types[0] === 'establishment') {
                        desObj.title = prediction.terms[0].value;
                        desObj.address = prediction.terms[1].value + " " + prediction.terms[2].value + ", " + prediction.terms[3].value;
                        desObj.type = 'Establishment'
                    } else if (prediction.types[0] === 'route' ) {
                        desObj.title = "Area";
                        desObj.address = prediction.terms[0].value + " " + prediction.terms[1].value + ", " + prediction.terms[2].value;
                        desObj.type = 'Route';
                    } else if (prediction.types[0] === 'street_address' ) {
                        desObj.title = "Location";
                        desObj.address = prediction.terms[0].value + " " + prediction.terms[1].value + ", " + prediction.terms[2].value;
                        desObj.type = 'Street Address';
                    } else {
                        desObj.title = "Unknown";
                        desObj.address = "Unknown";
                        desObj.type = 'Unknown';
                    }
                    desObj.placeId = prediction.place_id;
                    ds.add(desObj);

                });
            }

        });

    },

    _processPlaceQuery : function (query) {

        smartEventPlacesView._autocompletePlace.getPlacePredictions({ input: query, options: {types: ['geocode']} }, function(predictions, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                var ds = smartEventPlacesView.placesDS;
                ds.data([]);
                predictions.forEach( function (prediction) {
                    var desObj = {category:"Area", description: prediction.description, placeId: prediction.place_id};
                    switch (prediction.types[0]) {
                        case 'geocode':
                        case 'locality':
                        case 'political':

                                desObj.type = prediction.types[0];
                                if (prediction.terms.length == 3) {
                                    desObj.title = "City";
                                    desObj.address = prediction.terms[0].value + ",  " + prediction.terms[1].value;
                                } else if (prediction.terms.length == 4) {
                                    desObj.title = "Area";
                                    desObj.address = prediction.terms[0].value + " " + prediction.terms[1].value + ", " + prediction.terms[2].value;
                                }
                                ds.add(desObj);
                            break;
                    }
                   /*  if (prediction.types[0] === 'route' ) {
                        desObj.title = "Area";
                        desObj.address = prediction.terms[0].value + " " + prediction.terms[1].value + ", " + prediction.terms[2].value;
                        desObj.type = 'Route';
                    } else if (prediction.types[0] === 'street_address' ) {
                        desObj.title = "Location";
                        desObj.address = prediction.terms[0].value + " " + prediction.terms[1].value + ", " + prediction.terms[2].value;
                        desObj.type = 'Street Address';
                    } else {
                        desObj.title = "Unknown";
                        desObj.address = "Unknown";
                        desObj.type = 'Unknown';
                    }*/



                });
            }

        });

    },

    openModal : function (query, callback) {

        smartEventPlacesView.initDataSource();

        smartEventPlacesView._lat = mapModel.lat;
        smartEventPlacesView._lng = mapModel.lng;

        smartEventPlacesView.setLocationAndBounds();


        smartEventPlacesView._callback = callback;

        if (!smartEventPlacesView._inited) {
            smartEventPlacesView._inited = true;

            smartEventPlacesView._autocomplete = new google.maps.places.AutocompleteService();
            smartEventPlacesView._autocompletePlace = new google.maps.places.AutocompleteService();


            $('#smartEventPlaces-place').on('input', function () {
               var query =  $('#smartEventPlaces-place').val();
                if (query.length > 4) {
                    smartEventPlacesView._processPlaceQuery(query);
                }
            });

            $('#smartEventPlaces-query').on('input', function () {
                var query =  $('#smartEventPlaces-query').val();
                if (query.toLowerCase().indexOf('near') !== -1) {
                    smartEventPlacesView.preprocessQuery(query);
                }
                if (query.length > 4) {

                    smartEventPlacesView._processQuery(query);
                }
            });

            /*smartEventPlacesView._searchBox.addListener('places_changed', function() {
                var placesResults = smartEventPlacesView._searchBox.getPlaces();
                var ds = smartEventPlacesView.placesDS;
                ds.data([]);
                placesResults.forEach( function (placeResult) {
                    var lat = placeResult.geometry.location.lat(),
                        lng = placeResult.geometry.location.lng();
                    ds.add({
                        name: placeResult.name.smartTruncate(38, true).toString(),
                        type: findPlacesView.getTypesFromComponents(placeResult.types),
                        googleId: placeResult.place_id,
                        icon: placeResult.icon,
                        address: placeResult.formatted_address,
                        reference: placeResult.reference,
                        lat: lat.toFixed(6),
                        lng: lng.toFixed(6)
                    });

                });
            });*/

        }

        $('#smartEventPlaces-query').val(query);
        if (query.length > 3) {
            smartEventPlacesView.preprocessQuery(query);
        }

        $("#smartEventPlacesModal").data("kendoMobileModalView").open();

    },

    closeModal : function (e) {
        _preventDefault(e);
        if (smartEventPlacesView._callback !== null) {
            smartEventPlacesView._callback(null);
        }
        $("#smartEventPlacesModal").data("kendoMobileModalView").close();
    },

    onHide: function (e) {
        // _preventDefault(e);

    },

    getCategoryFromComponents : function (types) {
        if (types === undefined || types.length === 0) {
            return  "Location";
        }

        if (types[0] === 'geocode' || types[types.length-1] === 'geocode') {
             return "Location";
        }

        return "Venue"
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

  /*  updatePlaces : function (lat, lng) {
        var latlng = new google.maps.LatLng(lat, lng);
        var places = mapModel.googlePlaces;
        var ds = smartEventPlacesView.placesDS;

        // Search nearby places
        places.nearbySearch({
            location: latlng,
            radius: smartEventPlacesView._radius,
            types: ['establishment']
        }, function (placesResults, placesStatus) {

            if (placesStatus !== google.maps.places.PlacesServiceStatus.OK) {
                //mobileNotify('Google Places error: '+ placesStatus);
                return;
            }

            placesResults.forEach( function (placeResult) {

                var address = smartEventPlacesView._currentLocation;
                var distance = getDistanceInMiles(lat, lng, placeResult.geometry.location.lat(), placeResult.geometry.location.lng());
                ds.add({
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
*/
    onDone : function (e) {
        _preventDefault(e);
        var navUrl = '#' + smartEventPlacesView._returnView;

        if (findPlacesView._returnModal === "smartEvent") {
            smartEventView.restoreAndOpenModal();
            //APP.kendo.navigate(navUrl);
        } /*else {
            APP.kendo.navigate(navUrl);
        }*/

    }
};