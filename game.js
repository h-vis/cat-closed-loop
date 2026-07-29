const CONFIG = {
  gridSize: 10,
  cellSize: 48,
  canvasSize: 480,
  objectRadius: 14,
  randomStageChoiceCount: 6,
  randomStageHistorySize: 12,
  randomFamilyHistorySize: 4,
  randomStyleHistorySize: 3,
  spaceFillPalette: [
    "rgba(33, 113, 196, 0.18)",
    "rgba(46, 160, 67, 0.18)",
    "rgba(217, 119, 6, 0.18)",
    "rgba(190, 24, 93, 0.16)",
    "rgba(8, 145, 178, 0.17)",
    "rgba(124, 58, 237, 0.16)",
  ],
  wallBlockFillStyle: "#586274",
  wallBlockStrokeStyle: "#2a3140",
  loopCellFillStyle: "rgba(22, 94, 171, 0.92)",
  loopCellStrokeStyle: "#0f447e",
  drawingCellFillStyle: "rgba(22, 94, 171, 0.56)",
  drawingCellStrokeStyle: "rgba(15, 68, 126, 0.78)",
  gridLineStyle: "rgba(39, 61, 87, 0.16)",
  overlayFillStyle: "rgba(12, 25, 42, 0.62)",
};

const STATUS = {
  idle: "待機中",
  drawing: "描画中",
  movable: "移動可能",
  outsideLoop: "現在の空間では移動不可",
  gameOver: "ゲームオーバー",
  clear: "クリア",
  makerEdit: "メーカー編集中",
};

const GAME_MODE = {
  random: "random",
  tutorial: "tutorial",
  maker: "maker",
};

const BASE_STAGE = {
  playerStart: { x: 1, y: 1 },
  keyPosition: { x: 3, y: 2 },
  goalPosition: { x: 8, y: 8 },
};

const MAKER_LIMITS = {
  minSize: 6,
  maxSize: 14,
};

const MAKER_TOOL = {
  player: "player",
  key: "key",
  goal: "goal",
  bomb: "bomb",
  disarm: "disarm",
  wall: "wall",
  erase: "erase",
};

const MAKER_TOOL_LABELS = {
  [MAKER_TOOL.wall]: "螢ｹ繝悶Ο繝・け",
  [MAKER_TOOL.player]: "プレイヤー",
  [MAKER_TOOL.key]: "鍵",
  [MAKER_TOOL.goal]: "ゴール",
  [MAKER_TOOL.bomb]: "爆弾",
  [MAKER_TOOL.disarm]: "ニッパー",
  [MAKER_TOOL.erase]: "消しゴム",
};

const CONTROL_HINT_TEXT =
  "操作: マウスドラッグでマスを塗って閉ループを作り、矢印キーまたはWASDで移動します。Rでリセット、Shift+Rでランダム再生成です。";

const RANDOM_STAGE_INSTRUCTION_TEXT =
  "ランダムモードです。オブジェクトのあるマスを避けて閉ループを作り、プレイヤーと同じ空間に爆弾を入れないように鍵とゴールをつなぎます。プレイヤーのいない空間では、爆弾とニッパーが同数で対消滅します。"
  + CONTROL_HINT_TEXT;

const MAKER_EDIT_INSTRUCTION_TEXT =
  "ステージメーカーの編集モードです。下の配置ツールを選び、キャンバスをクリックしてオブジェクトを置きます。プレイヤー・鍵・ゴールは1つずつ、爆弾・ニッパーは複数置けます。サイズを変えたら「サイズを適用」、できたら「テストプレイ開始」で動作確認できます。";

const MAKER_TEST_INSTRUCTION_TEXT =
  "ステージメーカーのテストプレイ中です。通常ルールでループを描いて遊べます。Rでこの配置を最初から試し直し、「編集に戻る」で配置の調整へ戻れます。";

// ルールを一つずつ確認できるチュートリアルステージ
const TUTORIAL_STAGES = [
  {
    title: "閉ループの基本",
    tutorialText:
      "まずは閉ループを1本作る基本です。塗ったマスそのものは壁なので、線の上は空間に含まれません。",
    designNote:
      "プレイヤーと鍵を同じ空間に入れてから、新しいループでプレイヤーとゴールも同じ空間にしてみましょう。",
    playerStart: { x: 1, y: 1 },
    keyPosition: { x: 3, y: 1 },
    goalPosition: { x: 7, y: 2 },
    bombs: [],
    disarmItems: [],
  },
  {
    title: "鍵は歩かず取得",
    tutorialText:
      "鍵は同じ空間に入った瞬間に取得されます。鍵のマスまで歩く必要はありません。",
    designNote:
      "鍵を直接踏まずに取得し、そのあと別のループでゴールとも同じ空間を作ってみてください。",
    playerStart: { x: 1, y: 2 },
    keyPosition: { x: 4, y: 3 },
    goalPosition: { x: 8, y: 1 },
    bombs: [],
    disarmItems: [],
  },
  {
    title: "外側の空間も有効",
    tutorialText:
      "ループの外側も、完全に分断されていなければ1つの空間として扱われます。プレイヤーもゴールも囲まない小さなループでも判定が働きます。",
    designNote:
      "このステージは鍵取得済みです。プレイヤーとゴールから離れた場所に小さなループを作り、外側空間でつながることを確かめてみましょう。",
    playerStart: { x: 2, y: 2 },
    keyPosition: { x: 1, y: 1 },
    goalPosition: { x: 8, y: 8 },
    bombs: [],
    disarmItems: [],
    keyInitiallyCollected: true,
  },
  {
    title: "爆弾は即爆発",
    tutorialText:
      "プレイヤーと同じ空間に爆弾が入ると、その瞬間にゲームオーバーです。同数のニッパーがあっても、プレイヤー空間では助かりません。",
    designNote:
      "このステージは鍵取得済みです。爆弾だけを別空間に閉じ込め、プレイヤーは外側空間でゴールとつながる形を狙ってみましょう。",
    playerStart: { x: 1, y: 1 },
    keyPosition: { x: 1, y: 1 },
    goalPosition: { x: 8, y: 8 },
    bombs: [{ x: 5, y: 4 }],
    disarmItems: [{ x: 2, y: 7 }],
    keyInitiallyCollected: true,
  },
  {
    title: "同数で対消滅",
    tutorialText:
      "プレイヤーを含まない空間では、爆弾とニッパーが同数だけ入ったときに対消滅します。数が合わないと残ります。",
    designNote:
      "このステージは鍵取得済みです。爆弾2個とニッパー2個をまとめて別空間へ入れて消し、そのあとゴールと同じ空間を作ってみましょう。",
    playerStart: { x: 1, y: 1 },
    keyPosition: { x: 1, y: 1 },
    goalPosition: { x: 6, y: 5 },
    bombs: [
      { x: 4, y: 3 },
      { x: 7, y: 3 },
    ],
    disarmItems: [
      { x: 4, y: 7 },
      { x: 7, y: 7 },
    ],
    keyInitiallyCollected: true,
  },
  {
    title: "総合演習",
    tutorialText:
      "最後は総合問題です。鍵取得、外側空間、爆弾の危険、ニッパーの対消滅に加えて、シールドで危険空間へ一度だけ踏み込む選択も考えます。",
    designNote:
      "まず安全な空間で鍵を取り、その後に爆弾を孤立させるか、シールドで一度だけ危険空間へ踏み込むか、プレイヤーのいない空間でニッパーと同数にそろえるかを考えてみましょう。",
    playerStart: { x: 2, y: 1 },
    keyPosition: { x: 1, y: 5 },
    goalPosition: { x: 8, y: 8 },
    bombs: [
      { x: 5, y: 2 },
      { x: 7, y: 6 },
    ],
    disarmItems: [
      { x: 2, y: 7 },
      { x: 6, y: 4 },
    ],
  },
];

// 近接しすぎないよう、爆弾とニッパーを離したベースパターン
TUTORIAL_STAGES.length -= 1;

