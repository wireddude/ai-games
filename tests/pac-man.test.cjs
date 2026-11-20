const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function loadGame() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'pac-man.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const [, width, height] = html.match(/<canvas[^>]*width="(\d+)" height="(\d+)"/);
  const context = vm.createContext({
    document: {
      getElementById: () => ({ getContext: () => ({}), width: Number(width), height: Number(height) }),
    },
  });
  vm.runInContext(script.replace(
    "        startButton.addEventListener('click', startGame);",
    `        globalThis.game = { state, map, tileSize, canvas, resetGame, moveGhost, updateGhosts, updatePacman, isWall, audio };
        return;`
  ), context);
  context.game.resetGame();
  return context.game;
}

for (const dt of [1 / 60, 0.033, 0.5]) {
  for (const frightened of [false, true]) {
    test(`ghosts stay finite, move, and avoid walls (dt=${dt}, frightened=${frightened})`, () => {
      const game = loadGame();
      game.state.powerTimer = frightened ? 7 : 0;
      for (const ghost of game.state.ghosts) {
        const visited = new Set();
        for (let frame = 0; frame < 60 / dt; frame++) {
          assert.ok(!game.isWall(ghost.x, ghost.y), `${ghost.name} spawned/entered a wall`);
          game.moveGhost(ghost, dt);
          assert.ok(Number.isFinite(ghost.x) && Number.isFinite(ghost.y));
          assert.ok(!game.isWall(ghost.x, ghost.y), `${ghost.name} entered a wall`);
          visited.add(`${Math.floor(ghost.x / 24)},${Math.floor(ghost.y / 24)}`);
        }
        assert.ok(visited.size > 5, `${ghost.name} is stuck`);
      }
    });
  }
}

test('ghost reverses at a dead end', () => {
  const game = loadGame();
  const ghost = game.state.ghosts[0];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let deadEnd;
  for (let y = 0; y < game.map.length; y++) {
    for (let x = 0; x < game.map[y].length; x++) {
      if (game.map[y][x] === '#') continue;
      const exits = dirs.filter(([dx, dy]) => !game.isWall((x + dx + 0.5) * 24, (y + dy + 0.5) * 24));
      if (exits.length === 1) deadEnd = { x, y, dx: exits[0][0], dy: exits[0][1] };
    }
  }
  assert.ok(deadEnd, 'maze has a dead end');
  const { x, y, dx, dy } = deadEnd;
  Object.assign(ghost, { x: (x + 0.5) * 24, y: (y + 0.5) * 24, dirX: -dx, dirY: -dy });
  game.moveGhost(ghost, 24 / ghost.speed);
  assert.equal(ghost.x, (x + dx + 0.5) * 24);
  assert.equal(ghost.y, (y + dy + 0.5) * 24);
});

test('eaten ghost returns to a valid home and resumes movement', () => {
  const game = loadGame();
  game.audio.ghost = () => {};
  const ghost = game.state.ghosts[0];
  game.moveGhost(ghost, 0.1);
  Object.assign(game.state.pacman, { x: ghost.x, y: ghost.y });
  game.state.powerTimer = 7;
  game.updateGhosts(0);
  assert.equal(ghost.x, (ghost.home.x + 0.5) * 24);
  assert.equal(ghost.y, (ghost.home.y + 0.5) * 24);
  assert.equal(ghost.destination, null);
  assert.ok(!game.isWall(ghost.x, ghost.y));
  const startX = ghost.x;
  const startY = ghost.y;
  game.moveGhost(ghost, 0.1);
  assert.ok(ghost.x !== startX || ghost.y !== startY);
  assert.equal(game.state.score, 200);
});

test('maze is rectangular, enclosed, and fully visible', () => {
  const { map, canvas, tileSize } = loadGame();
  const cols = map[0].length;
  assert.equal(canvas.width, cols * tileSize);
  assert.equal(canvas.height, map.length * tileSize);
  for (const row of map) {
    assert.equal(row.length, cols);
    assert.equal(row[0], '#');
    assert.equal(row[cols - 1], '#');
  }
  assert.match(map[0], /^#+$/);
  assert.match(map[map.length - 1], /^#+$/);
});

test('Pac-Man can reach and eat every dot and power pill', () => {
  const game = loadGame();
  const { state, tileSize } = game;
  game.audio.chomp = () => {};
  game.audio.power = () => {};
  const key = (x, y) => `${x},${y}`;
  const visited = new Set();
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // Walk every reachable corridor and back using the real movement/eating code.
  function visit(x, y) {
    visited.add(key(x, y));
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (visited.has(key(nx, ny)) || game.isWall((nx + 0.5) * tileSize, (ny + 0.5) * tileSize)) continue;
      function step(dirX, dirY, expectedX, expectedY) {
        state.desiredDir = { x: dirX, y: dirY };
        game.updatePacman(tileSize / state.pacman.speed);
        assert.equal(state.pacman.x, (expectedX + 0.5) * tileSize);
        assert.equal(state.pacman.y, (expectedY + 0.5) * tileSize);
      }
      step(dx, dy, nx, ny);
      visit(nx, ny);
      step(-dx, -dy, x, y);
    }
  }

  game.updatePacman(0); // Eat the pill at the starting position.
  visit(Math.floor(state.pacman.x / tileSize), Math.floor(state.pacman.y / tileSize));
  const walkableCells = game.map.join('').replace(/#/g, '').length;
  assert.equal(visited.size, walkableCells, 'every corridor is connected to the start');
  assert.equal(state.pellets.length, 0, 'all dots eaten');
  assert.equal(state.powerPills.length, 0, 'all power pills eaten');
});
