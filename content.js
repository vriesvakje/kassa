// Content script (content.js)

const behandelingen = [
  { naam: "Föhnen normaal", prijs: "25,00" },
  { naam: "ponny", prijs: "15,00" },
  { naam: "knippen klijn", prijs: "29,50" },
  { naam: "knippen groot", prijs: "35,00" },
  { naam: "behandeling", prijs: "70,00" },
  { naam: "uitgroei kleuren", prijs: "80,00" },
  { naam: "knipen kleuren kort", prijs: "87,50" },
  { naam: "kleuren drogen", prijs: "90,00" },
  { naam: "prijs groot", prijs: "95,00" },
  { naam: "knippen kleuren", prijs: "105,00" }
];

function injectScript(scriptFile) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(scriptFile);
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

injectScript('injected.js');

function maakInterface() {
  console.log('Interface wordt gemaakt...'); // Debug-melding

  const container = document.createElement('div');
  console.log('Container gemaakt:', container); // Debug-melding

  // Laad opgeslagen positie
  const savedPosition = JSON.parse(localStorage.getItem('interfacePosition')) || { x: 20, y: 20 };
  
  container.style.cssText = `
    position: fixed;
    left: ${savedPosition.x}px;
    top: ${savedPosition.y}px;
    z-index: 9999;
    background-color: #f0f4f8;
    padding: 0;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    max-width: 420px;
    overflow-y: auto;
    max-height: 80vh;
    font-family: Arial, sans-serif;
  `;

  // Maak een header div die als sleep-handvat dient
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 15px 20px;
    background-color: #3498db;
    color: white;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    cursor: grab;
    user-select: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #2980b9;
  `;

  const title = document.createElement('h2');
  title.style.cssText = `
    margin: 0;
    color: white;
    font-size: 18px;
  `;

  // Voeg een duidelijkere sleep-indicator toe aan de titel
  title.innerHTML = '⋮⋮ Kassasysteem Automatisering';

  header.appendChild(title);
  container.appendChild(header);

  // Content container voor de rest van de interface
  const contentContainer = document.createElement('div');
  contentContainer.style.padding = '20px';
  container.appendChild(contentContainer);

  // Maak de interface versleepbaar
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;

  function handleDragStart(e) {
    isDragging = true;
    initialX = e.clientX - container.offsetLeft;
    initialY = e.clientY - container.offsetTop;
    header.style.cursor = 'grabbing';
  }

  function handleDrag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      // Zorg dat de interface binnen het scherm blijft
      const maxX = window.innerWidth - container.offsetWidth;
      const maxY = window.innerHeight - container.offsetHeight;
      currentX = Math.min(Math.max(0, currentX), maxX);
      currentY = Math.min(Math.max(0, currentY), maxY);

      container.style.left = currentX + 'px';
      container.style.top = currentY + 'px';
    }
  }

  function handleDragEnd() {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = 'grab';
      // Sla de nieuwe positie op
      localStorage.setItem('interfacePosition', JSON.stringify({
        x: currentX,
        y: currentY
      }));
    }
  }

  header.addEventListener('mousedown', handleDragStart);
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', handleDragEnd);

  // Cleanup functie voor event listeners
  function cleanupDragListeners() {
    header.removeEventListener('mousedown', handleDragStart);
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
  }

  // Voeg cleanup toe aan window unload
  window.addEventListener('unload', cleanupDragListeners);


  // Voeg de rest van de interface elementen toe aan de contentContainer in plaats van direct aan de container
  const datumInput = document.createElement('input');
  datumInput.type = 'date';
  datumInput.id = 'datum-selectie';
  datumInput.style.cssText = `
    width: 100%;
    padding: 8px;
    margin-bottom: 15px;
    border: 1px solid #bdc3c7;
    border-radius: 4px;
    box-sizing: border-box;
  `;

  const opgeslagenDatum = localStorage.getItem('geselecteerdeDatum');
  const vandaag = new Date().toISOString().split('T')[0];
  datumInput.value = opgeslagenDatum || vandaag;

  datumInput.addEventListener('change', function() {
    localStorage.setItem('geselecteerdeDatum', this.value);
    wijzigDatum(this.value);
  });

  const selectRandomButton = document.createElement('button');
  selectRandomButton.textContent = 'Selecteer Willekeurige Klant';
  selectRandomButton.style.cssText = `
    width: 100%;
    padding: 10px;
    margin-bottom: 15px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  `;
  selectRandomButton.onmouseover = () => selectRandomButton.style.backgroundColor = '#2980b9';
  selectRandomButton.onmouseout = () => selectRandomButton.style.backgroundColor = '#3498db';
  selectRandomButton.onclick = selectRandomCustomer;

  // Voeg een toggle knop toe voor "Afwijkend bedrag"
  const toggleButton = document.createElement('button'); // Definieer de toggleButton variabele
  toggleButton.textContent = 'Afwijkend bedrag: Uit';
  toggleButton.id = 'toggle-afwijkend-bedrag';
  toggleButton.style.cssText = `
    width: 100%;
    padding: 10px;
    margin-bottom: 15px;
    background-color: #e74c3c;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  `;
  toggleButton.onmouseover = () => toggleButton.style.backgroundColor = '#c0392b';
  toggleButton.onmouseout = () => toggleButton.style.backgroundColor = '#e74c3c';
  // Herstel de toggle status van localStorage
  const opgeslagenStatus = localStorage.getItem('afwijkendBedrag') || 'uit';
  toggleButton.textContent = opgeslagenStatus === 'aan' ? 'Afwijkend bedrag: Aan' : 'Afwijkend bedrag: Uit';
  toggleButton.style.backgroundColor = opgeslagenStatus === 'aan' ? '#2ecc71' : '#e74c3c';

  toggleButton.onclick = () => {
    const isAan = toggleButton.textContent.includes('Aan');
    const nieuweStatus = isAan ? 'uit' : 'aan';
    toggleButton.textContent = `Afwijkend bedrag: ${nieuweStatus === 'aan' ? 'Aan' : 'Uit'}`;
    toggleButton.style.backgroundColor = nieuweStatus === 'aan' ? '#2ecc71' : '#e74c3c';
    localStorage.setItem('afwijkendBedrag', nieuweStatus);
  };

  // Voeg de knoppen toe aan de container
  contentContainer.appendChild(datumInput);
  contentContainer.appendChild(selectRandomButton);
  contentContainer.appendChild(toggleButton);

  const behandelingenContainer = document.createElement('div');
  behandelingenContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  `;

  behandelingen.forEach((behandeling, index) => {
    const button = document.createElement('button');
    button.textContent = `${behandeling.naam}\n€${behandeling.prijs}`;
    button.style.cssText = `
      padding: 10px;
      background-color: #2ecc71;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;
      font-size: 14px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    button.onmouseover = () => button.style.backgroundColor = '#27ae60';
    button.onmouseout = () => button.style.backgroundColor = '#2ecc71';
    button.onclick = () => voerActiesUit(index);
    behandelingenContainer.appendChild(button);
  });

  contentContainer.appendChild(behandelingenContainer);

  // Voeg de container toe aan de body
  document.body.appendChild(container);
  console.log('Interface toegevoegd aan de body:', container); // Debug-melding
}

