// Array to store quotes - will be loaded from localStorage
let quotes = [];

// Track currently displayed quote index to avoid repetition
let lastQuoteIndex = -1;

// Local Storage Keys
const QUOTES_STORAGE_KEY = 'dynamicQuotesApp';
const LAST_CATEGORY_KEY = 'lastSelectedCategory';
const SERVER_QUOTES_KEY = 'serverQuotes';
const LAST_SYNC_TIME_KEY = 'lastSyncTime';
const AUTO_SYNC_ENABLED_KEY = 'autoSyncEnabled';

// Session Storage Keys
const LAST_QUOTE_KEY = 'lastViewedQuote';
const SESSION_START_KEY = 'sessionStartTime';

// Server configuration
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts';
let autoSyncInterval = null;
const SYNC_INTERVAL = 30000; // 30 seconds
let pendingConflicts = null;

/**
 * Initialize the application
 * Loads data from storage and sets up the UI
 */
function init() {
  // Load quotes from localStorage
  loadQuotes();
  
  // Initialize session storage
  initSessionStorage();
  
  // Create the add quote form
  createAddQuoteForm();
  
  // Populate category filter with stored categories
  populateCategories();
  
  // Restore last selected category filter
  restoreLastSelectedCategory();
  
  // Update statistics
  updateStats();
  
  // Add event listeners
  document.getElementById('newQuote').addEventListener('click', showRandomQuote);
  document.getElementById('categoryFilter').addEventListener('change', filterQuotes);
  document.getElementById('exportQuotes').addEventListener('click', exportToJsonFile);
  document.getElementById('importFile').addEventListener('change', importFromJsonFile);
  document.getElementById('syncNow').addEventListener('click', syncWithServer);
  document.getElementById('toggleAutoSync').addEventListener('click', toggleAutoSync);
  document.getElementById('resolveConflict').addEventListener('click', () => resolveConflict(true));
  document.getElementById('keepLocal').addEventListener('click', () => resolveConflict(false));
  
  // Initialize sync system
  initializeSyncSystem();
  
  // Try to show last viewed quote or a random one
  const lastQuote = restoreLastQuote();
  if (!lastQuote) {
    showRandomQuote();
  }
}

/**
 * Loads quotes from localStorage
 * If no quotes exist, initializes with default quotes
 */
function loadQuotes() {
  const storedQuotes = localStorage.getItem(QUOTES_STORAGE_KEY);
  
  if (storedQuotes) {
    try {
      quotes = JSON.parse(storedQuotes);
      console.log('Quotes loaded from localStorage:', quotes.length);
    } catch (error) {
      console.error('Error parsing quotes from localStorage:', error);
      initializeDefaultQuotes();
    }
  } else {
    initializeDefaultQuotes();
  }
}

/**
 * Initializes the app with default quotes
 */
function initializeDefaultQuotes() {
  quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Motivation" },
    { text: "Innovation distinguishes between a leader and a follower.", category: "Leadership" },
    { text: "Life is what happens when you're busy making other plans.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Motivation" },
    { text: "It is during our darkest moments that we must focus to see the light.", category: "Inspiration" },
    { text: "The only impossible journey is the one you never begin.", category: "Motivation" },
    { text: "In the middle of difficulty lies opportunity.", category: "Inspiration" },
    { text: "Leadership is not about being in charge. It's about taking care of those in your charge.", category: "Leadership" },
    { text: "Life is 10% what happens to you and 90% how you react to it.", category: "Life" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", category: "Wisdom" }
  ];
  saveQuotes();
  console.log('Initialized with default quotes');
}

/**
 * Saves quotes array to localStorage
 * Called whenever quotes are modified
 */
function saveQuotes() {
  try {
    localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(quotes));
    console.log('Quotes saved to localStorage');
  } catch (error) {
    console.error('Error saving quotes to localStorage:', error);
    if (error.name === 'QuotaExceededError') {
      alert('Storage quota exceeded! Unable to save quotes.');
    }
  }
}

