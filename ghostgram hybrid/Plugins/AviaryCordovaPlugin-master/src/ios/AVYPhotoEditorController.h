//
//  AVYPhotoEditorViewController.h
//  AviarySDK
//
//  Copyright (c) 2014 Aviary. All rights reserved.
//

#import <UIKit/UIKit.h>

/**
 Options for defining a set of premium add ons to enable.
 */
typedef NS_OPTIONS(NSUInteger, AVYPhotoEditorPremiumAddOn) {
    /** The option indicating no premium add ons.*/
    AVYPhotoEditorPremiumAddOnNone = 0,
    /** The option indicating the high resolution premium add on.*/
    AVYPhotoEditorPremiumAddOnHiRes = 1 << 0,
    /** The option indicating the white labeling premium add on.*/
    AVYPhotoEditorPremiumAddOnWhiteLabel = 1 << 1,
};

@class AVYPhotoEditorController;
@class AVYPhotoEditorSession;
@protocol AVYInAppPurchaseManager;

/**
 Implement this protocol to be notified when the user is done using the editor.
 You are responsible for dismissing the editor when you (and/or your user) are
 finished with it.
 */
@protocol AVYPhotoEditorControllerDelegate <NSObject>
@optional

/**
 Implement this method to be notified when the user presses the "Done" button.
 
 The edited image is passed via the `image` parameter. The size of this image may
 not be equivalent to the size of the input image, if the input image is larger
 than the maximum image size supported by the SDK. Currently (as of 9/19/12), the
 maximum size is {1024.0, 1024.0} pixels on all devices.
 
 @param editor The photo editor controller.
 @param image The edited image.
 
 
 */
- (void)photoEditor:(AVYPhotoEditorController *)editor finishedWithImage:(UIImage *)image;

/**
 Implement this method to be notified when the user presses the "Cancel" button.
 
 @param editor The photo editor controller.
 */
- (void)photoEditorCanceled:(AVYPhotoEditorController *)editor;

@end

/**
 This class encapsulates the Aviary SDK's photo editor. Present this view controller to provide the user with a fast
 and powerful image editor. Be sure that you don't forget to set the delegate property
 to an object that conforms to the AVYPhotoEditorControllerDelegate protocol.
 */
@interface AVYPhotoEditorController : UIViewController

/**
 Configures the SDK's API Key and Secret. You must provide these before instantiating an
 instance of AVYPhotoEditorController. Not doing so will throw an exception. All API keys and secrets
 are validated with Aviary's server. If the provided key and secret do not match the ones created for
 your application, a UIAlertView will be displayed alerting you to the failed validation.
 
 @param apiKey your app's API key
 @param secret your app's secret
 */
+ (void)setAPIKey:(NSString *)apiKey secret:(NSString *)secret;

/**
 Configures the Premium add-ons that SDK will use. By default there are no premium add-ons enabled.
 The SDK will validate these add-ons on the server.
 
 @param premiumAddOns bitmask of the add-ons to enable
 */
+ (void)setPremiumAddOns:(AVYPhotoEditorPremiumAddOn)premiumAddOns;

/**
 Initialize the photo editor controller with an image.
 
 @param image The image to edit.
 */
- (instancetype)initWithImage:(UIImage *)image;

/**
 The photo editor's delegate.
 */
@property (nonatomic, weak) id<AVYPhotoEditorControllerDelegate> delegate;

/**
 @return The SDK version number.
 */
+ (NSString *)versionString;

@end

@protocol AVYPhotoEditorRender;

/// The error domain associated with issues arising from the editor.
extern NSString *const AVYPhotoEditorErrorDomain;

/// Status codes for high resolution render errors
typedef NS_ENUM(NSInteger, AVYPhotoEditorHighResolutionErrorCode) {
    /// Code indicating an unknown error occurred
    AVYPhotoEditorHighResolutionErrorCodeUnknown = 0,
    /// Code indicating the user cancelled the edit
    AVYPhotoEditorHighResolutionErrorCodeUserCancelled,
    /// Code indicating the user made no edits in the session
    AVYPhotoEditorHighResolutionErrorCodeNoModifications,
    /// Code indicating the render was cancelled by developer action
    AVYPhotoEditorHighResolutionErrorCodeRenderCancelled
};

@interface AVYPhotoEditorController (HighResolutionOutput)

