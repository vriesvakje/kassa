// Geïnjecteerd script (injected.js)

// Definieer selectors voor knoppen
const SELECTORS = {
  DATUM_INPUT: 'input[ng-model="ctrl.dirtyBasket.serviceDateUtc"]',
  ARTIKELEN_KNOOP: '#checkout-items > div > div:nth-child(1) > button',
  AFRKENEN_KNOOP: 'li.submenu-item.active > a[ng-click="menuCtrl.goToCheckout()"]',
  BEHANDELING_KNOOP: '.btn.btn--tile.knippen',
  KLANT_ZOEK_INPUT: 'input[placeholder="Typ hier om een klant te zoeken."]',
  DROPDOWN_TOGGLE: '.ui-select-toggle, .dropdown-toggle',
  SUGGESTIES: '.ui-select-choices-row, .dropdown-item, [role="option"]',
  BETALEN_KNOOP: 'button.btn.btn-primary.btn-wide.btn-lg.prevent-jumping.checkout-button',
  PIN_KNOOP: 'button.btn.btn--tile',
  LAAATSTE_BETAAL_KNOOP: 'button.btn.btn-primary.btn-lg[ng-click="ctrl.goNextAsync(checkoutForm)"]'
};

// ==================================================
// Functies voor het uitvoeren van acties
// ==================================================

// 1. Selecteer een willekeurige klant
function selectRandomCustomer() {
  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timer = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
          clearInterval(timer);
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(timer);
          reject(new Error(`Timeout waiting for element: ${selector}`));
        }
      }, 100);
    });
  }

  async function fillCustomerField() {
    try {
      const customerInput = await waitForElement(SELECTORS.KLANT_ZOEK_INPUT);
      const dropdownToggle = document.querySelector(SELECTORS.DROPDOWN_TOGGLE);
      if (dropdownToggle) {
        dropdownToggle.click();
        await new Promise(resolve => setTimeout(resolve, 500));
        const suggestions = document.querySelectorAll(SELECTORS.SUGGESTIES);
        if (suggestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * suggestions.length);
          suggestions[randomIndex].click();
        } else {
          throw new Error("Geen klantsuggesties gevonden");
        }
      } else {
        throw new Error("Dropdown knop niet gevonden");
      }
    } catch (error) {
      window.postMessage({ type: "KLANT_SELECTIE_FOUT", message: error.message }, "*");
    }
  }

  setTimeout(fillCustomerField, 2000);
}

// 2. Datum instellen
function setDate(dateString) {
  try {
    const input = document.querySelector(SELECTORS.DATUM_INPUT);
    if (input) {
      const scope = angular.element(input).scope();
      scope.$apply(() => {
        const date = new Date(dateString + 'T00:00:00');
        scope.ctrl.dirtyBasket.serviceDateUtc = date;
        scope.ctrl.serviceDateChanged();
      });
      window.postMessage({ type: "DATE_CHANGED", date: dateString }, "*");
    } else {
      throw new Error('Datum input veld niet gevonden');
    }
  } catch (error) {
    window.postMessage({ type: "DATE_CHANGE_ERROR", error: error.message }, "*");
  }
}

// 3. Klik op Artikelen knop
function klikOpArtikelenKnop() {
  const knop = document.querySelector(SELECTORS.ARTIKELEN_KNOOP);
  if (knop) {
    knop.click();
    window.postMessage({ type: "ACTIE_UITGEVOERD", message: 'Geklikt op de Artikelen knop' }, "*");
  } else {
    window.postMessage({ type: "ACTIE_FOUT", message: 'Artikelen knop niet gevonden' }, "*");
  }
}

// 4. Klik op Behandeling knop
function klikOpBehandelingsKnop(index) {
  const behandelingen = [
    { naam: "Föhnen normaal", prijs: "25,00" },
    { naam: "ponny", prijs: "15,00" },
    { naam: "knippen klijn", prijs: "35,00" },
    { naam: "knippen groot", prijs: "31,00" },
    { naam: "behandeling", prijs: "70,00" },
    { naam: "uitgroei kleuren", prijs: "80,00" },
    { naam: "knipen kleuren kort", prijs: "87,50" },
    { naam: "kleuren drogen", prijs: "90,00" },
    { naam: "prijs groot", prijs: "95,00" },
    { naam: "knippen kleuren", prijs: "105,00" }
  ];

  const behandeling = behandelingen[index];
  const knoppen = document.querySelectorAll(SELECTORS.BEHANDELING_KNOOP);

  for (let knop of knoppen) {
    if (knop.textContent.trim().toLowerCase().startsWith(behandeling.naam.toLowerCase())) {
      knop.click();
      window.postMessage({ type: "ACTIE_UITGEVOERD", message: `Geklikt op behandeling: ${behandeling.naam}` }, "*");
      return;
    }
  }

  window.postMessage({ type: "ACTIE_FOUT", message: `Knop voor behandeling ${behandeling.naam} niet gevonden` }, "*");
}