/**
 * Initializes session storage with session-specific data
 */
function initSessionStorage() {
  // Check if this is a new session
  if (!sessionStorage.getItem(SESSION_START_KEY)) {
    sessionStorage.setItem(SESSION_START_KEY, new Date().toISOString());
    console.log('New session started');
  }
  
  // Log session duration on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      const startTime = new Date(sessionStorage.getItem(SESSION_START_KEY));
      const duration = Math.floor((new Date() - startTime) / 1000);
      console.log(`Session duration: ${duration} seconds`);
    }
  });
}

/**
 * Saves the current quote to session storage
 */
function saveLastQuote(quote) {
  if (quote) {
    sessionStorage.setItem(LAST_QUOTE_KEY, JSON.stringify(quote));
  }
}

/**
 * Restores and displays the last viewed quote from session storage
 */
function restoreLastQuote() {
  const lastQuoteData = sessionStorage.getItem(LAST_QUOTE_KEY);
  
  if (lastQuoteData) {
    try {
      const quote = JSON.parse(lastQuoteData);
      displayQuote(quote);
      console.log('Restored last viewed quote from session');
      return true;
    } catch (error) {
      console.error('Error restoring last quote:', error);
      return false;
    }
  }
  return false;
}

/**
 * Populates the category filter dropdown with unique categories from quotes
 * This is the main function for dynamic category population as per Task 2
 */
function populateCategories() {
  const categoryFilter = document.getElementById('categoryFilter');
  const currentValue = categoryFilter.value;
  
  // Extract unique categories from quotes array and sort them
  const categories = [...new Set(quotes.map(q => q.category))].sort();
  
  // Clear existing options except "All Categories"
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  
  // Dynamically create and append category options
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
  
  // Restore previous selection if it still exists
  const options = Array.from(categoryFilter.options).map(opt => opt.value);
  if (options.includes(currentValue)) {
    categoryFilter.value = currentValue;
  } else {
    categoryFilter.value = 'all';
  }
  
  console.log('Categories populated:', categories.length);
}

/**
 * Filters and displays quotes based on the selected category
 * Saves the selected category to localStorage for persistence across sessions
 * This is the main filtering function as per Task 2
 */
function filterQuotes() {
  const categoryFilter = document.getElementById('categoryFilter');
  const selectedCategory = categoryFilter.value;
  
  // Save selected category to localStorage for persistence
  saveLastSelectedCategory(selectedCategory);
  
  // Update the display to show filtered quotes
  showRandomQuote();
  
  // Update statistics to reflect filtered view
  updateFilteredStats(selectedCategory);
  
  console.log('Filtering by category:', selectedCategory);
}

/**
 * Saves the last selected category to localStorage
 * Ensures filter preference persists across sessions
 */
function saveLastSelectedCategory(category) {
  try {
    localStorage.setItem(LAST_CATEGORY_KEY, category);
    console.log('Saved category filter to localStorage:', category);
  } catch (error) {
    console.error('Error saving category filter:', error);
  }
}

/**
 * Restores the last selected category from localStorage
 * Called on page load to restore user's filter preference
 */
function restoreLastSelectedCategory() {
  const lastCategory = localStorage.getItem(LAST_CATEGORY_KEY);
  
  if (lastCategory) {
    const categoryFilter = document.getElementById('categoryFilter');
    const options = Array.from(categoryFilter.options).map(opt => opt.value);
    
    // Only restore if the category still exists in the dropdown
    if (options.includes(lastCategory)) {
      categoryFilter.value = lastCategory;
      console.log('Restored last selected category:', lastCategory);
      
      // Update display to reflect restored filter
      updateFilteredStats(lastCategory);
    }
  }
}

/**
 * Updates statistics to show filtered quote count
 * Provides context about current filter state
 */
