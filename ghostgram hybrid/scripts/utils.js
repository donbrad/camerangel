function setButtonGroupIndex(buttonSelector, index) {

	var buttonGroup = $(buttonSelector).data("kendoMobileButtonGroup");

	if (buttonGroup !== undefined) {
		buttonGroup.select(index);
	}
}

String.prototype.smartTruncate =
	function(n,useWordBoundary){
		var toLong = this.length>n,
			s_ = toLong ? this.substr(0,n-1) : this;
		s_ = useWordBoundary && toLong ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
		return  toLong ? s_ + '...' : s_;
	};


function _socialShare (message, subject, url, file) {


	if (url !== null) {
		var encodedurl = url.replace(/-/g, '%2D');

		_createBitlyUrl(encodedurl, function (bitUrl) {
			window.plugins.socialsharing.share (
				message,
				subject,
				file,
				bitUrl,
				function(result) {
					console.log('result: ' + result)
				},
				function(error) {
					mobileNotify('Social Sharing Error : ' + error);
				}
			);
		});
	} else {

		window.plugins.socialsharing.share (
			message,
			subject,
			file,
			url,
			function(result) {
				console.log('result: ' + result)
			},
			function(error) {
				mobileNotify('Social Sharing Error : ' + error);
			}
		);
	}


}

function _createBitlyUrl (url, callBack) {

	///var username = "donbrad"; // bit.ly username
	var apiKey = "0086e4b7d58a7f949a4393ad2a5ab7b1a437accf";

	$.ajax({
		url: 'https://api-ssl.bitly.com/v3/shorten?access_token=' + apiKey + '&format=json&longUrl=' + encodeURIComponent(url),
		// dataType:"jsonp",
		//  contentType: 'application/json',
		success: function(result) {
			if (result.status_code === 200) {
				if (callBack !== undefined) {
					callBack(result.data.url);
				}
			} else if (result.status_code === 500) {
				mobileNotify("Bitly: Invalid Long Url");
			} else {
				mobileNotify("Bitly: Error = " + result.status_code);
			}


		}
	});
}

function updateParseObject(objectName, idField, idFieldValue, newField, newFieldValue) {
	var object = Parse.Object.extend(objectName);
	var query = new Parse.Query(object);
	query.equalTo(idField, idFieldValue);

	if (newFieldValue === 'true')
		newFieldValue = true;
	if (newFieldValue === 'false')
		newFieldValue - false;

	query.find({
		success: function(results) {
			if (results.length > 0) {
				results[0].set(newField, newFieldValue);
				results[0].save({
					success: function(myObject) {
						// The object was deleted from the Parse Cloud.
					},
					error: function(myObject, error) {
						mobileNotify("Error: " + error.code + " " + error.message);
					}
				});
			}
		},
		error: function(error) {
			handleParseError(error);
		}
	});
}

function findParseObject(objectName, field, fieldValue, callback) {
	var parseObject = Parse.Object.extend(objectName);
	var query = new Parse.Query(parseObject);

	query.equalTo(field, fieldValue);

	query.find({
		success: function(results) {
			callback(results);
		},
		error: function(error) {
			handleParseError(error);
		}
	});

}

function deleteParseObject(objectName, field, fieldValue) {
	var object = Parse.Object.extend(objectName);
	var query = new Parse.Query(object);
	query.equalTo(field, fieldValue);
	query.find({
		success: function(results) {
			if (results.length > 0) {
				results[0].destroy({
					success: function(myObject) {
						// The object was deleted from the Parse Cloud.
					},
					error: function(myObject, error) {
						// The delete failed.
						// error is a Parse.Error with an error code and message.
						handleParseError(error);
					}
				});
			}
		},
		error: function(error) {
			handleParseError(error);
		}
	});
}

