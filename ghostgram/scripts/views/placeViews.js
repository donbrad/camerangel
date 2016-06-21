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


    onInit: function (e) {
       // _preventDefault(e);

        placesModel.locatorActive = false;

        $("#places-listview").kendoMobileListView({
            dataSource: placesModel.placeListDS,
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
                    	$(selection).velocity({translateX:"-50%"},{duration: "fast"}).addClass("place-active");
                    }
                }
                if (e.direction === "right" && $(selection).hasClass("place-active")){
                    $(selection).velocity({translateX:"0"},{duration: "fast"}).removeClass("place-active");
                }

            }
        });


    },


    editPlaceBtn: function(e){
        _preventDefault(e);
    	var place = e.button[0].dataset["uuid"];

        var navStr = "#editPlace?place="+LZString.compressToEncodedURIComponent(place)+"&returnview=places";

        APP.kendo.navigate(navStr);
    },

    deletePlaceBtn: function(e){
        _preventDefault(e);

        var placeUUID = e.button[0].dataset["uuid"];
        var place = placesModel.getPlaceModel(placeUUID);
        if (place !== undefined)
    	    placesModel.deletePlace(placeUUID);


    },

    onShow: function (e) {
      //  _preventDefault(e);

        placesView.isActive = true;

        if (!placesView._viewInitialized) {
            placesView._viewInitialized = true;
           

            // Filter current places and query google places on keyup
            $('#places .gg_mainSearchInput').on('input', function() {
                var query = this.value;
                if (query.length > 0) {
                    placesModel.placeListDS.filter(  {"logic":"or",
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

                    placesModel.placeListDS.filter([]);

                    // hide clear btn
                    $(this).addClass('hidden');

                    // hide quick find
                    $("#quickFindPlaceBtn").addClass("hidden");
			});

            placesModel.syncPlaceListDS();

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
                placesModel.updateDistance();
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
                var place = placesModel.queryPlaceList({ field: "uuid", operator: "eq", value: newPlace.uuid });
                if (place === undefined) {

                  /*  var distance = getDistanceInMiles(mapModel.lat, mapModel.lng, newPlace.lat, newPlace.lng);
                    newPlace.set('distance', distance.toFixed(2));*/
                    placesModel.placeListDS.add(newPlace);
                    placesModel.placeListDS.sync();
                }
            }

        } else if (e.action === 'remove') {
            var remPlaces = e.items;
            for (var r=0; r< remPlaces.length; r++) {
                placesModel.placeListDS.remove(remPlaces[r]);
                placesModel.placeListDS.sync();
            }

        } else if (e.action === 'itemchange') {
            var field = e.field;
            var changes = e.items,
            newItem = changes[0];

            var oldPlace = placesModel.queryPlaceList({ field: "uuid", operator: "eq", value: newItem.uuid });
            var newValue = newItem[field];

            if (oldPlace !== undefined) {
               /* if (field === 'lat' || field === 'lng') {
                    var distance = getDistanceInMiles(mapModel.lat, mapModel.lng, oldPlace.lat, oldPlace.lng);
                    oldPlace.set('distance', distance.toFixed(2));
                }*/

                oldPlace.set(field, newValue);
            }

        } else if (e.action === 'sync') {
            var changeList = e.items;

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
       // _preventDefault(e);


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
      //  _preventDefault(e);

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
       // _preventDefault(e);


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
      //  _preventDefault(e);

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

        var address = {
            streetNumber : "",
            street : "",
            city : "",
            county: "",
            state : "",
            zipcode : "",
            country : ""
        };


        for (var i=0; i<addressComponents.length; i++) {

            switch (addressComponents[i].types[0]) {

                case 'street_number':
                    address.streetNumber = addressComponents[i].short_name;
                    break;
                case 'route':
                    address.street = addressComponents[i].short_name;
                    break;
                case 'locality':
                    address.city = addressComponents[i].short_name;
                    break;

                case 'administrative_area_level_1':
                    address.state = addressComponents[i].short_name;
                    break;

                case 'administrative_area_level_2':
                    address.county = addressComponents[i].short_name;
                    break;

                case 'postal_code':
                    address.zipcode = addressComponents[i].short_name;
                    break;

                case 'country':
                    address.country = addressComponents[i].short_name;
                    break;
            }
        }
        /*var address = {};

        address.streetNumber = _.findWhere(addressComponents, { types: ['street_number'] });
        address.streetNumber = address.streetNumber === undefined ? '' : address.streetNumber.short_name;

        address.street = _.findWhere(addressComponents, { types :   ['route']  });
        address.street = address.street === undefined ? '' : address.street.short_name;

        address.city = _.findWhere(addressComponents, { types: ['locality'] });
        address.city = address.city === undefined ? '' : address.city.short_name;

        address.state = _.findWhere(addressComponents, { types: ['administrative_area_level_1']});
        address.state = address.state === undefined ? '' : address.state.short_name;

        address.zip = _.findWhere(addressComponents, { types: ['postal_code'] });
        address.zip = address.zip === undefined ? '' : address.zip.short_name;

        address.country = _.findWhere(addressComponents, { types: ['country'] });
        address.country = address.country === undefined ? '' : address.country.short_name;
*/
        return address;
    },

    updatePlaces : function (lat, lng) {
        var latlng = new google.maps.LatLng(lat, lng);
        var places = mapModel.googlePlaces;
        var ds = findPlacesView.placesDS;

        // Search nearby places
        places.nearbySearch({
            location: latlng,
            radius: findPlacesView._radius
        }, function (placesResults, placesStatus) {

            if (placesStatus !== google.maps.places.PlacesServiceStatus.OK) {
                //mobileNotify('Google Places error: '+ placesStatus);
                return;
            }

            placesResults.forEach( function (placeResult) {

                //var address = findPlacesView._currentLocation;
                var distance = getDistanceInMiles(lat, lng, placeResult.geometry.location.lat(), placeResult.geometry.location.lng());
                ds.add({
                    category: 'Place',   // valid categories are: Place and Location
                    name: placeResult.name.smartTruncate(38, true).toString(),
                    type: findPlacesView.getTypesFromComponents(placeResult.types),
                    googleId: placeResult.place_id,
                    icon: placeResult.icon,
                    address: placeResult.vicinity,
                    city:  null,
                    state: null,
                    zipcode: null,
                    country: null,
                    reference: placeResult.reference,
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
       // _preventDefault(e);

        $("#addplace-typeBtns").data("kendoMobileButtonGroup");

        // validated form
        $("#addPlace-form").kendoValidator();

    },

    onShow : function (e) {
       // _preventDefault(e);

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

        mapModel.reverseGeoCode(place.lat, place.lng, function (results, error) {
            if (results !== null) {
                var address = findPlacesView.getAddressFromComponents(results[0].address_components);
                place.set('address',  address.streetNumber + " " + address.street);
                place.set('city',  address.city);
                place.set('state',  address.state);
                place.set('zipcode',  address.zipcode);

            } else {
                place.set('city',  null);
                place.set('state',  null);
                place.set('zipcode',  null);

            }

            placesModel.addPlace(place, createChatFlag, function (placeObj) {

                mobileNotify(placeObj.name + " added to your Places...");

                addPlaceView.onDone();
                //deviceModel.syncEverlive();

                if (createChatFlag) {
                    channelModel.addPlaceChannel(placeObj.placeChatId, placeObj.uuid, placeObj.name, placeObj.isPrivate);
                }
            });
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
       // _preventDefault(e);

        
    },

    onShow : function (e) {
        //_preventDefault(e);

        if (e.view.params !== undefined) {
            if (e.view.params.place !== undefined) {
                var placeUUID = LZString.decompressFromEncodedURIComponent(e.view.params.place);
                editPlaceView.setActivePlace(placeUUID);
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
            $("#editplace-placechat").html("<img src='images/icon-edit-active.svg' class='icon-sm'> Edit Chat");
        } else {
            $("#editplace-placechat").text("Add Chat");
        }
    },

    doPlaceChat : function (e) {
        _preventDefault(e);


        if (editPlaceView._activePlace.get('hasPlaceChat')) {
            var placeChatId =  editPlaceView._activePlace.get('placeChatId');
            // Already had a place chat -- jump to editChat
            console.log(placeChatId);
            APP.kendo.navigate('#editChannel?channel=' + placeChatId);
        } else {
            // No placechat yet, create and then jump to edit
            var placeChatguid = uuid.v4(), placeUUID = editPlaceView._activePlace.get('uuid');

            // Todo: need to add place name collision detection here...
            channelModel.addPlaceChannel(placeChatguid, placeUUID, editPlaceView._activePlace.get('name'), true);

            editPlaceView._activePlace.set('placeChatId', placeChatguid);
            editPlaceView._activePlace.set('hasPlaceChat', true);

            editPlaceView._activePlaceModel.set('placeChatId', placeChatguid);
            editPlaceView._activePlaceModel.set('hasPlaceChat', true);


           /* updateParseObject('places', 'uuid', placeUUID,'hasPlaceChat', true);
            updateParseObject('places', 'uuid', placeUUID,'placeChatId', placeChatguid);
*/
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
        if (place.uuid !== editPlaceView._activePlace.get('placeUUID')) {
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
        model.set('city', newModel.city);
        model.set('state', newModel.state);
        model.set('zipcode', newModel.zipcode);
        model.set('isPrivate', newModel.isPrivate);
        model.set('isAvailable', newModel.isAvailable);
        model.set('hasPlaceChat', newModel.hasPlaceChat);
        model.set('placeChatId', newModel.placeChatId);

        placesModel.placesDS.sync();

        mobileNotify("Updated " + newModel.name);


        var returnUrl = '#'+ editPlaceView._returnView;

        APP.kendo.navigate(returnUrl);

    },

    validatePlace: function (e) {
        _preventDefault(e);

        if (e.field === 'name') {
           
        }
    },

    setActivePlace : function (placeUUID) {
        editPlaceView._activePlaceId = placeUUID;

        var placeObj = placesModel.getPlaceModel(placeUUID);

        editPlaceView._activePlaceModel = placeObj;

        editPlaceView._activePlace.unbind('change' , editPlaceView.validatePlace);
        if (placeObj === undefined) {
            mobileNotify("No Id for Place " + placeObj.name);
        }
        editPlaceView._activePlace.set('Id', placeObj.Id);
        editPlaceView._activePlace.set('placeUUID', placeUUID);
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
    _currentItem: null,
    _lat: null,
    _lng: null,
    _returnView : 'places',
    _returnModal: null,
    _showDetails: true,
    _editorActive: false,
    _titleTagActive : false,
    _memoriesDS : new kendo.data.DataSource({
        sort: {
            field: "date",
            dir: "desc"
        }
    }),
    notePhotos: [],
    noteObjects: [],
    activeNote: {objects: []},

    onInit : function (e) {
        $("#placeView-listview").kendoMobileListView({
            dataSource: placeView._memoriesDS,
            template: $("#placeViewMemories-template").html(),
            click: function(e) {
                placeView._currentItem =  e.dataItem;
                $("#placeViewItemActions").data("kendoMobileActionSheet").open();

            }
            /*,
            dataBound: function(e){
                ux.checkEmptyUIState(placeView._memoriesDS, "#channelListDiv");
            }*/
        });

        // ToDo: bind change functions for notes and photos here

    },

    queryMemories : function (query) {
        if (query === undefined)
            return([]);
        var dataSource = placeView._memoriesDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        dataSource.filter(cacheFilter);
        return(view);

    },

    queryMemory : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = placeView._memoriesDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var channel = view[0];
        dataSource.filter(cacheFilter);
        return(channel);
    },

    findPhotoMemory : function (photoId) {
        return(placeView.queryMemory([
            { field: "ggType", operator: "eq", value: 'Photo' },
            { field: "photoId", operator: "eq", value: photoId }
        ]));
    },


    buildMemoriesDS : function () {
        var ds = placeView._memoriesDS;
        ds.data([]);
        var placeUUID = placeView._activePlaceId;
        var zipcode = placeView._activePlace.zipcode;
        var photoList = photoModel.findPhotosByPlaceId(placeUUID);

        var notesList = noteModel.findNotesByObjectId(noteModel._places, placeUUID);

        if (photoList !== undefined && photoList.length > 0) {
            for (var p = 0; p < photoList.length; p++) {
                var photo = photoList[p];
                photo.ggType = 'Photo';
                photo.date = new Date(photo.updatedAt);
                ds.add(photo);
            }
        }

        if (notesList !== undefined && notesList.length > 0) {

            for (var i = 0; i < notesList.length; i++) {
                var note = notesList[i];
                note.ggType = 'Note';
                note.date = new Date(note.updatedAt);
                ds.add(note);
            }
        }

        var placeObj = placeView._activePlace;
        var point = {Latitude : placeObj.lat, Longitude: placeObj.lng}, radius = 1000;

        if (placeObj.placeRadius !== undefined) {
            radius = placeObj.placeRadius;
        }

        var photoList = photoModel.findPhotosInRadius(point, radius);

        mobileNotify("Adding " + photoList.length + " photos from Gallery");
        if (photoList.length > 0) {
            for (var p=0; p<photoList.length; p++) {
                ds.add(photoList[p]);
            }
        }
    },

    onShow : function (e) {
       // _preventDefault(e);
        ux.hideKeyboard();

        placeView.topOffset = $("#placeView-listview").data("kendoMobileListView").scroller().scrollTop;
        placeView.openEditor();

        if (e.view.params !== undefined) {
            if (e.view.params.place !== undefined) {
                var placeUUID = LZString.decompressFromEncodedURIComponent(e.view.params.place);
                placeView.setActivePlace(placeUUID);
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

        $("#placeViewName").text(name);
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


        ux.setSearchPlaceholder("Search memories...");


        $('#placeViewSearch').on('input', function() {
            var query = this.value;
            if (query.length > 0) {
                // todo - wire data source
                $("#placeView .enterSearch").removeClass("hidden");
            } else {
                $("#placeView .enterSearch").addClass("hidden");

            }
        });

        // bind clear search btn
        $("#placeView .enterSearch").on("click", function(){
            $("#placeViewSearch").val('');

            // hide clear btn
            $(this).addClass('hidden');
        });

        mobileNotify("Looking up Memories...");
        placeView.buildMemoriesDS();

        if(!placeView._showDetails){
            $(".placeCard").css("display", "block");
            $("#placeView-showDetails").addClass("hidden");
        } else {
            $(".placeCard").css("display", "none");
            $("#placeView-showDetails").removeClass("hidden");
        }

    },

    togglePlaceDetails: function(){
        if(placeView._showDetails){
            $(".placeCard").velocity("slideDown");
            $("#placeView-showDetails").addClass("hidden");
            placeView._showDetails = false;

        } else {
            $(".placeCard").velocity("slideUp");
            $("#placeView-showDetails").removeClass("hidden");
            placeView._showDetails = true;
        }
    },


    onHide : function (e) {
        //_preventDefault(e);  Cant use here -- prevents navigation
        placeView.closeEditor();
    },

    expandEditor : function () {
        $('#placeViewTextArea').css( "height","360" );
        placeView._editorExpanded = true;
    },

    shrinkEditor : function ()  {
        $('#placeViewTextArea').css( "height","36" );
        placeView._editorExpanded = false;
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

        ux.hideSearch();
    },

    setActivePlace : function (placeUUID) {
        placeView._activePlaceId = placeUUID;

        var placeObj = placesModel.getPlaceModel(placeUUID);

        if (placeObj === undefined) {
            mobileNotify("Couldn't find shared place");
            placeView.onDone();
            return;
        }

        placeView._activePlaceModel = placeObj;
        placeView._activePlace.set('Id', placeObj.Id);
        placeView._activePlace.set('placeUUID', placeUUID);
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

        // Show go to chat helper UI
        if(placeView._activePlace.hasPlaceChat){
            $(".placeChat-headerTop").velocity("fadeIn");
        } else {
            $(".placeChat-headerTop").css("display", "none");
        }

    },

    doDirections : function (e) {
        _preventDefault(e);

        var place = placesModel.getPlaceModel(placeView._activePlace.placeUUID);
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

    addImageToNote: function (photoId, displayUrl) {
        var photoObj = photoModel.findPhotoById(photoId);

        if (photoObj !== undefined) {

            var imgUrl = '<img class="photo-note" data-photoid="'+ photoId + '" id="notephoto_' + photoId + '" src="'+ photoObj.thumbnailUrl +'" />';

            $('#placeViewTextArea').redactor('insert.node', $('<div />').html(imgUrl));

        }

        placeView.notePhotos.push(photoId);
    },

    addCamera : function (e) {
        _preventDefault(e);

        devicePhoto.deviceCamera(
            devicePhoto._resolution, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            null,  // Current channel Id for offers
            placeView.addImageToNote  // Optional preview callback
        );
    },

    addPhoto : function (e) {
        _preventDefault(e);
        // Call the device gallery function to get a photo and get it scaled to gg resolution
        devicePhoto.deviceGallery(
            devicePhoto._resolution, // max resolution in pixels
            75,  // quality: 1-99.
            true,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            null,  // Current channel Id for offers
            placeView.addImageToNote  // Optional preview callback
        );
    },

    addGallery : function (e) {
        _preventDefault(e);

        galleryPicker.openModal(function (photo) {

            // photoModel.addPhotoOffer(photo.photoId, channelView._channelUUID,  photo.thumbnailUrl, photo.imageUrl, true);

            var url = photo.thumbnailUrl;
            if (photo.imageUrl !== undefined && photo.imageUrl !== null)
                url = photo.imageUrl;

            placeView.addImageToNote(photo.photoId, url);
        });
        //  APP.kendo.navigate("views/gallery.html#gallery?mode=picker");

    },

    getSelectionText: function (event){
        var selectedText = "";
        if (window.getSelection){ // all modern browsers and IE9+
            selectedText = window.getSelection().toString();
        }
        return selectedText;
    },


    noteAddPhoto : function (photoId) {

        var photo = photoModel.findPhotoById(photoId);

        if (photo !== undefined) {

            var photoObj  = {
                photoId : photo.photoId,
                channelUUID: null,
                thumbnailUrl: photo.thumbnailUrl,
                imageUrl: photo.imageUrl,
                canCopy: true,
                ownerId: userModel._user.userUUID,
                ownerName: userModel._user.name
            };
        }


        placeView.photos.push(photoObj);
        // photoModel.addPhotoOffer(photo.photoId, channelView._channelUUID, photo.thumbnailUrl, photo.imageUrl, canCopy);
    },

    validateNotePhotos : function () {
        var validPhotos = [];
        // var messageText = $('#messageTextArea').data("kendoEditor").value();
        var messageText = $('#placeViewTextArea').redactor('code.get');

        for (var i=0; i< placeView.notePhotos.length; i++) {
            var photoId = placeView.notePhotos[i];

            if (messageText.indexOf(photoId) !== -1) {
                //the photoId is in the current message text
                placeView.noteAddPhoto(photoId, !channelView.messageLock);
            }
        }

    },

    noteInit : function () {

        placeView.noteObjects = [];
        placeView.notePhotos = [];
        placeView.activeNote = {objects: []};
    },

   saveNote : function (e) {
        _preventDefault(e);
       var validNote = false; // If message is valid, send is enabled
       placeView.activeNote = { objects: []};

       var text = $('#placeViewTextArea').redactor('code.get');
       var title = $('#placeViewTitle').val();
       var tagString =  $('#placeViewTag').val();

       if (text.length > 0) {
           validNote = true;
       }

       // Are there any photos in the current message
       if (placeView.notePhotos.length > 0) {
           validNote = true;

           //Need to make sure the user didn't delete the photo reference in the html...
           placeView.validateNotePhotos();
       }
       if (validNote === true ) {
           var newNote = noteModel.createNote(noteModel._places, placeView._activePlaceId, true);
           var contentData = JSON.stringify(placeView.activeNote);
           var data = JSON.parse(contentData);
           newNote.set('title', title);
           newNote.set('content', text);
           newNote.set('data',data);
           newNote.set('tags', []);
           newNote.set('tagString', tagString);


           noteModel.notesDS.add(newNote);
           noteModel.notesDS.sync();
           
           //noteModel.saveParseNote(newNote);

           placeView._memoriesDS.add(newNote.toJSON());
           placeView._memoriesDS.sync();

           placeView._initTextArea();
           placeView.noteInit()
       }

    },


   shareItem : function (e) {
       _preventDefault(e);
       var item = placeView._currentItem;
       if (item.ggType === 'Note') {

       } else if (item.ggType === 'Photo') {

       }
       $("#placeViewItemActions").data("kendoMobileActionSheet").close();
   },

    editItem : function (e) {
        _preventDefault(e);
        var item = placeView._currentItem;
        if (item.ggType === 'Note') {
            var noteObj = item;
            smartNoteView.openModal(noteObj, function (note) {

                var newNote = noteModel.findNote(note.objectType, note.uuid);
                newNote.set('title',note.title);
                newNote.set('expiration', Number(note.expiration));
                newNote.set('content', note.content);
                newNote.set('expirationDate', note.expirationDate);
                newNote.set('tags', note.tags);
                newNote.set('tagString', tagModel.createTagString(note.tags));

                noteModel.updateNote(newNote);
                smartNoteView.onDone();

            });
        } else if (item.ggType === 'Photo') {
            var photo = placeView._currentItem;
            modalPhotoView.openModal(photo);

        }
        $("#placeViewItemActions").data("kendoMobileActionSheet").close();
    },

    deleteItem : function (e) {
        _preventDefault(e);
        var item = placeView._currentItem;

        if (item.ggType === 'Note') {
            var note = noteModel.findNote(item.objectType, item.uuid);
            if (note !== undefined) {
                placeView._memoriesDS.remove(note);
                noteModel.notesDS.remove(note);
               // deleteParseObject(noteModel._cloudClass, 'uuid', item.uuid);
            }
        } else if (item.ggType === 'Photo') {
            var photo = placeView._currentItem;
            placeView._memoriesDS.remove(photo);
            photoModel.photosDS.remove(photo);
            //deleteParseObject(photoModel._cloudClass, 'photoId', photo.photoId);



        }
        $("#placeViewItemActions").data("kendoMobileActionSheet").close();
    },

    _initTextArea : function () {

        $('#placeViewTextArea').val('');
        $('#placeViewTextArea').redactor('code.set', "");

        placeView.shrinkEditor();
        if (placeView._editorActive) {
            placeView._editorActive = false;
            placeView.deactivateEditor();
        }

    },

    toggleTitleTag : function () {

        if (placeView._titleTagActive)
            $('#placeViewTitleTag').removeClass('hidden');
        else
            $('#placeViewTitleTag').addClass('hidden');
    },

    noteTitleTag : function (e) {
        _preventDefault(e);

        placeView._titleTagActive = !placeView._titleTagActive;
        placeView.toggleTitleTag();
    },

    activateEditor : function () {

        $("#placeViewToolbar").removeClass('hidden');
        $("#privateNote-editorBtnImg").attr("src","images/icon-editor-active.svg");

    },

    deactivateEditor : function () {

        $("#placeViewToolbar").addClass('hidden');
        $("#privateNote-editorBtnImg").attr("src","images/icon-editor.svg");

    },

    openEditor : function () {
        if (placeView._editorActive === false) {

            placeView._editorActive = true;

            $('#placeViewTextArea').redactor({
                minHeight: 36,
                maxHeight: 360,
                focus: false,
                placeholder: 'Add Note...',
                /* callbacks: {
                 change: function(e)
                 {
                 $('#messageTextArea').focus();
                 }
                 },*/
                formatting: ['p', 'blockquote', 'h1', 'h2','h3'],
                buttons: ['format', 'bold', 'italic', 'lists', 'horizontalrule'],
                toolbarExternal: '#placeViewToolbar'
            });
        }

    },


    closeEditor : function () {
        if (placeView._editorActive) {
            placeView._editorActive = false;
            $('#placeViewTextArea').redactor('core.destroy');
        }

        $("#placeViewToolbar").addClass('hidden');

    },

    noteEditor : function (e) {
        _preventDefault(e);
        placeView._editorActive = !placeView._editorActive;
        if (placeView._editorActive){
            placeView.activateEditor();

        } else {
            placeView.deactivateEditor();
        }
    },


    openChat: function(e){
        _preventDefault(e);

        if (placeView._activePlace.hasPlaceChat) {

           APP.kendo.navigate('#channel?channelUUID=' + placeView._activePlace.placeChatId);
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
        group: 'ggType'
    }),

    onInit : function (e) {
        //_preventDefault(e);
        $("#checkin-listview").kendoMobileListView({
            dataSource: checkInView.placesDS,
            template: $("#checkinPlacesTemplate").html(),
            fixedHeaders: true,
            click: function (e) {

                var place = e.dataItem, name = null;
                if (place.ggType === 'Place') {
                    var placeUUID = place.uuid;
                    name = place.name;
                    mapModel.checkIn(placeUUID);
                    userModel.checkIn(placeUUID);
                } else {
                    // Must be  ggType === "Venue" ie lightweight place
                    name = place.title;
                    mapModel.checkIn(null, place.title, place.googleId);
                    userModel.checkIn(null, place.lat, place.lng, place.title, place.googleId);
                }

                userStatus.update();
                mobileNotify("You're checked in to " + name);
                checkInView.closeModal();
            },
            dataBound: function(){
                ux.checkEmptyUIState(checkInView.placesDS, '#modalview-checkin');
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

        mobileNotify("Checking your current location...");
        mapModel.getCurrentAddress(function (isNew, address) {
            mapModel.getCheckInPlaces(function (placeArray) {
                // Just compute the distance of matches
                mapModel.computePlaceArrayDistance(placeArray);
                checkInView.openModal(placeArray, checkInView.onDone);
            });

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
        //_preventDefault(e);
    },

    onShow: function (e) {
       // _preventDefault(e);
        var valid = false;

        if (e.view.params !== undefined) {
            if (e.view.params.place !== undefined) {
                var placeUUID = LZString.decompressFromEncodedURIComponent(e.view.params.place);
                mapView.setActivePlace(placeUUID);
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
        if (mapView._lat === null || mapView._lat === null) {
            return;
        }
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

    setActivePlace : function (placeUUID) {
        mapView._activePlaceId = placeUUID;

        var placeObj = placesModel.getPlaceModel(placeUUID);

        mapView._activePlaceModel = placeObj;

        mapView._lat = placeObj.lat;
        mapView._lng = placeObj.lng;

        // Todo: cull this list based on what we show in ux...
        mapView._activePlace.set('lat', placeObj.lat);
        mapView._activePlace.set('lng', placeObj.lng);
        mapView._activePlace.set('placeUUID', placeUUID);
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
        //_preventDefault(e);

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
                            } else {
                                mobileNotify("Couldn't find this place...");
                            }
                        });


                    } else {
                        mapModel.googlePlaces.getDetails(request, function(place, status) {
                            if (status == google.maps.places.PlacesServiceStatus.OK) {

                                // Provide the default fields for Places...
                                var address = findPlacesView.getAddressFromComponents(place.address_components);

                                var placeObj = {
                                    googleId : place.place_id,
                                    name: place.name.smartTruncate(38, true).toString(),
                                    lat : parseFloat(place.geometry.location.lat().toFixed(9)),
                                    lng : parseFloat(place.geometry.location.lng().toFixed(9)),
                                    vicinity : place.vicinity,
                                    address : address.streetNumber + ' ' + address.street + ", " + address.city + ", " + address.state + "  " + address.zipcode,
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
                    desObj.placeId = prediction.place_id;
                    if (prediction.types[0] === 'establishment') {
                        desObj.title = prediction.terms[0].value;
                        desObj.address = prediction.terms[1].value + " " + prediction.terms[2].value + ", " + prediction.terms[3].value;
                        desObj.type = 'Establishment';

                        ds.add(desObj);
                    } else if (prediction.types[0] === 'route' ) {
                        desObj.title = "Area";
                        desObj.address = prediction.terms[0].value + " " + prediction.terms[1].value + ", " + prediction.terms[2].value;
                        desObj.type = 'Route';

                        ds.add(desObj);
                    } else if (prediction.types[0] === 'street_address' ) {
                        desObj.title = "Location";
                        desObj.address = prediction.terms[0].value + " " + prediction.terms[1].value + ", " + prediction.terms[2].value;
                        desObj.type = 'Street Address';

                        ds.add(desObj);
                    } else {
                        desObj.title = "Unknown";
                        desObj.address = "Unknown";
                        desObj.type = 'Unknown';
                    }


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

        var form = $("#searchEventPlace-form").kendoValidator().data("kendoValidator");
        form.validate();

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



    onDone : function (e) {
        _preventDefault(e);
        var navUrl = '#' + smartEventPlacesView._returnView;

        if (smartEventPlacesView._returnModal === "smartEvent") {
            smartEventView.restoreAndOpenModal();
            //APP.kendo.navigate(navUrl);
        } /*else {
            APP.kendo.navigate(navUrl);
        }*/

    }
};




/*
 * smartLocationView
 */
var smartLocationView = {
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
    _geo : {
        lat: 0, lng: 0, address: null, placeUUID: null

    },
    _address: null,
    _location: null,
    _bounds: null,
    _inited : false,


    placesDS :  new kendo.data.DataSource({
        /*  sort: {
         field: "distance",
         dir: "asc"
         }*/
    }),

    onInit : function (e) {
        //_preventDefault(e);

        $("#smartLocation-listview").kendoMobileListView({
                dataSource: smartLocationView.placesDS,
                template: $("#smartEventPlacesTemplate").html(),
                click: function (e) {
                    var geo = e.dataItem;
                    var request = {
                        placeId: geo.placeId
                    };

                    if (geo.category === 'Area') {
                        // Geocoded address

                        mapModel.googlePlaces.getDetails(request, function(place, status) {
                            if (status === google.maps.places.PlacesServiceStatus.OK) {
                                smartLocationView._geo.lat = place.geometry.location.lat();
                                smartLocationView._geo.lng = place.geometry.location.lng();
                                smartLocationView._geo.address = place.formatted_address;
                                smartLocationView._geo.placeId = place.place_id;
                                $('#smartLocation-place').val(place.formatted_address);

                                if (smartLocationView._callback !== null) {
                                    smartLocationView._callback(smartLocationView._geo);
                                }
                                smartLocationView.closeModal();
                            }
                        });


                    } /*else {
                        mapModel.googlePlaces.getDetails(request, function(place, status) {
                            if (status == google.maps.places.PlacesServiceStatus.OK) {

                                // Provide the default fields for Places...
                                var address = smartEventPlacesView.getAddressFromComponents(place.address_components);

                                var placeObj = {
                                    googleId : place.place_id,
                                    name: place.name.smartTruncate(38, true).toString(),
                                    lat : Number(place.geometry.location.lat().toFixed(6)),
                                    lng : Number(place.geometry.location.lng().toFixed(6)),
                                    vicinity : place.vicinity,
                                    address : address.streetNumber + ' ' + address.street + ", " + address.city + ", " + address.state + "  " + address.zipcode,
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

                    }*/

                }
            }
        );
    },

    initDataSource : function () {
        smartLocationView.placesDS.data([]);
    },


    setLocationAndBounds : function () {
        var geolocation = {
            lat: smartLocationView._lat,
            lng: smartLocationView._lng
        };

        smartLocationView._location = geolocation;
        var circle = new google.maps.Circle({
            center: geolocation,
            radius: smartLocationView._radius
        });

        var bounds = circle.getBounds();
        smartLocationView._bounds = bounds;

    },


    processPlaceQuery : function (query) {

        smartLocationView._autocompletePlace.getPlacePredictions({ input: query, options: {types: ['geocode']} }, function(predictions, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                var ds = smartLocationView.placesDS;
                ds.data([]);
                predictions.forEach( function (prediction) {
                    var desObj = {category:"Area", description: prediction.description, placeUUID: prediction.place_id};
                    switch (prediction.types[0]) {
                        case 'geocode':
                        case 'locality':
                        case 'political':

                            desObj.type = prediction.types[0];
                            if (prediction.terms.length == 3) {
                                desObj.title = "City";
                                desObj.address = prediction.terms[0].value + ",  " + prediction.terms[1].value;
                                ds.add(desObj);
                            } else if (prediction.terms.length == 4) {
                                desObj.title = "Area";
                                desObj.address = prediction.terms[0].value + " " + prediction.terms[1].value + ", " + prediction.terms[2].value;
                                ds.add(desObj);
                            }

                            break;
                    }

                });
            }

        });

    },

    openModal : function (query, callback) {

        smartLocationView.initDataSource();

        smartLocationView._lat = mapModel.lat;
        smartLocationView._lng = mapModel.lng;

        smartLocationView._callback = callback;

        if (!smartLocationView._inited) {
            smartLocationView._inited = true;

            smartLocationView._autocompletePlace = new google.maps.places.AutocompleteService();


            $('#smartLocation-place').on('input', function () {
                var query =  $('#smartLocation-place').val();
                if (query.length > 3) {
                    smartLocationView.processPlaceQuery(query);
                }
            });


        }

        if (query === null)
            query = '';

        $('#smartLocation-place').val(query);

        if (query.length > 3) {
            smartLocationView.processPlaceQuery(query);
        }
        /*var form = $("#searchLocation-form").kendoValidator().data("kendoValidator");
        form.validate();*/

        $("#smartLocationModal").data("kendoMobileModalView").open();

    },

    closeModal : function (e) {
        _preventDefault(e);

        $("#smartLocationModal").data("kendoMobileModalView").close();
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


    onDone : function (e) {
        _preventDefault(e);
        var navUrl = '#' + smartLocationView._returnView;

        if (smartEventView._returnModal === "smartEvent") {
            smartEventView.restoreAndOpenModal();
            //APP.kendo.navigate(navUrl);
        } /*else {
         APP.kendo.navigate(navUrl);
         }*/

    }
};

/*
 * mapViewModal
 *
 */

var mapViewModal = {
    _activePlace :  new kendo.data.ObservableObject(),
    _activePlaceId : null,
    _activePlaceModel : null,
    _lat: null,
    _lng: null,
    _name: null,
    _marker: null,
    _zoom: 14,  // Default zoom for the map.
    _returnView : '#:back',   // Default return is just calling view
    _returnModal : null,

    onInit: function (e) {
        //_preventDefault(e);
    },

    openModal: function (placeId, lat, lng, name, callback) {
        // _preventDefault(e);
        var valid = false;

        if (callback !== undefined) {
            mapViewModal._returnModal = callback;
        }
        
        if (placeId !== null) {
            mapViewModal.setActivePlace(placeId);
        } else {
            // No active place --
            mapViewModal._activePlace = null;
            mapViewModal._activePlaceModel = null;
            mapViewModal._activePlaceId = null;


            mapViewModal._lat = lat;
            mapViewModal._lng = lng;
            mapViewModal._name = name;
        }

        mapViewModal.displayActivePlace();

        $("#mapViewModal").data("kendoMobileModalView").open();
    },

    displayActivePlace : function () {
        if (mapViewModal._lat === null || mapViewModal._lat === null) {
            return;
        }
        var point = new google.maps.LatLng(mapViewModal._lat, mapViewModal._lng);
        // Center the map.

        mapModel.googleMap.setZoom(mapViewModal._zoom);

        // Set a default label in case we're called with just a lat & lng.
        var label = mapViewModal._name;

        // If there's a valid currentPlace, use the name as the marker label
        if (mapViewModal._activePlaceModel !== null) {
            label = mapViewModal._activePlaceModel.name;
        }
        mapViewModal._marker = new google.maps.Marker({
            position: point,
            label: label,
            map: mapModel.googleMap
        });

        // resize the map to fit the view
        google.maps.event.trigger(mapModel.googleMap, "resize");
        mapModel.googleMap.setCenter(point);
    },

    setActivePlace : function (placeUUID) {
        mapViewModal._activePlaceId = placeUUID;

        var placeObj = placesModel.getPlaceModel(placeUUID);

        mapViewModal._activePlaceModel = placeObj;

        mapViewModal._lat = placeObj.lat;
        mapViewModal._lng = placeObj.lng;

        // Todo: cull this list based on what we show in ux...
        mapViewModal._activePlace.set('lat', placeObj.lat);
        mapViewModal._activePlace.set('lng', placeObj.lng);
        mapViewModal._activePlace.set('placeUUID', placeUUID);
        mapViewModal._activePlace.set('name', placeObj.name);
        mapViewModal._activePlace.set('alias', placeObj.alias);
        mapViewModal._activePlace.set('address', placeObj.address);
        mapViewModal._activePlace.set('city', placeObj.city);
        mapViewModal._activePlace.set('state', placeObj.state);
        mapViewModal._activePlace.set('zipcode', placeObj.zipcode);
        mapViewModal._activePlace.set('isPrivate', placeObj.isPrivate);
        mapViewModal._activePlace.set('isAvailable', placeObj.isAvailable);

    },

    onDone: function (e) {
        _preventDefault(e);

        $("#mapViewModal").data("kendoMobileModalView").close();
        
        if (mapViewModal._returnModal !== null) {
            mapViewModal._returnModal();
            
        } else {
            var returnUrl = '#' + mapViewModal._returnView;

            APP.kendo.navigate(returnUrl);
        }

    }
};