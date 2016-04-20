/**
 * Created by donbrad on 9/29/15.
 * profileView.js -- all view management for profile edit and status
 */

var profileView = {
    onInit: function (e) {
       // _preventDefault(e);


    },

    onShow: function (e) {
      //  _preventDefault(e);
        if (userModel._user.emailValidated){
            $("#verified-email").removeClass("hidden");
        }

        if(userModel._user.phoneValidated){
            $("#verified-phone").removeClass("hidden");
        }

    }

};

var profileEditView = {

    _activeProfile : new kendo.data.ObservableObject(),

    onInit: function (e) {
        //_preventDefault(e);

         $("#editProfile").kendoValidator();
    },

    onShow: function (e) {
       // _preventDefault(e);

        var photoUrl = userModel._user.get('photo');
        if (photoUrl === undefined || photoUrl === null) {
            userModel.createIdenticon(userModel._user.get('userUUID'));
            photoUrl = userModel.identiconUrl;
        }
        profileEditView._activeProfile.set('name', userModel._user.get('name'));
        profileEditView._activeProfile.set('username', userModel._user.get('username'));
        profileEditView._activeProfile.set('alias', userModel._user.get('alias'));
        profileEditView._activeProfile.set('email', userModel._user.get('email'));
        profileEditView._activeProfile.set('photo', photoUrl );
        profileEditView._activeProfile.set('phone', userModel._user.get('phone'));

        $(".phone").val(profileEditView._activeProfile.phone);

        // Set verified
        if(userModel._user.phoneValidated){
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


/*
 * Profile Photo Capture / Edit
 * parameterized for user profile and contact profile
 */

var editProfilePhotoView = {
     photo : new kendo.data.ObservableObject({url: null, photoId: null}),
    _callback : null,
    _photoUrl: null,
    _isUserProfile : true,
    _isIdenticon : true,
    _contactId : null,
    

    onInit : function (e) {
        // _preventDefault(e);

    },

    onShow : function (e) {
        // _preventDefault(e);

        var isUserProfile =  e.view.params.isUserProfile !== undefined,
            contactId = e.view.params.contactId,
            isContact = contactId !== undefined;
        
        if (isUserProfile) {
            var photoUrl = userModel._user.photo;
            if (photoUrl === undefined || photoUrl === null) {
                photoUrl = userModel.identiconUrl;
                editProfilePhotoView._isIdenticon = true;
            } else {
                editProfilePhotoView._isIdenticon = false;
            }
        }
        
        editProfilePhotoView.setPhotoUrl(photoUrl);
    },

    onDone : function (e) {

    },

    setCallback : function (callback) {
        if (callback !== undefined) {
            editProfilePhotoView._callback = callback;
        }
    },

    setPhotoUrl : function (url) {
        editProfilePhotoView.photo.set('url', url);
        
    },

    updatePhoto : function (photoId, photoUrl) {
        
    },
    
    doCamera : function (e) {
        _preventDefault(e);

        if (window.navigator.simulator !== undefined) {
            mobileNotify("Camera not supported in emulator...");
            return;
        }
        devicePhoto.deviceCamera(
            512, // max resolution in pixels
            75,  // quality: 1-99.
            false,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            editProfilePhotoView.updatePhoto // Optional preview callback
        )
    },

    doPhotoGallery : function(e) {
        _preventDefault(e);

        if (window.navigator.simulator !== undefined) {
            mobileNotify("Camera not supported in emulator...");
            return;
        }
        devicePhoto.deviceGallery(
            512, // max resolution in pixels
            75,  // quality: 1-99.
            false,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
            editProfilePhotoView.updatePhoto  // Optional preview callback
        );
    },

    doMemories : function (e) {
        _preventDefault(e);
        galleryPicker.openModal(function (photo) {

        });
    },

    updateUserPhotoUrl : function (e) {
        _preventDefault(e);
        userModel._user.set("photo", editProfilePhotoView._photoUrl);
    }
};

