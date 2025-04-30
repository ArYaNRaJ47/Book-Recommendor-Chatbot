const chatMessages = document.getElementById("chat-messages");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

// Bot state
let isTyping = false;

// Helper function to generate unique IDs
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// Add a message to the chat
function addMessage(content, type, books = []) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", type);

  let avatarIcon =
    type === "user"
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 1 0-16 0"></path></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>';

  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="avatar">
        ${avatarIcon}
      </div>
      <div>
        <div class="bubble">${content}</div>
        ${books.length > 0 ? renderBooks(books) : ""}
      </div>
    </div>
  `;

  chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

// Render books
function renderBooks(books) {
  return books
    .map(
      (book) => `
    <div class="book-card">
      <img class="book-cover" src="${book.coverUrl}" alt="${book.title} cover">
      <div class="book-info">
        <div class="book-title">${book.title}</div>
        <div class="book-author">${book.author} (${book.year})</div>
        <div class="book-description">${book.description}</div>
        <div class="book-rating">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="star-icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          <span>${book.rating}</span>
        </div>
        <div class="book-genres">
          ${book.genres
            .map((genre) => `<span class="genre-tag">${genre}</span>`)
            .join("")}
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

// Show typing indicator
function showTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.classList.add("message", "bot", "typing-indicator");

  typingDiv.innerHTML = `
    <div class="message-content">
      <div class="avatar">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
      </div>
      <div class="bubble">
        <div class="typing">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;

  chatMessages.appendChild(typingDiv);
  scrollToBottom();
  return typingDiv;
}

// Remove typing indicator
function removeTypingIndicator(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

// Search books from Open Library API
async function searchBooks(query) {
  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(
        query
      )}&limit=10`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch data from Open Library");
    }

    const data = await response.json();

    // Transform Open Library data to our book format
    return data.docs.map((book) => {
      const coverUrl = book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : "https://via.placeholder.com/150x225?text=No+Cover";

      return {
        id: book.key || generateId(),
        title: book.title || "Unknown Title",
        author: book.author_name ? book.author_name[0] : "Unknown Author",
        description: book.first_sentence
          ? book.first_sentence[0]
          : "No description available.",
        coverUrl: coverUrl,
        rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3.0 and 5.0
        year: book.first_publish_year || "Unknown",
        genres: book.subject
          ? book.subject.slice(0, 3).map((s) => s.split("_").join(" "))
          : ["Fiction"],
      };
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
}

// Function to call the generative AI API
async function callGenerativeAI(prompt) {
  try {
    console.log("Calling Generative AI API with prompt:", prompt);

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateText?key=YOUR_API_KEY", // Replace with your actual API key
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: {
            text: prompt,
          },
          temperature: 0.7,
          maxOutputTokens: 150,
        }),
      }
    );

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      throw new Error("Failed to fetch response from Generative AI API");
    }

    const data = await response.json();
    console.log("API Response:", data);

    return data.candidates[0].output || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Error calling Generative AI API:", error);
    return "I'm having trouble understanding your request. Could you try rephrasing?";
  }
}

