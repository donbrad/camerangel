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