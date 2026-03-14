/*
------------------------------------------------------------
Author: Antonio Corona
Date: 2026-03-14
Project: Web Games Collection
File: rpsls.js
Game: Rock Paper Scissors Lizard Spock

Description:
  Implements the game logic and UI interactions for the
  Rock-Paper-Scissors-Lizard-Spock browser game.

Responsibilities:
  - Handle player input through button clicks
  - Generate random computer selections
  - Determine the outcome of each round
  - Update and display player/computer scores
  - Detect when a player reaches the win condition (10 points)
  - Reset the game state when requested
------------------------------------------------------------
*/

/**
 * ===============================
 * DOM ELEMENT REFERENCES
 * ===============================
 * These constants store references to elements in the HTML
 * so the script can update the UI dynamically.
 */

// All buttons representing player choices (Rock, Paper, etc.)
const buttons = document.querySelectorAll("[data-choice]");

// Element that displays the result of the current round
const resultText = document.getElementById("round-result");

// Scoreboard container
const scoreboard = document.getElementById("scoreboard");

// Reset button element
const resetBtn = document.getElementById("reset");

// Individual score elements
let computerScoreEl = document.getElementById("computerScore");
let playerScoreEl = document.getElementById("playerScore");


/**
 * ===============================
 * GAME STATE VARIABLES
 * ===============================
 * These variables track the state of the game.
 */

// Player score counter
let playerScore = 0;

// Computer score counter
let computerScore = 0;

// Boolean flag used to disable gameplay once a winner is declared
let gameOver = false;


/**
 * ==========================================================
 * computerPlay()
 * ----------------------------------------------------------
 * Randomly selects one of the five possible game choices
 * for the computer.
 *
 * Returns:
 *   {string} One of the following:
 *   "Rock", "Paper", "Scissors", "Lizard", or "Spock"
 * ==========================================================
 */
function computerPlay() {
  const choices = ["Rock", "Paper", "Scissors", "Lizard", "Spock"];

  // Generate a random index within the choices array
  const randomIndex = Math.floor(Math.random() * choices.length);

  return choices[randomIndex];
}


/**
 * ==========================================================
 * playRound(playerSelection)
 * ----------------------------------------------------------
 * Handles the logic for a single round of the game.
 *
 * Steps:
 * 1. Prevent play if the game is already over
 * 2. Generate the computer's choice
 * 3. Compare player vs computer choices
 * 4. Update scores based on the outcome
 * 5. Display round result
 * 6. Update the scoreboard
 * 7. Check if the game winner condition has been reached
 *
 * Parameters:
 *   {string} playerSelection - The player's chosen option
 * ==========================================================
 */
function playRound(playerSelection) {
  if (gameOver) return;

  const computerSelection = computerPlay();

  // Check for tie condition
  if (playerSelection === computerSelection) {
    resultText.textContent = `You both chose ${playerSelection}! It's a tie!`;
  }

  // Player win conditions
  else if (
    (playerSelection === "Rock" && computerSelection === "Scissors") ||
    (playerSelection === "Rock" && computerSelection === "Lizard") ||
    (playerSelection === "Paper" && computerSelection === "Rock") ||
    (playerSelection === "Paper" && computerSelection === "Spock") ||
    (playerSelection === "Scissors" && computerSelection === "Lizard") ||
    (playerSelection === "Spock" && computerSelection === "Rock") ||
    (playerSelection === "Spock" && computerSelection === "Scissors") ||
    (playerSelection === "Lizard" && computerSelection === "Spock") ||
    (playerSelection === "Lizard" && computerSelection === "Paper") ||
    (playerSelection === "Scissors" && computerSelection === "Paper")
  ) {
    playerScore++;
    resultText.textContent =
      `${playerSelection} beats ${computerSelection}! You win!`;
  }

  // Otherwise the computer wins the round
  else {
    computerScore++;
    resultText.textContent =
      `${computerSelection} beats ${playerSelection}! You lose!`;
  }

  // Update UI and check for a game winner
  updateScore();
  checkWinner();
}


/**
 * ==========================================================
 * updateScore()
 * ----------------------------------------------------------
 * Updates the score values displayed in the UI.
 *
 * This function synchronizes the score variables with the
 * DOM elements showing player and computer scores.
 * ==========================================================
 */
function updateScore() {
  playerScoreEl.textContent = playerScore;
  computerScoreEl.textContent = computerScore;

  // Optional alternate scoreboard display
  // scoreboard.textContent = `Player: ${playerScore} | Computer: ${computerScore}`;
}


/**
 * ==========================================================
 * checkWinner()
 * ----------------------------------------------------------
 * Determines if either player has reached the win condition.
 *
 * The game ends when either the player or computer reaches
 * 10 points.
 *
 * If the game ends:
 *   - A victory message is displayed
 *   - All choice buttons are disabled
 * ==========================================================
 */
function checkWinner() {
  if (playerScore === 10) {
    resultText.textContent = `Player reaches 10 first! Player wins! 🎉`;
    gameOver = true;
  } 
  else if (computerScore === 10) {
    resultText.textContent = `Computer reaches 10 first! Computer wins! 🤖`;
    gameOver = true;
  }

  // Disable player input if the game has ended
  if (gameOver) {
    buttons.forEach((button) => (button.style.pointerEvents = "none"));
  }
}


/**
 * ==========================================================
 * EVENT LISTENERS — PLAYER CHOICE BUTTONS
 * ----------------------------------------------------------
 * Each button corresponds to one possible player move.
 * When clicked:
 *   1. Retrieve the move from the data-choice attribute
 *   2. Call playRound() with that move
 * ==========================================================
 */
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const playerChoice = button.getAttribute("data-choice");
    playRound(playerChoice);
  });
});


/**
 * ==========================================================
 * RESET BUTTON EVENT
 * ----------------------------------------------------------
 * Resets the game state so a new match can begin.
 *
 * Actions performed:
 *   - Reset both scores to 0
 *   - Clear the gameOver flag
 *   - Reset UI text
 *   - Re-enable all buttons
 * ==========================================================
 */
resetBtn.addEventListener("click", () => {
  playerScore = 0;
  computerScore = 0;
  gameOver = false;

  resultText.textContent = "Make your choice!";

  updateScore();

  // Re-enable all choice buttons
  buttons.forEach((button) => (button.style.pointerEvents = "auto"));
});