const STAGE_PATTERNS = [
  {
    label: "遠隔分断",
    playerStart: { x: 1, y: 1 },
    keyPosition: { x: 3, y: 2 },
    goalPosition: { x: 8, y: 8 },
    bombs: [
      { x: 3, y: 5 },
      { x: 6, y: 3 },
      { x: 7, y: 7 },
    ],
    disarmItems: [
      { x: 1, y: 7 },
      { x: 8, y: 4 },
    ],
    wallBlocks: [
      { x: 5, y: 1 },
      { x: 5, y: 2 },
      { x: 5, y: 3 },
    ],
    plannedLoops: 3,
  },
  {
    label: "蛇行回収",
    playerStart: { x: 1, y: 2 },
    keyPosition: { x: 4, y: 1 },
    goalPosition: { x: 8, y: 7 },
    bombs: [
      { x: 2, y: 6 },
      { x: 5, y: 4 },
      { x: 7, y: 2 },
    ],
    disarmItems: [
      { x: 4, y: 8 },
      { x: 8, y: 5 },
    ],
    wallBlocks: [
      { x: 3, y: 3 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ],
    plannedLoops: 3,
  },
  {
    label: "対角圧縮",
    playerStart: { x: 2, y: 1 },
    keyPosition: { x: 1, y: 4 },
    goalPosition: { x: 7, y: 8 },
    bombs: [
      { x: 4, y: 2 },
      { x: 6, y: 5 },
      { x: 2, y: 7 },
    ],
    disarmItems: [
      { x: 8, y: 3 },
      { x: 4, y: 8 },
    ],
    wallBlocks: [
      { x: 6, y: 1 },
      { x: 6, y: 2 },
      { x: 6, y: 3 },
    ],
    plannedLoops: 3,
  },
  {
    label: "外周またぎ",
    playerStart: { x: 1, y: 3 },
    keyPosition: { x: 3, y: 1 },
    goalPosition: { x: 8, y: 8 },
    bombs: [
      { x: 5, y: 2 },
      { x: 7, y: 5 },
      { x: 3, y: 7 },
    ],
    disarmItems: [
      { x: 1, y: 8 },
      { x: 8, y: 3 },
    ],
    wallBlocks: [
      { x: 4, y: 4 },
      { x: 5, y: 4 },
      { x: 6, y: 4 },
    ],
    plannedLoops: 2,
  },
  {
    label: "中央横断",
    playerStart: { x: 2, y: 2 },
    keyPosition: { x: 1, y: 5 },
    goalPosition: { x: 8, y: 7 },
    bombs: [
      { x: 3, y: 3 },
      { x: 6, y: 4 },
      { x: 7, y: 7 },
    ],
    disarmItems: [
      { x: 1, y: 1 },
      { x: 4, y: 8 },
    ],
    wallBlocks: [
      { x: 5, y: 5 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
    ],
    plannedLoops: 3,
  },
  {
    label: "三隅掃討",
    playerStart: { x: 1, y: 1 },
    keyPosition: { x: 5, y: 1 },
    goalPosition: { x: 8, y: 6 },
    bombs: [
      { x: 2, y: 5 },
      { x: 6, y: 2 },
      { x: 8, y: 8 },
    ],
    disarmItems: [
      { x: 1, y: 8 },
      { x: 5, y: 6 },
    ],
    wallBlocks: [
      { x: 3, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
    ],
    plannedLoops: 3,
  },
];

const STAGE_TRANSFORMS = [
  { label: "", map: (position) => ({ x: position.x, y: position.y }) },
  {
    label: "左右反転",
    map: (position) => ({ x: CONFIG.gridSize - 1 - position.x, y: position.y }),
  },
  {
    label: "上下反転",
    map: (position) => ({ x: position.x, y: CONFIG.gridSize - 1 - position.y }),
  },
  {
    label: "180度回転",
    map: (position) => ({
      x: CONFIG.gridSize - 1 - position.x,
      y: CONFIG.gridSize - 1 - position.y,
    }),
  },
  {
    label: "90度回転",
    map: (position) => ({
      x: CONFIG.gridSize - 1 - position.y,
      y: position.x,
    }),
  },
  {
    label: "270度回転",
    map: (position) => ({
      x: position.y,
      y: CONFIG.gridSize - 1 - position.x,
    }),
  },
  {
    label: "主対角反転",
    map: (position) => ({ x: position.y, y: position.x }),
  },
  {
    label: "副対角反転",
    map: (position) => ({
      x: CONFIG.gridSize - 1 - position.y,
      y: CONFIG.gridSize - 1 - position.x,
    }),
  },
];

// 同じ配置でも残す爆弾とニッパーを変え、勝ち筋の型を増やす
const STAGE_VARIANTS = [
  {
    id: "mixed",
    label: "混成戦",
    style: "mixed",
    strategyNote: "封鎖と対消滅の両方を見比べる",
    plannedLoopOffset: 0,
  },
  {
    id: "cleanup",
    label: "対消滅型",
    style: "cleanup",
    strategyNote: "爆弾とニッパーを同数でまとめて消す",
    plannedLoopOffset: 0,
  },
  {
    id: "lockdown",
    label: "封鎖型",
    style: "isolation",
    strategyNote: "爆弾を消せないので別空間へ封じる",
    plannedLoopOffset: -1,
  },
  {
    id: "choice",
    label: "分岐型",
    style: "choice",
    strategyNote: "相殺するか封鎖するかを選ぶ",
    plannedLoopOffset: -1,
  },
  {
    id: "breach",
    label: "突破型",
    style: "shield",
    strategyNote: "シールドで危険空間を一度だけ踏み抜く",
    plannedLoopOffset: 0,
  },
];

function clampValue(value, minValue, maxValue) {
  return Math.min(Math.max(value, minValue), maxValue);
}

function createBoardSize(width = CONFIG.gridSize, height = CONFIG.gridSize) {
  return { width, height };
}

function cloneBoardSize(boardSize) {
  return createBoardSize(boardSize.width, boardSize.height);
}

function normalizeBoardSize(boardSize) {
  return createBoardSize(
    clampValue(Number(boardSize.width) || CONFIG.gridSize, MAKER_LIMITS.minSize, MAKER_LIMITS.maxSize),
    clampValue(Number(boardSize.height) || CONFIG.gridSize, MAKER_LIMITS.minSize, MAKER_LIMITS.maxSize)
  );
}

let activeBoardSize = createBoardSize();

function getStageBoardSize(stage) {
  const boardSize = stage?.boardSize ?? activeBoardSize;
  return createBoardSize(
    boardSize.width ?? CONFIG.gridSize,
    boardSize.height ?? CONFIG.gridSize
  );
}

function getBoardPixelWidth(boardSize = activeBoardSize) {
  return boardSize.width * CONFIG.cellSize;
}

function getBoardPixelHeight(boardSize = activeBoardSize) {
  return boardSize.height * CONFIG.cellSize;
}

function getCellKey(position) {
  return `${position.x},${position.y}`;
}

function positionsMatch(positionA, positionB) {
  return positionA.x === positionB.x && positionA.y === positionB.y;
}

function clonePosition(position) {
  return { x: position.x, y: position.y };
}

function clonePositions(positions) {
  return positions.map(clonePosition);
}

function isInsideMap(position, boardSize = activeBoardSize) {
  return (
    position.x >= 0 &&
    position.x < boardSize.width &&
    position.y >= 0 &&
    position.y < boardSize.height
  );
}

function isBorderCell(position, boardSize = activeBoardSize) {
  return (
    position.x === 0 ||
    position.y === 0 ||
    position.x === boardSize.width - 1 ||
    position.y === boardSize.height - 1
  );
}

function getCellCenter(gridPosition) {
  return {
    x: gridPosition.x * CONFIG.cellSize + CONFIG.cellSize / 2,
    y: gridPosition.y * CONFIG.cellSize + CONFIG.cellSize / 2,
  };
}

function getCellNeighbors(position, boardSize = activeBoardSize) {
  return [
    { x: position.x + 1, y: position.y },
    { x: position.x - 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x, y: position.y - 1 },
  ].filter((neighbor) => isInsideMap(neighbor, boardSize));
}

function getUniqueCells(cells) {
  const seenKeys = new Set();
  const uniqueCells = [];

  for (const cell of cells) {
    const key = getCellKey(cell);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueCells.push(clonePosition(cell));
    }
  }

  return uniqueCells;
}

function randomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

function shuffleArray(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    const temporary = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = temporary;
  }

  return shuffled;
}

function chooseRandomItem(items) {
  return items[randomInt(items.length)];
}

function getManhattanDistance(positionA, positionB) {
  return (
    Math.abs(positionA.x - positionB.x) +
    Math.abs(positionA.y - positionB.y)
  );
}

function getMinimumDistanceToPositions(position, positions) {
  let minimumDistance = Number.POSITIVE_INFINITY;

  for (const target of positions) {
    minimumDistance = Math.min(
      minimumDistance,
      getManhattanDistance(position, target)
    );
  }

  return minimumDistance;
}

function getAverageNearestDistance(sources, targets) {
  if (sources.length === 0 || targets.length === 0) {
    return 0;
  }

  let totalDistance = 0;

  for (const source of sources) {
    totalDistance += getMinimumDistanceToPositions(source, targets);
  }

  return totalDistance / sources.length;
}

function getAveragePairDistance(positions) {
  if (positions.length < 2) {
    return 0;
  }

  let totalDistance = 0;
  let pairCount = 0;

  for (let index = 0; index < positions.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < positions.length; nextIndex += 1) {
      totalDistance += getManhattanDistance(positions[index], positions[nextIndex]);
      pairCount += 1;
    }
  }

  return pairCount === 0 ? 0 : totalDistance / pairCount;
}

function getMinimumPairDistance(positionsA, positionsB) {
  if (positionsA.length === 0 || positionsB.length === 0) {
    return 0;
  }

  let minimumDistance = Number.POSITIVE_INFINITY;

  for (const positionA of positionsA) {
    for (const positionB of positionsB) {
      minimumDistance = Math.min(
        minimumDistance,
        getManhattanDistance(positionA, positionB)
      );
    }
  }

  return minimumDistance;
}

function compareGridPositions(positionA, positionB) {
  if (positionA.y !== positionB.y) {
    return positionA.y - positionB.y;
  }

  return positionA.x - positionB.x;
}

function getStageFamilyLabel(label) {
  return label.split(" / ")[0];
}

function getRouteAnchorPositions(layout) {
  return [layout.playerStart, layout.keyPosition, layout.goalPosition];
}

function sortPositionsByTargets(positions, targets, descending = false) {
  const direction = descending ? -1 : 1;

  return [...positions].sort((positionA, positionB) => {
    const distanceA = getMinimumDistanceToPositions(positionA, targets);
    const distanceB = getMinimumDistanceToPositions(positionB, targets);

    if (distanceA !== distanceB) {
      return (distanceA - distanceB) * direction;
    }

    return compareGridPositions(positionA, positionB);
  });
}

function takeNearestBombsToDisarms(layout, count) {
  return sortPositionsByTargets(layout.bombs, layout.disarmItems).slice(0, count);
}

function takeRoutePressureBombs(layout, count) {
  return sortPositionsByTargets(layout.bombs, getRouteAnchorPositions(layout)).slice(0, count);
}

function takeNearestDisarmsToBombs(layout, bombs, count) {
  if (count <= 0 || bombs.length === 0) {
    return [];
  }

  return sortPositionsByTargets(layout.disarmItems, bombs).slice(0, count);
}

function takeFarthestDisarmsFromBombs(layout, bombs, count) {
  if (count <= 0 || bombs.length === 0) {
    return [];
  }

  return sortPositionsByTargets(layout.disarmItems, bombs, true).slice(0, count);
}

function takeNearestDisarmsToRoute(layout, count) {
  return sortPositionsByTargets(
    layout.disarmItems,
    getRouteAnchorPositions(layout)
  ).slice(0, count);
}

function buildStageLayoutKey(layout) {
  const toKeyList = (positions) =>
    positions
      .map(getCellKey)
      .sort()
      .join("|");

  return [
    `${getStageBoardSize(layout).width}x${getStageBoardSize(layout).height}`,
    getCellKey(layout.playerStart),
    getCellKey(layout.keyPosition),
    getCellKey(layout.goalPosition),
    toKeyList(layout.bombs),
    toKeyList(layout.disarmItems),
    toKeyList(layout.wallBlocks ?? []),
    toKeyList(layout.shields ?? []),
  ].join(":");
}

function transformPositions(positions, transform) {
  return positions.map((position) => transform.map(position));
}

function isStageLayoutValid(layout) {
  const boardSize = getStageBoardSize(layout);
  const allPositions = [
    layout.playerStart,
    layout.keyPosition,
    layout.goalPosition,
    ...layout.bombs,
    ...layout.disarmItems,
    ...(layout.wallBlocks ?? []),
    ...(layout.shields ?? []),
  ];

  if (!allPositions.every((position) => isInsideMap(position, boardSize))) {
    return false;
  }

  const positionKeys = allPositions.map(getCellKey);
  return new Set(positionKeys).size === positionKeys.length;
}

function createTransformedStageLayout(pattern, transform) {
  const label = transform.label
    ? `${pattern.label} / ${transform.label}`
    : pattern.label;

  return {
    label,
    familyLabel: pattern.label,
    transformLabel: transform.label || "原型",
    boardSize: createBoardSize(),
    playerStart: transform.map(pattern.playerStart),
    keyPosition: transform.map(pattern.keyPosition),
    goalPosition: transform.map(pattern.goalPosition),
    bombs: transformPositions(pattern.bombs, transform),
    disarmItems: transformPositions(pattern.disarmItems, transform),
    wallBlocks: transformPositions(pattern.wallBlocks ?? [], transform),
    shields: [],
    plannedLoops: pattern.plannedLoops,
  };
}

function createStageVariantLayout(layout, variant) {
  let bombs = clonePositions(layout.bombs);
  let disarmItems = clonePositions(layout.disarmItems);
  let shields = [];

  if (variant.id === "cleanup") {
    const keepCount = Math.min(layout.bombs.length, layout.disarmItems.length);
    bombs = takeNearestBombsToDisarms(layout, keepCount);
    disarmItems = takeNearestDisarmsToBombs(layout, bombs, keepCount);
  } else if (variant.id === "lockdown") {
    bombs = takeRoutePressureBombs(
      layout,
      Math.max(1, Math.ceil(layout.bombs.length / 2))
    );
    disarmItems = [];
  } else if (variant.id === "choice") {
    bombs = takeRoutePressureBombs(layout, 1);
    disarmItems = takeFarthestDisarmsFromBombs(layout, bombs, 1);
  } else if (variant.id === "breach") {
    bombs = takeRoutePressureBombs(layout, 2);
    disarmItems = takeFarthestDisarmsFromBombs(layout, bombs, 1);
    shields = takeNearestDisarmsToRoute(layout, 1).filter(
      (shield) => !disarmItems.some((item) => positionsMatch(item, shield))
    );

    if (shields.length === 0) {
      shields = layout.disarmItems.filter(
        (shield) => !disarmItems.some((item) => positionsMatch(item, shield))
      ).slice(0, 1);
    }
  }

  return {
    ...layout,
    label: `${layout.label} / ${variant.label}`,
    variantId: variant.id,
    variantLabel: variant.label,
    solutionStyle: variant.style,
    strategyNote: variant.strategyNote,
    bombs: clonePositions(getUniqueCells(bombs)),
    disarmItems: clonePositions(getUniqueCells(disarmItems)),
    shields: clonePositions(getUniqueCells(shields)),
    plannedLoops: Math.max(1, layout.plannedLoops + variant.plannedLoopOffset),
  };
}

