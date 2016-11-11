/**
 * Created by donbrad on 11/10/16.
 */

'use strict';

var weatherModel = {
    currentLoc: {lat : 0, lng: 0},
    _forecastUrl : 'https://api.aerisapi.com/forecasts?client_id=luDzUaimhrAgHdycgE0Ra&client_secret=qjcxZWshS0xJWYTGWmlHcD9tUMAb7IpTSEyzNbva&p=',
    _observationUrl : 'https://api.aerisapi.com/observations?client_id=luDzUaimhrAgHdycgE0Ra&client_secret=qjcxZWshS0xJWYTGWmlHcD9tUMAb7IpTSEyzNbva&p=',

    currentForecast : function (lat, lng, callback) {

        var url = weatherModel._forecastUrl + lat + ', ' + lng;
        $.getJSON(url)
            .done(function( data ) {
                if (data.success = true && data.error === null) {
                    var weatherObj = {


                    };

                    callback(null, weatherObj);
                }

            })
            .fail(function( jqxhr, textStatus, error ) {
                var err = textStatus + ", " + error;
                console.log( "Request Failed: " + err );
            });
    },

    currentObservation : function (lat, lng, callback) {
        var url = weatherModel._observationUrl + lat + ', ' + lng;
        $.getJSON(url)
            .done(function( data ) {
                if (data.success = true && data.error === null) {
                    var weatherObj = {
                        lat : data.response.loc.lat,
                        lng : data.response.loc.long,
                        place : data.response.place.name + ', ' + data.response.place.state,
                        timestamp : data.response.ob.timestamp,
                        date : data.response.ob.dateTimeISO,
                        temp : data.response.ob.tempF,
                        humidity : data.response.ob.humidity,
                        wind : data.response.ob.windMPH,
                        windDirection : data.response.ob.windDir,
                        weather : data.response.ob.weather,
                        icon: 'images/aeris/' + data.response.ob.icon,
                        feelsLike : data.response.ob.feelslikeF,
                        sunrise : data.response.ob.sunriseISO,
                        sunset : data.response.ob.sunsetISO,
                        rain : data.response.ob.precipIN,
                        snow : data.response.ob.snowDepthIN
                    };

                    callback(null, weatherObj);
                } else {
                    callback (data.error, null);
                }
            })
            .fail(function( jqxhr, textStatus, error ) {
                var err = textStatus + ", " + error;
                callback (error, null);
            });
    }
};