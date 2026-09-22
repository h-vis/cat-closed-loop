const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Exercise the production event handlers without bootstrapping the game's DOM.
const source = fs.readFileSync(path.join(__dirname, "../game.js"), "utf8");
const start = source.indexOf("let clearAdvanceGesture = null;");
const end = source.indexOf("const ICON_SPRITE_SHEET_PATH", start);
assert.ok(start >= 0 && end > start, "Clear advancement handler boundaries exist");

function harness(load = async () => {}) {
  function target() {
    const handlers = new Map();
    return {
      addEventListener(type, handler) {
        handlers.set(type, [...(handlers.get(type) || []), handler]);
      },
      async send(type, data = {}) {
        const event = { target: canvas, isPrimary: true, button: 0, pointerId: 1, clientX: 100, clientY: 100, preventDefault() {}, ...data };
        await Promise.all((handlers.get(type) || []).map((handler) => handler(event)));
      },
    };
  }
  const canvas = target();
  const window = target();
  const gameState = { clear: false, mode: "stage", stage: { stageNumber: 1, stageDifficulty: "medium" } };
  const calls = [];
  const spotlightTutorial = { active: false };
  vm.runInNewContext(source.slice(start, end), {
    canvas, window, gameState, spotlightTutorial,
    GAME_MODE: { random: "random" },
    isCurrentStageLocked: () => false,
    getStageModeKey: () => "stage",
    normalizeStageDifficulty: (value) => value,
    getNextKnownStageNumber: (number) => number + 1,
    playStageByNumber: async (...args) => { calls.push(args); await load(); },
  });
  return { canvas, window, gameState, calls, spotlightTutorial };
}

test("winning release and its compatibility click leave CLEAR displayed", async () => {
  const h = harness();
  await h.canvas.send("pointerdown");
  h.gameState.clear = true;
  await h.window.send("pointerup");
  await h.canvas.send("click");
  assert.equal(h.calls.length, 0);
  await h.canvas.send("pointerdown");
  await h.window.send("pointerup");
  await h.canvas.send("click");
  assert.deepEqual(h.calls, [[2, "medium"]]);
});

test("touch cancellation, dragging and outside releases never advance", async () => {
  const h = harness();
  h.gameState.clear = true;
  await h.canvas.send("pointerdown", { pointerType: "touch" });
  await h.window.send("pointercancel");
  await h.window.send("pointerup");
  await h.canvas.send("pointerdown");
  await h.window.send("pointerup", { clientX: 150 });
  await h.canvas.send("pointerdown");
  await h.window.send("pointerup", { target: h.window });
  assert.equal(h.calls.length, 0);
});

test("stale stages, secondary pointers and the tutorial cannot advance", async () => {
  const h = harness();
  h.gameState.clear = true;
  await h.canvas.send("pointerdown");
  h.gameState.stage = { stageNumber: 2, stageDifficulty: "medium" };
  await h.window.send("pointerup");
  await h.canvas.send("pointerdown", { isPrimary: false });
  await h.window.send("pointerup");
  h.spotlightTutorial.active = true;
  await h.canvas.send("pointerdown");
  await h.window.send("pointerup");
  assert.equal(h.calls.length, 0);
});

test("rapid taps cannot request the next stage twice while it loads", async () => {
  let finish;
  const h = harness(() => new Promise((resolve) => { finish = resolve; }));
  h.gameState.clear = true;
  await h.canvas.send("pointerdown");
  const pending = h.window.send("pointerup");
  await h.canvas.send("pointerdown");
  await h.window.send("pointerup");
  assert.equal(h.calls.length, 1);
  finish();
  await pending;
});
