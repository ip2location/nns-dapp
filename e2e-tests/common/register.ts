import { AuthPage } from "../components/auth";
import { IIWelcomeBackPage } from "../components/ii-welcome-back-page";
import { IIWelcomePage } from "../components/ii-welcome-page";
import { IIWelcomePage } from "../components/ii-add-device-page";
import { IICaptchaPage } from "../components/ii-captcha-page";
import { IICongratulationsPage } from "../components/ii-congratulations-page";
import { IIRecoveryMechanismPage } from "../components/ii-recovery-mechanism";
import { IIRecoveryMissingWarningPage } from "../components/ii-recovery-warning";
import { IIConfirmRedirectPage } from "../components/ii-confirm-redirect";
import { IIAddDevicePage } from "../components/ii-add-device-page";
import { Navigator } from "./navigator";

/**
 * Registers a new identity on the Internet Identity.
 */
export const register = async (browser: WebdriverIO.Browser): string => {
  const navigator = new Navigator(browser);

  // Record the ID of the tab we started on.
  const originalTabId = await browser.getWindowHandle();

  // On the NNS frontend dapp, click "Login".
  // Wait for a new tab to open, then switch to it.
  await navigator.clickToOpenWindow(
    AuthPage.LOGIN_BUTTON_SELECTOR,
    "registration-nns-login-page",
    { timeout: 10_000 }
  );

  // We should now be on the Internet Identity page.
  // We may get to the "Welcome" or the "Welcome back" page.  If we get "Welcome back"
  // then we need to navigate to the normal welcome page to register.
  // ... wait for either welcome page
  (
    await browser.$(
      `${IIWelcomeBackPage.LOGIN_DIFFERENT_BUTTON_SELECTOR}, ${IIWelcomePage.REGISTER_BUTTON_SELECTOR}`
    )
  ).waitForExist({ timeout: 30_000 });
  // ... is this the welcome back page?
  const loginDifferent = browser.$(
    IIWelcomeBackPage.LOGIN_DIFFERENT_BUTTON_SELECTOR
  );
  if (await loginDifferent.isExisting()) {
    // ... go to the normal welcome page.
    await browser["screenshot"]("registration-ii-welcome-back");
    await loginDifferent.click();
  }
  // We should now be on the normal welcome page, regardless of how we got here.

  // Click the button to register.
  await navigator.click(
    IIWelcomePage.REGISTER_BUTTON_SELECTOR,
    "registration-ii-welcome-page",
    { timeout: 20_000 }
  );

  // Add Device Page
  const registerAlias = await navigator.get(
    IIAddDevicePage.REGISTER_ALIAS_INPUT_SELECTOR,
    "registration-ii-device-name-input"
  );
  await registerAlias.setValue("My Device");
  await navigator.click(
    IIAddDevicePage.SUBMIT_BUTTON_SELECTOR,
    "registration-ii-device-name"
  );

  // Captcha Page
  const captchaInput = await navigator.get(
    IICaptchaPage.CAPTCHA_INPUT_SELECTOR,
    "registration-ii-captcha-input",
    { timeout: 30_000 }
  );
  await captchaInput.setValue("a");
  await browser.waitUntil(async () => {
    return (await captchaInput.getValue()) === "a";
  });

  // Long wait: Constructing your Identity Anchor
  await navigator.click(
    IICaptchaPage.CONFIRM_REGISTER_BUTTON,
    "registration-ii-captcha",
    { timeout: 30_000 }
  );

  // Congratulations Page
  const newIdentity = await navigator
    .get(
      IICongratulationsPage.IDENTITY_SELECTOR,
      "registration-ii-new-identity"
    )
    .then((element) => element.getText());
  await navigator.click(
    IICongratulationsPage.CONTINUE_BUTTON_SELECTOR,
    "registration-ii-congratulations",
    { timeout: 30_000 }
  );

  // Recovery Mechanism Page
  await navigator.click(
    IIRecoveryMechanismPage.SKIP_RECOVERY_BUTTON_SELECTOR,
    "registration-ii-recovery-mechanisms"
  );

  // Warning Recovery Mechanism Page
  await navigator.click(
    IIRecoveryMissingWarningPage.SKIP_BUTTON_SELECTOR,
    "registration-ii-recovery-warning"
  );

  // Confirm Redirect Page
  await navigator.click(
    IIConfirmRedirectPage.CONFIRM_REDIRECT_BUTTON_SELECTOR,
    "registration-ii-confirm-redirect"
  );

  // Switch back to original window
  await browser.switchToWindow(originalTabId);

  console.log("Created identity", newIdentity);
  return newIdentity;
};