function klikOpArtikelenKnop() {
  window.postMessage({ type: "KLIK_ARTIKELEN" }, "*");
}

function klikOpBehandelingsKnop(index) {
  const toggleButton = document.getElementById('toggle-afwijkend-bedrag');
  const isAfwijkendBedragAan = toggleButton.textContent.includes('Aan');
  window.postMessage({ 
    type: "KLIK_BEHANDELING", 
    index: index,
    isAfwijkendBedragAan: isAfwijkendBedragAan 
  }, "*");
}

function wijzigDatum(datum) {
  window.postMessage({ type: "CHANGE_DATE", date: datum }, "*");
}

function selectRandomCustomer() {
  window.postMessage({ type: "SELECT_RANDOM_CUSTOMER" }, "*");
}

function voerActiesUit(index) {
  const datumInput = document.getElementById('datum-selectie');

  if (datumInput) {
    const geselecteerdeDatum = datumInput.value;
   
    wijzigDatum(geselecteerdeDatum);
    setTimeout(() => {
      klikOpArtikelenKnop();
      setTimeout(() => {
        klikOpBehandelingsKnop(index);
      }, 500);
    }, 500);
  } else {
    console.log('Datum input element niet gevonden');
  }
}

document.addEventListener('keydown', function(event) {
  if (event.altKey && event.shiftKey && event.key === 'S') {
    console.log('Hotkey gedetecteerd: Alt + Shift + S');
    voerActiesUit(0);
  }
});

window.addEventListener('message', function(event) {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case "DATE_CHANGED":
        console.log('Datum succesvol gewijzigd naar:', event.data.date);
        break;
      case "DATE_CHANGE_ERROR":
        console.error('Fout bij het wijzigen van de datum:', event.data.error);
        break;
      case "ACTIE_UITGEVOERD":
        console.log(event.data.message);
        break;
      case "ACTIE_FOUT":
        console.error(event.data.message);
        break;
      case "KLANT_SELECTIE_FOUT":
        console.error('Fout bij klant selectie:', event.data.message);
        break;
    }
  }
});

// Wacht 2 seconden voordat de interface wordt gemaakt (voor het geval de pagina langzaam laadt)
setTimeout(maakInterface, 2000);

console.log('Kassasysteem extensie geladen. Klik op een behandeling om deze te selecteren en de datum te wijzigen.');