// 5. Klik op Betalen knop
function klikOpBetalenKnop() {
  const betalenKnop = document.querySelector(SELECTORS.BETALEN_KNOOP);
  if (betalenKnop) {
    betalenKnop.click();
    window.postMessage({ type: "ACTIE_UITGEVOERD", message: 'Geklikt op de Betalen knop' }, "*");
    wachtOpPinPagina();
  } else {
    window.postMessage({ type: "ACTIE_FOUT", message: 'Betalen knop niet gevonden' }, "*");
  }
}

// 6. Wacht op Pin pagina
function wachtOpPinPagina() {
  const maxPogingen = 20;
  let pogingen = 0;

  const controleerPinPagina = setInterval(() => {
    pogingen++;
    if (document.URL.includes("/checkout")) {
      clearInterval(controleerPinPagina);
      setTimeout(klikOpPinKnop, 500);
    } else if (pogingen >= maxPogingen) {
      clearInterval(controleerPinPagina);
      window.postMessage({ type: "ACTIE_FOUT", message: 'Timeout bij wachten op Pin pagina' }, "*");
    }
  }, 1000);
}

// 7. Klik op Pin knop
function klikOpPinKnop() {
  const pinKnoppen = Array.from(document.querySelectorAll(SELECTORS.PIN_KNOOP)).filter(btn => btn.textContent.trim() === 'Pin');
  if (pinKnoppen.length > 0) {
    const pinKnop = pinKnoppen[0];
    if (!pinKnop.disabled) {
      pinKnop.click();
      window.postMessage({ type: "ACTIE_UITGEVOERD", message: 'Geklikt op de Pin knop' }, "*");
      setTimeout(klikOpLaatsteBetaalKnop, 250);
    } else {
      window.postMessage({ type: "ACTIE_FOUT", message: 'Pin knop is uitgeschakeld' }, "*");
    }
  } else {
    window.postMessage({ type: "ACTIE_FOUT", message: 'Pin knop niet gevonden' }, "*");
  }
}

// 8. Klik op Laatste Betalen knop
function klikOpLaatsteBetaalKnop() {
  const laatsteBetaalKnop = document.querySelector(SELECTORS.LAAATSTE_BETAAL_KNOOP);
  if (laatsteBetaalKnop && !laatsteBetaalKnop.disabled) {
    laatsteBetaalKnop.click();
    window.postMessage({ type: "ACTIE_UITGEVOERD", message: 'Geklikt op de laatste Betalen knop' }, "*");
    setTimeout(klikOpAfrekenenKnop, 1000);
  } else if (laatsteBetaalKnop && laatsteBetaalKnop.disabled) {
    window.postMessage({ type: "ACTIE_FOUT", message: 'Laatste Betalen knop is uitgeschakeld' }, "*");
  } else {
    window.postMessage({ type: "ACTIE_FOUT", message: 'Laatste Betalen knop niet gevonden' }, "*");
  }
}

function klikOpAfrekenenKnop() {
  const afrekenenKnop = document.querySelector(SELECTORS.AFRKENEN_KNOOP);
  if (afrekenenKnop) {
    console.log("Afrekenen knop gevonden, klikken...");
    afrekenenKnop.click();
    window.postMessage({ type: "ACTIE_UITGEVOERD", message: 'Geklikt op de Afrekenen knop' }, "*");
    
    // Start het proces opnieuw na het klikken op de Afrekenen knop
    setTimeout(() => {
      console.log("Opnieuw een klant selecteren...");
      selectRandomCustomer();
    }, 2000);
  } else {
    console.warn("Afrekenen knop niet gevonden");
    window.postMessage({ type: "ACTIE_FOUT", message: 'Afrekenen knop niet gevonden' }, "*");
  }
}

// ==================================================
// Berichtafhandeling
// ==================================================

function handleMessage(event) {
  if (event.data && event.data.type) {
    console.log("Bericht ontvangen:", event.data);

    switch (event.data.type) {
      case "CHANGE_DATE":
        console.log("Datum wijzigen naar:", event.data.date);
        setDate(event.data.date);
        break;
      case "KLIK_ARTIKELEN":
        console.log("KLIK_ARTIKELEN ontvangen, starten...");
        klikOpArtikelenKnop();
        break;
      case "KLIK_BEHANDELING":
        console.log("KLIK_BEHANDELING ontvangen, behandeling index:", event.data.index);
        klikOpBehandelingsKnop(event.data.index);
        if (!event.data.isAfwijkendBedragAan) {
          console.log("Afwijkend bedrag is uit, doorgaan met betalen...");
          setTimeout(klikOpBetalenKnop, 1000);
        } else {
          console.log("Afwijkend bedrag is aan, stop na behandeling.");
        }
        break;
      case "SELECT_RANDOM_CUSTOMER":
        console.log("SELECT_RANDOM_CUSTOMER ontvangen, starten...");
        selectRandomCustomer();
        break;
      default:
        console.warn("Onbekend berichttype:", event.data.type);
    }
  } else {
    console.warn("Ontvangen bericht heeft geen type:", event.data);
  }
}

// ==================================================
// Initialisatie
// ==================================================

window.addEventListener('message', handleMessage);

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  selectRandomCustomer();
} else {
  window.addEventListener('load', selectRandomCustomer);
}
