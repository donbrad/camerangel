/* global placesView, APP, userModel */

'use strict';

var homeView = {
	_radius: 30, // 30 meters or approx 100 ft

	openLocateMeModal: function () {
		$('#modalview-locate-me').data('kendoMobileModalView').open();

		navigator.geolocation.getCurrentPosition( function (position) {
			var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			var places = APP.map.googlePlaces;
			var nearbyResults = new kendo.data.DataSource();

			var userPlaces = placesView.matchLocationToUserPlace(position.coords.latitude, position.coords.longitude);

			userPlaces.forEach( function (userPlace ) {
				nearbyResults.add(userPlace);
			});

			places.nearbySearch({
				location: latlng,
				radius: homeView._radius,
				types: ['establishment']
			}, function (placesResults, placesStatus) {
				if (placesStatus === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
					APP.map.geocoder.geocode({ 'latLng': latlng }, function (geoResults, geoStatus) {
						if (geoStatus !== google.maps.GeocoderStatus.OK) {
							mobileNotify('Something went wrong with the Google geocoding service.');
							return;
						}
						if (geoResults.length === 0 || geoResults[0].types[0] !== 'street_address') {
							mobileNotify('We couldn\'t match your position to a street address.');
							return;
						}

						var address = placesView.getAddressFromComponents(geoResults[0].address_components);

						var newAdd = nearbyResults.add({
							uuid: uuid.v4(),
							category: 'Street Address',   // valid categories are: Place and Location
							placeId: '',
							name: address.streetNumber+' '+address.street,
							venueName: '',
							streetNumber: address.streetNumber,
							street: address.street,
							city: address.city,
							state: address.state,
							zip: address.zip,
							country: address.country,
							googleId: '',
							factualId: '',
							lat: position.coords.latitude,
							lng: position.coords.longitude,
							publicName: '',
							alias: '',
							isVisible: true,
							isPrivate: true,
							autoCheckIn: false,
							vicinity: address.city+', '+address.state
						});
					});
				} else if (placesStatus !== google.maps.places.PlacesServiceStatus.OK) {
					mobileNotify('Something went wrong with the Google Places service. '+placesStatus);
					return;
				}

				placesResults.forEach( function (placeResult) {
					var alreadyAUserPlace = false;
					userPlaces.forEach( function (userPlace) {
						if (userPlace.googleId === placeResult.place_id) {
							alreadyAUserPlace = true;
							return;
						}
					});

					nearbyResults.add({
						uuid: '',
						category: 'Street Address',   // valid categories are: Place and Location
						placeId: '',
						name: placeResult.name,
						venueName: placeResult.name,
						streetNumber: '',
						street: '',
						city: '',
						state: '',
						zip: '',
						country: '',
						googleId: placeResult.place_id,
						factualId: '',
						lat: placeResult.geometry.location.G,
						lng: placeResult.geometry.location.K,
						publicName: '',
						alias: '',
						isVisible: true,
						isPrivate: true,
						autoCheckIn: false,
						vicinity: placeResult.vicinity
					});

					if (alreadyAUserPlace === false) {
						nearbyResults.add(placeResult);
					}
				});

				$('#nearby-results-list').data('kendoMobileListView').setDataSource(nearbyResults);

				// Show modal letting user select current place
			});
		});
	},

	closeLocateMeModal: function () {
		$('#modalview-locate-me').data('kendoMobileModalView').close();
	},

	onShowProfileStatus: function(e){

		if (e !== undefined && e.preventDefault !== undefined) {
			e.preventDefault();
		}

		var alias = userModel.currentUser.alias;
		var verified = userModel.currentUser.phoneVerified;
		var name = userModel.currentUser.name;
		
		var status = userModel.currentUser.statusMessage;
		var available = userModel.currentUser.isAvailable;
		var location = userModel.currentUser.currentPlace;
		
		ux.formatNameAlias(name, alias, "#modalview-profileStatus");

		// Set profile status
		$("#profileStatusMessage").text(status);
		
		// Set verified
		if(verified){
			$("#profileStatusVerified").removeClass("hidden");
		}
		// Set available
		if(available){
			$(".userAvailable").attr("src", "images/status-available.svg");
			$(".userAvailableRev").attr("src", "images/status-away.svg");
			$("#currentAvailableTxt").text("busy");

		} else {
			$(".userAvailable").attr("src", "images/status-away.svg");
			$(".userAvailableRev").attr("src", "images/status-available.svg");
			$("#currentAvailableTxt").text("available");
		}

		// set location
		if(location !== undefined){
			$("#profileLocation").removeClass("hidden");
			// todo - wire location
		}

		// set status charcter count 
		statusCharCount();

		
	},

	checkInToPlace: function (e) {
		var item = e.item.children('div').first().data('item');

		var finishCheckingIn = function (item) {
			$('#checked-in-place > span').html(item.name);
			$('#checked-in-place').show(200);
			$('#modalview-locate-me').data('kendoMobileModalView').close();

			APP.models.places.placesDS.add(item);

			userModel.currentUser.set('currentPlace', item.name);
			userModel.currentUser.set('currentPlaceUUID', item.uuid);
		};

		// If the item has a uuid it means we've already added it,
		// or it's a street address so we don't have to find the
		// address.
		if (item.uuid !== '') {
			finishCheckingIn(item);
			return;
		}

		var latlng = new google.maps.LatLng(item.lat, item.lng);

		// Otherwise it's a new place from Google so we find the address
		APP.map.geocoder.geocode({ 'latLng': latlng }, function (geoResults, geoStatus) {
			if (geoStatus !== google.maps.GeocoderStatus.OK) {
				navigator.notification.alert('Something went wrong with the Google geocoding service.');
				return;
			}
			if (geoResults.length === 0 || geoResults[0].types[0] !== 'street_address') {
				navigator.notification.alert('We couldn\'t match your position to a street address.');
				return;
			}

			var address = placesView.getAddressFromComponents(geoResults[0].address_components);
		});
	},

	checkOutOfPlace: function () {
		$('#checked-in-place').hide(200);

		userModel.currentUser.set('currentPlace', '');
		userModel.currentUser.set('currentPlaceUUID', '');
	},

	savePhoto: function(){
		mobileNotify("Added tags");
		ux.closeModalViewPhotoTag();
	},

	onInitHome: function(e) {
		_preventDefault(e);


		if (userModel.currentUser.currentPlace !== '') {
			$('#checked-in-place > span').html(userModel.currentUser.currentPlace);
			$('#checked-in-place').show();
		}

		 $('#homeSearchQuery').clearSearch({
	        callback: function() {
	        	// todo - wire search
	        }
	    });
	},

	closeStatusModal: function(){
		$("#modalview-profileStatus").data("kendoMobileModalView").close();
	},

	changeAvailable: function(){
		var currentAvailable = userModel.currentUser.get('isAvailable');
		
		if(currentAvailable){
			$(".userAvailableRev").attr("src", "images/status-available.svg");
			$("#currentAvailableTxt").text("available");
		} else {
			$(".userAvailableRev").attr("src", "images/status-away.svg");
			$("#currentAvailableTxt").text("busy");
		}
		ux.toggleIsAvailable();
	},

	closeModalViewProfileStatus: function(e){
		_preventDefault(e);

		$("#modalview-profileStatus").data("kendoMobileModalView").close();
		$(".userLocationUpdate").css("display", "none");
		var updatedStatus = $("#profileStatusUpdate").val();
		
		if(updatedStatus !== ""){
			// Save new status
			userModel.currentUser.set("statusMessage", updatedStatus);
		}
		// clear status box
		$("#profileStatusUpdate").val("");
	}
};

