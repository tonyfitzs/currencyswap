// Get DOM elements
const amountInput = document.getElementById('amount');
const outputElement = document.getElementById('output');
const statusElement = document.getElementById('status');
const lastUpdatedElement = document.getElementById('lastUpdated');
const amountLabel = document.getElementById('amountLabel');
const connectivityStatusElement = document.getElementById('connectivityStatus');

// Location permission and currency storage keys
const LOCATION_PERMISSION_KEY = 'locationPermissionGranted';
const DETECTED_CURRENCY_KEY = 'detectedCurrency';
const DETECTED_COUNTRY_KEY = 'detectedCountry';

// Default fromCurrency - try to load from cache, otherwise VND
let fromCurrency = localStorage.getItem(DETECTED_CURRENCY_KEY) || 'VND';

// Country name to currency code mapping
const countryToCurrencyCode = {
  'Australia': 'AUD', 'United States': 'USD', 'United Kingdom': 'GBP', 'Canada': 'CAD',
  'Japan': 'JPY', 'China': 'CNY', 'India': 'INR', 'Germany': 'EUR', 'France': 'EUR',
  'Italy': 'EUR', 'Spain': 'EUR', 'Netherlands': 'EUR', 'Belgium': 'EUR', 'Austria': 'EUR',
  'Switzerland': 'CHF', 'Sweden': 'SEK', 'Norway': 'NOK', 'Denmark': 'DKK', 'Poland': 'PLN',
  'Russia': 'RUB', 'Turkey': 'TRY', 'South Korea': 'KRW', 'Singapore': 'SGD', 'Hong Kong': 'HKD',
  'Thailand': 'THB', 'Malaysia': 'MYR', 'Indonesia': 'IDR', 'Philippines': 'PHP', 'Vietnam': 'VND',
  'New Zealand': 'NZD', 'Brazil': 'BRL', 'Mexico': 'MXN', 'Argentina': 'ARS', 'South Africa': 'ZAR',
  'Israel': 'ILS', 'United Arab Emirates': 'AED', 'Saudi Arabia': 'SAR', 'Egypt': 'EGP', 'Nigeria': 'NGN',
  'Kenya': 'KES', 'Pakistan': 'PKR', 'Bangladesh': 'BDT', 'Sri Lanka': 'LKR', 'Nepal': 'NPR',
  'Czech Republic': 'CZK', 'Hungary': 'HUF'
};

// Currency code to full name mapping
const currencyCodeToName = {
  'AUD': 'Australian Dollar',
  'USD': 'US Dollar',
  'GBP': 'British Pound',
  'CAD': 'Canadian Dollar',
  'JPY': 'Japanese Yen',
  'CNY': 'Chinese Yuan',
  'INR': 'Indian Rupee',
  'EUR': 'Euro',
  'CHF': 'Swiss Franc',
  'SEK': 'Swedish Krona',
  'NOK': 'Norwegian Krone',
  'DKK': 'Danish Krone',
  'PLN': 'Polish Zloty',
  'RUB': 'Russian Ruble',
  'TRY': 'Turkish Lira',
  'KRW': 'South Korean Won',
  'SGD': 'Singapore Dollar',
  'HKD': 'Hong Kong Dollar',
  'THB': 'Thai Baht',
  'MYR': 'Malaysian Ringgit',
  'IDR': 'Indonesian Rupiah',
  'PHP': 'Philippine Peso',
  'VND': 'Vietnamese Dong',
  'NZD': 'New Zealand Dollar',
  'BRL': 'Brazilian Real',
  'MXN': 'Mexican Peso',
  'ARS': 'Argentine Peso',
  'ZAR': 'South African Rand',
  'ILS': 'Israeli Shekel',
  'AED': 'UAE Dirham',
  'SAR': 'Saudi Riyal',
  'EGP': 'Egyptian Pound',
  'NGN': 'Nigerian Naira',
  'KES': 'Kenyan Shilling',
  'PKR': 'Pakistani Rupee',
  'BDT': 'Bangladeshi Taka',
  'LKR': 'Sri Lankan Rupee',
  'NPR': 'Nepalese Rupee',
  'CZK': 'Czech Koruna',
  'HUF': 'Hungarian Forint'
};

