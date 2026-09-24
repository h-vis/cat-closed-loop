const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../game.js'), 'utf8');

function harness({width = 720, height = 438, dpr = 2} = {}) {
  const rect = {left: 100, top: 50, width, height};
  let resets = 0;
  const canvas = {style: {}, getBoundingClientRect: () => rect, _width: 480, _height: 288};
  for (const key of ['width', 'height']) Object.defineProperty(canvas, key, {
    get() { return this[`_${key}`]; },
    set(value) { resets++; this[`_${key}`] = value; },
  });
  const context = {setTransform(...args) { this.transform = args; }};
  const floor = {cache: {}};
  const scope = {
    canvas, context, window: {devicePixelRatio: dpr}, drawDungeonFloor: floor,
    activeBoardSize: {width:10, height:6},
    getStageBoardSize: stage => stage.boardSize,
    cloneBoardSize: board => ({...board}),
    getBoardPixelWidth: () => scope.activeBoardSize.width * 48,
    getBoardPixelHeight: () => scope.activeBoardSize.height * 48,
    getComputedStyle: () => ({borderLeftWidth:'3px',borderRightWidth:'3px',borderTopWidth:'3px',borderBottomWidth:'3px'}),
  };
  vm.createContext(scope);
  vm.runInContext(source.slice(source.indexOf('function updateCanvasMetrics('), source.indexOf('function createInitialState(')), scope);
  vm.runInContext(source.slice(source.indexOf('function getCanvasPoint('), source.indexOf('function preventTouchBrowserAction(')), scope);
  return {scope, canvas, context, rect, floor, resets: () => resets};
}

test('bitmap matches display pixels at fractional and high DPR, not puzzle cell resolution', () => {
  for (const dpr of [1, 1.25, 2, 3]) {
    const h = harness({dpr});
    h.scope.syncCanvasResolution();
    assert.equal(h.canvas.width, Math.ceil(714 * dpr));
    assert.equal(h.canvas.height, Math.ceil(432 * dpr));
    assert.equal(h.context.transform[0], h.canvas.width / 480);
    assert.equal(h.context.transform[3], h.canvas.height / 288);
    assert.equal(h.floor.cache, null);
    const resets = h.resets();
    h.scope.syncCanvasResolution();
    assert.equal(h.resets(), resets, 'redrawing must not reallocate the bitmap');
  }
});

test('mouse and touch map to the same logical cell at all pixel densities, excluding borders', () => {
  for (const dpr of [1, 2, 3]) {
    const h = harness({dpr});
    h.scope.syncCanvasResolution();
    const position = {clientX:103 + 714 * .85, clientY:53 + 432 * .75};
    for (const event of [position, {touches:[position]}, {changedTouches:[position]}]) {
      const point = h.scope.getCanvasPoint(event);
      assert.equal(Math.floor(point.x / 48), 8);
      assert.equal(Math.floor(point.y / 48), 4);
    }
  }
});

test('resize invalidates floor cache; hiding the canvas never creates a zero-size bitmap', () => {
  const h = harness();
  h.scope.syncCanvasResolution();
  h.floor.cache = {};
  h.rect.width = 318;
  h.rect.height = 193.2;
  h.scope.syncCanvasResolution();
  assert.equal(h.canvas.width, 624);
  assert.equal(h.floor.cache, null);
  h.rect.width = h.rect.height = 0;
  h.scope.syncCanvasResolution();
  assert.equal(h.canvas.width, 960);
  assert.equal(h.canvas.height, 576);
});

test('a new board rebuilds its floor even if CSS dimensions have not changed yet', () => {
  const h = harness();
  h.scope.syncCanvasResolution();
  h.floor.cache = {};
  h.scope.updateCanvasMetrics({boardSize:{width:10, height:10}});
  assert.equal(h.floor.cache, null);
  assert.equal(h.canvas.style.aspectRatio, '480 / 480');
  assert.equal(h.context.transform[3], h.canvas.height / 480);
});