function updateFilteredStats(selectedCategory) {
  const statsDiv = document.getElementById('stats');
  const categoryCount = new Set(quotes.map(q => q.category)).size;
  
  if (selectedCategory === 'all') {
    statsDiv.innerHTML = `
      <strong>Total Quotes:</strong> ${quotes.length} | 
      <strong>Categories:</strong> ${categoryCount}
    `;
  } else {
    const filteredCount = quotes.filter(q => q.category === selectedCategory).length;
    statsDiv.innerHTML = `
      <strong>Showing:</strong> ${filteredCount} of ${quotes.length} quotes | 
      <strong>Category:</strong> ${selectedCategory} | 
      <strong>Total Categories:</strong> ${categoryCount}
    `;
  }
}

/**
 * Displays a random quote from the quotes array
 * Respects the current category filter
 */
function showRandomQuote() {
  const categoryFilter = document.getElementById('categoryFilter');
  const selectedCategory = categoryFilter.value;
  
  // Filter quotes based on selected category
  let filteredQuotes = selectedCategory === 'all' 
    ? quotes 
    : quotes.filter(q => q.category === selectedCategory);
  
  // Check if there are quotes available
  if (filteredQuotes.length === 0) {
    const quoteDisplay = document.getElementById('quoteDisplay');
    quoteDisplay.innerHTML = '<p class="empty-quote">No quotes available in this category. Add some!</p>';
    return;
  }
  
  // Get random quote (avoid showing the same quote twice in a row if possible)
  let randomIndex;
  if (filteredQuotes.length === 1) {
    randomIndex = 0;
  } else {
    do {
      randomIndex = Math.floor(Math.random() * filteredQuotes.length);
    } while (filteredQuotes[randomIndex] === quotes[lastQuoteIndex] && filteredQuotes.length > 1);
  }
  
  const quote = filteredQuotes[randomIndex];
  lastQuoteIndex = quotes.indexOf(quote);
  
  // Display the quote
  displayQuote(quote);
  
  // Save to session storage
  saveLastQuote(quote);
}

/**
 * Displays a specific quote with animation
 */
function displayQuote(quote) {
  const quoteDisplay = document.getElementById('quoteDisplay');
  
  // Clear existing content
  quoteDisplay.innerHTML = '';
  
  // Create quote text element using DOM manipulation
  const quoteText = document.createElement('p');
  quoteText.className = 'quote-text';
  quoteText.textContent = `"${quote.text}"`;
  
  // Create category element
  const quoteCategory = document.createElement('p');
  quoteCategory.className = 'quote-category';
  quoteCategory.textContent = `— ${quote.category}`;
  
  // Append elements to quote display with animation
  quoteDisplay.style.opacity = '0';
  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(quoteCategory);
  
  // Fade in animation
  setTimeout(() => {
    quoteDisplay.style.transition = 'opacity 0.5s ease';
    quoteDisplay.style.opacity = '1';
  }, 10);
}

/**
 * Creates the form interface for adding new quotes
 * Demonstrates dynamic form creation using DOM manipulation
 */
function createAddQuoteForm() {
  const formSection = document.getElementById('addQuoteSection');
  
  // Create form title
  const title = document.createElement('h2');
  title.textContent = 'Add Your Own Quote';
  formSection.appendChild(title);
  
  // Create quote text input group
  const quoteGroup = document.createElement('div');
  quoteGroup.className = 'form-group';
  
  const quoteInput = document.createElement('input');
  quoteInput.type = 'text';
  quoteInput.id = 'newQuoteText';
  quoteInput.placeholder = 'Enter a new quote';
  quoteInput.setAttribute('aria-label', 'New quote text');
  
  quoteGroup.appendChild(quoteInput);
  formSection.appendChild(quoteGroup);
  
  // Create category input group
  const categoryGroup = document.createElement('div');
  categoryGroup.className = 'form-group';
  
  const categoryInput = document.createElement('input');
  categoryInput.type = 'text';
  categoryInput.id = 'newQuoteCategory';
  categoryInput.placeholder = 'Enter quote category';
  categoryInput.setAttribute('aria-label', 'Quote category');
  
  categoryGroup.appendChild(categoryInput);
  formSection.appendChild(categoryGroup);
  
  // Create add quote button
  const addButton = document.createElement('button');
  addButton.textContent = 'Add Quote';
  addButton.onclick = addQuote;
  addButton.style.width = '100%';
  
  formSection.appendChild(addButton);
}

