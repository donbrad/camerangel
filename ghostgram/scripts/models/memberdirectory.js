/**
 * Created by donbrad on 3/15/16.
 *
 * memberdirectory model -- updates and access to ghostgrams member directory
 *
 */


'use strict';

var memberdirectory = {

    _ggClass : 'memberdirectory',
    _version : 1,
    _id : null,
    _member : new kendo.data.ObservableObject(),

    setMember : function (member) {
        memberdirectory._member.id = memberdirectory._id;
        memberdirectory._member.userUUID = member.userUUID;
        userModel._user.set('id', memberdirectory._member.id);
    },

    init : function () {

        var filter = new Everlive.Query();
        filter.where().eq('userUUID', userModel._user.userUUID);

        var data = APP.everlive.data(memberdirectory._ggClass);
        data.get(filter)
            .then(function(data){
                    if (data.count === 0) {
                        memberdirectory.create();
                    } else {
                        var member = data.result[0];
                        memberdirectory._id = member.Id;
                        memberdirectory.setMember(member);
                    }

                },
                function(error){
                    mobileNotify("Member Directory Init error : " + JSON.stringify(error));
                });
    },

    create : function () {
        var data = APP.everlive.data(memberdirectory._ggClass);

        var validated = userModel._user.emailValidated || userModel._user.phoneValidated;

        var dirObj = {
            userUUID : userModel._user.userUUID,
            name : userModel._user.name,
            alias : userModel._user.alias,
            phone : userModel._user.phone,
            email:  userModel._user.email,
            photo: null,
            publicKey: userModel._user.publicKey,
            emailValidated: userModel._user.emailValidated,
            phoneValidated : userModel._user.phoneValidated,
            addressValidated : userModel._user.addressValidated,
            isValidated: validated

        };

        data.create(dirObj,
            function(data){
                memberdirectory._id = data.result.Id;
            },
            function(error){
                mobileNotify("Member Directory Init error : " + JSON.stringify(error));
            });
    },

    update : function () {
        var data = APP.everlive.data(memberdirectory._ggClass);

        var validated = userModel._user.Validated;

        var dirObj = {
            userUUID : userModel._user.userUUID,
            name : userModel._user.name,
            alias : userModel._user.alias,
            phone : userModel._user.phone,
            email:  userModel._user.email,
            address: userModel._user.address,
            photo: userModel._user.photo,
            publicKey: userModel._user.publicKey,
            emailValidated: userModel._user.emailValidated,
            phoneValidated : userModel._user.phoneValidated,
            addressValidated : userModel._user.addressValidated,
            isValidated: validated
        };


        if (memberdirectory._id !== undefined && memberdirectory._id !== null)
            dirObj.Id = memberdirectory._id;

        data.update(dirObj, {userUUID : userModel._user.userUUID},
            function(data){
                memberdirectory._id = data.result.Id;
            },
            function(error){
                if (error !== undefined && error !== null) {
                    ggError("Member Directory Update error : " + JSON.stringify(error));
                }

            });
    },

    findMemberByUUID : function (uuid, callback) {
        var filter = new Everlive.Query();
        filter.where().eq('userUUID', uuid);

        var data = APP.everlive.data(memberdirectory._ggClass);
        data.get(filter)
            .then(function(data){
                    if (data.count === 0) {
                        callback(null)
                    } else {
                        var member = data.result[0];
                       callback(member);
                    }

                },
                function(error){
                    mobileNotify("MemberDirectory Find error : " + JSON.stringify(error));
                });
    },

    findMemberByPhone : function (phone, callback) {
        var filter = new Everlive.Query();
        filter.where().eq('phone', phone);

        var data = APP.everlive.data(memberdirectory._ggClass);
        data.get(filter)
            .then(function(data){
                    if (data.count === 0) {
                        callback(null)
                    } else {
                        var member = data.result[0];
                        callback(member);
                    }

                },
                function(error){
                    mobileNotify("MemberDirectory Find phone error : " + JSON.stringify(error));
                });
    },

    findMemberByPhoneList : function (phoneList, callback) {
        var filter = new Everlive.Query();
        filter.where().isin('phone', phoneList);
        var data = APP.everlive.data(memberdirectory._ggClass);
        data.get(filter)
            .then(function(data){
                    if (data.count === 0) {
                        callback(null)
                    } else {
                        var member = data.result[0];
                        callback(member);
                    }

                },
                function(error){
                    mobileNotify("MemberDirectory Find phone error : " + JSON.stringify(error));
                });
    },

    findMemberByEmail : function (email, callback) {
        var filter = new Everlive.Query();
        filter.where().eq('email', email);

        var data = APP.everlive.data(memberdirectory._ggClass);
        data.get(filter)
            .then(function(data){
                    if (data.count === 0) {
                        callback(null)
                    } else {
                        var member = data.result[0];
                        callback(member);
                    }

                },
                function(error){
                    mobileNotify("MemberDirectory Find email error : " + JSON.stringify(error));
                });
    }

};