function getNetworkState() {
	var networkState = navigator.connection.type;
	switch (networkState) {
		case Connection.ETHERNET:
		case Connection.WIFI:
			deviceModel.setAppState('connection', "internet");
			mobileNotify("Online via Wifi");
			break;
		case Connection.CELL:
		case Connection.CELL_2G:
		case Connection.CELL_3G:
		case Connection.CELL_4G:
			deviceModel.setAppState('connection', "cell");
			mobileNotify("Online via Cell");
			break;
	}
}

function handleParseError(err) {
	switch (err.code) {
		case Parse.Error.INVALID_SESSION_TOKEN:
			Parse.User.logOut();
			userModel.currentUser = '';
			APP.models.profile.username = '';
			APP.models.profile.email = '';
			APP.models.profile.phone = '';
			APP.models.profile.alias = '';
			APP.models.profile.userUUID = '';
			APP.kendo.navigate('#newuserhome');
			break;
	}
}

function getDistanceInKm  (lat1, lon1, lat2, lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
	var dLon = this.deg2rad(lon2-lon1);
	var a =
			Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
			Math.sin(dLon/2) * Math.sin(dLon/2)
		;
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	var d = R * c; // Distance in km
	return d;
}

function getDistanceInMeters  (lat1, lon1, lat2, lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
	var dLon = this.deg2rad(lon2-lon1);
	var a =
			Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
			Math.sin(dLon/2) * Math.sin(dLon/2)
		;
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	var d = R * c; // Distance in km
	return d * 1000;
}

function deg2rad (deg) {
	return deg * (Math.PI/180);
}

// Are two points within a specific distance
function inPlaceRadius (lat1, lng1, lat2, lng2, radius) {

	if (radius === undefined || radius < 10) {
		radius = 30;
	}

	if (typeof lat1 === 'string') {
		lat1 = Number(lat1);
		lng1 = Number(lng1);
	}

	if (typeof lat2 === 'string') {
		lat2 = Number(lat2);
		lng2 = Number(lng2);
	}

	var distance = getDistanceInMeters(lat1, lng1, lat2, lng2);

	if (distance <= radius) {
		return true;
	} else {
		return false;
	}
}

function getBase64FromImageUrl(URL, callback) {
	var img = new Image();
	img.src = URL;
	img.onload = function() {
		var canvas = document.createElement("canvas");
		canvas.width = this.width;
		canvas.height = this.height;

		var ctx = canvas.getContext("2d");
		ctx.drawImage(this, 0, 0);
		var dataURL = canvas.toDataURL("image/png");
		callback(dataURL.replace(/^data:image\/(png|jpg);base64,/, ""));
	}

	img.onerror = function() {
		callback(null);
	}
}

function mobileNotify(message) {
	if (window.navigator.simulator === true) {
		//running in the simulator
		alert(message);
	} else {
		//running on a device
		window.plugins.toast.showShortTop(message);
	}

}

// if new value is defined, return it, otherwise return original
function _smartSet(original, newValue) {
	if (newValue !== undefined)
		return(newValue);

	return(original);
}

function _smartSetNull(original, newValue) {
	if (newValue !== undefined && newValue !== null)
		return(newValue);

	return(original);
}

function getChannelMembers(channelId, callBack) {
	Parse.Cloud.run('getUserChannels', {
		channelId: channelId
	}, {
		success: function(result, error) {
			if (result.status === 'ok') {
				callBack({
					found: true,
					channel: result
				});
			} else {
				callBack({
					found: false,
					channel: null
				});
			}

		},
		error: function(result, error) {
			callBack(null, error)
		}
	});
}
function getUserChannels(uuid, callBack) {
	Parse.Cloud.run('getUserChannels', {
		uuid: uuid
	}, {
		success: function(result, error) {
			if (result.status === 'ok') {
				callBack({
					found: true,
					channels: result.channels
				});
			} else {
				callBack({
					found: false,
					channels: null
				});
			}

		},
		error: function(result, error) {
			callBack(null, error)
		}
	});
}

