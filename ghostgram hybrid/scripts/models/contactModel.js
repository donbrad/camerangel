/**
 * Created by donbrad on 8/11/15.
 *
 * contactModel.js -- handles all interactions with parse, kendo and local storage for contacts
 *
 */
'use strict';

var contactModel = {

    contactsDS: new kendo.data.DataSource({
        offlineStorage: "contacts-offline",
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
    contactListDS: new kendo.data.DataSource({
        group: 'category'
    }),

    currentDeviceContact: {},
    unifiedDeviceContact: false,
    currentContact: new kendo.data.ObservableObject(),
    phoneDS: new kendo.data.DataSource(),
    emailDS: new kendo.data.DataSource(),
    addressDS: new kendo.data.DataSource(),
    phoneArray: [],
    emailArray: [],



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
                    // Load the contactPhoto data from parse and update the url
                    var contactPhoto = model.get("parsePhoto");
                    if (contactPhoto !== undefined && contactPhoto !== null)
                        model.set('photo', contactPhoto._url);
                    models.push(model.attributes);

                }
                deviceModel.setAppState('hasContacts', true);
                contactModel.contactsDS.data(models);
                deviceModel.isParseSyncComplete();
            },
            error: function(collection, error) {
                handleParseError(error);
            }
        });
    },

    delete: function() {
        var dataSource = contactModel.contactsDS;
        var uuid = contactModel.currentContact.uuid;

        //var string = "Deleted contact: " + APP.models.contacts.currentContact.name + " ("+ APP.models.contacts.currentContact.alias + ")" ;

        dataSource.filter( { field: "uuid", operator: "eq", value: uuid });
        var view = dataSource.view();
        var contact = view[0];
        dataSource.filter([]);
        dataSource.remove(contact);

        deleteParseObject("contacts", 'uuid', uuid);
    },

    getContactModel: function (contactUUID) {
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

    findContactByPhone: function (phone) {
        var dataSource = this.contactsDS;
        dataSource.filter( { field: "phone", operator: "eq", value: phone });
        var view = dataSource.view();
        var contact = view[0];
        dataSource.filter([]);

        return(contact);
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