function createStageVariants(layout) {
  return STAGE_VARIANTS
    .filter((variant) => variant.id !== "breach")
    .map((variant) => createStageVariantLayout(layout, variant))
    .filter((variantLayout) => {
      if (variantLayout.bombs.length === 0) {
        return false;
      }

      return true;
    });
}

function scoreStageLayout(layout) {
  const minToolDistance = getMinimumPairDistance(
    layout.bombs,
    layout.disarmItems
  );
  const avgToolDistance = getAverageNearestDistance(
    layout.disarmItems,
    layout.bombs
  );
  const bombSpread = getAveragePairDistance(layout.bombs);
  const routeDistance =
    getManhattanDistance(layout.playerStart, layout.keyPosition) +
    getManhattanDistance(layout.keyPosition, layout.goalPosition);

  return (
    minToolDistance * 120 +
    avgToolDistance * 35 +
    bombSpread * 18 +
    routeDistance * 8
  );
}

function buildStageNote(layout) {
  const minimumToolDistance = layout.disarmItems.length > 0
    ? getMinimumPairDistance(layout.bombs, layout.disarmItems)
    : "なし";

  return [
    `ランダム生成: ${layout.label}`,
    `系統:${layout.familyLabel ?? getStageFamilyLabel(layout.label)}`,
    `開始(${layout.playerStart.x},${layout.playerStart.y})`,
    `鍵(${layout.keyPosition.x},${layout.keyPosition.y})`,
    `ゴール(${layout.goalPosition.x},${layout.goalPosition.y})`,
    `爆弾${layout.bombs.length}個`,
    `ニッパー${layout.disarmItems.length}個`,
    `最短距離${minimumToolDistance}`,
    `狙い:${layout.strategyNote ?? "状況判断"}`,
    `目安: ${layout.plannedLoops}ループ前後`,
  ].join(" / ");
}

function isStageToolSpacingValid(layout) {
  if (layout.bombs.length === 0 || layout.disarmItems.length === 0) {
    return true;
  }

  return getMinimumPairDistance(layout.bombs, layout.disarmItems) >= 3;
}

function createStageLibrary() {
  const layoutsByKey = new Map();

  for (const pattern of STAGE_PATTERNS) {
    for (const transform of STAGE_TRANSFORMS) {
      const transformedLayout = createTransformedStageLayout(pattern, transform);

      if (!isStageLayoutValid(transformedLayout)) {
        continue;
      }

      for (const layout of createStageVariants(transformedLayout)) {
        if (!isStageLayoutValid(layout) || !isStageToolSpacingValid(layout)) {
          continue;
        }

        layoutsByKey.set(buildStageLayoutKey(layout), layout);
      }
    }
  }

  return [...layoutsByKey.values()];
}

const STAGE_LIBRARY = createStageLibrary();

let recentRandomStageKeys = [];
let recentRandomFamilies = [];
let recentRandomStyles = [];

function rememberRecentValue(history, value, limit) {
  history.push(value);

  while (history.length > limit) {
    history.shift();
  }
}

function getHistoryScore(value, history, freshBonus, recentPenalty, decayPerTurn) {
  const index = history.lastIndexOf(value);

  if (index === -1) {
    return freshBonus;
  }

  const turnsAgo = history.length - index;
  return -Math.max(0, recentPenalty - (turnsAgo - 1) * decayPerTurn);
}

function scoreRandomStageCandidate(layout) {
  const stageKey = buildStageLayoutKey(layout);
  const familyLabel = layout.familyLabel ?? getStageFamilyLabel(layout.label);
  const solutionStyle = layout.solutionStyle ?? "mixed";

  return (
    scoreStageLayout(layout) * 0.04 +
    getHistoryScore(
      stageKey,
      recentRandomStageKeys,
      220,
      320,
      36
    ) +
    getHistoryScore(
      familyLabel,
      recentRandomFamilies,
      90,
      180,
      48
    ) +
    getHistoryScore(
      solutionStyle,
      recentRandomStyles,
      70,
      140,
      44
    )
  );
}

function buildRandomStagePool(scoredLayouts) {
  const pool = [];
  const poolStageKeys = new Set();
  const coveredStyles = new Set();
  const coveredFamilies = new Set();

  function tryAddCandidate(candidate) {
    const stageKey = buildStageLayoutKey(candidate.layout);

    if (poolStageKeys.has(stageKey)) {
      return false;
    }

    pool.push(candidate);
    poolStageKeys.add(stageKey);
    coveredStyles.add(candidate.layout.solutionStyle ?? "mixed");
    coveredFamilies.add(
      candidate.layout.familyLabel ?? getStageFamilyLabel(candidate.layout.label)
    );
    return true;
  }

  for (const candidate of scoredLayouts) {
    if (pool.length >= CONFIG.randomStageChoiceCount) {
      break;
    }

    const style = candidate.layout.solutionStyle ?? "mixed";
    if (!coveredStyles.has(style)) {
      tryAddCandidate(candidate);
    }
  }

  for (const candidate of scoredLayouts) {
    if (pool.length >= CONFIG.randomStageChoiceCount) {
      break;
    }

    const family = candidate.layout.familyLabel ?? getStageFamilyLabel(candidate.layout.label);
    if (!coveredFamilies.has(family)) {
      tryAddCandidate(candidate);
    }
  }

  for (const candidate of scoredLayouts) {
    if (pool.length >= CONFIG.randomStageChoiceCount) {
      break;
    }

    tryAddCandidate(candidate);
  }

  return pool;
}

function createRandomDesignedStage() {
  const layouts = STAGE_LIBRARY.length > 0
    ? STAGE_LIBRARY
    : [
        {
          ...BASE_STAGE,
          label: "予備ステージ",
          bombs: [
            { x: 3, y: 5 },
            { x: 6, y: 3 },
            { x: 7, y: 7 },
          ],
          disarmItems: [
            { x: 1, y: 7 },
            { x: 8, y: 4 },
          ],
          wallBlocks: [
            { x: 5, y: 1 },
            { x: 5, y: 2 },
            { x: 5, y: 3 },
          ],
          shields: [],
          plannedLoops: 3,
          familyLabel: "予備ステージ",
          variantLabel: "混成戦",
          solutionStyle: "mixed",
          strategyNote: "封鎖と対消滅の両方を見比べる",
        },
      ];

  const scoredLayouts = shuffleArray(layouts)
    .map((layout) => ({
      layout,
      score: scoreRandomStageCandidate(layout),
    }))
    .sort((layoutA, layoutB) => layoutB.score - layoutA.score);

  const pool = buildRandomStagePool(scoredLayouts);
  const layout = chooseRandomItem(pool).layout;
  const stageKey = buildStageLayoutKey(layout);

  rememberRecentValue(
    recentRandomStageKeys,
    stageKey,
    CONFIG.randomStageHistorySize
  );
  rememberRecentValue(
    recentRandomFamilies,
    layout.familyLabel ?? getStageFamilyLabel(layout.label),
    CONFIG.randomFamilyHistorySize
  );
  rememberRecentValue(
    recentRandomStyles,
    layout.solutionStyle ?? "mixed",
    CONFIG.randomStyleHistorySize
  );

  return {
    boardSize: createBoardSize(),
    playerStart: clonePosition(layout.playerStart ?? BASE_STAGE.playerStart),
    keyPosition: clonePosition(layout.keyPosition ?? BASE_STAGE.keyPosition),
    goalPosition: clonePosition(layout.goalPosition ?? BASE_STAGE.goalPosition),
    bombs: clonePositions(layout.bombs),
    disarmItems: clonePositions(layout.disarmItems),
    wallBlocks: clonePositions(layout.wallBlocks ?? []),
    shields: clonePositions(layout.shields ?? []),
    designLabel: layout.label,
    designNote: buildStageNote(layout),
    instructionText: RANDOM_STAGE_INSTRUCTION_TEXT,
    keyInitiallyCollected: false,
    mode: GAME_MODE.random,
    tutorialIndex: null,
  };
}

function createTutorialStage(index) {
  const normalizedIndex = clampValue(index, 0, TUTORIAL_STAGES.length - 1);
  const definition = TUTORIAL_STAGES[normalizedIndex];

  return {
    boardSize: createBoardSize(),
    playerStart: clonePosition(definition.playerStart),
    keyPosition: clonePosition(definition.keyPosition),
    goalPosition: clonePosition(definition.goalPosition),
    bombs: clonePositions(definition.bombs),
    disarmItems: clonePositions(definition.disarmItems),
    wallBlocks: clonePositions(definition.wallBlocks ?? []),
    shields: clonePositions(definition.shields ?? []),
    designLabel: definition.title,
    designNote: definition.designNote,
    instructionText: `${definition.tutorialText} ${CONTROL_HINT_TEXT}`,
    keyInitiallyCollected: Boolean(definition.keyInitiallyCollected),
    mode: GAME_MODE.tutorial,
    tutorialIndex: normalizedIndex,
  };
}

function cloneStageDefinition(stage) {
  return {
    ...stage,
    boardSize: cloneBoardSize(getStageBoardSize(stage)),
    playerStart: clonePosition(stage.playerStart),
    keyPosition: clonePosition(stage.keyPosition),
    goalPosition: clonePosition(stage.goalPosition),
    bombs: clonePositions(stage.bombs),
    disarmItems: clonePositions(stage.disarmItems),
    wallBlocks: clonePositions(stage.wallBlocks ?? []),
    shields: clonePositions(stage.shields ?? []),
  };
}

function createMakerStage(boardSize = createBoardSize()) {
  const normalizedBoardSize = normalizeBoardSize(boardSize);

  return {
    boardSize: normalizedBoardSize,
    playerStart: { x: 1, y: 1 },
    keyPosition: {
      x: Math.min(normalizedBoardSize.width - 3, 3),
      y: Math.min(normalizedBoardSize.height - 3, 2),
    },
    goalPosition: {
      x: Math.max(0, normalizedBoardSize.width - 2),
      y: Math.max(0, normalizedBoardSize.height - 2),
    },
    bombs: [],
    disarmItems: [],
    wallBlocks: [],
    shields: [],
    designLabel: "ステージメーカー",
    designNote: "自由配置のステージを編集できます。",
    instructionText: MAKER_EDIT_INSTRUCTION_TEXT,
    keyInitiallyCollected: false,
    mode: GAME_MODE.maker,
    tutorialIndex: null,
    makerEditing: true,
    selectedMakerTool: MAKER_TOOL.player,
    makerWidthInput: normalizedBoardSize.width,
    makerHeightInput: normalizedBoardSize.height,
  };
}

function findFirstAvailableCell(boardSize, usedKeys) {
  for (let y = 0; y < boardSize.height; y += 1) {
    for (let x = 0; x < boardSize.width; x += 1) {
      const cell = { x, y };
      if (!usedKeys.has(getCellKey(cell))) {
        return cell;
      }
    }
  }

  return { x: 0, y: 0 };
}