var invitedirectory = {

    _ggClass: 'invitemap',
    _version: 1,

    create : function (name, phone, email) {
        var data = APP.everlive.data(invitedirectory._ggClass);

        var dirObj = {
            memberUUID : userModel._user.userUUID,
            memberName : userModel._user.name,
            memberPhone : userModel._user.phone,
            memberEmail:  userModel._user.email,
            name: name,
            phone: phone,
            email : email,
            userUUID : null

        };

        data.create(dirObj,
            function(data){

            },
            function(error){
                mobileNotify("Invite Directory Create error : " + JSON.stringify(error));
            });
    },

    isInvited : function (phone, memberUUID, callback) {
        var query = new Everlive.Query();
        query.where().and().eq('phone', phone).eq('memberUUID', memberUUID).done();
        APP.everlive.data(invitedirectory._ggClass).get(query).then (
            function (data) {
                callback(null, data.result);
            },
            function (error){
                callback(error, null);
            });
    },
    
    queryByPhone : function (phone, callback) {
        var query = new Everlive.Query();
        query.where().eq('phone', phone).done();

        APP.everlive.data(invitedirectory._ggClass).get(query).then (
            function (data) {
                callback(null, data.result);
            },
            function (error){
                callback(error, null);
            });
    },

    queryByEmail : function (email, callback) {
        var query = new Everlive.Query();
        query.where().eq('email', email).done();

        APP.everlive.data(invitedirectory._ggClass).get(query).then (
            function (data) {
                callback(null, data.result);
            },
            function (error){
                callback(error, null);
            });
    },

    queryByMemberPhone : function (phone, callback) {
        var query = new Everlive.Query();
        query.where().eq('memberPhone', phone).done();

        APP.everlive.data(invitedirectory._ggClass).get(query).then (
            function (data) {
                callback(null, data.result);
            },
            function (error){
                callback(error, null);
            });
    },

    queryByMemberEmail : function (email, callback) {
        var query = new Everlive.Query();
        query.where().eq('memberEmail', email).done();

        APP.everlive.data(invitedirectory._ggClass).get(query).then (
            function (data) {
                callback(null, data.result);
            },
            function (error){
                callback(error, null);
            });
    },

    deleteByPhone : function (phone, callback) {
        var query = new Everlive.Query();
        query
            .where()
            .and()
            .eq('phone', phone)
            .eq('memberUUID', userModel.currentUser.userUUID)
            .done();
        
        APP.everlive.data(invitedirectory._ggClass).get(query).then (
            function (data) {
                APP.everlive.data(invitedirectory._ggClass).destroySingle({ Id: data.result.Id },
                    function(){
                        mobileNotify("Invite deleted...");
                        callback(null, data.result);
                    },
                    function(error){
                        mobileNotify("Invite delete error : " + JSON.stringify(error));
                        callback(error, null);
                    });

            },
            function (error){
                callback(error, null);
            });
    }
};