/**
 * Adds a new quote to the quotes array
 * Updates categories dropdown if new category is introduced (Task 2 requirement)
 */
function addQuote() {
  const quoteText = document.getElementById('newQuoteText');
  const quoteCategory = document.getElementById('newQuoteCategory');
  
  const text = quoteText.value.trim();
  const category = quoteCategory.value.trim();
  
  // Validate inputs
  if (!text || !category) {
    alert('Please fill in both the quote text and category!');
    return;
  }
  
  // Check if this is a new category
  const existingCategories = [...new Set(quotes.map(q => q.category))];
  const isNewCategory = !existingCategories.includes(category);
  
  // Create new quote object
  const newQuote = {
    text: text,
    category: category
  };
  
  // Add to quotes array
  quotes.push(newQuote);
  
  // Save to localStorage
  saveQuotes();
  
  // Clear input fields
  quoteText.value = '';
  quoteCategory.value = '';
  
  // Update category filter - this will add the new category if it doesn't exist
  if (isNewCategory) {
    console.log('New category detected:', category);
  }
  populateCategories();
  
  // Update statistics
  updateStats();
  
  // Show success feedback
  showNotification(isNewCategory ? 
    `Quote added with new category "${category}"!` : 
    'Quote added successfully!');
  
  // Set filter to the new quote's category and display it
  lastQuoteIndex = -1;
  document.getElementById('categoryFilter').value = category;
  saveLastSelectedCategory(category);
  showRandomQuote();
  updateFilteredStats(category);
}

/**
 * Updates and displays statistics about the quote collection
 */
function updateStats() {
  const statsDiv = document.getElementById('stats');
  const categoryCount = new Set(quotes.map(q => q.category)).size;
  
  statsDiv.innerHTML = `
    <strong>Total Quotes:</strong> ${quotes.length} | 
    <strong>Categories:</strong> ${categoryCount}
  `;
}

/**
 * Exports quotes to a JSON file
 * Uses Blob and URL.createObjectURL for file download
 */
