function syncCurrentContact(e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }
    updateParseObject('contacts','uuid', APP.models.contacts.currentContact.uuid, e.field, this[e.field]);  
    APP.models.contacts.currentModel.set(e.field, this[e.field]);
}
    
function syncProfile (e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }

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
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }
    $('#contactSearch').removeClass('hidden');
}

function inviteUser(e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }
	
}

function sendSecureEmail () {
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

function secureEmail(e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }

    var email = APP.models.contacts.currentContact.get('email');

}

function privateChat(e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }
	var contact = APP.models.contacts.currentContact;
	var contactUUID = contact.contactUUID;
	
	if (contactUUID === undefined || contactUUID === null) {
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
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }
	
    APP.kendo.navigate("#editContact");  
}



function deleteContact(e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }
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


function contactSendEmail(e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }

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

function inviteContact(e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }

    var email = APP.models.contacts.currentContact.get('email');

    contactSendEmailInvite(email);
}

function contactSendSMSInvite(phone) {

    var message = "Check out ghostgrams: link tbd...";


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

function contactSendEmailInvite(email) {

	 if (window.navigator.simulator === true){
		 alert("Mail isn't supported in the emulator");
	 } else {
		 var thisUser = APP.models.profile.currentUser.get('name');
		 cordova.plugins.email.open({
			   to:          [email],
               bcc: ['donbrad@hotmail.com'],
			   subject:     'Check out ghostgrams',
			   body:        '<h2>A invitation From ' + thisUser + ' to try Ghostgrams</h2> <p>Reply All to this message to get instructions on joining the beta program</p>',
			   isHtml:      true
			}, function (msg) {
			 // navigator.notification.alert(JSON.stringify(msg), null, 'EmailComposer callback', 'Close');
		 });
	 }
	
}
function contactCallPhone(e) {

    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }

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
    
function contactSendSMS(e) {

    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }

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
	APP.models.contacts.currentContact.set('photo', contact.photo);
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
	if (e.preventDefault !== undefined) {
    	e.preventDefault();
	}
}

function onShowEditContact(e) {
	if (e.preventDefault !== undefined){
    	e.preventDefault();

	}
	
	$("#syncEditList").velocity("slideUp", {duration: 0});

	$('#contactEditList').removeClass('hidden');
	
	syncContact(APP.models.contacts.currentContact);
	// Todo - wire up verified status/read only fields
	
	var contactVerified = APP.models.contacts.currentContact.phoneVerified;
	var contactEmail = APP.models.contacts.currentContact.email;

	if (contactVerified){
		$("#edit-verified-phone").removeClass("hidden");
		$("#editContactPhone").prop("readonly", true);
	}
	// Use to have emailVerified?
	if(contactEmail !== ''){
		$("#edit-verified-email").removeClass("hidden");
		$("#editContactEmail").prop("readonly", true);
	}
	
}

function onDoneEditContact (e) {
	if (e.preventDefault !== undefined)
    	e.preventDefault();
   
	 APP.models.contacts.currentContact.unbind('change' , syncCurrentContact);
	APP.kendo.navigate("#contacts");

	// reset UI
	$("#contactEditList").velocity("fadeIn");
}


