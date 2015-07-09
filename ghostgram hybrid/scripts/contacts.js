function syncCurrentContact(e) {
    updateParseObject('contacts','uuid', APP.models.contacts.currentContact.uuid, e.field, this[e.field]);  
    APP.models.contacts.currentModel.set(e.field, this[e.field]);
}
    
function syncProfile (e) {
    APP.models.profile.parseUser.set(e.field, APP.models.profile.currentUser.get(e.field));
    APP.models.profile.parseUser.save(null, {
        success : function (user){
            mobileNotify("Updated your " + e.field);
        },
        error: function (user, error){
            mobileNotify("Profile save error: " + error);
        }
    });
}

function contactSearchActivate (e) {
    if (e !== undefined)
        e.preventDefault();
    $('#contactSearch').removeClass('hidden');
}

function inviteUser(e) {
    if (e !== undefined)
        e.preventDefault();
	
}

function privateChat(e) {
    if (e !== undefined)
        e.preventDefault();
	var contact = APP.models.contacts.currentContact;
	var contactUUID = contact.contactUUID;
	
	if (contactUUID === undefined || contactUUID === null) {
		// TODO: look up contact in user table...
		mobileNotify(contact.get('name') + "hasn't verified their contact info");
		return;
	}
	
    processPrivateInvite(contactUUID, APP.models.profile.currentUser.get('alias') + " requests a Private Channel");
}

function getContactModel(contactUUID) {
	 var dataSource = APP.models.contacts.contactsDS;
    dataSource.filter( { field: "contactUUID", operator: "eq", value: contactUUID });
    var view = dataSource.view();
    var contact = view[0];
	dataSource.filter([]);
	
	return(contact);
}

function findContactByUUID(uuid) {
var dataSource = APP.models.contacts.contactsDS;
    dataSource.filter( { field: "uuid", operator: "eq", value: uuid });
    var view = dataSource.view();
    var contact = view[0];
	dataSource.filter([]);
	
	return(contact);	
}

function findContactByPhone(phone) {
var dataSource = APP.models.contacts.contactsDS;
    dataSource.filter( { field: "phone", operator: "eq", value: phone });
    var view = dataSource.view();
    var contact = view[0];
	dataSource.filter([]);
	
	return(contact);	
}

function doEditContact(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
	
    APP.kendo.navigate("#editContact");  
}



function deleteContact(e) {
	if (e.preventDefault !== undefined)
		e.preventDefault();
    var dataSource = APP.models.contacts.contactsDS;
	var string = "Deleted contact: " + APP.models.contacts.currentContact.name + " ("+ APP.models.contacts.currentContact.alias + ")" ;
	
    dataSource.filter( { field: "uuid", operator: "eq", value: APP.models.contacts.currentContact.uuid });
    var view = dataSource.view();
    var contact = view[0];
	 dataSource.filter([]);
    dataSource.remove(contact);

    deleteParseObject("contacts", 'uuid', APP.models.contacts.currentContact.get('uuid'));
	mobileNotify(string);
	APP.kendo.navigate('#contacts');
    
}

function syncContact(model) {
	var phone = model.get('phone');
	 findUserByPhone(phone, function (result) {
		 if (result.found) {
			 var uuid = model.get('uuid'), contactUUID = model.get('contactUUID'), publicKey = model.get('publicKey'), 
				 phoneVerified = model.get('phoneVerfied'),  emailVerified = model.get('emailVerfied'), parseEmailVerified = result.user.emailVerified ;
			
			// Does the contact have a verified email address
			if (result.user.emailVerified) {
				// Yes - save the email address the contact verified
				model.set("email", result.user.email);
			} 
			model.set('publicKey',  result.user.publicKey);
			 
			model.set("contactUUID", result.user.userUUID);
			 if (contactUUID === undefined) {
				 updateParseObject('contacts', 'uuid', uuid, 'contactUUID',  result.user.userUUID);
			 }
			 
			 if (publicKey === undefined) {
				 updateParseObject('contacts', 'uuid', uuid, 'publicKey',result.user.publicKey );
			 }
			 if (phoneVerified !== result.user.phoneVerified) {
				 if (result.user.phoneVerified === undefined)
					 result.user.phoneVerified = false;
				 
				  if (result.user.phoneVerified){
					   model.set('category', "member");
				  }
				  model.set("phoneVerified", result.user.phoneVerified);
				  updateParseObject('contacts', 'uuid', uuid, 'phoneVerified', result.user.phoneVerified );
			 }
		 }

	 });
}


