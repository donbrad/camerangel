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
                    memberdirectory._id = data.result.id;
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