//
//  AVYPhotoEditorCustomization.h
//  AviarySDK
//
//  Copyright (c) 2012-2014 Aviary. All rights reserved.
//

/** @defgroup AVYPhotoEditorControllerOptions AVYPhotoEditorController Option Dictionary Keys */

/** @addtogroup AVYPhotoEditorControllerOptions
 @{
 */

extern NSString *const kAVYEnhance;     							/* Enhance */
extern NSString *const kAVYEffects;     							/* Effects */
extern NSString *const kAVYStickers;    							/* Stickers */
extern NSString *const kAVYOrientation; 							/* Orientation */
extern NSString *const kAVYCrop;        							/* Crop */
extern NSString *const kAVYAdjustments DEPRECATED_ATTRIBUTE;  	/* Deprecated, use kAVYColorAdjust and kAVYLightingAdjust instead */
extern NSString *const kAVYColorAdjust;							/* Color */
extern NSString *const kAVYLightingAdjust;						/* Lighting */
extern NSString *const kAVYSharpness;   							/* Sharpness */
extern NSString *const kAVYDraw;        							/* Draw */
extern NSString *const kAVYText;        							/* Text */
extern NSString *const kAVYRedeye;      							/* Redeye */
extern NSString *const kAVYWhiten;      							/* Whiten */
extern NSString *const kAVYBlemish;     							/* Blemish */
extern NSString *const kAVYBlur;        							/* Blur */
extern NSString *const kAVYMeme;              					/* Meme */
extern NSString *const kAVYFrames;           					/* Frames */
extern NSString *const kAVYFocus;            					/* TiltShift */
extern NSString *const kAVYSplash;           					/* ColorSplash */
extern NSString *const kAVYOverlay;          					/* Overlay */
extern NSString *const kAVYVignette;         					/* Vignette */


extern NSString *const kAVYLeftNavigationTitlePresetCancel; 		/* Cancel */
extern NSString *const kAVYLeftNavigationTitlePresetBack;   		/* Back */
extern NSString *const kAVYLeftNavigationTitlePresetExit;   		/* Exit */

extern NSString *const kAVYRightNavigationTitlePresetDone;  		/* Done */
extern NSString *const kAVYRightNavigationTitlePresetSave;  		/* Save */
extern NSString *const kAVYRightNavigationTitlePresetNext;  		/* Next */
extern NSString *const kAVYRightNavigationTitlePresetSend;  		/* Send */

extern NSString *const kAVYCropPresetName;   					/* Name */
extern NSString *const kAVYCropPresetWidth;  					/* Width */
extern NSString *const kAVYCropPresetHeight; 					/* Height */

/** @} */

/**
 This class provides a powerful interface for configuring an AVYPhotoEditorController's appearance and behavior. While changing values after 
 presenting an AVYPhotoEditorController instance is possible, it is strongly recommended that you make all necessary 
 calls to AVYPhotoEditorCustomization *before* editor presentation. Example of usage can be found in the Aviary iOS SDK Customization Guide.
 */
@interface AVYPhotoEditorCustomization : NSObject

@end

@interface AVYPhotoEditorCustomization (PCNSupport)

/**
 Configures the editor to point at the Premium Content Network's staging environment.
 
 By default, the editor points at the production environment. Call this method with YES before editor to launch to view the content in the Premium Content Network staging environment.
  @param usePCNStagingEnvironment YES points the editor to staging, no points it to production.
 */
+ (void)usePCNStagingEnvironment:(BOOL)usePCNStagingEnvironment;

@end

@interface AVYPhotoEditorCustomization (iPadOrientation)

/**
 Configures the orientations the editor can have on the iPad form factor.
 
 On the iPhone form factor, orientation is always portrait.
 
 @param supportedOrientations An NSArray containing NSNumbers each representing a valid UIInterfaceOrientation.*/
+ (void)setSupportedIpadOrientations:(NSArray *)supportedOrientations;
+ (NSArray *)supportedIpadOrientations;

@end

@interface AVYPhotoEditorCustomization (Appearance)

/**
 Sets the tool's icon image in the editor's home bottom bar.
 
 Tool options are as follows:
 
 kAVYEnhance
 kAVYEffects
 kAVYStickers
 kAVYOrientation
 kAVYCrop
 kAVYBrightness
 kAVYContrast
 kAVYSaturation
 kAVYSharpness
 kAVYDraw
 kAVYText
 kAVYRedeye
 kAVYWhiten
 kAVYBlemish
 kAVYMeme
 kAVYFrames;
 kAVYFocus
 
 @param image The image to use.
 @param tool The tool to set for the image. See the discussion for possible values.
 */
+ (void)setIconImage:(UIImage*)image forTool:(NSString*)tool;

/**
 Sets the editor's navigation bar's background image.
 
 @param navBarImage The image to use.
 */
+ (void)setNavBarImage:(UIImage *)navBarImage;

/**
 Sets the editor's preferred status bar style when running on a device running iOS 7
 
 @param statusBarStyle The status bar style to use.
 */
+ (void)setStatusBarStyle:(UIStatusBarStyle)statusBarStyle;

@end

@interface AVYPhotoEditorCustomization (Imaging)

