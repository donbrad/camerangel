/**
 * Created by donbrad on 7/11/15.
 */

function closeChooseGhost() {
    $("#modalview-chooseGhost").data("kendoMobileModalView").close();
}

function onProfileShow(){
	// format phone number
	 ux.showFormatedPhone();
}

function toggleProfilePhoto(e) {
    if (e !== undefined && e.preventDefault !== undefined) {
        e.preventDefault();
    }

    var currentUrl = $('#profileTopImg').attr(src), user = Parse.User.current(), photo = user.get('photo'), public = user.get('aliasPhoto');

    if (photo !== undefined && currentUrl === public ){
        $('#profileTopImg').attr(src, photo);
    } else {
        $('#profileTopImg').attr(src, public);
    }
}

// Select new ghost icon
function whichGhost(e) {
    if (e.preventDefault !== undefined)
        e.preventDefault();
    var selection = e.target[0].id;
    var selectionPath = "images/" + selection + ".svg";
    var currentAlias = userModel._user.aliasPhoto;

    if (selection !== undefined){
        $(".myPublicImg").attr("src", selectionPath);
        userModel._user.set("aliasPhoto", selectionPath);
    }
    closeChooseGhost()
}

function saveEditProfile() {
    mobileNotify("Your profile was updated")
}

function closeNewPass() {
    $("#modalview-changePassword").data("kendoMobileModalView").close();

    // Clear forms
    $("#newPassword1, #newPassword2").val("");
}



function profilePhotoScaleSuccess (data) {

}

function saveUserProfilePhoto (url) {
    var profileUrl = url, _user = userModel._user,  uuid = _user.get('userUUID'), user = Parse.User.current();

	mobileNotify('Syncing your Profile Photo....');
    getBase64FromImageUrl(profileUrl, function (fileData) {
        var parseFile = new Parse.File(uuid+".png", {base64 : fileData}, "image/png");
        parseFile.save().then(function() {
            user.set("parsePhoto", parseFile);
            user.set("photo", parseFile._url);
			
			// Update _user (local) to sync all instances of profile photo
			_user.set("parsePhoto", parseFile);
            _user.set("photo", parseFile._url);
            
            user.save(null, {
                success: function(contact) {
                    // Execute any logic that should take place after the object is saved.
                    mobileNotify('Updated your Profile Photo!');

                },
                error: function(contact, error) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and message.
                    handleParseError(error);
                }
            });
        }, function(error) {
            // The file either could not be read, or could not be saved to Parse.
            handleParseError(error);
        });
    });

}

function scaleProfileImage (imageData) {
    if (device.platform === 'iOS') {
        imageUrl = imageData.replace('file://', '');

    } else {
        displayUrl = "data:image/jpg;base64," + imageData;
    }

    if (device.platform === 'iOS') {
        window.imageResizer.resizeImage(profilePhotoScaleSuccess, resizeFailure,  imageUrl, 0, 140, {
            storeImage: false, pixelDensity: true, quality: 95 });
    } else {
        window.imageResizer.resizeImage(profilePhotoScaleSuccess, resizeFailure,  imageUrl, 0, 140, {
            imageDataType: ImageResizer.IMAGE_DATA_TYPE_BASE64, storeImage: false, pixelDensity: true, quality: 95 });
    }

}

function updateProfilePhoto (e) {
    if (e.preventDefault !== undefined){
        e.preventDefault();
	}
    var pictureSource = navigator.camera.PictureSourceType;   // picture source
    var destinationType = navigator.camera.DestinationType; // sets the format of returned value
    // Android storage is seriously different -- multiple photo directories with different permissions.
    // So need to get a data url in our space rather an direct link to the image in current storage
    var options = {
        sourceType: pictureSource.SAVEDPHOTOALBUM,
        destinationType: destinationType.DATA_URL
    };

    if (device.platform === 'iOS') {
        options = {
            sourceType: pictureSource.SAVEDPHOTOALBUM,
            destinationType: destinationType.FILE_URL
        }
    }

    navigator.camera.getPicture(
        function (imageData) {
            var imageUrl = imageData;
            var displayUrl = imageData;

            if (device.platform === 'iOS') {
                imageUrl = imageData.replace('file://', '');

            } else {
                displayUrl = "data:image/jpg;base64," + imageData;
            }
            //var scaledImageUrl = "data:image/jpg;base64," + imageData;
            $('#photoEditImage').attr('src', displayUrl);
            var urlParam = LZString.compressToEncodedURIComponent(displayUrl);

            // Don't have photo object so just pass the url.
            APP.kendo.navigate('#photoEditor?source=profile&url='+urlParam);
        },
        function (error) {
            mobileNotify("Camera error " + error);
        }, options
    );
}

/*function profilePhotoComplete () {

}

function doProfileCamera(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}

    deviceCamera(
        1600, // max resolution in pixels
        75,  // quality: 1-99.
        false,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
        profilePhotoComplete  // Optional preview callback
    );
}

function doProfilePhotos(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}

    deviceGallery(
        1600, // max resolution in pixels
        75,  // quality: 1-99.
        false,  // isChat -- generate thumbnails and autostore in gallery.  photos imported in gallery are treated like chat photos
        profilePhotoComplete  // Optional preview callback
    );
}

function doProfileGallery(e) {
	if (e.preventDefault !== undefined) {
		e.preventDefault();
	}
}*/

function onInitProfile(e) {
	e.preventDefault();
    
    if (userModel._user.emailVerified){
        $("#verified-email").removeClass("hidden");
    }
    
    if(userModel._user.phoneVerified){
        $("#verified-phone").removeClass("hidden");
    }
    
    ux.showFormatedPhone();
}
