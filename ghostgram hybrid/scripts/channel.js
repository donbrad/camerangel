function onInitChannel(e) {
	e.preventDefault();
	


function onShowChannel(e) {
	e.preventDefault();
	var channelUUID = e.view.params.channel;
	var thisChannel = findChannelModel(channelUUID);
	var name = thisChannel.name.substring(0,17)+"...";
	
	 $("#channelNavBar").kendoMobileNavBar("title", name);
	
	APP.models.channel.textAreaHeight = $('#messageTextArea').clientHeight;
}
	
}

function messageSend(e) {
	e.preventDefault();
	var text = $('#messageTextArea').val();
}

function _initMessageTextArea() {
	var textField = $('#messageTextArea');
	$('#messageTextArea').val('');
	textField.style.height = APP.models.channel.textAreaHeight;
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