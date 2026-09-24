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

  function approach(path) {
    // Keep the target for the contact gesture, but never enter its occupied cell.
    // A return trip reverses this shortened path, not the route to the target.
    if (!path?.length) return {path};
    return {path: path.length > 1 ? path.slice(0, -1) : path.slice(), target: {...path.at(-1)}};
  }

  function sample(actor, progress, arrival, reduced) {
    const distance = actor.path.length - 1;
    const travel = progress * distance;
    const index = Math.min(Math.floor(travel), Math.max(0, distance - 1));
    const from = actor.path[index], to = actor.path[Math.min(index+1, distance)];
    const fraction = distance ? travel - index : 0;
    const hop = reduced ? 0 : Math.abs(Math.sin(travel * Math.PI * 2));
    const gesture = reduced ? 0 : Math.sin(arrival * Math.PI);
    const nibble = reduced ? 0 : Math.sin(arrival * Math.PI * 6) * gesture;
    const end = actor.path.at(-1);
    const dx = actor.target ? actor.target.x - end.x : 0;
    const dy = actor.target ? actor.target.y - end.y : 0;
    const lean = gesture * .18;
    const sleepy = actor.cue === "sleep" || actor.cue === "home";
    const excited = actor.cue === "startled" || actor.cue === "return";
    const wiggle = sleepy ? gesture * .12 : nibble * .1;
    const bounce = excited ? Math.abs(nibble) * .12 : 0;
    let scale = 1, alpha = 1;
    if (actor.exit) { const fade = Math.max(0, (arrival - .7) / .3); scale = 1 - fade * .3; alpha = 1 - fade; }
    if (actor.enter) { scale = .12 + arrival * .88; alpha = arrival; }
    return {...actor, x:from.x+(to.x-from.x)*fraction + dx * lean,
      y:from.y+(to.y-from.y)*fraction - hop * .2 + dy * lean - bounce,
      tilt: reduced ? 0 : Math.sin(travel * Math.PI * 2) * .12 + wiggle,
      stretch: 1 + hop * .12 - (sleepy ? gesture * .15 : nibble * .07), scale, alpha, arrival};
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
          const travelMs = steps * (gentle ? 180 : 420);
          const arrivalMs = gentle ? 300 : 1100;
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
              player.actors = actors.map(actor => sample({...actor, cue}, progress, arrival, gentle));
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
  const api = {findPath, approach, sample, create};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CatMotion = api;
})(globalThis);
