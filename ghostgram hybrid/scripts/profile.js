/**
 * Created by donbrad on 7/11/15.
 */

function closeChooseGhost() {
    $("#modalview-chooseGhost").data("kendoMobileModalView").close();
}


// Select new ghost icon
function whichGhost(e){
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


// Todo - wire save profile, may not need w/ profile sync
function saveEditProfile() {
    mobileNotify("Your profile was updated")
}

function closeNewPass() {
    $("#modalview-changePassword").data("kendoMobileModalView").close();

    // Clear forms
    $("#newPassword1, #newPassword2").val("");
}

function validNewPass(e) {
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