function getNewUserChannels(phone, callBack) {
	Parse.Cloud.run('getNewUserChannels', {
		phone: phone
	}, {
		success: function(result, error) {
			if (result.status === 'ok') {
				callBack({
					found: true,
					channels: result.channels
				});
			} else {
				callBack({
					found: false,
					channels: null
				});
			}

		},
		error: function(result, error) {
			callBack(null, error)
		}
	});
}

function queryPrivateChannel(uuid, contactuuid, callBack) {
	Parse.Cloud.run('queryPrivateChannel', {
		uuid: uuid, contactuuid : contactuuid
	}, {
		success: function(result, error) {
			if (result.status === 'ok' && result.count > 0) {
				callBack({
					found: true,
					channels: result.channels,
					count: result.count,
					update: result.update
				});
			} else {
				callBack({
					found: false,
					channels: null,
					count: 0,
					update: true
				});
			}

		},
		error: function(result, error) {
			callBack(null, error)
		}
	});
}

function getUserPublicKey(uuid, callBack) {
	Parse.Cloud.run('getUserPublicKey', {
		uuid: uuid
	}, {
		success: function(result, error) {
			if (result.status === 'ok') {
				callBack({
					found: true,
					publicKey: result.publicKey
				});
			} else {
				callBack({
					found: false,
					publicKey: null
				});
			}

		},
		error: function(result, error) {
			callBack(null, error)
		}
	});
}

function getUserContactInfo(uuid, callBack) {
	Parse.Cloud.run('getUserContactData', {
		uuid: uuid
	}, {
		success: function(result, error) {
			if (result.status === 'ok') {
				callBack({
					found: true,
					user: result.user
				});
			} else {
				callBack({
					found: false,
					user: null
				});
			}

		},
		error: function(result, error) {
			callBack(null, error)
		}
	});
}

function findUserByEmail(email, callBack) {
	Parse.Cloud.run('findUserByEmail', {
		email: email
	}, {
		success: function(result) {
			if (result.status === 'ok') {
				callBack({
					found: true,
					user: result.user
				});
			} else {
				callBack({
					found: false
				});
			}

		},
		error: function(result, error) {
			mobileNotify('Error Finding User by email  ' + error);
			callBack({
				found: false
			});
		}
	});
}

function findUserByPhone(phone, callBack) {
	Parse.Cloud.run('findUserByPhone', {
		phone: phone
	}, {
		success: function(result) {
			if (result.status === 'ok') {
				callBack({
					found: true,
					user: result.user
				});
			} else {
				callBack({
					found: false
				});
			}

		},
		error: function(result, error) {
			mobileNotify('Error Finding User by phone  ' + error);
			callBack({
				found: false
			});
		}
	});
}

function verifyPhone(e) {
	e.preventDefault();
	var code = $('#verifyPhone-code').val();
	// all verification codes are 5 or 6 numbers
	if (code.length < 5) {
		mobileNotify("Invalid verification code, please try again");
		return;
	}

	Parse.Cloud.run('verifyPhoneNumber', {
		code: code
	}, {
		success: function(result) {
			if (result.verified) {
				mobileNotify("Your phone number is verified.  Thank You!");
				$("#modalview-verifyPhone").data("kendoMobileModalView").close();
				var thisUser = userModel.currentUser;
				appDataChannel.userValidatedMessage(thisUser.userUUID, thisUser.phone, thisUser.email, thisUser.publicKey);
			} else {
				mobileNotify("Sorry, your verification number: ' + result.recieved + ' didn't match. ");
			}

		},
		error: function(result, error) {
			mobileNotify('Error verifying phone ' + error);
		}
	});

}

//Remove all formatting from  phone number and add 1 for 10 digit US numbers.
function unformatPhoneNumber(phone) {
	if (phone === null && phone === undefined)
		return ('');

	var newPhone = phone.replace(/[\-+xX\(\)]/g, '');
	newPhone = newPhone.replace(/\s/g, '');
	if (newPhone.length === 10) {
		newPhone = '1' + newPhone;
	}
	return (newPhone);
}

