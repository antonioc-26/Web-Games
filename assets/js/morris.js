/*
------------------------------------------------------------
Author: Antonio Corona
Date: 2026-03-14
Project: Web Games Collection
File: morris.js
Game: Nine Men's Morris

Description:
  Implements the game logic and UI interactions for the
  Nine Men's Morris browser game.

Responsibilities:
  - Create and position playable board points
  - Manage piece placement, movement, and removal phases
  - Detect mills and enforce mill-removal rules
  - Track the active player and game state
  - Determine win conditions
  - Reset the board and restart the game
------------------------------------------------------------
*/

/**
 * ===============================
 * DOM ELEMENT REFERENCES
 * ===============================
 * These constants store references to key UI elements used
 * throughout the game.
 */

// Main board container where the point elements are rendered
const nineBoard = document.getElementById("nineBoard");

// Text element used to display game status and instructions
const status = document.getElementById("status");

// Restart button used to reset the game
const restartBtn = document.getElementById("restart");


/**
 * ===============================
 * BOARD POSITION DEFINITIONS
 * ===============================
 * Each entry represents the x/y percentage coordinates of a
 * playable point on the Nine Men's Morris board.
 *
 * These coordinates are used to position point elements
 * visually within the board container.
 */
const positions = [
  [5, 5],
  [50, 5],
  [95, 5],
  [20, 20],
  [50, 20],
  [80, 20],
  [35, 35],
  [50, 35],
  [65, 35],
  [5, 50],
  [20, 50],
  [35, 50],
  [65, 50],
  [80, 50],
  [95, 50],
  [35, 65],
  [50, 65],
  [65, 65],
  [20, 80],
  [50, 80],
  [80, 80],
  [5, 95],
  [50, 95],
  [95, 95],
];


/**
 * ===============================
 * BOARD CONNECTION MAP
 * ===============================
 * Defines all valid adjacent point connections on the board.
 *
 * Each key is a board point index, and its value is an array
 * of neighboring indices that can be moved to during the
 * movement phase (unless the player is allowed to fly).
 */
const connections = {
  0: [1, 9],
  1: [0, 2, 4],
  2: [1, 14],
  3: [4, 10],
  4: [1, 3, 5, 7],
  5: [4, 13],
  6: [7, 11],
  7: [4, 6, 8],
  8: [7, 12],
  9: [0, 10, 21],
  10: [3, 9, 11, 18],
  11: [6, 10, 15],
  12: [8, 13, 17],
  13: [5, 12, 14, 20],
  14: [2, 13, 23],
  15: [11, 16],
  16: [15, 17, 19],
  17: [12, 16],
  18: [10, 19],
  19: [16, 18, 20, 22],
  20: [13, 19],
  21: [9, 22],
  22: [19, 21, 23],
  23: [14, 22],
};


/**
 * ===============================
 * MILL DEFINITIONS
 * ===============================
 * Each array represents a valid three-point mill combination.
 *
 * A player forms a mill when all three board positions in a
 * given triplet are occupied by that player's pieces.
 */
const mills = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [15, 16, 17],
  [18, 19, 20],
  [21, 22, 23],
  [0, 9, 21],
  [3, 10, 18],
  [6, 11, 15],
  [2, 14, 23],
  [5, 13, 20],
  [8, 12, 17],
  [1, 4, 7],
  [16, 19, 22],
  [9, 10, 11],
  [12, 13, 14],
];


/**
 * ===============================
 * BOARD POINT CREATION
 * ===============================
 * Dynamically creates the 24 clickable board points based on
 * the position definitions above.
 *
 * Each point is rendered as a button element for accessibility
 * and stored in the `points` array for later game logic use.
 */
const points = [];

positions.forEach(([x, y], i) => {
  const p = document.createElement("button");

  p.type = "button";
  p.className = "point";
  p.dataset.index = i;
  p.style.left = x + "%";
  p.style.top = y + "%";
  p.setAttribute("aria-pressed", "false");
  p.setAttribute("aria-label", `Board point ${i}`);

  nineBoard.appendChild(p);
  points.push(p);
});


/**
 * ===============================
 * GAME STATE VARIABLES
 * ===============================
 * These variables track the current state of the game.
 */

// Stores unique identifiers for mills that have already been formed
let formedMills = new Set();

// Tracks whose turn it is ("white" or "black")
let currentPlayer = "white";

