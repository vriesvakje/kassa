// Geïnjecteerd script (injected.js) - Directe DOM manipulatie voor datum & klant & daily cash save
// console.log("Injected.js (directe DOM, multi-page date, daily cash save) geladen.");

const CHECKOUT_URL_SUFFIX = "/checkout/basket";
const DAILY_CASH_URL_CONTAINS = "/dailycashbalance/";

const DATE_SELECTORS = {
  CHECKOUT_DATE_INPUT: 'input[ng-model="ctrl.dirtyBasket.serviceDateUtc"]',
  DAILY_CASH_DATE_INPUT: 'input[ng-model="ctrl.dailyCashBalanceReport.balanceDateUtc"]',
};

const CUSTOMER_SELECTORS = { // Only for checkout page
  MATCH_CONTAINER: '.ui-select-match-text > span.ng-binding', 
  TOGGLE: 'span.ui-select-toggle',
  CHOICES_CONTAINER: 'ul.ui-select-choices',
};

const DAILY_CASH_SELECTORS = {
  SAVE_BUTTON: 'button[ng-click="ctrl.save(dailyCashBalanceForm, false)"]',
};

let customerSelectionAttemptedThisLoad = false; // Specific to checkout page

function waitForElement(selector, timeout = 5000, parent = document) {
  return new Promise((resolve) => {
    const intervalTime = 100;
    let elapsedTime = 0;
    const timer = setInterval(() => {
      const element = parent.querySelector(selector);
      if (element) {
        clearInterval(timer);
        resolve(element);
      } else {
        elapsedTime += intervalTime;
        if (elapsedTime >= timeout) {
          clearInterval(timer);
          resolve(null); 
        }
      }
    }, intervalTime);
  });
}

async function selectMevrouwCustomer() { /* ... (as before) ... */
  if (!window.location.pathname.endsWith(CHECKOUT_URL_SUFFIX)) return;
  if (customerSelectionAttemptedThisLoad) return;
  try {
    const matchContainer = document.querySelector(CUSTOMER_SELECTORS.MATCH_CONTAINER);
    if (matchContainer && matchContainer.textContent.trim() === "* Mevrouw...") {
      customerSelectionAttemptedThisLoad = true; return;
    }
    const toggle = await waitForElement(CUSTOMER_SELECTORS.TOGGLE);
    if (!toggle) { customerSelectionAttemptedThisLoad = true; return; }
    toggle.click(); 
    const choicesContainer = await waitForElement(CUSTOMER_SELECTORS.CHOICES_CONTAINER);
    if (!choicesContainer) { customerSelectionAttemptedThisLoad = true; return; }
    await new Promise(resolve => setTimeout(resolve, 700));
    const targetText = "* Mevrouw...";
    let mevrouwOptionElement = null;
    const choiceElements = choicesContainer.querySelectorAll('li div[ng-bind-html], li span[ng-bind-html], div[role="option"] span');
    for (const el of choiceElements) {
      if (el.textContent && el.textContent.trim() === targetText) {
        mevrouwOptionElement = el; break;
      }
    }
    if (mevrouwOptionElement) mevrouwOptionElement.click();
    else if (document.querySelector('.ui-select-container.open')) toggle.click();
  } catch (error) { console.error("Injected.js: Fout bij selecteren Mevrouw klant:", error);
  } finally { customerSelectionAttemptedThisLoad = true; }
}

async function clickDailyCashSaveButton() {
  let success = false;
  let errorMessage = "";
  if (!window.location.pathname.includes(DAILY_CASH_URL_CONTAINS)) {
    errorMessage = "Niet op de dailycashbalance pagina.";
    // console.warn("Injected.js: " + errorMessage);
    window.postMessage({ type: "DAILY_CASH_SAVE_STATUS", success: false, error: errorMessage }, "*");
    return;
  }

  try {
    const saveButton = await waitForElement(DAILY_CASH_SELECTORS.SAVE_BUTTON);
    if (saveButton) {
      if (!saveButton.disabled) {
        saveButton.click();
        // console.log("Injected.js: 'Opslaan' knop geklikt op dailycashbalance pagina.");
        success = true;
      } else {
        errorMessage = "'Opslaan' knop is uitgeschakeld.";
        // console.warn("Injected.js: " + errorMessage);
      }
    } else {
      errorMessage = "'Opslaan' knop niet gevonden op dailycashbalance pagina.";
      // console.warn("Injected.js: " + errorMessage);
    }
  } catch (error) {
    errorMessage = error.message;
    console.error("Injected.js: Fout bij klikken op 'Opslaan' knop:", error);
  }
  window.postMessage({ type: "DAILY_CASH_SAVE_STATUS", success: success, error: errorMessage }, "*");
}