function contactSendEmail() {
    var email = APP.models.contacts.currentContact.get('email');
	 if (window.navigator.simulator === true){
		 alert("Mail isn't supported in the emulator");
	 } else {
		 var thisUser = APP.models.profile.currentUser.get('name');
		 cordova.plugins.email.open({
			   to:          [email],
			   subject:     '',
			   body:        '</br></br></br></br><em>Via ghostgrams</em>',
			   isHtml:      true
			}, function (msg) {
			  //navigator.notification.alert(JSON.stringify(msg), null, 'EmailComposer callback', 'Close');
		 });
	 }
	
}
    

function contactSendEmailInvite() {
    var email = APP.models.contacts.currentContact.get('email');
	 if (window.navigator.simulator === true){
		 alert("Mail isn't supported in the emulator");
	 } else {
		 var thisUser = APP.models.profile.currentUser.get('name');
		 cordova.plugins.email.open({
			   to:          [email],
			   subject:     'Check out ghostgrams',
			   body:        '<h2>A invitation From ' + thisUser + ' to try Ghostgrams</h2>',
			   isHtml:      true
			}, function (msg) {
			 // navigator.notification.alert(JSON.stringify(msg), null, 'EmailComposer callback', 'Close');
		 });
	 }
	
}
function contactCallPhone() {
     var number = APP.models.contacts.currentContact.get('phone');
    phonedialer.dial(
        number,
        function(err) {
            if (err == "empty")
                navigator.notification.alert("Invalid phone number", null, 'ghostgrams dailer', 'Close');
            else
                navigator.notification.alert("Error: " + err , null, 'ghostgrams dailer', 'Close');
        },
        function(success) {
            mobileNotify("Dialing " + number);
        }
    );

}
    
function contactSendSMS() {

    var number = APP.models.contacts.currentContact.get('phone');
    var message = "";


    //CONFIGURATION
    var options = {
        android: {
            intent: 'INTENT'  // send SMS with the native android SMS messaging
            //intent: '' // send SMS without openning any other app
        }
    };

    var success = function () { mobileNotify('Message sent successfully'); };
    var error = function (e) { mobileNotify('Message Failed:' + e); };
    
    if (window.navigator.simulator === true){
   //running in the simulator
        alert('Simulating SMS to ' + number + ' message: ' + message);
    } else {
       sms.send(number, message, options, success, error);
    }

}
    
function updateCurrentContact (contact) {
   
    // Wish observables set took an object -- need to set fields individually
    APP.models.contacts.currentModel = contact;
    APP.models.contacts.currentContact.unbind('change' , syncCurrentContact);
    APP.models.contacts.currentContact.set('name', contact.name);
    APP.models.contacts.currentContact.set('alias', contact.alias);
    APP.models.contacts.currentContact.set('phone', contact.phone);
    APP.models.contacts.currentContact.set('email', contact.email);
    APP.models.contacts.currentContact.set('address', contact.address);
    APP.models.contacts.currentContact.set('uuid', contact.uuid);
	APP.models.contacts.currentContact.set('category', contact.category);
	APP.models.contacts.currentContact.set('contactUUID', contact.contactUUID);
	APP.models.contacts.currentContact.set('contactEmail', contact.contactEmail);
    APP.models.contacts.currentContact.set('privateChannel', contact.privateChannel);
	APP.models.contacts.currentContact.set('privateChannelId', contact.privateChannelId);
	APP.models.contacts.currentContact.set('phoneVerified',contact.phoneVerified);
	APP.models.contacts.currentContact.set('publicKey',contact.publicKey);
    APP.models.contacts.currentContact.bind('change' , syncCurrentContact);
   
   
}

function onCommandActionSheet(e) {
   if (e.preventDefault !== undefined)
    	e.preventDefault();
	
    var currentTarget = e.currentTarget,
        parentElement = currentTarget.parent();

    setTimeout(function() {
        currentTarget.remove().appendTo(parentElement);
    }, 100);
}

function onInitContact(e) {
	if (e.preventDefault !== undefined)
    	e.preventDefault();
	
}

function onShowEditContact(e) {

	if (e.preventDefault !== undefined)
    	e.preventDefault();

	syncContact(APP.models.contacts.currentContact);
	// Todo - wire up verified status/read only fields
	
}

function onDoneEditContact (e) {
	if (e.preventDefault !== undefined)
    	e.preventDefault();
   
	 APP.models.contacts.currentContact.unbind('change' , syncCurrentContact);
	APP.kendo.navigate("#contacts");
}