function homeBeforeShow () {

    if (userModel.currentUser) {
        // Have current user - redirect to user view
        APP.kendo.navigate('#home');

    } else {
        // No current user -redirect to no user view
       APP.kendo.navigate('#newuserhome');
    }
} 

function dismissNotification (e) {
	e.preventDefault();
	var uuid = e.sender.element[0].attributes['data-param'].value;
	
	var data = deviceModel.state.userNotifications;
	for(var i = 0; i < data.length; i++) {
		if(data[i].uuid == uuid) {
			data.splice(i, 1);
			break;
		}
	}
	
	deviceModel.setAppState('userNotifications', JSON.stringify(data));
	notificationModel.deleteNotification(uuid);
	
}



function onBeforeOpenPhoto() {
	$('#photoImage').attr('src', photoModel.currentPhoto.src);
}

function pruneNotifications() {
	if 	( deviceModel.state.phoneVerified) {
		notificationModel.deleteNotification('verifyphone');
	}

}

function initSignUp() {
	// Simple phone mask - http://jsfiddle.net/mykisscool/VpNMA/
	$('#home-signup-phone')

	.keydown(function (e) {
		var key = e.charCode || e.keyCode || 0;
		var $phone = $(this);

		// Auto-format- do not expose the mask as the user begins to type
		if (key !== 8 && key !== 9) {
			if ($phone.val().length === 4) {
				$phone.val($phone.val() + ')');
			}
			if ($phone.val().length === 5) {
				$phone.val($phone.val() + ' ');
			}			
			if ($phone.val().length === 9) {
				$phone.val($phone.val() + '-');
			}
		}

		// Allow numeric (and tab, backspace, delete) keys only
		return (key == 8 || 
				key == 9 ||
				key == 46 ||
				(key >= 48 && key <= 57) ||
				(key >= 96 && key <= 105));	
	})
	.keyup(function(e){
		if ($(this).val().length === 14) {
				continueSignUp();
			$('#home-signup-phone').unbind("keyup")
			}
	})
	
	.bind('focus click', function () {
		var $phone = $(this);
		
		if ($phone.val().length === 0) {
			$phone.val('(');
		}
		else {
			var val = $phone.val();
			$phone.val('').val(val); // Ensure cursor remains at the end
		}
	})
	
	.blur(function () {
		var $phone = $(this);
		
		if ($phone.val() === '(') {
			$phone.val('');
		}
	});
	

	$("#create-user-email, #create-user-name, #create-user-alias, #create-user-password").css("display", "none");


}

