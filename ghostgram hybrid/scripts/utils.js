function updateParseObject(objectName, idField, idFieldValue, newField, newFieldValue) {
    var object = Parse.Object.extend(objectName);
    var query = new Parse.Query(object);
    query.equalTo(idField, idFieldValue);
	
	if (newFieldValue === 'true')
		newFieldValue = true;
	if (newFieldValue === 'false')
		newFieldValue - false;
    
	query.find({
      success: function(results) {
        results[0].set(newField, newFieldValue);
        results[0].save({
          success: function(myObject) {
            // The object was deleted from the Parse Cloud.
          },
          error: function(myObject, error) {
             mobileNotify("Error: " + error.code + " " + error.message);
          }
        });
        
      },
      error: function(error) {
        mobileNotify("Error: " + error.code + " " + error.message);
      }
    });
}
    
function deleteParseObject(objectName, field, fieldValue) {
    var object = Parse.Object.extend(objectName);
    var query = new Parse.Query(object);
    query.equalTo(field, fieldValue);
    query.find({
      success: function(results) {
        results[0].destroy({
          success: function(myObject) {
            // The object was deleted from the Parse Cloud.
          },
          error: function(myObject, error) {
            // The delete failed.
            // error is a Parse.Error with an error code and message.
              mobileNotify("Error: " + error.code + " " + error.message);
          }
        });
        
      },
      error: function(error) {
        mobileNotify("Error: " + error.code + " " + error.message);
      }
    });
}
    
function handleParseError(err) {
  switch (err.code) {
    case Parse.Error.INVALID_SESSION_TOKEN:
      Parse.User.logOut();
        APP.models.profile.currentUser = '';
        APP.models.profile.username =  '';
        APP.models.profile.email =  '';
        APP.models.profile.phone =  '';
        APP.models.profile.alias =  '';
        APP.models.profile.userUUID = '';
        APP.kendo.navigate('#newuserhome');
      break;
  }
}


function getBase64FromImageUrl(URL, callback) {
    var img = new Image();
    img.src = URL;
    img.onload = function () {
		var canvas = document.createElement("canvas");
		canvas.width =this.width;
		canvas.height =this.height;

		var ctx = canvas.getContext("2d");
		ctx.drawImage(this, 0, 0);
		var dataURL = canvas.toDataURL("image/png");
		callback(dataURL.replace(/^data:image\/(png|jpg);base64,/, ""));
    }
}

function mobileNotify(message) {
    if (window.navigator.simulator === true){
    //running in the simulator
        alert(message);
    }
    else{
    //running on a device
        window.plugins.toast.showShortTop(message);
    }
 
}

function getUserPublicKey (uuid, callBack) {
	Parse.Cloud.run('getUserPublicKey', { uuid: uuid }, 
    {
        success: function(result, error) {
          if (result.status === 'ok') {
             	callBack({found: true, publicKey: result.publicKey});
          } else {
              callBack({found: false, publicKey: null});
          }
         
        },
        error: function (result, error){
           callBack(null, error)
        }
    });
}

function findUserByEmail (email, callBack) {
	 Parse.Cloud.run('findUserByEmail', { email: email }, 
    {
        success: function(result) {
          	if (result.status === 'ok') {
				callBack({found: true, user: result.user});
			} else {
				callBack({found: false});
			}
         
        },
        error: function (result,error){
            mobileNotify('Error Finding User by email  ' + error);
			callBack({found: false});
        }
    });
}

function findUserByPhone (phone, callBack) {
	 Parse.Cloud.run('findUserByPhone', { phone: phone }, 
    {
        success: function(result) {
          	if (result.status === 'ok') {
				callBack({found: true, user: result.user});
			} else {
				callBack({found: false});
			}
         
        },
        error: function (result,error){
            mobileNotify('Error Finding User by email  ' + error);
			callBack({found: false});
        }
    });
}

function verifyPhone(e){
    e.preventDefault();
    var code = $('#verifyPhone-code').val();
    // all verification codes are 5 or 6 numbers
    if (code.length < 5) {
       mobileNotify("Invalid verification code, please try again");
        return;
    }
    
    Parse.Cloud.run('verifyPhoneNumber', { code: code }, 
    {
        success: function(result) {
          if (result.verified) {
               mobileNotify("Your phone number is verified.  Thank You!");
               $("#modalview-verifyPhone").data("kendoMobileModalView").close();
          } else {
               mobileNotify("Sorry, your verification number: ' + result.recieved + ' didn't match. ");
          }
         
        },
        error: function (result,error){
            mobileNotify('Error verifying phone ' + error);
        }
    });
    
}