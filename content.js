// Content script (content.js) - Directe DOM manipulatie, multi-page date, daily cash save button
// console.log("Content.js (directe DOM, multi-page date, daily cash save button) geladen.");

const CHECKOUT_URL_SUFFIX = "/checkout/basket";
const DAILY_CASH_URL_CONTAINS = "/dailycashbalance/";

let lastSentDate = '';
let dateSetForThisPageView = false; 
let customerSetupAttemptedForThisCheckoutView = false; 
let dailyCashSaveButton = null; // Reference to the new button

function injectScript(scriptFile) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(scriptFile);
  script.onload = function() { this.remove(); };
  (document.head || document.documentElement).appendChild(script);
}

injectScript('injected.js');

function maakInterface() {
  // console.log('Interface (directe DOM, multi-page date, daily cash save) wordt gemaakt...');
  const container = document.createElement('div');
  // ... (rest of container and header setup as before)
  const savedPosition = JSON.parse(localStorage.getItem('interfacePosition')) || { x: 20, y: 20 };
  container.style.cssText = `position: fixed; left: ${savedPosition.x}px; top: ${savedPosition.y}px; z-index: 9999; background-color: #f0f4f8; padding: 0; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 250px; font-family: Arial, sans-serif;`;
  const header = document.createElement('div');
  header.style.cssText = `padding: 10px 15px; background-color: #3498db; color: white; border-top-left-radius: 10px; border-top-right-radius: 10px; cursor: grab; user-select: none; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2980b9;`;
  const title = document.createElement('h2');
  title.style.cssText = `margin: 0; color: white; font-size: 16px;`;
  title.innerHTML = '⋮⋮ Kassa Hulp'; // Updated title
  header.appendChild(title);
  container.appendChild(header);
  const contentContainer = document.createElement('div');
  contentContainer.style.padding = '15px';
  container.appendChild(contentContainer);

  let isDragging = false, currentX, currentY, initialX, initialY;
  function handleDragStart(e) { isDragging = true; initialX = e.clientX - container.offsetLeft; initialY = e.clientY - container.offsetTop; header.style.cursor = 'grabbing'; }
  function handleDrag(e) { if (isDragging) { e.preventDefault(); currentX = e.clientX - initialX; currentY = e.clientY - initialY; const maxX = window.innerWidth - container.offsetWidth; const maxY = window.innerHeight - container.offsetHeight; currentX = Math.min(Math.max(0, currentX), maxX); currentY = Math.min(Math.max(0, currentY), maxY); container.style.left = currentX + 'px'; container.style.top = currentY + 'px'; } }
  function handleDragEnd() { if (isDragging) { isDragging = false; header.style.cursor = 'grab'; localStorage.setItem('interfacePosition', JSON.stringify({ x: currentX, y: currentY })); } }
  header.addEventListener('mousedown', handleDragStart);
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', handleDragEnd);
  function cleanupDragListeners() { header.removeEventListener('mousedown', handleDragStart); document.removeEventListener('mousemove', handleDrag); document.removeEventListener('mouseup', handleDragEnd); }
  window.addEventListener('unload', cleanupDragListeners);

  const datumInputLabel = document.createElement('label');
  datumInputLabel.textContent = 'Selecteer datum:';
  datumInputLabel.style.cssText = `display: block; margin-bottom: 5px; color: #34495e; font-size: 14px;`;
  const datumInput = document.createElement('input');
  datumInput.type = 'date';
  datumInput.id = 'datum-selectie';
  datumInput.style.cssText = `width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #bdc3c7; border-radius: 4px; box-sizing: border-box; font-size: 14px;`;
  
  const opgeslagenDatum = localStorage.getItem('geselecteerdeDatum');
  const vandaag = new Date().toISOString().split('T')[0];
  datumInput.value = opgeslagenDatum || vandaag;
  lastSentDate = datumInput.value;

  datumInput.addEventListener('change', function() {
    localStorage.setItem('geselecteerdeDatum', this.value);
    dateSetForThisPageView = false; 
    customerSetupAttemptedForThisCheckoutView = false; 
    sendDateToInjected(this.value);
    if (window.location.pathname.endsWith(CHECKOUT_URL_SUFFIX)) {
      sendSetupCheckoutPageMessage(); 
    }
  });
  
  contentContainer.appendChild(datumInputLabel);
  contentContainer.appendChild(datumInput);

  // Create "Save Daily Balance" button
  dailyCashSaveButton = document.createElement('button');
  dailyCashSaveButton.textContent = 'Opslaan Dagkas';
  dailyCashSaveButton.id = 'save-daily-cash-button';
  dailyCashSaveButton.style.cssText = `
    width: 100%;
    padding: 10px;
    margin-top: 10px; /* Add some space above */
    background-color: #2ecc71; /* Green color */
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
    display: none; /* Initially hidden */
  `;
  dailyCashSaveButton.onmouseover = () => dailyCashSaveButton.style.backgroundColor = '#27ae60';
  dailyCashSaveButton.onmouseout = () => dailyCashSaveButton.style.backgroundColor = '#2ecc71';
  dailyCashSaveButton.onclick = () => {
    // console.log("Content.js: 'Opslaan Dagkas' knop geklikt, stuur bericht naar injected.js");
    window.postMessage({ type: "CLICK_DAILY_CASH_SAVE" }, "*");
  };
  contentContainer.appendChild(dailyCashSaveButton);
  
  document.body.appendChild(container);

  sendDateToInjected(datumInput.value); 
  if (window.location.pathname.endsWith(CHECKOUT_URL_SUFFIX)) {
    sendSetupCheckoutPageMessage(); 
  }
  checkUrlAndManageState(); // Initial check to set button visibility
}

