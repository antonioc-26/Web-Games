/*
------------------------------------------------------------
Author: Antonio Corona
Date: 2026-03-14
Project: Web Games Collection
File: memory.js
Game: Memory Game

Description:
  Implements the game logic and UI interactions for the
  Memory Game browser app.

Responsibilities:
  - Duplicate and shuffle card images for gameplay
  - Dynamically create card elements on the board
  - Handle card flipping and match detection
  - Track player moves
  - Start and stop the game timer
  - Detect when all matches have been found
------------------------------------------------------------
*/

/**
 * ===============================
 * CARD IMAGE DEFINITIONS
 * ===============================
 * Each entry represents one unique card face image used in
 * the memory game.
 *
 * These images are duplicated later so each card has a match.
 */
const imagePaths = [
  "../assets/images/memory/Card1.jpg",
  "../assets/images/memory/Card2.jpg",
  "../assets/images/memory/card3.jpg",
  "../assets/images/memory/card4.jpeg",
  "../assets/images/memory/card5.jpeg",
  "../assets/images/memory/card6.jpg",
  "../assets/images/memory/card7.jpg",
  "../assets/images/memory/card8.jpg",
];


/**
 * ===============================
 * GAME SETUP
 * ===============================
 * Duplicate the image set so each image appears twice, then
 * shuffle the result to randomize card placement.
 *
 * Example:
 *   ["a", "b", "c"] becomes ["a", "b", "c", "a", "b", "c"]
 */
const cards = shuffle([...imagePaths, ...imagePaths]);


/**
 * ===============================
 * DOM ELEMENT REFERENCES
 * ===============================
 * These constants store references to the primary UI elements
 * used during gameplay.
 */

// Main game board container where card elements are rendered
const board = document.getElementById("gameBoard");

// Element used to display the player's move count
const movesDisplay = document.getElementById("moves");


/**
 * ===============================
 * GAME STATE VARIABLES
 * ===============================
 * These variables track the current state of the game.
 */

// First selected card in the current turn
let first = null;

// Second selected card in the current turn
let second = null;

// Prevents clicks while cards are being evaluated
let lock = false;

// Total number of completed turns/moves
let moves = 0;

// Elapsed game time in seconds
let timer = 0;

// Stores the active timer interval reference
let timerInterval = null;


/**
 * ==========================================================
 * shuffle(array)
 * ----------------------------------------------------------
 * Randomizes the order of items in an array using the
 * Fisher-Yates shuffle algorithm.
 *
 * Parameters:
 *   {Array} array - The array to shuffle
 *
 * Returns:
 *   {Array} The shuffled array
 * ==========================================================
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}


/**
 * ==========================================================
 * createCard(imageSrc, index)
 * ----------------------------------------------------------
 * Creates a single card element, assigns its image metadata,
 * and adds it to the game board.
 *
 * Each card starts face down and can be flipped by the player.
 *
 * Parameters:
 *   {string} imageSrc - The image path associated with the card
 *   {number} index - The card's position index in the shuffled array
 * ==========================================================
 */
function createCard(imageSrc, index) {
  const card = document.createElement("div");
  card.className = "card";

  /**
   * Store the image source in a custom data attribute.
   * This makes it easy to identify which image the card
   * represents during match checking.
   */
  card.dataset.image = imageSrc;

  /**
   * Store the index in a custom data attribute.
   * Useful for tracking card position and avoiding accidental
   * duplicate interactions with the same card.
   */
  card.dataset.index = index;

  const img = document.createElement("img");

  // Display the back-of-card image while face down
  img.src = "../assets/images/memory/backofcard.jpg";

  card.appendChild(img);

  // Flip the card when clicked
  card.addEventListener("click", () => flipCard(card));

  // Render the card on the board
  board.appendChild(card);
}


/**
 * ===============================
 * INITIAL BOARD RENDER
 * ===============================
 * Create all shuffled cards and place them onto the board.
 */
