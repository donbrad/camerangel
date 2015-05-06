function onInitChannel(e) {
	e.preventDefault();
	
}


function onShowChannel(e) {
	e.preventDefault();
	var channelUUID = e.view.params.channel;
	var thisChannel = findChannelModel(channelUUID);
	var name = thisChannel.name.substring(0,17)+"...";
	
	 $("#channelNavBar").kendoMobileNavBar("title", name);
	
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