// Settings elements
const settingsIcon = document.getElementById('settingsIcon');
const settingsModal = document.getElementById('settingsModal');
const closeModalBtn = document.getElementById('closeModal');
const settingsLink = document.getElementById('settingsLink');
const settingsMenu = document.getElementById('settingsMenu');
const updateExchangeSection = document.getElementById('updateExchangeSection');
const colorSchemeSection = document.getElementById('colorSchemeSection');
const updateHomeCountrySection = document.getElementById('updateHomeCountrySection');
const updateExchangeBtn = document.getElementById('updateExchangeBtn');
const colorSchemeBtn = document.getElementById('colorSchemeBtn');
const updateHomeCountryBtn = document.getElementById('updateHomeCountryBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const updateExchangeActionBtn = document.getElementById('updateExchangeActionBtn');
const colorSchemeSelect = document.getElementById('colorSchemeSelect');
const saveColorSchemeBtn = document.getElementById('saveColorSchemeBtn');
const homeCurrencySelect = document.getElementById('homeCurrencySelect');
const changeCurrencyBtn = document.getElementById('changeCurrencyBtn');
const updateBanner = document.getElementById('updateBanner');
const exchangeRateMessage = document.getElementById('exchangeRateMessage');

// Cache keys and intervals
const RATES_CACHE_KEY = 'exchangeRates';
const RATES_UPDATE_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours
const LAST_UPDATED_KEY = 'lastUpdated';

// UI text defaults
let homeCurrency = localStorage.getItem('homeCurrency') || 'AUD';
let homeCountry = localStorage.getItem('homeCountry') || 'Australia';

// Connectivity state
let isOnline = navigator.onLine;
let connectivityCheckInProgress = false;

// ===== Utility =====
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  // Use the device's system locale and time format settings
  return date.toLocaleString();
}

