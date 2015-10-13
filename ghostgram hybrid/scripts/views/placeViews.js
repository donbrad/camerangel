/**
 * Created by donbrad on 9/23/15.
 * placeViews.js
 */

'use strict';

/*
 * placesView
 */
var placesView = {

    placeListDS: new kendo.data.DataSource({
        sort: {
            field: "distance",
            dir: "asc"
        }
    }),

    onInit: function (e) {
        _preventDefault(e);

        placesModel.locatorActive = false;

        // Activate clearsearch and zero the filter when it's called
        $('#placeSearchQuery').clearSearch({
            callback: function() {
                placesView.placeListDS.data(placesModel.placesDS.data());
                placesView.placeListDS.filter([]);
            }
        });

        // Filter current places and query google places on keyup
        $('#placeSearchQuery').keyup(function() {
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

            } else {

                placesView.placeListDS.data(placesModel.placesDS.data());
                placesView.placeListDS.filter([]);
            }
        });

        $("#places-listview").kendoMobileListView({
            dataSource: placesView.placeListDS,
            template: $("#placesTemplate").html(),
            dataBound: function(e){
                ux.checkEmptyUIState(findPlacesView.placesDS, "#placeListDiv >");
            }
        }).kendoTouch({
        	filter: ".list-box",
        	enableSwipe: true,
        	tap: function(e){
        		var place = e.touch.target[0].dataset["id"];
                var placeId = LZString.compressToEncodedURIComponent(place.uuid);

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
    	// Todo Don - wire delete place
    },

    onShow: function (e) {
        _preventDefault(e);

        ux.scrollUpSearch(e);
        // Always display the add places button so users can create a new place (even if others exist)
        
        // update actionBtn
        ux.changeActionBtnImg("#places", "icon-gps-light");
        ux.showActionBtnText("#places", "3.5rem", "Check in");

        var findPlaceUrl = "#findPlace?lat="+ mapModel.lat + "&lng=" +  mapModel.lng +"&returnview=places";
        ux.showActionBtn(true, "#places", findPlaceUrl);
        //$("#places > div.footerMenu.km-footer > a").removeAttr('href').css("display", "none");


        mapModel.getCurrentAddress(function (isNew, address) {
            // Is this a new location
            if (isNew) {
                mapModel.computePlaceDistance();
               // modalView.openInfo("New Location","Are you somewhere new? Create a new Place!", "OK", null);
            }
            
            placesView.placeListDS.data(placesModel.placesDS.data());
        });

       /*mapModel.getCurrentPosition( function (lat,lng) {

        

        
        // get current position
       	 mapModel.getCurrentPosition( function (lat,lng) {


           //Compute distance for all places based on current locaiton
           mapModel.computePlaceDistance();
           placesView.placeListDS.data(placesModel.placesDS.data());
           

           //Compute distance for all places based on current locaiton
           mapModel.computePlaceDistance();
           placesView.placeListDS.data(placesModel.placesDS.data());


            var places = placesModel.matchLocation(lat, lng);

            if (places.length === 0) {
                mobileNotify("No places match your current location");
                var findPlaceUrl = "#findPlace?lat="+ lat + "&lng=" +  lng +"&returnview=places";
                // No current places match the current location
                
            } else {

                for (var i=0; i<places.length; i++) {
                    var found = false;
                    if (mapModel.currentPlaceId === places[i].uuid) {
                        found = true;

                    }
                }

                if (!found) {
                    mobileNotify("Are you at a new Place?");
                }
                // set placesView.placeListDS to results
            }

        });*/
    },

    onHide: function (e) {
        //_preventDefault(e);

        // update actionBtn
        ux.showActionBtn(false, "#places");
        ux.hideActionBtnText("#places");
        ux.changeActionBtnImg("#places", "nav-add-white");
    }

};

/*
 * findPlacesView
 */
var findPlacesView = {
    _returnView : 'places',
    _returnModeal : null,
    _lat : null,
    _lng : null,
    _currentLocation: {},

    placesDS :  new kendo.data.DataSource({
        sort: {
            field: "name",
            dir: "asc"
        },
        group: 'category'
    }),

    onInit : function (e) {
        _preventDefault(e);
        $("#findplace-listview").kendoMobileListView({
                dataSource: findPlacesView.placesDS,
                template: $("#findPlacesTemplate").html(),
                headerTemplate: $("#findPlacesHeaderTemplate").html(),
                fixedHeaders: true,
                click: function (e) {
                    var geo = e.dataItem;

                    var geoStr = LZString.compressToEncodedURIComponent(JSON.stringify(geo));

                    var navStr = "#addPlace?geo=" + geoStr + "&returnview=findPlace";

                    APP.kendo.navigate(navStr);

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
                lat = e.view.params.lat;
                lng = e.view.params.lng;
                findPlacesView._lat = lat;
                findPlacesView._lng = lng;
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
            if (geoResults.length === 0 || geoResults[0].types[0] !== 'street_address') {
                mobileNotify('We couldn\'t match your position to a street address.');
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
                vicinity: address.city+', '+address.state
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
            radius: homeView._radius,
            types: ['establishment']
        }, function (placesResults, placesStatus) {

            if (placesStatus !== google.maps.places.PlacesServiceStatus.OK) {
                //mobileNotify('Google Places error: '+ placesStatus);
                return;
            }

            placesResults.forEach( function (placeResult) {

                var address = findPlacesView._currentLocation;
                ds.add({
                    category: 'Place',   // valid categories are: Place and Location
                    name: placeResult.name.smartTruncate(24, true),
                    type: findPlacesView.getTypesFromComponents(placeResult.types),
                    googleId: placeResult.place_id,
                    icon: placeResult.icon,
                    address: address.address,
                    city:  address.city,
                    state: address.state,
                    zipcode: address.zipcode,
                    country: address.country,
                    reference: placeResult.reference,
                    lat: placeResult.geometry.location.H,
                    lng: placeResult.geometry.location.L,
                    vicinity: placeResult.vicinity
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

    onInit : function (e) {
        _preventDefault(e);

        $("#addplace-typeBtns").data("kendoMobileButtonGroup");


    },

    onShow : function (e) {
        _preventDefault(e);

        $('#addPlaceCreateChat').attr('checked', false);

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

        APP.kendo.navigate(returnUrl);

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

        addPlaceView._activePlace.set('name', geoPlace.name);
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


    },

    addPlace : function (e) {
        _preventDefault(e);

        var form = $("#addPlace-form").kendoValidator().data("kendoValidator");
        // TODO Don - Check for place duplicates

        // validate form
	    if (form.validate()) {

	        var newPlace = placesModel.newPlace();
	        var place =  addPlaceView._activePlace;
	        var guid = uuid.v4();

	        var createChatFlag = $('#addPlaceCreateChat').is('checked');

	        newPlace.set('uuid', guid);
	        newPlace.set('category', place.category);
	        newPlace.set('name', place.name);
	        newPlace.set('venueName', place.venueName);
	        newPlace.set('alias', place.alias);
	        newPlace.set('googleId', place.googleId);
	        newPlace.set('address', place.address);
	        newPlace.set('lat', place.lat);
	        newPlace.set('lng', place.lng);
	        newPlace.set('type', place.type);
	        newPlace.set('city', place.city);
	        newPlace.set('state', place.state);
	        newPlace.set('country', place.country);
	        newPlace.set('zipcode', place.zipcode);

	        newPlace.set('isAvailable', place.isAvailable === "true");
	        newPlace.set('isPrivate', place.isPrivate === "true");
	        newPlace.set('hasPlaceChat', place.hasPlaceChat === "true");

	        placesModel.placesDS.add(newPlace);

	        placesModel.placesDS.sync();

	        mobileNotify(place.name + " added to your Places...");

	        addPlaceView.onDone();
    	}
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

    update: function(){
    	var placeName = $("#placeEdit-name").val();
    	var placeAlias = $("#placeEdit-alias").val();
    	var placeAddress = $("#placeEdit-address").val();

    	// todo - Update any data changes
    	
    	var form = $("#placeEdit-form").kendoValidator().data("kendoValidator");

	    if (form.validate()) {
	        editPlaceView.onDone();
	    }

    },

    onHide : function (e) {
        //_preventDefault(e);  Cant use here -- prevents navigation
    },

    onDone: function (e) {
        _preventDefault(e);

        var model = editPlaceView._activePlaceModel, newModel = editPlaceView._activePlace;

        model.set('name', newModel.name);
        model.set('alias', newModel.alias);
        model.set('address', newModel.address);
        model.set('isPrivate', newModel.isPrivate);
        model.set('isAvailable', newModel.isAvailable);

        mobileNotify("Updated " + newModel.name);

        placesModel.placesDS.sync();

        var returnUrl = '#'+ editPlaceView._returnView;

        APP.kendo.navigate(returnUrl);

    },

    setActivePlace : function (placeId) {
        editPlaceView._activePlaceId = placeId;

        var placeObj = placesModel.getPlaceModel(placeId);

        editPlaceView._activePlaceModel = placeObj;

        editPlaceView._activePlace.set('name', placeObj.name);
        editPlaceView._activePlace.set('alias', placeObj.alias);
        editPlaceView._activePlace.set('address', placeObj.address);
        editPlaceView._activePlace.set('city', placeObj.city);
        editPlaceView._activePlace.set('state', placeObj.state);
        editPlaceView._activePlace.set('zipcode', placeObj.zipcode);
        editPlaceView._activePlace.set('isPrivate', placeObj.isPrivate);
        editPlaceView._activePlace.set('isAvailable', placeObj.isAvailable);

    }

};

/*
 * placeView
 */
var placeView = {
    _activePlace : null,
    _activePlaceId : null,
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
                editPlaceView.setActivePlace(placeId);
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
                editPlaceView._returnView = e.view.params.returnview;
            }

        }
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

        placeView._activePlace = placesModel.getPlaceModel(placeId);
    }
};

/*
 * checkInView
 */
var checkInView = {
    _returnView : 'places',
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

    locateAndOpenModal : function (e) {
        _preventDefault(e);

        checkInView._returnView = APP.kendo.view().id;

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

    },


    onDone: function (e) {
        _preventDefault(e);

        var returnUrl = '#'+ checkInView._returnView;

        APP.kendo.navigate(returnUrl);

    }

};