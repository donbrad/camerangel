function homeBeforeShow () {

    if (APP.models.profile.currentUser) {
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
	
	var data = APP.state.userNotifications;
	for(var i = 0; i < data.length; i++) {
		if(data[i].uuid == uuid) {
			data.splice(i, 1);
			break;
		}
	}
	
	APP.setAppState('userNotifications', JSON.stringify(data));
	deleteNotificationModel(uuid);
	
}

function findNotificationModel(uuid) {
	 var dataSource = APP.models.home.notificationDS;
    dataSource.filter( { field: "uuid", operator: "eq", value: uuid });
    var view = dataSource.view();
    var contact = view[0];
	dataSource.filter([]);
	
	return(contact);
}

function deleteNotificationModel(uuid) {
	 var dataSource = APP.models.home.notificationDS;
    dataSource.filter( { field: "uuid", operator: "eq", value: uuid });
    var view = dataSource.view();
    var notification = view[0];
	dataSource.filter([]);
	// Does this notification exist?  if not, just return
	if (notification === undefined)
		return;
	var data = APP.state.userNotifications;
	for(var i = 0; i < data.length; i++) {
		if(data[i].uuid == uuid) {
			data.splice(i, 1);
			break;
		}
	}
	APP.setAppState('userNotifications', JSON.stringify(data));
	dataSource.remove(notification);
}

function onBeforeOpenPhoto() {
	$('#photoImage').attr('src', APP.models.gallery.currentPhoto.src);	
}


function savePhoto () {
	
}

function pruneNotifications() {
	if 	( APP.state.phoneVerified) {
		deleteNotificationModel('verifyphone');
	}

}

function onInitHome () {
	
}

function onShowHome(e) {
	e.preventDefault();

	$('#profileName').text(APP.models.profile.currentUser.alias);
	//TODO:  add code to update user profile image

    APP.models.presence.current.bind('change' , syncPresence);
} 

function homeSignout (e) {

    e.preventDefault();
    Parse.User.logOut();
    APP.models.profile.parseUser = null;
    APP.models.profile.currentUser.unbind('change', syncProfile);
    APP.models.profile.currentUser.set('username', null);
    APP.models.profile.currentUser.set('email', null);
    APP.models.profile.currentUser.set('phone',null);
    APP.models.profile.currentUser.set('alias', null);
    APP.models.profile.currentUser.set('userUUID', null);
	 APP.models.profile.currentUser.set('rememberUsername', false);
    APP.models.profile.currentUser.set('phoneVerified', false);
    APP.models.profile.currentUser.set('emailVerified', false);
    APP.models.profile.parseACL = '';
    APP.kendo.navigate('#newuserhome');
}

function doInitSignIn () {
	if (APP.models.profile.rememberUsername && APP.models.profile.username !== '') {
		$('#home-signin-username').val(APP.models.profile.username)
	}
	// Set profile verified status
    $("#verified-phone").removeClass("hidden");
    console.log("verified phone");
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
    

   var username = $('#home-signin-username').val(), password = $('#home-signin-password').val()

    mobileNotify("Signing you in to ghostgrams....");


   Parse.User.logIn(username,password , {
        success: function(user) {
        // Do stuff after successful login.
            closeModalViewLogin();
            // Clear sign in form
            $("#home-signin-username, #home-signin-password").val("");
            APP.models.profile.parseUser = user;
			
			
			var publicKey = user.get('publicKey');
			var privateKey = user.get('privateKey');
			if (publicKey === undefined || privateKey === undefined) {
				var RSAkey = cryptico.generateRSAKey(1024);
				publicKey = cryptico.publicKeyString(RSAkey);
				privateKey = cryptico.privateKeyString(RSAkey);
				
				user.set('privateKey', privateKey);
				user.set('publicKey', publicKey);
				
				user.save();
			}
			   
            APP.models.profile.currentUser.set('username', APP.models.profile.parseUser.get('username'));
            APP.models.profile.currentUser.set('email', APP.models.profile.parseUser.get('email'));
            APP.models.profile.currentUser.set('phone', APP.models.profile.parseUser.get('phone'));
            APP.models.profile.currentUser.set('alias', APP.models.profile.parseUser.get('alias'));
			 APP.models.profile.currentUser.set('aliasPublic', APP.models.profile.parseUser.get('aliasPublic'));
            APP.models.profile.currentUser.set('userUUID', APP.models.profile.parseUser.get('userUUID'));
			APP.models.profile.currentUser.set('rememberUsername', APP.models.profile.parseUser.get('rememberUsername'));
			APP.models.profile.currentUser.set('publicKey', publicKey);
			APP.models.profile.currentUser.set('privateKey', privateKey);
			var phoneVerified = APP.models.profile.parseUser.get('phoneVerified');
            APP.models.profile.currentUser.set('phoneVerified', phoneVerified);
			console.log(APP.models.profile.currentUser);
            if (phoneVerified) {
				APP.setAppState('phoneVerified', true);
				deleteNotificationModel('phoneVerified');
			} else {
				  mobileNotify("Please verify your phone number");
              $("#modalview-verifyPhone").data("kendoMobileModalView").open();
			}
            APP.models.profile.currentUser.set('emailVerified', APP.models.profile.parseUser.get('emailVerified'));
            APP.models.profile.parseACL = new Parse.ACL(APP.models.profile.parseUser);
            APP.models.profile.currentUser.bind('change', syncProfile);
            window.onUserSignIn();
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
  var phone = APP.models.profile.currentUser.get('phone');
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
    phone = phone.replace(/\D+/g, "");
	if (phone[0] !== '1') {
		phone = '1'+phone;
	}
    
    Parse.Cloud.run('preflightPhone', { phone: phone }, {
      success: function(result) {
           if (result.status !== 'ok' || result.count !== 0) {
               mobileNotify("Your phone number matches existing user.");
               return;
           } else {
               // Generate Keys for the user.  
			   	var RSAkey = cryptico.generateRSAKey(1024);
				var publicKey = cryptico.publicKeyString(RSAkey);
				var privateKey = cryptico.privateKeyString(RSAkey);
			   
			   
                 //Phone number isn't a duplicate -- create user
                user.set("username", username);
                user.set("password", password);
                user.set("email", username);
			    user.set("name", name);
                user.set("phone", phone);
                user.set("alias", alias);
                user.set("aliasPublic", "ghostgram user");
                user.set("profilePhoto", null)
                user.set("phoneVerified", false);
			    user.set("rememberUsername", false);
                user.set("userUUID", userUUID);
			    user.set("publicKey", publicKey);
			    user.set("privateKey", privateKey)

                user.signUp(null, {
                    success: function(user) {
                        // Hooray! Let them use the app now.
                       closeModalViewSignup();
                        APP.models.profile.currentUser.set('username', user.get('username'));
                        APP.models.profile.currentUser.set('email', user.get('email'));
                        APP.models.profile.currentUser.set('phone', user.get('phone'));
                        APP.models.profile.currentUser.set('alias', user.get('alias'));
                        APP.models.profile.currentUser.set('userUUID', user.get('userUUID'));
                        APP.models.profile.currentUser.set('phoneVerified', false);
                        APP.models.profile.currentUser.set('emailVerified',user.get('emailVerified'));
						APP.models.profile.currentUser.set('publicKey',user.get('publicKey'));
						APP.models.profile.currentUser.set('privateKey',user.get('privateKey'));
                        APP.models.profile.currentUser.bind('change', syncProfile);
                        APP.models.profile.parseACL = new Parse.ACL(Parse.User.current());
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
                                  modileNotify('Please verify your phone');
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

function requestBeta (e) {
    e.preventDefault();
    if (APP.models.sync.requestActive) {
        mobileNotify("Processing current request.")
        return;
    }
    APP.models.sync.requestActive = true;
    var userUUID = null, name = null, email = null, phone = null;
    mobileNotify("Preparing your beta request");
    
    if (APP.models.profile.parseUser === null) { 
        mobileNotify("You must be a user to join iPhone beta");
        return;
    } else {
        userUUID = APP.models.profile.currentUser.get('userUUID');
        name = APP.models.profile.currentUser.get('name');
        email = APP.models.profile.currentUser.get('email');
        phone = APP.models.profile.currentUser.get('phone');
    }
    
    var Beta = Parse.Object.extend('betarequest');
    var beta = new Beta();
    beta.set("userUUID", userUUID);
	if (name === undefined || name === null)
		name = email;
    beta.set("name", name);
    beta.set("email",email );
    beta.set("phone", phone);
    beta.set("udid", APP.models.profile.udid);
    beta.set("device", APP.models.profile.device);
    beta.set("model", APP.models.profile.model);
    beta.set("platform", APP.models.profile.platform);
    
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
    
function sendSupportRequest(e) {
    e.preventDefault();
    if (APP.models.sync.requestActive){
        mobileNotify("Processing current support request.")
        return;
    }
        
    APP.models.sync.requestActive = true;
    var category = $('#supportCategory').val(), message =  $('#supportMessage').val();
    var userUUID = null, name = null, email = null, phone = null;
    mobileNotify("Preparing your support request");
    
   if (APP.models.profile.parseUser !== null) {
        userUUID = APP.models.profile.currentUser.get('userUUID');
        name = APP.models.profile.currentUser.get('name');
        email = APP.models.profile.currentUser.get('email');
        phone = APP.models.profile.currentUser.get('phone');
    }
    
    var Support = Parse.Object.extend('support');
    var support = new Support();
    support.set("userUUID", userUUID);
    support.set("name", name);
    support.set("email",email );
    support.set("phone", phone);
    support.set("category", category);
    support.set("message", message);
    support.set("udid", APP.models.profile.udid);
    support.set("device", APP.models.profile.device);
    support.set("model", APP.models.profile.model);
    support.set("platform", APP.models.profile.platform);
    
    support.save(null, {
        success: function(support) {
            mobileNotify("You support request was sent. Thank you!");
            closeModalViewSupport();
            APP.models.sync.requestActive = false;
        },
        error: function(support, error) {
            mobileNotify("Error sending your support request: " + error);
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
        
        APP.models.contacts.deviceContactsDS.data([]);
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
            			APP.models.contacts.deviceContactsDS.add(contactItem);
				});
            } else {
				if (contactItem.phoneNumbers.length > 0)
            			APP.models.contacts.deviceContactsDS.add(contactItem);
			}
			// Only add device contacts with phone numbers
			
        }
         
    },function(error){mobileNotify(error);}, options);
}


function homeRecoverPassword(e) {
    // ToDo - need to wire password reset
    var emailAddress = $("#home-recoverPassword-email").val();
    console.log("Sending email to " + emailAddress);
}
	
function syncPresence () {

    var userId = APP.models.profile.currentUser.get('userUUID'), presence = '';

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

function closeChooseGhost() {
    console.log("clicked");
    $("#modalview-chooseGhost").data("kendoMobileModalView").close();
}

function viewEditProfile() {
    console.log("clicked");
    //$("#profileTopView, .profileDisplay").addClass("hidden");
    //$("#profileEditPhotos, .profileEditBtm").removeClass("hidden");
}

function profileInfoToggle() {
     console.log("profile clicked");
}

function saveNewPass() {
    $("#modalview-changePassword").data("kendoMobileModalView").close();
    // ToDo - wire save password
}

function closeNewPass(){
    $("#modalview-changePassword").data("kendoMobileModalView").close();
}

// ToDo - Need to wire change password
function changePassword(){
    
}
// Select new ghost icon
function whichGhost(e){
    console.log(e.target);
}

