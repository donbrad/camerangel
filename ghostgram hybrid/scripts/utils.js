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
        results[0].set(newField, newFieldValue);
        results[0].save({
          success: function(myObject) {
            // The object was deleted from the Parse Cloud.
          },
          error: function(myObject, error) {
             mobileNotify("Error: " + error.code + " " + error.message);
          }
        });
        
      },
      error: function(error) {
        mobileNotify("Error: " + error.code + " " + error.message);
      }
    });
}

function findParseObject(objectName, field, fieldValue, callback) {
    var parseObject = Parse.Object.extend(objectName);
    var query = new Parse.Query(parseObject);

    query.equalTo(field, fieldValue);

    query.find({
        success: function (results) {
            callback(results);
        },
        error: function (error) {
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
        results[0].destroy({
          success: function(myObject) {
            // The object was deleted from the Parse Cloud.
          },
          error: function(myObject, error) {
            // The delete failed.
            // error is a Parse.Error with an error code and message.
              mobileNotify("Error: " + error.code + " " + error.message);
          }
        });
        
      },
      error: function(error) {
        mobileNotify("Error: " + error.code + " " + error.message);
      }
    });
}

function getNetworkState() {
    var networkState = navigator.connection.type;
    switch (networkState) {
        case Connection.ETHERNET:
        case Connection.WIFI:
            APP.setAppState('connection', "internet");
            mobileNotify("Online via Wifi");
            break;
        case Connection.CELL:
        case Connection.CELL_2G:
        case Connection.CELL_3G:
        case Connection.CELL_4G:
            APP.setAppState('connection', "cell");
            mobileNotify("Online via Cell");
            break;
    }
}
function handleParseError(err) {
  switch (err.code) {
    case Parse.Error.INVALID_SESSION_TOKEN:
      Parse.User.logOut();
        APP.models.profile.currentUser = '';
        APP.models.profile.username =  '';
        APP.models.profile.email =  '';
        APP.models.profile.phone =  '';
        APP.models.profile.alias =  '';
        APP.models.profile.userUUID = '';
        APP.kendo.navigate('#newuserhome');
      break;
  }
}


function getBase64FromImageUrl(URL, callback) {
    var img = new Image();
    img.src = URL;
    img.onload = function () {
		var canvas = document.createElement("canvas");
		canvas.width =this.width;
		canvas.height =this.height;

		var ctx = canvas.getContext("2d");
		ctx.drawImage(this, 0, 0);
		var dataURL = canvas.toDataURL("image/png");
		callback(dataURL.replace(/^data:image\/(png|jpg);base64,/, ""));
    }
	
	img.onerror = function () {
		callback(null);
	}
}

function mobileNotify(message) {
    if (window.navigator.simulator === true){
    //running in the simulator
        alert(message);
    }
    else{
    //running on a device
        window.plugins.toast.showShortTop(message);
    }
 
}

function getUserPublicKey (uuid, callBack) {
	Parse.Cloud.run('getUserPublicKey', { uuid: uuid }, 
    {
        success: function(result, error) {
          if (result.status === 'ok') {
             	callBack({found: true, publicKey: result.publicKey});
          } else {
              callBack({found: false, publicKey: null});
          }
         
        },
        error: function (result, error){
           callBack(null, error)
        }
    });
}

function findUserByEmail (email, callBack) {
	 Parse.Cloud.run('findUserByEmail', { email: email }, 
    {
        success: function(result) {
          	if (result.status === 'ok') {
				callBack({found: true, user: result.user.attributes});
			} else {
				callBack({found: false});
			}
         
        },
        error: function (result, error){
            mobileNotify('Error Finding User by email  ' + error);
			callBack({found: false});
        }
    });
}

function findUserByPhone (phone, callBack) {
	 Parse.Cloud.run('findUserByPhone', { phone: phone }, 
    {
        success: function(result) {
          	if (result.status === 'ok') {
				callBack({found: true, user: result.user.attributes});
			} else {
				callBack({found: false});
			}
         
        },
        error: function (result,error){
            mobileNotify('Error Finding User by email  ' + error);
			callBack({found: false});
        }
    });
}

function verifyPhone(e){
    e.preventDefault();
    var code = $('#verifyPhone-code').val();
    // all verification codes are 5 or 6 numbers
    if (code.length < 5) {
       mobileNotify("Invalid verification code, please try again");
        return;
    }
    
    Parse.Cloud.run('verifyPhoneNumber', { code: code }, 
    {
        success: function(result) {
          if (result.verified) {
               mobileNotify("Your phone number is verified.  Thank You!");
               $("#modalview-verifyPhone").data("kendoMobileModalView").close();
			  var thisUser = APP.models.profile.currentUser;
			  appUserValdated(thisUser.userUUID, thisUser.phone, thisUser.email, thisUser.publicKey );
          } else {
               mobileNotify("Sorry, your verification number: ' + result.recieved + ' didn't match. ");
          }
         
        },
        error: function (result,error){
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
        newPhone = '1'+newPhone;
    }
    return(newPhone);
}

function isValidMobileNumber (phone, callback) {
    Parse.Cloud.run('validateMobileNumber', {phone: phone}, {
        success: function (result) {
            if (result.status !== 'ok' || result.result.carrier.type !== 'mobile') {
                callback({status: 'ok', valid: false, result: result.result});
            } else {
                callback({status: 'ok', valid: true , result: result.result});
            }
        },
        error: function(error) {
            mobileNotify("Error checking phone number" + error);
            callback({status: 'error', valid: false,  error: error});
        }
    });
}

function reverseGeoCode(lat,lng) {
    var latlng = new google.maps.LatLng(lat, lng);
    APP.map.geocoder.geocode({'latLng': latlng}, function(results, status) {
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


var _emailDomainList = [
    /* Default domains included */
    "aol.com", "att.net", "comcast.net", "facebook.com", "gmail.com", "gmx.com", "googlemail.com",
    "google.com", "hotmail.com", "hotmail.co.uk", "mac.com", "me.com", "mail.com", "msn.com",
    "live.com", "sbcglobal.net", "verizon.net", "yahoo.com", "yahoo.co.uk",

    /* Other global domains */
    "email.com", "games.com" /* AOL */, "gmx.net", "hush.com", "hushmail.com", "inbox.com",
    "lavabit.com", "love.com" /* AOL */, "pobox.com", "rocketmail.com" /* Yahoo */,
    "safe-mail.net", "wow.com" /* AOL */, "ygm.com" /* AOL */, "ymail.com" /* Yahoo */, "zoho.com", "fastmail.fm",

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
    "gmx.de", "hotmail.de", "live.de", "online.de", "t-online.de" /* T-Mobile */, "web.de", "yahoo.de",

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
    replaceTextWithNumbers: function (string) {
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
        words.forEach( function (word) {
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
}