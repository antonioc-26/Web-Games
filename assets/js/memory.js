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

// Elements used to display persisted best-performance statistics
const bestTimeDisplay = document.getElementById("bestTime");
const bestMovesDisplay = document.getElementById("bestMoves");

// Storage key used to persist memory game statistics in the browser
const MEMORY_STATS_KEY = "webGames.memory.stats";

// Reset button shown on the main game screen
const memoryResetButton = document.getElementById("memoryResetButton");

// Win modal elements used when the player completes the board
const memoryWinModal = document.getElementById("memoryWinModal");
const memoryWinMessage = document.getElementById("memoryWinMessage");
const memoryModalNewGameButton = document.getElementById("memoryModalNewGameButton");


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

// Indicates whether the current board has been completed
let gameFinished = false;


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
 * loadMemoryStats()
 * ----------------------------------------------------------
 * Reads persisted memory-game statistics from localStorage.
 *
 * Returns:
 *   {Object} An object containing:
 *   - bestTime  {number|null}
 *   - bestMoves {number|null}
 * ==========================================================
 */
function loadMemoryStats() {
  const savedStats = localStorage.getItem(MEMORY_STATS_KEY);

  if (!savedStats) {
    return {
      bestTime: null,
      bestMoves: null,
    };
  }

  try {
    return JSON.parse(savedStats);
  } catch (error) {
    console.error("Unable to parse saved memory statistics.", error);

    return {
      bestTime: null,
      bestMoves: null,
    };
  }
}


/**
 * ==========================================================
 * saveMemoryStats(stats)
 * ----------------------------------------------------------
 * Persists the supplied memory-game statistics into browser
 * storage for use across future visits.
 *
 * Parameters:
 *   {Object} stats - Statistics object to save
 * ==========================================================
 */
function saveMemoryStats(stats) {
  localStorage.setItem(MEMORY_STATS_KEY, JSON.stringify(stats));
}


/**
 * ==========================================================
 * renderMemoryStats()
 * ----------------------------------------------------------
 * Updates the stats panel in the UI using currently saved
 * localStorage values.
 * ==========================================================
 */
function renderMemoryStats() {
  const stats = loadMemoryStats();

  bestTimeDisplay.textContent =
    stats.bestTime === null ? "--" : `${stats.bestTime} seconds`;

  bestMovesDisplay.textContent =
    stats.bestMoves === null ? "--" : stats.bestMoves;
}


/**
 * ==========================================================
 * updateMemoryResetButtonLabel()
 * ----------------------------------------------------------
 * Keeps the reset button text aligned with the current game
 * state. While a game is active or not yet completed, the
 * control reads "Reset Game". After a completed board, the
 * label changes to "New Game".
 * ==========================================================
 */
function updateMemoryResetButtonLabel() {
  if (!memoryResetButton) return;

  memoryResetButton.textContent = gameFinished ? "New Game" : "Reset Game";
}


/**
 * ==========================================================
 * updateBestMemoryStats()
 * ----------------------------------------------------------
 * Compares the current completed game against saved best
 * statistics and updates localStorage when a new best result
 * is achieved.
 * ==========================================================
 */
function updateBestMemoryStats() {
  const stats = loadMemoryStats();

  const updatedStats = {
    bestTime:
      stats.bestTime === null || timer < stats.bestTime ? timer : stats.bestTime,
    bestMoves:
      stats.bestMoves === null || moves < stats.bestMoves ? moves : stats.bestMoves,
  };

  saveMemoryStats(updatedStats);
  renderMemoryStats();
}


/**
 * ==========================================================
 * createCard(imageSrc, index)
 * ----------------------------------------------------------
 * Creates a single memory card with a front and back face so
 * CSS can animate a flip transition between the hidden state
 * and the revealed image state.
 *
 * Parameters:
 *   {string} imageSrc - Card face image path
 *   {number} index    - Position index within the shuffled set
 * ==========================================================
 */