// Number of pieces each player has placed on the board
let whitePlaced = 0;
let blackPlaced = 0;

// Current game phase: "placing", "moving", or "removing"
let phase = "placing";

// Currently selected point during movement phase
let selectedPoint = null;

// Indicates whether the game has ended
let gameOver = false;


/**
 * ===============================
 * EVENT LISTENERS
 * ===============================
 * Attach click handlers to each board point and the restart
 * button.
 */
points.forEach((p) => p.addEventListener("click", onClick));
restartBtn.addEventListener("click", restartGame);


/**
 * ==========================================================
 * onClick(ev)
 * ----------------------------------------------------------
 * Main click handler for all board points.
 *
 * Behavior depends on the current game phase:
 *  - placing: place a new piece on an empty point
 *  - moving: select and move an existing piece
 *  - removing: remove an opponent piece after forming a mill
 *
 * Parameters:
 *   {Event} ev - The click event from a board point
 * ==========================================================
 */
function onClick(ev) {
  if (gameOver) return;

  const point = ev.currentTarget;
  const idx = parseInt(point.dataset.index, 10);
  const opponent = currentPlayer === "white" ? "black" : "white";

  /**
   * -------------------------------
   * REMOVAL PHASE
   * -------------------------------
   * The current player may remove one opponent piece after
   * forming a new mill.
   */
  if (phase === "removing") {
    if (!point.classList.contains(opponent)) return;

    const oppPieces = points.filter((p) => p.classList.contains(opponent));
    const allInMills = oppPieces.every((p) => isPartOfMill(p, opponent));

    // A piece in a mill cannot be removed unless all opponent
    // pieces are currently part of mills.
    if (isPartOfMill(point, opponent) && !allInMills) {
      updateStatus(
        "Cannot remove a piece in a mill unless all opponent pieces are in mills."
      );
      return;
    }

    // Remove the opponent piece from the board
    point.classList.remove(opponent);
    point.setAttribute("aria-pressed", "false");

    // Return to normal gameplay after removal
    phase = whitePlaced === 9 && blackPlaced === 9 ? "moving" : "placing";
    currentPlayer = opponentOf(currentPlayer);
    updateStatus();
    checkWin();
    return;
  }

  /**
   * -------------------------------
   * PLACEMENT PHASE
   * -------------------------------
   * Players alternate placing pieces until both players have
   * placed all 9 pieces.
   */
  if (phase === "placing") {
    if (point.classList.contains("white") || point.classList.contains("black")) {
      return;
    }

    if (currentPlayer === "white" && whitePlaced < 9) {
      point.classList.add("white");
      whitePlaced++;
    } else if (currentPlayer === "black" && blackPlaced < 9) {
      point.classList.add("black");
      blackPlaced++;
    } else {
      updateStatus(`${capitalize(currentPlayer)} has already placed 9 pieces.`);
      return;
    }

    // If a new mill is formed, move into removal phase
    if (checkMill(currentPlayer)) {
      phase = "removing";
      updateStatus(
        `${capitalize(currentPlayer)} formed a mill! Remove an opponent piece.`
      );
      return;
    }

    // Switch turns after a normal placement
    currentPlayer = opponentOf(currentPlayer);
    updateStatus();

    // Once both players have placed all pieces, start movement phase
    if (whitePlaced === 9 && blackPlaced === 9) {
      phase = "moving";
      updateStatus("All pieces placed. Movement phase begins!");
    }

    return;
  }

  /**
   * -------------------------------
   * MOVEMENT PHASE
   * -------------------------------
   * Once all pieces are placed, players move pieces to adjacent
   * points, or may fly if reduced to 3 pieces.
   */
  handleMovement(point, idx);
}


/**
 * ==========================================================
 * handleMovement(point, idx)
 * ----------------------------------------------------------
 * Handles piece selection and movement during the movement
 * phase.
 *
 * Rules:
 *  - A player must first select one of their own pieces
 *  - A selected piece may move to an adjacent empty point
 *  - If the player has only 3 pieces left, they may "fly"
 *    to any empty point
 *  - Forming a new mill triggers the removal phase
 *
 * Parameters:
 *   {HTMLElement} point - The clicked board point
 *   {number} idx - The index of the clicked board point
 * ==========================================================
 */
