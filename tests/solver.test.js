const test = require("node:test");
const assert = require("node:assert/strict");

const {
  applyLoop,
  buildLoopFromDrawnCells,
  createInitialState,
  findStageRegionBasedSolution,
  loadStageJson,
} = require("../solver");

function makeStage(overrides = {}) {
  return {
    version: 1,
    boardSize: { width: 5, height: 5 },
    playerStart: { x: 0, y: 0 },
    keyPosition: { x: 4, y: 0 },
    goalPosition: { x: 4, y: 4 },
    bombs: [],
    disarmItems: [],
    wallBlocks: [],
    warps: [],
    lateWarps: [],
    keyInitiallyCollected: false,
    designLabel: "test-stage",
    ...overrides,
  };
}

test("buildLoopFromDrawnCells includes connected wall blocks", () => {
  const stage = makeStage({
    wallBlocks: [
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ],
  });

  const loop = buildLoopFromDrawnCells([{ x: 0, y: 2 }], stage);
  assert.ok(loop);
  assert.equal(loop.connectedWallBlocks.length, 4);
  assert.deepEqual(
    loop.lineCells.map((cell) => `${cell.x},${cell.y}`).sort(),
    ["0,2", "1,2", "2,2", "3,2", "4,2"]
  );
});

test("buildLoopFromDrawnCells rejects degree-3 line graphs", () => {
  const stage = makeStage();
  const loop = buildLoopFromDrawnCells(
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 0 },
    ],
    stage
  );
  assert.equal(loop, null);
});

test("applyLoop rejects loops that leave a bomb in the player space", () => {
  const stage = makeStage({
    playerStart: { x: 1, y: 1 },
    bombs: [{ x: 0, y: 0 }],
  });
  const state = createInitialState(stage);
  const loop = buildLoopFromDrawnCells(
    [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 2, y: 4 },
    ],
    stage
  );

  assert.ok(loop);
  assert.equal(applyLoop(state, loop, stage), null);
});

test("medium/004 is solved in two moves", () => {
  const stage = loadStageJson("stage/medium/004.json");
  const solution = findStageRegionBasedSolution(stage, { maxSteps: 6 });

  assert.ok(solution);
  assert.equal(solution.length, 2);

  let state = createInitialState(stage);
  for (const step of solution) {
    const loop = buildLoopFromDrawnCells(step.drawnCells, stage);
    assert.ok(loop);
    const nextState = applyLoop(state, loop, stage);
    assert.ok(nextState);
    state = {
      ...nextState,
      history: [...state.history, step],
    };
  }

  assert.equal(state.clear, true);
});
