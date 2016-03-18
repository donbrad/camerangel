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
        if (userModel._user.emailVerified){
            $("#verified-email").removeClass("hidden");
        }

        if(userModel._user.phoneVerified){
            $("#verified-phone").removeClass("hidden");
        }

    }

};

var profileEditView = {

    _activeProfile : new kendo.data.ObservableObject(),

    onInit: function (e) {
        _preventDefault(e);

         $("#editProfile").kendoValidator();
    },

    onShow: function (e) {
        _preventDefault(e);

        profileEditView._activeProfile.set('name', userModel._user.get('name'));
        profileEditView._activeProfile.set('username', userModel._user.get('username'));
        profileEditView._activeProfile.set('alias', userModel._user.get('alias'));
        profileEditView._activeProfile.set('email', userModel._user.get('email'));
        profileEditView._activeProfile.set('photo', userModel._user.get('photo'));
        profileEditView._activeProfile.set('phone', userModel._user.get('phone'));

        $(".phone").val(profileEditView._activeProfile.phone);

        // Set verified
        if(userModel._user.phoneVerified){
        	$("#profile-verified-phone").removeClass("hidden");
        }

        if(userModel._user.emailValidated){
        	$("#profile-verified-email").removeClass("hidden");
        }
        

        // format phone number
        ux.showFormatedPhone();
    },

    doSave : function (e) {
        _preventDefault(e);

        mobileNotify("Updating your profile...");

        userModel._user.set('name', profileEditView._activeProfile.get('name'));
        userModel._user.set('alias', profileEditView._activeProfile.get('alias'));
        userModel._user.set('email', profileEditView._activeProfile.get('email'));
        userModel._user.set('photo', profileEditView._activeProfile.get('photo'));

        // Todo Don - possible to redirect the user to last view (_returnView)
        APP.kendo.navigate('#home');
    }, 

    validate: function(){
    	var form = $("#editProfile").kendoValidator().data("kendoValidator");
    	if(form.validate()){
    		profileEditView.doSave();
    	}
    	
    }
};