function resolveUniquePosition(position, boardSize, usedKeys, fallbackPosition) {
  const candidate = {
    x: clampValue(position.x, 0, boardSize.width - 1),
    y: clampValue(position.y, 0, boardSize.height - 1),
  };
  const candidateKey = getCellKey(candidate);

  if (!usedKeys.has(candidateKey)) {
    usedKeys.add(candidateKey);
    return candidate;
  }

  const fallback = {
    x: clampValue(fallbackPosition.x, 0, boardSize.width - 1),
    y: clampValue(fallbackPosition.y, 0, boardSize.height - 1),
  };
  const fallbackKey = getCellKey(fallback);

  if (!usedKeys.has(fallbackKey)) {
    usedKeys.add(fallbackKey);
    return fallback;
  }

  const freeCell = findFirstAvailableCell(boardSize, usedKeys);
  usedKeys.add(getCellKey(freeCell));
  return freeCell;
}

function fitPositionsToBoard(positions, boardSize, usedKeys) {
  const nextPositions = [];

  for (const position of positions) {
    if (!isInsideMap(position, boardSize)) {
      continue;
    }

    const positionKey = getCellKey(position);
    if (usedKeys.has(positionKey)) {
      continue;
    }

    usedKeys.add(positionKey);
    nextPositions.push(clonePosition(position));
  }

  return nextPositions;
}

function resizeMakerStage(stage, boardSize) {
  const normalizedBoardSize = normalizeBoardSize(boardSize);
  const resizedStage = cloneStageDefinition(stage);
  const defaultStage = createMakerStage(normalizedBoardSize);
  const usedKeys = new Set();

  resizedStage.boardSize = normalizedBoardSize;
  resizedStage.playerStart = resolveUniquePosition(
    resizedStage.playerStart,
    normalizedBoardSize,
    usedKeys,
    defaultStage.playerStart
  );
  resizedStage.keyPosition = resolveUniquePosition(
    resizedStage.keyPosition,
    normalizedBoardSize,
    usedKeys,
    defaultStage.keyPosition
  );
  resizedStage.goalPosition = resolveUniquePosition(
    resizedStage.goalPosition,
    normalizedBoardSize,
    usedKeys,
    defaultStage.goalPosition
  );
  resizedStage.bombs = fitPositionsToBoard(
    resizedStage.bombs,
    normalizedBoardSize,
    usedKeys
  );
  resizedStage.disarmItems = fitPositionsToBoard(
    resizedStage.disarmItems,
    normalizedBoardSize,
    usedKeys
  );
  resizedStage.wallBlocks = fitPositionsToBoard(
    resizedStage.wallBlocks ?? [],
    normalizedBoardSize,
    usedKeys
  );
  resizedStage.shields = fitPositionsToBoard(
    resizedStage.shields ?? [],
    normalizedBoardSize,
    usedKeys
  );
  resizedStage.makerWidthInput = normalizedBoardSize.width;
  resizedStage.makerHeightInput = normalizedBoardSize.height;
  resizedStage.makerEditing = true;

  return resizedStage;
}

function removePositionFromCollection(collection, cell) {
  return collection.filter((position) => !positionsMatch(position, cell));
}

function isCollectionContainingCell(collection, cell) {
  return collection.some((position) => positionsMatch(position, cell));
}

function getStageUniqueObjectTypeAtCell(stage, cell) {
  if (positionsMatch(stage.playerStart, cell)) {
    return MAKER_TOOL.player;
  }

  if (positionsMatch(stage.keyPosition, cell)) {
    return MAKER_TOOL.key;
  }

  if (positionsMatch(stage.goalPosition, cell)) {
    return MAKER_TOOL.goal;
  }

  return null;
}

function getMakerToolHint(tool) {
  const hints = {
    [MAKER_TOOL.player]: "プレイヤーを置きます。1つだけ存在でき、クリックしたマスへ移動します。",
    [MAKER_TOOL.key]: "鍵を置きます。1つだけ存在でき、プレイヤーと同じ空間に入ると取得されます。",
    [MAKER_TOOL.goal]: "ゴールを置きます。1つだけ存在でき、鍵取得後に同じ空間へ入るとクリアです。",
    [MAKER_TOOL.bomb]: "爆弾を置くか外します。プレイヤー空間に入ると即爆発します。",
    [MAKER_TOOL.disarm]: "ニッパーを置くか外します。プレイヤーのいない空間で爆弾と同数なら相殺します。",
    [MAKER_TOOL.wall]: "壁ブロックを置くか外します。描画したループに接続したときだけ、壁の一部として機能します。",
    [MAKER_TOOL.erase]: "爆弾・ニッパー・壁ブロックを消します。プレイヤー・鍵・ゴールはそれぞれのツールで動かしてください。",
  };

  return hints[tool] ?? "";
}

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const instructionTextElement = document.getElementById("instructionText");
const keyStatusElement = document.getElementById("keyStatus");
const bombStatusElement = document.getElementById("bombStatus");
const disarmStatusElement = document.getElementById("disarmStatus");
const stateStatusElement = document.getElementById("stateStatus");
const stageInfoElement = document.getElementById("stageInfo");
const resetButton = document.getElementById("resetButton");
const clearLoopButton = document.getElementById("clearLoopButton");
const randomModeButton = document.getElementById("randomModeButton");
const tutorialModeButton = document.getElementById("tutorialModeButton");
const makerModeButton = document.getElementById("makerModeButton");
const tutorialButtonRow = document.getElementById("tutorialButtonRow");
const tutorialPrevButton = document.getElementById("tutorialPrevButton");
const tutorialNextButton = document.getElementById("tutorialNextButton");
const makerPanel = document.getElementById("makerPanel");
const makerWidthInput = document.getElementById("makerWidthInput");
const makerHeightInput = document.getElementById("makerHeightInput");
const makerApplySizeButton = document.getElementById("makerApplySizeButton");
const makerResetButton = document.getElementById("makerResetButton");
const makerTestButton = document.getElementById("makerTestButton");
const makerEditButton = document.getElementById("makerEditButton");
const makerHintElement = document.getElementById("makerHint");
const makerToolPlayerButton = document.getElementById("makerToolPlayer");
const makerToolKeyButton = document.getElementById("makerToolKey");
const makerToolGoalButton = document.getElementById("makerToolGoal");
const makerToolBombButton = document.getElementById("makerToolBomb");
const makerToolDisarmButton = document.getElementById("makerToolDisarm");
const makerToolWallButton = document.getElementById("makerToolWall");
const makerToolEraseButton = document.getElementById("makerToolErase");

const makerToolButtons = {
  [MAKER_TOOL.player]: makerToolPlayerButton,
  [MAKER_TOOL.key]: makerToolKeyButton,
  [MAKER_TOOL.goal]: makerToolGoalButton,
  [MAKER_TOOL.bomb]: makerToolBombButton,
  [MAKER_TOOL.disarm]: makerToolDisarmButton,
  [MAKER_TOOL.wall]: makerToolWallButton,
  [MAKER_TOOL.erase]: makerToolEraseButton,
};

function updateCanvasMetrics(stage) {
  activeBoardSize = cloneBoardSize(getStageBoardSize(stage));
  canvas.width = getBoardPixelWidth(activeBoardSize);
  canvas.height = getBoardPixelHeight(activeBoardSize);
}

function createInitialState(stage = createRandomDesignedStage()) {
  const boardSize = getStageBoardSize(stage);

  return {
    mode: stage.mode ?? GAME_MODE.random,
    tutorialIndex: stage.tutorialIndex ?? null,
    stage,
    player: clonePosition(stage.playerStart),
    key: {
      position: clonePosition(stage.keyPosition),
      collected: Boolean(stage.keyInitiallyCollected),
    },
    bombs: clonePositions(stage.bombs),
    disarmItems: clonePositions(stage.disarmItems),
    wallBlocks: clonePositions(stage.wallBlocks ?? []),
    goal: {
      position: clonePosition(stage.goalPosition),
    },
    loop: null,
    drawing: {
      active: false,
      cells: [],
    },
    playerSpaceId: null,
    playerInsideLoop: false,
    goalInsideLoop: false,
    goalSharesPlayerSpace: false,
    explodedBombs: [],
    clear: false,
    gameOver: false,
    maker: {
      editing: stage.mode === GAME_MODE.maker ? stage.makerEditing !== false : false,
      selectedTool: stage.selectedMakerTool ?? MAKER_TOOL.player,
      widthInput: stage.makerWidthInput ?? boardSize.width,
      heightInput: stage.makerHeightInput ?? boardSize.height,
    },
    status: STATUS.idle,
  };
}

const initialRandomStage = createRandomDesignedStage();
let rememberedRandomStage = initialRandomStage;
let rememberedTutorialIndex = 0;
let rememberedMakerStage = createMakerStage();

const gameState = createInitialState(initialRandomStage);

function applyStage(stage) {
  if (stage.mode === GAME_MODE.tutorial) {
    rememberedTutorialIndex = stage.tutorialIndex ?? 0;
  } else if (stage.mode === GAME_MODE.maker) {
    rememberedMakerStage = cloneStageDefinition(stage);
  } else {
    rememberedRandomStage = stage;
  }

  Object.assign(gameState, createInitialState(stage));
  updateCanvasMetrics(stage);
  render();
}

function setGameMode(mode) {
  if (mode === gameState.mode) {
    return;
  }

  if (gameState.mode === GAME_MODE.maker) {
    rememberedMakerStage = cloneStageDefinition(gameState.stage);
  }

  if (mode === GAME_MODE.tutorial) {
    applyStage(createTutorialStage(rememberedTutorialIndex));
    return;
  }

  if (mode === GAME_MODE.maker) {
    applyStage(cloneStageDefinition(rememberedMakerStage));
    return;
  }

  applyStage(rememberedRandomStage);
}

function goToTutorialStage(index) {
  applyStage(createTutorialStage(index));
}

function resetGame(regenerateStage = false) {
  if (gameState.mode === GAME_MODE.tutorial) {
    goToTutorialStage(gameState.tutorialIndex ?? rememberedTutorialIndex);
    return;
  }

  if (gameState.mode === GAME_MODE.maker) {
    applyStage(cloneStageDefinition(gameState.stage));
    return;
  }

  const stage = regenerateStage ? createRandomDesignedStage() : rememberedRandomStage;
  applyStage(stage);
}

function isMakerEditing() {
  return gameState.mode === GAME_MODE.maker && gameState.maker.editing;
}

function updateMakerStageInputs(width, height) {
  if (gameState.mode !== GAME_MODE.maker) {
    return;
  }

  gameState.maker.widthInput = width;
  gameState.maker.heightInput = height;
  gameState.stage.makerWidthInput = width;
  gameState.stage.makerHeightInput = height;
}

function setMakerSelectedTool(tool) {
  if (gameState.mode !== GAME_MODE.maker) {
    return;
  }

  gameState.maker.selectedTool = tool;
  gameState.stage.selectedMakerTool = tool;
  render();
}

function getMakerCollectionKey(tool) {
  if (tool === MAKER_TOOL.bomb) {
    return "bombs";
  }

  if (tool === MAKER_TOOL.disarm) {
    return "disarmItems";
  }

  if (tool === MAKER_TOOL.wall) {
    return "wallBlocks";
  }

  return null;
}

function applyMakerStage(stage) {
  const nextStage = cloneStageDefinition(stage);
  nextStage.mode = GAME_MODE.maker;
  applyStage(nextStage);
}

