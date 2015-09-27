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
            field: "name",
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
    },

    onShow: function (e) {
        _preventDefault(e);

        // update actionBtn
        ux.showActionBtn(false, "#places");
        //$("#places > div.footerMenu.km-footer > a").removeAttr('href').css("display", "none");


       mapModel.getCurrentPosition( function (lat,lng) {

            var places = placesModel.matchLocation(lat, lng);

            if (places.length === 0) {
                mobileNotify("No places match your current location");
                var findPlaceUrl = "#findPlace?lat="+ lat + "&lng=" +  lng +"&returnview=places";
                // No current places match the current location
            	ux.showActionBtn(true, "#places", findPlaceUrl);
            } else {
                // set placesView.placeListDS to results
            }

        });
    },

    onHide: function (e) {
        //_preventDefault(e);

        // update actionBtn
        ux.showActionBtn(false, "#places");
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
            fixedHeaders: true,
            click: function (e) {
                var geo = e.dataItem;

                var geoStr = LZString.compress(JSON.stringify(geo));

                var navStr = "#addPlace?geo="+geoStr+"&returnview=findPlace";

                APP.kendo.navigate(navStr);

            }});
    },

    onShow : function (e) {
        _preventDefault(e);

        var lat = findPlacesView._lat, lng = findPlacesView._lng;

        if (e.view.params !== undefined) {
            if (e.view.params.lat !== undefined) {
                lat = e.view.params.lat;
                lng = e.view.params.lng;
                findPlacesView._lat = lat;
                findPlacesView._lng = lng;
            }

            if (e.view.params.returnview !== undefined)
                findPlacesView._returnView = e.view.params.returnview;

            if (e.view.params.returnmodal !== undefined)
                findPlacesView._returnModal = e.view.params.returnmodal;
        }
        findPlacesView.updatePlaces(lat,lng);
    },

    onHide: function (e) {
       // _preventDefault(e);

    },

    getTypesFromComponents : function (types) {
       var typeString = '';

        for (var i=0; i<types; i++) {
            if (types[i] !== 'point_of_interest' && types[i] !== 'establishment' && types[i] !== 'food') {
                var typeStr = types[i].replace(/_/g,' ');
                var typeStr = typeStr.charAt(0).toUpperCase() + typeStr.substring(1);
                typeString += typeStr + " ,";

            }
        }
        typeString = typeString.substring(0, typeString.length - 1);

        return(typeString);
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

        // empty current data
        ds.data([]);

        places.nearbySearch({
            location: latlng,
            radius: homeView._radius,
            types: ['establishment']
        }, function (placesResults, placesStatus) {
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

                ds.add({
                    category: 'Location',   // valid categories are: Place and Location
                    name: address.streetNumber+' '+address.street,
                    type: 'Street Address',
                    googleId: null,
                    icon: null,
                    reference: null,
                    lat: lat,
                    lng: lng,
                    vicinity: address.city+', '+address.state
                });
            });
            if (placesStatus !== google.maps.places.PlacesServiceStatus.OK) {
                mobileNotify('Google Places error: '+ placesStatus);
                return;
            }

            placesResults.forEach( function (placeResult) {


                ds.add({
                    category: 'Place',   // valid categories are: Place and Location
                    name: placeResult.name,
                    type: findPlacesView.getTypesFromComponents(placeResult.types),
                    googleId: placeResult.place_id,
                    icon: placeResult.icon,
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
    },

    onShow : function (e) {
        _preventDefault(e);

        if (e.view.params !== undefined) {

            if (e.view.params.geo !== undefined) {
                var geo = LZString.decompress(e.view.params.geo);
                var geoObj = JSON.parse(geo);
                addPlaceView.setActivePlace(geoObj);
            }

            if (e.view.params.returnview !== undefined)
                addPlaceView._returnView = e.view.params.returnview;

            if (e.view.params.returnmodal !== undefined)
                addPlaceView._returnModal = e.view.params.returnmodal;

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

    setActivePlace : function (geoPlace) {
        addPlaceView._activeGeo = geoPlace;

        addPlaceView._activePlace.set('isAvailable',"true");
        addPlaceView._activePlace.set('isPrivate',"true");

        if (geoPlace.category = "Location") {
            addPlaceView._activePlace.set('category',"Location");
            addPlaceView._activePlace.set('name', '');
            addPlaceView._activePlace.set('venueName', '');
            addPlaceView._activePlace.set('alias', '');
            addPlaceView._activePlace.set('type', geoPlace.type);
            addPlaceView._activePlace.set('googleId', '');
            addPlaceView._activePlace.set('address', geoPlace.name +  ' ' + geoPlace.vicinity);
            addPlaceView._activePlace.set('lat', geoPlace.lat);
            addPlaceView._activePlace.set('lng', geoPlace.lng);

        } else {
            addPlaceView._activePlace.set('category',"Venue");
            addPlaceView._activePlace.set('name', geoPlace.name);
            addPlaceView._activePlace.set('venueName', geoPlace.name);
            addPlaceView._activePlace.set('alias', '');
            addPlaceView._activePlace.set('type', geoPlace.type);
            addPlaceView._activePlace.set('googleId', geoPlace.googleId);
            addPlaceView._activePlace.set('address', geoPlace.vicinity);
            addPlaceView._activePlace.set('lat', geoPlace.lat);
            addPlaceView._activePlace.set('lng', geoPlace.lng);
        }

    },

    addPlace : function (e) {
        _preventDefault(e);

        var place =  addPlaceView._activePlace;
        var guid = uuid.v4();

        place.set('uuid', guid);

        placesModel.placesDS.add(place);
    }

};

/*
 * editPlaceView
 */
var editPlaceView = {

    _activePlaceId : null,
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
                editPlaceView.setActivePlace(e.view.params.place);
            }

            if (e.view.params.returnview !== undefined)
                editPlaceView._returnView = e.view.params.returnview;

            if (e.view.params.returnmodal !== undefined)
                editPlaceView._returnModal = e.view.params.returnmodal;


        }
    },

    onHide : function (e) {
        //_preventDefault(e);  Cant use here -- prevents navigation
    },

    onDone: function (e) {
        _preventDefault(e);

        var returnUrl = '#'+ editPlaceView._returnView;

        APP.kendo.navigate(returnUrl);

    },

    setActivePlace : function (placeId) {
        editPlaceView._activePlaceId = placeId;
    }

};