function handleMovement(point, idx) {
  // No selected piece yet: select a piece owned by current player
  if (selectedPoint === null) {
    if (point.classList.contains(currentPlayer)) {
      selectedPoint = point;
      selectedPoint.style.outline = "3px solid gold";
      selectedPoint.setAttribute("aria-pressed", "true");
    }
    return;
  }

  // Clicking the selected piece again cancels the selection
  if (point === selectedPoint) {
    selectedPoint.style.outline = "none";
    selectedPoint.setAttribute("aria-pressed", "false");
    selectedPoint = null;
    return;
  }

  const fromIdx = parseInt(selectedPoint.dataset.index, 10);
  const isNeighbor = connections[fromIdx]?.includes(idx);
  const occupied =
    point.classList.contains("white") || point.classList.contains("black");

  // Allow the move if the destination is valid and empty
  if ((isNeighbor || canFly(currentPlayer)) && !occupied) {
    point.classList.add(currentPlayer);
    point.setAttribute("aria-pressed", "true");

    selectedPoint.classList.remove(currentPlayer);
    selectedPoint.setAttribute("aria-pressed", "false");
    selectedPoint.style.outline = "none";
    selectedPoint = null;

    // Forming a new mill allows the current player to remove
    // an opponent piece before turns switch.
    if (checkMill(currentPlayer)) {
      phase = "removing";
      updateStatus(
        `${capitalize(currentPlayer)} formed a mill! Remove an opponent piece.`
      );
      return;
    }

    currentPlayer = opponentOf(currentPlayer);
    checkWin();
    updateStatus();
  } else {
    // Invalid move: clear the current selection
    selectedPoint.style.outline = "none";
    selectedPoint.setAttribute("aria-pressed", "false");
    selectedPoint = null;
  }
}


/**
 * ==========================================================
 * opponentOf(player)
 * ----------------------------------------------------------
 * Returns the opposing player's color.
 *
 * Parameters:
 *   {string} player - The current player
 *
 * Returns:
 *   {string} "black" if player is "white", otherwise "white"
 * ==========================================================
 */
function opponentOf(player) {
  return player === "white" ? "black" : "white";
}


/**
 * ==========================================================
 * capitalize(str)
 * ----------------------------------------------------------
 * Capitalizes the first character of a string.
 *
 * Parameters:
 *   {string} str - The input string
 *
 * Returns:
 *   {string} The capitalized string
 * ==========================================================
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


/**
 * ==========================================================
 * checkMill(player)
 * ----------------------------------------------------------
 * Checks whether the specified player has formed a new mill.
 *
 * This function tracks mills already counted so the same mill
 * is not repeatedly treated as "new" unless it is broken and
 * formed again later.
 *
 * Parameters:
 *   {string} player - The player to evaluate
 *
 * Returns:
 *   {boolean} True if a new mill was formed, otherwise false
 * ==========================================================
 */
function checkMill(player) {
  let newMill = false;
  const currentMills = new Set();

  for (const triple of mills) {
    const key = player + triple.join(",");

    if (triple.every((i) => points[i].classList.contains(player))) {
      currentMills.add(key);
      if (!formedMills.has(key)) newMill = true;
    }
  }

  // Remove mills that no longer exist
  for (const key of Array.from(formedMills)) {
    if (key.startsWith(player) && !currentMills.has(key)) {
      formedMills.delete(key);
    }
  }

  // Add currently valid mills
  for (const key of currentMills) {
    formedMills.add(key);
  }

  return newMill;
}


/**
 * ==========================================================
 * isPartOfMill(point, player)
 * ----------------------------------------------------------
 * Determines whether a specific point belongs to an active
 * mill for the specified player.
 *
 * Parameters:
 *   {HTMLElement} point - The board point to evaluate
 *   {string} player - The player color
 *
 * Returns:
 *   {boolean} True if the point is part of a completed mill
 * ==========================================================
 */
function isPartOfMill(point, player) {
  const idx = parseInt(point.dataset.index);

  return mills.some(
    (triple) =>
      triple.every((i) => points[i].classList.contains(player)) &&
      triple.includes(idx)
  );
}


/**
 * ==========================================================
 * countPieces(player)
 * ----------------------------------------------------------
 * Counts how many pieces of the specified player are currently
 * on the board.
 *
 * Parameters:
 *   {string} player - The player color
 *
 * Returns:
 *   {number} The number of pieces on the board
 * ==========================================================
 */