function handleMakerCanvasPlacement(cell) {
  if (!isMakerEditing()) {
    return;
  }

  const stage = cloneStageDefinition(gameState.stage);
  const selectedTool = gameState.maker.selectedTool;
  const uniqueObjectAtCell = getStageUniqueObjectTypeAtCell(stage, cell);
  const collectionKey = getMakerCollectionKey(selectedTool);
  const hadSameCollectionObject = collectionKey
    ? isCollectionContainingCell(stage[collectionKey], cell)
    : false;

  stage.selectedMakerTool = selectedTool;
  stage.makerEditing = true;
  stage.makerWidthInput = gameState.maker.widthInput;
  stage.makerHeightInput = gameState.maker.heightInput;

  if (
    selectedTool === MAKER_TOOL.erase ||
    selectedTool === MAKER_TOOL.bomb ||
    selectedTool === MAKER_TOOL.disarm ||
    selectedTool === MAKER_TOOL.wall
  ) {
    if (uniqueObjectAtCell) {
      return;
    }

    stage.bombs = removePositionFromCollection(stage.bombs, cell);
    stage.disarmItems = removePositionFromCollection(stage.disarmItems, cell);
    stage.wallBlocks = removePositionFromCollection(stage.wallBlocks ?? [], cell);

    if (
      selectedTool !== MAKER_TOOL.erase &&
      collectionKey &&
      !hadSameCollectionObject
    ) {
      stage[collectionKey].push(clonePosition(cell));
    }

    applyMakerStage(stage);
    return;
  }

  if (uniqueObjectAtCell && uniqueObjectAtCell !== selectedTool) {
    return;
  }

  stage.bombs = removePositionFromCollection(stage.bombs, cell);
  stage.disarmItems = removePositionFromCollection(stage.disarmItems, cell);
  stage.wallBlocks = removePositionFromCollection(stage.wallBlocks ?? [], cell);

  if (selectedTool === MAKER_TOOL.player) {
    stage.playerStart = clonePosition(cell);
  } else if (selectedTool === MAKER_TOOL.key) {
    stage.keyPosition = clonePosition(cell);
  } else if (selectedTool === MAKER_TOOL.goal) {
    stage.goalPosition = clonePosition(cell);
  }

  applyMakerStage(stage);
}

function applyMakerBoardSize() {
  if (gameState.mode !== GAME_MODE.maker) {
    return;
  }

  const nextBoardSize = normalizeBoardSize({
    width: gameState.maker.widthInput,
    height: gameState.maker.heightInput,
  });
  const resizedStage = resizeMakerStage(gameState.stage, nextBoardSize);
  resizedStage.selectedMakerTool = gameState.maker.selectedTool;
  applyMakerStage(resizedStage);
}

function resetMakerStage() {
  if (gameState.mode !== GAME_MODE.maker) {
    return;
  }

  const nextBoardSize = normalizeBoardSize({
    width: gameState.maker.widthInput,
    height: gameState.maker.heightInput,
  });
  const nextStage = createMakerStage(nextBoardSize);
  nextStage.selectedMakerTool = gameState.maker.selectedTool;
  applyMakerStage(nextStage);
}

function startMakerTestPlay() {
  if (!isMakerEditing()) {
    return;
  }

  const stage = cloneStageDefinition(gameState.stage);
  stage.makerEditing = false;
  stage.selectedMakerTool = gameState.maker.selectedTool;
  applyMakerStage(stage);
}

function returnToMakerEdit() {
  if (gameState.mode !== GAME_MODE.maker || gameState.maker.editing) {
    return;
  }

  const stage = cloneStageDefinition(gameState.stage);
  stage.makerEditing = true;
  stage.selectedMakerTool = gameState.maker.selectedTool;
  applyMakerStage(stage);
}