// Process user message
async function processMessage(message) {
  const lowercaseMessage = message.toLowerCase();
  let recommendedBooks = [];

  console.log("Searching for books with query:", message);

  // Check for series-specific queries
  if (/\b(all the books|series|collection)\b/i.test(lowercaseMessage)) {
    const seriesMatch = lowercaseMessage.match(
      /\b(all the books|series|collection)\b\s+of\s+(.+)/i
    );
    const seriesName = seriesMatch ? seriesMatch[2].trim() : "";

    if (seriesName) {
      recommendedBooks = await searchBooks(seriesName);
      if (recommendedBooks.length > 0) {
        return {
          content: `Here are the books in the "${seriesName}" series I found:`,
          books: recommendedBooks,
        };
      }
    }
  }

  // Check for greetings
  if (/\b(hi|hello|hey|greetings)\b/i.test(lowercaseMessage)) {
    return {
      content: "Hello! How can I help you find your next favorite book today?",
      books: [],
    };
  }

  // Check for genre requests
  const genreList = [
    "Fantasy",
    "Science Fiction",
    "Mystery",
    "Thriller",
    "Romance",
    "Horror",
    "Adventure",
    "Historical Fiction",
    "Biography",
    "Self-Help",
    "Fiction",
    "Non-Fiction",
    "Poetry",
    "Young Adult",
    "Children",
  ];

  for (const genre of genreList) {
    if (lowercaseMessage.includes(genre.toLowerCase())) {
      // Try to get books from API
      recommendedBooks = await searchBooks(genre);

      console.log("Open Library API response:", recommendedBooks);

      if (recommendedBooks.length > 0) {
        return {
          content: `Here are some great ${genre} books I'd recommend:`,
          books: recommendedBooks,
        };
      }
    }
  }

  // Handle author, title, and recommendation requests
  try {
    if (/(author|by)\s+([a-zA-Z\s]+)/i.test(lowercaseMessage)) {
      const authorMatch = lowercaseMessage.match(
        /(author|by)\s+([a-zA-Z\s]+)/i
      );
      const author = authorMatch ? authorMatch[2].trim() : "";

      if (author) {
        recommendedBooks = await searchBooks(`author:${author}`);
        if (recommendedBooks.length > 0) {
          return {
            content: `Here are books by ${author}:`,
            books: recommendedBooks,
          };
        }
      }
    }

    // Check for specific book title mentions
    if (
      /(title|called|named)\s+"([^"]+)"/i.test(lowercaseMessage) ||
      /(title|called|named)\s+([a-zA-Z\s]+)/i.test(lowercaseMessage)
    ) {
      const titleMatch =
        lowercaseMessage.match(/(title|called|named)\s+"([^"]+)"/i) ||
        lowercaseMessage.match(/(title|called|named)\s+([a-zA-Z\s]+)/i);
      const title = titleMatch ? titleMatch[2].trim() : "";

      if (title) {
        recommendedBooks = await searchBooks(`title:${title}`);
        if (recommendedBooks.length > 0) {
          return {
            content: `I found "${recommendedBooks[0].title}" by ${recommendedBooks[0].author}. Here are some details:`,
            books: recommendedBooks.slice(0, 1),
          };
        }
      }
    }

    // Handle series or collection requests
    if (/\b(all the books|series|collection)\b/i.test(lowercaseMessage)) {
      const seriesMatch = lowercaseMessage.match(
        /\b(all the books|series|collection)\b\s+of\s+(.+)/i
      );
      const seriesName = seriesMatch ? seriesMatch[2].trim() : "";

      if (seriesName) {
        recommendedBooks = await searchBooks(seriesName);
        if (recommendedBooks.length > 0) {
          return {
            content: `Here are the books in the "${seriesName}" series I found:`,
            books: recommendedBooks,
          };
        }
      }
    }

    // Handle recommendation requests
    if (/(recommend|suggestion|suggest)/i.test(lowercaseMessage)) {
      const keywords = lowercaseMessage
        .split(" ")
        .filter(
          (word) =>
            word.length > 3 &&
            !["recommend", "suggestion", "suggest", "book", "books"].includes(
              word
            )
        );

      const searchTerm = keywords.length > 0 ? keywords.join(" ") : "popular";
      recommendedBooks = await searchBooks(searchTerm);

      if (recommendedBooks.length > 0) {
        return {
          content: `Based on your request, here are some books you might enjoy:`,
          books: recommendedBooks,
        };
      }
    }

    // Check for specific book title mentions or fallback to title search
    if (recommendedBooks.length === 0) {
      recommendedBooks = await searchBooks(message); // Use the entire message as the search query
      if (recommendedBooks.length > 0) {
        return {
          content: `I found "${recommendedBooks[0].title}" by ${recommendedBooks[0].author}. Here are some details:`,
          books: recommendedBooks.slice(0, 1),
        };
      }
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }

  if (recommendedBooks.length === 0) {
    const aiResponse = await callGenerativeAI(
      `I couldn't find the book or series "${message}" in my database. Could you suggest similar books or provide more details?`
    );
    return {
      content: aiResponse,
      books: [],
    };
  }

  // Default response if no specific match
  return {
    content:
      "I'd be happy to help you find a good book! Could you tell me more about what genres or themes you enjoy, or perhaps a favorite book so I can suggest similar titles?",
    books: [],
  };
}

// Scroll to bottom of chat
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle form submission
messageForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const message = messageInput.value.trim();
  if (message === "" || isTyping) return;

  // Add user message to chat
  addMessage(message, "user");
  messageInput.value = "";

  // Show typing indicator
  isTyping = true;
  sendButton.disabled = true;
  const typingIndicator = showTypingIndicator();

  try {
    // Simulate network delay
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 1000)
    );

    // Process message
    const response = await processMessage(message);

    // Remove typing indicator
    removeTypingIndicator(typingIndicator);

    // Add bot response
    addMessage(response.content, "bot", response.books);
  } catch (error) {
    console.error("Error:", error);

    // Remove typing indicator
    removeTypingIndicator(typingIndicator);

    // Add error message
    addMessage(
      "I'm having trouble connecting to my book database right now. Could you try again in a moment?",
      "bot"
    );
  } finally {
    isTyping = false;
    sendButton.disabled = false;
  }
});

// Welcome message when chat loads
document.addEventListener("DOMContentLoaded", function () {
  const welcomeMessage =
    '👋 Hello! I\'m your Book Recommendation Bot. Tell me what kind of books you enjoy reading, or ask for recommendations based on genres, authors, or themes. For example, try:\n\n• "I like science fiction books"\n• "Recommend books similar to Harry Potter"\n• "What are some good mystery novels?"\n• "I want a book that will make me cry"';

  addMessage(welcomeMessage, "bot");
});