function continueSignUp() {

	$("#create-user-email, #create-user-name, #create-user-alias, #create-user-password").velocity("slideDown", { delay: 500, duration: 300 }, [ 250, 15 ]);
	// ToDo - Add step form validation

}

function onShowSignIn(e){
	e.preventDefault();

	$("#home-signin-password").on("keyup", function(e){
		if (e.keyCode === 13) {
			signInValidate(e);
		}
	});
}

function onShowHome(e) {
	_preventDefault(e);

	// set search bar
    ux.scrollUpSearch(e);

    // set verified ui for start screen 
    if(userModel.currentUser.phoneVerified) {
    	$("#startPhoneVerified").addClass("hidden");
    }
    
    // Set user availibility 
    ux.updateHeaderStatusImages();
        
    APP.models.presence.current.bind('change' , syncPresence);

    // Hide action button on home
    ux.showActionBtn(false, "#home");
}

function setUserStatusUI(e){
	if (e !== undefined && e.preventDefault !== undefined)
		e.preventDefault();

	//Set available
	var currentAvailable = userModel.currentUser.isAvailable;
    if (currentAvailable) {
    	$(".userStatus-icon").attr("src","images/status-available.svg");
    } else {
    	$(".userStatus-icon").attr("src","images/status-away.svg");
    }

    //set private photo
    var privatePhoto = userModel.currentUser.photo;
    var publicPhoto = userModel.currentUser.aliasPhoto;

    if(privatePhoto !== ""){
    	$(".userStatus-photo").attr("src", privatePhoto);
    } else {
    	$(".userStatus-photo").attr("src", publicPhoto);
    }
}

function testingStatus(e) {
	
}

function _signOut() {
	Parse.User.logOut();
	userModel.parseUser = null;
	userModel.currentUser.unbind('change', userModel.sync);
	userModel.currentUser.set('username', null);
	userModel.currentUser.set('email', null);
	userModel.currentUser.set('phone',null);
	userModel.currentUser.set('alias', null);
	userModel.currentUser.set('userUUID', null);
	userModel.currentUser.set('rememberUsername', false);
	userModel.currentUser.set('phoneVerified', false);
	userModel.currentUser.set('emailVerified', false);
	userModel.parseACL = '';
	deviceModel.resetDeviceState();
}


