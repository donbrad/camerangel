/**
 * Created by donbrad on 8/11/15.
 *
 * contactModel.js -- handles all interactions with parse, kendo and local storage for contacts
 *
 */
'use strict';

var contactModel = {

   contactsDS: new kendo.data.DataSource({
        offlineStorage: "contacts",
        sort: {
            field: "name",
            dir: "asc"
        }
    }),


    deviceContactsDS: new kendo.data.DataSource({
        sort: {
            field: "name",
            dir: "asc"
        }
    }),

    // Contact data plus contact status
    contactListDS: new kendo.data.DataSource({
        offlineStorage: "contactlist",
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
    phoneArray: [],
    emailArray: [],


    init : function () {

        contactModel.contactListDS.online(false);

        // Reflect any core contact changes to contactList
        contactModel.contactsDS.bind("change", function (e) {
            var data = this.data();
            var ds = contactModel.contactListDS;



        });

        /*  contactModel.contactsDS = parseKendoDataSourceFactory.make('contacts',
          {
                id: 'id',
                fields: {
                    uuid: {
                        editable: false,
                        nullable: false
                    },
                    category: {
                        editable: true,
                        nullable: false,
                        defaultValue: 'new'
                    },
                    address: {
                        editable: true,
                        nullable: true
                    },
                    name: {
                        editable: true,
                        nullable: false
                    },
                    alias: {
                        editable: true,
                        nullable: true
                    },
                    email: {
                        editable: true,
                        nullable: false
                    },
                    phone: {
                        editable: true,
                        nullable: false
                    },
                    location: {
                        editable: true,
                        nullable: true
                    },
                    photo: {
                        editable: true,
                        nullable: true
                    },
                    parsePhoto: {
                        editable: false,
                        nullable: true,
                        type: 'Parse.File'
                    },
                    message: {
                        editable: true,
                        nullable: true
                    },
                    contactEmail: {
                        editable: true,
                        nullable: true
                    },
                    contactPhone: {
                        editable: true,
                        nullable: true
                    },
                    contactUUID: {
                        editable: true,
                        nullable: true
                    },
                    publicKey: {
                        editable: true,
                        nullable: true
                    },
                    group: {
                        editable: true,
                        nullable: true
                    },
                    statusMessage: {
                        editable: true,
                        nullable: true
                    },
                    currentPlace: {
                        editable: true,
                        nullable: true
                    },
                    currentPlaceUUID: {
                        editable: true,
                        nullable: true
                    },
                    lastInvite: {
                        editable: true,
                        type: 'number'
                    },
                    lastStatusFetch: {
                        editable: true,
                        type: 'number'
                    },
                    priority: {
                        editable: true,
                        type: 'number',
                        default: 0
                    },
                    phoneVerified: {
                        editable: true,
                        type: 'boolean',
                        default: false
                    },
                    emailValidated: {
                        editable: true,
                        type: 'boolean',
                        default: false
                    },
                    isAvailable: {
                        editable: true,
                        type: 'boolean'
                    },
                    isVisible: {
                        editable: true,
                        type: 'boolean',
                        default: true
                    },
                    inviteSent: {
                        editable: true,
                        type: 'boolean',
                        default: false
                    },
                    isBlocked: {
                        editable: true,
                        type: 'boolean',
                        default: false
                    },
                    isFavorite: {
                        editable: true,
                        type: 'boolean',
                        default: false
                    }

                }
            },
            false,
            { // SortBy
                field: "name",
                dir: "asc"
            },
            undefined // group by category: new, member, invited
            )*/
    },

    fetch : function () {
        var ContactModel = Parse.Object.extend("contacts");
        var ContactCollection = Parse.Collection.extend({
            model: ContactModel
        });

        var contacts = new ContactCollection();

        contacts.fetch({
            success: function(collection) {
                var models = [];
                for (var i = 0; i < collection.models.length; i++) {
                    var model = collection.models[i];
                   // Set the photo to identicon
                    var url = contactModel.createIdenticon(model.get('uuid'));
                    model.set('photo', url);

                    models.push(model.attributes);
                }
                deviceModel.setAppState('hasContacts', true);
                contactModel.contactsDS.data(models);

                // Update contactlistDs and get latest status for contacts
                contactModel.contactListDS.data(models);
                contactModel.updateContactListStatus();
                
                deviceModel.isParseSyncComplete();
            },
            error: function(collection, error) {
                handleParseError(error);
            }
        });
    },

    createIdenticon: function (hash) {
        var url;
        hash = hash.replace(/-/g,'');
        jdenticon.update("#identiconCanvas", hash);
        var canvas = document.getElementById("identiconCanvas");
        url = canvas.toDataURL('image/png');
        return(url);
    },

    delete: function() {

        var uuid = contactModel.currentContact.uuid;
        this.deleteContact(uuid);

    },

    deleteContact : function (contactId) {
        var dataSource = contactModel.contactsDS;
        var uuid = contactId;

        dataSource.filter( { field: "uuid", operator: "eq", value: uuid });
        var view = dataSource.view();
        var contact = view[0];
        dataSource.filter([]);
        dataSource.remove(contact);

        deleteParseObject("contacts", 'uuid', uuid);

        // If there's a private channel for this contact, need to delete it.
        var localChannel = channelModel.findPrivateChannel(uuid);
        if (localChannel !== undefined) {
            channelModel.deleteChannel(localChannel);
        }

    },

    deleteAllContacts : function () {
        var contactsArray = this.contactsDS.data();

        for  (var i=0; i<contactsArray.length; i++) {
            this.deleteContact(contactsArray[i].uuid);
        }
    },

    findContact: function (contactUUID) {
        var dataSource = contactModel.contactsDS; 
        dataSource.filter( { field: "contactUUID", operator: "eq", value: contactUUID });
        var view = dataSource.view();
        var contact = view[0];
        dataSource.filter([]);

        return(contact);
    },


    findContactByUUID : function(uuid) {
        var dataSource = contactModel.contactsDS;
        dataSource.filter( { field: "uuid", operator: "eq", value: uuid });
        var view = dataSource.view();
        var contact = view[0];
        dataSource.filter([]);

        return(contact);
    },

    findContactList : function (contactUUID) {
        var dataSource = contactModel.contactListDS;
        dataSource.filter( { field: "contactUUID", operator: "eq", value: contactUUID });
        var view = dataSource.view();
        var contact = view[0].items[0];
        dataSource.filter([]);

        return(contact);
    },

    findContactListUUID : function ( uuid) {
        var dataSource = contactModel.contactListDS;
        dataSource.filter( { field: "uuid", operator: "eq", value: uuid });
        var view = dataSource.view();
        var contact = view[0].items[0];
        dataSource.filter([]);

        return(contact);
    },


    findContactByPhone: function (phone) {
        var dataSource = this.contactsDS;
        dataSource.filter( { field: "phone", operator: "eq", value: phone });
        var view = dataSource.view();
        var contact = view[0];
        dataSource.filter([]);

        return(contact);
    },

    // Get a full contact status update, including phone and email.
    updateContactDetails : function (contactId, callback) {
        // Get this contacts record...
        var thisContact = contactModel.findContactByUUID(contactId);

        // If there's no contactUUID, need to lookup user by phone.
        if (thisContact.contactUUID === undefined || thisContact.contactUUID === null) {
            var phone  = thisContact.phone;
            findUserByPhone(phone, function (result) {
                if (result.found) {
                    var contact = result.user;
                    var current = thisContact;

                    current.set('contactUUID', contact.userUUID);
                    current.set('contactPhone', contact.phone);
                    current.set('phoneVerified', contact.phoneVerified);
                    if (contact.phoneVerified) {
                        current.set('category', 'member');
                    }
                    current.set('contactEmail', contact.email);
                    current.set('emailValidated', contact.emailVerified);
                    current.set('contactPhoto', contact.photo);
                    current.set('isAvailable', contact.isAvailable);
                    current.set('publicKey', contact.publicKey);


                    callback(current);

                } else {
                    // No user data -- just return the current contact model
                    callback(thisContact);
                }

            });
        } else {

            getUserContactInfo(thisContact.contactUUID, function (result) {
                if (result.found) {
                    var contact = result.user;
                    var current = thisContact;
                    current.set('contactUUID', contact.userUUID);
                    current.set('phoneVerified', contact.phoneVerified);
                    if (contact.phoneVerified) {
                        current.set('category', 'member');
                    }
                    current.set('contactPhone', contact.phone);
                    current.set('contactEmail', contact.email);
                    current.set('emailValidated', contact.emailVerified);
                    current.set('contactPhoto', contact.photo);
                    current.set('publicKey', contact.publicKey);

                    callback(current);
                } else {
                    // No user data -- just return the current contact model
                    callback(thisContact);
                }

            });
        }


    },

    getContactStatusObject : function(contactUUID, callback) {
        var UserStatusModel = Parse.Object.extend("userStatus");
        var query = new Parse.Query(UserStatusModel);
        query.equalTo("userUUID", contactUUID);
        query.find({
            success: function(results) {
                if (results.length > 0) {
                    callback( results[0]);
                } else {
                    // No current userStatusObject
                    getUserContactInfo(contactUUID, function(result) {
                        if (result.found) {
                            callback(result.user);
                        } else {
                            callback(null);
                        }
                    });
                }

            },
            error: function(error) {
                mobileNotify("Get Contact Status Error: " + error.code + " " + error.message);
                callback(null);
            }
        });
    },

    updateContactListStatus : function () {
        var time = ggTime.currentTimeInSeconds();

        // Only sync contacts every 15 minutes
        if (time < contactModel.lastSyncTime + 900) {
            return;
        }

        contactModel.lastSyncTime = time;

        var index = 0, length = contactModel.contactsDS.total(), array = contactModel.contactsDS.data();

        for (var i=0; i<length; i++) {
            var contactId = array[i].contactUUID;
            if (contactId !== undefined && contactId !== null) {
                contactModel.getContactStatusObject(contactId, function(user){
                    var userId = user.get('userUUID');
                    var contact = contactModel.findContactList(userId);
                    contact.set('statusMessage', user.get('statusMessage'));
                    contact.set('currentPlace', user.get('currentPlace'));
                    contact.set('currentPlaceUUID', user.get('currentPlaceUUID'));
                    contact.set('isAvailable', user.get('isAvailable'));

                });
            }
        }
    },


    syncMemberContact: function (e) {

    },


    syncInvitedContact : function (model) {
        if (model === undefined) {
            model = contactModel.currentContact;
        }
        mobileNotify("Updating contact info from ghostgrams...");
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
                    contactItem.photo = 'images/default-img.png';
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



            },
            function(error) {
                mobileNotify(error);
            }, options);

    }
};

