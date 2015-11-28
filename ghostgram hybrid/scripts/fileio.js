/**
 * Created by donbrad on 11/27/15.
 *
 * fileio.js -- all phone device file io operations (mostly photos...)
 *
 */



var FileIO = {
    _imageUrl : null,
    _fileSystem : null,
    _imageName : null,

// sets the filesystem to the global var gFileSystem
    init : function(fileSystem) {
        FileIO._fileSystem = fileSystem;
    },

// pickup the URI from the Camera edit and assign it to the global var gImageURI
// create a filesystem object called a 'file entry' based on the image URI
// pass that file entry over to gotImageURI()
    savefile : function(imageURI, imageName) {
        FileIO._imageURI = imageURI;
        FileIO._imageName = imageName;
        window.resolveLocalFileSystemURI(imageURI, FileIO._saveFile, FileIO.errorHandler);
    },

// pickup the file entry, rename it, and move the file to the app's root directory.
// on success run the movedImageSuccess() method
    _saveFile : function(fileEntry) {
        var newName = FileIO._imageName + ".jpg";
        fileEntry.moveTo(gFileSystem.root, newName, FileIO.movedImageSuccess, FileIO.errorHandler);
    },

// send the full URI of the moved image to the updateImageSrc() method which does some DOM manipulation
    movedImageSuccess : function(fileEntry) {
        updateImageSrc(fileEntry.fullPath);
    },

// get a new file entry for the moved image when the user hits the delete button
// pass the file entry to removeFile()
    removeDeletedImage : function(imageURI){
        window.resolveLocalFileSystemURI(imageURI, FileIO.removeFile, FileIO.errorHandler);
    },

// delete the file
    removeFile : function(fileEntry){
        fileEntry.remove();
    },

// simple error handler
    errorHandler : function(e) {
        var msg = '';
        switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
                msg = 'QUOTA_EXCEEDED_ERR';
                break;
            case FileError.NOT_FOUND_ERR:
                msg = 'NOT_FOUND_ERR';
                break;
            case FileError.SECURITY_ERR:
                msg = 'SECURITY_ERR';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'INVALID_MODIFICATION_ERR';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'INVALID_STATE_ERR';
                break;
            default:
                msg = e.code;
                break;
        };
        console.log('Error: ' + msg);
    }
}