function homeSignout (e) {
	_preventDefault(e);

	_signOut();

    APP.kendo.navigate('#newuserhome');
}

function doInitSignIn () {
	if (useModel.rememberUsername && userModel.username !== '') {
		$('#home-signin-username').val(userModel.username)
	}
}

// sign in validator 
function signInValidate(e){
    e.preventDefault();
    var form = $("#formSignIn").kendoValidator().data("kendoValidator");

    if (form.validate()) {
        // If the form is valid, run sign in
        homeSignin();
    } 
}
	
function homeSignin (e) {
	if (e !== undefined && e.preventDefault !== undefined)
		e.preventDefault();
	
	// hide keyboard
	ux.hideKeyboard();
   	
   	var username = $('#home-signin-username').val(), password = $('#home-signin-password').val()

    mobileNotify("Signing you in to ghostgrams....");


   	Parse.User.logIn(username,password , {
        success: function(user) {
        // Do stuff after successful login.
            ux.closeModalViewLogin();
            // Clear sign in form
            $("#home-signin-username, #home-signin-password").val("");
            userModel.parseUser = user;
			
			
			var publicKey = user.get('publicKey');
			var privateKey = user.get('privateKey');
			if (publicKey === undefined || privateKey === undefined) {
				userModel.generateNewPrivateKey(user);
			} else {
				userModel.updatePrivateKey();
			}
			   
            userModel.currentUser.set('username', userModel.parseUser.get('username'));
			userModel.currentUser.set('name', userModel.parseUser.get('name'));
            userModel.currentUser.set('email', userModel.parseUser.get('email'));
            userModel.currentUser.set('phone', userModel.parseUser.get('phone'));
            userModel.currentUser.set('alias', userModel.parseUser.get('alias'));
            userModel.currentUser.set('aliasPhoto', userModel.parseUser.get('aliasPhoto'));
			userModel.currentUser.set('statusMessage', userModel.parseUser.get('statusMessage'));
			userModel.currentUser.set('isAvailable', userModel.parseUser.get('isAvailable'))
			userModel.currentUser.set('isCheckedIn', userModel.parseUser.get('isCheckedIn'));
			userModel.currentUser.set('isVisible', userModel.parseUser.get('isVisible'));
			userModel.currentUser.set('isRetina', userModel.parseUser.get('isRetina'));
			userModel.currentUser.set('isWIFIOnly', userModel.parseUser.get('isWIFIOnly'));
			userModel.currentUser.set('isPhotoStored', userModel.parseUser.get('isPhotoStored'));
			userModel.currentUser.set('saveToPhotoAlbum', userModel.parseUser.get('saveToPhotoAlbum'));
			userModel.currentUser.set('currentPlace', userModel.parseUser.get('currentPlace'));
			userModel.currentUser.set('currentPlaceUUID', userModel.parseUser.get('currentPlaceUUID'));
			userModel.currentUser.set('photo', userModel.parseUser.get('photo'));
			userModel.currentUser.set('aliasPublic', userModel.parseUser.get('aliasPublic'));
            userModel.currentUser.set('userUUID', userModel.parseUser.get('userUUID'));
			userModel.currentUser.set('useIdenticon', userModel.parseUser.get('useIdenticon'));
			userModel.currentUser.set('rememberUsername', userModel.parseUser.get('rememberUsername'));
			userModel.currentUser.set('publicKey', publicKey);
			userModel.decryptPrivateKey();
	//		userModel.currentUser.set('privateKey', privateKey);
			userModel.createIdenticon(userModel.parseUser.get('userUUID'));
			var phoneVerified = userModel.parseUser.get('phoneVerified');
            userModel.currentUser.set('phoneVerified', phoneVerified);
			userModel.currentUser.set('availImgUrl', 'images/status-away.svg');
			var isAvailable  = userModel.currentUser.get('isAvailable');
			if (isAvailable) {
				userModel.currentUser.set('availImgUrl', 'images/status-available.svg');
			}

            if (phoneVerified) {
				deviceModel.setAppState('phoneVerified', true);
				notificationModel.deleteNotification('phoneVerified');
			} else {
				  mobileNotify("Please verify your phone number");
                 $("#modalview-verifyPhone").data("kendoMobileModalView").open();
			}
            userModel.currentUser.set('emailValidated', userModel.parseUser.get('emailVerified'));
            userModel.parseACL = new Parse.ACL(userModel.parseUser);
            userModel.currentUser.bind('change', userModel.sync);
            userModel.fetchParseData();

            APP.kendo.navigate('#home');
        },
        error: function(user, error) {
        // The login failed. Check error to see why.
             mobileNotify("Error: " + error.code + " " + error.message);
        }
    });
}