function clearLoop() {
  gameState.loop = null;
  gameState.drawing.active = false;
  gameState.drawing.cells = [];
  gameState.playerSpaceId = null;
  gameState.playerInsideLoop = false;
  gameState.goalInsideLoop = false;
  gameState.goalSharesPlayerSpace = false;
  gameState.explodedBombs = [];
  updateStatus();
  render();
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function getGridCellFromPoint(point) {
  const boardSize = activeBoardSize;

  return {
    x: clampValue(Math.floor(point.x / CONFIG.cellSize), 0, boardSize.width - 1),
    y: clampValue(Math.floor(point.y / CONFIG.cellSize), 0, boardSize.height - 1),
  };
}

function getBlockedDrawingCellKeys() {
  const blockedKeys = new Set([
    getCellKey(gameState.player),
    getCellKey(gameState.goal.position),
    ...gameState.bombs.map(getCellKey),
    ...gameState.disarmItems.map(getCellKey),
    ...gameState.wallBlocks.map(getCellKey),
  ]);

  if (!gameState.key.collected) {
    blockedKeys.add(getCellKey(gameState.key.position));
  }

  return blockedKeys;
}

function isCellBlockedForDrawing(cell) {
  return getBlockedDrawingCellKeys().has(getCellKey(cell));
}

function countAdjacentLineCells(cell, lineCellKeys, boardSize = activeBoardSize) {
  let adjacentCount = 0;

  for (const neighbor of getCellNeighbors(cell, boardSize)) {
    if (lineCellKeys.has(getCellKey(neighbor))) {
      adjacentCount += 1;
    }
  }

  return adjacentCount;
}

function getPerimeterOrderValue(cell, boardSize = activeBoardSize) {
  if (cell.y === 0) {
    return cell.x;
  }

  if (cell.x === boardSize.width - 1) {
    return (boardSize.width - 1) + cell.y;
  }

  if (cell.y === boardSize.height - 1) {
    return (
      (boardSize.width - 1) +
      (boardSize.height - 1) +
      (boardSize.width - 1 - cell.x)
    );
  }

  return (
    (boardSize.width - 1) * 2 +
    (boardSize.height - 1) +
    (boardSize.height - 1 - cell.y)
  );
}

function collectLineComponents(lineCells, lineCellKeys, boardSize = activeBoardSize) {
  const visitedKeys = new Set();
  const components = [];

  for (const startCell of lineCells) {
    const startKey = getCellKey(startCell);
    if (visitedKeys.has(startKey)) {
      continue;
    }

    const queue = [startCell];
    const cells = [];
    const endpointCells = [];

    visitedKeys.add(startKey);

    while (queue.length > 0) {
      const current = queue.shift();
      cells.push(current);

      const adjacentCount = countAdjacentLineCells(current, lineCellKeys, boardSize);
      if (adjacentCount === 1) {
        endpointCells.push(current);
      } else if (adjacentCount !== 2) {
        return null;
      }

      for (const neighbor of getCellNeighbors(current, boardSize)) {
        const neighborKey = getCellKey(neighbor);

        if (!lineCellKeys.has(neighborKey) || visitedKeys.has(neighborKey)) {
          continue;
        }

        visitedKeys.add(neighborKey);
        queue.push(neighbor);
      }
    }

    if (endpointCells.length === 0) {
      components.push({
        id: components.length,
        kind: "cycle",
        cells,
        endpoints: [],
      });
      continue;
    }

    if (
      endpointCells.length === 2 &&
      endpointCells.every((cell) => isBorderCell(cell, boardSize))
    ) {
      components.push({
        id: components.length,
        kind: "path",
        cells,
        endpoints: endpointCells.map(clonePosition),
      });
      continue;
    }

    return null;
  }

  return components;
}

function buildBoundaryPairings(endpointRecords) {
  if (endpointRecords.length < 2 || endpointRecords.length % 2 !== 0) {
    return [];
  }

  const pairingCandidates = [];
  const pairingSignatures = new Set();

  for (let startIndex = 0; startIndex < 2; startIndex += 1) {
    const pairs = [];

    for (let index = startIndex; index < endpointRecords.length; index += 2) {
      const nextIndex = (index + 1) % endpointRecords.length;
      pairs.push([endpointRecords[index], endpointRecords[nextIndex]]);
    }

    const signature = pairs
      .map(([recordA, recordB]) =>
        [recordA.key, recordB.key].sort().join(">")
      )
      .sort()
      .join("|");

    if (!pairingSignatures.has(signature)) {
      pairingSignatures.add(signature);
      pairingCandidates.push(pairs);
    }
  }

  return pairingCandidates;
}

function isValidBoundaryCycle(endpointRecords, components, boundaryPairs) {
  if (endpointRecords.length === 0) {
    return false;
  }

  const adjacencyByEndpointKey = new Map(
    endpointRecords.map((record) => [record.key, new Set()])
  );

  for (const component of components) {
    const [startEndpoint, endEndpoint] = component.endpoints;
    const startKey = getCellKey(startEndpoint);
    const endKey = getCellKey(endEndpoint);

    adjacencyByEndpointKey.get(startKey)?.add(endKey);
    adjacencyByEndpointKey.get(endKey)?.add(startKey);
  }

  for (const [recordA, recordB] of boundaryPairs) {
    adjacencyByEndpointKey.get(recordA.key)?.add(recordB.key);
    adjacencyByEndpointKey.get(recordB.key)?.add(recordA.key);
  }

  const queue = [endpointRecords[0].key];
  const visitedKeys = new Set(queue);

  while (queue.length > 0) {
    const currentKey = queue.shift();
    const neighbors = adjacencyByEndpointKey.get(currentKey) ?? new Set();

    for (const neighborKey of neighbors) {
      if (visitedKeys.has(neighborKey)) {
        continue;
      }

      visitedKeys.add(neighborKey);
      queue.push(neighborKey);
    }
  }

  return visitedKeys.size === endpointRecords.length;
}

// 線セルが枝分かれせず、外壁込みで単一の閉路になるかを調べる
function analyzeLineTopology(lineCells, lineCellKeys, boardSize = activeBoardSize) {
  if (lineCells.length === 0) {
    return null;
  }

  const components = collectLineComponents(lineCells, lineCellKeys, boardSize);
  if (!components) {
    return null;
  }

  const cycleComponents = components.filter((component) => component.kind === "cycle");
  if (cycleComponents.length > 0) {
    return components.length === 1
      ? {
          usesOuterWall: false,
          components,
          boundaryPairs: [],
        }
      : null;
  }

  const endpointRecords = components
    .flatMap((component) =>
      component.endpoints.map((cell, endpointIndex) => ({
        key: getCellKey(cell),
        cell,
        componentId: component.id,
        endpointIndex,
        perimeterOrder: getPerimeterOrderValue(cell, boardSize),
      }))
    )
    .sort((recordA, recordB) => {
      if (recordA.perimeterOrder !== recordB.perimeterOrder) {
        return recordA.perimeterOrder - recordB.perimeterOrder;
      }

      return compareGridPositions(recordA.cell, recordB.cell);
    });

  for (const boundaryPairs of buildBoundaryPairings(endpointRecords)) {
    if (isValidBoundaryCycle(endpointRecords, components, boundaryPairs)) {
      return {
        usesOuterWall: true,
        components,
        boundaryPairs: boundaryPairs.map(([recordA, recordB]) => [
          clonePosition(recordA.cell),
          clonePosition(recordB.cell),
        ]),
      };
    }
  }

  return null;
}

function getSpaceAnchorCell(space) {
  return [...space.cells].sort(compareGridPositions)[0] ?? { x: 0, y: 0 };
}

function selectInsideSpace(spaces) {
  if (spaces.length === 0) {
    return null;
  }

  const nonBorderSpaces = spaces.filter((space) => !space.touchesBorder);
  if (nonBorderSpaces.length === 1) {
    return nonBorderSpaces[0];
  }

  return [...spaces].sort((spaceA, spaceB) => {
    if (spaceA.cells.length !== spaceB.cells.length) {
      return spaceA.cells.length - spaceB.cells.length;
    }

    const anchorA = getSpaceAnchorCell(spaceA);
    const anchorB = getSpaceAnchorCell(spaceB);
    return compareGridPositions(anchorA, anchorB);
  })[0];
}

// 線以外のマスを連結成分に分ける
function computeLoopSpaces(lineCellKeys, boardSize = activeBoardSize) {
  const visitedKeys = new Set();
  const spaceByCellKey = new Map();
  const spaces = [];

  for (let y = 0; y < boardSize.height; y += 1) {
    for (let x = 0; x < boardSize.width; x += 1) {
      const startCell = { x, y };
      const startKey = getCellKey(startCell);

      if (lineCellKeys.has(startKey) || visitedKeys.has(startKey)) {
        continue;
      }

      const queue = [startCell];
      const cells = [];
      let touchesBorder = false;

      visitedKeys.add(startKey);

      while (queue.length > 0) {
        const current = queue.shift();
        cells.push(current);

        if (isBorderCell(current, boardSize)) {
          touchesBorder = true;
        }

        for (const neighbor of getCellNeighbors(current, boardSize)) {
          const neighborKey = getCellKey(neighbor);

          if (lineCellKeys.has(neighborKey) || visitedKeys.has(neighborKey)) {
            continue;
          }

          visitedKeys.add(neighborKey);
          queue.push(neighbor);
        }
      }

      const space = {
        id: spaces.length,
        touchesBorder,
        cells,
      };

      for (const cell of cells) {
        spaceByCellKey.set(getCellKey(cell), space.id);
      }

      spaces.push(space);
    }
  }

  return {
    spaces,
    spaceByCellKey,
  };
}

function collectConnectedWallBlocks(
  drawnLineCells,
  wallBlocks,
  boardSize = activeBoardSize
) {
  if (drawnLineCells.length === 0 || wallBlocks.length === 0) {
    return [];
  }

  const wallBlockMap = new Map(
    wallBlocks.map((cell) => [getCellKey(cell), clonePosition(cell)])
  );
  const visitedKeys = new Set();
  const queue = [];

  for (const drawnCell of drawnLineCells) {
    for (const neighbor of getCellNeighbors(drawnCell, boardSize)) {
      const neighborKey = getCellKey(neighbor);
      if (!wallBlockMap.has(neighborKey) || visitedKeys.has(neighborKey)) {
        continue;
      }

      visitedKeys.add(neighborKey);
      queue.push(clonePosition(neighbor));
    }
  }

  const connectedWallBlocks = [];

  while (queue.length > 0) {
    const current = queue.shift();
    connectedWallBlocks.push(clonePosition(current));

    for (const neighbor of getCellNeighbors(current, boardSize)) {
      const neighborKey = getCellKey(neighbor);
      if (!wallBlockMap.has(neighborKey) || visitedKeys.has(neighborKey)) {
        continue;
      }

      visitedKeys.add(neighborKey);
      queue.push(clonePosition(neighbor));
    }
  }

  return connectedWallBlocks;
}

function buildLoopFromCells(
  cells,
  boardSize = activeBoardSize,
  wallBlocks = []
) {
  const drawnLineCells = getUniqueCells(cells);
  const connectedWallBlocks = collectConnectedWallBlocks(
    drawnLineCells,
    wallBlocks,
    boardSize
  );
  const lineCells = getUniqueCells([...drawnLineCells, ...connectedWallBlocks]);
  const lineCellKeys = new Set(lineCells.map(getCellKey));
  const topology = analyzeLineTopology(lineCells, lineCellKeys, boardSize);

  if (!topology) {
    return null;
  }

  const { spaces, spaceByCellKey } = computeLoopSpaces(lineCellKeys, boardSize);
  if (spaces.length === 0) {
    return null;
  }

  if (topology.usesOuterWall && spaces.length < 2) {
    return null;
  }

  const insideSpace = selectInsideSpace(spaces);
  const classifiedSpaces = spaces.map((space) => ({
    ...space,
    kind: space.id === insideSpace?.id ? "inside" : "outside",
  }));

  return {
    drawnLineCells,
    wallLineCells: connectedWallBlocks,
    lineCells,
    lineCellKeys,
    spaces: classifiedSpaces,
    spaceByCellKey,
    insideSpaceId: insideSpace?.id ?? null,
    insideCells: insideSpace?.cells ?? [],
    insideCellKeys: new Set((insideSpace?.cells ?? []).map(getCellKey)),
    usesOuterWall: topology.usesOuterWall,
  };
}

function getGridSpaceId(gridPosition) {
  if (!gameState.loop) {
    return null;
  }

  const cellKey = getCellKey(gridPosition);

  if (gameState.loop.lineCellKeys.has(cellKey)) {
    return null;
  }

  return gameState.loop.spaceByCellKey.get(cellKey) ?? null;
}

function isGridPositionInsideLoop(gridPosition) {
  return getGridSpaceId(gridPosition) === gameState.loop?.insideSpaceId;
}

function isGridPositionInPlayerSpace(gridPosition) {
  if (gameState.playerSpaceId === null) {
    return false;
  }

  return getGridSpaceId(gridPosition) === gameState.playerSpaceId;
}

function groupPositionsBySpace(positions) {
  const grouped = new Map();

  for (const position of positions) {
    const spaceId = getGridSpaceId(position);

    if (spaceId === null) {
      continue;
    }

    if (!grouped.has(spaceId)) {
      grouped.set(spaceId, []);
    }

    grouped.get(spaceId).push(position);
  }

  return grouped;
}

function canPlayerMoveInCurrentSpace() {
  if (gameState.playerSpaceId === null) {
    return false;
  }

  return getCellNeighbors(gameState.player).some(
    (neighbor) => getGridSpaceId(neighbor) === gameState.playerSpaceId
  );
}

function buildCellKeySet(positions) {
  return new Set(positions.map(getCellKey));
}

function updateStatus() {
  if (isMakerEditing()) {
    gameState.status = STATUS.makerEdit;
    return;
  }

  if (gameState.gameOver) {
    gameState.status = STATUS.gameOver;
    return;
  }

  if (gameState.clear) {
    gameState.status = STATUS.clear;
    return;
  }

  if (gameState.drawing.active) {
    gameState.status = STATUS.drawing;
    return;
  }

  if (!gameState.loop) {
    gameState.status = STATUS.idle;
    return;
  }

  gameState.status = canPlayerMoveInCurrentSpace()
    ? STATUS.movable
    : STATUS.outsideLoop;
}

// プレイヤー空間ではシールド回収後に爆弾判定を行い、
// シールドがなければ即死、あれば1回だけ耐えて爆弾を消す。
// それ以外の空間では同数の爆弾とニッパーを相殺する。
function applyLoopEffects() {
  gameState.explodedBombs = [];
  gameState.playerSpaceId = getGridSpaceId(gameState.player);
  gameState.playerInsideLoop = isGridPositionInsideLoop(gameState.player);
  gameState.goalInsideLoop = isGridPositionInsideLoop(gameState.goal.position);
  gameState.goalSharesPlayerSpace = isGridPositionInPlayerSpace(
    gameState.goal.position
  );

  if (gameState.playerSpaceId === null) {
    updateStatus();
    return;
  }

  let bombsBySpace = groupPositionsBySpace(gameState.bombs);
  let disarmBySpace = groupPositionsBySpace(gameState.disarmItems);
  let bombsInPlayerSpace = bombsBySpace.get(gameState.playerSpaceId) || [];

  if (bombsInPlayerSpace.length > 0) {
    gameState.explodedBombs = clonePositions(bombsInPlayerSpace);
    gameState.gameOver = true;
    updateStatus();
    return;
  }

  const removedBombKeys = new Set();
  const removedDisarmKeys = new Set();
  const targetSpaceIds = new Set([
    ...bombsBySpace.keys(),
    ...disarmBySpace.keys(),
  ]);

  for (const spaceId of targetSpaceIds) {
    if (spaceId === gameState.playerSpaceId) {
      continue;
    }

    const bombsInSpace = bombsBySpace.get(spaceId) || [];
    const disarmItemsInSpace = disarmBySpace.get(spaceId) || [];

    if (
      bombsInSpace.length > 0 &&
      bombsInSpace.length === disarmItemsInSpace.length
    ) {
      for (const bomb of bombsInSpace) {
        removedBombKeys.add(getCellKey(bomb));
      }

      for (const item of disarmItemsInSpace) {
        removedDisarmKeys.add(getCellKey(item));
      }
    }
  }

  if (removedBombKeys.size > 0 || removedDisarmKeys.size > 0) {
    gameState.bombs = gameState.bombs.filter(
      (bomb) => !removedBombKeys.has(getCellKey(bomb))
    );
    gameState.disarmItems = gameState.disarmItems.filter(
      (item) => !removedDisarmKeys.has(getCellKey(item))
    );
  }

  if (!gameState.key.collected && isGridPositionInPlayerSpace(gameState.key.position)) {
    gameState.key.collected = true;
  }

  gameState.goalSharesPlayerSpace = isGridPositionInPlayerSpace(
    gameState.goal.position
  );

  if (gameState.key.collected && gameState.goalSharesPlayerSpace) {
    gameState.clear = true;
  }

  updateStatus();
}

function attemptMove(deltaX, deltaY) {
  if (
    gameState.gameOver ||
    gameState.clear ||
    gameState.drawing.active ||
    isMakerEditing()
  ) {
    return;
  }

  if (!gameState.loop || gameState.playerSpaceId === null) {
    updateStatus();
    render();
    return;
  }

  const nextPosition = {
    x: gameState.player.x + deltaX,
    y: gameState.player.y + deltaY,
  };

  if (!isInsideMap(nextPosition)) {
    return;
  }

  if (getGridSpaceId(nextPosition) !== gameState.playerSpaceId) {
    return;
  }

  gameState.player = nextPosition;
  applyLoopEffects();
  render();
}

function getOrthogonalTargetCell(targetCell) {
  const cells = gameState.drawing.cells;
  const lastCell = cells[cells.length - 1];

  if (!lastCell) {
    return targetCell;
  }

  const deltaX = targetCell.x - lastCell.x;
  const deltaY = targetCell.y - lastCell.y;

  if (deltaX === 0 || deltaY === 0) {
    return targetCell;
  }

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return {
      x: targetCell.x,
      y: lastCell.y,
    };
  }

  return {
    x: lastCell.x,
    y: targetCell.y,
  };
}

function buildCellSegment(startCell, endCell) {
  const segment = [];

  if (startCell.x === endCell.x) {
    const stepY = Math.sign(endCell.y - startCell.y);
    for (let y = startCell.y + stepY; y !== endCell.y + stepY; y += stepY) {
      segment.push({ x: startCell.x, y });
    }
    return segment;
  }

  if (startCell.y === endCell.y) {
    const stepX = Math.sign(endCell.x - startCell.x);
    for (let x = startCell.x + stepX; x !== endCell.x + stepX; x += stepX) {
      segment.push({ x, y: startCell.y });
    }
  }

  return segment;
}

function appendSingleDrawingCell(cell) {
  const cells = gameState.drawing.cells;
  const lastCell = cells[cells.length - 1];

  if (!lastCell) {
    cells.push(clonePosition(cell));
    return;
  }

  if (positionsMatch(lastCell, cell)) {
    return;
  }

  const previousCell = cells[cells.length - 2];
  if (previousCell && positionsMatch(previousCell, cell)) {
    cells.pop();
    return;
  }

  cells.push(clonePosition(cell));
}

function appendDrawingPath(rawCell) {
  const orthogonalCell = getOrthogonalTargetCell(rawCell);
  const cells = gameState.drawing.cells;
  const lastCell = cells[cells.length - 1];
  const blockedKeys = getBlockedDrawingCellKeys();

  if (!lastCell) {
    if (!blockedKeys.has(getCellKey(orthogonalCell))) {
      cells.push(clonePosition(orthogonalCell));
    }
    return;
  }

  const segment = buildCellSegment(lastCell, orthogonalCell);
  for (const cell of segment) {
    if (blockedKeys.has(getCellKey(cell))) {
      break;
    }

    appendSingleDrawingCell(cell);
  }
}

