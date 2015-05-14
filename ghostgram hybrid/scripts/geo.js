GeoLocator.prototype = {
	_watchID:null,
	_currentPosition: null,
	_watchCallBack: null,   // function (position, error)
    
    
	getCurrentPosition: function (callBack) {
		if (this._currentPosition !== null) {
			callBack(this._currentPosition, null);
		} else {
			this._watchCallBack = callBack;
			this._handleRefresh();
		}
	},
	
	watchCurrentPosition: function (callBack) {
		this._watchCallBack = callBack;
		this._handleWatch();
		
	},
	
	stopWatchingCurrentPosition: function() {
		this._watchCallBack = null;
		if (this._watchID != null) {
			navigator.geolocation.clearWatch(this._watchID);
			this._watchID = null;
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
}