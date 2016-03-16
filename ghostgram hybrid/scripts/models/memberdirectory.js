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
    },

    init : function () {

        var filter = new Everlive.Query();
        filter.where().eq('userUUID', userModel.currentUser.userUUID);

        var data = APP.everlive.data(memberdirectory._ggClass);
        data.get(filter)
            .then(function(data){
                    if (data.count === 0) {
                        memberdirectory.create();
                    } else {
                        var member = data.result[0];
                        memberdirectory._id = member.Id;
                        memberdirectory.setMember(data);
                    }

                },
                function(error){
                    mobileNotify("Member Directory Init error : " + JSON.stringify(error));
                });
    },

    create : function () {
        var data = APP.everlive.data(memberdirectory._ggClass);

        var verified = userModel.currentUser.emailValidated || userModel.currentUser.phoneVerified;



        var dirObj = {
            userUUID : userModel.currentUser.userUUID,
            name : userModel.currentUser.name,
            alias : userModel.currentUser.alias,
            phone : userModel.currentUser.phone,
            email:  userModel.currentUser.email,
            publicKey: userModel.currentUser.publicKey,
            emailVerified: userModel.currentUser.emailValidated,
            phoneVerified : userModel.currentUser.phoneVerified,
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

        var verified = userModel.currentUser.emailValidated || userModel.currentUser.phoneVerified;

        var dirObj = {
            Id: memberdirectory._id,
            userUUID : userModel.currentUser.userUUID,
            name : userModel.currentUser.name,
            alias : userModel.currentUser.alias,
            phone : userModel.currentUser.phone,
            email:  userModel.currentUser.email,
            publicKey: userModel.currentUser.publicKey,
            emailVerified: userModel.currentUser.emailValidated,
            phoneVerified : userModel.currentUser.phoneVerified,
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

    findMemberByUUID : function (uuid) {

    },

    findMemberByPhone : function (phone) {

    },

    findMemberByEmail : function (email) {

    }

};