function onInitContacts(e) {

	if (e.preventDefault !== undefined){
    	e.preventDefault();
    }

    // set search bar 
    var scroller = e.view.scroller;
	scroller.scrollTo(0,-44); 

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

            updateCurrentContact(contact);
			
			if (contact.category === 'phone') {
                if (APP.models.contacts.unifiedDeviceContact) {
                    // Have a unified device contact -- just to add contact
                    launchAddContact({dataItem : contact});
                } else {
                    // Still have multiple contacts
                    APP.kendo.navigate('#contactImport?query=' + contact.name);
                }

			} else {		
				// If we know the contacts uuid enable the full feature set
				if (contact.contactUUID !== undefined && contact.contactUUID !== null){
					$("#contactUserActions").data("kendoMobileActionSheet").open();
					//APP.kendo.navigate("#ghostEmail"); 
					//doEditContact(e);
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

function launchAddContact(e) {

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



    APP.models.contacts.phoneDS.data( APP.models.contacts.phoneArray);
    APP.models.contacts.emailDS.data( APP.models.contacts.emailArray);
    APP.models.contacts.addressDS.data( APP.models.contacts.addressArray);


  /*
    $("#addNicknameBtn").removeClass("hidden");
    $("#contactNicknameInput input").val("");*/

    var data = APP.models.contacts.currentDeviceContact;

    // Set name
    var name = data.name;
    $("#addContactName").val(name);


    if (data.photo !== null) {
        returnValidPhoto(data.photo, function(validUrl) {
            $("#addContactPhoto").attr("src",validUrl);
        });
    }

    $( "#addContactPhone" ).change(function() {
        var phone = $("#addContactPhone").val();

        isValidMobileNumber(phone, function(result){
           if (result.status === 'ok') {
               if (result.valid === false) {
                   mobileNotify(phone + 'is not a valid mobile number');
               }
           }
        });
    });

    $("#modalview-AddContact").data("kendoMobileModalView").open();

}

function onInitContactImport (e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }
	
    $("#contactimport-listview").kendoMobileListView({
            dataSource: APP.models.contacts.deviceContactsDS,
            template: $("#deviceContactsTemplate").html(),
			headerTemplate: "${value}",
            fixedHeaders: true,
            click: launchAddContact


    });
}

function onShowContactImport (e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }
	var query = e.view.params.query;
	//contactsFindContacts(query);
	
}

function searchDeviceContacts(e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }

	var query = $('#contactSearchInput').val();
	
	contactsFindContacts(query, function(array) {

        var name = query.toLowerCase(), nameArray = name.split(' ');

        // Two names?
        if (nameArray.length > 1) {
            mobileNotify("Unifying " + query + "'s data");
            unifyContacts(array);
            APP.models.contacts.unifiedDeviceContact = true;
            APP.models.contacts.contactListDS.data([]);
            APP.models.contacts.contactListDS.add(array[0]);
        } else {
            APP.models.contacts.unifiedDeviceContact = false;
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

function onDoneSyncContact (e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}	
	APP.models.contacts.currentContact.set('phone', $( "#syncContactPhone option:selected" ).text() );
	APP.models.contacts.currentContact.set('email', $( "#syncContactEmail option:selected" ).text() );
	APP.models.contacts.currentContact.set('address', $( "#syncContactAddress option:selected" ).text() );
	
	$('#syncEditList').velocity("fadeOut", {duration: 300});
	$('#contactEditList, #editContact-deleteBtn').velocity("fadeIn", {duration: 300, delay: 300, display: "inline-block"});
	

	$("#editContact-resyncBtn").velocity("fadeIn",{duration: 300}).html('<img src="images/contacts.svg" /> Sync Contact With Device');
}

function doSyncContact(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}
	
	var name = APP.models.contacts.currentContact.name;
	syncContactWithDevice(name, function() {
		$('#contactEditList, #editContact-deleteBtn').velocity("fadeOut", {duration: 300, delay: 1000});
		$('#syncEditList').velocity("fadeIn", { duration: 300, delay: 1500});
	});

	$("#editContact-resyncBtn").html('<img src="images/loading.svg" class="loading-sm" /> Syncing...').velocity("slideUp",{delay: 1000, duration: 300});

	// 
	$("#editContact-syncCompleteBtn").velocity("fadeIn", {delay: 1300, duration: 300});
	

}

// Given a full contact name as a string, fetch matching device contacts and then build a unified list of:
// phone numbers, emails and addresses -- and first photo found. 
function syncContactWithDevice(name, callback) {
	contactsFindContacts(name, function (contacts) {
		unifyContacts(contacts);
		if (callback !== undefined) {
			callback();
		}
	});
}

// Unify contacts - process array of contacts that have matched full names
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
    APP.models.contacts.emailDS.data(APP.models.contacts.emailArray);
    APP.models.contacts.currentDeviceContact.emails = APP.models.contacts.emailArray;

	APP.models.contacts.phoneArray = [];
    for (p = 0; p<phones.length; p++) {
        var phone = {};
        phone.name = phoneArray[phones[p]];
        phone.number =  phones[p];

        APP.models.contacts.phoneArray.push(phone);
    }
    APP.models.contacts.phoneDS.data(APP.models.contacts.phoneArray);
    APP.models.contacts.currentDeviceContact.phoneNumbers = APP.models.contacts.phoneArray;

	APP.models.contacts.addressArray = [];
    for (a = 0; a<addresses.length; a++) {
        var address = {};
        address.name = addressArray[addresses[a]];
        address.address =  addresses[a];

        APP.models.contacts.addressArray.push(address);
    }
    APP.models.contacts.addressDS.data(APP.models.contacts.addressArray);
    APP.models.contacts.currentDeviceContact.addresses =  APP.models.contacts.addressArray;
}
    
function contactsFindContacts(query, callback) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }
 //   var query = $('#contactSearchQuery').val();
   
	if (APP.models.contacts.deviceQueryActive) {
		return;
	} else {
		APP.models.contacts.deviceQueryActive = true;
	}
	
    var options      = new ContactFindOptions();
    options.filter   = query;
    options.multiple = true;
    var fields       = ["name", "displayName", "nickName" ,"phoneNumbers", "emails", "addresses", "photos"];
     
    navigator.contacts.find(fields, function(contacts) {
        APP.models.contacts.deviceQueryActive = false;
		
        APP.models.contacts.deviceContactsDS.data([]);
        var contactsCount = contacts.length;
        
        for (var i=0;  i<contactsCount; i++) {
            var contactItem = new Object();
            contactItem.type = "device";
            contactItem.name = contacts[i].name.formatted;
            contactItem.phoneNumbers = new Array();
			contactItem.category = 'phone';
            if (contacts[i].phoneNumbers !== null) {
                for (var j=0; j<contacts[i].phoneNumbers.length; j++){
                    var phone = new Object();
                    phone.name = contacts[i].phoneNumbers[j].type + " : " + contacts[i].phoneNumbers[j].value ;
                    phone.number = unformatPhoneNumber( contacts[i].phoneNumbers[j].value);
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

            contactItem.photo = "images/default-img.png";
            if (contacts[i].photos !== null) {
				contactItem.photo = contacts[i].photos[0].value;
            }

            if (contactItem.phoneNumbers.length > 0)
                APP.models.contacts.deviceContactsDS.add(contactItem);
        }
		
        if (callback !== undefined) {
			callback(APP.models.contacts.deviceContactsDS.data());
		} 
    },
	function(error){
		mobileNotify(error);
	}, options);
 }
			
 function returnValidPhoto(url,callback) {
     if (url === '') {
         callback("images/ghostgramcontact.png");
     }

    var img = new Image();
    img.onload = function() {
    //Image is ok
        callback(url);
    };
    img.onerror = function(err) {
        //Returning a default image for users without photo 
        callback("images/ghostgramcontact.png");
    };
    img.src = url;
}
			
function doShowAddContact(e) {
    if (e !== undefined && e.preventDefault !== undefined)
        e.preventDefault();

    var data = APP.models.contacts.currentDeviceContact;

    // Set name
    var name = data.name;


    $("#addContactName").val(name);


    if (data.photo === null) {
        $("#addContactPhoto").attr("src","images/ghostgramcontact.png");

    } else {
        returnValidPhoto(data.photo, function(validUrl) {
            $("#addContactPhoto").attr("src",validUrl);
        });
    }

}

function contactsAddContact(e){
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }
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
				// No - just use the email address the our user selected
				contact.set("email", email);
			}
			contact.set('publicKey',  result.user.publicKey);
			contact.set("contactUUID", result.user.userUUID);
			
		} else {
            contactSendEmailInvite(contact.get('email'));
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
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }
    navigator.contacts.pickContact(function(contact){
       mobileNotify(JSON.stringify(contact));
    },function(err){
        mobileNotify('Error: ' + err);
    });
}

