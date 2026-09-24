const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../game.js'), 'utf8');
function appearanceHarness() {
  const start = source.indexOf('const ICON_SPRITE_DEFINITIONS =');
  const end = source.indexOf('const drawWallBlocksFallback', start);
  const gameState = { stage: {} };
  let value = 0;
  const math = Object.create(Math);
  math.random = () => value;
  const scope = { gameState, Math: math, getCellKey: ({x,y}) => `${x},${y}` };
  vm.createContext(scope);
  vm.runInContext(source.slice(start, end) + '\nglobalThis.sprites = ICON_SPRITE_DEFINITIONS;', scope);
  return { scope, gameState, random: v => { value = v; } };
}
test('all five cats and dogs are reachable; appearance stays stable during play and warps', () => {
  const h = appearanceHarness();
  for (let i = 0; i < 5; i++) {
    h.gameState.stage = {};
    h.random((i + .1) / 5);
    const cat = h.scope.getAnimalSpriteKey('player', {x:1,y:1});
    const dog = h.scope.getAnimalSpriteKey('bomb', {x:4,y:1});
    assert.equal(cat, i === 0 ? 'player' : `cat${i}`);
    assert.equal(dog, i === 0 ? 'bomb' : `dog${i}`);
    h.random(.99);
    assert.equal(h.scope.getAnimalSpriteKey('player', {x:8,y:5}), cat);
    assert.equal(h.scope.getAnimalSpriteKey('bomb', {x:4,y:1}), dog);
    assert.ok(h.scope.sprites[cat]);
    assert.ok(h.scope.sprites[dog]);
  }
});
test('dogs at separate positions can get different appearances', () => {
  const h = appearanceHarness();
  assert.equal(h.scope.getAnimalSpriteKey('bomb', {x:1,y:1}), 'bomb');
  h.random(.8);
  assert.equal(h.scope.getAnimalSpriteKey('bomb', {x:2,y:1}), 'dog4');
});
test('every themed asset is shipped and the atlas fits all sprite rectangles', () => {
  const h = appearanceHarness();
  const bytes = fs.readFileSync(path.join(__dirname, '../assets/cats/sprites.png'));
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  for (const sprite of Object.values(h.scope.sprites)) {
    assert.ok(sprite.x + sprite.width <= width);
    assert.ok(sprite.y + sprite.height <= height);
  }
  for (const asset of ['bag','tunnel','fish','bone','box-open','box-closed', ...Array.from({length:5}, (_,i) => `cat-${i}`), ...Array.from({length:5}, (_,i) => `dog-${i}`)]) {
    assert.ok(fs.existsSync(path.join(__dirname, `../assets/cats/${asset}.png`)), asset);
  }
});