function isValidMobileNumber(phone, callback) {
	Parse.Cloud.run('validateMobileNumber', {
		phone: phone
	}, {
		success: function(result) {
			if (result.status !== 'ok' || result.result.carrier.type !== 'mobile') {
				callback({
					status: 'ok',
					valid: false,
					result: result.result
				});
			} else {
				callback({
					status: 'ok',
					valid: true,
					result: result.result
				});
			}
		},
		error: function(error) {
			mobileNotify("Error checking phone number" + error);
			callback({
				status: 'error',
				valid: false,
				error: error
			});
		}
	});
}

function reverseGeoCode(lat, lng) {
	var latlng = new google.maps.LatLng(lat, lng);
	APP.map.geocoder.geocode({
		'latLng': latlng
	}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			if (results.length > 0) {
				APP.map.currentAddress = results[0].formatted_address;
			} else {
				mobileNotify('No results found for location');
			}
		} else {
			mobileNotify('Geocoder failed with: ' + status);
		}
	});

}

// utility to class to get time in normal and pubnub formats and convert between
var ggTime = {

	_day : 60 * 60 * 24 * 1000,
	_week: 60 * 60 * 24 * 7 * 1000,
	_month: 60 * 60 * 24 * 30 * 1000,

	currentTime: function () {
		return(new Date().getTime());
	},
	currentTimeInSeconds : function () {
		return(new Date().getTime() / 1000);
	},

	currentPubNubTime: function () {
		return(new Date().getTime() * 10000);
	},

	toPubNubTime: function (timeIn) {
		return (timeIn * 10000);
	},

	fromPubNubTime : function (timeIn) {
		return (timeIn / 10000);
	},

	lastDay : function () {
		return(ggTime.currentTime() - ggTime._day);

	},

	lastWeek : function () {
		return(ggTime.currentTime() - ggTime._week);
	},

	lastMonth : function () {
		return(ggTime.currentTime() - ggTime._month);
	}
};

function _preventDefault(e) {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}
}

function timeSince(date) {
	var seconds = Math.floor((ggTime.currentTime() - date)/1000),
		interval = Math.floor(seconds / 31536000);

	if (interval > 1) return interval + "yr";

	interval = Math.floor(seconds / 2592000);
	if (interval > 1) return interval + "mth";

	interval = Math.floor(seconds / 86400);
	if (interval >= 1) return interval + "d";

	interval = Math.floor(seconds / 3600);
	if (interval >= 1) return interval + "hr";

	interval = Math.floor(seconds / 60);
	if (interval >= 1) return interval + "m";

	return Math.floor(seconds) + "s";
}


// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	if (immediate === undefined)
		immediate = false;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate)
				func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow)
			func.apply(context, args);
	};
};