function sendDateToInjected(datum) { /* ... (as before) ... */
  lastSentDate = datum;
  window.postMessage({ type: "CHANGE_DATE", date: datum }, "*");
}

function sendSetupCheckoutPageMessage() { /* ... (as before) ... */
  if (window.location.pathname.endsWith(CHECKOUT_URL_SUFFIX)) {
    if (!customerSetupAttemptedForThisCheckoutView) {
        window.postMessage({ type: "SETUP_CHECKOUT_PAGE" }, "*");
    }
  }
}

function checkUrlAndManageState() {
  const isOnCheckoutPage = window.location.pathname.endsWith(CHECKOUT_URL_SUFFIX);
  const isOnDailyCashPage = window.location.pathname.includes(DAILY_CASH_URL_CONTAINS);

  if (dailyCashSaveButton) { // Ensure button exists
    dailyCashSaveButton.style.display = isOnDailyCashPage ? 'block' : 'none';
  }

  if (isOnCheckoutPage || isOnDailyCashPage) {
    if (!dateSetForThisPageView && lastSentDate) {
      sendDateToInjected(lastSentDate);
    }
    if (isOnCheckoutPage && !customerSetupAttemptedForThisCheckoutView) {
      sendSetupCheckoutPageMessage();
    }
  } else {
    dateSetForThisPageView = false; 
    customerSetupAttemptedForThisCheckoutView = false;
    window.postMessage({ type: "RESET_PAGE_STATE" }, "*"); 
  }
}

const observer = new MutationObserver(() => {
  checkUrlAndManageState();
});
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener('popstate', checkUrlAndManageState);

window.addEventListener('message', function(event) {
  if (event.source !== window && event.data && event.data.type) {
    switch (event.data.type) {
      case "DATE_SET_STATUS":
        if (event.data.success && event.data.date === lastSentDate) {
          dateSetForThisPageView = true;
          if (window.location.pathname.endsWith(CHECKOUT_URL_SUFFIX)) {
              customerSetupAttemptedForThisCheckoutView = true; 
          }
        } else if (!event.data.success && event.data.error !== "Niet op ondersteunde pagina" && event.data.error !== "Niet op doelpagina") {
          console.error("Content.js: Fout van injected.js bij instellen datum:", event.data.error, "Datum:", event.data.date);
        }
        break;
      case "DAILY_CASH_SAVE_STATUS":
        // console.log("Content.js: DAILY_CASH_SAVE_STATUS ontvangen:", event.data);
        if (event.data.success) {
          // console.log("Content.js: Dagkas succesvol opgeslagen (volgens injected.js).");
          // Optionally, provide user feedback here, e.g., a temporary message
        } else {
          console.error("Content.js: Fout bij opslaan dagkas (volgens injected.js):", event.data.error);
          // Optionally, provide user feedback
        }
        break;
    }
  }
});

setTimeout(() => {
    maakInterface();
    // checkUrlAndManageState(); // Already called at the end of maakInterface
}, 1000);
