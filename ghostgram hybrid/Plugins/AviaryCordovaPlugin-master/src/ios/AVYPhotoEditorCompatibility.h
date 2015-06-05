//
//  AVYPhotoEditorCompatibility.h
//  Ace
//
//  Created by Michael Vitrano on 12/4/14.
//  Copyright (c) 2014 Aviary. All rights reserved.
//

#import "AVYPhotoEditorController.h"

@class AVYPhotoEditorCustomization, AVYOpenGLManager;

@compatibility_alias AFPhotoEditorController AVYPhotoEditorController;
@compatibility_alias AFPhotoEditorContext AVYPhotoEditorContext;
@compatibility_alias AFPhotoEditorSession AVYPhotoEditorSession;
@compatibility_alias AFPhotoEditorProduct AVYPhotoEditorProduct;
@compatibility_alias AFPhotoEditorCustomization AVYPhotoEditorCustomization;
@compatibility_alias AFOpenGLManager AVYOpenGLManager;

#define AVY_PREMIUM_ADDON_NAMESPACE_DEPRECATED_ATTRIBUTE DEPRECATED_MSG_ATTRIBUTE("The AFPhotoEditorPremiumAddOn has been depreciated. "\
                                                                                  "Please use AVYPhotoEditorPremiumAddOn.")

typedef AVYPhotoEditorPremiumAddOn AFPhotoEditorPremiumAddOn AVY_PREMIUM_ADDON_NAMESPACE_DEPRECATED_ATTRIBUTE;
AVY_PREMIUM_ADDON_NAMESPACE_DEPRECATED_ATTRIBUTE extern AFPhotoEditorPremiumAddOn const AFPhotoEditorPremiumAddOnNone;
AVY_PREMIUM_ADDON_NAMESPACE_DEPRECATED_ATTRIBUTE extern AFPhotoEditorPremiumAddOn const AFPhotoEditorPremiumAddOnHiRes;
AVY_PREMIUM_ADDON_NAMESPACE_DEPRECATED_ATTRIBUTE extern AFPhotoEditorPremiumAddOn const AFPhotoEditorPremiumAddOnWhiteLabel;

DEPRECATED_MSG_ATTRIBUTE("The AFPhotoEditorControllerDelegate has been depreciated. " \
                         "Please use AVYPhotoEditorControllerDelegate.")
@protocol AFPhotoEditorControllerDelegate <AVYPhotoEditorControllerDelegate> @end

DEPRECATED_MSG_ATTRIBUTE("The AFInAppPurchaseManager has been depreciated. " \
                         "Please use AVYInAppPurchaseManager.")
@protocol AFInAppPurchaseManager <AVYInAppPurchaseManager> @end

DEPRECATED_MSG_ATTRIBUTE("The AFInAppPurchaseManagerDelegate has been depreciated. " \
                         "Please use AVYInAppPurchaseManagerDelegate.")
@protocol AFInAppPurchaseManagerDelegate <AVYInAppPurchaseManagerDelegate> @end

extern NSString *const AFPhotoEditorSessionCancelledNotification DEPRECATED_ATTRIBUTE;
extern NSString *const kAFPhotoEditorEffectsIAPEnabledKey DEPRECATED_ATTRIBUTE;

NSString *const _kAFEnhance(void) DEPRECATED_MSG_ATTRIBUTE("kAFEnhance has been deprecated. Please use kAVYEnhance.");
#define kAFEnhance _kAFEnhance()

NSString *const _kAFEffects(void) DEPRECATED_MSG_ATTRIBUTE("kAFEffects has been deprecated. Please use kAVYEffects.");
#define kAFEffects _kAFEffects()

NSString *const _kAFStickers(void) DEPRECATED_MSG_ATTRIBUTE("kAFStickers has been deprecated. Please use kAVYStickers.");
#define kAFStickers _kAFStickers()

NSString *const _kAFOrientation(void) DEPRECATED_MSG_ATTRIBUTE("kAFOrientation has been deprecated. Please use kAVYOrientation.");
#define kAFOrientation _kAFOrientation()

NSString *const _kAFCrop(void) DEPRECATED_MSG_ATTRIBUTE("kAFCrop has been deprecated. Please use kAVYCrop.");
#define kAFCrop _kAFCrop()

NSString *const _kAFAdjustments(void) DEPRECATED_MSG_ATTRIBUTE("kAFAdjustments has been deprecated. Please use kAVYAdjustments.");
#define kAFAdjustments _kAFAdjustments()

NSString *const _kAFColorAdjust(void) DEPRECATED_MSG_ATTRIBUTE("kAFColorAdjust has been deprecated. Please use kAVYColorAdjust.");
#define kAFColorAdjust _kAFColorAdjust()

NSString *const _kAFLightingAdjust(void) DEPRECATED_MSG_ATTRIBUTE("kAFLightingAdjust has been deprecated. Please use kAVYLightingAdjust.");
#define kAFLightingAdjust _kAFLightingAdjust()

NSString *const _kAFSharpness(void) DEPRECATED_MSG_ATTRIBUTE("kAFSharpness has been deprecated. Please use kAVYSharpness.");
#define kAFSharpness _kAFSharpness()

NSString *const _kAFDraw(void) DEPRECATED_MSG_ATTRIBUTE("kAFDraw has been deprecated. Please use kAVYDraw.");
#define kAFDraw _kAFDraw()

NSString *const _kAFText(void) DEPRECATED_MSG_ATTRIBUTE("kAFText has been deprecated. Please use kAVYText.");
#define kAFText _kAFText()

