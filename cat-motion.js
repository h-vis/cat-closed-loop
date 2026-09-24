(function (root) {
  "use strict";
  const key = p => `${p.x},${p.y}`;

  // Paths only use the current region, so animals never walk through the line or a wall.
  function findPath(start, end, spaces) {
    const region = spaces.get(key(start));
    if (region == null || region !== spaces.get(key(end))) return null;
    const queue = [{...start}];
    const parents = new Map([[key(start), null]]);
    for (let head = 0; head < queue.length; head++) {
      const p = queue[head];
      if (key(p) === key(end)) {
        const path = [];
        for (let cell = p; cell; cell = parents.get(key(cell))) path.push(cell);
        return path.reverse();
      }
      for (const [dx, dy] of [[1,0],[0,1],[-1,0],[0,-1]]) {
        const next = {x:p.x+dx, y:p.y+dy};
        if (spaces.get(key(next)) !== region || parents.has(key(next))) continue;
        parents.set(key(next), p);
        queue.push(next);
      }
    }
    return null;
  }

  function sample(actor, progress, arrival, reduced) {
    const distance = actor.path.length - 1;
    const travel = progress * distance;
    const index = Math.min(Math.floor(travel), Math.max(0, distance - 1));
    const from = actor.path[index], to = actor.path[Math.min(index+1, distance)];
    const fraction = distance ? travel - index : 0;
    const hop = reduced ? 0 : Math.abs(Math.sin(travel * Math.PI));
    let scale = 1, alpha = 1;
    if (actor.exit) { scale = 1 - arrival * .88; alpha = 1 - arrival; }
    if (actor.enter) { scale = .12 + arrival * .88; alpha = arrival; }
    return {...actor, x:from.x+(to.x-from.x)*fraction,
      y:from.y+(to.y-from.y)*fraction - hop * .14,
      tilt: reduced ? 0 : Math.sin(travel * Math.PI) * .065,
      stretch: 1 + hop * .06, scale, alpha, arrival};
  }

  function create({onFrame, onCue = () => {}, request = requestAnimationFrame,
    cancel = cancelAnimationFrame, now = () => performance.now(), reduced = () => false}) {
    let generation = 0, frame = 0, resolveClip = null;
    const player = {active:false, actors:[], cue:"", progress:0};
    player.cancel = () => {
      generation++;
      if (frame) cancel(frame);
      frame = 0;
      player.active = false;
      player.actors = [];
      player.cue = "";
      if (resolveClip) resolveClip(false);
      resolveClip = null;
      onCue("");
    };
    player.begin = () => {
      player.cancel();
      player.active = true;
      const id = generation;
      return {
        alive: () => id === generation,
        play(actors, cue, label) {
          if (id !== generation) return Promise.resolve(false);
          if (actors.some(actor => !actor.path?.length)) {
            throw new Error("Animation requires a path inside one region");
          }
          const gentle = reduced();
          const steps = Math.max(0, ...actors.map(actor => actor.path.length - 1));
          const travelMs = steps ? Math.min(2100, Math.max(350, steps * (gentle ? 55 : 105))) : 0;
          const arrivalMs = gentle ? 120 : 300;
          const start = now();
          player.cue = cue;
          onCue(label);
          return new Promise(resolve => {
            resolveClip = resolve;
            const tick = time => {
              if (id !== generation) return;
              const elapsed = Math.max(0, time - start);
              const progress = travelMs ? Math.min(1, elapsed / travelMs) : 1;
              const arrival = Math.min(1, Math.max(0, (elapsed - travelMs) / arrivalMs));
              player.progress = progress;
              player.actors = actors.map(actor => sample(actor, progress, arrival, gentle));
              onFrame();
              if (arrival >= 1) {
                frame = 0;
                resolveClip = null;
                player.actors = [];
                resolve(true);
              } else frame = request(tick);
            };
            tick(start);
          });
        },
        finish() {
          if (id !== generation) return;
          player.active = false;
          player.actors = [];
          player.cue = "";
          onCue("");
          onFrame();
        },
      };
    };
    return player;
  }
  const api = {findPath, sample, create};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CatMotion = api;
})(globalThis);
