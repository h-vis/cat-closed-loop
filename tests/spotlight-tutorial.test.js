const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { selectLessons, createProgress, cellRect, STORAGE_KEY } = require("../spotlight-tutorial");

function stage(number) {
  return { ...JSON.parse(fs.readFileSync(path.join(__dirname, `../stage/medium/${String(number).padStart(3, "0")}.json`), "utf8")), mode: "stage" };
}

test("the shipped stage order introduces each mechanic at its first appearance", () => {
  const manifest = require("../stage/manifest.json");
  const introduced = {};
  const seen = [];
  for (const number of manifest.medium) {
    for (const lesson of selectLessons(stage(number), seen)) {
      introduced[lesson.id] = number;
      seen.push(lesson.id);
    }
  }
  assert.deepEqual(introduced, { line: 1, key: 1, goal: 1, bomb: 1, bucket: 2, wall: 4, warp: 23, lateWarp: 25 });
});

test("skipping one stage suppresses its lessons but keeps future mechanics", () => {
  const storage = new Map();
  const getStorage = () => ({ getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) });
  const progress = createProgress(getStorage);
  progress.remember(selectLessons(stage(1)).map((lesson) => lesson.id));
  const restored = createProgress(getStorage);
  assert.equal(selectLessons(stage(1), restored.read()).length, 0);
  assert.deepEqual(selectLessons(stage(2), restored.read()).map((lesson) => lesson.id), ["bucket"]);
  assert.equal(selectLessons(stage(1), restored.read(), true).length, 4);
});

test("jumping ahead still explains mechanics the player has not encountered", () => {
  const lessons = selectLessons(stage(23));
  assert.ok(lessons.some((lesson) => lesson.id === "warp"));
  assert.ok(!lessons.some((lesson) => lesson.id === "lateWarp"));
});

test("unavailable localStorage keeps session progress without throwing", () => {
  const progress = createProgress(() => { throw new Error("Storage blocked"); });
  progress.remember(["bomb"]);
  assert.deepEqual(progress.read(), ["bomb"]);
});

test("invalid storage and unknown versioned lesson ids are ignored", () => {
  for (const saved of ["not JSON", "null", '{}']) {
    assert.deepEqual(createProgress(() => ({ getItem: () => saved })).read(), []);
  }
  const progress = createProgress(() => ({ getItem: (key) => key === STORAGE_KEY ? '["bomb", "unknown", 17]' : null }));
  assert.deepEqual(progress.read(), ["bomb"]);
});

test("maker and legacy tutorial modes never trigger the stage guide", () => {
  assert.deepEqual(selectLessons({ ...stage(1), mode: "maker" }), []);
  assert.deepEqual(selectLessons({ ...stage(1), mode: "tutorial" }), []);
  assert.deepEqual(selectLessons(null), []);
});

test("spotlight uses scaled canvas content coordinates, excluding borders", () => {
  assert.deepEqual(cellRect({ x: 8, y: 4 }, { width: 10, height: 6 },
    { left: 30, top: 120, width: 306, height: 186 }, { left: 3, right: 3, top: 3, bottom: 3 }),
  { x: 273, y: 243, width: 30, height: 30 });
});
