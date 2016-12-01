/**
 * Created by donbrad on 8/13/16.
 */

'use strict';

var groupModel = {

    _version: 1,
    _cloudClass : 'group',
    _ggClass : 'Group',
    _fetched : false,
    _initialSync : false,
    groupsDS : null,

    init : function() {
        groupModel.groupsDS = new kendo.data.DataSource({
            type: 'everlive',
            transport: {
                typeName: 'group',
                dataProvider: APP.everlive
            },
            schema: {
                model: { id:  Everlive.idField}
            }
        });

        // Reflect any core contact changes to contactList
        groupModel.groupsDS.bind("change", function (e) {
            // Rebuild the contactList cache when the underlying list changes: add, delete, update...
            //placesModel.syncPlaceListDS();
            var changedGroups = e.items;

            if (e.action === undefined) {
                if (changedGroups !== undefined && !groupModel._initialSync) {

                    groupModel._initialSync = true;

                }
            } else  {
                switch (e.action) {
                    case "itemchange" :
                        var field  =  e.field;
                        var group = e.items[0], groupUUID = group.uuid;
                      /*  var groupList = groupModel.findGroup(placeUUID);

                        // if the places's name or alias has been updated, need to update the tag...
                        var tagList = tagModel.findTagByCategoryId(place.uuid);
                        if (tagList.length > 0) {
                            var placeTag = tagList[0];
                            placeTag.set('alias',place.alias);
                            placeTag.set('name', place.name);
                        }


                        if (groupList !== undefined)
                        //placeList[field] = place [field];
                            placeList.set(field, place[field]);
*/
                        break;

                    case "remove" :
                        // delete from places
                        break;

                    case "sync" :
                        // syncing all places...
                        if (changedGroups !== undefined) {
                            var len = changedGroups.len;
                        }
                        break;

                    case "add" :
                        var group = e.items[0];
                        // add to group tags
                        tagModel.addGroupTag(group.name, group.alias, '', group.uuid);
                        groupModel.updateGroupContacts(group);
                        break;
                }
            }


        });

        groupModel.groupsDS.bind("requestEnd", function (e) {
            var response = e.response,  type = e.type;

            if (type === 'read' && response) {
                if (!groupModel._fetched){
                    groupModel._fetched = true;
                }

            }

        });

        groupModel.groupsDS.fetch();
    },


    clearStorage : function () {
        groupModel.groupsDS.data([]);
        groupModel._fetched = false;
        groupModel._initialSync = false;
    },


    addGroup : function (group) {

        if (group.Id === undefined) {
            group.Id = group.uuid;
        }
        groupModel.groupsDS.add(group);
        groupModel.groupsDS.sync();

        if (deviceModel.isOnline()) {
            everlive.createOne(groupModel._cloudClass, group, function (error, data){
                if (error !== null) {
                    ggError ("Error creating group " + JSON.stringify(error));

                }
            });
        }
    },

    deleteGroup : function (group) {
        var uuid = group.uuid;

        var group = groupModel.findGroup(uuid);

        if (group !== undefined) {
            groupModel.groupsDS.remove(group);
            groupModel.groupsDS.sync();
        }
    },

    sync : function () {
        groupModel.groupsDS.sync();
    },

    normalizeGroup : function (groupString) {

        var normGroup = groupString.toLowerCase();

        // normTag = normTag.replace(' ', '_');

        return (normGroup);
    },

    unnormalizeGroup: function (groupString) {

        // var tag = normTag.replace('_', ' ');

        var group = groupString.capitalize('title');

        return(group);

    },

    queryGroups: function (query) {
        if (query === undefined)
            return(undefined);
        var dataSource = groupModel.groupsDS;
        var cacheFilter = dataSource.filter();
        if (cacheFilter === undefined) {
            cacheFilter = {};
        }
        
        dataSource.filter( query);
        var view = dataSource.view();

        dataSource.filter(cacheFilter);

        return(view);
    },

    findGroup : function (uuid) {

        var groups = groupModel.queryGroups({field: "uuid", operator: "eq", value: uuid});

        if (groups.length === 0) {
            return(null);
        }
        return (groups[0]);
    },

    findContact : function (uuid) {

        var groups = groupModel.queryGroups({field: "members", operator: "contains", value: uuid});

        if (groups.length === 0) {
            return(null);
        }
        return (groups);
    },

    checkIdenticon : function (group) {
        if (group !== undefined && group !== null) {

            if  (group.useIdenticon || group.photoUrl === null || group.photoUrl === '') {
                group.photoUrl = contactModel.createIdenticon(group.uuid);
            }
        }
    },

    _findContactGroups : function (contactUUID) {
        var groupArray = [];
        for (var i=0; i<groupModel.groupsDS.total(); i++) {
            var group = groupModel.groupsDS.at(i);
            var members = group.members;

            for (var j=0; j<members.length; j++) {
                var member = members[j];

                if (member === contactUUID) {
                    groupArray.push(group);
                }
            }
        }

        return (groupArray);
    },

    getContactGroups : function (contactUUID) {
        var groups = groupModel._findContactGroups(contactUUID);
        var groupArray = [];
        if (groups.length === 0) {
            return(groupArray);
        }

        for (var i=0; i< groups.length; i++) {
            groupArray.push(groups[i].uuid);
        }
        return (groupArray);
    },

    getContactGroupString : function (contactUUID) {
        var groups = groupModel._findContactGroups(contactUUID);
        var groupString = '';

        if (groups.length === 0) {
            return(groupString);
        }
        for (var i=0; i<groups.length; i++) {
            groupString += groups[i].title + ',';
        }

        groupString = groupString.slice(0,-1);

        return(groupString);
    },

    updateGroupContacts : function (group) {
        if (group === null || group.members.length === 0) {
           return;
        }

        var members = group.members;

        for (var i=0; i<members.length; i++) {
            var contactUUID = members[i];
            var contact = contactModel.findContactByUUID(contactUUID);

            if (contact !== undefined && contact !== null) {
                var groups = groupModel.getContactGroups(contactUUID);
                var groupString = groupModel.getContactGroupString(contactUUID);

                contact.set('groups', groups);
                contact.set('groupString', groupString);

                contactModel.sync();
            }
        }

    },

    getMemberContacts : function (group) {
        if (group === null || group.members === null) {
            return(null)
        }

        var members = group.members, contactArray = [];

        for (var i=0; i<members.length; i++) {
            var contact = contactModel.findContactByUUID(members[i]);
            if (contact !== null && contact !== undefined) {
                contactArray.push(contact);
            }
        }

        return (contactArray);

    },

    getGroupNamesString : function (group) {
        if (group === null ) {
            return(null)
        }
        var nameStr = '', members =  groupModel.getMemberContacts(group);

        for (var i=0; i<members.length; i++) {
            nameStr = members[i].phone + ',';
        }

        nameStr = nameStr.substring(0, nameStr.length-1);

        return(nameStr);
    },

    getGroupPhoneString : function (group) {
        if (group === null ) {
            return(null)
        }
        var phoneStr = '', members =  groupModel.getMemberContacts(group);

        for (var i=0; i<members.length; i++) {
            phoneStr = members[i].phone + ',';
        }

        phoneStr = phoneStr.substring(0, phoneStr.length-1);

        return(phoneStr);
    },


    getGroupEmailString : function (group) {
        if (group === null ) {
            return(null)
        }
        var emailStr = '', members = groupModel.getMemberContacts(group);

        for (var i=0; i<members.length; i++) {
            emailStr = members[i].email + ',';
        }

        emailStr = emailStr.substring(0, emailStr.length-1);

        return(emailStr);
    }

};