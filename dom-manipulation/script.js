// Array to store quotes - will be loaded from localStorage
let quotes = [];

// Track currently displayed quote index to avoid repetition
let lastQuoteIndex = -1;

// Local Storage Key
const QUOTES_STORAGE_KEY = 'dynamicQuotesApp';

// Session Storage Keys
const LAST_QUOTE_KEY = 'lastViewedQuote';
const SESSION_START_KEY = 'sessionStartTime';

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
  
  // Populate category filter
  populateCategoryFilter();
  
  // Update statistics
  updateStats();
  
  // Add event listeners
  document.getElementById('newQuote').addEventListener('click', showRandomQuote);
  document.getElementById('categoryFilter').addEventListener('change', showRandomQuote);
  document.getElementById('exportQuotes').addEventListener('click', exportToJsonFile);
  document.getElementById('importFile').addEventListener('change', importFromJsonFile);
  
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
 * Displays a random quote from the quotes array
 * Implements advanced DOM manipulation to create quote elements
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
 * Demonstrates array manipulation and form validation
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
  
  // Update category filter
  populateCategoryFilter();
  
  // Update statistics
  updateStats();
  
  // Show success feedback
  showNotification('Quote added successfully!');
  
  // Optionally display the newly added quote
  lastQuoteIndex = -1; // Reset to allow new quote to be shown
  document.getElementById('categoryFilter').value = category;
  showRandomQuote();
}

/**
 * Populates the category filter dropdown with unique categories
 * Demonstrates dynamic option creation
 */
function populateCategoryFilter() {
  const categoryFilter = document.getElementById('categoryFilter');
  const currentValue = categoryFilter.value;
  
  // Get unique categories
  const categories = ['all', ...new Set(quotes.map(q => q.category))];
  
  // Clear existing options
  categoryFilter.innerHTML = '';
  
  // Create and append options
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category === 'all' ? 'all' : category;
    option.textContent = category === 'all' ? 'All Categories' : category;
    categoryFilter.appendChild(option);
  });
  
  // Restore previous selection if it still exists
  if (categories.includes(currentValue)) {
    categoryFilter.value = currentValue;
  }
}

/**
 * Updates and displays statistics about the quote collection
 * Demonstrates dynamic content update
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
 * Reads file content and updates the quotes array
 */
function importFromJsonFile(event) {
  const file = event.target.files[0];
  
  if (!file) {
    return;
  }
  
  // Validate file type
  if (!file.name.endsWith('.json')) {
    alert('Please select a valid JSON file!');
    event.target.value = ''; // Reset file input
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
      
      // Update UI
      populateCategoryFilter();
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

// Initialize the application when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}