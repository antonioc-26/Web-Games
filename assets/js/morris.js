// ----- BOARD & UI ELEMENTS -----
const nineBoard = document.getElementById("nineBoard");
const status = document.getElementById("status");
const restartBtn = document.getElementById("restart");

// ----- POSITIONS (percent coordinates) -----
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

// ----- CONNECTIONS (valid neighbor indices) -----
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

// ----- MILL TRIPLETS -----
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

// ----- CREATE POINT ELEMENTS -----
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

// ----- GAME STATE -----
let formedMills = new Set();
let currentPlayer = "white";
let whitePlaced = 0; // total pieces placed
let blackPlaced = 0;
let phase = "placing"; // "placing", "moving", "removing"
let selectedPoint = null;
let gameOver = false;

// ----- EVENT LISTENERS -----
points.forEach((p) => p.addEventListener("click", onClick));
restartBtn.addEventListener("click", restartGame);

// ----- EVENT HANDLER -----
function onClick(ev) {
  if (gameOver) return;
  const point = ev.currentTarget;
  const idx = parseInt(point.dataset.index, 10);
  const opponent = currentPlayer === "white" ? "black" : "white";

  // --- REMOVAL PHASE ---
  if (phase === "removing") {
    if (!point.classList.contains(opponent)) return;
    const oppPieces = points.filter((p) => p.classList.contains(opponent));
    const allInMills = oppPieces.every((p) => isPartOfMill(p, opponent));
    if (isPartOfMill(point, opponent) && !allInMills) {
      updateStatus(
        "Cannot remove a piece in a mill unless all opponent pieces are in mills."
      );
      return;
    }
    // Remove piece (does NOT affect placed counters)
    point.classList.remove(opponent);
    point.setAttribute("aria-pressed", "false");

    // After removal, switch back to normal phase
    phase = whitePlaced === 9 && blackPlaced === 9 ? "moving" : "placing";
    currentPlayer = opponentOf(currentPlayer);
    updateStatus();
    checkWin();
    return;
  }

  // --- PLACEMENT PHASE ---
  if (phase === "placing") {
    if (point.classList.contains("white") || point.classList.contains("black"))
      return;

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

    if (checkMill(currentPlayer)) {
      phase = "removing";
      updateStatus(
        `${capitalize(currentPlayer)} formed a mill! Remove an opponent piece.`
      );
      return;
    }

    currentPlayer = opponentOf(currentPlayer);
    updateStatus();

    if (whitePlaced === 9 && blackPlaced === 9) {
      phase = "moving";
      updateStatus("All pieces placed. Movement phase begins!");
    }
    return;
  }

  // --- MOVEMENT PHASE ---
  handleMovement(point, idx);
}

// ----- MOVEMENT HANDLER -----
function handleMovement(point, idx) {
  if (selectedPoint === null) {
    if (point.classList.contains(currentPlayer)) {
      selectedPoint = point;
      selectedPoint.style.outline = "3px solid gold";
      selectedPoint.setAttribute("aria-pressed", "true");
    }
    return;
  }

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

  if ((isNeighbor || canFly(currentPlayer)) && !occupied) {
    point.classList.add(currentPlayer);
    point.setAttribute("aria-pressed", "true");
    selectedPoint.classList.remove(currentPlayer);
    selectedPoint.setAttribute("aria-pressed", "false");
    selectedPoint.style.outline = "none";
    selectedPoint = null;

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
    selectedPoint.style.outline = "none";
    selectedPoint.setAttribute("aria-pressed", "false");
    selectedPoint = null;
  }
}

// ----- UTILS -----
function opponentOf(player) {
  return player === "white" ? "black" : "white";
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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
  for (const key of Array.from(formedMills)) {
    if (key.startsWith(player) && !currentMills.has(key))
      formedMills.delete(key);
  }
  for (const key of currentMills) formedMills.add(key);
  return newMill;
}

function isPartOfMill(point, player) {
  const idx = parseInt(point.dataset.index);
  return mills.some(
    (triple) =>
      triple.every((i) => points[i].classList.contains(player)) &&
      triple.includes(idx)
  );
}

function countPieces(player) {
  return points.filter((p) => p.classList.contains(player)).length;
}
function canFly(player) {
  return countPieces(player) === 3;
}

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

function updateStatus(msg = null) {
  if (msg) {
    status.textContent = msg;
    return;
  }
  if (gameOver) return;
  if (phase === "placing")
    status.textContent = `${currentPlayer.toUpperCase()}'s turn — placing pieces`;
  else if (phase === "moving")
    status.textContent = `${currentPlayer.toUpperCase()}'s turn — moving pieces`;
  else if (phase === "removing")
    status.textContent = `${currentPlayer.toUpperCase()} — remove one opponent piece`;
}

// ----- RESTART -----
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

// initialize UI text
updateStatus("White begins (placing pieces).");