function createCard(imageSrc, index) {
  const card = document.createElement("button");
  card.type = "button";
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
  card.setAttribute("aria-label", "Memory card");
  card.setAttribute("aria-pressed", "false");

  const cardInner = document.createElement("div");
  cardInner.className = "card__inner";

  const cardFront = document.createElement("div");
  cardFront.className = "card__face card__face--front";

  const frontImage = document.createElement("img");
  frontImage.src = imageSrc;
  frontImage.alt = "Memory card front image";

  const cardBack = document.createElement("div");
  cardBack.className = "card__face card__face--back";

  const backImage = document.createElement("img");

  // Display the back-of-card image while face down
  backImage.src = "../assets/images/memory/backofcard.jpg";
  backImage.alt = "Back of memory card";

  cardFront.appendChild(frontImage);
  cardBack.appendChild(backImage);

  cardInner.appendChild(cardFront);
  cardInner.appendChild(cardBack);
  card.appendChild(cardInner);

  // Flip the card when clicked
  card.addEventListener("click", () => flipCard(card));

  // Render the card on the board
  board.appendChild(card);
}


/**
 * ===============================
 * INITIAL BOARD RENDER
 * ===============================
 * Create all shuffled cards, place them onto the board,
 * and render any saved best-performance statistics.
 */
cards.forEach((src, i) => createCard(src, i));
renderMemoryStats();

updateMemoryResetButtonLabel();

/*
  Attach button behavior for the Memory Game reset control and
  the win-modal new-game action.
*/
if (memoryResetButton) {
  memoryResetButton.addEventListener("click", resetGame);
}

if (memoryModalNewGameButton) {
  memoryModalNewGameButton.addEventListener("click", () => {
    hideWinModal();
    resetGame();
  });
}


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

  // Reveal the card visually using the CSS flip class
  card.classList.add("revealed");
  card.setAttribute("aria-pressed", "true");

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
      updateBestMemoryStats();
      showWinModal();
      gameFinished = true;
      updateMemoryResetButtonLabel();
    }

    resetTurn();
  } else {
    // No match: briefly show the cards, then flip them back
    setTimeout(() => {
      first.classList.remove("revealed");
      second.classList.remove("revealed");

      first.setAttribute("aria-pressed", "false");
      second.setAttribute("aria-pressed", "false");

      resetTurn();
    }, 900);
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
 * showWinModal()
 * ----------------------------------------------------------
 * Displays the end-of-game modal with the player's final
 * move count and completion time.
 * ==========================================================
 */
function showWinModal() {
  memoryWinMessage.textContent =
    `You finished the game in ${moves} moves and ${timer} seconds.`;

  memoryWinModal.classList.remove("hidden");
  memoryWinModal.setAttribute("aria-hidden", "false");
}


/**
 * ==========================================================
 * hideWinModal()
 * ----------------------------------------------------------
 * Hides the win modal so the player can return to the board
 * or begin a new game.
 * ==========================================================
 */
function hideWinModal() {
  memoryWinModal.classList.add("hidden");
  memoryWinModal.setAttribute("aria-hidden", "true");
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
 * Starts a fresh Memory Game session with a reshuffled board.
 *
 * Actions performed:
 *  - Stop the current timer
 *  - Reset game-tracking state
 *  - Clear the current board
 *  - Shuffle the card order
 *  - Rebuild the card grid
 *  - Restore the default reset-button label
 *  - Hide the win modal if it is open
 * ==========================================================
 */
function resetGame() {
  stopTimer();

  first = null;
  second = null;
  lock = false;
  moves = 0;
  timer = 0;
  gameFinished = false;

  movesDisplay.textContent = moves;
  document.getElementById("timer").textContent = timer;

  hideWinModal();
  updateMemoryResetButtonLabel();

  board.innerHTML = "";
  shuffle(cards);
  cards.forEach((src, i) => createCard(src, i));
}