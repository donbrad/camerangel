
function GeoLocator() {

}

GeoLocator.prototype = {
	_watchID:null,
	_currentPosition: null,
	_watchCallBack: null,   // function (position, error)
    
    
	getCurrentPosition: function (callBack) {
		 var options = {
            	enableHighAccuracy: true
            }, that = this;
		
		if (this._currentPosition !== null) {
			callBack(this._currentPosition, null);
		} else {	
			this._watchCallBack = callBack;
			navigator.geolocation.getCurrentPosition(function(position) {
				 callBack(position, null);
				}, function(error) {
					callBack(null, position);
				}, options);
			}
	},
	
	watchCurrentPosition: function (callBack) {
		var that = this;
		this._watchCallBack = callBack;
		this._handleWatch.apply(this, arguments);
		
	},
	
	stopWatchingCurrentPosition: function() {
		var that = this;
		that._watchCallBack = null;
		if (that._watchID != null) {
			navigator.geolocation.clearWatch(that._watchID);
			that._watchID = null;
		}
		
	},
	
	_handleRefresh:function() {
        var options = {
            	enableHighAccuracy: true
            },
            that = this;

		navigator.geolocation.getCurrentPosition(function() {
			that._onSuccess.apply(that, arguments);
		}, function() {
			that._onError.apply(that, arguments);
		}, options);
	},
    
	_handleWatch:function() {
		var that = this;
	                   
		if (that._watchID != null) {
			navigator.geolocation.clearWatch(that._watchID);
			that._watchID = null;
		}
		else {
			
			var options = {
				frequency: 1000,
				enableHighAccuracy: true
			};
			that._watchID = navigator.geolocation.watchPosition(function() {
				that._onSuccess.apply(that, arguments);
			}, function() {
				that._onError.apply(that, arguments);
			}, options);
			
            
		}
	},
    
	_onSuccess:function(position) {
		// Successfully retrieved the geolocation information. Display it all.
        
		that._currentPosition = position;
		that._currentError = null;
		if (that._watchCallBack !== null ) {
			that._watchCallBack(position, null);
		}
	},
    
	_onError:function(error) {
		that._currentError = error;
		if (that._watchCallBack !== null ) {
			that._watchCallBack(null, error);
		}
	}
};