typedef void(^AVYPhotoEditorRenderCompletion)(UIImage *result, NSError *error);

/**
 Replays all actions made in the generating AVYPhotoEditorController on the provided image.
 
 The provided image will be resized to fit within the `maxSize` parameter provided before any edits
 are performed.
 
 The completion block will be called when the render has finished and the `result` parameter will
 contain the edited image. If the user pressed "Cancel" or took no actions before pressing "Done",
 the `result` UIImage in the completion block will be nil and the appropriate `error` parameter
 will be provided. If the render is cancelled by developer action, then the completion block will
 be called with a nil `result` parameter and the appropriate `error` parameter.
 
 @param image The image to replay the edits on.
 @param maxSize The size to resize the input image to before replaying edits on it.
 @param completion The block to be called when the image's render is complete.
 
 @warning Calling this method from any thread other in the main thread may result in undefined behavior.
 */
- (id<AVYPhotoEditorRender>)enqueueHighResolutionRenderWithImage:(UIImage *)image
                                                     maximumSize:(CGSize)maxSize
                                                      completion:(AVYPhotoEditorRenderCompletion)completion;

/**
 Replays all actions made in the generating AVYPhotoEditorController on the provided image.
 
 The completion block will be called when the render has finished and the `result` parameter will
 contain the edited image. If the user pressed "Cancel" or took no actions before pressing "Done",
 the `result` UIImage in the completion block will be nil and the appropriate `error` parameter
 will be provided. If the render is cancelled by developer action, then the completion block will
 be called with a nil `result` parameter and the appropriate `error` parameter.
 
 @param image The image to replay the edits on.
 @param completion The block to be called when the image's render is complete.
 
 @warning Calling this method from any thread other in the main thread may result in undefined behavior.
 */
- (id<AVYPhotoEditorRender>)enqueueHighResolutionRenderWithImage:(UIImage *)image
                                                      completion:(AVYPhotoEditorRenderCompletion)completion;

@end

/**
 This protocol defines the capabilities of the token object returned by the high resolution
 API. Use these methods to query about the properties of the pending render or to cancel it if necessary.
 */
@protocol AVYPhotoEditorRender <NSObject>

/**
 The handler is called with an estimate of the progress in completing the render. It is guaranteed to be
 called on the main thread.
 
 @param progressHandler The block to be called with progress updates.
 
 */
@property (nonatomic, copy) void(^progressHandler)(CGFloat);

/// The size of the image that the render will output.
@property (nonatomic, assign, readonly) CGSize outputSize;

/**
 Cancels the render associated with the object.
 
 @warning Calling this method from any thread other in the main thread may result in undefined behavior.
 */
- (void)cancelRender;

@end

@interface AVYPhotoEditorController (InAppPurchase)

/**
 The handler object for purchasing consumable content. In order for in-app
 purchase to function correctly, you must add the object returned by this method
 as an observer of the default SKPaymentQueue. In your app delegate's
 -finishedLaunchingWithOptions: method, you should call startObservingTransactions
 on the in app purchase manager.
 
 Please see the Aviary iOS SDK In-App Purchase Guide for more information about
 in-app purchases.
 
 Please refer to AVYInAppPurchaseManager.h for the definition of the AVYInAppPurchaseManager protocol
 
 @see AVYInAppPurchaseManager
 @see AVYInAppPurchaseManagerDelegate
 @see [AVYInAppPurchaseManager startObservingTransactions] and [AVYInAppPurchaseManager stopObservingTransactions]
 
 @return The manager.
 */
+ (id<AVYInAppPurchaseManager>)inAppPurchaseManager;

@end

@interface AVYPhotoEditorController (Deprecated)

/**
 An AVYPhotoEditorSession instance that tracks user actions within the photo editor. This can
 be used for high-resolution processing. Usage of this property for generating high resolution output
 has been deprecated in favor of the `-enqueueHighResolutionRenderWithImage:maximumSize:completion:`
 and `-enqueueHighResolutionRenderWithImage:completion:` methods.
 */
@property (nonatomic, strong, readonly) AVYPhotoEditorSession *session
DEPRECATED_MSG_ATTRIBUTE("This property has been deprecated for high resolution output "
"in favor of -enqueueHighResolutionRenderWithImage:completion.");

@end