function setDateOnPage(dateString) { /* ... (as before) ... */
  let success = false;
  let errorMessage = "";
  let dateInputSelector = null;
  let pageType = null;

  if (window.location.pathname.endsWith(CHECKOUT_URL_SUFFIX)) {
    dateInputSelector = DATE_SELECTORS.CHECKOUT_DATE_INPUT;
    pageType = "checkout";
  } else if (window.location.pathname.includes(DAILY_CASH_URL_CONTAINS)) {
    dateInputSelector = DATE_SELECTORS.DAILY_CASH_DATE_INPUT;
    pageType = "dailyCash";
  }

  if (!dateInputSelector) {
    window.postMessage({ type: "DATE_SET_STATUS", success: false, date: dateString, error: "Niet op ondersteunde pagina" }, "*");
    return;
  }

  try {
    const inputElement = document.querySelector(dateInputSelector);
    if (inputElement) {
      const scope = angular.element(inputElement).scope();
      if (scope && scope.ctrl) {
        const newDate = new Date(dateString + 'T00:00:00');
        let dateChanged = false;
        if (pageType === "checkout" && scope.ctrl.dirtyBasket && typeof scope.ctrl.serviceDateChanged === 'function') {
          const currentDateInScope = scope.ctrl.dirtyBasket.serviceDateUtc;
          if (!currentDateInScope || newDate.getTime() !== new Date(currentDateInScope.toDateString()).getTime()) {
            scope.ctrl.dirtyBasket.serviceDateUtc = newDate;
            scope.ctrl.serviceDateChanged();
            dateChanged = true;
          }
        } else if (pageType === "dailyCash" && scope.ctrl.dailyCashBalanceReport) {
          const currentDateInScope = scope.ctrl.dailyCashBalanceReport.balanceDateUtc;
           if (!currentDateInScope || newDate.getTime() !== new Date(currentDateInScope.toDateString()).getTime()) {
            scope.ctrl.dailyCashBalanceReport.balanceDateUtc = newDate;
            if (typeof scope.ctrl.changeDay === 'function') scope.ctrl.changeDay();
            dateChanged = true;
          }
        } else { errorMessage = `Angular scope structuur niet herkend voor pagina type: ${pageType}`; }
        if (dateChanged) success = true;
        else if (!errorMessage) success = true;
      } else { errorMessage = "Angular scope of ctrl object niet gevonden."; }
    } else { errorMessage = `Datum input veld niet gevonden: ${dateInputSelector}`; }
  } catch (error) { errorMessage = error.message; console.error('Injected.js: Fout bij het wijzigen van de datum:', error); }
  window.postMessage({ type: "DATE_SET_STATUS", success: success, date: dateString, error: errorMessage }, "*");
}

function handleMessage(event) {
  if (event.source !== window || !event.data || !event.data.type) return;
  // console.log("Injected.js: Bericht ontvangen:", event.data.type, event.data);

  switch (event.data.type) {
    case "CHANGE_DATE":
      if (typeof event.data.date === 'string') setDateOnPage(event.data.date);
      else window.postMessage({ type: "DATE_SET_STATUS", success: false, date: null, error: "Ongeldige datum formaat" }, "*");
      break;
    case "SETUP_CHECKOUT_PAGE": 
      if (window.location.pathname.endsWith(CHECKOUT_URL_SUFFIX)) selectMevrouwCustomer();
      break;
    case "RESET_PAGE_STATE": 
      customerSelectionAttemptedThisLoad = false;
      break;
    case "CLICK_DAILY_CASH_SAVE":
      clickDailyCashSaveButton();
      break;
    default:
      break;
  }
}
window.addEventListener('message', handleMessage, false);