NSString *const _kAFRedeye(void) DEPRECATED_MSG_ATTRIBUTE("kAFRedeye has been deprecated. Please use kAVYRedeye.");
#define kAFRedeye _kAFRedeye()

NSString *const _kAFWhiten(void) DEPRECATED_MSG_ATTRIBUTE("kAFWhiten has been deprecated. Please use kAVYWhiten.");
#define kAFWhiten _kAFWhiten()

NSString *const _kAFBlemish(void) DEPRECATED_MSG_ATTRIBUTE("kAFBlemish has been deprecated. Please use kAVYBlemish.");
#define kAFBlemish _kAFBlemish()

NSString *const _kAFBlur(void) DEPRECATED_MSG_ATTRIBUTE("kAFBlur has been deprecated. Please use kAVYBlur.");
#define kAFBlur _kAFBlur()

NSString *const _kAFMeme(void) DEPRECATED_MSG_ATTRIBUTE("kAFMeme has been deprecated. Please use kAVYMeme.");
#define kAFMeme _kAFMeme()

NSString *const _kAFFrames(void) DEPRECATED_MSG_ATTRIBUTE("kAFFrames has been deprecated. Please use kAVYFrames.");
#define kAFFrames _kAFFrames()

NSString *const _kAFFocus(void) DEPRECATED_MSG_ATTRIBUTE("kAFFocus has been deprecated. Please use kAVYFocus.");
#define kAFFocus _kAFFocus()

NSString *const _kAFSplash(void) DEPRECATED_MSG_ATTRIBUTE("kAFSplash has been deprecated. Please use kAVYSplash.");
#define kAFSplash _kAFSplash()

NSString *const _kAFLeftNavigationTitlePresetCancel(void) DEPRECATED_MSG_ATTRIBUTE("kAFLeftNavigationTitlePresetCancel has been deprecated. Please use kAVYLeftNavigationTitlePresetCancel.");
#define kAFLeftNavigationTitlePresetCancel _kAFLeftNavigationTitlePresetCancel()

NSString *const _kAFLeftNavigationTitlePresetBack(void) DEPRECATED_MSG_ATTRIBUTE("kAFLeftNavigationTitlePresetBack has been deprecated. Please use kAVYLeftNavigationTitlePresetBack.");
#define kAFLeftNavigationTitlePresetBack _kAFLeftNavigationTitlePresetBack()

NSString *const _kAFLeftNavigationTitlePresetExit(void) DEPRECATED_MSG_ATTRIBUTE("kAFLeftNavigationTitlePresetExit has been deprecated. Please use kAVYLeftNavigationTitlePresetExit.");
#define kAFLeftNavigationTitlePresetExit _kAFLeftNavigationTitlePresetExit()

NSString *const _kAFRightNavigationTitlePresetDone(void) DEPRECATED_MSG_ATTRIBUTE("kAFRightNavigationTitlePresetDone has been deprecated. Please use kAVYRightNavigationTitlePresetDone.");
#define kAFRightNavigationTitlePresetDone _kAFRightNavigationTitlePresetDone()

NSString *const _kAFRightNavigationTitlePresetSave(void) DEPRECATED_MSG_ATTRIBUTE("kAFRightNavigationTitlePresetSave has been deprecated. Please use kAVYRightNavigationTitlePresetSave.");
#define kAFRightNavigationTitlePresetSave _kAFRightNavigationTitlePresetSave()

NSString *const _kAFRightNavigationTitlePresetNext(void) DEPRECATED_MSG_ATTRIBUTE("kAFRightNavigationTitlePresetNext has been deprecated. Please use kAVYRightNavigationTitlePresetNext.");
#define kAFRightNavigationTitlePresetNext _kAFRightNavigationTitlePresetNext()

NSString *const _kAFRightNavigationTitlePresetSend(void) DEPRECATED_MSG_ATTRIBUTE("kAFRightNavigationTitlePresetSend has been deprecated. Please use kAVYRightNavigationTitlePresetSend.");
#define kAFRightNavigationTitlePresetSend _kAFRightNavigationTitlePresetSend()

NSString *const _kAFCropPresetName(void) DEPRECATED_MSG_ATTRIBUTE("kAFCropPresetName has been deprecated. Please use kAVYCropPresetName.");
#define kAFCropPresetName _kAFCropPresetName()

NSString *const _kAFCropPresetWidth(void) DEPRECATED_MSG_ATTRIBUTE("kAFCropPresetWidth has been deprecated. Please use kAVYCropPresetWidth.");
#define kAFCropPresetWidth _kAFCropPresetWidth()

NSString *const _kAFCropPresetHeight(void) DEPRECATED_MSG_ATTRIBUTE("kAFCropPresetHeight has been deprecated. Please use kAVYCropPresetHeight.");
#define kAFCropPresetHeight _kAFCropPresetHeight()

NSString *const _kAFProductEffectsGrunge(void) DEPRECATED_MSG_ATTRIBUTE("kAFProductEffectsGrunge is deprecated. Please use kAVYProductEffectsGrunge.");
#define kAFProductEffectsGrunge _kAFProductEffectsGrunge()

NSString *const _kAFProductEffectsNostalgia(void) DEPRECATED_MSG_ATTRIBUTE("kAFProductEffectsNostalgia is deprecated. Please use kAVYProductEffectsNostalgia.");
#define kAFProductEffectsNostalgia _kAFProductEffectsNostalgia()

NSString *const _kAFProductEffectsViewfinder(void) DEPRECATED_MSG_ATTRIBUTE("kAFProductEffectsViewfinder is deprecated. Please use kAVYProductEffectsViewfinder.");
#define kAFProductEffectsViewfinder _kAFProductEffectsViewfinder()
