function addChannel(e) {
    e.preventDefault();

    var Channels = Parse.Object.extend("channels");
    var channel = new Channels();
    
    var name = $('#channels-addChannel-name').val(),
        media = $('#channels-addChannel-media').val(),
        archive = $('#channels-addChannel-archive').val(),
        expirationDate = $('#channels-addChannel-expirationDate').val(),
        description = $('#channels-addChannel-description').val(), 
        guid = uuid.v4()
        
    channel.set("name", name );
    channel.set("isOwner", true);
	channel.set('isPrivate', false);
    channel.set("media",  media === "true" ? true : false);
    channel.set("archive",  archive === "true" ? true : false);
    channel.set("expirationDate", expirationDate);
    channel.set("description", description);
    channel.set("channelId", guid);
    
    channel.setACL(APP.models.profile.parseACL);
    channel.save(null, {
      success: function(channel) {
        // Execute any logic that should take place after the object is saved.
         
          APP.models.channels.channelsDS.add(channel.attributes);
          closeModalViewAddChannel();
          
          mobileNotify('Added channel : ' + channel.get('name'));
      },
      error: function(channel, error) {
        // Execute any logic that should take place if the save fails.
        // error is a Parse.Error with an error code and message.
        mobileNotify('Error creating channel: ' + error.message);
        handleParseError(error);
      }
    });
 
}

function addPrivateChannel(user, contact, contactAlias, channel) {
    e.preventDefault();

    var Channels = Parse.Object.extend("channels");
    var channel = new Channels();
    
    var name = $('#channels-addChannel-name').val(),
        media = $('#channels-addChannel-media').val(),
        archive = $('#channels-addChannel-archive').val(),
        expirationDate = $('#channels-addChannel-expirationDate').val(),
        description = $('#channels-addChannel-description').val(), 
        guid = uuid.v4()
        
    channel.set("name", "Private: " + contactAlias);
    channel.set("isOwner", true);
	channel.set('isPrivate', true);
    channel.set("media",  true);
    channel.set("archive",  false);
    channel.set("expirationDate", null);
    channel.set("description", ");
    channel.set("channelId", channel);
    
    channel.setACL(APP.models.profile.parseACL);
    channel.save(null, {
      success: function(channel) {
        // Execute any logic that should take place after the object is saved.
         
          APP.models.channels.channelsDS.add(channel.attributes);
          closeModalViewAddChannel();
          
          mobileNotify('Added channel : ' + channel.get('name'));
      },
      error: function(channel, error) {
        // Execute any logic that should take place if the save fails.
        // error is a Parse.Error with an error code and message.
        mobileNotify('Error creating channel: ' + error.message);
        handleParseError(error);
      }
    });
 
}
    
function syncCurrentChannel(e)
{
   updateParseObject('channels','channelId', APP.models.channels.currentChannel.channelId, e.field, this[e.field]); 
   APP.models.channels.currentModel.set(e.field, this[e.field]);
}
    
function editChannel(e) {
   var channelId = e.context; 
   var dataSource = APP.models.channels.channelsDS;
    dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
    var view = dataSource.view();
    var channel = view[0];
    dataSource.filter([]);
    
    APP.models.channels.currentModel = channel;
    APP.models.channels.currentChannel.unbind('change', syncCurrentChannel);
    APP.models.channels.currentChannel.set('channelId', channel.channelId);
    APP.models.channels.currentChannel.set('name', channel.name);
    APP.models.channels.currentChannel.set('description', channel.description);
    APP.models.channels.currentChannel.set('expirationDate', channel.expirationDate);
    APP.models.channels.currentChannel.set('media', channel.media);
    APP.models.channels.currentChannel.set('archive', channel.archive);
    APP.models.channels.currentChannel.bind('change', syncCurrentChannel);
    
    APP.kendo.navigate('#editChannel');
}
    
function eraseChannel(e) {
    var channelId = e.context;  
}

function archiveChannel(e) {
    var channelId = e.context; 
}
    
function deleteChannel (e) {
   var channelId = e.context;  
    var dataSource = APP.models.channels.channelsDS;
    dataSource.filter( { field: "channelId", operator: "eq", value: channelId });
    var view = dataSource.view();
    var channel = view[0];
    dataSource.remove(channel); 
    deleteParseObject("channels", 'channelId', channelId);
     mobileNotify("Removed channel : " + channel.get('name'));
}
    
function onInitChannels (e) {
    e.preventDefault();
    // ToDo: Initialize list view
    
     $("#channels-listview").kendoMobileListView({
        dataSource: APP.models.channels.channelsDS,
        template: $("#channels-listview-template").html()
    });
}

function onInitChannel (e) {
    e.preventDefault();
    var params = e.view.params;
    // ToDo: Initialize list view
}
    