function onInitContacts(e) {

	if (e.preventDefault !== undefined)
    	e.preventDefault();

	APP.models.contacts.deviceQueryActive = false;
	
	var dataSource = APP.models.contacts.contactListDS;
	
	// Activate clearsearch and zero the filter when it's called
     $('#contactSearchInput').clearSearch({ 
		 callback: function() { 
			 dataSource.data([]);
			 dataSource.data(APP.models.contacts.contactsDS.data());
			 dataSource.filter([]);  
			  APP.models.contacts.deviceContactsDS.data([]);
			 $('#btnSearchDeviceContacts').addClass('hidden');
		 } 
	 });
	
	// Filter current contacts and query device contacts on keyup
	// Todo: cache local contacts on first call and then just filter that list
	$('#contactSearchInput').keyup(function() {
		 var query = this.value;
		 if (query.length > 0) {
			  dataSource.filter( {"logic":"or",
                  "filters":[
                      {
                          "field":"name",
                          "operator":"contains",
                          "value":query},
                      {
                          "field":"alias",
                          "operator":"contains",
                          "value":query}
                  ]});
			  if (query.length > 2) {
				  $('#btnSearchDeviceContacts').removeClass('hidden');
			  }
			  $("#btnSearchDeviceName").text(query);
			
		 } else {
			 dataSource.data([]);
			 APP.models.contacts.deviceContactsDS.data([]);
			 dataSource.data(APP.models.contacts.contactsDS.data());
			 dataSource.filter([]);
			 
			 $('#btnSearchDeviceContacts').addClass('hidden');
			  
		 }
	 });
	
     $("#contacts-listview").kendoMobileListView({
        dataSource: APP.models.contacts.contactListDS,
        template: $("#contactsTemplate").html(),
		headerTemplate: "${value}",
        fixedHeaders: true,
        click: function (e) {
            var contact = e.dataItem;
            //console.log(contact);
            updateCurrentContact(contact);
			
			if (contact.category === 'phone') {
				APP.kendo.navigate('#contactImport?query=' + contact.name);
				// Need to import contact...
				
			} else {		
				// If we know the contacts uuid enable the full feature set
				if (contact.contactUUID !== undefined && contact.contactUUID !== null){
					$("#contactUserActions").data("kendoMobileActionSheet").open();
				} else {
					$("#contactActions").data("kendoMobileActionSheet").open();
				}
			}
             
        }
     });
}
 
function onShowContacts (e) {
	if (e.preventDefault !== undefined)
    	e.preventDefault();
    
	APP.models.contacts.contactListDS.data(APP.models.contacts.contactsDS.data());
	//APP.models.contacts.contactListDS.data(APP.models.contacts.deviceContactsDS.data());
	
}

function onHideContacts (e) {
	if (e.preventDefault !== undefined)
    	e.preventDefault();
	//APP.models.contacts.contactListDS.data(APP.models.contacts.contactsDS.data());
}
    
function onInitContactImport (e) {
  if (e.preventDefault !== undefined)
    	e.preventDefault();
	
    $("#contactimport-listview").kendoMobileListView({
            dataSource: APP.models.contacts.deviceContactsDS,
            template: $("#deviceContactsTemplate").html(),
			headerTemplate: "${value}",
            fixedHeaders: true,
            click: function(e) {
         
               APP.models.contacts.currentDeviceContact = e.dataItem;
               APP.models.contacts.emailArray = new Array();
               
               for (var i = 0; i<APP.models.contacts.currentDeviceContact.emails.length; i++) {
                    var email = new Object();
                    email.name = APP.models.contacts.currentDeviceContact.emails[i].name;
                    email.address =  APP.models.contacts.currentDeviceContact.emails[i].address;

                   APP.models.contacts.emailArray.push(email);

               }

               APP.models.contacts.phoneArray = new Array();
                 for (var j = 0; j<APP.models.contacts.currentDeviceContact.phoneNumbers.length; j++) {
                    var phone = new Object();
                    phone.name = APP.models.contacts.currentDeviceContact.phoneNumbers[j].name;
                    phone.number =  APP.models.contacts.currentDeviceContact.phoneNumbers[j].number;

                   APP.models.contacts.phoneArray.push(phone);

               }
                
                APP.models.contacts.addressArray = new Array();
                for (var a = 0; a<APP.models.contacts.currentDeviceContact.addresses.length; a++) {
                    var address = new Object();
                    address.name = APP.models.contacts.currentDeviceContact.addresses[a].name;
                    address.address =  APP.models.contacts.currentDeviceContact.addresses[a].fullAddress;

                    APP.models.contacts.addressArray.push(address);
               }

               // Set name
               var name = APP.models.contacts.currentDeviceContact.name;
               //console.log(APP.models.contacts.currentDeviceContact);
               if (name !== ""){
               		$("#addContactName").text(name);
               } else {
               		$("#addContactName").text("No name");
               }
               

               
               APP.models.contacts.phoneDS.data( APP.models.contacts.phoneArray);
               APP.models.contacts.emailDS.data( APP.models.contacts.emailArray);
               APP.models.contacts.addressDS.data( APP.models.contacts.addressArray);
               //APP.kendo.navigate('#addContact');

               // ToDo - add alias wiring 
    		   $("#addNicknameBtn").removeClass("hidden");
    		   $("#contactNicknameInput input").val("");

               $("#modalview-AddContact").data("kendoMobileModalView").open();
             
            }
    });
}