function exportToJsonFile() {
  if (quotes.length === 0) {
    alert('No quotes to export!');
    return;
  }
  
  try {
    // Convert quotes array to JSON string with formatting
    const jsonString = JSON.stringify(quotes, null, 2);
    
    // Create a Blob from the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a download URL
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element for download
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `quotes-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Clean up
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    
    showNotification('Quotes exported successfully!');
    console.log('Exported', quotes.length, 'quotes');
  } catch (error) {
    console.error('Error exporting quotes:', error);
    alert('Error exporting quotes. Please try again.');
  }
}

/**
 * Imports quotes from a JSON file
 * Reads file content and updates the quotes array and categories
 */
function importFromJsonFile(event) {
  const file = event.target.files[0];
  
  if (!file) {
    return;
  }
  
  // Validate file type
  if (!file.name.endsWith('.json')) {
    alert('Please select a valid JSON file!');
    event.target.value = '';
    return;
  }
  
  const fileReader = new FileReader();
  
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      
      // Validate imported data
      if (!Array.isArray(importedQuotes)) {
        throw new Error('Invalid format: Expected an array of quotes');
      }
      
      // Validate each quote object
      const validQuotes = importedQuotes.filter(quote => {
        return quote && 
               typeof quote === 'object' && 
               typeof quote.text === 'string' && 
               typeof quote.category === 'string' &&
               quote.text.trim() !== '' &&
               quote.category.trim() !== '';
      });
      
      if (validQuotes.length === 0) {
        throw new Error('No valid quotes found in the file');
      }
      
      // Ask user whether to replace or merge quotes
      const shouldReplace = confirm(
        `Found ${validQuotes.length} valid quotes.\n\n` +
        `Click OK to REPLACE existing quotes (${quotes.length} quotes will be lost).\n` +
        `Click Cancel to MERGE with existing quotes.`
      );
      
      if (shouldReplace) {
        quotes = validQuotes;
        showNotification(`Replaced with ${validQuotes.length} imported quotes!`);
      } else {
        // Merge quotes, avoiding duplicates
        const existingQuotesSet = new Set(quotes.map(q => `${q.text}|${q.category}`));
        let addedCount = 0;
        
        validQuotes.forEach(quote => {
          const quoteKey = `${quote.text}|${quote.category}`;
          if (!existingQuotesSet.has(quoteKey)) {
            quotes.push(quote);
            addedCount++;
          }
        });
        
        showNotification(`Added ${addedCount} new quotes! (${validQuotes.length - addedCount} duplicates skipped)`);
      }
      
      // Save to localStorage
      saveQuotes();
      
      // Update UI - repopulate categories in case new ones were added
      populateCategories();
      updateStats();
      showRandomQuote();
      
      console.log('Import successful:', validQuotes.length, 'quotes processed');
      
    } catch (error) {
      console.error('Error importing quotes:', error);
      alert(`Error importing quotes: ${error.message}`);
    }
    
    // Reset file input
    event.target.value = '';
  };
  
  fileReader.onerror = function() {
    alert('Error reading file. Please try again.');
    event.target.value = '';
  };
  
  fileReader.readAsText(file);
}

/**
 * Shows a temporary notification message
 * Demonstrates creating and removing DOM elements dynamically
 */
function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    animation: slideIn 0.3s ease;
    max-width: 300px;
  `;
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// ============================================
// SERVER SYNCHRONIZATION FUNCTIONS
// ============================================

/**
 * Initializes the server synchronization system
 * Sets up auto-sync if enabled and updates UI
 */
function initializeSyncSystem() {
  // Check if auto-sync was enabled in previous session
  const autoSyncEnabled = localStorage.getItem(AUTO_SYNC_ENABLED_KEY) === 'true';
  
  if (autoSyncEnabled) {
    startAutoSync();
    document.getElementById('toggleAutoSync').textContent = 'Disable Auto-Sync';
    document.getElementById('toggleAutoSync').style.background = '#28a745';
  }
  
  // Update last sync time display
  updateSyncStatusDisplay();
  
  console.log('Sync system initialized. Auto-sync:', autoSyncEnabled);
}

/**
 * Fetches quotes from the simulated server
 * Uses JSONPlaceholder API to simulate server data
 */
async function fetchQuotesFromServer() {
  try {
    updateSyncStatus('Fetching from server...', 'info');
    
    // Fetch data from JSONPlaceholder (simulating server)
    const response = await fetch(SERVER_URL);
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const serverData = await response.json();
    
    // Transform server data to quote format
    // Taking first 10 posts and converting them to quotes
    const serverQuotes = serverData.slice(0, 10).map(post => ({
      text: post.title,
      category: post.userId % 2 === 0 ? 'Server' : 'Remote',
      serverId: post.id,
      serverTimestamp: Date.now()
    }));
    
    console.log('Fetched from server:', serverQuotes.length, 'quotes');
    return serverQuotes;
    
  } catch (error) {
    console.error('Error fetching from server:', error);
    updateSyncStatus('Failed to fetch from server', 'error');
    showNotification('Failed to sync with server: ' + error.message);
    return null;
  }
}

/**
 * Posts local quotes to the simulated server
 * Simulates sending data to server for backup
 */
async function postQuotesToServer(quotesToPost) {
  try {
    updateSyncStatus('Posting to server...', 'info');
    
    // Simulate posting to server
    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quotes: quotesToPost,
        timestamp: Date.now()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Posted to server successfully:', result);
    return true;
    
  } catch (error) {
    console.error('Error posting to server:', error);
    return false;
  }
}

/**
 * Main synchronization function
 * Fetches server data, detects conflicts, and syncs
 */
async function syncWithServer() {
  console.log('Starting sync with server...');
  updateSyncStatus('Syncing...', 'info');
  
  // Fetch quotes from server
  const serverQuotes = await fetchQuotesFromServer();
  
  if (!serverQuotes) {
    return; // Error already handled in fetch function
  }
  
  // Get current local quotes
  const localQuotes = [...quotes];
  
  // Save server quotes to compare later
  localStorage.setItem(SERVER_QUOTES_KEY, JSON.stringify(serverQuotes));
  
  // Detect conflicts
  const conflicts = detectConflicts(localQuotes, serverQuotes);
  
  if (conflicts.hasConflicts) {
    // Show conflict notification
    showConflictNotification(conflicts);
    updateSyncStatus('Conflicts detected', 'warning');
  } else {
    // No conflicts, merge data (server takes precedence)
    mergeQuotes(serverQuotes);
    
    // Post local quotes to server
    await postQuotesToServer(quotes);
    
    // Update last sync time
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SYNC_TIME_KEY, now);
    
    updateSyncStatus('Synced successfully', 'success');
    updateSyncStatusDisplay();
    showNotification('Successfully synced with server!');
    
    // Update UI
    populateCategories();
    updateStats();
    showRandomQuote();
  }
  
  console.log('Sync completed');
}

/**
 * Detects conflicts between local and server data
 * Returns conflict information
 */
function detectConflicts(localQuotes, serverQuotes) {
  const lastSyncTime = localStorage.getItem(LAST_SYNC_TIME_KEY);
  const previousServerQuotes = localStorage.getItem(SERVER_QUOTES_KEY);
  
  // If this is the first sync, no conflicts
  if (!lastSyncTime || !previousServerQuotes) {
    return { hasConflicts: false };
  }
  
  const prevServerQuotes = JSON.parse(previousServerQuotes);
  
  // Check if local quotes were modified since last sync
  const localModified = localQuotes.length !== prevServerQuotes.length;
  
  // Check if server quotes changed
  const serverModified = JSON.stringify(serverQuotes) !== JSON.stringify(prevServerQuotes);
  
  // Conflict exists if both were modified
  if (localModified && serverModified) {
    return {
      hasConflicts: true,
      localCount: localQuotes.length,
      serverCount: serverQuotes.length,
      prevServerCount: prevServerQuotes.length,
      localQuotes: localQuotes,
      serverQuotes: serverQuotes
    };
  }
  
  return { hasConflicts: false };
}

/**
 * Shows conflict notification to user
 * Provides options to resolve conflict
 */
function showConflictNotification(conflicts) {
  pendingConflicts = conflicts;
  
  const notification = document.getElementById('conflictNotification');
  const message = document.getElementById('conflictMessage');
  
  message.textContent = `
    Local data has ${conflicts.localCount} quotes, 
    but server has ${conflicts.serverCount} quotes. 
    Both were modified since last sync.
  `;
  
  notification.style.display = 'block';
  
  // Scroll to notification
  notification.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Resolves conflicts based on user choice
 * @param {boolean} useServerVersion - True to use server data, false to keep local
 */
function resolveConflict(useServerVersion) {
  if (!pendingConflicts) {
    return;
  }
  
  if (useServerVersion) {
    // Accept server version
    mergeQuotes(pendingConflicts.serverQuotes, true);
    showNotification('Accepted server version. Local changes overwritten.');
    console.log('Conflict resolved: Server version accepted');
  } else {
    // Keep local version
    showNotification('Kept local version. Server not updated.');
    console.log('Conflict resolved: Local version kept');
  }
  
  // Update last sync time
  const now = new Date().toISOString();
  localStorage.setItem(LAST_SYNC_TIME_KEY, now);
  
  // Save current server quotes
  localStorage.setItem(SERVER_QUOTES_KEY, JSON.stringify(pendingConflicts.serverQuotes));
  
  // Hide notification
  document.getElementById('conflictNotification').style.display = 'none';
  pendingConflicts = null;
  
  // Update UI
  updateSyncStatus('Conflict resolved', 'success');
  updateSyncStatusDisplay();
  populateCategories();
  updateStats();
  showRandomQuote();
}

/**
 * Merges server quotes with local quotes
 * Server data takes precedence by default
 */
function mergeQuotes(serverQuotes, replaceAll = false) {
  if (replaceAll) {
    // Complete replacement
    quotes = [...serverQuotes];
  } else {
    // Smart merge: Add server quotes that don't exist locally
    const localQuoteKeys = new Set(
      quotes.map(q => `${q.text}|${q.category}`)
    );
    
    serverQuotes.forEach(serverQuote => {
      const key = `${serverQuote.text}|${serverQuote.category}`;
      if (!localQuoteKeys.has(key)) {
        quotes.push(serverQuote);
      }
    });
  }
  
  // Save merged quotes
  saveQuotes();
  console.log('Quotes merged. Total:', quotes.length);
}

/**
 * Toggles automatic synchronization
 */
function toggleAutoSync() {
  const button = document.getElementById('toggleAutoSync');
  const isEnabled = autoSyncInterval !== null;
  
  if (isEnabled) {
    stopAutoSync();
    button.textContent = 'Enable Auto-Sync';
    button.style.background = '#6c757d';
    showNotification('Auto-sync disabled');
  } else {
    startAutoSync();
    button.textContent = 'Disable Auto-Sync';
    button.style.background = '#28a745';
    showNotification('Auto-sync enabled (every 30 seconds)');
  }
}

/**
 * Starts automatic synchronization
 */
function startAutoSync() {
  if (autoSyncInterval) {
    return; // Already running
  }
  
  // Sync immediately
  syncWithServer();
  
  // Set up periodic sync
  autoSyncInterval = setInterval(() => {
    console.log('Auto-sync triggered');
    syncWithServer();
  }, SYNC_INTERVAL);
  
  // Save preference
  localStorage.setItem(AUTO_SYNC_ENABLED_KEY, 'true');
  
  console.log('Auto-sync started (interval:', SYNC_INTERVAL, 'ms)');
}

/**
 * Stops automatic synchronization
 */
function stopAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
    
    // Save preference
    localStorage.setItem(AUTO_SYNC_ENABLED_KEY, 'false');
    
    console.log('Auto-sync stopped');
  }
}