function closeModalViewVerifyPhone() {
	$("#modalview-verifyPhone").data("kendoMobileModalView").close();
}

function sendVerificationCode ()
{
  var phone = userModel.currentUser.get('phone');
   Parse.Cloud.run('sendPhoneVerificationCode', { phoneNumber:  phone}, {
		success: function(result) {
			mobileNotify('Your phone verification was sent');
			$("#modalview-verifyPhone").data("kendoMobileModalView").open();
		},
		error: function (result,error){
			mobileNotify("Error sending phone verification " + error);
		}
  });
}

function validateCreateAccount(e) {
    e.preventDefault();
    var form = $("#formCreateAccount").kendoValidator().data("kendoValidator");
    
    if (form.validate()) {
        homeCreateAccount();
    } 
}

function homeCreateAccount() {
    
    var user = new Parse.User();
    var username = $('#home-signup-username').val();
	var name = $('#home-signup-fullname').val();
    var password = $('#home-signup-password').val();
    var phone = $('#home-signup-phone').val();
    var alias = $('#home-signup-alias').val();

    var userUUID = uuid.v4();

    // clean up the phone number and ensure it's prefixed with 1
   // phone = phone.replace(/\+[0-9]{1-2}/,'');
    phone = unformatPhoneNumber(phone);
	
	Parse.Cloud.run('validateMobileNumber', { phone: phone }, {
      success: function(result) {
    		if (result.status !== 'ok' || result.result.carrier.type !== 'mobile') {
               mobileNotify("This phone number is not a valid mobile number.");
               return;
           } else {
    			Parse.Cloud.run('preflightPhone', { phone: phone }, {
				  success: function(result) {
					   if (result.status !== 'ok' || result.count !== 0) {
						   mobileNotify("Your phone number matches existing user.");
						   return;
					   } else {

					 //Phone number isn't a duplicate -- create user
					user.set("username", username);
					user.set("password", password);
					user.set("email", username);
					user.set("name", name);
					user.set("phone", phone);
					user.set("alias", alias);
					user.set("aliasPublic", "ghostgram user");
					user.set("currentPlace", "");
				    user.set("currentPlaceUUID", "");
				    user.set('photo', null);
				    user.set('aliasPhoto', null);
					user.set("isAvailable", true);	   
					user.set("isVisible", true);
				    user.set("isCheckedIn", false);
				    user.set("availImgUrl", "images/status-available.svg");
					user.set("phoneVerified", false);
				    user.set("useIdenticon", true);
					user.set("rememberUsername", false);
					user.set("userUUID", userUUID);
					//user.set("publicKey", publicKey);
					//user.set("privateKey", privateKey);

					user.signUp(null, {
						success: function(user) {
							// Hooray! Let them use the app now.
							userModel.currentUser.set('username', user.get('username'));
							userModel.currentUser.set('name', user.get('name'));
							userModel.currentUser.set('email', user.get('email'));
							userModel.currentUser.set('phone', user.get('phone'));
							userModel.currentUser.set('alias', user.get('alias'));
							userModel.currentUser.set('currentPlace', user.get('currentPlace'));
							userModel.currentUser.set('currentPlaceUUID', user.get('currentPlaceUUID'));
							userModel.currentUser.set('photo', user.get('photo'));
							userModel.currentUser.set('isAvailable', user.get('isAvailable'));
							userModel.currentUser.set('isVisible', user.get('isVisible'));
							userModel.currentUser.set('isRetina', user.get('isRetina'));
							userModel.currentUser.set('isWIFIOnly', user.get('isWIFIOnly'));
							userModel.currentUser.set('isPhotoStored', user.get('isPhotoStored'));
							userModel.currentUser.set('saveToPhotoAlbum', user.get('saveToPhotoAlbum'));
							userModel.currentUser.set('aliasPhoto', user.get('aliasPhoto'));
							userModel.currentUser.set('userUUID', user.get('userUUID'));
							userModel.currentUser.set('phoneVerified', false);
							userModel.currentUser.set('useIdenticon',user.get('useIdenticon'));
							userModel.currentUser.set('emailValidated',user.get('emailVerified'));
							userModel.generateNewPrivateKey(user);

							userModel.createIdenticon(userUUID);
							//userModel.currentUser.set('publicKey',user.get('publicKey'));
							//userModel.currentUser.set('privateKey',user.get('privateKey'));
							userModel.currentUser.bind('change', userModel.sync);
							userModel.parseACL = new Parse.ACL(Parse.User.current());
						    mobileNotify('Welcome to ghostgrams!');
							if (window.navigator.simulator !== true) {

								cordova.plugins.notification.local.add({
								  id         : 'userWelcome',
								  title      : 'Welcome to ghostgrams',
								  message    : 'You have a secure connection to your family, friends and favorite places',
								  autoCancel : true,
								  date : new Date(new Date().getTime() + 120 * 1000)
								});
							}

							 Parse.Cloud.run('sendPhoneVerificationCode', { phoneNumber: phone }, {
								  success: function (result) {
									  mobileNotify('Please verify your phone');
									  $("#modalview-verifyPhone").data("kendoMobileModalView").open();
								  },
								 error: function (result, error){
									 mobileNotify('Error sending verification code ' + error);
								 }
							 });



						   APP.kendo.navigate('#home');
						},

                    error: function(user, error) {
                    // Show the error message somewhere and let the user try again.
                    	mobileNotify("Error: " + error.code + " " + error.message);
                    }
                });
            
				   }
			  },
			  error: function(error) {
				  mobileNotify("Error checking phone number" + error);
			  }
			});
		   }
	  },
		error: function(user, error) {
                    // Show the error message somewhere and let the user try again.
                    	mobileNotify("Error: " + error.code + " " + error.message);
                    }
	  });

  }