function startDrawing(event) {
  if (gameState.gameOver || gameState.clear) {
    return;
  }

  const startCell = getGridCellFromPoint(getCanvasPoint(event));

  if (isMakerEditing()) {
    handleMakerCanvasPlacement(startCell);
    return;
  }

  if (isCellBlockedForDrawing(startCell)) {
    return;
  }

  // 新しい線を描き始めたら既存のループを消す
  gameState.loop = null;
  gameState.playerSpaceId = null;
  gameState.playerInsideLoop = false;
  gameState.goalInsideLoop = false;
  gameState.goalSharesPlayerSpace = false;
  gameState.explodedBombs = [];
  gameState.drawing.active = true;
  gameState.drawing.cells = [startCell];
  updateStatus();
  render();
}

function updateDrawing(event) {
  if (!gameState.drawing.active) {
    return;
  }

  appendDrawingPath(getGridCellFromPoint(getCanvasPoint(event)));
  render();
}

function finalizeLoop() {
  if (gameState.drawing.cells.some(isCellBlockedForDrawing)) {
    clearLoop();
    return;
  }

  const builtLoop = buildLoopFromCells(
    gameState.drawing.cells,
    activeBoardSize,
    gameState.wallBlocks
  );

  if (!builtLoop) {
    clearLoop();
    return;
  }

  gameState.loop = builtLoop;
  gameState.drawing.active = false;
  gameState.drawing.cells = [];
  applyLoopEffects();
  render();
}

function finishDrawing(event) {
  if (!gameState.drawing.active) {
    return;
  }

  appendDrawingPath(getGridCellFromPoint(getCanvasPoint(event)));
  finalizeLoop();
}

function clearCanvas() {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function drawCells(cells, fillStyle, strokeStyle) {
  context.save();
  context.fillStyle = fillStyle;
  context.strokeStyle = strokeStyle;
  context.lineWidth = 2;

  for (const cell of cells) {
    const pixelX = cell.x * CONFIG.cellSize;
    const pixelY = cell.y * CONFIG.cellSize;

    context.fillRect(pixelX, pixelY, CONFIG.cellSize, CONFIG.cellSize);
    context.strokeRect(pixelX + 1, pixelY + 1, CONFIG.cellSize - 2, CONFIG.cellSize - 2);
  }

  context.restore();
}

function getLoopSpaceFillStyle(spaceId) {
  return CONFIG.spaceFillPalette[spaceId % CONFIG.spaceFillPalette.length];
}

function drawLoopSpaces() {
  if (!gameState.loop) {
    return;
  }

  context.save();
  
  for (const space of gameState.loop.spaces) {
    context.fillStyle = getLoopSpaceFillStyle(space.id);

    for (const cell of space.cells) {
      context.fillRect(
        cell.x * CONFIG.cellSize,
        cell.y * CONFIG.cellSize,
        CONFIG.cellSize,
        CONFIG.cellSize
      );
    }
  }

  context.restore();
}

function drawLoopCells() {
  if (!gameState.loop) {
    return;
  }

  drawCells(
    gameState.loop.drawnLineCells,
    CONFIG.loopCellFillStyle,
    CONFIG.loopCellStrokeStyle
  );
}

function drawWallBlocks() {
  if (gameState.wallBlocks.length === 0) {
    return;
  }

  drawCells(
    gameState.wallBlocks,
    CONFIG.wallBlockFillStyle,
    CONFIG.wallBlockStrokeStyle
  );
}

function drawCurrentStroke() {
  if (!gameState.drawing.active || gameState.drawing.cells.length === 0) {
    return;
  }

  drawCells(
    getUniqueCells(gameState.drawing.cells),
    CONFIG.drawingCellFillStyle,
    CONFIG.drawingCellStrokeStyle
  );
}

function drawGrid() {
  context.save();
  context.strokeStyle = CONFIG.gridLineStyle;
  context.lineWidth = 1;

  for (let index = 0; index <= activeBoardSize.width; index += 1) {
    const offset = index * CONFIG.cellSize;

    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset, canvas.height);
    context.stroke();
  }

  for (let index = 0; index <= activeBoardSize.height; index += 1) {
    const offset = index * CONFIG.cellSize;

    context.beginPath();
    context.moveTo(0, offset);
    context.lineTo(canvas.width, offset);
    context.stroke();
  }

  context.restore();
}

