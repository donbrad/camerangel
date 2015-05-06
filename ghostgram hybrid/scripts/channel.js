function onInitChannel(e) {
	e.preventDefault();
	
	 $("#contacts-listview").kendoMobileListView({
        dataSource: APP.models.channel.messagesDS,
        template: $("#messagesTemplate").html(),
        click: function (e) {
            var message = e.dataItem;
			APP.models.channel.currentModel = message;
            // display message actionsheet    
			$("#messageActions").data("kendoMobileActionSheet").open();
        }
     });
}	

function onChannelPresence () {
	
}

function onChannelRead() {
	
}

function onChannelWrite() {
	
}

function onShowChannel(e) {
	e.preventDefault();
	var channelUUID = e.view.params.channel;
	var thisChannel = findChannelModel(channelUUID);
	var thisUser = APP.models.profile.currentUser;
	var thisP2P = new person2person(thisUser.userUUID, channelUUID);
	
	var name = thisChannel.name;
	
	if (thisChannel.isPrivate) {
		name = '{' + name + '!}';
		if (name.length > 16)
		 name = name.substring(0,16)+ '...!}';
	} else {
		if (name.length > 17)
		name = name.substring(0,17)+"...";
	}
	
	$("#channelNavBar").data('kendoMobileNavBar').title(name);
}

function messageSend(e) {
	e.preventDefault();
	var text = $('#messageTextArea').val();
	_initMessageTextArea();
}

function _initMessageTextArea() {
	
	$('#messageTextArea').val('');
	$('#messageTextArea').attr("rows", "2");
	
}

function messageEraser (e) {
	e.preventDefault();
	_initMessageTextArea();	
}

function messageLockButton (e) {
	e.preventDefault();
	APP.models.channel.messageLock = !APP.models.channel.messageLock;
	if (APP.models.channel.messageLock) {
		$('#messageLockButton').html('<i class="fa fa-lock"></i>');
	} else {
		$('#messageLockButton').html('<i class="fa fa-unlock"></i>');
	}
}

function AutoGrowTextArea(textField)
{
  if (textField.clientHeight < textField.scrollHeight)
  {
    textField.style.height = textField.scrollHeight + "px";
    if (textField.clientHeight < textField.scrollHeight)
    {
      textField.style.height = 
        (textField.scrollHeight * 2 - textField.clientHeight) + "px";
    }
  }
}