/**
 * Created by donbrad on 12/26/15.
 */

'use strict';


var deviceContacts = {
    
    _missingProfileImg : "images/default-img.png",
    _needPermission : false,
    _name : 0,
    _phone: 1,
    _email : 2,
    
    findContacts : function (query, queryType,  callback) {
        
        if (contactModel.deviceQueryActive) {
            return;
        } else {
            contactModel.deviceQueryActive = true;
        }
    
        var options      = new ContactFindOptions();
        options.filter   = query;
        options.multiple = true;
      /*  options.desiredFields = [navigator.contacts.fieldType.id, navigator.contacts.fieldType.name, navigator.contacts.fieldType.displayName,  navigator.contacts.fieldType.givenName, navigator.contacts.fieldType.familyName,
            navigator.contacts.fieldType.phoneNumbers, navigator.contacts.fieldType.emails, navigator.contacts.fieldType.addresses, navigator.contacts.fieldType.photos,
            navigator.contacts.fieldType.formatted, navigator.contacts.fieldType.ims, navigator.contacts.fieldType.categories, navigator.contacts.fieldType.birthday];
*/
        var fields  = [navigator.contacts.fieldType.name, navigator.contacts.fieldType.displayName];

        if (queryType  === 1 ) {
            // Todo: don - add additional phone validation here...    
            fields  = [navigator.contacts.fieldType.phoneNumbers];        
        } else if (queryType === 2) {
            fields  = [navigator.contacts.fieldType.emails];
        }
    
        navigator.contacts.find(fields, function(contacts) {
                contactModel.deviceQueryActive = false;
    
                contactModel.deviceContactsDS.data([]);
                var contactsCount = contacts.length;
    
                for (var i=0;  i<contactsCount; i++) {
                    var contactItem = {};
                    contactItem.type = "device";
                    contactItem.name = contacts[i].name.formatted;
                    if (contactItem.name === undefined || contactItem.name === null || contactItem.name === '') {
                        contactItem.name = query;
                    }
                    contactItem.phoneNumbers = new Array();
                    contactItem.category = 'phone';
                    if (contacts[i].phoneNumbers !== undefined && contacts[i].phoneNumbers !== null) {
                        for (var j=0; j<contacts[i].phoneNumbers.length; j++){
                            var phone = {};
                            var type = contacts[i].phoneNumbers[j].type;
    
                            if (type === undefined || type === '') {
                                type = 'phone';
                            }
    
                            // filter out the obvious non-mobile phone types...
                            if (type !== 'home fax' && type !== 'work fax' && type !== 'pager') {
                                phone.name = contacts[i].phoneNumbers[j].type + " : " + contacts[i].phoneNumbers[j].value ;
                                phone.number = unformatPhoneNumber( contacts[i].phoneNumbers[j].value);
                                contactItem.phoneNumbers.push(phone);
                            }
    
                        }
                    }
                    contactItem.emails = [];
                    if (contacts[i].emails !== undefined && contacts[i].emails !== null) {
                        for (var k=0; k<contacts[i].emails.length; k++){
                            var email = {};
                            email.name = contacts[i].emails[k].type + " : " + contacts[i].emails[k].value;
                            email.address = contacts[i].emails[k].value;
                            contactItem.emails.push(email);
                        }
                    }
    
                    contactItem.addresses = [];
                    if (contacts[i].addresses !== undefined && contacts[i].addresses !== null) {
                        for (var a=0; a<contacts[i].addresses.length; a++){
                            var address = {};
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
    
    
                    contactItem.photos = [];
                    if (contacts[i].photos !== null) {
                        contactItem.photo = contacts[i].photos[0].value;
                        contactItem.photos.push(contacts[i].photos[0].value);
                    } else {
                        contactItem.photo = null;
                    }
    
                    if (contactItem.phoneNumbers.length > 0)
                        contactModel.deviceContactsDS.add(contactItem);
                }
    
                if (callback !== undefined) {
                    var contactArray = contactModel.deviceContactsDS.data();
                    callback(contactArray);
                }
            },
            function(error){
                if (error.code === 20) {
                    mobileNotify("You've denied access to contacts!");
                    //Todo : Need to add UX to inform the user that they've blocked access to contacts
                    userPermission.triggerDeniedModal();
                    deviceContacts._needPermission = true;
                    //$('#contactImport-permission').removeClass('hidden');
                    if (callback !== undefined) {
                        callback([]);
                    }
                } else {
                    mobileNotify("Contact Error: " + JSON.stringify(error));
                    if (callback !== undefined) {
                        callback([]);
                    }
                }

            },
            options);
    },

    // Unify contacts - process array of contacts that have matched full names
    unifyContacts : function (contacts) {
        var emailArray = [], phoneArray = [], addressArray = [], photoArray = [],
            emails = [], phones = [], addresses = [], photos = [], photo='';
    
        contactModel.currentDeviceContact.photos = [];
        contactModel.currentDeviceContact.emails = [];
        contactModel.currentDeviceContact.phoneNumbers = [];
        contactModel.currentDeviceContact.addresses = [];
        contactModel.emailDS.data([]);
        contactModel.phoneDS.data([]);
    
        if (contact.length === 0) {
            return;
        }
    
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
    
            if (contacts[i].photo !== null) {
                photoArray[contacts[i].photo] = contacts[i].photo;
            }
    
        }
    
        emails = Object.keys(emailArray);
        phones = Object.keys(phoneArray);
        addresses = Object.keys(addressArray);
        photos = Object.keys(photoArray);
    
        contactModel.currentDeviceContact.photos = photos;
    
        contactModel.emailArray = [];
        for (e = 0; e<emails.length; e++) {
            var email = {};
            email.name = emailArray[emails[e]];
            email.address =  emails[e];
    
            contactModel.emailArray.push(email);
        }
        contactModel.emailDS.data(contactModel.emailArray);
        contactModel.currentDeviceContact.emails = contactModel.emailArray;
    
        contactModel.phoneArray = [];
        for (p = 0; p<phones.length; p++) {
            var phone = {};
            phone.name = phoneArray[phones[p]];
            phone.number =  phones[p];
    
            contactModel.phoneArray.push(phone);
        }
        contactModel.phoneDS.data(contactModel.phoneArray);
        contactModel.currentDeviceContact.phoneNumbers = contactModel.phoneArray;
    
        contactModel.addressArray = [];
        for (a = 0; a<addresses.length; a++) {
            var address = {};
            address.name = addressArray[addresses[a]];
            address.address =  addresses[a];
    
            contactModel.addressArray.push(address);
        }
        contactModel.addressDS.data(contactModel.addressArray);
        contactModel.currentDeviceContact.addresses =  contactModel.addressArray;
    },

    // Given a full contact name as a string, fetch matching device contacts and then build a unified list of:
    // phone numbers, emails and addresses -- and first photo found.
    syncContactWithDevice : function (name, callback) {

        var isPhone = false;
        deviceContacts.findContacts(name, isPhone , function (contacts) {
            deviceContacts.unifyContacts(contacts);
            if (callback !== undefined) {
                callback(contacts);
            }
        });
    },

    returnValidPhoto : function (url,callback) {
        if (url === '') {
            callback(deviceContacts._missingProfileImg);
        }

        var img = new Image();
        img.onload = function() {
            //Image is ok
            callback(url);
        };
        img.onerror = function(err) {
            //Returning a default image for users without photo
            callback(deviceContacts._missingProfileImg);
        };
        img.src = url;
    }


};

/*function searchDeviceContacts(e) {
   _preventDefault(e);

    var query = $('#contactSearchInput').val();

    deviceContacts.findContacts(query, function(array) {

        var name = query.toLowerCase(), nameArray = name.split(' ');

        // Two names?
        if (nameArray.length > 1) {
            mobileNotify("Unifying " + query + "'s data");
            deviceContacts.unifyContacts(array);
            contactModel.unifiedDeviceContact = true;
            contactModel.contactListDS.data([]);
            contactModel.contactListDS.add(array[0]);
        } else {
            contactModel.unifiedDeviceContact = false;
            for (var i=0; i<array.length; i++) {
                contactModel.contactListDS.add(array[i]);
            }
        }

    });
}*/

// Filter contacts - unify matching names
/*function filterContactsByName(contacts, firstName, lastName) {

    var nameArray= [];
    for (var i=0; i<contacts.length; i++) {
        var familyName = contacts[i].familyName, middleName = contacts[i].middleName, givenName = contacts[i].givenName,
            formattedName = contacts[i].formatted;


    }

}*/

function onDoneSyncContact (e) {
   _preventDefault(e);

    contactModel.currentContact.set('phone', $( "#syncContactPhone option:selected" ).text() );
    contactModel.currentContact.set('email', $( "#syncContactEmail option:selected" ).text() );
    contactModel.currentContact.set('address', $( "#syncContactAddress option:selected" ).text() );

    $('#syncEditList').velocity("fadeOut", {duration: 300});
    $('#contactEditList, #editContact-deleteBtn').velocity("fadeIn", {duration: 300, delay: 300, display: "inline-block"});


    $("#editContact-resyncBtn").velocity("fadeIn",{duration: 300}).html('<img src="images/contacts.svg" /> Sync Contact With Device');
}

function doSyncContactWithDevice(e) {
    if (e.preventDefault !== undefined) {
        e.preventDefault();
    }

    var name = contactModel.currentContact.name;
    syncContactWithDevice(name, function() {
        $('#contactEditList, #editContact-deleteBtn').velocity("fadeOut", {duration: 300, delay: 1000});
        $('#syncEditList').velocity("fadeIn", { duration: 300, delay: 1500});
    });

    $("#editContact-resyncBtn").html('<img src="images/loading.svg" class="loading-sm" /> Syncing...').velocity("slideUp",{delay: 1000, duration: 300});

    //
    $("#editContact-syncCompleteBtn").velocity("fadeIn", {delay: 1300, duration: 300});


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