/**
 Configures the editor to free GPU memory when possible.
 
 By default, Aviary keeps a small number of OpenGL objects loaded to optimize launches of Aviary products. Set this key to YES purge GPU memory when possible.
 
 @param purgeGPUMemory YES purges GPU memory when possible, NO retains it.
 */
+ (void)purgeGPUMemoryWhenPossible:(BOOL)purgeGPUMemory;
+ (BOOL)purgeGPUMemoryWhenPossible;

@end

@interface AVYPhotoEditorCustomization (NavigationBarButtons)

/**
 Sets the text of the editor's left navigation bar button.
 
 Attempting to set any string besides one of the kAVYLeftNavigationTitlePresets will have no effect.
 
 @param leftNavigationBarButtonTitle An NSString value represented by one of the three kAVYLeftNavigationTitlePreset keys.*/
+ (void)setLeftNavigationBarButtonTitle:(NSString *)leftNavigationBarButtonTitle;
+ (NSString *)leftNavigationBarButtonTitle;

/**
 Sets the text of the editor's right navigation bar button.
 
 Attempting to set any string besides one of the kAVYRightNavigationTitlePresets will have no effect.
 
 @param rightNavigationBarButtonTitle An NSString value represented by one of the three kAVYRightNavigationTitlePreset keys.*/
+ (void)setRightNavigationBarButtonTitle:(NSString *)rightNavigationBarButtonTitle;
+ (NSString *)rightNavigationBarButtonTitle;

@end

@interface AVYPhotoEditorCustomization (ToolSettings)

/**
 Sets the type and order of tools to be presented by the editor.
 
 The valid tool keys are:
 
 kAVYEnhance
 kAVYEffects
 kAVYStickers
 kAVYOrientation
 kAVYCrop
 kAVYAdjustments
 kAVYSharpness
 kAVYDraw
 kAVYText
 kAVYRedeye
 kAVYWhiten
 kAVYBlemish
 kAVYMeme
 kAVYFrames;
 kAVYFocus
 
 @param toolOrder An NSArray containing NSString values represented by one of the tool keys*/
+ (void)setToolOrder:(NSArray *)toolOrder;
+ (NSArray *)toolOrder;

/**
 Enables or disables the custom crop size.
 
 The Custom crop preset does not constrain the crop area to any specific aspect ratio. By default, custom crop size is enabled.
 
 @param cropToolEnableCustom YES enables the custom crop size, NO disables it.*/
+ (void)setCropToolCustomEnabled:(BOOL)cropToolEnableCustom;
+ (BOOL)cropToolCustomEnabled;

/**
 Enables or disables the custom crop size.
 
 The Original crop preset constrains the crop area to photo's original aspect ratio. By default, original crop size is enabled.
 
 @param cropToolEnableOriginal YES enables the original crop size, NO disables it.*/
+ (void)setCropToolOriginalEnabled:(BOOL)cropToolEnableOriginal;
+ (BOOL)cropToolOriginalEnabled;

/**
 Enables or disables the invertability of crop sizes.
 
 By default, inversion is enabled. Presets with names, i.e. Square, are not invertible, regardless of whether inversion is enabled.
 
 @param cropToolEnableInvert YES enables the crop size inversion, NO disables it.*/
+ (void)setCropToolInvertEnabled:(BOOL)cropToolEnableInvert;
+ (BOOL)cropToolInvertEnabled;

/** Sets the availability and order of crop preset options.
 
 The dictionaries should be of the form @{kAVYCropPresetName: <NSString representing the display name>, kAVYCropPresetWidth: <NSNumber representing width>, kAVYCropPresetHeight: <NSNumber representing height>}. When the corresponding option is selected, the crop box will be constrained to a kAVYCropPresetWidth:kAVYCropPresetHeight aspect ratio.
 
 If Original and/or Custom options are enabled, then they will precede the presets defined here. If no crop tool presets are set, the default options are Square, 3x2, 5x3, 4x3, 6x4, and 7x5.
 
 @param cropToolPresets An array of dictionaries. The dictionaries should
 */
+ (void)setCropToolPresets:(NSArray *)cropToolPresets;
+ (NSArray *)cropToolPresets;

@end

@interface AVYPhotoEditorCustomization (UserMessaging)

/**
 Configures whether to show tutorials explaining the editor's features to users. By default, this is set to YES.
 
 @param tutorialsEnabled whether to enable the the tutorials or not
 */

+ (void)setTutorialsEnabled:(BOOL)tutorialsEnabled;
+ (BOOL)tutorialsEnabled;

/**
 Configures whether to ask the user for a confirmation when cancelling out of the editor with unsaved edits.
 
 By default, this returns YES.
 
 @param tutorialsEnabled whether to show the confirmation or not
 */
+ (void)setConfirmOnCancelEnabled:(BOOL)confirmOnCancelEnabled;
+ (BOOL)confirmOnCancelEnabled;

@end

@interface AVYPhotoEditorCustomization (Localization)

/**
 Configures the editor to use localization or not.
 
 By default, Aviary enables localization.
 
 @param disableLocalization YES disables localization, NO leaves it enabled.*/
+ (void)disableLocalization:(BOOL)disableLocalization;

@end