cards.forEach((src, i) => createCard(src, i));


/**
 * ==========================================================
 * flipCard(card)
 * ----------------------------------------------------------
 * Handles the logic for flipping and evaluating a selected
 * card.
 *
 * Rules enforced:
 *  - Ignore clicks while the board is locked
 *  - Ignore clicks on already matched or revealed cards
 *  - Start the timer on the player's first move
 *  - Reveal the selected card
 *  - Compare two selected cards for a match
 *  - Lock input while mismatched cards are briefly shown
 *
 * Parameters:
 *   {HTMLElement} card - The clicked card element
 * ==========================================================
 */
function flipCard(card) {
  if (
    lock ||
    card.classList.contains("matched") ||
    card.classList.contains("revealed")
  ) {
    return;
  }

  // Start the timer on the player's first valid card flip
  if (moves === 0 && !first) {
    startTimer();
  }

  const img = card.querySelector("img");

  // Reveal the card's front image
  img.src = card.dataset.image;
  card.classList.add("revealed");

  // First card selection of the turn
  if (!first) {
    first = card;
    return;
  }

  // Second card selection of the turn
  second = card;
  lock = true;
  moves++;
  movesDisplay.textContent = moves;

  // Match found
  if (first.dataset.image === second.dataset.image) {
    first.classList.add("matched");
    second.classList.add("matched");

    // If all cards are matched, the game is complete
    if (document.querySelectorAll(".card.matched").length === cards.length) {
      stopTimer();
      alert(`You won in ${moves} moves and ${timer} seconds!`);
    }

    resetTurn();
  } else {
    // No match: briefly show the cards, then flip them back
    setTimeout(() => {
      first.querySelector("img").src = "../assets/images/memory/backofcard.jpg";
      second.querySelector("img").src = "../assets/images/memory/backofcard.jpg";

      first.classList.remove("revealed");
      second.classList.remove("revealed");

      resetTurn();
    }, 1000);
  }
}


/**
 * ==========================================================
 * resetTurn()
 * ----------------------------------------------------------
 * Clears the current turn state so the player can begin a new
 * selection.
 *
 * Actions performed:
 *  - Reset first and second selected card references
 *  - Unlock the board for the next move
 * ==========================================================
 */
function resetTurn() {
  [first, second] = [null, null];
  lock = false;
}


/**
 * ==========================================================
 * startTimer()
 * ----------------------------------------------------------
 * Starts the game timer if it is not already running.
 *
 * The timer increments once per second and updates the timer
 * display in the UI.
 * ==========================================================
 */
function startTimer() {
  if (timerInterval) return;

  timerInterval = setInterval(() => {
    timer++;
    document.getElementById("timer").textContent = timer;
  }, 1000);
}


/**
 * ==========================================================
 * stopTimer()
 * ----------------------------------------------------------
 * Stops the active game timer and clears the stored interval
 * reference.
 * ==========================================================
 */
function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}


/**
 * ==========================================================
 * resetGame()
 * ----------------------------------------------------------
 * Restarts the Memory Game so the player can play again.
 *
 * Actions performed:
 *  - Stop the current timer
 *  - Reset timer and move counters
 *  - Clear turn-tracking state
 *  - Remove all existing cards from the board
 *  - Reshuffle the cards
 *  - Rebuild the board with a fresh layout
 * ==========================================================
 */
function resetGame() {
  stopTimer();

  // Reset game state values
  first = null;
  second = null;
  lock = false;
  moves = 0;
  timer = 0;

  // Reset UI displays
  movesDisplay.textContent = moves;
  document.getElementById("timer").textContent = timer;

  // Clear the current board
  board.innerHTML = "";

  // Reshuffle the existing card array in place
  shuffle(cards);

  // Rebuild the board with the new shuffled order
  cards.forEach((src, i) => createCard(src, i));
}