function countPieces(player) {
  return points.filter((p) => p.classList.contains(player)).length;
}


/**
 * ==========================================================
 * canFly(player)
 * ----------------------------------------------------------
 * Determines whether the player is allowed to fly.
 *
 * In Nine Men's Morris, a player may fly when they are reduced
 * to exactly 3 remaining pieces.
 *
 * Parameters:
 *   {string} player - The player color
 *
 * Returns:
 *   {boolean} True if the player may fly
 * ==========================================================
 */
function canFly(player) {
  return countPieces(player) === 3;
}


/**
 * ==========================================================
 * canMove(player)
 * ----------------------------------------------------------
 * Determines whether the specified player has at least one
 * legal move available.
 *
 * A player can move if:
 *  - They have exactly 3 pieces (can fly), or
 *  - At least one of their pieces has an adjacent empty point
 *
 * Parameters:
 *   {string} player - The player color
 *
 * Returns:
 *   {boolean} True if the player can make a legal move
 * ==========================================================
 */
function canMove(player) {
  if (countPieces(player) === 3) return true;

  return points
    .filter((p) => p.classList.contains(player))
    .some((p) =>
      connections[parseInt(p.dataset.index)].some(
        (i) =>
          !points[i].classList.contains("white") &&
          !points[i].classList.contains("black")
      )
    );
}


/**
 * ==========================================================
 * checkWin()
 * ----------------------------------------------------------
 * Evaluates whether either player has met a losing condition.
 *
 * A player loses if:
 *  - They have fewer than 3 pieces remaining, or
 *  - They cannot make a legal move
 *
 * Placement phase is excluded from win evaluation.
 *
 * Returns:
 *   {boolean} True if a winner has been determined
 * ==========================================================
 */
function checkWin() {
  if (phase === "placing") return false;

  const whiteCount = countPieces("white");
  const blackCount = countPieces("black");

  if (whiteCount < 3) {
    gameOver = true;
    updateStatus("BLACK WINS!");
    return true;
  }

  if (blackCount < 3) {
    gameOver = true;
    updateStatus("WHITE WINS!");
    return true;
  }

  if (!canMove("white")) {
    gameOver = true;
    updateStatus("BLACK WINS!");
    return true;
  }

  if (!canMove("black")) {
    gameOver = true;
    updateStatus("WHITE WINS!");
    return true;
  }

  return false;
}


/**
 * ==========================================================
 * updateStatus(msg = null)
 * ----------------------------------------------------------
 * Updates the status text shown to the player.
 *
 * If a custom message is provided, it is displayed directly.
 * Otherwise, the function displays the appropriate message
 * based on the current game phase and active player.
 *
 * Parameters:
 *   {string|null} msg - Optional custom status message
 * ==========================================================
 */
function updateStatus(msg = null) {
  if (msg) {
    status.textContent = msg;
    return;
  }

  if (gameOver) return;

  if (phase === "placing") {
    status.textContent = `${currentPlayer.toUpperCase()}'s turn — placing pieces`;
  } else if (phase === "moving") {
    status.textContent = `${currentPlayer.toUpperCase()}'s turn — moving pieces`;
  } else if (phase === "removing") {
    status.textContent = `${currentPlayer.toUpperCase()} — remove one opponent piece`;
  }
}


/**
 * ==========================================================
 * restartGame()
 * ----------------------------------------------------------
 * Resets the entire board and game state to its initial
 * starting values.
 *
 * Actions performed:
 *  - Remove all pieces from the board
 *  - Clear any visual selection styles
 *  - Reset phase, player turn, and counters
 *  - Clear tracked mills
 *  - Restore the default status message
 * ==========================================================
 */
function restartGame() {
  points.forEach((p) => {
    p.classList.remove("white", "black");
    p.style.outline = "none";
    p.setAttribute("aria-pressed", "false");
  });

  currentPlayer = "white";
  whitePlaced = 0;
  blackPlaced = 0;
  phase = "placing";
  selectedPoint = null;
  gameOver = false;
  formedMills.clear();

  updateStatus("White begins (placing pieces).");
}


/**
 * ===============================
 * INITIAL UI SETUP
 * ===============================
 * Displays the starting instruction when the page loads.
 */
updateStatus("White begins (placing pieces).");