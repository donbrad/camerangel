/**
 * Created by donbrad on 8/11/15.
 *
 * contactModel.js -- handles all interactions with parse, kendo and local storage for contacts
 *
 */
'use strict';

var contactModel = {

    _version: 1,
    _ggClass: 'Contact',
    _cloudClass: 'contacts',

   contactsDS: null,


    deviceContactsDS: new kendo.data.DataSource({
        sort: {
            field: "name",
            dir: "asc"
        }
    }),

    // Contact data plus contact status
    contactListDS: new kendo.data.DataSource({
        group: 'category',
        sort: {
            field: "name",
            dir: "asc"
        }

    }),


    currentDeviceContact: {},
    unifiedDeviceContact: false,
    currentContact: null,
    lastSyncTime : ggTime.currentTimeInSeconds() - 900,
    phoneDS: new kendo.data.DataSource(),
    emailDS: new kendo.data.DataSource(),
    addressDS: new kendo.data.DataSource(),
    photoDS : new kendo.data.DataSource(),
    phoneArray: [],
    emailArray: [],
    photoArray: [],
    addressArray: [],


    init : function () {


        contactModel.contactsDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'contacts',
                dataProvider: APP.everlive
            },
            schema: {
                model: { Id:  Everlive.idField}
            },
            sort: {
                field: "name",
                dir: "asc"
            },
            autoSync: true
        });



        // Reflect any core contact changes to contactList
        contactModel.contactsDS.bind("change", function (e) {
            var changedContacts = e.items;

            if (e.action !== undefined) {
                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                        var contact = e.items[0], contactId = contact.uuid;
                        var contactList = contactModel.findContactListUUID(contactId);
                        // if the contact's name or alias has been updated, need to update the tag...
                        var tagList = tagModel.findTagByCategoryId(contact.uuid);

                            if (tagList.length > 0) {
                                var contactTag = tagList[0];
                                contactTag.set('alias',contact.alias);
                                contactTag.set('name', contact.name);
                            }
                        contactList[field] = contact [field];
                        break;

                    case "remove" :
                        var contact = e.items[0];
                        // delete from contact list
                        var contactList = contactModel.findContactList(contact.uuid);
                        if (contactList !== undefined) {
                            contactModel.contactListDS.remove(contactList);
                        }
                        break;

                    case "add" :
                        var contact = e.items[0];
                        // add to contactlist and contacttags
                        var contactList = contactModel.findContactList(contact.uuid);
                        if (contactList !== undefined) {
                            contact.identicon = contactModel.createIdenticon(contact.uuid);
                            if (contact.photo === null)
                                contact.photo = contact.identicon;
                            contactModel.contactListDS.add(contact);
                        } else {
                            if (contactList.photo === undefined || contactList.photo === null) {
                                contactList.identicon = contactModel.createIdenticon(contactList.uuid);
                                contactList.photo = contactList.identicon;
                            }
                        }
                        tagModel.addContactTag(contact.name, contact.alias, '', contact.uuid);
                         break;
                }
            }


        });

        contactModel.contactsDS.fetch();
      
        contactModel.syncContactTags();
        deviceModel.setAppState('hasContacts', true);
       /* deviceModel.isParseSyncComplete();*/

        contactModel.contactListDS.online(false);

    },

    processContactUpdates : function (contacts) {
        for (var i=0; i<contacts.length; i++) {


        }
    },

    syncContactTags: function () {
        var ds = contactModel.contactsDS;

        var length = ds.total();
        for (var i=0; i<length; i++) {
            var contact = ds.at(i);

            if (contact.category === 'member' || contact.category === 'new') {
                tagModel.addContactTag(contact.name, contact.alias, '', contact.uuid);
            }

        }

    },
    
    // Build an identity list for contacts indexed by contactUUID
    buildContactList : function () {
        var array = contactModel.contactsDS.data();
        contactModel.contactListDS.data([]);


        for (var i=0; i<array.length; i++) {
            var contact = (array[i]).toJSON();
            contact.identicon = contactModel.createIdenticon(contact.uuid);
            contact.photo = contact.identicon;
            contactModel.contactListDS.add(contact);
        }

        contactModel.contactListDS.fetch();
    },

    checkIdenticon : function (contact) {
        if (contact.identicon === undefined || contact.identicon === null) {
            contact.identicon = contactModel.createIdenticon(contact.uuid);
        }
    },

    totalContacts : function () {
        if (contactModel.contactsDS !== undefined) {
            return(contactModel.contactsDS.total());
        } else {
            return(0);
        }
    },

    createIdenticon: function (hash) {
        var url;
        if (hash === undefined || hash === null) {
            return null;
        }
        hash = hash.replace(/-/g,'');
        jdenticon.update("#identiconCanvas", hash);
        var canvas = document.getElementById("identiconCanvas");
        url = canvas.toDataURL('image/png');
        return(url);
    },

    queryContact : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = contactModel.contactsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();
        var contact = view[0];

        dataSource.filter(cacheFilter);

        return(contact);
    },

    queryContactList : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = contactModel.contactListDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        var contact = null;
        if (view.length > 0)
        contact = view[0].items[0];

        dataSource.filter(cacheFilter);

        return(contact);
    },

    queryContacts : function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = contactModel.contactListDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);
    },

    syncNewMembers : function () {
        var newMembers = contactModel.queryContacts({ field: "category", operator: "eq", value: "unknown" });
    },

    deleteContact : function (contactId) {
        var contact = contactModel.queryContact({ field: "uuid", operator: "eq", value: contactId });

        if (contact !== undefined) {
            contact.set('isDeleted', true);
            contact.set('xcategory', contact.get('category'));
            contact.set('category', 'zapped');

            var contactList = contactModel.queryContactList({ field: "contactUUID", operator: "eq", value: contact.contactUUID });
            if (contactList !== undefined) {
                contactList.set('isDeleted', true);
                contactList.set('category', 'zapped');
            }
           // dataSource.remove(contact);


            // Delete any current private channel
            channelModel.deletePrivateChannel(contactId);

        }
    },

    undeleteContact : function (contactId) {
        var contact = contactModel.queryContact({ field: "uuid", operator: "eq", value: contactId });
        if (contact !== undefined) {
            var xcategory = contact.get('xcategory');

            if (xcategory === undefined || xcategory === null) {
                xcategory = 'member';
                if (contact.contactUUID === undefined || contact.contactUUID === null) {
                    xcategory = 'new';
                }
            }
            contact.set('isDeleted', false);
            contact.set('category', xcategory);
            contact.set('xcategory', null);

            var contactList = contactModel.queryContactList({ field: "contactUUID", operator: "eq", value: contact.contactUUID });
            if (contactList !== undefined) {
                contactList.set('isDeleted', false);
                contactList.set('category', xcategory);
            }
            // dataSource.remove(contact);
            
        }
    },

    deleteAllContacts : function () {
        var contactsArray = this.contactsDS.data();

        for  (var i=0; i<contactsArray.length; i++) {
            this.deleteContact(contactsArray[i].uuid);
        }
    },

    getPotentialMemberList : function () {
        var dataSource = contactModel.contactsDS;
        var queryCache = dataSource.filter();
        if (queryCache === undefined) {
            queryCache = {};
        }
        dataSource.filter( { "logic" : "or",
            filters : [
                {field: "category", operator: "eq", value: 'member' },
                {field: "category", operator: "eq", value: 'new' }
        ]});

        var view = dataSource.view();
        return(view);
        dataSource.filter(queryCache);
    },

    findContact: function (contactUUID) {
        var contact = contactModel.queryContact({ field: "contactUUID", operator: "eq", value: contactUUID });

        return(contact);
    },


    findContactByUUID : function(uuid) {
        var contact = contactModel.queryContact({ field: "uuid", operator: "eq", value: uuid });

        return(contact);
    },

    findContactsByUUID : function(uuid) {
        var contacts = contactModel.queryContacts({ field: "uuid", operator: "eq", value: uuid });

        return(contacts);
    },


    findContactList : function (contactUUID) {
        var contact = contactModel.queryContactList({ field: "contactUUID", operator: "eq", value: contactUUID });

        return(contact);
    },

    findContactListUUID : function ( uuid) {
        var contacts = contactModel.queryContactList({ field: "uuid", operator: "eq", value: uuid });

        return(contacts);
    },


    findContactByPhone: function (phone) {

        var dataSource = this.contactsDS;
        var queryCache = dataSource.filter();
        if (queryCache === undefined) {
            queryCache = {};
        }
        dataSource.filter( [{ field: "phone", operator: "eq", value: phone }]);
        var view = dataSource.view();
        var contact = view[0];
        dataSource.filter(queryCache);

        return(contact);
    },

    requestToConnect : function (contactId, comment) {
        var contact = contactModel.findContactByUUID(contactId);
        if (contact !== undefined) {
            if (contact.category !== 'unknown') {
                mobileNotify(contact.name + " is not a Chat Member!");
            } else {
                contact.set("connectSent",true);
                appDataChannel.connectRequest(contact.contactUUID, comment);
            }
        }

    },

    connectReceived : function (contactUUID) {
        var contact = contactModel.findContact(contactUUID);
        if (contact !== undefined) {
            if (contact.category !== 'unknown') {
                mobileNotify(contact.name + " is not a Chat Member!");
            } else {
                contact.set("connectReceived",true);
            }
        }
    },

    respondToConnect : function (contactId, accept, comment) {
        var contact = contactModel.findContactByUUID(contactId);
        if (contact !== undefined) {
            appDataChannel.connectReponse(contact.contactUUID, accept, comment);
            if (accept) {
                contactModel.updateContactDetails(contactId, function (contact) {

                });
            }
        }
    },



    blockContact : function (contactId) {
        var contact = contactModel.queryContact({ field: "uuid", operator: "eq", value: contactId });


        if (contact !== undefined) {
            contact.set('isBlocked', true);
            
            var contactList = contactModel.queryContactList({ field: "contactUUID", operator: "eq", value: contact.contactUUID });
            if (contactList !== undefined) {
                contactList.set('isBlocked', true);
            }
        }

    },

    unblockContact : function (contactId) {
        var contact = contactModel.queryContact({ field: "uuid", operator: "eq", value: contactId });
        if (contact !== undefined) {

            contact.set('isBlocked', false);
            
            var contactList = contactModel.queryContactList({ field: "contactUUID", operator: "eq", value: contact.contactUUID });
            if (contactList !== undefined) {
                contactList.set('isBlocked', false);
            }

        }
    },

    _syncContactDetails : function (contact, thisContact, thisContactList) {
        var isDirty = false;

        thisContact.set('contactUUID', contact.userUUID);
        thisContact.set('contactPhone', contact.phone);
        thisContactList.set('contactUUID', contact.userUUID);
        thisContactList.set('contactPhone', contact.phone);
        if (thisContact.phone !== contact.phone) {
            isDirty = true;
            thisContact.set('phoneUpdate', true);
            thisContactList.set('phoneUpdate', true);
        }
        thisContact.set('phoneValidated', contact.phoneValidated);
        thisContactList.set('phoneValidated', contact.phoneValidated);
        if (contact.userUUID !== undefined && contact.userUUID !== null) {
            if (thisContact.category !== 'member'){
                isDirty = true;
                thisContact.set('category', 'member');
                thisContact.set('memberUpdate', true);
                thisContactList.set('category', 'member');
                thisContactList.set('memberUpdate', true);
            }
        }

        thisContact.set('contactEmail', contact.email);
        thisContactList.set('contactEmail', contact.email);
        if(thisContact.email !== contact.email) {
            isDirty = true;
            thisContact.set('email', contact.email);
            thisContactList.set('email', contact.email);
            thisContact.set('emailUpdated', true);
            thisContactList.set('emailUpdated', true);
        }

        thisContact.set('emailValidated', contact.emailValidated);
        thisContact.set('contactPhoto', contact.photo);
        thisContact.set('contactAddress', contact.address);
        thisContactList.set('emailValidated', contact.emailValidated);
        thisContactList.set('contactPhoto', contact.photo);
        thisContactList.set('contactAddress', contact.address);
        if(thisContact.address !== contact.address) {
            thisContact.set('addressUpdate', true);
            thisContactList.set('addressUpdate', true);
        }

        thisContact.set('publicKey', contact.publicKey);
        thisContactList.set('publicKey', contact.publicKey);
        
    },


    // Get a full contact details update, including phone and email.
    updateContactDetails : function (contactId, callback) {
        // Get this contacts record...
        var thisContact = contactModel.findContactByUUID(contactId), thisContactList = contactModel.findContactListUUID(contactId);

        // If there's no contactUUID, need to lookup user by phone.
        if (thisContact.contactUUID === undefined || thisContact.contactUUID === null) {
            var phone  = thisContact.phone;
            memberdirectory.findMemberByPhone(phone, function (result) {
                var contact = result;
                
                contactModel._syncContactDetails(contact, thisContact, thisContactList);
                
                callback(thisContact);
                
            });

        } else {

           memberdirectory.findMemberByUUID(thisContact.contactUUID, function (result) {
               
                var contact = result;
    
                contactModel._syncContactDetails(contact, thisContact, thisContactList);
    
                callback(thisContact);
               
            });
        }


    },

    _cleanDupContacts : function (uuid) {
        var contactList = contactModel.findContactsUUID(uuid);

        if (contactList !== undefined && contactList.length > 0) {
            if (contactList.length > 1) {
                for (var i=0; i< contactList.length; i++) {
                    var contact = contactList[i];

                    if (contact.Id === undefined) {
                        mobileNotify("Cleaning duplicate channel");
                        contactModel.contactsDS.remove(contact);
                    }
                }
            }
        }
    },

   /* getContactStatusObject : function(contactUUID, callback) {
        var UserStatusModel = Parse.Object.extend("userStatus");
        var query = new Parse.Query(UserStatusModel);
        query.equalTo("userUUID", contactUUID);
        query.find({
            success: function(results) {
                if (results.length > 0) {
                    callback( results[0]);
                } else {
                    callback(null);
                }

            },
            error: function(error) {
                mobileNotify("Get Contact Status Error: " + error.code + " " + error.message);
                callback(null);
            }
        });
    },*/

    // force defined and === true overrides the timer
    updateContactListStatus : function (force) {
        var time = ggTime.currentTimeInSeconds();
        var index = 0, length = contactModel.contactListDS.total(), array = contactModel.contactListDS.data();
        if (length === 0)
            return;

        for (var i=0; i<length; i++) {
            var contact = contactModel.contactListDS.at(i);

            if (contact.lastUpdate === undefined) {
                contact.lastUpdate = time - 150;
            }
            if ( (contact.lastUpdate + 150) <= time ) {
                var contactId = contact.contactUUID;
               // contact.lastUpdate =  ggTime.currentTimeInSeconds();
                if (contactId !== undefined && contactId !== null) {
                    userStatus.getMemberStatus(contactId, function (error, user) {
                        if (error == null && user !== null) {
                            var userId = user.get('userUUID');
                            var contact = contactModel.findContactList(userId);
                            contact.set('statusMessage', user.statusMessage);
                            contact.set('currentPlace', user.currentPlace);
                            contact.set('currentPlaceUUID', user.currentPlaceUUID);
                            contact.set('googlePlaceId', user.googlePlaceId);
                            contact.set('lat', user.lat);
                            contact.set('lng', user.lng);
                            contact.set('isAvailable', user.getisAvailable);
                            contact.set('lastUpdate', ggTime.currentTimeInSeconds());
                        }
                    });
                }
            }
        }
    },

    // Process all invited contacts to see if they've become members
    updateInvitedContacts: function (e) {
        _preventDefault(e);
    },

    syncMemberContact: function (e) {
        _preventDefault(e);
    },


    syncInvitedContact : function (model) {
        if (model === undefined) {
            model = contactModel.currentContact;
        }
        mobileNotify("Updating contact info from ghostgrams...");
        var phone = model.get('phone');

        memberdirectory.findMemberByPhone(phone, function (result) {
            if (result !== null) {
                var uuid = model.get('uuid'), contactUUID = model.get('contactUUID'), publicKey = model.get('publicKey'),
                    phoneValidated = model.get('phoneValidated'),  emailValidated = model.get('emailValidated'), parseEmailVerified = result.emailValidated ;

                // Does the contact have a verified email address
                if (result.emailValidated) {
                    // Yes - save the email address the contact verified
                    model.set("email", result.email);
                }
                model.set('publicKey',  result.publicKey);

                model.set("contactUUID", result.userUUID);
         
                if (phoneValidated !== result.phoneValidated) {

                    if (result.phoneValidated){
                        model.set('category', "member");
                    }
                    model.set("phoneValidated", result.phoneValidated);
                 
                }
            }

        });

    },

    // Create a contact for channel member that this user isn't connected to
    // The contact is a valid member and connected to the channel owner
    createChatContact : function (userId, guid, callback) {
        var contact = contactModel.findContact(userId);
        var create = false;

        if (contact === undefined) {
            contact = new kendo.data.ObservableObject();
            create = true;
        }

        contact.set('version', contactModel._version);
        contact.set('ggType', contactModel._ggClass);
        contact.set("name", "New Member" );
        contact.set("alias", "new");
        contact.set('category', "member");
        contact.set("address", null);
        contact.set("group", null);
        contact.set("priority", 0);
        contact.set("isFavorite", false);
        contact.set("isBlocked", false);
        contact.set('Id', guid);
        contact.set("uuid", guid);
        contact.set("processing",true);

        var url = contactModel.createIdenticon(guid);
        contact.photo = null;
        contact.identicon = url;

        contactModel.contactsDS.add(contact);
        contactModel.contactsDS.sync();

        everlive.createOne(contactModel._cloudClass, contact, function (error, data){
            if (error !== null) {
                mobileNotify ("Error creating Chat Contact " + JSON.stringify(error));
            } else {

                contactModel._cleanDupContacts(contact.uuid);

            }
        });

        memberdirectory.findMemberByUUID(userId,  function (result) {
            if (result !== null) {

                contactModel.updateChatContact(guid, result.name, result.alias, result.userUUID, result.phone, result.email, result.publicKey);
                mobileNotify("Created New Contact for: " + result.name);

                if (callback !== undefined) {
                    callback(result);
                }

            }

        });

    },


    updateChatContact : function (guid, name, alias, contactUUID, contactPhone, contactEmail, contactKey) {


        var contact = contactModel.findContact(contactUUID);
        var create = false;

        if (contact === undefined || contact === null) {
            contact = new kendo.data.ObservableObject();

            create = true;
        }

        contact.set('version', contactModel._version);
        contact.set('ggType', contactModel._ggClass);
        contact.set("name", name );
        contact.set("alias", alias);
        contact.set('category', "member");
        contact.set("address", null);
        contact.set("group", null);
        contact.set("priority", 0);
        contact.set("isFavorite", false);
        contact.set("isBlocked", false);
        contact.set("uuid", guid);
        var url = contactModel.createIdenticon(guid);
        contact.photo = null;
        contact.identicon = url;
        contact.set('contactUUID', contactUUID);
        contact.set('phone', contactPhone);
        contact.set('email', contactEmail);
        contact.set('contactPhone', contactPhone);
        contact.set('contactEmail', contactEmail);
        contact.set('publicKey', contactKey);
        contact.set('ownerUUID', userModel._user.userUUID);

        if (create) {
            // Need to create this contact
            contactModel.contactsDS.add(contact);
            contactModel.contactsDS.sync();

            everlive.createOne(contactModel._cloudClass, contact, function (error, data) {
                if (error !== null) {
                    mobileNotify("Error creating Chat Contact " + JSON.stringify(error));
                } else {

                    contactModel._cleanDupContacts(contact.uuid);

                }
            });
        } else {
            everlive.updateOne(contactModel._cloudClass, contact, function (error, data) {
                if (error !== null) {
                    mobileNotify("Error updating Chat Contact " + JSON.stringify(error));
                } else {

                    contactModel._cleanDupContacts(contact.uuid);

                }
            });
        }


    },

    importDeviceContacts: function() {
        var options = new ContactFindOptions();
        options.filter = '';
        options.multiple = true;
        var fields = ["name", "displayName", "nickName", "phoneNumbers", "emails", "addresses", "photos"];

        navigator.contacts.find(fields, function(contacts) {

                contactModel.deviceContactsDS.data([]);
                var contactsCount = contacts.length;

                for (var i = 0; i < contactsCount; i++) {
                    var contactItem = new Object();
                    contactItem.type = "device";
                    contactItem.name = contacts[i].name.formatted;
                    contactItem.phoneNumbers = new Array();
                    contactItem.category = 'phone';
                    if (contacts[i].phoneNumbers !== null) {
                        for (var j = 0; j < contacts[i].phoneNumbers.length; j++) {
                            var phone = new Object();
                            phone.name = contacts[i].phoneNumbers[j].type + " : " + contacts[i].phoneNumbers[j].value;
                            phone.number = contacts[i].phoneNumbers[j].value;
                            contactItem.phoneNumbers.push(phone);
                        }
                    }

                    contactItem.emails = new Array();
                    if (contacts[i].emails !== null) {
                        for (var k = 0; k < contacts[i].emails.length; k++) {
                            var email = new Object();
                            email.name = contacts[i].emails[k].type + " : " + contacts[i].emails[k].value;
                            email.address = contacts[i].emails[k].value;
                            contactItem.emails.push(email);
                        }
                    }

                    contactItem.addresses = new Array();
                    if (contacts[i].addresses !== null) {
                        for (var a = 0; a < contacts[i].addresses.length; a++) {
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
                    contactItem.photos = [];
                    if (contacts[i].photos !== null) {
                        returnValidPhoto(contacts[i].photos[0].value, function(validUrl) {
                            contactItem.photos.push(validUrl);

                        });
                    }
                    
                    if (contactItem.phoneNumbers.length > 0)
                        contactModel.deviceContactsDS.add(contactItem);

                    // Only add device contacts with phone numbers
                }



            },
            function(error) {
                mobileNotify(error);
            }, options);

    }
};