function ghostEmail(e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }
    APP.kendo.navigate("#ghostEmail");
}

function onInitGhostEmail(e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }

    $("#ghostEmailEditor").kendoEditor({
        tools: [
            "bold",
            "italic",
            "underline",
            "justifyLeft",
            "justifyCenter",
            "justifyRight",
            "insertUnorderedList",
            "insertOrderedList",
            "indent",
            "outdent"
        ]
    });

}

function onShowGhostEmail(e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }
	$('#ghostEmailEditor').data("kendoEditor").value("");
}

function sendGhostEmail(e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }
    var content = $('#ghostEmailEditor').data("kendoEditor").value();
    var contactKey = APP.models.contacts.currentContact.get('publicKey'), email = APP.models.contacts.currentContact.get('email');
    if (contactKey === null) {
        mobileNotify("Invalid Public Key for " + APP.models.contacts.currentContact.get('name'));
        return;
    }
    var encryptContent = cryptico.encrypt(content, contactKey);
    if (window.navigator.simulator === true){
        alert("Mail isn't supported in the emulator");
    } else {
        var thisUser = APP.models.profile.currentUser.get('name');
        cordova.plugins.email.open({
            to:          [email],
            subject:     'ghostEmail',
            body:        '<h2>ghostEmail From ' + thisUser + '</h2> <p> !!Test - clear text included !!</p><p>'+ content +'</p> <p>'+ encryptContent.cipher + '</p>',
            isHtml:      true
        }, function (msg) {
			mobileNotify("Email sent to " + thisUser);
            // navigator.notification.alert(JSON.stringify(msg), null, 'EmailComposer callback', 'Close');
        });
    }

}


function closeAddContact() {
	$("#modalview-AddContact").data("kendoMobileModalView").close();
	$("#contactNicknameInput").addClass("hidden");
}

function addNicknameBtn() {
	$("#addNicknameBtn").addClass("hidden");
	$("#contactNicknameInput").removeClass("hidden");
}

function contactAddNew(){

}