function requestBeta (e) {
    e.preventDefault();
    if (APP.models.sync.requestActive) {
        mobileNotify("Processing current request.");
        return;
    }
    APP.models.sync.requestActive = true;
    var userUUID = null, name = null, email = null, phone = null;
    mobileNotify("Preparing your beta request");
    
    if (userModel.parseUser === null) {
        mobileNotify("You must be a user to join iPhone beta");
        return;
    } else {
        userUUID = userModel.currentUser.get('userUUID');
        name = userModel.currentUser.get('name');
        email = userModel.currentUser.get('email');
        phone = userModel.currentUser.get('phone');
    }
    
    var Beta = Parse.Object.extend('betarequest');
    var beta = new Beta();
    beta.set("userUUID", userUUID);
	if (name === undefined || name === null)
		name = email;
    beta.set("name", name);
    beta.set("email",email );
    beta.set("phone", phone);
    beta.set("udid", userModel.device.udid);
    beta.set("device", userModel.device.device);
    beta.set("model", userModel.device.model);
    beta.set("platform", userModel.device.platform);
    
    beta.save(null, {
        success: function(support) {
            mobileNotify("You beta request was sent. Thank you!");
            APP.models.sync.requestActive = false;
        },
        error: function(support, error) {
            mobileNotify("Error sending your beta request: " + error);
            APP.models.sync.requestActive = false;
        }
    })
}
    

function importMe(e) {
	e.preventDefault();
	var username = $('#home-signup-fullname').val();
	if (username.length === 0) {
		mobileNotify("Please enter your name and try again");
		return;
	}
	
	findContactMe(query);
}