/**
 * Updates the sync status display
 * @param {string} message - Status message
 * @param {string} type - 'info', 'success', 'warning', 'error'
 */
function updateSyncStatus(message, type = 'info') {
  const statusText = document.getElementById('syncStatusText');
  statusText.textContent = message;
  
  // Color coding
  const colors = {
    info: '#007bff',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545'
  };
  
  statusText.style.color = colors[type] || colors.info;
}

/**
 * Updates the sync status display with time and count
 */
function updateSyncStatusDisplay() {
  const lastSyncTime = localStorage.getItem(LAST_SYNC_TIME_KEY);
  const serverQuotes = localStorage.getItem(SERVER_QUOTES_KEY);
  
  // Update last sync time
  const lastSyncElement = document.getElementById('lastSyncTime');
  if (lastSyncTime) {
    const date = new Date(lastSyncTime);
    lastSyncElement.textContent = date.toLocaleString();
  } else {
    lastSyncElement.textContent = 'Never';
  }
  
  // Update server quote count
  const serverCountElement = document.getElementById('serverQuoteCount');
  if (serverQuotes) {
    const count = JSON.parse(serverQuotes).length;
    serverCountElement.textContent = count;
  } else {
    serverCountElement.textContent = '0';
  }
}

// Initialize the application when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}