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

        var verified = userModel._user.emailValidated || userModel._user.phoneVerified;



        var dirObj = {
            userUUID : userModel._user.userUUID,
            name : userModel._user.name,
            alias : userModel._user.alias,
            phone : userModel._user.phone,
            email:  userModel._user.email,
            publicKey: userModel._user.publicKey,
            emailVerified: userModel._user.emailValidated,
            phoneVerified : userModel._user.phoneVerified,
            isVerified : verified

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

        var verified = userModel._user.emailValidated || userModel._user.phoneVerified;

        var dirObj = {
            Id: memberdirectory._id,
            userUUID : userModel._user.userUUID,
            name : userModel._user.name,
            alias : userModel._user.alias,
            phone : userModel._user.phone,
            email:  userModel._user.email,
            publicKey: userModel._user.publicKey,
            emailVerified: userModel._user.emailValidated,
            phoneVerified : userModel._user.phoneVerified,
            isVerified : verified
        };

        data.update(dirObj,
            function(data){
                memberdirectory._id = data.result.Id;
            },
            function(error){
                mobileNotify("Member Directory Update error : " + JSON.stringify(error));
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

    findMemberByPhone : function (phone) {
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

    findMemberByEmail : function (email) {
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