function getCachedRates() {
  try {
    const cached = localStorage.getItem(RATES_CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

function updateExchangeRateMessage(show, timestamp) {
  if (!exchangeRateMessage) return;

  if (!show || !timestamp) {
    exchangeRateMessage.style.display = 'none';
    exchangeRateMessage.textContent = '';
    return;
  }

  exchangeRateMessage.style.display = 'block';
  exchangeRateMessage.textContent =
    `Using cached exchange rates from ${formatDateTime(timestamp)}. Connect to the internet to update.`;
}

// ===== Connectivity (Option B: API reachability) =====
function updateConnectivityStatus() {
  if (connectivityCheckInProgress) {
    return;
  }

  connectivityCheckInProgress = true;

  // If the browser explicitly reports offline, respect it immediately
  if (!navigator.onLine) {
    isOnline = false;
    connectivityCheckInProgress = false;
    updateUI();
    return;
  }

  // Verify connectivity by calling the same exchange-rate endpoint the app depends on
  (async () => {
    let connected = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      // Cache-busting query so cache/service-worker can’t fake success
      const uniqueId = Date.now() + "-" + Math.random();
      const testUrl = "https://api.exchangerate-api.com/v4/latest/USD?_=" + uniqueId;

      const response = await fetch(testUrl, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        connected = !!(data && data.rates);
      } else {
        connected = false;
      }
    } catch (error) {
      connected = false;
    }

    isOnline = connected;
    connectivityCheckInProgress = false;
    updateUI();
  })();
}

// ===== UI updates =====
function updateUI() {
  // Top-left connectivity indicator
  if (connectivityStatusElement) {
    if (isOnline) {
      connectivityStatusElement.textContent = 'Online';
      connectivityStatusElement.classList.remove('offline');
      connectivityStatusElement.classList.add('online');
    } else {
      connectivityStatusElement.textContent = 'Offline';
      connectivityStatusElement.classList.remove('online');
      connectivityStatusElement.classList.add('offline');
    }
  }

  updateStatusPill();
}

function updateStatusPill() {
  if (isOnline) {
    statusElement.textContent = 'Online — cached for offline use';
    statusElement.classList.remove('offline');
    statusElement.classList.add('online');
  } else {
    const cached = getCachedRates();
    if (cached && cached.timestamp) {
      const formattedDateTime = formatDateTime(cached.timestamp);
      statusElement.textContent = `Offline — last rate update ${formattedDateTime} — using cached rates`;
    } else {
      statusElement.textContent = 'Offline';
    }
    statusElement.classList.remove('online');
    statusElement.classList.add('offline');
  }
}

function displayLastUpdated() {
  const lastUpdated = localStorage.getItem(LAST_UPDATED_KEY);
  if (!lastUpdated || !lastUpdatedElement) return;
  lastUpdatedElement.textContent = `Last updated: ${formatDateTime(Number(lastUpdated))}`;
}

// ===== Rates =====
async function fetchExchangeRates(forceUpdate = false) {
  const cached = getCachedRates();

  // Always try to fetch fresh rates if online
  if (isOnline) {
    try {
      const uniqueId = Date.now() + "-" + Math.random();
      const url = `https://api.exchangerate-api.com/v4/latest/USD?_=${uniqueId}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to fetch rates');

      const data = await response.json();
      const rates = data.rates;
      const timestamp = Date.now();

      localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
        rates: rates,
        timestamp: timestamp
      }));

      localStorage.setItem(LAST_UPDATED_KEY, String(timestamp));

      updateExchangeRateMessage(false, null);
      displayLastUpdated();

      return rates;
    } catch (error) {
      // Fall through to cache
    }
  }

  // Use cached rates if available
  if (cached) {
    updateExchangeRateMessage(true, cached.timestamp);
    displayLastUpdated();
    return cached.rates;
  }

  // No cache available
  updateExchangeRateMessage(false, null);
  return null;
}

function checkAndUpdateRates() {
  const cached = getCachedRates();

  if (!cached) {
    fetchExchangeRates();
    return;
  }

  const age = Date.now() - cached.timestamp;

  // If cache older than 12 hours and online, update
  if (age >= RATES_UPDATE_INTERVAL && isOnline) {
    fetchExchangeRates();
  }
}

function setupAutomaticUpdates() {
  checkAndUpdateRates();

  setInterval(() => {
    checkAndUpdateRates();
  }, 60 * 60 * 1000); // hourly check
}

// ===== Currency conversion =====
function convertCurrency(amount, rates) {
  if (!rates) return null;

  const fromRate = rates[fromCurrency];
  const toRate = rates[homeCurrency];

  if (!fromRate || !toRate) return null;

  // rates are relative to USD; convert: from -> USD -> to
  const amountInUSD = amount / fromRate;
  const converted = amountInUSD * toRate;

  return converted;
}

function updateAmountLabel() {
  if (!amountLabel) return;
  amountLabel.textContent = `Amount in ${fromCurrency}`;
}

function updateHomeCountryDisplay() {
  const homeCountryDisplay = document.getElementById('homeCountryDisplay');
  if (!homeCountryDisplay) return;
  homeCountryDisplay.textContent = `Your home country is currently ${homeCountry}.`;
}

// ===== App init =====
async function initializeApp() {
  updateHomeCountryDisplay();
  updateAmountLabel();

  // Initial connectivity check
  updateConnectivityStatus();

  // Initial rate fetch (will use cache if offline)
  const rates = await fetchExchangeRates();

  if (amountInput) {
    amountInput.addEventListener('input', async () => {
      const val = parseFloat(amountInput.value);
      if (isNaN(val)) {
        outputElement.innerHTML = '<strong>Amount in home currency:</strong>';
        return;
      }

      const currentRates = await fetchExchangeRates();
      const converted = convertCurrency(val, currentRates);

      if (converted === null) {
        outputElement.innerHTML = '<strong>Unable to convert (missing rates).</strong>';
        return;
      }

      outputElement.innerHTML = `<strong>Amount in ${homeCurrency}:</strong><br>${converted.toFixed(2)}`;
    });
  }

  setupAutomaticUpdates();
}

// ===== Settings modal wiring (unchanged logic) =====
function openModal() {
  settingsModal.style.display = 'flex';
}
function closeModal() {
  settingsModal.style.display = 'none';
}

function showSettingsMenu() {
  settingsMenu.style.display = 'block';
  updateExchangeSection.style.display = 'none';
  colorSchemeSection.style.display = 'none';
  updateHomeCountrySection.style.display = 'none';
}

// Event listeners for settings
if (settingsIcon) settingsIcon.addEventListener('click', openModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
if (settingsLink) settingsLink.addEventListener('click', (e) => { e.preventDefault(); openModal(); });

if (cancelSettingsBtn) cancelSettingsBtn.addEventListener('click', closeModal);

if (updateExchangeBtn) updateExchangeBtn.addEventListener('click', () => {
  settingsMenu.style.display = 'none';
  updateExchangeSection.style.display = 'block';
});

if (colorSchemeBtn) colorSchemeBtn.addEventListener('click', () => {
  settingsMenu.style.display = 'none';
  colorSchemeSection.style.display = 'block';
});

if (updateHomeCountryBtn) updateHomeCountryBtn.addEventListener('click', () => {
  settingsMenu.style.display = 'none';
  updateHomeCountrySection.style.display = 'block';
});

// Manual update button
if (updateExchangeActionBtn) updateExchangeActionBtn.addEventListener('click', async () => {
  await fetchExchangeRates(true);
  closeModal();
});

// Save color scheme (basic)
if (saveColorSchemeBtn) saveColorSchemeBtn.addEventListener('click', () => {
  const scheme = colorSchemeSelect.value;
  localStorage.setItem('colorScheme', scheme);
  closeModal();
});

// Change home currency
if (changeCurrencyBtn) changeCurrencyBtn.addEventListener('click', () => {
  homeCurrency = homeCurrencySelect.value;

  // Reverse lookup country name if possible
  const foundCountry = Object.keys(countryToCurrencyCode).find(k => countryToCurrencyCode[k] === homeCurrency);
  homeCountry = foundCountry || homeCountry;

  localStorage.setItem('homeCurrency', homeCurrency);
  localStorage.setItem('homeCountry', homeCountry);

  updateHomeCountryDisplay();

  closeModal();

  // Recalculate conversion
  if (amountInput && amountInput.value) {
    amountInput.dispatchEvent(new Event('input'));
  }
});

// Listen for online/offline events
window.addEventListener('online', () => {
  updateConnectivityStatus();
});
window.addEventListener('offline', () => {
  updateConnectivityStatus();
});

// Poll connectivity every 10 seconds (no hammering)
setInterval(() => {
  updateConnectivityStatus();
}, 10000);

// Start app
initializeApp();