function findContactMe(query) {
	var options      = new ContactFindOptions();
    options.filter   = query
    options.multiple = true;
    var fields       = ["name", "displayName", "nickName" ,"phoneNumbers", "emails", "addresses", "photos"];
     
    navigator.contacts.find(fields, function(contacts){

		contactModel.deviceContactsDS.data([]);
        var contactsCount = contacts.length;
        
        for (var i=0;  i<contactsCount; i++){
            var contactItem = new Object();
            contactItem.type = "device";
            contactItem.name = contacts[i].name.formatted;
            contactItem.phoneNumbers = new Array();
            if (contacts[i].phoneNumbers !== null) {
                for (var j=0; j<contacts[i].phoneNumbers.length; j++){
                    var phone = new Object();
                    phone.name = contacts[i].phoneNumbers[j].type + " : " + contacts[i].phoneNumbers[j].value ;
                    phone.number = contacts[i].phoneNumbers[j].value;
                    contactItem.phoneNumbers.push(phone);
                }
            }
            
            contactItem.emails = new Array();
            if (contacts[i].emails !== null) {
                 for (var k=0; k<contacts[i].emails.length; k++){
                    var email = new Object();
                    email.name = contacts[i].emails[k].type + " : " + contacts[i].emails[k].value;
                    email.address = contacts[i].emails[k].value;
                    contactItem.emails.push(email);
                }
            }
            
            contactItem.addresses = new Array();
              if (contacts[i].addresses !== null) {
                 for (var a=0; a<contacts[i].addresses.length; a++){
                    var address = new Object();
                    if (contacts[i].addresses[a].type === null) {
                         address.type = 'Home';
                    } else {
                        address.type = contacts[i].addresses[a].type;
                    }
                    address.name = address.type + " : " + contacts[i].addresses[a].streetAddress + ', ' +
                        contacts[i].addresses[a].locality;
                    address.address = contacts[i].addresses[a].streetAddress;
                    address.city = contacts[i].addresses[a].locality;
                    address.state = contacts[i].addresses[a].region;
                    address.zipcode = contacts[i].addresses[a].postalcode;
                    address.fullAddress = address.address + " ," + address.city + ' , ' + address.state;
                    contactItem.addresses.push(address);
                }
            } 
            contactItem.photo = 'images/missing_profile_photo.jpg';
            if (contacts[i].photos !== null) {
				returnValidPhoto(contacts[i].photos[0].value, function(validUrl) {
                	contactItem.photo = validUrl;
					if (contactItem.phoneNumbers.length > 0)
						contactModel.deviceContactsDS.add(contactItem);
				});
            } else {
				if (contactItem.phoneNumbers.length > 0)
					contactModel.deviceContactsDS.add(contactItem);
			}
			// Only add device contacts with phone numbers
			
        }
         
    },function(error){mobileNotify(error);}, options);
}

function doUpdateStatusMessage(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}
	
	var message = $('#profileStatusMessage').val();
	
	userModel.currentUser.set('statusMessage', message);

}

function initProfilePhotoEdit(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}
	
}

function updateProfilePhototUrl(url) {
	userModel.currentUser.set("photo", url);
	saveUserProfilePhoto(url);
}

function doProfilePhotoEdit(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}

	photoModel.currentPhoto.callBack = updateProfilePhototUrl;
}

function saveProfilePhoto(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}
	
	var photoMessage = $('#profilePhotoMessage').val();
}

function onShowMainMenuDrawer(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}
	var profilePhoto = userModel.currentUser.get('photo');

	if (profilePhoto === undefined) {
		profilePhoto = 'images/ghost-default.svg';
	}

	$('#profilePhoto').attr('src', profilePhoto);
	$('#profilePhotoImage').attr('src', profilePhoto);
	
}

function homeRecoverPassword(e) {

    var emailAddress = $("#home-recoverPassword-email").val();
	Parse.User.requestPasswordReset(emailAddress, {
		success: function() {
			mobileNotify("Sent password recovery to " + emailAddress);
			ux.closeModalViewRecoverPassword();
		},
		error: function(error) {
			// Show the error message somewhere
			mobileNotify("Recover Password Error: " + error.code + " " + error.message);
		}
	});

}