function onShowContactImport (e) {
	e.preventDefault();
	var query = e.view.params.query;
	//contactsFindContacts(query);
	
}

function searchDeviceContacts(e) {
	e.preventDefault();

	var query = $('#contactSearchInput').val();
	
	contactsFindContacts(query, function(array) {

        var name = query.toLowerCase(), nameArray = name.split(' ');

        // Two names?
        if (nameArray.length > 1) {
            unifyContacts(array);
            APP.models.contacts.contactListDS.data([]);
            APP.models.contacts.contactListDS.add(array[0]);
        } else {
            for (var i=0; i<array.length; i++) {
                APP.models.contacts.contactListDS.add(array[i]);
            }
        }

	});
}

// Filter contacts - unify matching names
function filterContactsByName(contacts, firstName, lastName) {

    var nameArray= [];
    for (var i=0; i<contacts.length; i++) {
        var familyName = contacts[i].familyName, middleName = contacts[i].middleName, givenName = contacts[i].givenName,
            formattedName = contacts[i].formatted;


    }

}

function unifyContacts(contacts) {
    var emailArray = [], phoneArray = [], addressArray = [],
        emails = [], phones = [], addresses = [], photo='';


    //Build histograms for email, phone and address
    for (var i=0; i<contacts.length; i++) {
        for (var e=0; e<contacts[i].emails.length; e++) {
            emailArray[contacts[i].emails[e].address] = contacts[i].emails[e].name ? contacts[i].emails[e].name : '';

        }

        for (var p=0; p<contacts[i].phoneNumbers.length; p++) {
            phoneArray[contacts[i].phoneNumbers[p].number] = contacts[i].phoneNumbers[p].name ? contacts[i].phoneNumbers[p].name : '';
        }

        for (var a=0; a<contacts[i].addresses.length; a++) {
			// Only store the address if both the name and full address don't contain null
			if (contacts[i].addresses[a].fullAddress.indexOf('null') == -1 && contacts[i].addresses[a].name == -1)
            	addressArray[contacts[i].addresses[a].fullAddress] = contacts[i].addresses[a].name ? contacts[i].addresses[a].name : '';
		}
		
    }

    emails = Object.keys(emailArray);
    phones = Object.keys(phoneArray);
    addresses = Object.keys(addressArray);

	 APP.models.contacts.emailArray = [];
    for (e = 0; e<emails.length; e++) {
        var email = {};
        email.name = emailArray[emails[e]];
        email.address =  emails[e];

        APP.models.contacts.emailArray.push(email);
    }
    APP.models.contacts.currentDeviceContact.emails = APP.models.contacts.emailArray;

	APP.models.contacts.phoneArray = [];
    for (p = 0; p<phones.length; p++) {
        var phone = {};
        phone.name = phoneArray[phones[a]];
        phone.number =  phones[a];

        APP.models.contacts.phoneArray.push(phone);
    }
    APP.models.contacts.currentDeviceContact.phoneNumbers = APP.models.contacts.phoneArray;

	APP.models.contacts.addressArray = [];
    for (a = 0; a<addresses.length; a++) {
        var address = {};
        address.name = addressArray[addresses[a]];
        address.address =  addresses[a];

        APP.models.contacts.addressArray.push(address);
    }
    APP.models.contacts.currentDeviceContact.addresses =  APP.models.contacts.addressArray;
}
    
