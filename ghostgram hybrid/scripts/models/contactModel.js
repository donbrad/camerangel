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
    _parseClass: 'contacts',

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
    phoneArray: [],
    emailArray: [],
    contactList: [],


    init : function () {


        contactModel.contactsDS = new kendo.data.DataSource({
            type: 'everlive',
            offlineStorage: "contacts",
            transport: {
                typeName: 'contacts',
                dataProvider: APP.everlive
            },
            schema: {
                model: { id:  Everlive.idField}
            },
            sort: {
                field: "name",
                dir: "asc"
            }
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
                        // delete from contact list

                        break;

                    case "add" :
                        var contact = e.items[0];
                        // add to contactlist and contacttags
                        var contactList = contactModel.findContactList(contact.uuid);
                        if (contactList !== undefined)
                            contactModel.contactListDS.add(contact);

                        tagModel.addContactTag(contact.name, contact.alias, '', contact.uuid);
                         break;
                }
            }


        });

        contactModel.contactsDS.fetch();
        contactModel.contactsDS.sync();
        contactModel.buildContactList();
        contactModel.updateContactListStatus(true);
        contactModel.syncContactTags();
        deviceModel.setAppState('hasContacts', true);
        deviceModel.isParseSyncComplete();

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


    fetch : function () {

        var parseContactModel = Parse.Object.extend(contactModel._parseClass);
        var query = new Parse.Query(parseContactModel);
        query.limit(1000);

        query.find({
            success: function(collection) {
                contactModel.contactsDS.data([]);
                var models = [];
                for (var i = 0; i < collection.length; i++) {
                    var model = collection[i];

                    var identicon = model.get('identicon');
                    if (identicon === undefined || identicon === null || identicon === '') {
                        var contactId = model.get('uuid');
                        if (contactId !== undefined) {
                            var url = contactModel.createIdenticon(contactId);
                            model.set('identicon', url);
                        }

                    }

                    if (model.get('groups') === undefined){
                        model.set('groups', []);
                    }
                   /* var dirty = false;


                    var identicon = model.get('identicon');
                    if (identicon === undefined || identicon === null || identicon === '') {
                        var url = contactModel.createIdenticon(model.get('uuid'));
                        model.set('identicon', url);
                    }
                  //  var photo = model.get('photo');
                   // if (photo === undefined || photo === null || photo === '') {
                        model.set('photo', url);
                   // }
                    //Push to the ownerUUID to legacy contacts...
                    if (model.get('ownerUUID') === undefined) {
                        model.set('ownerUUID', userModel.currentUser.userUUID);
                        dirty = true;
                    }

                    if (model.get('_ggType') === undefined) {
                        model.set('ggType', contactModel._ggClass);
                        dirty = true;
                    }

                    if (model.get('contactPhoto') === undefined) {
                        model.set('contactPhoto', null);
                        dirty = true;
                    }
                    if (model.get('isBlocked') === undefined) {
                        model.set('isBlocked', false);
                        dirty = true;
                    }
                    if (model.get('isFavorite') === undefined) {
                        model.set('isFavorite', false);
                        dirty = true;
                    }

                    if (model.get('emailValidated') === undefined) {
                        model.set('emailValidated', false);
                        dirty = true;
                    }

                    if (model.get('isDeleted') === undefined) {
                        model.set('isDeleted', false);
                        dirty = true;
                    }

                    if (model.get('connectSent') === undefined) {
                        model.set('connectSent', false);
                        dirty = true;
                    }

                    if (model.get('connectReceived') === undefined) {
                        model.set('connectReceived', false);
                        dirty = true;
                    }

                    if (model.get('contactAddress') === undefined) {
                        model.set('contactAddress', null);
                        dirty = true;
                    }

                    var phone = model.get('phone'), contactPhone = model.get('contactPhone');

                    if (phone === undefined) {
                        phone = null;
                    }
                    if (phone === null && contactPhone !== null) {
                        model.set('phone', contactPhone);
                        dirty = true;
                    }

                    if (model.get('version') === undefined) {
                        model.set('version', 1);
                        dirty = true;
                    }

                    if (dirty)
                        model.save();*/
                    var data = model.toJSON();

                    models.push(data);
                }

                everlive.getCount('contacts', function(error, count){
                    if (error === null && count === 0) {
                        everlive.createAll('contacts', models, function (error1, data) {
                            if (error1 !== null) {
                                mobileNotify("Everlive contacts error " + JSON.stringify(error1));
                            }
                            contactModel.contactsDS.sync();
                            contactModel.buildContactList();
                            contactModel.updateContactListStatus(true);
                            contactModel.syncContactTags();
                            deviceModel.setAppState('hasContacts', true);
                            deviceModel.isParseSyncComplete();
                        });
                    } else {
                        if (error !== null)
                            mobileNotify("Everlive contacts error " + JSON.stringify(error));

                        contactModel.contactsDS.fetch();
                        contactModel.buildContactList();
                        contactModel.updateContactListStatus(true);
                        contactModel.syncContactTags();
                        deviceModel.setAppState('hasContacts', true);
                        deviceModel.isParseSyncComplete();
                    }

                });




                // Update contactlistDs and get latest status for contacts
               // contactModel.contactListDS.data(models);


            },
            error: function(error) {
                handleParseError(error);
            }
        });
    },

    setCurrentContact: function (contact) {
        if (contact !== undefined && contact !== null) {
            contactModel.currentContact = contact;
        } else {
            contactModel.currentContact = null;
        }
    },

    // Build an identity list for contacts indexed by contactUUID
    buildContactList : function () {
        var array = contactModel.contactsDS.data();
        contactModel.contactListDS.data([]);
        contactModel.contactList = [];

        for (var i=0; i<array.length; i++) {
            var contact = (array[i]).toJSON();
            if (contact.contactUUID !== undefined && contact.contactUUID !== null) {
                contactModel.contactList[contact.contactUUID] = {
                    uuid: contact.uuid,
                    contactId: contact.contactUUID,
                    name: contact.name,
                    alias: contact.alias,
                    phone: contact.phone,
                    address: contact.address,
                    category: contact.category,
                    identicon: contact.identicon,
                    email: contact.email,
                    photo: contact.photo,
                    isDeleted: contact.isDeleted,
                    isBlocked: contact.isBlocked
                };
            }

            contactModel.contactListDS.add(contact);
        }

        contactModel.contactListDS.fetch();
    },

    addContactToContactList : function (contact) {
        var newContact = {
            uuid: contact.uuid,
            contactId: contact.contactUUID,
            name: contact.name,
            alias: contact.alias,
            phone: contact.phone,
            address: contact.address,
            category: contact.category,
            identicon: contact.identicon,
            email: contact.email,
            photo: contact.photo,
            isDeleted: contact.isDeleted,
            isBlocked: contact.isBlocked
        };

        contactModel.contactList[contact.contactUUID] = newContact;
    },

    inContactList : function (contactUUID) {
        return(contactModel.contactList[contactUUID]);
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

          /*  updateParseObject("contacts", 'uuid', contactId, "isDeleted", true);
            updateParseObject("contacts", 'uuid', contactId, "category", 'zapped');
            updateParseObject("contacts", 'uuid', contactId, "xcategory", contact.get('xcategory'));
*/
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

           /* updateParseObject("contacts", 'uuid', contactId, "isDeleted", false);
            updateParseObject("contacts", 'uuid', contactId, "category", xcategory);
            updateParseObject("contacts", 'uuid', contactId, "xcategory", null);
*/
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

    findContactList : function (contactUUID) {
        var contact = contactModel.queryContactList({ field: "contactUUID", operator: "eq", value: contactUUID });

        return(contact);
    },

    findContactListUUID : function ( uuid) {
        var contact = contactModel.queryContactList({ field: "uuid", operator: "eq", value: uuid });

        return(contact);
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
                //updateParseObject("contacts", 'uuid', contactId, "connectSent", true);
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
                updateParseObject("contacts", 'uuid', contactId, "connectReceived", true);
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
            //updateParseObject("contacts", 'uuid', contactId, "isBlocked", true);
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

            //updateParseObject("contacts", 'uuid', contactId, "isBlocked", false);
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
        thisContact.set('phoneVerified', contact.phoneVerified);
        thisContactList.set('phoneVerified', contact.phoneVerified);
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

        thisContact.set('emailValidated', contact.emailVerified);
        thisContact.set('contactPhoto', contact.photo);
        thisContact.set('contactAddress', contact.address);
        thisContactList.set('emailValidated', contact.emailVerified);
        thisContactList.set('contactPhoto', contact.photo);
        thisContactList.set('contactAddress', contact.address);
        if(thisContact.address !== contact.address) {
            thisContact.set('addressUpdate', true);
            thisContactList.set('addressUpdate', true);
        }

        thisContact.set('publicKey', contact.publicKey);
        thisContactList.set('publicKey', contact.publicKey);

        /*if (isDirty) {
            updateParseObject('contacts', 'uuid', thisContact.uuid, 'category', thisContact.category);
            updateParseObject('contacts', 'uuid', thisContact.uuid, 'publicKey', thisContact.publicKey);
            updateParseObject('contacts', 'uuid', thisContact.uuid, 'contactPhone', thisContact.contactPhone);
            updateParseObject('contacts', 'uuid', thisContact.uuid, 'contactEmail', thisContact.contactEmail);
            updateParseObject('contacts', 'uuid', thisContact.uuid, 'contactPhoto', thisContact.contactPhoto);
            updateParseObject('contacts', 'uuid', thisContact.uuid, 'contactAddress', thisContact.contactAddress);
            updateParseObject('contacts', 'uuid', thisContact.uuid, 'phone', thisContact.phone);
            updateParseObject('contacts', 'uuid', thisContact.uuid, 'phoneVerified', thisContact.phoneVerified);
            updateParseObject('contacts', 'uuid', thisContact.uuid, 'email', thisContact.email);
            updateParseObject('contacts', 'uuid', thisContact.uuid, 'emailValidated', thisContact.emailValidated);
            updateParseObject('contacts', 'uuid', thisContact.uuid, 'address', thisContact.address);

        }
*/
    },


    // Get a full contact details update, including phone and email.
    updateContactDetails : function (contactId, callback) {
        // Get this contacts record...
        var thisContact = contactModel.findContactByUUID(contactId), thisContactList = contactModel.findContactListUUID(contactId);

        // If there's no contactUUID, need to lookup user by phone.
        if (thisContact.contactUUID === undefined || thisContact.contactUUID === null) {
            var phone  = thisContact.phone;
            findUserByPhone(phone, function (result) {
                if (result === null) {
                    console.error("findUserByPhone got Null" + phone);
                    return;
                }
                if (result.found) {
                    var contact = result.user;


                    contactModel._syncContactDetails(contact, thisContact, thisContactList);


                    callback(thisContact);

                } else {
                    // No user data -- just return the current contact model
                    callback(thisContact);
                }

            });

        } else {

            getUserContactInfo(thisContact.contactUUID, function (result) {
                if (result === null) {
                    console.error("getUseContactInfo got Null" + thisContact.contactUUID);
                    return;
                }
                if (result.found) {
                    var contact = result.user;

                    contactModel._syncContactDetails(contact, thisContact, thisContactList);

                    callback(thisContact);
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
                    callback(null);
                }

            },
            error: function(error) {
                mobileNotify("Get Contact Status Error: " + error.code + " " + error.message);
                callback(null);
            }
        });
    },

    // force defined and === true overrides the timer
    updateContactListStatus : function (force) {
        var time = ggTime.currentTimeInSeconds();
        var index = 0, length = contactModel.contactListDS.total(), array = contactModel.contactListDS.data();
        if (length === 0)
            return;

        for (var i=0; i<length; i++) {
            var contact = contactModel.contactListDS.at(i);
            if (contact.lastUpdate === undefined || contact.lastUpdate > time + 900) {
                var contactId = contact.contactUUID;
                if (contactId !== undefined && contactId !== null) {
                    contactModel.getContactStatusObject(contactId, function (user) {
                        if (user !== undefined && user !== null) {
                            var userId = user.get('userUUID');
                            var contact = contactModel.findContactList(userId);
                            contact.set('statusMessage', user.get('statusMessage'));
                            contact.set('currentPlace', user.get('currentPlace'));
                            contact.set('currentPlaceUUID', user.get('currentPlace  UUID'));
                            contact.set('isAvailable', user.get('isAvailable'));
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
              /*  if (contactUUID === undefined) {
                    updateParseObject('contacts', 'uuid', uuid, 'contactUUID',  result.user.userUUID);
                }

                if (publicKey === undefined) {
                    updateParseObject('contacts', 'uuid', uuid, 'publicKey',result.user.publicKey );
                }*/
                if (phoneVerified !== result.user.phoneVerified) {
                    if (result.user.phoneVerified === undefined)
                        result.user.phoneVerified = false;

                    if (result.user.phoneVerified){
                        model.set('category', "member");
                    }
                    model.set("phoneVerified", result.user.phoneVerified);
                  /*  updateParseObject('contacts', 'uuid', uuid, 'phoneVerified', result.user.phoneVerified );*/
                }
            }

        });

    },

    // Create a contact for channel member that this user isn't connected to
    // The contact is a valid member and connected to the channel owner
    createChatContact : function (userId, callback) {

        getUserContactInfo(userId, function (result) {
            if (result.found) {
                var guid = uuid.v4();
                var contact = {};
                contact.isContact = true;
                contact.uuid = result.user.userUUID;
                contact.alias = result.user.alias;
                contact.name = result.user.name;
                var url = contactModel.createIdenticon(guid);
                contact.photo = url;
                contact.publicKey = null;


               /* currentChannelModel.memberList[contact.uuid] = contact;
                currentChannelModel.membersDS.add(contact);*/
                contactModel.addChatContact(guid, contact.name, contact.alias, contact.uuid);
                mobileNotify("Created New Contact for: " + contact.name);

                if (callback !== undefined) {
                    callback(contact);
                }

            }

        })

    },


    addChatContact : function (guid, name, alias, contactUUID) {
      /*  var Contacts = Parse.Object.extend("contacts");
        var contact = new Contacts();


        contact.setACL(userModel.parseACL);*/

        var contact = new kendo.data.ObservableObject();
        contact.set('version', contactModel._version);
        contact.set('ggType', contactModel._ggClass);
        contact.set("name", name );
        contact.set("alias", alias);
        contact.set('category', "unknown");
        contact.set("address", null);
        contact.set("group", null);
        contact.set("priority", 0);
        contact.set("isFavorite", false);
        contact.set("isBlocked", false);
        contact.set("uuid", guid);
        contact.set('contactUUID', contactUUID);
        contact.set('contactPhone', null);
        contact.set('contactEmail', null);
        contact.set('ownerUUID', userModel.currentUser.userUUID);

        contactModel.contactsDS.add(contact);
        contactModel.contactsDS.sync();


        /*contact.save(null, {
            success: function(contact) {
                // Execute any logic that should take place after the object is saved.;
                //var photo = contact.get('photo');
                var url = contactModel.createIdenticon(guid);
                contact.set('photo',url);
                // Don't set actual phone and email for this contact until connected...
                contact.set('contactPhone', contact.phone);
                contact.set('phoneVerified', contact.phoneVerified);
                contact.set('contactEmail', contact.email);
                contact.set('emailVerified', contact.emailVerified);

                var contactObj = contact.toJSON();
                contactModel.addContactToContactList(contactObj);
                contactModel.contactsDS.add(contact.attributes);

                //contactModel.contactListDS.add(contact.attributes);
                //addContactView.closeModal();
            },
            error: function(contact, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                handleParseError(error);
            }
        });*/
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

