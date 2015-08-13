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
    currentContact: new kendo.data.ObservableObject(),
    phoneDS: new kendo.data.DataSource(),
    emailDS: new kendo.data.DataSource(),
    addressDS: new kendo.data.DataSource(),
    phoneArray: [],
    emailArray: [],

    setCurrent : function (contact) {

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
                    // Load the contactPhoto data from parse and update the url
                    var contactPhoto = model.get("parsePhoto");
                    if (contactPhoto !== undefined && contactPhoto !== null)
                        model.set('photo', contactPhoto._url);
                    models.push(model.attributes);

                }
                if (models.length > 0) {
                    APP.setAppState('hasContacts', true);
                }
               contactModel.contactsDS.data(models);
            },
            error: function(collection, error) {
                handleParseError(error);
            }
        });
    },

    delete: function() {
        var dataSource = this.contactsDS;
        var uuid = this.currentContact.uuid;

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
    }
};