function contactsFindContacts(query, callback) {
  //  e.preventDefault(e);   
 //   var query = $('#contactSearchQuery').val();
   
	if (APP.models.contacts.deviceQueryActive) {
		return;
	} else {
		APP.models.contacts.deviceQueryActive = true;
	}
	
    var options      = new ContactFindOptions();
    options.filter   = query
    options.multiple = true;
    var fields       = ["name", "displayName", "nickName" ,"phoneNumbers", "emails", "addresses", "photos"];
     
    navigator.contacts.find(fields, function(contacts){
        APP.models.contacts.deviceQueryActive = false;
		
        APP.models.contacts.deviceContactsDS.data([]);
        var contactsCount = contacts.length;
        
        for (var i=0;  i<contactsCount; i++){
            var contactItem = new Object();
            contactItem.type = "device";
            contactItem.name = contacts[i].name.formatted;
            contactItem.phoneNumbers = new Array();
			contactItem.category = 'phone';
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
            contactItem.photo = 'images/default-img.png';
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
		
        if (callback !== undefined) {
			callback(APP.models.contacts.deviceContactsDS.data());
		} 
    },
	function(error){
		mobileNotify(error);
	}, options);
 }
			
 function returnValidPhoto(url,callback){
    var img = new Image();
    img.onload = function() {
    //Image is ok
        callback(url);
    };
    img.onerror = function(err) {
        //Returning a default image for users without photo 
        callback("images/default-img.png");
    };
    img.src = url;
}
			
function doShowAddContacts(e) {
    e.preventDefault();
    var data = APP.models.contacts.currentContact;
    
    $("#addContactName").text("");
    $('#addContactAlias').text("");

    //console.log(data);
    if (data.photo === null) {
        $("#addContactPhoto").attr("src","images/ghostgramcontact.png");

    } else {
        $("#addContactPhoto").attr("src",data.photo);
    }

}

function contactsAddContact(e){
    e.preventDefault(e);
     var Contacts = Parse.Object.extend("contacts");
    var contact = new Contacts();
    
    var name = $('#addContactName').val(),
        alias = $('#addContactAlias').val(),
        phone = $('#addContactPhone').val(),
        email = $('#addContactEmail').val(), 
        photo = $('#addContactPhoto').prop('src'),
        address = $('#addContactAddress').val();
        guid = uuid.v4();
	
		contact.setACL(APP.models.profile.parseACL);
		contact.set("name", name );
		contact.set("alias", alias);
		contact.set("address", address);
		contact.set("group", '');
	    contact.set('category', "new");
		contact.set("priority", 0);
		contact.set("privateChannel", null);
		contact.set("uuid", guid);
	
    //phone = phone.replace(/\+[0-9]{1-2}/,'');
    phone = phone.replace(/\D+/g, "");
	if (phone[0] !== '1')
		phone = '1' + phone;
	
	if (findContactByPhone(phone) !== undefined) {
		mobileNotify("Existing contact with this phone number");
		$("#modalview-AddContact").data("kendoMobileModalView").close();
		return;
	}
	
	contact.set("phone", phone);

	// Close modal
	$("#modalview-AddContact").data("kendoMobileModalView").close();

	mobileNotify("Invite sent");
	// Look up this contacts phone number in the gg directory
	findUserByPhone(phone, function (result) {
		
		if (result.found) {	
			contact.set("phoneVerified", result.user.phoneVerified);
			// Does the contact have a verified email address
			if (result.user.emailVerified) {
				// Yes - save the email address the contact verified
				contact.set("email", result.user.email);
			} else {
				// No - just use the email addres the our user selected
				contact.set("email", email);
			}
			contact.set('publicKey',  result.user.publicKey);
			contact.set("contactUUID", result.user.userUUID);
			
		} else {
			contact.set("phoneVerified", false);
			contact.set('publicKey',  null);
			contact.set("contactUUID", null);
		}
							

		getBase64FromImageUrl(photo, function (fileData) {
			var parseFile = new Parse.File(guid+".png", {base64 : fileData}, "image/png");
			parseFile.save().then(function() {
				contact.set("parsePhoto", parseFile);
				contact.set("photo", parseFile._url);
				 contact.save(null, {
					  success: function(contact) {
						// Execute any logic that should take place after the object is saved.
						mobileNotify('Added contact : ' + contact.get('name'));
						APP.models.contacts.contactsDS.add(contact.attributes);
						APP.kendo.navigate('#contacts');
					  },
					  error: function(contact, error) {
						// Execute any logic that should take place if the save fails.
						// error is a Parse.Error with an error code and message.
						  handleParseError(error);
					  }
					});
				}, function(error) {
				  // The file either could not be read, or could not be saved to Parse.
						 handleParseError(error);
				}); 
			});    

		});
   
}
    
function contactsPickContact(e) {
   // e.preventDefault(e);
    navigator.contacts.pickContact(function(contact){
       mobileNotify(JSON.stringify(contact));
    },function(err){
        mobileNotify('Error: ' + err);
    });
}
    
function closeAddContact() {
	$("#modalview-AddContact").data("kendoMobileModalView").close();
	$("#contactNicknameInput").addClass("hidden");
}

function addNicknameBtn() {
	$("#addNicknameBtn").addClass("hidden");
	$("#contactNicknameInput").removeClass("hidden");
}