var _emailDomainList = [
	/* Default domains included */
	"aol.com", "att.net", "comcast.net", "facebook.com", "gmail.com", "gmx.com", "googlemail.com",
	"google.com", "hotmail.com", "hotmail.co.uk", "mac.com", "me.com", "mail.com", "msn.com",
	"live.com", "sbcglobal.net", "verizon.net", "yahoo.com", "yahoo.co.uk",

	/* Other global domains */
	"email.com", "games.com" /* AOL */ , "gmx.net", "hush.com", "hushmail.com", "inbox.com",
	"lavabit.com", "love.com" /* AOL */ , "pobox.com", "rocketmail.com" /* Yahoo */ ,
	"safe-mail.net", "wow.com" /* AOL */ , "ygm.com" /* AOL */ , "ymail.com" /* Yahoo */ , "zoho.com", "fastmail.fm",

	/* United States ISP domains */
	"bellsouth.net", "charter.net", "cox.net", "earthlink.net", "juno.com",

	/* British ISP domains */
	"btinternet.com", "virginmedia.com", "blueyonder.co.uk", "freeserve.co.uk", "live.co.uk",
	"ntlworld.com", "o2.co.uk", "orange.net", "sky.com", "talktalk.co.uk", "tiscali.co.uk",
	"virgin.net", "wanadoo.co.uk", "bt.com",

	/* Domains used in Asia */
	"sina.com", "qq.com", "naver.com", "hanmail.net", "daum.net", "nate.com", "yahoo.co.jp", "yahoo.co.kr", "yahoo.co.id", "yahoo.co.in", "yahoo.com.sg", "yahoo.com.ph",

	/* French ISP domains */
	"hotmail.fr", "live.fr", "laposte.net", "yahoo.fr", "wanadoo.fr", "orange.fr", "gmx.fr", "sfr.fr", "neuf.fr", "free.fr",

	/* German ISP domains */
	"gmx.de", "hotmail.de", "live.de", "online.de", "t-online.de" /* T-Mobile */ , "web.de", "yahoo.de",

	/* Russian ISP domains */
	"mail.ru", "rambler.ru", "yandex.ru", "ya.ru", "list.ru",

	/* Belgian ISP domains */
	"hotmail.be", "live.be", "skynet.be", "voo.be", "tvcablenet.be", "telenet.be",

	/* Argentinian ISP domains */
	"hotmail.com.ar", "live.com.ar", "yahoo.com.ar", "fibertel.com.ar", "speedy.com.ar", "arnet.com.ar",

	/* Domains used in Mexico */
	"hotmail.com", "gmail.com", "yahoo.com.mx", "live.com.mx", "yahoo.com", "hotmail.es", "live.com", "hotmail.com.mx", "prodigy.net.mx", "msn.com"
];

var utils = {
	/**
	 * Replaces all text numbers in a string with numerical numbers
	 * Adapted from http://stackoverflow.com/questions/11980087/javascript-words-to-numbers
	 * @param  {String} string
	 * @return {String}
	 */
	replaceTextWithNumbers: function(string) {
		var smalls = {
			zero: 0,
			one: 1,
			two: 2,
			three: 3,
			four: 4,
			five: 5,
			six: 6,
			seven: 7,
			eight: 8,
			nine: 9,
			ten: 10,
			eleven: 11,
			twelve: 12,
			thirteen: 13,
			fourteen: 14,
			fifteen: 15,
			sixteen: 16,
			seventeen: 17,
			eighteen: 18,
			nineteen: 19,
			twenty: 20,
			thirty: 30,
			forty: 40,
			fifty: 50,
			sixty: 60,
			seventy: 70,
			eighty: 80,
			ninety: 90
		};

		var magnitudes = {
			thousand: 1000
		}
		var returnString = string;
		var words = string.split(/[\s-]+/i);
		var smallTotal = 0;
		var magnitudeTotal = 0;
		var foundNumberWords = [];
		words.forEach(function(word) {
			var small = smalls[word];
			if (small !== undefined) {
				smallTotal += small;
				foundNumberWords.push(word);
			} else if (word === 'hundred') {
				smallTotal *= 100;
				foundNumberWords.push('hundred');
			} else {
				var magnitude = magnitudes[word];
				if (magnitude !== undefined) {
					magnitudeTotal = magnitudeTotal + smallTotal * magnitude;
					smallTotal = 0;
					foundNumberWords.push(word);
				// Just reached the end of a number
				} else if (smallTotal !== 0 || magnitudeTotal !== 0) {
					var regex = new RegExp(foundNumberWords.join('[\\s-]+'), 'i');
					returnString = returnString.replace(regex, magnitudeTotal + smallTotal);
					smallTotal = 0;
					magnitudeTotal = 0;
					foundNumberWords = [];
				}
			}
		});

		if (smallTotal !== 0 || magnitudeTotal !== 0) {
			var regex = new RegExp(foundNumberWords.join('[\\s-]+'), 'i');
			returnString = returnString.replace(regex, magnitudeTotal + smallTotal);
		}

		return returnString;
	}
};