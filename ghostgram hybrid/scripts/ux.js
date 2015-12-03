'use strict';


var ux = {

	// Display the right name combo - for template use returnUXPrimaryName
	formatNameAlias: function(name, alias, view){

		var primaryName, secondName;

		if (alias !== "" && alias !== undefined && name !== "" && name !== undefined){
			primaryName = alias;
			secondName = name;

		} else if(name !== "" && name !== undefined) {
			primaryName = name;
			secondName = "";
		}
		else {
			primaryName = alias;
		}

		$(view + " .primaryName").text(primaryName);
		$(view + " .secondName").text(secondName);

	},

	// returns the right name combo for use in template 
	returnUXPrimaryName: function(name, alias){
		var primaryName;

		if (alias !== "" && alias !== undefined && name !== "" && name !== undefined){
			primaryName = alias;
			
		} else if(name !== "" && name !== undefined) {
			primaryName = name;
		}
		else {
			primaryName = alias;
		}

		return primaryName;
	},

	returnAliasName: function(alias, group){
		var secondaryName;

		// If alias and group are present
		if(alias !== "" && alias !== undefined && group !== "" & group !== null){
			secondaryName = alias;
		// if 
		} else if(alias !== "" && alias !== undefined){
			secondaryName = group;
		} else {
			secondaryName = ""
		}
		return secondaryName;
	},	

	addressPrimaryName: function(name, alias, address){
		var preCheckName = name; 
		var preCheckAlias = alias; 
		var preCheckAddress = address;

		var nameVerified, aliasVerified, addressVerified = false;
		var nameCombo = [];

		// check name 
		if(preCheckName !== "" && preCheckName !== undefined ){
			nameVerified = true;
			nameCombo.push(preCheckName);
		} 
		// check alias
		if(preCheckAlias !== "" && preCheckAlias !== undefined){
			aliasVerified = true;
			nameCombo.unshift(preCheckAlias);
		} 

		if (!nameVerified && !aliasVerified){
			nameCombo.push(preCheckAddress);
		}
 		
		return nameCombo;
	},

	// display empty view graphic if no results
	checkEmptyUIState: function(ds, view){
		var selectionList = ds.total();
	    if(ds <= 0){
	    	$(view + " .emptyState").removeClass("hidden");
	    } else {
	    	$(view + " .emptyState").addClass("hidden");
	    }
	},

	hideKeyboard: function(){
		if (window.navigator.simulator === false) {
			// hide keyboard
			cordova.plugins.Keyboard.close();
		}
	
	},

	showActionBtn: function(show, view, href){
		if (show){
			$(view + " > div.footerMenu.km-footer > a").css("display","inline-block").attr("href", href);
		} else {
			$(view + " > div.footerMenu.km-footer > a").css("display","none").removeAttr("href");
		}
	},

	changeActionBtnImg: function(view, img){
		$(view + " > div.footerMenu.km-footer > a > span > img").attr("src", "images/" +img+".svg");
	},

	scrollUpSearch: function(e){
		var scroller = e.view.scroller;
    	scroller.scrollTo(0,0);
	},

	returnUserFontSize: function(){
		var user = "userLgFontSize"
		if(true){
			return user;
		}
	},

	toggleIsAvailable: function(){
		var currentState = userModel.currentUser.isAvailable;
		if(currentState){
			userModel.currentUser.set('isAvailable', false);
		} else {
			userModel.currentUser.set('isAvailable', true);
		}
		ux.updateHeaderStatusImages();

	},

	// Globally update profile and status images in the application header
	updateHeaderStatusImages: function() {
		var isAvailable  = userModel.currentUser.get('isAvailable');
		if (isAvailable) {
			userModel.currentUser.set('availImgUrl', 'images/status-available.svg');
		} else {
			userModel.currentUser.set('availImgUrl', 'images/status-away.svg');
		}
		$('.userAvailable').attr('src',userModel.currentUser.get('availImgUrl'));



	    var useIdenticon = userModel.currentUser.get('useIdenticon');
	    if (useIdenticon === undefined)
	        useIdenticon = true;

	    if (useIdenticon === true) {
	        $('.home-profile-img').attr('src',userModel.identiconUrl);
	      //  userModel.enableIdenticon();
	    } else {
	        $('.home-profile-img').attr('src',userModel.currentUser.get('photo'));
	      //  userModel.disableIdenticon();
	    }
	},

	closeModalPhotoView: function(e) {
		_preventDefault(e);
     	$('#modalPhotoView').kendoMobileModalView("close");
	},

	closeModalViewSupport: function(e) {
		_preventDefault(e);
     	$('#modalview-support').kendoMobileModalView("close");
	},

	closeModalViewPhotoTag: function(e) {
		_preventDefault(e);
     	$('#modalview-photoTag').kendoMobileModalView("close");
	},

	closeModalViewLogin: function(e) {
		_preventDefault(e);
    	$("#modalview-login").kendoMobileModalView("close");
	},

	closeModalGhostChat: function(e) {
		_preventDefault(e);
    	$("#modalview-ghostChat").kendoMobileModalView("close");
	},

	closeModalViewSignup: function(e) {
		_preventDefault(e);
    	$("#modalview-signup").kendoMobileModalView("close");
	},


	closeModalViewRecoverPassword: function(e) {
		_preventDefault(e);
    	$("#modalview-recoverPassword").kendoMobileModalView("close");
	},

	closeModalViewAddChannel: function(e) {
		_preventDefault(e);
    	$("#modalview-channels-addChannel").kendoMobileModalView("close");
	},

	closeModalViewAddPlace: function(e) {
		_preventDefault(e);
    	$("#modalview-addPlace").kendoMobileModalView("close");
    	$(".hasFade").removeClass("hasFade");
	},


	closeStartModal: function(e) {
		_preventDefault(e);
		$("#modalview-start").data("kendoMobileModalView").close();
	},

	closeTestingBox: function(e){
		_preventDefault(e);
		$("#testing").data("kendoMobileModalView").close();
	},

	showFormatedPhone: function(e){
		_preventDefault(e);

		if($(".phone").is("input")){
			var inputVal = $(".phone").val();
	    	var formattedVal = inputVal.replace(/\d(\d\d\d)(\d\d\d)(\d\d\d\d)/, '($1) $2-$3');
			
			$(".phone").val(formattedVal);
		
		} else {
			$('.phone').text(function(i, text) {
	    	return text.replace(/\d(\d\d\d)(\d\d\d)(\d\d\d\d)/, '($1) $2-$3');
			});
		}
	},

	showCleanEmail: function(email){
		if(email.indexOf(':') > -1){
			var splitEmail = email.split(": ");
			return splitEmail[1];
		} else {
			return email;
		}

	},

	showCleanPhone:function(phone){
		return phone.replace(/\d(\d\d\d)(\d\d\d)(\d\d\d\d)/, '($1) $2-$3');
	},

	showActionBtnText:function(path, fromRight, text){
		$(path + " > div.footerMenu.km-footer > a > span > p").text(text).css({
			right: fromRight,
			opacity: 1
		});
	},

	hideActionBtnText: function(path){
		$(path + " > div.footerMenu.km-footer > a > span > p").text("").velocity({opacity: 0, right: "0"});
	},

	AutoGrowTextArea: function(textField){
	    if (textField.clientHeight < textField.scrollHeight)
	    {
	        textField.style.height = textField.scrollHeight + "px";
	        if (textField.clientHeight < textField.scrollHeight)
	        {
	            textField.style.height =
	                (textField.scrollHeight * 2 - textField.clientHeight) + "px";
	        }
	    }
	},

	createInitialsIcon: function(name, selector) {
	    var colors = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e", "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50", "#f1c40f", "#e67e22", "#e74c3c", "#95a5a6", "#f39c12", "#d35400", "#c0392b", "#bdc3c7", "#7f8c8d"];

	    var
	        nameSplit = name.split(" "),
	        initials = nameSplit[0].charAt(0).toUpperCase() + nameSplit[1].charAt(0).toUpperCase();

	    var charIndex = initials.charCodeAt(0) - 65,
	        colorIndex = charIndex % 19;

	    var canvas = document.getElementById(selector);
	    var context = canvas.getContext("2d");

	    var canvasWidth = $(canvas).attr("width"),
	        canvasHeight = $(canvas).attr("height"),
	        canvasCssWidth = canvasWidth,
	        canvasCssHeight = canvasHeight;

	    if (window.devicePixelRatio) {
	        $(canvas).attr("width", canvasWidth * window.devicePixelRatio);
	        $(canvas).attr("height", canvasHeight * window.devicePixelRatio);
	        $(canvas).css("width", canvasCssWidth);
	        $(canvas).css("height", canvasCssHeight);
	        context.scale(window.devicePixelRatio, window.devicePixelRatio);
	    }

	    context.fillStyle = colors[colorIndex];
	    context.fillRect (0, 0, canvas.width, canvas.height);
	    context.font = "128px Arial";
	    context.textAlign = "center";
	    context.fillStyle = "#FFF";
	    context.fillText(initials, canvasCssWidth / 2, canvasCssHeight / 1.5);
	},

	// These functions below are not referenced in the app

	closeModalViewEditChannel: function(e) {
		_preventDefault(e);
   		$("#modalview-channels-editChannel").kendoMobileModalView("close");
	},

	notificationVerifyPhone: function (e) {
		_preventDefault(e);
		$("#modalview-verifyPhone").data("kendoMobileModalView").open();
	},


	togglePrivate: function (e) {
    _preventDefault(e);

    var privateMode = !currentChannelModel.privacyMode;
    currentChannelModel.privacyModee = privateMode;
	    if (privateMode) {
	        $('.privateModeButton').text('Private');
	        $('.user-content').removeClass('publicMode');
	        $('.user-content').addClass('privateMode');

	    } else {
	        $('.privateModeButton').text('Public');
	        $('.user-content').addClass('publicMode');
	        $('.user-content').removeClass('privateMode');
	    }
	},

	beforeShowFilter: function() {

	    if (APP.models.home.privateMode) {
	        $('.privateModeButton').text('Private');
	        $('.user-content').removeClass('publicMode');
	        $('.user-content').addClass('privateMode');

	    } else {
	        $('.privateModeButton').text('Public');
	        $('.user-content').addClass('publicMode');
	        $('.user-content').removeClass('privateMode');
	    }   

	    $(".user-content").kendoTouch({
	        touchstart: function(e) {
	            e.preventDefault();
	            if (!APP.models.home.privateMode)
	                return;
	             $('.user-content').addClass('publicMode');
	             $('.user-content').removeClass('privateMode');
	        },
	        dragend: function(e) {
	            e.preventDefault();
	             if (!APP.models.home.privateMode)
	                return;
	             $('.user-content').removeClass('publicMode');
	             $('.user-content').addClass('privateMode');
	        },
	    }); 
	},

	sendSupportRequest: function(e) {

	    _preventDefault(e);



	    if (APP.models.sync.requestActive){
	        mobileNotify("Processing current support request.");
	        return;
	    }
	        
	    APP.models.sync.requestActive = true;
	    var category = $('#supportCategory').val(), message =  $('#supportMessage').val();
	    var userUUID = null, name = null, email = null, phone = null, version = null;


	   if (userModel.parseUser !== null) {
	        userUUID = userModel.currentUser.get('userUUID');
	        name = userModel.currentUser.get('name');
	        email = userModel.currentUser.get('email');
	        phone = userModel.currentUser.get('phone');
		   	version = userModel.currentUser.get('appVersion');
	    }
	    
	    var Support = Parse.Object.extend('support');
	    var support = new Support();
		var guid = uuid.v4();
		support.set("supportId", guid);
	    support.set("userUUID", userUUID);
	    support.set("name", name);
	    support.set("email",email );
	    support.set("phone", phone);
	    support.set("category", category);
	    support.set("message", message);
		support.set("version", version);
	    support.set("udid", userModel.device.udid);
	    support.set("device", userModel.device.device);
	    support.set("model",userModel.device.model);
	    support.set("platform", userModel.device.platform);

		var toAddr = "gg-startup@tickets.assembla.com",  emailSubject = category;
		var emailBody="status: Idea\n" + "supportId = " + guid + "\nemail = " + email + "\nMessage\n" + message;
		var mailto_link = 'mailto:'+toAddr+'?subject='+emailSubject+'&body='+emailBody;

		if (window.navigator.simulator === true){
			var win = window.open(mailto_link, 'emailWindow');
			if (win && win.open && !win.closed)
				win.close();
		} else {

			cordova.plugins.email.open({
				to:          [toAddr],
				subject:     category,
				body:        emailBody,
				isHtml:      false
			}, function (msg) {

				mobileNotify("Email sent to ghostgrams support");

			});
		}
	    
	    support.save(null, {
	        success: function(support) {
	            mobileNotify("You support request was sent. Thank you!");
	            ux.closeModalViewSupport();
	            APP.models.sync.requestActive = false;
	        },
	        error: function(support, error) {
	            mobileNotify("Error sending your support request: " + error);
	            APP.models.sync.requestActive = false;
	        }
	    });
	},

	closeModalViewVerifyPhone: function(e) {
		_preventDefault(e);
		$("#modalview-verifyPhone").kendoMobileModalView("close");
	},
	closeModalViewProfilePhotoEdit: function(e) {
		_preventDefault(e);
    	$("#modalview-profilePhotoEdit").kendoMobileModalView("close");
	},

	closeModalViewAddPhoto: function(e) {
		_preventDefault(e);
    	$("#modalview-gallery-addPhoto").kendoMobileModalView("close");
	},

	toggleSearch: function(e){
		var toggleVisible = $(".gg_mainSearchBox").data("visible");
		
		if(toggleVisible === true){
			// 
			$(".gg_mainSearchBox")
				.velocity("slideUp", {
					duration: 300
					})
				.data("visible", false);
		// Todo - add clearing onput on hide

		} else {
			$(".gg_mainSearchBox")
				.velocity("slideDown", {
					duration: 300
				})
				.data("visible", true);

		}
		
	},

	setSearchPlaceholder: function(placeholder){
		$(".gg_mainSearchInput").attr({
			"placeholder": placeholder
		});
	},

	hideSearch: function(){
		// kendo hack - this is needed
		$(".enterSearch").click();
		$(".gg_mainSearchBox").css("display", "none").data("visible", false);
	}

};



