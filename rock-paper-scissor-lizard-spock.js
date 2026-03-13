/**********************************
 * Rock Paper scissor Lizard Spock
 *********************************/

const buttons = document.querySelectorAll("[data-choice]");
const resultText = document.getElementById("round-result");
const scoreboard = document.getElementById("scoreboard");
const resetBtn = document.getElementById("reset");

let playerScore = 0;
let computerScore = 0;
let gameOver = false;
let computerScoreEl = document.getElementById("computerScore");
let playerScoreEl = document.getElementById("playerScore");

function computerPlay() {
  const choices = ["Rock", "Paper", "Scissors", "Lizard", "Spock"];
  const randomIndex = Math.floor(Math.random() * choices.length);
  return choices[randomIndex];
}

function playRound(playerSelection) {
  if (gameOver) return;

  const computerSelection = computerPlay();

  if (playerSelection === computerSelection) {
    resultText.textContent = `You both chose ${playerSelection}! It's a tie!`;
  } else if (
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
    resultText.textContent = `${playerSelection} beats ${computerSelection}! You win!`;
  } else {
    computerScore++;
    resultText.textContent = `${computerSelection} beats ${playerSelection}! You lose!`;
  }

  updateScore();
  checkWinner();
}

function updateScore() {
  playerScoreEl.textContent = playerScore;
  computerScoreEl.textContent = computerScore;
  // scoreboard.textContent = `Player: ${playerScore} | Computer: ${computerScore}`;
}

function checkWinner() {
  if (playerScore === 10) {
    resultText.textContent = `Player reaches 10 first! Player wins! 🎉`;
    gameOver = true;
  } else if (computerScore === 10) {
    resultText.textContent = `Computer reaches 10 first! Computer wins! 🤖`;
    gameOver = true;
  }

  if (gameOver) {
    // Optionally disable the buttons
    buttons.forEach((button) => (button.style.pointerEvents = "none")); // disables clicking
  }
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const playerChoice = button.getAttribute("data-choice");
    playRound(playerChoice);
  });
});

resetBtn.addEventListener("click", () => {
  playerScore = 0;
  computerScore = 0;
  gameOver = false;
  resultText.textContent = "Make your choice!";
  updateScore();

  buttons.forEach((button) => (button.style.pointerEvents = "auto"));
});
