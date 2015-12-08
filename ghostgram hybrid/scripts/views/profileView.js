/**
 * Created by donbrad on 9/29/15.
 * profileView.js -- all view management for profile edit and status
 */

var profileView = {
    onInit: function (e) {
        _preventDefault(e);


    },

    onShow: function (e) {
        _preventDefault(e);
        if (userModel.currentUser.emailVerified){
            $("#verified-email").removeClass("hidden");
        }

        if(userModel.currentUser.phoneVerified){
            $("#verified-phone").removeClass("hidden");
        }

        // format phone number
        ux.showFormatedPhone();
    }

};

var profileEditView = {

    _activeProfile : new kendo.data.ObservableObject(),

    onInit: function (e) {
        _preventDefault(e);

    },

    onShow: function (e) {
        _preventDefault(e);

        profileEditView._activeProfile.set('name', userModel.currentUser.get('name'));
        profileEditView._activeProfile.set('username', userModel.currentUser.get('username'));
        profileEditView._activeProfile.set('alias', userModel.currentUser.get('alias'));
        profileEditView._activeProfile.set('email', userModel.currentUser.get('email'));
        profileEditView._activeProfile.set('photo', userModel.currentUser.get('photo'));

    },

    doSave : function (e) {
        _preventDefault(e);

        mobileNotify("Updating your profile...");

        userModel.currentUser.set('name', profileEditView._activeProfile.get('name'));
        userModel.currentUser.set('alias', profileEditView._activeProfile.get('alias'));
        userModel.currentUser.set('email', profileEditView._activeProfile.get('email'));
        userModel.currentUser.set('photo', profileEditView._activeProfile.get('photo'));

        APP.kendo.navigate('#profile');
    }
};