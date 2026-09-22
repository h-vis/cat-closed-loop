(function (root) {
  "use strict";

  const STORAGE_KEY = "closedLoopMechanicTutorial.v1";
  const LESSONS = [
    { id: "line", field: "playerStart", ja: ["一筆書きで、空間を分けよう", "マスをドラッグして、ひと続きの線を引きます。線や盤面の端で空間を区切り、勇者とアイテムを同じ空間に入れましょう。"], en: ["One line, separate spaces", "Drag across cells to draw one continuous line. Use your line and the board edges to divide the dungeon into spaces containing the hero and items."] },
    { id: "key", field: "keyPosition", ja: ["まずは鍵を手に入れよう", "勇者と鍵を同じ空間に入れると、鍵を自動で取得します。勇者を直接動かす必要はありません。"], en: ["Collect the key", "Put the hero and key in the same space to collect it automatically. You do not need to move the hero yourself."] },
    { id: "goal", field: "goalPosition", ja: ["鍵を取ったら、ゴールへ", "鍵を取ると扉が開きます。次に勇者と扉を同じ空間に入れればクリア！クリア後は盤面をタップして次のステージへ進めます。"], en: ["Then reach the door", "The key opens the door. Put the hero and open door in the same space to clear the stage! Tap the board after clearing to continue."] },
    { id: "bomb", field: "bombs", ja: ["爆弾から勇者を守ろう", "勇者と爆弾が同じ空間に入るとゲームオーバー。線で空間を分け、爆弾を勇者から切り離しましょう。"], en: ["Keep bombs away", "A bomb in the hero’s space causes a game over. Draw a line that keeps the hero and bombs in separate spaces."] },
    { id: "bucket", field: "disarmItems", ja: ["水入りバケツで爆弾を消そう", "勇者のいない空間に、爆弾と水入りバケツを同じ数だけ入れると、両方が消えます。数が違うと消えません。勇者が一緒にいると先に爆発するので注意！"], en: ["Defuse bombs with water", "In a space without the hero, equal numbers of bombs and buckets cancel each other out. Unequal numbers remain. If the hero is there, the bombs explode first!"] },
    { id: "wall", field: "wallBlocks", ja: ["壁も線の一部になる", "壁のマスには線を引けませんが、引いた線とつなげると壁も線の一部になります。壁を使いながら、分岐のないひと続きの線を作りましょう。"], en: ["Use walls in your line", "You cannot draw on a wall, but connected walls become part of your line. Use them to build one continuous line without branches."] },
    { id: "warp", field: "warps", ja: ["紫ワープは、判定より先に移動", "勇者と片方の紫ワープを同じ空間に入れると、もう片方へ移動します。移動先で爆弾やゴールを判定します。両方のワープが勇者と同じ空間にあると移動しません。"], en: ["Purple warps move you first", "Put the hero with one purple warp to travel to its partner. Bombs and goals are checked after teleporting. Nothing happens if both warps share the hero’s space."] },
    { id: "lateWarp", field: "lateWarps", ja: ["水色ワープは、判定のあとに移動", "水色ワープは爆弾やゴールの判定後に移動します。移動前に勇者と爆弾が同じ空間だと、ワープする前にゲームオーバー。両方が勇者と同じ空間にあると移動しません。"], en: ["Cyan warps move you afterward", "Cyan warps activate after bombs and goals are checked. A bomb in the hero’s starting space causes a game over before teleporting. Both warps in the hero’s space will not activate."] },
  ];

  function targetsFor(lesson, stage) {
    const value = stage[lesson.field];
    const cells = Array.isArray(value) ? value : value ? [value] : [];
    return cells.filter((cell) => Number.isInteger(cell?.x) && Number.isInteger(cell?.y));
  }

  function selectLessons(stage, seen = [], replay = false) {
    if (!stage || stage.mode !== "stage") return [];
    return LESSONS.filter((lesson) => (replay || !seen.includes(lesson.id)) && targetsFor(lesson, stage).length);
  }

  function createProgress(getStorage) {
    const seen = new Set();
    try {
      const saved = JSON.parse(getStorage()?.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) {
        for (const id of saved) if (LESSONS.some((lesson) => lesson.id === id)) seen.add(id);
      }
    } catch (_) { /* Private browsing or damaged storage must never block play. */ }
    return {
      read: () => [...seen],
      remember(ids) {
        ids.forEach((id) => seen.add(id));
        try { getStorage()?.setItem(STORAGE_KEY, JSON.stringify([...seen])); } catch (_) { /* Keep session memory. */ }
      },
    };
  }

  // Canvas borders are outside its drawing coordinates; CSS scaling is independent on each axis.
  function cellRect(cell, board, rect, border = { left: 0, right: 0, top: 0, bottom: 0 }) {
    const width = (rect.width - border.left - border.right) / board.width;
    const height = (rect.height - border.top - border.bottom) / board.height;
    return { x: rect.left + border.left + cell.x * width, y: rect.top + border.top + cell.y * height, width, height };
  }

  function create({ canvas, main, getLanguage, canShow }) {
    const progress = createProgress(() => root.localStorage);
    const overlay = document.createElement("div");
    overlay.className = "spotlight-tutorial";
    overlay.hidden = true;
    overlay.innerHTML = `
      <svg class="spotlight-shade" aria-hidden="true" width="100%" height="100%">
        <defs><mask id="mechanicSpotlightMask" maskUnits="userSpaceOnUse"><rect width="100%" height="100%" fill="white"/><g class="spotlight-cutouts"></g></mask></defs>
        <rect width="100%" height="100%" fill="#030911" fill-opacity=".84" mask="url(#mechanicSpotlightMask)"/>
        <g class="spotlight-rings"></g>
      </svg>
      <section class="spotlight-card" role="dialog" aria-modal="true" aria-labelledby="spotlightTitle" aria-describedby="spotlightText" tabindex="-1">
        <div class="spotlight-heading"><span class="spotlight-kicker"></span><span class="spotlight-counter"></span></div>
        <div class="spotlight-copy" aria-live="polite" aria-atomic="true" tabindex="0"><h2 id="spotlightTitle"></h2><p id="spotlightText"></p></div>
        <div class="spotlight-actions"><button type="button" class="spotlight-skip secondary-button"></button><button type="button" class="spotlight-next"></button></div>
        <p class="spotlight-note"></p>
      </section>`;
    document.body.append(overlay);
    const find = (selector) => overlay.querySelector(selector);
    const card = find(".spotlight-card");
    const next = find(".spotlight-next");
    const skip = find(".spotlight-skip");
    const copy = find(".spotlight-copy");
    const spacer = document.createElement("div");
    spacer.setAttribute("aria-hidden", "true");
    let queue = [];
    let index = 0;
    let stage = null;
    let previousFocus = null;
    let previousInert = false;
    let previousScroll = { left: 0, top: 0 };
    let frame = 0;

    function close() {
      if (overlay.hidden) return;
      overlay.hidden = true;
      cancelAnimationFrame(frame);
      main.inert = previousInert;
      main.classList.remove("spotlight-is-open");
      main.style.removeProperty("--spotlight-canvas-height");
      spacer.remove();
      root.removeEventListener("resize", alignTarget);
      root.removeEventListener("scroll", schedulePosition);
      root.visualViewport?.removeEventListener("resize", alignTarget);
      root.removeEventListener("keydown", onKey, true);
      if (previousFocus?.isConnected && !previousFocus.closest("[hidden]")) previousFocus.focus({ preventScroll: true });
      root.scrollTo({ ...previousScroll, behavior: "instant" });
    }

    function dismiss() {
      // Skip only the lessons in this stage; future new mechanics still get introduced.
      progress.remember(queue.map((lesson) => lesson.id));
      close();
    }

    function onKey(event) {
      if (overlay.hidden) return;
      event.stopImmediatePropagation();
      if (event.key === "Escape") { event.preventDefault(); dismiss(); }
      else if (event.key === "Tab") {
        event.preventDefault();
        const controls = [copy, skip, next];
        const current = controls.indexOf(document.activeElement);
        controls[(current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
      } else if (document.activeElement !== copy && !["Enter", " "].includes(event.key)) event.preventDefault();
    }

    function rectangles() {
      const style = getComputedStyle(canvas);
      const border = Object.fromEntries(["left", "right", "top", "bottom"].map((side) => [side, parseFloat(style.getPropertyValue(`border-${side}-width`)) || 0]));
      const lesson = queue[index];
      const cells = targetsFor(lesson, stage);
      // Highlight the warp pair together; other mechanics use one representative cell.
      return cells.slice(0, lesson.id === "warp" || lesson.id === "lateWarp" ? 2 : 1)
        .map((cell) => cellRect(cell, stage.boardSize, canvas.getBoundingClientRect(), border));
    }

    function position() {
      if (overlay.hidden) return;
      const svgNS = "http://www.w3.org/2000/svg";
      const cutouts = find(".spotlight-cutouts");
      const rings = find(".spotlight-rings");
      cutouts.replaceChildren();
      rings.replaceChildren();
      for (const rect of rectangles()) {
        const hole = document.createElementNS(svgNS, "rect");
        for (const [key, value] of Object.entries({ x: rect.x - 4, y: rect.y - 4, width: rect.width + 8, height: rect.height + 8, rx: 9 })) hole.setAttribute(key, String(value));
        hole.setAttribute("fill", "black");
        cutouts.append(hole);
        const ring = hole.cloneNode();
        ring.setAttribute("fill", "none");
        ring.setAttribute("stroke", "#ffdf86");
        ring.setAttribute("stroke-width", "3");
        rings.append(ring);
      }
    }

    function schedulePosition() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(position);
    }

    function alignTarget() {
      if (overlay.hidden) return;
      // Recenter after rotation/resizing, keeping the ring above the explanation.
      const sideLayout = root.innerHeight < 520 && root.innerWidth >= 640;
      card.classList.toggle("is-side", sideLayout);
      const available = sideLayout ? root.innerHeight - 32 : card.getBoundingClientRect().top - 24;
      // Tall boards must also fit above/beside the card after device rotation.
      main.style.setProperty("--spotlight-canvas-height", `${Math.max(80, available - 40)}px`);
      const rects = rectangles();
      const targetCenterX = rects.reduce((sum, rect) => sum + rect.x + rect.width / 2, 0) / rects.length;
      card.classList.toggle("is-left", sideLayout && targetCenterX > root.innerWidth / 2);
      spacer.style.height = `${card.offsetHeight + 80}px`;
      const top = Math.min(...rects.map((rect) => rect.y));
      const bottom = Math.max(...rects.map((rect) => rect.y + rect.height));
      root.scrollBy({ top: top - Math.max(16, (available - (bottom - top)) / 2), behavior: "instant" });
      position();
    }

    function showStep() {
      const ja = getLanguage() === "ja";
      const lesson = queue[index];
      const [title, description] = lesson[ja ? "ja" : "en"];
      find(".spotlight-kicker").textContent = ja ? "冒険の手引き" : "DUNGEON GUIDE";
      find(".spotlight-counter").textContent = `${index + 1} / ${queue.length}`;
      find("#spotlightTitle").textContent = title;
      find("#spotlightText").textContent = description;
      copy.scrollTop = 0;
      skip.textContent = ja ? "スキップ" : "Skip";
      next.textContent = index === queue.length - 1 ? (ja ? "プレイする" : "Let’s play") : (ja ? "次へ" : "Next");
      find(".spotlight-note").textContent = ja ? "「ギミック説明」からいつでも見直せます" : "Revisit anytime with “Mechanic guide”.";
      alignTarget();
      next.focus({ preventScroll: true });
    }

    next.addEventListener("click", () => {
      progress.remember([queue[index].id]);
      if (++index === queue.length) close(); else showStep();
    });
    skip.addEventListener("click", dismiss);

    return {
      get active() { return !overlay.hidden; },
      close,
      show(nextStage, replay = false) {
        close();
        if (!canShow() || !nextStage?.boardSize) return;
        queue = selectLessons(nextStage, progress.read(), replay);
        if (!queue.length) return;
        stage = nextStage;
        index = 0;
        previousFocus = document.activeElement;
        previousInert = main.inert;
        previousScroll = { left: root.scrollX, top: root.scrollY };
        main.inert = true;
        main.classList.add("spotlight-is-open");
        document.body.append(spacer);
        overlay.hidden = false;
        root.addEventListener("keydown", onKey, true);
        root.addEventListener("resize", alignTarget);
        root.addEventListener("scroll", schedulePosition, { passive: true });
        root.visualViewport?.addEventListener("resize", alignTarget);
        showStep();
      },
    };
  }

  const api = { selectLessons, targetsFor, createProgress, cellRect, create, STORAGE_KEY };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DungeonSpotlight = api;
})(globalThis);
