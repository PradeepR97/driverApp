/** Central animation timing — keep UI consistent and easy to tune. */
export const AnimDuration = {
    screenFadeMs: 280,
    homePanelCrossfadeMs: 340,
    loaderPulseMs: 640,
    bottomSheetMs: 420,
    cardScaleMs: 320,
    toastMs: 260,
    successToastVisibleMs: 2500,
    /** Trip finished: rating screen celebration */
    tripCompleteToastMs: 3000,
    pressScaleMs: 120,
    shakeNormalMs: 400,
    shakeCriticalMs: 520,
    checkmarkPopMs: 480,
};
export const AnimSpring = {
    sheet: { damping: 24, stiffness: 280 },
};
