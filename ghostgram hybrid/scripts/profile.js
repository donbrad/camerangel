/**
 * Created by donbrad on 7/11/15.
 */

function closeChooseGhost() {
    $("#modalview-chooseGhost").data("kendoMobileModalView").close();
}


// Select new ghost icon
function whichGhost(e) {
    if (e.preventDefault !== undefined)
        e.preventDefault();
    var selection = e.target[0].id;
    var selectionPath = "images/" + selection + ".svg";
    var currentAlias = APP.models.profile.currentUser.aliasPhoto;

    if (selection !== undefined){
        $(".myPublicImg").attr("src", selectionPath);
        // ToDo - save ghost selection
        APP.models.profile.currentUser.set("aliasPhoto", selectionPath);
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

function validNewPass(e) {
    if (e.preventDefault !== undefined)
        e.preventDefault();

    var pass1 = $("#newPassword1").val();
    var pass2 = $("#newPassword2").val();

    if(pass1 !== pass2){
        mobileNotify("Passwords don't match, try again");
    } else {
        user = Parse.User.current();
        if (user) {
            user.set("password",pass1);
            user.save()
                .then(
                function(user) {
                    mobileNotify("Your password was changed");
                    $("#modalview-changePassword").data("kendoMobileModalView").close();

                    // Clear forms
                    $("#newPassword1, #newPassword2").val("");
                },
                function(error) {
                    mobileNotify("Error updating password" + error);
                }
            );
        }

    }
}

function profilePhotoScaleSuccess (data) {
    var scaledImageUrl = data.imageData;

}

function updateProfilePhoto (e) {
    if (e.preventDefault !== undefined)
        e.preventDefault();

    var pictureSource = navigator.camera.PictureSourceType;   // picture source
    var destinationType = navigator.camera.DestinationType; // sets the format of returned value
    // Android storage is seriously different -- multiple photo directories with different permissions.
    // So need to get a data url in our space rather an direct link to the image in current storage
    var options = {
        sourceType: pictureSource.SAVEDPHOTOALBUM,
        destinationType: destinationType.DATA_URL
    }
    if (device.platform === 'iOS') {
        options = {
            sourceType: pictureSource.SAVEDPHOTOALBUM,
            destinationType: destinationType.FILE_URL
        }
    }
    navigator.camera.getPicture(
        function (imageData) {
            var photouuid = uuid.v4();
            var imageUrl = imageData;
            var displayUrl = imageData;
            var scaledImageUrl  = '';

            if (device.platform === 'iOS') {
                imageUrl = imageData.replace('file://', '');

            }	else {
                displayUrl = "data:image/jpg;base64," + imageData;
            }
            // convert uuid into valid file name;
            var filename = photouuid.replace(/-/g,'');

           /* APP.models.gallery.currentPhoto.photoId = photouuid;
            APP.models.gallery.currentPhoto.filename = filename;
            APP.models.gallery.currentPhoto.imageUrl = imageUrl;
            */

            //resize image to 1200 pixels high
            /*		   window.imageResizer.resizeImage(resizeSuccess, resizeFailure,  imageUrl, 0, 1200, {
             quality: 75, storeImage: 1, photoAlbum: 0, filename: "photo_"+filename+'.jpg' }); */

            if (device.platform === 'iOS') {
                window.imageResizer.resizeImage(profilePhotoScaleSuccess, resizeFailure,  imageUrl, 0, 140, {
                    storeImage: false, pixelDensity: true, quality: 95 });
            } else {
                window.imageResizer.resizeImage(profilePhotoScaleSuccess, resizeFailure,  imageUrl, 0, 140, {
                    imageDataType: ImageResizer.IMAGE_DATA_TYPE_BASE64, storeImage: false, pixelDensity: true, quality: 95 });
            }
        },
        function (error) {
            mobileNotify("Camera error " + error);
        }, options
    );
}
