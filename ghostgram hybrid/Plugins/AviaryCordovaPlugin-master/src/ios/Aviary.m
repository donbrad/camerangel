#import "Aviary.h"
#import <Cordova/CDVPlugin.h>


@implementation Aviary

@synthesize aviary;
@synthesize pluginCallbackId;
@synthesize quality;
@synthesize originalImageURI;

- (void) prepareForShow:(CDVInvokedUrlCommand*) command
{
    [AVYOpenGLManager beginOpenGLLoad];
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void) show:(CDVInvokedUrlCommand*) command
{
    pluginCallbackId = command.callbackId;
    
    originalImageURI = [command.arguments objectAtIndex:0];
    
    NSURL* url = [NSURL URLWithString:originalImageURI];
    NSString* imagePath = [url path];
    UIImage* image = [UIImage imageWithContentsOfFile:imagePath];

    quality = [command.arguments objectAtIndex:2];
    
    // tool list
    if (![[command.arguments objectAtIndex:3] isEqual:[NSNull null]])
    {
        NSArray* toolList = [command.arguments objectAtIndex:3];
        NSMutableArray* tools = [[NSMutableArray alloc] init];
        
        for (id object in toolList)
        {
            if ([object isEqualToString:@"SHARPNESS"])
            {
                [tools addObject:kAVYSharpness];
            }
            else if ([object isEqualToString:@"EFFECTS"])
            {
                [tools addObject:kAVYEffects];
            }
            else if ([object isEqualToString:@"RED_EYE"])
            {
                [tools addObject:kAVYRedeye];
            }
            else if ([object isEqualToString:@"CROP"])
            {
                [tools addObject:kAVYCrop];
            }
            else if ([object isEqualToString:@"WHITEN"])
            {
                [tools addObject:kAVYWhiten];
            }
            else if ([object isEqualToString:@"DRAWING"])
            {
                [tools addObject:kAVYDraw];
            }
            else if ([object isEqualToString:@"STICKERS"])
            {
                [tools addObject:kAVYStickers];
            }
            else if ([object isEqualToString:@"TEXT"])
            {
                [tools addObject:kAVYText];
            }
            else if ([object isEqualToString:@"BLEMISH"])
            {
                [tools addObject:kAVYBlemish];
            }
            else if ([object isEqualToString:@"MEME"])
            {
                [tools addObject:kAVYMeme];
            }
            else if ([object isEqualToString:@"ADJUST"])
            {
                [tools addObject:kAVYAdjustments];
            }
            else if ([object isEqualToString:@"ENHANCE"])
            {
                [tools addObject:kAVYEnhance];
            }
            else if ([object isEqualToString:@"COLOR_SPLASH"])
            {
                [tools addObject:kAVYSplash];
            }
            else if ([object isEqualToString:@"TILT_SHIFT"])
            {
                [tools addObject:kAVYFocus];
            }
            else if ([object isEqualToString:@"ORIENTATION"])
            {
                [tools addObject:kAVYOrientation];
            }
            else if ([object isEqualToString:@"FRAMES"])
            {
                [tools addObject:kAVYFrames];
            }
        }
        
        [AVYPhotoEditorCustomization setToolOrder:tools];
    }
    
    self.aviary = [[AVYPhotoEditorController alloc] initWithImage:image];
    [self.aviary setDelegate:self];
    [self.viewController presentModalViewController:self.aviary animated:YES];
}

-(void) photoEditor:(AVYPhotoEditorController *)editor finishedWithImage:(UIImage *)image
{
    if (!editor.session.isModified) {
        [self returnSuccess:originalImageURI];
        [self closeAviary];
        return;
    }
    
    BOOL ok = false;
    NSString * res = @"error";
    BOOL saveToPhotoAlbum = YES;
    
    NSData* data = nil;
    data = UIImageJPEGRepresentation(image , (quality ? ([quality floatValue] / 100) : 0.9f));
    
    // write to temp directory and reutrn URI
    // get the temp directory path
    NSString* docsPath = [NSTemporaryDirectory() stringByStandardizingPath];
    NSError* err = nil;
    NSFileManager* fileMgr = [[NSFileManager alloc] init];
    
    // generate unique file name
    NSString* filePath;
    int i=1;
    do
    {
        filePath = [NSString stringWithFormat:@"%@/photo_%03d.%@", docsPath, i++, @"jpg"];
    }
    while([fileMgr fileExistsAtPath: filePath]);
    
    // save file
    if (![data writeToFile: filePath options: NSAtomicWrite error: &err])
    {
        res = @"error saving file";
    }
    else
    {
        res = [[NSURL fileURLWithPath: filePath] absoluteString];
        ok = true;
    }

    if(ok)
    {
        if (saveToPhotoAlbum )
            UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil);
        
        [self returnSuccess:res];
    }
    else
    {
        [self returnError:res];
    }
    
    [self closeAviary];
}

-(void) photoEditorCanceled:(AVYPhotoEditorController *)editor
{
    [self closeAviary];
}


-(void) returnSuccess:(NSString*)imagePath
{
    NSString* filename = [imagePath lastPathComponent];
    
    NSMutableDictionary* dict = [[NSMutableDictionary alloc]init];
    [dict setObject:imagePath forKey:@"src"];
    [dict setObject:filename forKey:@"name"];
    
    CDVPluginResult* result = [CDVPluginResult
                               resultWithStatus:CDVCommandStatus_OK
                               messageAsDictionary:dict];
    
    NSString* javaScript = [result toSuccessCallbackString:self.pluginCallbackId];
    [self writeJavascript:javaScript];
}

-(void) returnError:(NSString*)message
{
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:message];
    
    NSString* javaScript = [result toSuccessCallbackString:self.pluginCallbackId];
    [self writeJavascript:javaScript];
}


-(void) closeAviary
{
    
    [self.aviary dismissModalViewControllerAnimated:YES];
    self.aviary.delegate = nil;
    self.aviary = nil;
}

@end
