/**
 * Created by donbrad on 8/23/16.
 */

'use strict';

var galleryChannel = {

    lastAccess: 0,   // last access time stamp
    _version: 1,
    _cloudClass: "gallery",
    _ggClass: 'Gallery',
    _class : 'gallery',
    pendingMessagesDS: null,  // list of offline messages to be sent
    messagesDS: null,  // gallery messages per gallery (likes, comments)
    galleryDS : null,  // list of gallery channels being tracked



    _addPhoto : 'addphoto',           // add photo (from owner)
    _removePhoto : 'removephoto',     // remove photo (from owner)
    _deleteGallery : 'deletegallery',     // delete gallery (from owner)
    _comment : 'comment',
    _like : 'like',


    init : function () {

    }
};