function syncPresence () {

    var userId = userModel.currentUser.get('userUUID'), presence = '';
	// Todo - Update status UI (JE)
    findParseObject('presence', 'userId', userId, function (results) {
       if (results !== undefined && results.length > 0) {
           presence = results[0];
           APP.models.presence.current.unbind('change' , syncPresence);
           presence.set('isAvailable', APP.models.presence.current.get('isAvailable'));

           APP.models.presence.current.bind('change' , syncPresence);
       } else {
           var PresObject = Parse.Object.extend('presence');
           presence = new PresObject()


       }
        presence.set('isVisible', APP.models.presence.current.get('isVisible'));
        presence.set('message', APP.models.presence.current.get('message'));
        presence.set('activity', APP.models.presence.current.get('activity'));
        presence.set('activityInfo', APP.models.presence.current.get('activityInfo'));
        presence.set('location', APP.models.presence.current.get('location'));
        presence.set('locationId', APP.models.presence.current.get('locationId'));

        presence.save(null, {
            success: function (model) {

            },
            error: function (error) {
                handleParseError(error);
            }
        });
    });
}

function onGalleryPickerInit(e) {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}
	var galleryOptions = [
		{name: "Today", value: 0, group: "Date"},
		{name: "Yesterday", value: -1, group: "Date"},
		{name: "This Week", value: -7, group: "Date"},
		{name: "Last Week", value: -14, group: "Date"},
		{name: "This Month", value: -30, group: "Date"},
		{name: "Last Month", value: -60, group: "Date"}
	];

	$("#galleryPickerSearch").kendoMultiSelect({
		dataTextField: "name",
		dataValueField: "value",
		height: 320,
		dataSource: {
			data: galleryOptions
		},
		select: function(e) {
			var view = this.dataSource.view(), index = e.item.index();
			var dataItem = view[index];
			// Use the selected item or its text
		}
	});


}

function galleryPickerClick(e) {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}

	var imageUrl = e.dataItem.imageUrl;

	photoModel.currentPhoto.callBack(imageUrl);
}

function modalGalleryZoomIn (e)  {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();	
	}

	$("#galleryPicker-listview li").css("width","50%");
	$("#galleryPicker-listview li").css("padding-bottom","50%");
	//$("#galleryPicker-listview").data("kendoMobileListView").refresh();

}

function modalGalleryZoomOut (e)  {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}

	$("#galleryPicker-listview li").css("width","33%");
	$("#galleryPicker-listview li").css("padding-bottom","33%");
	//$("#galleryPicker-listview").data("kendoMobileListView").refresh();

}

function modalGallerySortAsc (e)  {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}
}

function modalGallerySortDesc (e)  {
	if (e !== undefined && e.preventDefault !== undefined) {
		e.preventDefault();
	}
}

function go2Archive(e){
	e.preventDefault;
	APP.kendo.navigate("views/archive.html");
}
function go2Settings(e){
	e.preventDefault;
	APP.kendo.navigate("views/settings.html");
}
function go2Profile(e){
	e.preventDefault;
	APP.kendo.navigate("views/profile.html");
}

function go2Support(e){
	e.preventDefault;
	$("#settingsAction").data("kendoMobileActionSheet").close();
	$("#modalview-support").data("kendoMobileModalView").open();
}

function gpsLocateUpdate(){
	
}

function statusCharCount(e) {
	// set max length
	var maxLength = 40;
	var updateAreaMax = $("#profileStatusUpdate").attr("maxlength", maxLength);
	var currentLength;
	
	// set current status count 
	$(".statusCharCount").text(maxLength);
	$("#profileStatusUpdate").keyup(function(e){
		var length = $(this).val().length;

		currentLength = maxLength - length;
		$(".statusCharCount").text(currentLength);

		if(currentLength < 8){
		$(".statusCharacterCount").css("color", "#EF5350");
		} else {
			$(".statusCharacterCount").css("color", "");
		}	
	});


	

}

function dialogClose(e){
	$("#modal-OptionDialog").data("kendoMobileModalView").close();
}

function gpsLocateUpdate(){
	// Todo - Auto locate first if enabled, then manual input show
	$(".userLocationUpdate").velocity("slideDown");

}

