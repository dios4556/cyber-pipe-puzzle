const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("resetBtn");
const checkBtn = document.getElementById("checkBtn");
const winDialog = document.getElementById("winDialog");
const winSummary = document.getElementById("winSummary");
const playAgainBtn = document.getElementById("playAgainBtn");

const size = 4;
const dirs = ["up", "right", "down", "left"];
const opposites = { up: "down", right: "left", down: "up", left: "right" };
const deltas = {
  up: [-1, 0],
  right: [0, 1],
  down: [1, 0],
  left: [0, -1]
};

let tiles = [];
let startIndex = 0;
let startDir = "left";
let goalIndex = 15;
let goalDir = "right";
let finished = false;

function rotateEdges(edges, turns) {
  return edges.map((edge) => dirs[(dirs.indexOf(edge) + turns) % 4]);
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function rowOf(index) {
  return Math.floor(index / size);
}

function colOf(index) {
  return index % size;
}

function neighbor(index, dir) {
  const [dr, dc] = deltas[dir];
  const nextRow = rowOf(index) + dr;
  const nextCol = colOf(index) + dc;

  if (nextRow < 0 || nextRow >= size || nextCol < 0 || nextCol >= size) return null;
  return nextRow * size + nextCol;
}

function borderPorts() {
  const ports = [];
  for (let index = 0; index < size * size; index += 1) {
    const row = rowOf(index);
    const col = colOf(index);
    if (row === 0) ports.push({ index, dir: "up" });
    if (col === size - 1) ports.push({ index, dir: "right" });
    if (row === size - 1) ports.push({ index, dir: "down" });
    if (col === 0) ports.push({ index, dir: "left" });
  }
  return ports;
}

function choosePorts() {
  const ports = shuffle(borderPorts());
  const start = ports[0];
  const goal = ports.find((port) => port.index !== start.index) || ports[1];
  startIndex = start.index;
  startDir = start.dir;
  goalIndex = goal.index;
  goalDir = goal.dir;
}

function makeRandomNetwork() {
  const edgeSets = Array.from({ length: size * size }, () => new Set());
  const visited = new Set();
  const stack = [Math.floor(Math.random() * size * size)];
  visited.add(stack[0]);

  while (stack.length) {
    const current = stack[stack.length - 1];
    const options = shuffle(dirs)
      .map((dir) => ({ dir, next: neighbor(current, dir) }))
      .filter((item) => item.next !== null && !visited.has(item.next));

    if (!options.length) {
      stack.pop();
      continue;
    }

    const { dir, next } = options[0];
    edgeSets[current].add(dir);
    edgeSets[next].add(opposites[dir]);
    visited.add(next);
    stack.push(next);
  }

  edgeSets[startIndex].add(startDir);
  edgeSets[goalIndex].add(goalDir);
  return edgeSets.map((edges, index) => ({
    id: index,
    solutionEdges: [...edges],
    turns: randomTurns(index)
  }));
}

function randomTurns(index) {
  let turns = Math.floor(Math.random() * 4);
  if (turns === 0 && index % 2 === 0) turns = 1;
  return turns;
}

function initGame() {
  choosePorts();
  tiles = makeRandomNetwork();

  if (isSolved()) {
    tiles[0].turns = (tiles[0].turns + 1) % 4;
  }

  finished = false;
  winDialog.hidden = true;
  statusEl.textContent = "타일을 돌려 START와 GOAL을 연결하세요.";
  render();
}


function currentEdges(tile) {
  return rotateEdges(tile.solutionEdges, tile.turns);
}

function render() {
  boardEl.innerHTML = "";

  tiles.forEach((tile) => {
    const button = document.createElement("button");
    button.className = "tile";
    button.type = "button";
    button.setAttribute("aria-label", `${tile.id + 1}번 파이프 회전`);
    button.addEventListener("click", () => rotateTile(tile.id));

    if (tile.id === startIndex) addMarker(button, "start", "START", "IN");
    if (tile.id === goalIndex) addMarker(button, "end", "GOAL", "OUT");

    const pipe = document.createElement("span");
    pipe.className = "pipe";

    currentEdges(tile).forEach((edge) => {
      const segment = document.createElement("span");
      segment.className = `segment ${edge}`;
      pipe.appendChild(segment);
    });

    const core = document.createElement("span");
    core.className = "core";
    pipe.appendChild(core);
    button.appendChild(pipe);
    boardEl.appendChild(button);
  });

  markConnectedPath();
}

function addMarker(tileEl, className, text, code) {
  tileEl.classList.add(className);
  const marker = document.createElement("span");
  marker.className = "marker";
  marker.innerHTML = `<span class="marker-code">${code}</span><span class="marker-label">${text}</span>`;
  tileEl.appendChild(marker);
}

function rotateTile(id) {
  if (finished) return;
  tiles[id].turns = (tiles[id].turns + 1) % 4;
  render();

  if (isSolved()) completeGame();
}

function edgeSet(index) {
  return new Set(currentEdges(tiles[index]));
}

function traceConnected() {
  const connected = new Set();
  const queue = [startIndex];
  connected.add(startIndex);

  while (queue.length) {
    const index = queue.shift();
    const edges = edgeSet(index);

    edges.forEach((edge) => {
      const next = neighbor(index, edge);
      if (next === null) return;

      const nextEdges = edgeSet(next);
      if (nextEdges.has(opposites[edge]) && !connected.has(next)) {
        connected.add(next);
        queue.push(next);
      }
    });
  }

  return connected;
}

function isSolved() {
  const connected = traceConnected();
  return connected.has(goalIndex);
}

function markConnectedPath() {
  const connected = traceConnected();
  [...boardEl.children].forEach((tileEl, index) => {
    tileEl.classList.toggle("connected", connected.has(index));
  });
}

function completeGame() {
  finished = true;
  statusEl.textContent = "CLEAR";
  winSummary.textContent = "START에서 GOAL까지 회로가 연결되었습니다.";
  winDialog.hidden = false;
}

function checkConnection() {
  if (isSolved()) {
    completeGame();
    return;
  }

  const connected = traceConnected().size;
  statusEl.textContent = `현재 ${connected}/16칸이 START와 연결되어 있습니다.`;
}

resetBtn.addEventListener("click", initGame);
checkBtn.addEventListener("click", checkConnection);
playAgainBtn.addEventListener("click", initGame);

initGame();






