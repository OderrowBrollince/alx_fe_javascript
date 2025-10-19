// Array to store quotes
let quotes = [
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

// Track currently displayed quote index to avoid repetition
let lastQuoteIndex = -1;

// Initialize the application
function init() {
  // Create the add quote form
  createAddQuoteForm();
  
  // Populate category filter
  populateCategoryFilter();
  
  // Update statistics
  updateStats();
  
  // Add event listeners
  document.getElementById('newQuote').addEventListener('click', showRandomQuote);
  document.getElementById('categoryFilter').addEventListener('change', showRandomQuote);
  
  // Show initial quote
  showRandomQuote();
}

/**
 * Displays a random quote from the quotes array
 * Implements advanced DOM manipulation to create quote elements
 */
function showRandomQuote() {
  const quoteDisplay = document.getElementById('quoteDisplay');
  const categoryFilter = document.getElementById('categoryFilter');
  const selectedCategory = categoryFilter.value;
  
  // Filter quotes based on selected category
  let filteredQuotes = selectedCategory === 'all' 
    ? quotes 
    : quotes.filter(q => q.category === selectedCategory);
  
  // Check if there are quotes available
  if (filteredQuotes.length === 0) {
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
  `;
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(notification);
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