function drawPlayer() {
  const center = getCellCenter(gameState.player);

  context.save();
  context.fillStyle = "#2378e2";
  context.strokeStyle = "#103d72";
  context.lineWidth = 2;

  context.beginPath();
  context.arc(center.x, center.y - 8, 8, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.beginPath();
  context.ellipse(center.x, center.y + 7, 13, 11, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.fillStyle = "#ffffff";
  context.beginPath();
  context.moveTo(center.x, center.y);
  context.lineTo(center.x + 5, center.y + 8);
  context.lineTo(center.x - 5, center.y + 8);
  context.closePath();
  context.fill();
  context.restore();
}

function drawKey() {
  if (gameState.key.collected) {
    return;
  }

  const center = getCellCenter(gameState.key.position);

  context.save();
  context.strokeStyle = "#9a7a00";
  context.fillStyle = "#f0c419";
  context.lineWidth = 4;
  context.lineCap = "round";
  context.lineJoin = "round";

  context.beginPath();
  context.arc(center.x - 8, center.y - 4, 6, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(center.x - 2, center.y - 4);
  context.lineTo(center.x + 10, center.y - 4);
  context.lineTo(center.x + 10, center.y + 2);
  context.lineTo(center.x + 6, center.y + 2);
  context.lineTo(center.x + 6, center.y + 6);
  context.lineTo(center.x + 1, center.y + 6);
  context.lineTo(center.x + 1, center.y - 1);
  context.lineTo(center.x - 2, center.y - 1);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = "#fff7b8";
  context.beginPath();
  context.arc(center.x - 8, center.y - 4, 2.4, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawGoal() {
  const center = getCellCenter(gameState.goal.position);

  context.save();
  context.strokeStyle = "#176837";
  context.fillStyle = "#2f9d53";
  context.lineWidth = 3;
  context.lineCap = "round";

  context.beginPath();
  context.moveTo(center.x - 8, center.y + 13);
  context.lineTo(center.x - 8, center.y - 13);
  context.stroke();

  context.beginPath();
  context.moveTo(center.x - 7, center.y - 11);
  context.lineTo(center.x + 9, center.y - 6);
  context.lineTo(center.x - 7, center.y - 1);
  context.closePath();
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(center.x - 12, center.y + 13);
  context.lineTo(center.x - 2, center.y + 13);
  context.stroke();
  context.restore();
}

function drawBombs() {
  const explodedBombKeys = buildCellKeySet(gameState.explodedBombs);

  for (const bomb of gameState.bombs) {
    if (explodedBombKeys.has(getCellKey(bomb))) {
      continue;
    }

    const center = getCellCenter(bomb);

    context.save();
    context.fillStyle = "#2b2b2b";
    context.strokeStyle = "#111111";
    context.lineWidth = 2;

    context.beginPath();
    context.arc(center.x, center.y, CONFIG.objectRadius - 1, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    context.strokeStyle = "#4b3417";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(center.x + 3, center.y - 11);
    context.quadraticCurveTo(center.x + 8, center.y - 20, center.x + 13, center.y - 15);
    context.stroke();

    context.fillStyle = "#ff8c1a";
    context.beginPath();
    context.moveTo(center.x + 13, center.y - 18);
    context.lineTo(center.x + 17, center.y - 14);
    context.lineTo(center.x + 13, center.y - 10);
    context.lineTo(center.x + 9, center.y - 14);
    context.closePath();
    context.fill();

    context.fillStyle = "#ff6b6b";
    context.beginPath();
    context.arc(center.x - 4, center.y - 4, 4, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

function drawExplodedBombs() {
  for (const bomb of gameState.explodedBombs) {
    const center = getCellCenter(bomb);

    context.save();
    context.translate(center.x, center.y);

    context.fillStyle = "rgba(255, 140, 0, 0.95)";
    context.strokeStyle = "#7a1200";
    context.lineWidth = 2;

    context.beginPath();
    context.moveTo(0, -22);
    context.lineTo(6, -9);
    context.lineTo(18, -18);
    context.lineTo(12, -5);
    context.lineTo(24, 0);
    context.lineTo(11, 5);
    context.lineTo(18, 18);
    context.lineTo(5, 11);
    context.lineTo(0, 24);
    context.lineTo(-5, 11);
    context.lineTo(-18, 18);
    context.lineTo(-11, 5);
    context.lineTo(-24, 0);
    context.lineTo(-12, -5);
    context.lineTo(-18, -18);
    context.lineTo(-6, -9);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = "#ffe18c";
    context.beginPath();
    context.moveTo(0, -13);
    context.lineTo(4, -5);
    context.lineTo(12, -9);
    context.lineTo(7, -1);
    context.lineTo(15, 3);
    context.lineTo(6, 5);
    context.lineTo(9, 13);
    context.lineTo(1, 8);
    context.lineTo(-3, 15);
    context.lineTo(-5, 7);
    context.lineTo(-14, 8);
    context.lineTo(-8, 1);
    context.lineTo(-15, -4);
    context.lineTo(-6, -5);
    context.lineTo(-10, -13);
    context.lineTo(-1, -8);
    context.closePath();
    context.fill();

    context.fillStyle = "#fff8d6";
    context.beginPath();
    context.arc(0, 1, 5, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }
}

function drawDisarmItems() {
  for (const item of gameState.disarmItems) {
    const center = getCellCenter(item);

    context.save();
    context.translate(center.x, center.y);
    context.lineCap = "round";
    context.lineJoin = "round";

    context.strokeStyle = "#0d6670";
    context.lineWidth = 6;

    context.beginPath();
    context.moveTo(-2, 3);
    context.quadraticCurveTo(-10, 8, -12, 16);
    context.quadraticCurveTo(-10, 20, -6, 19);
    context.quadraticCurveTo(-2, 13, -1, 7);
    context.stroke();

    context.beginPath();
    context.moveTo(2, 3);
    context.quadraticCurveTo(10, 8, 12, 16);
    context.quadraticCurveTo(10, 20, 6, 19);
    context.quadraticCurveTo(2, 13, 1, 7);
    context.stroke();

    context.fillStyle = "#d7fffd";
    context.strokeStyle = "#24545b";
    context.lineWidth = 2;

    context.beginPath();
    context.moveTo(-2, 2);
    context.lineTo(-10, -8);
    context.lineTo(-4, -12);
    context.lineTo(0, -2);
    context.closePath();
    context.fill();
    context.stroke();

    context.beginPath();
    context.moveTo(2, 2);
    context.lineTo(10, -8);
    context.lineTo(4, -12);
    context.lineTo(0, -2);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = "#0d6670";
    context.beginPath();
    context.arc(0, 2, 3.5, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }
}

function drawOverlay() {
  if (!gameState.gameOver && !gameState.clear) {
    return;
  }

  context.save();
  context.fillStyle = CONFIG.overlayFillStyle;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "bold 44px Trebuchet MS, Segoe UI, sans-serif";
  context.fillText(
    gameState.gameOver ? "GAME OVER" : "CLEAR",
    canvas.width / 2,
    canvas.height / 2
  );
  context.restore();
}

function buildMakerObjectSummary() {
  return [
    `爆弾${gameState.bombs.length}個`,
    `ニッパー${gameState.disarmItems.length}個`,
    `壁${gameState.wallBlocks.length}個`,
  ].join(" / ");
}

function buildStageInfoText() {
  if (gameState.mode === GAME_MODE.tutorial) {
    const currentNumber = (gameState.tutorialIndex ?? 0) + 1;
    return `チュートリアル ${currentNumber}/${TUTORIAL_STAGES.length}: ${gameState.stage.designLabel}\n${gameState.stage.designNote}`;
  }

  if (gameState.mode === GAME_MODE.maker) {
    const boardSize = getStageBoardSize(gameState.stage);
    const headline = gameState.maker.editing
      ? "ステージメーカー 編集中"
      : "ステージメーカー テストプレイ中";

    return `${headline} ${boardSize.width}x${boardSize.height}\n選択中: ${MAKER_TOOL_LABELS[gameState.maker.selectedTool]} / ${buildMakerObjectSummary()}`;
  }

  return `ランダムステージ: ${gameState.stage.designNote}\nShift + R で新しいランダムステージを生成できます。`;
}

function getHudInstructionText() {
  if (gameState.mode === GAME_MODE.maker) {
    return gameState.maker.editing
      ? MAKER_EDIT_INSTRUCTION_TEXT
      : MAKER_TEST_INSTRUCTION_TEXT;
  }

  return gameState.stage.instructionText ?? RANDOM_STAGE_INSTRUCTION_TEXT;
}

function syncHud() {
  const isTutorialMode = gameState.mode === GAME_MODE.tutorial;
  const isMakerMode = gameState.mode === GAME_MODE.maker;

  instructionTextElement.textContent = getHudInstructionText();
  keyStatusElement.textContent = gameState.key.collected ? "取得済み" : "未取得";
  bombStatusElement.textContent = `${gameState.bombs.length}個`;
  disarmStatusElement.textContent = `${gameState.disarmItems.length}個`;
  stateStatusElement.textContent = gameState.status;
  stageInfoElement.textContent = buildStageInfoText();
  tutorialButtonRow.hidden = !isTutorialMode;
  makerPanel.hidden = !isMakerMode;
  tutorialPrevButton.disabled = !isTutorialMode || (gameState.tutorialIndex ?? 0) <= 0;
  tutorialNextButton.disabled =
    !isTutorialMode || (gameState.tutorialIndex ?? 0) >= TUTORIAL_STAGES.length - 1;
  randomModeButton.classList.toggle("is-active", gameState.mode === GAME_MODE.random);
  tutorialModeButton.classList.toggle("is-active", isTutorialMode);
  makerModeButton.classList.toggle("is-active", isMakerMode);

  if (isMakerMode) {
    makerWidthInput.value = String(gameState.maker.widthInput);
    makerHeightInput.value = String(gameState.maker.heightInput);
    makerWidthInput.disabled = !gameState.maker.editing;
    makerHeightInput.disabled = !gameState.maker.editing;
    makerApplySizeButton.disabled = !gameState.maker.editing;
    makerResetButton.disabled = !gameState.maker.editing;
    makerTestButton.hidden = !gameState.maker.editing;
    makerEditButton.hidden = gameState.maker.editing;
    makerHintElement.textContent = gameState.maker.editing
      ? getMakerToolHint(gameState.maker.selectedTool)
      : "テストプレイ中は通常ルールで移動とループ作成ができます。配置を変えたくなったら「編集に戻る」を押してください。";

    for (const [tool, button] of Object.entries(makerToolButtons)) {
      button.classList.toggle("is-active", gameState.maker.selectedTool === tool);
      button.disabled = !gameState.maker.editing;
    }
  }
}

function render() {
  clearCanvas();
  drawLoopSpaces();
  drawWallBlocks();
  drawLoopCells();
  drawCurrentStroke();
  drawGrid();
  drawGoal();
  drawBombs();
  drawExplodedBombs();
  drawDisarmItems();
  drawKey();
  drawPlayer();
  drawOverlay();
  syncHud();
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();

  if (key === "r") {
    event.preventDefault();
    resetGame(event.shiftKey);
    return;
  }

  const moveMap = {
    arrowup: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
  };

  const move = moveMap[key];
  if (!move) {
    return;
  }

  event.preventDefault();
  attemptMove(move.x, move.y);
}

// ステージメーカーのサイズ入力を現在の編集ステージに反映する
function handleMakerSizeInputChange() {
  if (gameState.mode !== GAME_MODE.maker) {
    return;
  }

  updateMakerStageInputs(makerWidthInput.value, makerHeightInput.value);
}

function getMakerToolHint(tool) {
  const hints = {
    [MAKER_TOOL.player]: "プレイヤー開始位置を置きます。同じ空間の中だけを移動できます。",
    [MAKER_TOOL.key]: "鍵を置きます。プレイヤーと同じ空間に入ると取得されます。",
    [MAKER_TOOL.goal]: "ゴールを置きます。鍵取得後に同じ空間へ入るとクリアです。",
    [MAKER_TOOL.bomb]: "爆弾を置きます。プレイヤーと同じ空間に入ると即ゲームオーバーです。",
    [MAKER_TOOL.disarm]: "ニッパーを置きます。プレイヤーがいない空間で爆弾と同数なら相殺します。",
    [MAKER_TOOL.wall]: "壁ブロックを置きます。描いた線に接続したときだけループ壁として使われます。",
    [MAKER_TOOL.erase]: "爆弾・ニッパー・壁ブロックを消します。",
  };

  return hints[tool] ?? "";
}

function buildMakerObjectSummary() {
  return [
    `爆弾${gameState.bombs.length}個`,
    `ニッパー${gameState.disarmItems.length}個`,
    `壁${gameState.wallBlocks.length}個`,
  ].join(" / ");
}

function buildStageInfoText() {
  if (gameState.mode === GAME_MODE.tutorial) {
    const currentNumber = (gameState.tutorialIndex ?? 0) + 1;
    return `チュートリアル ${currentNumber}/${TUTORIAL_STAGES.length}\nループで空間を分け、危険物を避けながら鍵とゴールを同じ空間へ入れる練習です。`;
  }

  if (gameState.mode === GAME_MODE.maker) {
    const boardSize = getStageBoardSize(gameState.stage);
    const headline = gameState.maker.editing
      ? "ステージメーカー 編集中"
      : "ステージメーカー テストプレイ中";
    return `${headline} ${boardSize.width}x${boardSize.height}\n${buildMakerObjectSummary()}`;
  }

  return `ランダムステージ\n${buildMakerObjectSummary()}\n壁ブロックは描いた線に接続したときだけループ壁として機能します。Shift + R で新しいステージを生成します。`;
}

function getHudInstructionText() {
  if (gameState.mode === GAME_MODE.maker) {
    return gameState.maker.editing
      ? "配置ツールでオブジェクトを置きます。壁ブロックは描いた線に接続したときだけループ壁になります。"
      : "テストプレイ中です。通常ルールでループを描いて挙動を確認できます。";
  }

  if (gameState.mode === GAME_MODE.tutorial) {
    return "チュートリアルです。マウスドラッグでマスを塗って閉ループを作り、矢印キーまたはWASDで同じ空間だけを移動します。";
  }

  return "ランダムモードです。マウスドラッグでマスを塗って閉ループを作り、矢印キーまたはWASDで移動します。";
}

function getHudStatusLabel() {
  if (isMakerEditing()) {
    return "メーカー編集中";
  }

  if (gameState.gameOver) {
    return "ゲームオーバー";
  }

  if (gameState.clear) {
    return "クリア";
  }

  if (gameState.drawing.active) {
    return "描画中";
  }

  if (!gameState.loop) {
    return "待機中";
  }

  return canPlayerMoveInCurrentSpace()
    ? "移動可能"
    : "同じ空間に移動先がない";
}

function syncHud() {
  const isTutorialMode = gameState.mode === GAME_MODE.tutorial;
  const isMakerMode = gameState.mode === GAME_MODE.maker;

  instructionTextElement.textContent = getHudInstructionText();
  keyStatusElement.textContent = gameState.key.collected ? "取得済み" : "未取得";
  bombStatusElement.textContent = `${gameState.bombs.length}個`;
  disarmStatusElement.textContent = `${gameState.disarmItems.length}個`;
  stateStatusElement.textContent = getHudStatusLabel();
  stageInfoElement.textContent = buildStageInfoText();
  tutorialButtonRow.hidden = !isTutorialMode;
  makerPanel.hidden = !isMakerMode;
  tutorialPrevButton.disabled = !isTutorialMode || (gameState.tutorialIndex ?? 0) <= 0;
  tutorialNextButton.disabled =
    !isTutorialMode || (gameState.tutorialIndex ?? 0) >= TUTORIAL_STAGES.length - 1;
  randomModeButton.classList.toggle("is-active", gameState.mode === GAME_MODE.random);
  tutorialModeButton.classList.toggle("is-active", isTutorialMode);
  makerModeButton.classList.toggle("is-active", isMakerMode);

  if (isMakerMode) {
    makerWidthInput.value = String(gameState.maker.widthInput);
    makerHeightInput.value = String(gameState.maker.heightInput);
    makerWidthInput.disabled = !gameState.maker.editing;
    makerHeightInput.disabled = !gameState.maker.editing;
    makerApplySizeButton.disabled = !gameState.maker.editing;
    makerResetButton.disabled = !gameState.maker.editing;
    makerTestButton.hidden = !gameState.maker.editing;
    makerEditButton.hidden = gameState.maker.editing;
    makerHintElement.textContent = gameState.maker.editing
      ? getMakerToolHint(gameState.maker.selectedTool)
      : "テストプレイ中は通常ルールで移動とループ確認ができます。配置を直すときは「編集に戻る」を使ってください。";

    for (const [tool, button] of Object.entries(makerToolButtons)) {
      if (!button) {
        continue;
      }

      button.classList.toggle("is-active", gameState.maker.selectedTool === tool);
      button.disabled = !gameState.maker.editing;
    }
  }
}

globalThis.closedLoopDebug = {
  createRandomDesignedStage,
  createTutorialStage,
  createMakerStage,
  setGameMode,
  goToTutorialStage,
  resetGame,
  getCurrentStage() {
    return gameState.stage;
  },
  getState() {
    return {
      mode: gameState.mode,
      tutorialIndex: gameState.tutorialIndex,
      keyCollected: gameState.key.collected,
      bombCount: gameState.bombs.length,
      disarmCount: gameState.disarmItems.length,
      wallCount: gameState.wallBlocks.length,
      status: gameState.status,
    };
  },
};

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", updateDrawing);
window.addEventListener("mouseup", finishDrawing);
document.addEventListener("keydown", handleKeyDown);
resetButton.addEventListener("click", () => resetGame(false));
clearLoopButton.addEventListener("click", clearLoop);
randomModeButton.addEventListener("click", () => setGameMode(GAME_MODE.random));
tutorialModeButton.addEventListener("click", () => setGameMode(GAME_MODE.tutorial));
makerModeButton.addEventListener("click", () => setGameMode(GAME_MODE.maker));
tutorialPrevButton.addEventListener("click", () =>
  goToTutorialStage((gameState.tutorialIndex ?? 0) - 1)
);
tutorialNextButton.addEventListener("click", () =>
  goToTutorialStage((gameState.tutorialIndex ?? 0) + 1)
);
makerWidthInput.addEventListener("input", handleMakerSizeInputChange);
makerHeightInput.addEventListener("input", handleMakerSizeInputChange);
makerApplySizeButton.addEventListener("click", applyMakerBoardSize);
makerResetButton.addEventListener("click", resetMakerStage);
makerTestButton.addEventListener("click", startMakerTestPlay);
makerEditButton.addEventListener("click", returnToMakerEdit);

for (const [tool, button] of Object.entries(makerToolButtons)) {
  button.addEventListener("click", () => setMakerSelectedTool(tool));
}

updateCanvasMetrics(initialRandomStage);
updateStatus();
render();
