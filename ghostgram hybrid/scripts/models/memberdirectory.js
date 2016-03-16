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
                        memberdirectory._id = member.id;
                    }

                },
                function(error){
                    mobileNotify("Member Directory Init error : " + JSON.stringify(error));
                });
    },

    create : function () {
        var data = APP.everlive.data(memberdirectory._ggClass);

        var dirObj = {
            userUUID : userModel.currentUser.userUUID,
            name : userModel.currentUser.name,
            alias : userModel.currentUser.alias,
            phone : userModel.currentUser.phone,
            email:  userModel.currentUser.email,
            publicKey: userModel.currentUser.publcKey
        };

        data.create(dirObj,
            function(data){
                var count = data.count;
            },
            function(error){
                mobileNotify("Member Directory Init error : " + JSON.stringify(error));
            });
    },

    update : function () {

    },

    findMemberByUUID : function (uuid) {

    },

    findMemberByPhone : function (phone) {

    },

    findMemberByEmail : function (email) {

    }

};