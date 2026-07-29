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
  movable: "ループ成立中",
  outsideLoop: "ループ成立中",
  gameOver: "ゲームオーバー",
  clear: "クリア",
  makerEdit: "メーカー編集中",
};

const GAME_MODE = {
  random: "random",
  tutorial: "tutorial",
  maker: "maker",
  stage: "stage",
};

const STAGE_DIFFICULTY = {
  low: "low",
  medium: "medium",
  high: "high",
};

const STAGE_PACKS = {
  [STAGE_DIFFICULTY.low]: { label: "Easy", directory: "low", count: 10 },
  [STAGE_DIFFICULTY.medium]: { label: "Normal", directory: "medium", count: 10 },
  [STAGE_DIFFICULTY.high]: { label: "Hard", directory: "high", count: 10 },
};

const DEFAULT_STAGE_DIFFICULTY = STAGE_DIFFICULTY.low;

const BASE_STAGE = {
  playerStart: { x: 1, y: 1 },
  keyPosition: { x: 3, y: 2 },
  goalPosition: { x: 8, y: 8 },
};

const DEFAULT_START_STAGE = {
  boardSize: { width: 10, height: 10 },
  playerStart: { x: 8, y: 8 },
  keyPosition: { x: 4, y: 8 },
  goalPosition: { x: 1, y: 3 },
  bombs: [{ x: 1, y: 1 }],
  disarmItems: [{ x: 8, y: 1 }],
  wallBlocks: [
    { x: 6, y: 7 },
    { x: 6, y: 6 },
    { x: 5, y: 6 },
  ],
  designLabel: "Low 001",
  designNote: "Startup stage placeholder for Low 001.",
  instructionText:
    "Fixed stage pack. Include the key, then include the goal. Bombs disappear only when the same space contains the same number of water buckets. Click after CLEAR to move to the next stage.",
  keyInitiallyCollected: false,
  mode: GAME_MODE.stage,
  tutorialIndex: null,
  stageNumber: 1,
  stageDifficulty: DEFAULT_STAGE_DIFFICULTY,
};

const DEFAULT_RANDOM_STAGE = {
  boardSize: { width: 10, height: 10 },
  playerStart: { x: 1, y: 1 },
  keyPosition: { x: 3, y: 1 },
  goalPosition: { x: 4, y: 3 },
  bombs: [],
  disarmItems: [],
  wallBlocks: [],
  designLabel: "Random Placeholder",
  designNote: "A lightweight placeholder until random generation is requested.",
  instructionText:
    "Random mode placeholder. A full random stage will be prepared only when random mode is requested.",
  keyInitiallyCollected: false,
  mode: GAME_MODE.random,
  tutorialIndex: null,
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
  [MAKER_TOOL.disarm]: "水入りバケツ",
  [MAKER_TOOL.erase]: "消しゴム",
};

const CONTROL_HINT_TEXT =
  "操作: マウスドラッグでマスを塗って閉ループを作ります。Rでリセット、Shift+Rでランダム再生成です。";

const RANDOM_STAGE_INSTRUCTION_TEXT =
  "ランダムモードです。オブジェクトのあるマスを避けて閉ループを作り、プレイヤーを含む空間に鍵とゴールをそろえます。プレイヤーのいない空間では、爆弾と水入りバケツが同数で対消滅します。"
  + CONTROL_HINT_TEXT;

const MAKER_EDIT_INSTRUCTION_TEXT =
  "ステージメーカーの編集モードです。下の配置ツールを選び、キャンバスをクリックしてオブジェクトを置きます。プレイヤー・鍵・ゴールは1つずつ、爆弾・水入りバケツは複数置けます。サイズを変えたら「サイズを適用」、できたら「テストプレイ開始」で動作確認できます。";

const MAKER_TEST_INSTRUCTION_TEXT =
  "ステージメーカーのテストプレイ中です。プレイヤーは移動せず、ループで空間の分かれ方だけを調整します。Rでこの配置を最初から試し直し、「編集に戻る」で配置の調整へ戻れます。";

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
      "プレイヤーと同じ空間に爆弾が入ると、その瞬間にゲームオーバーです。同数の水入りバケツがあっても、プレイヤー空間では助かりません。",
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
      "プレイヤーを含まない空間では、爆弾と水入りバケツが同数だけ入ったときに対消滅します。数が合わないと残ります。",
    designNote:
      "このステージは鍵取得済みです。爆弾2個と水入りバケツ2個をまとめて別空間へ入れて消し、そのあとゴールと同じ空間を作ってみましょう。",
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
      "最後は総合問題です。鍵取得、外側空間、爆弾の危険、水入りバケツの対消滅をまとめて考えます。",
    designNote:
      "まず安全な空間で鍵を取り、その後に爆弾を孤立させるか、プレイヤーのいない空間で水入りバケツと同数にそろえるかを考えてみましょう。",
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

// 近接しすぎないよう、爆弾と水入りバケツを離したベースパターン
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

// 同じ配置でも残す爆弾と水入りバケツを変え、勝ち筋の型を増やす
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
    strategyNote: "爆弾と水入りバケツを同数でまとめて消す",
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
    strategyNote: "危険空間を分断して安全側を確保する",
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
    `水入りバケツ${layout.disarmItems.length}個`,
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
    [MAKER_TOOL.disarm]: "水入りバケツを置くか外します。プレイヤーのいない空間で爆弾と同数なら相殺します。",
    [MAKER_TOOL.wall]: "壁ブロックを置くか外します。描画したループに接続したときだけ、壁の一部として機能します。",
    [MAKER_TOOL.erase]: "爆弾・水入りバケツ・壁ブロックを消します。プレイヤー・鍵・ゴールはそれぞれのツールで動かしてください。",
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

function createInitialState(stage = DEFAULT_START_STAGE) {
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

const initialRandomStage = cloneStageDefinition(DEFAULT_RANDOM_STAGE);
let rememberedRandomStage = initialRandomStage;
let rememberedTutorialIndex = 0;
let rememberedMakerStage = createMakerStage();

const gameState = createInitialState(cloneStageDefinition(DEFAULT_START_STAGE));

function applyStage(stage) {
  const stageJsonState = getStageJsonState();
  const nextStage = cloneStageDefinition(stage);

  if (nextStage.mode === GAME_MODE.tutorial) {
    rememberedTutorialIndex = nextStage.tutorialIndex ?? 0;
  } else if (nextStage.mode === GAME_MODE.maker) {
    rememberedMakerStage = cloneStageDefinition(nextStage);
  } else if (nextStage.mode === getStageModeKey()) {
    stageJsonState.rememberedStage = cloneStageDefinition(nextStage);
    stageJsonState.rememberedStageNumber = nextStage.stageNumber ?? null;
    stageJsonState.rememberedStageDifficulty = normalizeStageDifficulty(
      nextStage.stageDifficulty ?? stageJsonState.selectedDifficulty
    );
    stageJsonState.selectedDifficulty = stageJsonState.rememberedStageDifficulty;
  } else {
    rememberedRandomStage = nextStage;
  }

  Object.assign(gameState, createInitialState(nextStage));
  updateCanvasMetrics(nextStage);
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
  const sourcePoint =
    event.touches?.[0] ??
    event.changedTouches?.[0] ??
    event;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (sourcePoint.clientX - rect.left) * scaleX,
    y: (sourcePoint.clientY - rect.top) * scaleY,
  };
}

function preventTouchBrowserAction(event) {
  if (event.cancelable) {
    event.preventDefault();
  }
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
// それ以外の空間では同数の爆弾と水入りバケツを相殺する。
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
  preventTouchBrowserAction(event);

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

  preventTouchBrowserAction(event);
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

  preventTouchBrowserAction(event);
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

drawWallBlocks = function drawWallBlocksWithIcons() {
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
    `水入りバケツ${gameState.disarmItems.length}個`,
    `壁${gameState.wallBlocks.length}個`,
  ].join(" / ");
}

function buildStageInfoText() {
  if (gameState.mode === GAME_MODE.tutorial) {
    const currentNumber = (gameState.tutorialIndex ?? 0) + 1;
    return `??????? ${currentNumber}/${TUTORIAL_STAGES.length}
${gameState.stage.designNote ?? ""}`.trim();
  }

  if (gameState.mode === getStageModeKey()) {
    const stageDifficulty = normalizeStageDifficulty(
      gameState.stage.stageDifficulty ?? getStageJsonState().selectedDifficulty
    );
    const stageNumberLabel = gameState.stage.stageNumber != null
      ? `${getStageDifficultyLabel(stageDifficulty)} ${formatStageNumber(gameState.stage.stageNumber)}`
      : `${getStageDifficultyLabel(stageDifficulty)} JSON`;
    const detail = gameState.stage.designNote || "???????????????????";
    return `${stageNumberLabel}: ${gameState.stage.designLabel ?? "????????"}
${detail}`;
  }

  if (gameState.mode === GAME_MODE.maker) {
    const boardSize = getStageBoardSize(gameState.stage);
    const modeLabel = gameState.maker.editing ? "???" : "???????";
    return `???????? ${modeLabel} ${boardSize.width}x${boardSize.height}
${buildMakerObjectSummary()}`;
  }

  return `????????
${gameState.stage.designNote ?? ""}`.trim();
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
    [MAKER_TOOL.disarm]: "水入りバケツを置きます。プレイヤーがいない空間で爆弾と同数なら相殺します。",
    [MAKER_TOOL.wall]: "壁ブロックを置きます。描いた線に接続したときだけループ壁として使われます。",
    [MAKER_TOOL.erase]: "爆弾・水入りバケツ・壁ブロックを消します。",
  };

  return hints[tool] ?? "";
}

function buildMakerObjectSummary() {
  return [
    `爆弾${gameState.bombs.length}個`,
    `水入りバケツ${gameState.disarmItems.length}個`,
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
canvas.addEventListener("touchstart", startDrawing, { passive: false });
window.addEventListener("touchmove", updateDrawing, { passive: false });
window.addEventListener("touchend", finishDrawing, { passive: false });
window.addEventListener("touchcancel", finishDrawing, { passive: false });
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

function getStageModeKey() {
  if (!GAME_MODE.stage) {
    GAME_MODE.stage = "stage";
  }

  return GAME_MODE.stage;
}

function getStageJsonState() {
  if (!globalThis.__closedLoopStageJsonState) {
    globalThis.__closedLoopStageJsonState = {
      rememberedStage: null,
      rememberedStageNumber: null,
      rememberedStageDifficulty: DEFAULT_STAGE_DIFFICULTY,
      selectedDifficulty: DEFAULT_STAGE_DIFFICULTY,
      folderStagesByDifficulty: {
        [STAGE_DIFFICULTY.low]: new Map(),
        [STAGE_DIFFICULTY.medium]: new Map(),
        [STAGE_DIFFICULTY.high]: new Map(),
      },
      directoryHandle: null,
      directoryStageNumbersByDifficulty: {
        [STAGE_DIFFICULTY.low]: [],
        [STAGE_DIFFICULTY.medium]: [],
        [STAGE_DIFFICULTY.high]: [],
      },
    };
  }

  return globalThis.__closedLoopStageJsonState;
}

function getStageJsonUi() {
  return {
    stageDifficultySelect: document.getElementById("stageDifficultySelect"),
    stageNumberInput: document.getElementById("stageNumberInput"),
    loadStageButton: document.getElementById("loadStageButton"),
    chooseStageFolderButton: document.getElementById("chooseStageFolderButton"),
    stageFolderInput: document.getElementById("stageFolderInput"),
    stageLoaderStatus: document.getElementById("stageLoaderStatus"),
    makerExportNumberInput: document.getElementById("makerExportNumberInput"),
    makerExportJsonButton: document.getElementById("makerExportJsonButton"),
    makerExportStatus: document.getElementById("makerExportStatus"),
    makerJsonOutput: document.getElementById("makerJsonOutput"),
  };
}

function setStatusText(element, message, isError = false) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

function getDefaultStageLoaderMessage() {
  return globalThis.location?.protocol === "file:"
    ? "Built-in stage JSON can be loaded with the stage folder picker."
    : "Built-in stages such as stage/low/001.json are available.";
}

function setStageLoaderStatus(message, isError = false) {
  const { stageLoaderStatus } = getStageJsonUi();
  setStatusText(stageLoaderStatus, message, isError);
}

function setMakerExportStatus(message, isError = false) {
  const { makerExportStatus } = getStageJsonUi();
  setStatusText(makerExportStatus, message, isError);
}

function formatStageNumber(stageNumber) {
  return String(stageNumber).padStart(3, "0");
}

function normalizeStageDifficulty(value) {
  return Object.prototype.hasOwnProperty.call(STAGE_PACKS, value)
    ? value
    : DEFAULT_STAGE_DIFFICULTY;
}

function getStageDifficultyLabel(stageDifficulty) {
  return STAGE_PACKS[normalizeStageDifficulty(stageDifficulty)].label;
}

function getBuiltInStageNumbers(stageDifficulty) {
  const pack = STAGE_PACKS[normalizeStageDifficulty(stageDifficulty)];
  return Array.from({ length: pack.count }, (_unused, index) => index + 1);
}

function getSelectedStageDifficulty() {
  const stageJsonState = getStageJsonState();
  const { stageDifficultySelect } = getStageJsonUi();
  const stageDifficulty = normalizeStageDifficulty(
    stageDifficultySelect?.value ?? stageJsonState.selectedDifficulty
  );

  stageJsonState.selectedDifficulty = stageDifficulty;
  if (stageDifficultySelect && stageDifficultySelect.value !== stageDifficulty) {
    stageDifficultySelect.value = stageDifficulty;
  }

  return stageDifficulty;
}

function parseSelectedStageFileReference(file, fallbackDifficulty) {
  const relativePath = String(file?.webkitRelativePath ?? "").replace(/\\/g, "/");
  const nestedMatch = /(?:^|\/)(low|medium|high)\/(\d+)\.json$/i.exec(relativePath);

  if (nestedMatch) {
    return {
      stageDifficulty: normalizeStageDifficulty(nestedMatch[1].toLowerCase()),
      stageNumber: Number.parseInt(nestedMatch[2], 10),
    };
  }

  const stageNumber = parseStageNumberFromFileName(file?.name ?? "");
  if (stageNumber === null) {
    return null;
  }

  return {
    stageDifficulty: normalizeStageDifficulty(fallbackDifficulty),
    stageNumber,
  };
}

function parseStageNumber(value) {
  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("Stage number must be an integer greater than or equal to 1.");
  }

  return parsed;
}

function parseStageNumberFromFileName(fileName) {
  const match = /^(\d+)\.json$/i.exec(fileName.trim());

  if (!match) {
    return null;
  }

  const stageNumber = Number.parseInt(match[1], 10);
  return Number.isInteger(stageNumber) && stageNumber > 0 ? stageNumber : null;
}

function getStageFileNameCandidates(stageNumber) {
  return [`${formatStageNumber(stageNumber)}.json`, `${stageNumber}.json`];
}

function normalizeStagePoint(point, label) {
  const x = Number(point?.x);
  const y = Number(point?.y);

  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    throw new Error(`${label} must use integer x / y coordinates.`);
  }

  return { x, y };
}

function normalizeStagePointList(points, label) {
  if (points == null) {
    return [];
  }

  if (!Array.isArray(points)) {
    throw new Error(`${label} must be an array.`);
  }

  return getUniqueCells(
    points.map((point, index) => normalizeStagePoint(point, `${label}[${index}]`))
  );
}

function validateStageDefinitionForJson(stage) {
  const boardSize = getStageBoardSize(stage);
  const entries = [
    ["playerStart", stage.playerStart],
    ["keyPosition", stage.keyPosition],
    ["goalPosition", stage.goalPosition],
    ...stage.bombs.map((point, index) => [`bombs[${index}]`, point]),
    ...stage.disarmItems.map((point, index) => [`disarmItems[${index}]`, point]),
    ...stage.wallBlocks.map((point, index) => [`wallBlocks[${index}]`, point]),
  ];
  const occupiedByKey = new Map();

  for (const [label, point] of entries) {
    if (!isInsideMap(point, boardSize)) {
      throw new Error(`${label} is outside the board.`);
    }

    const pointKey = getCellKey(point);
    if (occupiedByKey.has(pointKey)) {
      throw new Error(`${label} overlaps with ${occupiedByKey.get(pointKey)}.`);
    }

    occupiedByKey.set(pointKey, label);
  }
}

function normalizeStageJsonDefinition(stageJson, stageNumber = null) {
  const boardSize = normalizeBoardSize(stageJson?.boardSize ?? createBoardSize());
  const normalizedStage = {
    boardSize,
    playerStart: normalizeStagePoint(stageJson?.playerStart, "playerStart"),
    keyPosition: normalizeStagePoint(stageJson?.keyPosition, "keyPosition"),
    goalPosition: normalizeStagePoint(stageJson?.goalPosition, "goalPosition"),
    bombs: normalizeStagePointList(stageJson?.bombs, "bombs"),
    disarmItems: normalizeStagePointList(stageJson?.disarmItems, "disarmItems"),
    wallBlocks: normalizeStagePointList(stageJson?.wallBlocks, "wallBlocks"),
    designLabel:
      typeof stageJson?.designLabel === "string" && stageJson.designLabel.trim()
        ? stageJson.designLabel.trim()
        : `ステージ ${formatStageNumber(stageNumber ?? 1)}`,
    designNote: typeof stageJson?.designNote === "string" ? stageJson.designNote : "",
    instructionText:
      typeof stageJson?.instructionText === "string" && stageJson.instructionText.trim()
        ? stageJson.instructionText.trim()
        : "",
    keyInitiallyCollected: Boolean(stageJson?.keyInitiallyCollected),
    mode: getStageModeKey(),
    tutorialIndex: null,
    stageNumber,
  };

  validateStageDefinitionForJson(normalizedStage);
  return normalizedStage;
}

function buildStageJsonDefinition(stage, stageNumber = null) {
  const boardSize = getStageBoardSize(stage);

  return {
    version: 1,
    boardSize: {
      width: boardSize.width,
      height: boardSize.height,
    },
    playerStart: clonePosition(stage.playerStart),
    keyPosition: clonePosition(stage.keyPosition),
    goalPosition: clonePosition(stage.goalPosition),
    bombs: clonePositions(stage.bombs ?? []),
    disarmItems: clonePositions(stage.disarmItems ?? []),
    wallBlocks: clonePositions(stage.wallBlocks ?? []),
    designLabel:
      typeof stage.designLabel === "string" && stage.designLabel.trim()
        ? stage.designLabel
        : `ステージ ${formatStageNumber(stageNumber ?? 1)}`,
    designNote: typeof stage.designNote === "string" ? stage.designNote : "",
    instructionText: typeof stage.instructionText === "string" ? stage.instructionText : "",
    keyInitiallyCollected: Boolean(stage.keyInitiallyCollected),
  };
}

function describeStageNumberList(stageNumbers) {
  if (stageNumbers.length === 0) {
    return "0 stages";
  }

  const preview = stageNumbers.slice(0, 6).map(formatStageNumber).join(", ");
  const suffix = stageNumbers.length > 6 ? " ..." : "";
  return `${stageNumbers.length} stages: ${preview}${suffix}`;
}

function isElementFocused(element) {
  if (!element) {
    return false;
  }

  return document.activeElement === element;
}

function getKnownStageNumbers(stageDifficulty = getSelectedStageDifficulty()) {
  const stageJsonState = getStageJsonState();
  const normalizedDifficulty = normalizeStageDifficulty(stageDifficulty);
  const numbers = new Set([
    ...getBuiltInStageNumbers(normalizedDifficulty),
    ...stageJsonState.folderStagesByDifficulty[normalizedDifficulty].keys(),
    ...stageJsonState.directoryStageNumbersByDifficulty[normalizedDifficulty],
  ]);

  return [...numbers].sort((left, right) => left - right);
}

function refreshStageNumberInputs(resetToFirst = false) {
  const stageNumbers = getKnownStageNumbers();
  const { stageNumberInput, makerExportNumberInput } = getStageJsonUi();

  if (stageNumberInput) {
    const currentValue = Number.parseInt(stageNumberInput.value, 10);
    const nextValue =
      stageNumbers.length > 0 &&
      !resetToFirst &&
      stageNumbers.includes(currentValue)
        ? currentValue
        : stageNumbers[0] ?? 1;

    if (stageNumberInput.tagName === "SELECT") {
      stageNumberInput.innerHTML = stageNumbers
        .map((stageNumber) => {
          const stageNumberLabel = formatStageNumber(stageNumber);
          return `<option value="${stageNumber}">${stageNumberLabel}</option>`;
        })
        .join("");
    }

    if (
      stageNumbers.length > 0 &&
      (resetToFirst || !isElementFocused(stageNumberInput) || stageNumberInput.tagName === "SELECT")
    ) {
      stageNumberInput.value = String(nextValue);
    }
  }

  if (makerExportNumberInput && !isElementFocused(makerExportNumberInput)) {
    const nextStageNumber = stageNumbers.length > 0 ? stageNumbers[stageNumbers.length - 1] + 1 : 1;
    makerExportNumberInput.value = String(nextStageNumber);
  }
}

async function scanStageDirectoryNumbers(directoryHandle) {
  const numbers = [];

  for await (const entry of directoryHandle.values()) {
    if (entry.kind !== "file") {
      continue;
    }

    const stageNumber = parseStageNumberFromFileName(entry.name);
    if (stageNumber !== null) {
      numbers.push(stageNumber);
    }
  }

  return numbers.sort((left, right) => left - right);
}

async function chooseStageFolder() {
  const { stageFolderInput } = getStageJsonUi();

  try {
    if (!stageFolderInput) {
      return;
    }

    if (typeof stageFolderInput.showPicker === "function") {
      stageFolderInput.showPicker();
      return;
    }

    stageFolderInput.click();
  } catch (error) {
    if (error?.name === "AbortError") {
      return;
    }

    setStageLoaderStatus(`Stage folder selection failed: ${error.message}`, true);
  }
}

function buildStageImportSummary(stageJsonState) {
  const parts = [];

  for (const stageDifficulty of Object.values(STAGE_DIFFICULTY)) {
    const numbers = getKnownStageNumbers(stageDifficulty);
    parts.push(`${getStageDifficultyLabel(stageDifficulty)} ${describeStageNumberList(numbers)}`);
  }

  return parts.join(" / ");
}

function handleStageDifficultyChange() {
  const stageDifficulty = getSelectedStageDifficulty();
  refreshStageNumberInputs(true);
  setStageLoaderStatus(`Switched to ${getStageDifficultyLabel(stageDifficulty)} stage list.`);
}

async function handleStageFolderInputChange(event) {
  const stageJsonState = getStageJsonState();
  const files = [...(event.target?.files ?? [])];

  if (files.length === 0) {
    return;
  }

  try {
    const fallbackDifficulty = getSelectedStageDifficulty();
    const nextStageMapsByDifficulty = {
      [STAGE_DIFFICULTY.low]: new Map(),
      [STAGE_DIFFICULTY.medium]: new Map(),
      [STAGE_DIFFICULTY.high]: new Map(),
    };

    for (const file of files) {
      const fileReference = parseSelectedStageFileReference(file, fallbackDifficulty);
      if (!fileReference) {
        continue;
      }

      const targetStageMap = nextStageMapsByDifficulty[fileReference.stageDifficulty];
      if (targetStageMap.has(fileReference.stageNumber)) {
        throw new Error(`${file.name} duplicates another stage number.`);
      }

      const parsedJson = JSON.parse(await file.text());
      targetStageMap.set(
        fileReference.stageNumber,
        normalizeStageJsonDefinition(parsedJson, fileReference.stageNumber)
      );
    }

    const importedStageCount = Object.values(nextStageMapsByDifficulty).reduce(
      (count, stageMap) => count + stageMap.size,
      0
    );

    if (importedStageCount === 0) {
      throw new Error("No readable stage JSON files were found.");
    }

    stageJsonState.directoryHandle = null;
    for (const stageDifficulty of Object.values(STAGE_DIFFICULTY)) {
      const stageMap = nextStageMapsByDifficulty[stageDifficulty];
      if (stageMap.size === 0) {
        continue;
      }

      stageJsonState.folderStagesByDifficulty[stageDifficulty] = stageMap;
      stageJsonState.directoryStageNumbersByDifficulty[stageDifficulty] = [...stageMap.keys()].sort(
        (left, right) => left - right
      );
    }

    setStageLoaderStatus(`Imported stage JSON: ${buildStageImportSummary(stageJsonState)}`);
    refreshStageNumberInputs();
  } catch (error) {
    setStageLoaderStatus(`Stage JSON import failed: ${error.message}`, true);
  } finally {
    if (event.target) {
      event.target.value = "";
    }
  }
}

async function loadStageFromDirectoryHandle(stageNumber, stageDifficulty) {
  const stageJsonState = getStageJsonState();
  const normalizedDifficulty = normalizeStageDifficulty(stageDifficulty);

  if (!stageJsonState.directoryHandle) {
    return null;
  }

  for (const fileName of getStageFileNameCandidates(stageNumber)) {
    try {
      const difficultyDirectory = await stageJsonState.directoryHandle.getDirectoryHandle(
        STAGE_PACKS[normalizedDifficulty].directory
      );
      const fileHandle = await difficultyDirectory.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const parsedJson = JSON.parse(await file.text());
      return normalizeStageJsonDefinition(parsedJson, stageNumber);
    } catch (error) {
      if (error?.name === "NotFoundError") {
        continue;
      }

      throw error;
    }
  }

  return null;
}

async function fetchStageByNumber(stageNumber, stageDifficulty) {
  const normalizedDifficulty = normalizeStageDifficulty(stageDifficulty);

  if (globalThis.location?.protocol === "file:") {
    return null;
  }

  for (const fileName of getStageFileNameCandidates(stageNumber)) {
    const response = await fetch(
      `stage/${STAGE_PACKS[normalizedDifficulty].directory}/${fileName}`,
      { cache: "no-store" }
    ).catch(() => null);
    if (!response || !response.ok) {
      continue;
    }

    const parsedJson = await response.json();
    return normalizeStageJsonDefinition(parsedJson, stageNumber);
  }

  for (const fileName of getStageFileNameCandidates(stageNumber)) {
    const response = await fetch(`stage/${fileName}`, { cache: "no-store" }).catch(() => null);
    if (!response || !response.ok) {
      continue;
    }

    const parsedJson = await response.json();
    return normalizeStageJsonDefinition(parsedJson, stageNumber);
  }

  return null;
}

async function resolveStageByNumber(stageNumber, stageDifficulty) {
  const stageJsonState = getStageJsonState();
  const normalizedDifficulty = normalizeStageDifficulty(stageDifficulty);

  const directoryStage = await loadStageFromDirectoryHandle(stageNumber, normalizedDifficulty);
  if (directoryStage) {
    return directoryStage;
  }

  if (stageJsonState.folderStagesByDifficulty[normalizedDifficulty].has(stageNumber)) {
    return cloneStageDefinition(
      stageJsonState.folderStagesByDifficulty[normalizedDifficulty].get(stageNumber)
    );
  }

  const fetchedStage = await fetchStageByNumber(stageNumber, normalizedDifficulty);
  if (fetchedStage) {
    return fetchedStage;
  }

  if (globalThis.location?.protocol === "file:") {
    throw new Error("Automatic fetch is unavailable for local files. Choose a stage folder and import the JSON files.");
  }

  throw new Error(
    `stage/${STAGE_PACKS[normalizedDifficulty].directory}/${formatStageNumber(stageNumber)}.json was not found.`
  );
}

async function playStageByNumber(stageNumberOverride = null, stageDifficultyOverride = null) {
  const stageJsonState = getStageJsonState();
  const { stageDifficultySelect, stageNumberInput } = getStageJsonUi();

  try {
    const stageDifficulty = normalizeStageDifficulty(
      stageDifficultyOverride ?? stageDifficultySelect?.value ?? stageJsonState.selectedDifficulty
    );
    const stageNumber = Number.isInteger(stageNumberOverride)
      ? stageNumberOverride
      : parseStageNumber(stageNumberInput?.value ?? "1");

    stageJsonState.selectedDifficulty = stageDifficulty;
    if (stageDifficultySelect) {
      stageDifficultySelect.value = stageDifficulty;
    }

    setStageLoaderStatus(
      `${getStageDifficultyLabel(stageDifficulty)} ${formatStageNumber(stageNumber)} is loading...`
    );

    const loadedStage = await resolveStageByNumber(stageNumber, stageDifficulty);
    loadedStage.mode = getStageModeKey();
    loadedStage.stageNumber = stageNumber;
    loadedStage.stageDifficulty = stageDifficulty;
    if (!loadedStage.designLabel) {
      loadedStage.designLabel = `${getStageDifficultyLabel(stageDifficulty)} ${formatStageNumber(stageNumber)}`;
    }

    applyStage(loadedStage);
    if (stageNumberInput) {
      stageNumberInput.value = String(stageNumber);
    }
    refreshStageNumberInputs();
    setStageLoaderStatus(
      `${getStageDifficultyLabel(stageDifficulty)} ${formatStageNumber(stageNumber)} loaded.`
    );
  } catch (error) {
    setStageLoaderStatus(error.message, true);
  }
}

function downloadJsonFile(fileName, jsonText) {
  const blob = new Blob([jsonText], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function saveStageJsonFile(fileName, jsonText) {
  const stageJsonState = getStageJsonState();

  if (stageJsonState.directoryHandle) {
    try {
      const fileHandle = await stageJsonState.directoryHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(jsonText);
      await writable.close();

      const stageNumber = parseStageNumberFromFileName(fileName);
      const stageDifficulty = getSelectedStageDifficulty();
      if (
        stageNumber !== null &&
        !stageJsonState.directoryStageNumbersByDifficulty[stageDifficulty].includes(stageNumber)
      ) {
        stageJsonState.directoryStageNumbersByDifficulty[stageDifficulty].push(stageNumber);
        stageJsonState.directoryStageNumbersByDifficulty[stageDifficulty].sort(
          (left, right) => left - right
        );
      }

      return "directory";
    } catch (_error) {
      stageJsonState.directoryHandle = null;
      stageJsonState.directoryStageNumbersByDifficulty[getSelectedStageDifficulty()] = [];
    }
  }

  downloadJsonFile(fileName, jsonText);
  return "download";
}

async function exportMakerStageJson() {
  if (gameState.mode !== GAME_MODE.maker) {
    return;
  }

  const { makerExportNumberInput, makerJsonOutput } = getStageJsonUi();

  try {
    const stageNumber = parseStageNumber(makerExportNumberInput?.value ?? "1");
    const stageJson = buildStageJsonDefinition(gameState.stage, stageNumber);
    const jsonText = `${JSON.stringify(stageJson, null, 2)}\n`;
    const fileName = `${formatStageNumber(stageNumber)}.json`;

    if (makerJsonOutput) {
      makerJsonOutput.value = jsonText;
    }

    const saveMode = await saveStageJsonFile(fileName, jsonText);

    setMakerExportStatus(
      saveMode === "directory"
        ? `${fileName} を接続中のフォルダへ保存しました。`
        : `${fileName} をダウンロードしました。必要なら stage フォルダへ移動してください。`
    );

    refreshStageNumberInputs();
  } catch (error) {
    setMakerExportStatus(`JSON出力に失敗しました: ${error.message}`, true);
  }
}

function applyStage(stage) {
  const stageJsonState = getStageJsonState();
  const nextStage = cloneStageDefinition(stage);

  if (nextStage.mode === GAME_MODE.tutorial) {
    rememberedTutorialIndex = nextStage.tutorialIndex ?? 0;
  } else if (nextStage.mode === GAME_MODE.maker) {
    rememberedMakerStage = cloneStageDefinition(nextStage);
  } else if (nextStage.mode === getStageModeKey()) {
    stageJsonState.rememberedStage = cloneStageDefinition(nextStage);
    stageJsonState.rememberedStageNumber = nextStage.stageNumber ?? null;
    stageJsonState.rememberedStageDifficulty = normalizeStageDifficulty(
      nextStage.stageDifficulty ?? stageJsonState.selectedDifficulty
    );
    stageJsonState.selectedDifficulty = stageJsonState.rememberedStageDifficulty;
  } else {
    rememberedRandomStage = nextStage;
  }

  Object.assign(gameState, createInitialState(nextStage));
  updateCanvasMetrics(nextStage);
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

  if (mode === getStageModeKey()) {
    const rememberedStage = getStageJsonState().rememberedStage;
    if (rememberedStage) {
      applyStage(cloneStageDefinition(rememberedStage));
    }
    return;
  }

  applyStage(cloneStageDefinition(ensureRememberedRandomStageReady()));
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

  if (gameState.mode === getStageModeKey()) {
    const rememberedStage = getStageJsonState().rememberedStage ?? gameState.stage;
    applyStage(cloneStageDefinition(rememberedStage));
    return;
  }

  const nextRandomStage = ensureRememberedRandomStageReady(regenerateStage);
  applyStage(cloneStageDefinition(nextRandomStage));
}

function getMakerToolHint(tool) {
  const hints = {
    [MAKER_TOOL.player]: "プレイヤーの開始位置を置きます。ループの中だけ移動できます。",
    [MAKER_TOOL.key]: "鍵を置きます。プレイヤーと同じ空間に入ると取得されます。",
    [MAKER_TOOL.goal]: "ゴールを置きます。鍵取得後に同じ空間へ入るとクリアです。",
    [MAKER_TOOL.bomb]: "爆弾を置きます。プレイヤーと同じ空間に入ると即ゲームオーバーです。",
    [MAKER_TOOL.disarm]: "水入りバケツを置きます。プレイヤーのいない空間で爆弾と同数なら対消滅します。",
    [MAKER_TOOL.wall]: "壁ブロックを置きます。線は通れず、ループの切り方も変わります。",
    [MAKER_TOOL.erase]: "爆弾、水入りバケツ、壁ブロックを消します。",
  };

  return hints[tool] ?? "";
}

function buildMakerObjectSummary() {
  return [
    `爆弾${gameState.bombs.length}個`,
    `水入りバケツ${gameState.disarmItems.length}個`,
    `壁${gameState.wallBlocks.length}個`,
  ].join(" / ");
}

function buildStageInfoText() {
  if (gameState.mode === GAME_MODE.tutorial) {
    const currentNumber = (gameState.tutorialIndex ?? 0) + 1;
    return `??????? ${currentNumber}/${TUTORIAL_STAGES.length}\n${gameState.stage.designNote ?? ""}`.trim();
  }

  if (gameState.mode === getStageModeKey()) {
    const stageDifficulty = normalizeStageDifficulty(
      gameState.stage.stageDifficulty ?? getStageJsonState().selectedDifficulty
    );
    const stageNumberLabel = gameState.stage.stageNumber != null
      ? `${getStageDifficultyLabel(stageDifficulty)} ${formatStageNumber(gameState.stage.stageNumber)}`
      : `${getStageDifficultyLabel(stageDifficulty)} JSON`;
    const detail = gameState.stage.designNote || "???????????????????";
    return `${stageNumberLabel}: ${gameState.stage.designLabel ?? "????????"}\n${detail}`;
  }

  if (gameState.mode === GAME_MODE.maker) {
    const boardSize = getStageBoardSize(gameState.stage);
    const modeLabel = gameState.maker.editing ? "???" : "???????";
    return `???????? ${modeLabel} ${boardSize.width}x${boardSize.height}\n${buildMakerObjectSummary()}`;
  }

  return `????????\n${gameState.stage.designNote ?? ""}`.trim();
}

function getHudInstructionText() {
  if (gameState.mode === GAME_MODE.maker) {
    return gameState.maker.editing
      ? "配置ツールを選んでキャンバスをクリックするとオブジェクトを置けます。"
      : "テストプレイ中です。矢印キーまたはWASDで移動し、ループの判定を確認してください。";
  }

  if (gameState.mode === GAME_MODE.tutorial) {
    return gameState.stage.instructionText || "チュートリアルステージです。ルールを順番に確認できます。";
  }

  if (gameState.mode === getStageModeKey()) {
    return gameState.stage.instructionText || "番号指定で読み込んだJSONステージです。";
  }

  return gameState.stage.instructionText || RANDOM_STAGE_INSTRUCTION_TEXT;
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

  return canPlayerMoveInCurrentSpace() ? "移動可能" : "ループ外のため移動不可";
}

function syncHud() {
  const isTutorialMode = gameState.mode === GAME_MODE.tutorial;
  const isMakerMode = gameState.mode === GAME_MODE.maker;
  const { makerExportNumberInput, makerExportJsonButton, makerJsonOutput } = getStageJsonUi();

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
      : "テストプレイ中です。配置を直したいときは「編集に戻る」を使ってください。";

    if (makerExportNumberInput) {
      makerExportNumberInput.disabled = false;
    }

    if (makerExportJsonButton) {
      makerExportJsonButton.disabled = false;
    }

    if (makerJsonOutput) {
      makerJsonOutput.hidden = false;
    }

    for (const [tool, button] of Object.entries(makerToolButtons)) {
      if (!button) {
        continue;
      }

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

async function handleStageNumberEnter(event) {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  await playStageByNumber();
}

getStageModeKey();
setStageLoaderStatus(getDefaultStageLoaderMessage());
refreshStageNumberInputs();
globalThis.closedLoopDebug.loadStageByNumber = playStageByNumber;
globalThis.closedLoopDebug.exportMakerStageJson = exportMakerStageJson;
getStageJsonUi().stageDifficultySelect?.addEventListener("change", () => {
  handleStageDifficultyChange();
});
getStageJsonUi().loadStageButton?.addEventListener("click", () => {
  void playStageByNumber();
});
getStageJsonUi().chooseStageFolderButton?.addEventListener("click", () => {
  void chooseStageFolder();
});
getStageJsonUi().stageFolderInput?.addEventListener("change", (event) => {
  void handleStageFolderInputChange(event);
});
getStageJsonUi().stageNumberInput?.addEventListener("change", () => {
  void playStageByNumber();
});
getStageJsonUi().makerExportJsonButton?.addEventListener("click", () => {
  void exportMakerStageJson();
});
render();
if (globalThis.location?.protocol !== "file:") {
  void playStageByNumber(1, DEFAULT_STAGE_DIFFICULTY);
}

const AUTO_SOLVER_CONFIG = {
  maxSteps: 6,
  maxVisitedStates: 4000,
  maxRectanglePerimeter: 52,
  buildYieldInterval: 240,
  searchYieldInterval: 18,
  animationMoveMs: 70,
  animationLoopPreviewMs: 140,
  animationLoopApplyMs: 220,
};

function getMakerAutoSolveState() {
  if (!globalThis.__closedLoopMakerAutoSolveState) {
    globalThis.__closedLoopMakerAutoSolveState = {
      running: false,
      runId: 0,
      message: "",
      error: false,
      cacheByStageKey: new Map(),
      lastSolution: null,
    };
  }

  return globalThis.__closedLoopMakerAutoSolveState;
}

function getMakerAutoSolveUi() {
  return {
    button: document.getElementById("makerAutoSolveButton"),
    status: document.getElementById("makerSolveStatus"),
  };
}

function setMakerAutoSolveStatus(message, isError = false) {
  const autoSolveState = getMakerAutoSolveState();
  autoSolveState.message = message;
  autoSolveState.error = isError;

  const { status } = getMakerAutoSolveUi();
  setStatusText(status, message, isError);
}

function syncMakerAutoSolveHud() {
  const autoSolveState = getMakerAutoSolveState();
  const { button, status } = getMakerAutoSolveUi();
  const isMakerMode = gameState.mode === GAME_MODE.maker;

  if (button) {
    button.disabled = !isMakerMode || autoSolveState.running;
    button.textContent = autoSolveState.running ? "自動解法中..." : "自動で解く";
  }

  if (status) {
    status.hidden = !isMakerMode;
    setStatusText(status, autoSolveState.message, autoSolveState.error);
  }
}

function cancelMakerAutoSolve(message = "") {
  const autoSolveState = getMakerAutoSolveState();

  if (!autoSolveState.running) {
    return false;
  }

  autoSolveState.running = false;
  autoSolveState.runId += 1;

  if (message) {
    setMakerAutoSolveStatus(message, false);
  }

  render();
  return true;
}

function waitForAutoSolveTick(delayMs = 0) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, delayMs);
  });
}

function isAutoSolveRunCancelled(runId) {
  const autoSolveState = getMakerAutoSolveState();
  return autoSolveState.runId !== runId;
}

function buildPolylineCells(vertices) {
  if (vertices.length === 0) {
    return [];
  }

  const cells = [clonePosition(vertices[0])];

  for (let index = 1; index < vertices.length; index += 1) {
    const previous = vertices[index - 1];
    const current = vertices[index];

    if (previous.x !== current.x && previous.y !== current.y) {
      return [];
    }

    cells.push(...buildCellSegment(previous, current));
  }

  return getUniqueCells(cells);
}

function createAutoSolveCandidateKey(stage) {
  const boardSize = getStageBoardSize(stage);
  const wallSignature = clonePositions(stage.wallBlocks ?? [])
    .sort(compareGridPositions)
    .map(getCellKey)
    .join("|");

  return `${boardSize.width}x${boardSize.height}|${wallSignature}`;
}

function createAutoSolveCandidate(loop, drawnCells, kind) {
  const cellsBySpaceId = new Map();
  const cellKeySetBySpaceId = new Map();
  const cellSignatureBySpaceId = new Map();

  for (const space of loop.spaces) {
    const cells = clonePositions(space.cells);
    cellsBySpaceId.set(space.id, cells);
    cellKeySetBySpaceId.set(space.id, new Set(cells.map(getCellKey)));
    cellSignatureBySpaceId.set(
      space.id,
      cells.map(getCellKey).sort().join("|")
    );
  }

  return {
    kind,
    drawnCells: clonePositions(drawnCells),
    drawnCellKeys: new Set(drawnCells.map(getCellKey)),
    lineCells: clonePositions(loop.lineCells),
    lineCellKeys: new Set(loop.lineCells.map(getCellKey)),
    lineCellCount: loop.lineCells.length,
    spaces: loop.spaces.map((space) => ({
      id: space.id,
      kind: space.kind,
      touchesBorder: space.touchesBorder,
      cells: cellsBySpaceId.get(space.id),
    })),
    cellsBySpaceId,
    cellKeySetBySpaceId,
    cellSignatureBySpaceId,
    spaceByCellKey: new Map(loop.spaceByCellKey),
    usesOuterWall: loop.usesOuterWall,
  };
}

function addAutoSolveCandidate(candidateMap, stage, drawnCells, kind) {
  if (drawnCells.length === 0) {
    return;
  }

  const loop = buildLoopFromCells(
    drawnCells,
    getStageBoardSize(stage),
    stage.wallBlocks ?? []
  );

  if (!loop) {
    return;
  }

  const signature = [...loop.lineCellKeys].sort().join("|");
  if (candidateMap.has(signature)) {
    return;
  }

  candidateMap.set(signature, createAutoSolveCandidate(loop, drawnCells, kind));
}

function buildRectangleLoopCells(left, top, right, bottom) {
  return buildPolylineCells([
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
    { x: left, y: top },
  ]);
}

function buildAutoSolveBorderCells(boardSize) {
  const borderCells = [];

  for (let x = 0; x < boardSize.width; x += 1) {
    borderCells.push({ x, y: 0 });
    if (boardSize.height > 1) {
      borderCells.push({ x, y: boardSize.height - 1 });
    }
  }

  for (let y = 1; y < boardSize.height - 1; y += 1) {
    borderCells.push({ x: 0, y });
    if (boardSize.width > 1) {
      borderCells.push({ x: boardSize.width - 1, y });
    }
  }

  return getUniqueCells(borderCells).sort(compareGridPositions);
}

function getBorderSideName(cell, boardSize) {
  if (cell.y === 0) {
    return "top";
  }

  if (cell.x === boardSize.width - 1) {
    return "right";
  }

  if (cell.y === boardSize.height - 1) {
    return "bottom";
  }

  return "left";
}

async function buildAutoSolveCandidates(stage, runId = null) {
  const autoSolveState = getMakerAutoSolveState();
  const cacheKey = createAutoSolveCandidateKey(stage);
  if (autoSolveState.cacheByStageKey.has(cacheKey)) {
    return autoSolveState.cacheByStageKey.get(cacheKey);
  }

  const candidateMap = new Map();
  const boardSize = getStageBoardSize(stage);
  const borderCells = buildAutoSolveBorderCells(boardSize);
  let generatedCount = 0;

  for (let top = 0; top < boardSize.height - 2; top += 1) {
    for (let left = 0; left < boardSize.width - 2; left += 1) {
      for (let bottom = top + 2; bottom < boardSize.height; bottom += 1) {
        for (let right = left + 2; right < boardSize.width; right += 1) {
          const perimeter =
            2 * ((right - left + 1) + (bottom - top + 1)) - 4;
          if (perimeter > AUTO_SOLVER_CONFIG.maxRectanglePerimeter) {
            continue;
          }

          addAutoSolveCandidate(
            candidateMap,
            stage,
            buildRectangleLoopCells(left, top, right, bottom),
            "rectangle"
          );
          generatedCount += 1;

          if (generatedCount % AUTO_SOLVER_CONFIG.buildYieldInterval === 0) {
            if (runId !== null && isAutoSolveRunCancelled(runId)) {
              return [];
            }

            await waitForAutoSolveTick();
          }
        }
      }
    }
  }

  for (let startIndex = 0; startIndex < borderCells.length; startIndex += 1) {
    const startCell = borderCells[startIndex];
    const startSide = getBorderSideName(startCell, boardSize);

    for (let endIndex = startIndex + 1; endIndex < borderCells.length; endIndex += 1) {
      const endCell = borderCells[endIndex];
      const endSide = getBorderSideName(endCell, boardSize);

      addAutoSolveCandidate(
        candidateMap,
        stage,
        buildPolylineCells([startCell, endCell]),
        "border-straight"
      );
      generatedCount += 1;

      if (startCell.x !== endCell.x && startCell.y !== endCell.y) {
        addAutoSolveCandidate(
          candidateMap,
          stage,
          buildPolylineCells([
            startCell,
            { x: startCell.x, y: endCell.y },
            endCell,
          ]),
          "border-bend"
        );
        addAutoSolveCandidate(
          candidateMap,
          stage,
          buildPolylineCells([
            startCell,
            { x: endCell.x, y: startCell.y },
            endCell,
          ]),
          "border-bend"
        );
        generatedCount += 2;
      }

      if (
        (startSide === "top" && endSide === "top") ||
        (startSide === "bottom" && endSide === "bottom")
      ) {
        const innerYRange =
          startSide === "top"
            ? { from: 1, to: boardSize.height - 2 }
            : { from: 0, to: boardSize.height - 2 };

        for (let innerY = innerYRange.from; innerY <= innerYRange.to; innerY += 1) {
          addAutoSolveCandidate(
            candidateMap,
            stage,
            buildPolylineCells([
              startCell,
              { x: startCell.x, y: innerY },
              { x: endCell.x, y: innerY },
              endCell,
            ]),
            "border-u"
          );
          generatedCount += 1;
        }
      }

      if (
        (startSide === "left" && endSide === "left") ||
        (startSide === "right" && endSide === "right")
      ) {
        const innerXRange =
          startSide === "left"
            ? { from: 1, to: boardSize.width - 2 }
            : { from: 0, to: boardSize.width - 2 };

        for (let innerX = innerXRange.from; innerX <= innerXRange.to; innerX += 1) {
          addAutoSolveCandidate(
            candidateMap,
            stage,
            buildPolylineCells([
              startCell,
              { x: innerX, y: startCell.y },
              { x: innerX, y: endCell.y },
              endCell,
            ]),
            "border-u"
          );
          generatedCount += 1;
        }
      }

      const oppositeVertical =
        (startSide === "top" && endSide === "bottom") ||
        (startSide === "bottom" && endSide === "top");
      const oppositeHorizontal =
        (startSide === "left" && endSide === "right") ||
        (startSide === "right" && endSide === "left");

      if (oppositeVertical) {
        for (let innerY = 1; innerY < boardSize.height - 1; innerY += 1) {
          addAutoSolveCandidate(
            candidateMap,
            stage,
            buildPolylineCells([
              startCell,
              { x: startCell.x, y: innerY },
              { x: endCell.x, y: innerY },
              endCell,
            ]),
            "border-bridge"
          );
          generatedCount += 1;
        }
      }

      if (oppositeHorizontal) {
        for (let innerX = 1; innerX < boardSize.width - 1; innerX += 1) {
          addAutoSolveCandidate(
            candidateMap,
            stage,
            buildPolylineCells([
              startCell,
              { x: innerX, y: startCell.y },
              { x: innerX, y: endCell.y },
              endCell,
            ]),
            "border-bridge"
          );
          generatedCount += 1;
        }
      }

      if (generatedCount % AUTO_SOLVER_CONFIG.buildYieldInterval === 0) {
        if (runId !== null && isAutoSolveRunCancelled(runId)) {
          return [];
        }

        await waitForAutoSolveTick();
      }
    }
  }

  const candidates = [...candidateMap.values()].sort((left, right) => {
    if (left.lineCellCount !== right.lineCellCount) {
      return left.lineCellCount - right.lineCellCount;
    }

    if (left.usesOuterWall !== right.usesOuterWall) {
      return left.usesOuterWall ? -1 : 1;
    }

    return left.drawnCells.length - right.drawnCells.length;
  });

  autoSolveState.cacheByStageKey.set(cacheKey, candidates);
  return candidates;
}

function createAutoSolveSearchState(stage) {
  const playerStart = clonePosition(stage.playerStart);
  const reachableCells = [playerStart];
  return {
    reachableCells,
    reachableSignature: reachableCells.map(getCellKey).join("|"),
    keyCollected: Boolean(stage.keyInitiallyCollected),
    bombs: clonePositions(stage.bombs),
    disarmItems: clonePositions(stage.disarmItems),
    clear: false,
    history: [],
  };
}

function serializeAutoSolveSearchState(state) {
  const bombSignature = clonePositions(state.bombs)
    .sort(compareGridPositions)
    .map(getCellKey)
    .join("|");
  const disarmSignature = clonePositions(state.disarmItems)
    .sort(compareGridPositions)
    .map(getCellKey)
    .join("|");

  return [
    state.keyCollected ? "1" : "0",
    state.reachableSignature,
    bombSignature,
    disarmSignature,
  ].join("||");
}

function getLoopSpaceIdFromPosition(loopCandidate, position) {
  if (loopCandidate.lineCellKeys.has(getCellKey(position))) {
    return null;
  }

  return loopCandidate.spaceByCellKey.get(getCellKey(position)) ?? null;
}

function groupPositionsByLoopSpaceForAutoSolve(positions, loopCandidate) {
  const grouped = new Map();

  for (const position of positions) {
    const spaceId = getLoopSpaceIdFromPosition(loopCandidate, position);
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

function buildAutoSolveForbiddenKeys(stage, searchState) {
  const forbiddenKeys = new Set([
    getCellKey(stage.goalPosition),
    ...searchState.bombs.map(getCellKey),
    ...searchState.disarmItems.map(getCellKey),
  ]);

  if (!searchState.keyCollected) {
    forbiddenKeys.add(getCellKey(stage.keyPosition));
  }

  return forbiddenKeys;
}

function canAutoSolveCandidateBeDrawn(loopCandidate, forbiddenKeys) {
  for (const cellKey of forbiddenKeys) {
    if (loopCandidate.lineCellKeys.has(cellKey)) {
      return false;
    }
  }

  return true;
}

function collectAutoSolveReachableSpaces(searchState, loopCandidate) {
  const reachableSpaces = new Map();

  for (const cell of searchState.reachableCells) {
    const spaceId = getLoopSpaceIdFromPosition(loopCandidate, cell);
    if (spaceId === null || reachableSpaces.has(spaceId)) {
      continue;
    }

    reachableSpaces.set(spaceId, clonePosition(cell));
  }

  return reachableSpaces;
}

function buildAutoSolveNextState(stage, currentState, loopCandidate, spaceId, anchorCell) {
  const bombsBySpace = groupPositionsByLoopSpaceForAutoSolve(
    currentState.bombs,
    loopCandidate
  );
  const disarmBySpace = groupPositionsByLoopSpaceForAutoSolve(
    currentState.disarmItems,
    loopCandidate
  );
  const bombsInPlayerSpace = bombsBySpace.get(spaceId) || [];

  if (bombsInPlayerSpace.length > 0) {
    return null;
  }

  const removedBombKeys = new Set();
  const removedDisarmKeys = new Set();
  const allSpaceIds = new Set([
    ...bombsBySpace.keys(),
    ...disarmBySpace.keys(),
  ]);

  for (const targetSpaceId of allSpaceIds) {
    if (targetSpaceId === spaceId) {
      continue;
    }

    const bombsInSpace = bombsBySpace.get(targetSpaceId) || [];
    const disarmInSpace = disarmBySpace.get(targetSpaceId) || [];

    if (bombsInSpace.length > 0 && bombsInSpace.length === disarmInSpace.length) {
      for (const bomb of bombsInSpace) {
        removedBombKeys.add(getCellKey(bomb));
      }

      for (const item of disarmInSpace) {
        removedDisarmKeys.add(getCellKey(item));
      }
    }
  }

  const nextBombs = currentState.bombs.filter(
    (bomb) => !removedBombKeys.has(getCellKey(bomb))
  );
  const nextDisarmItems = currentState.disarmItems.filter(
    (item) => !removedDisarmKeys.has(getCellKey(item))
  );
  const nextKeyCollected =
    currentState.keyCollected ||
    getLoopSpaceIdFromPosition(loopCandidate, stage.keyPosition) === spaceId;
  const goalSharesPlayerSpace =
    getLoopSpaceIdFromPosition(loopCandidate, stage.goalPosition) === spaceId;
  const nextReachableCells = clonePositions(
    loopCandidate.cellsBySpaceId.get(spaceId) ?? []
  );
  const nextReachableSignature = nextReachableCells
    .map(getCellKey)
    .sort()
    .join("|");

  if (
    nextReachableSignature === currentState.reachableSignature &&
    nextKeyCollected === currentState.keyCollected &&
    nextBombs.length === currentState.bombs.length &&
    nextDisarmItems.length === currentState.disarmItems.length
  ) {
    return null;
  }

  return {
    reachableCells: nextReachableCells,
    reachableSignature: nextReachableSignature,
    keyCollected: nextKeyCollected,
    bombs: nextBombs,
    disarmItems: nextDisarmItems,
    clear: nextKeyCollected && goalSharesPlayerSpace,
    history: [
      ...currentState.history,
      {
        anchorCell: clonePosition(anchorCell),
        drawnCells: clonePositions(loopCandidate.drawnCells),
        kind: loopCandidate.kind,
      },
    ],
  };
}

async function findStageAutoSolveSolution(stage, runId = null) {
  const candidates = await buildAutoSolveCandidates(stage, runId);
  if (runId !== null && isAutoSolveRunCancelled(runId)) {
    return null;
  }

  const initialState = createAutoSolveSearchState(stage);
  const queue = [initialState];
  const visitedStates = new Set([serializeAutoSolveSearchState(initialState)]);
  let exploredStates = 0;

  while (queue.length > 0 && visitedStates.size <= AUTO_SOLVER_CONFIG.maxVisitedStates) {
    if (runId !== null && isAutoSolveRunCancelled(runId)) {
      return null;
    }

    const currentState = queue.shift();
    exploredStates += 1;

    if (exploredStates % AUTO_SOLVER_CONFIG.searchYieldInterval === 0) {
      setMakerAutoSolveStatus(
        `自動解法を探索中... ${exploredStates}状態 / ${visitedStates.size}記録`
      );
      render();
      await waitForAutoSolveTick();
    }

    if (currentState.clear) {
      return currentState.history;
    }

    if (currentState.history.length >= AUTO_SOLVER_CONFIG.maxSteps) {
      continue;
    }

    const forbiddenKeys = buildAutoSolveForbiddenKeys(stage, currentState);

    for (const loopCandidate of candidates) {
      if (!canAutoSolveCandidateBeDrawn(loopCandidate, forbiddenKeys)) {
        continue;
      }

      const reachableSpaces = collectAutoSolveReachableSpaces(
        currentState,
        loopCandidate
      );

      if (reachableSpaces.size === 0) {
        continue;
      }

      for (const [spaceId, anchorCell] of reachableSpaces) {
        const nextState = buildAutoSolveNextState(
          stage,
          currentState,
          loopCandidate,
          spaceId,
          anchorCell
        );

        if (!nextState) {
          continue;
        }

        if (nextState.clear) {
          return nextState.history;
        }

        const signature = serializeAutoSolveSearchState(nextState);
        if (visitedStates.has(signature)) {
          continue;
        }

        visitedStates.add(signature);
        queue.push(nextState);
      }
    }
  }

  return null;
}

function findPathWithinAllowedCells(startCell, goalCell, allowedCellKeys) {
  const startKey = getCellKey(startCell);
  const goalKey = getCellKey(goalCell);

  if (startKey === goalKey) {
    return [clonePosition(startCell)];
  }

  const queue = [clonePosition(startCell)];
  const visitedKeys = new Set([startKey]);
  const parentByKey = new Map();

  while (queue.length > 0) {
    const current = queue.shift();

    for (const neighbor of getCellNeighbors(current, activeBoardSize)) {
      const neighborKey = getCellKey(neighbor);
      if (!allowedCellKeys.has(neighborKey) || visitedKeys.has(neighborKey)) {
        continue;
      }

      parentByKey.set(neighborKey, current);
      if (neighborKey === goalKey) {
        const path = [clonePosition(goalCell)];
        let cursor = current;

        while (cursor) {
          path.push(clonePosition(cursor));
          const parentKey = getCellKey(cursor);
          cursor = parentByKey.get(parentKey) ?? null;
        }

        return path.reverse();
      }

      visitedKeys.add(neighborKey);
      queue.push(neighbor);
    }
  }

  return null;
}

async function movePlayerAlongPath(path, runId) {
  for (let index = 1; index < path.length; index += 1) {
    if (isAutoSolveRunCancelled(runId)) {
      return false;
    }

    gameState.player = clonePosition(path[index]);
    render();
    await waitForAutoSolveTick(AUTO_SOLVER_CONFIG.animationMoveMs);
  }

  return true;
}

function clearLoopStateWithoutRender() {
  gameState.loop = null;
  gameState.drawing.active = false;
  gameState.drawing.cells = [];
  gameState.playerSpaceId = null;
  gameState.playerInsideLoop = false;
  gameState.goalInsideLoop = false;
  gameState.goalSharesPlayerSpace = false;
  gameState.explodedBombs = [];
  updateStatus();
}

async function playAutoSolveSolution(stage, solution, runId) {
  applyStage(cloneStageDefinition(stage));

  for (const step of solution) {
    if (isAutoSolveRunCancelled(runId)) {
      return false;
    }

    const movementAllowedKeys =
      gameState.loop && gameState.playerSpaceId !== null
        ? new Set(
            (gameState.loop.spaces.find(
              (space) => space.id === gameState.playerSpaceId
            )?.cells ?? []).map(getCellKey)
          )
        : new Set([getCellKey(gameState.player)]);
    const movementPath = findPathWithinAllowedCells(
      gameState.player,
      step.anchorCell,
      movementAllowedKeys
    );

    if (!movementPath) {
      return false;
    }

    const moved = await movePlayerAlongPath(movementPath, runId);
    if (!moved || isAutoSolveRunCancelled(runId)) {
      return false;
    }

    clearLoopStateWithoutRender();
    gameState.drawing.active = true;
    gameState.drawing.cells = clonePositions(step.drawnCells);
    updateStatus();
    render();
    await waitForAutoSolveTick(AUTO_SOLVER_CONFIG.animationLoopPreviewMs);

    if (isAutoSolveRunCancelled(runId)) {
      return false;
    }

    const nextLoop = buildLoopFromCells(
      step.drawnCells,
      activeBoardSize,
      gameState.wallBlocks
    );
    if (!nextLoop) {
      return false;
    }

    gameState.loop = nextLoop;
    gameState.drawing.active = false;
    gameState.drawing.cells = [];
    applyLoopEffects();
    render();
    await waitForAutoSolveTick(AUTO_SOLVER_CONFIG.animationLoopApplyMs);
  }

  return gameState.clear;
}

buildRandomStagePool = function buildHardRandomStagePoolFinal(scoredLayouts) {
  const analyzedCandidates = [];
  const preferredCandidates = [];
  const fallbackCandidates = [];
  let narrowPreferredCount = 0;

  for (const candidate of scoredLayouts) {
    const analysis = analyzeRandomStageLayout(candidate.layout);
    if (!analysis.solvable) {
      continue;
    }

    const analyzedCandidate = {
      ...candidate,
      analysis,
      finalScore: candidate.score + analysis.difficultyScore,
    };

    analyzedCandidates.push(analyzedCandidate);

    if (analysis.minSteps >= HARD_RANDOM_STAGE_CONFIG.preferredMinSteps) {
      preferredCandidates.push(analyzedCandidate);

      if (
        analysis.winningFirstMoves <=
          HARD_RANDOM_STAGE_CONFIG.preferredMaxWinningFirstMoves &&
        analysis.forcedStepCount >=
          HARD_RANDOM_STAGE_CONFIG.preferredMinForcedSteps
      ) {
        narrowPreferredCount += 1;
      }
    }

    if (analysis.minSteps >= HARD_RANDOM_STAGE_CONFIG.fallbackMinSteps) {
      fallbackCandidates.push(analyzedCandidate);
    }

    if (
      analyzedCandidates.length >= HARD_RANDOM_STAGE_CONFIG.maxAnalyzedCandidates &&
      preferredCandidates.length >= CONFIG.randomStageChoiceCount
    ) {
      break;
    }
  }

  const narrowPreferredCandidates = preferredCandidates.filter(
    (candidate) =>
      candidate.analysis.winningFirstMoves <=
        HARD_RANDOM_STAGE_CONFIG.preferredMaxWinningFirstMoves &&
      candidate.analysis.forcedStepCount >=
        HARD_RANDOM_STAGE_CONFIG.preferredMinForcedSteps
  );
  const candidateSource = narrowPreferredCandidates.length > 0
    ? narrowPreferredCandidates
    : preferredCandidates.length >= CONFIG.randomStageChoiceCount
      ? preferredCandidates
      : fallbackCandidates.length >= CONFIG.randomStageChoiceCount
        ? fallbackCandidates
        : analyzedCandidates;
  const sortedCandidates = [...candidateSource].sort((left, right) => {
    if (left.analysis.minSteps !== right.analysis.minSteps) {
      return right.analysis.minSteps - left.analysis.minSteps;
    }

    if (left.analysis.forcedStepCount !== right.analysis.forcedStepCount) {
      return right.analysis.forcedStepCount - left.analysis.forcedStepCount;
    }

    if (left.analysis.winningFirstMoves !== right.analysis.winningFirstMoves) {
      return left.analysis.winningFirstMoves - right.analysis.winningFirstMoves;
    }

    if (left.analysis.decoyFirstMoves !== right.analysis.decoyFirstMoves) {
      return right.analysis.decoyFirstMoves - left.analysis.decoyFirstMoves;
    }

    return right.finalScore - left.finalScore;
  });
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

  for (const candidate of sortedCandidates) {
    if (pool.length >= CONFIG.randomStageChoiceCount) {
      break;
    }

    const style = candidate.layout.solutionStyle ?? "mixed";
    if (!coveredStyles.has(style)) {
      tryAddCandidate(candidate);
    }
  }

  for (const candidate of sortedCandidates) {
    if (pool.length >= CONFIG.randomStageChoiceCount) {
      break;
    }

    const family = candidate.layout.familyLabel ?? getStageFamilyLabel(candidate.layout.label);
    if (!coveredFamilies.has(family)) {
      tryAddCandidate(candidate);
    }
  }

  for (const candidate of sortedCandidates) {
    if (pool.length >= CONFIG.randomStageChoiceCount) {
      break;
    }

    tryAddCandidate(candidate);
  }

  return pool;
};

function chooseHardRandomPoolCandidate(pool) {
  const shortlistSize = Math.min(pool.length, HARD_RANDOM_STAGE_CONFIG.topChoiceCount);
  const shortlist = pool.slice(0, shortlistSize);
  const totalWeight = shortlist.reduce(
    (weight, candidate, index) =>
      weight + (shortlistSize - index) * Math.max(1, candidate.analysis.minSteps),
    0
  );

  let remainingWeight = Math.random() * totalWeight;
  for (let index = 0; index < shortlist.length; index += 1) {
    const candidate = shortlist[index];
    remainingWeight -=
      (shortlistSize - index) * Math.max(1, candidate.analysis.minSteps);
    if (remainingWeight <= 0) {
      return candidate;
    }
  }

  return shortlist[0];
}

createRandomDesignedStage = function createHardRandomDesignedStageFinal() {
  const layouts = getEnhancedRandomStageLayouts();
  const scoredLayouts = shuffleArray(layouts)
    .map((layout) => ({
      layout,
      score: scoreRandomStageCandidate(layout),
    }))
    .sort((layoutA, layoutB) => layoutB.score - layoutA.score);
  const pool = buildRandomStagePool(scoredLayouts);
  const chosenCandidate = pool.length > 0 ? chooseHardRandomPoolCandidate(pool) : null;
  const layout = chosenCandidate?.layout ?? createFallbackRandomStageLayout();
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

  return buildRandomStageDefinition(layout);
};

const HARD_RANDOM_STAGE_CONFIG = {
  preferredMinSteps: 3,
  fallbackMinSteps: 2,
  maxAnalyzedCandidates: 48,
  preferredMaxWinningFirstMoves: 2,
  preferredMinForcedSteps: 1,
  topChoiceCount: 2,
  maxOptimalSolutionEstimate: 999,
};

const HARD_RANDOM_STAGE_PATTERNS = [
  {
    label: "三段迂回",
    playerStart: { x: 9, y: 4 },
    keyPosition: { x: 7, y: 0 },
    goalPosition: { x: 2, y: 7 },
    bombs: [
      { x: 0, y: 1 },
      { x: 4, y: 4 },
      { x: 7, y: 6 },
    ],
    disarmItems: [
      { x: 7, y: 3 },
      { x: 3, y: 7 },
    ],
    wallBlocks: [
      { x: 4, y: 7 },
      { x: 4, y: 8 },
      { x: 4, y: 9 },
      { x: 5, y: 9 },
    ],
    plannedLoops: 4,
    solutionStyle: "gauntlet",
    strategyNote: "鍵回収、爆弾処理、終盤の封鎖を三段階で揃えます。",
    difficultySeedWeight: 1400,
  },
  {
    label: "外縁分業",
    playerStart: { x: 0, y: 1 },
    keyPosition: { x: 6, y: 2 },
    goalPosition: { x: 1, y: 8 },
    bombs: [
      { x: 1, y: 3 },
      { x: 6, y: 6 },
      { x: 5, y: 8 },
    ],
    disarmItems: [
      { x: 7, y: 9 },
      { x: 6, y: 3 },
    ],
    wallBlocks: [
      { x: 5, y: 9 },
      { x: 6, y: 9 },
      { x: 6, y: 8 },
      { x: 7, y: 8 },
    ],
    plannedLoops: 4,
    solutionStyle: "relay",
    strategyNote: "上側の鍵回収、下側の切り分け、最後の接続を順に通します。",
    difficultySeedWeight: 1360,
  },
  {
    label: "single-lane",
    playerStart: { x: 9, y: 1 },
    keyPosition: { x: 6, y: 2 },
    goalPosition: { x: 8, y: 8 },
    bombs: [
      { x: 8, y: 3 },
      { x: 0, y: 6 },
      { x: 4, y: 8 },
    ],
    disarmItems: [
      { x: 2, y: 9 },
      { x: 3, y: 3 },
    ],
    wallBlocks: [
      { x: 4, y: 9 },
      { x: 3, y: 9 },
      { x: 3, y: 8 },
      { x: 2, y: 8 },
      { x: 3, y: 5 },
      { x: 2, y: 0 },
    ],
    plannedLoops: 4,
    solutionStyle: "needle",
    strategyNote: "One narrow route survives; side captures tend to collapse the key-goal order.",
    difficultySeedWeight: 2800,
  },
  {
    label: "pinpoint-relay",
    playerStart: { x: 8, y: 9 },
    keyPosition: { x: 7, y: 3 },
    goalPosition: { x: 1, y: 8 },
    bombs: [
      { x: 6, y: 8 },
      { x: 3, y: 3 },
      { x: 5, y: 5 },
    ],
    disarmItems: [
      { x: 0, y: 2 },
      { x: 6, y: 3 },
    ],
    wallBlocks: [
      { x: 0, y: 4 },
      { x: 0, y: 3 },
      { x: 1, y: 3 },
      { x: 4, y: 3 },
      { x: 2, y: 8 },
    ],
    plannedLoops: 4,
    solutionStyle: "needle",
    strategyNote: "The safe order is almost fixed, and the tool count pushes a tight relay.",
    difficultySeedWeight: 2600,
  },
];

function getRandomStageDifficultyState() {
  if (!globalThis.__closedLoopRandomStageDifficultyState) {
    globalThis.__closedLoopRandomStageDifficultyState = {
      layouts: null,
      analysisByStageKey: new Map(),
    };
  }

  return globalThis.__closedLoopRandomStageDifficultyState;
}

function createHardRandomStageLayout(pattern, transform) {
  const transformedLayout = createTransformedStageLayout(pattern, transform);

  return {
    ...transformedLayout,
    familyLabel: pattern.label,
    variantId: "hard",
    variantLabel: "長手数型",
    solutionStyle: pattern.solutionStyle,
    strategyNote: pattern.strategyNote,
    plannedLoops: pattern.plannedLoops,
    difficultySeedWeight: pattern.difficultySeedWeight ?? 0,
  };
}

function getEnhancedRandomStageLayouts() {
  const difficultyState = getRandomStageDifficultyState();
  if (difficultyState.layouts) {
    return difficultyState.layouts;
  }

  const layoutsByKey = new Map(
    STAGE_LIBRARY.map((layout) => [buildStageLayoutKey(layout), layout])
  );

  for (const pattern of HARD_RANDOM_STAGE_PATTERNS) {
    for (const transform of STAGE_TRANSFORMS) {
      const layout = createHardRandomStageLayout(pattern, transform);
      if (!isStageLayoutValid(layout) || !isStageToolSpacingValid(layout)) {
        continue;
      }

      layoutsByKey.set(buildStageLayoutKey(layout), layout);
    }
  }

  difficultyState.layouts = [...layoutsByKey.values()];
  return difficultyState.layouts;
}

function measureRandomStageFirstMovePressure(stage, minSteps) {
  const candidates = buildAutoSolveCandidatesSync(stage);
  const rootState = createAutoSolveSearchState(stage);
  const reachMemo = new Map();

  function canReachClearWithinDepth(state, remainingSteps) {
    const memoKey = `${serializeAutoSolveSearchState(state)}::${remainingSteps}`;
    if (reachMemo.has(memoKey)) {
      return reachMemo.get(memoKey);
    }

    let reachable = false;

    if (state.clear) {
      reachable = true;
    } else if (remainingSteps > 0) {
      const forbiddenKeys = buildAutoSolveForbiddenKeys(stage, state);
      for (const loopCandidate of candidates) {
        if (!canAutoSolveCandidateBeDrawn(loopCandidate, forbiddenKeys)) {
          continue;
        }

        const nextState = buildAutoSolveNextState(stage, state, loopCandidate);
        if (!nextState) {
          continue;
        }

        if (canReachClearWithinDepth(nextState, remainingSteps - 1)) {
          reachable = true;
          break;
        }
      }
    }

    reachMemo.set(memoKey, reachable);
    return reachable;
  }

  const forbiddenKeys = buildAutoSolveForbiddenKeys(stage, rootState);
  let legalFirstMoves = 0;
  let winningFirstMoves = 0;

  for (const loopCandidate of candidates) {
    if (!canAutoSolveCandidateBeDrawn(loopCandidate, forbiddenKeys)) {
      continue;
    }

    const nextState = buildAutoSolveNextState(stage, rootState, loopCandidate);
    if (!nextState) {
      continue;
    }

    legalFirstMoves += 1;
    if (canReachClearWithinDepth(nextState, minSteps - 1)) {
      winningFirstMoves += 1;
    }
  }

  return {
    legalFirstMoves,
    winningFirstMoves,
    decoyFirstMoves: Math.max(0, legalFirstMoves - winningFirstMoves),
  };
}

// 難しさは手数の長さ、正答初手の少なさ、おとり手の多さ、配置圧力で測る
// 最短解の分岐の少なさを測り、解法の絞られ具合を見積もる
function measureRandomStageSolutionTightness(stage, minSteps) {
  const candidates = buildAutoSolveCandidatesSync(stage);
  const rootState = createAutoSolveSearchState(stage);
  const tightnessMemo = new Map();

  function analyzeState(state, remainingSteps) {
    const memoKey = `${serializeAutoSolveSearchState(state)}::${remainingSteps}`;
    if (tightnessMemo.has(memoKey)) {
      return tightnessMemo.get(memoKey);
    }

    if (state.clear) {
      const clearedMetrics = {
        reachable: true,
        optimalSolutionEstimate: 1,
        forcedStepCount: 0,
      };
      tightnessMemo.set(memoKey, clearedMetrics);
      return clearedMetrics;
    }

    if (remainingSteps <= 0) {
      const deadMetrics = {
        reachable: false,
        optimalSolutionEstimate: 0,
        forcedStepCount: 0,
      };
      tightnessMemo.set(memoKey, deadMetrics);
      return deadMetrics;
    }

    const forbiddenKeys = buildAutoSolveForbiddenKeys(stage, state);
    const winningResults = [];

    for (const loopCandidate of candidates) {
      if (!canAutoSolveCandidateBeDrawn(loopCandidate, forbiddenKeys)) {
        continue;
      }

      const nextState = buildAutoSolveNextState(stage, state, loopCandidate);
      if (!nextState) {
        continue;
      }

      const nextMetrics = analyzeState(nextState, remainingSteps - 1);
      if (nextMetrics.reachable) {
        winningResults.push(nextMetrics);
      }
    }

    if (winningResults.length === 0) {
      const deadMetrics = {
        reachable: false,
        optimalSolutionEstimate: 0,
        forcedStepCount: 0,
      };
      tightnessMemo.set(memoKey, deadMetrics);
      return deadMetrics;
    }

    const optimalSolutionEstimate = Math.min(
      HARD_RANDOM_STAGE_CONFIG.maxOptimalSolutionEstimate,
      winningResults.reduce(
        (total, metrics) => total + metrics.optimalSolutionEstimate,
        0
      )
    );
    const stepForceBonus = winningResults.length === 1 ? 1 : 0;
    const forcedStepCount = winningResults.reduce(
      (bestCount, metrics) => Math.max(bestCount, metrics.forcedStepCount + stepForceBonus),
      0
    );
    const stateMetrics = {
      reachable: true,
      optimalSolutionEstimate,
      forcedStepCount,
    };

    tightnessMemo.set(memoKey, stateMetrics);
    return stateMetrics;
  }

  const tightness = analyzeState(rootState, minSteps);
  return {
    optimalSolutionEstimate: tightness.optimalSolutionEstimate,
    forcedStepCount: tightness.forcedStepCount,
  };
}

function analyzeRandomStageLayout(layout) {
  const difficultyState = getRandomStageDifficultyState();
  const stageKey = buildStageLayoutKey(layout);

  if (difficultyState.analysisByStageKey.has(stageKey)) {
    return difficultyState.analysisByStageKey.get(stageKey);
  }

  const stage = buildRandomStageDefinition(layout);
  const solution = findStageAutoSolveSolutionSync(stage);

  if (!solution || solution.length === 0) {
    const unsolvedAnalysis = {
      solvable: false,
      minSteps: 0,
      legalFirstMoves: 0,
      winningFirstMoves: 0,
      decoyFirstMoves: 0,
      difficultyScore: Number.NEGATIVE_INFINITY,
    };

    difficultyState.analysisByStageKey.set(stageKey, unsolvedAnalysis);
    return unsolvedAnalysis;
  }

  const routeDistance =
    getManhattanDistance(layout.playerStart, layout.keyPosition) +
    getManhattanDistance(layout.keyPosition, layout.goalPosition);
  const firstMovePressure = measureRandomStageFirstMovePressure(stage, solution.length);
  const solutionTightness = measureRandomStageSolutionTightness(stage, solution.length);
  const structuralPressure =
    layout.bombs.length * 22 +
    layout.disarmItems.length * 14 +
    (layout.wallBlocks?.length ?? 0) * 18 +
    layout.plannedLoops * 46 +
    routeDistance * 3 +
    (layout.difficultySeedWeight ?? 0);
  const difficultyScore =
    solution.length * 320 -
    firstMovePressure.winningFirstMoves * 24 +
    firstMovePressure.decoyFirstMoves * 10 -
    firstMovePressure.legalFirstMoves * 2 +
    solutionTightness.forcedStepCount * 55 -
    solutionTightness.optimalSolutionEstimate * 9 +
    structuralPressure;
  const analysis = {
    solvable: true,
    minSteps: solution.length,
    legalFirstMoves: firstMovePressure.legalFirstMoves,
    winningFirstMoves: firstMovePressure.winningFirstMoves,
    decoyFirstMoves: firstMovePressure.decoyFirstMoves,
    forcedStepCount: solutionTightness.forcedStepCount,
    optimalSolutionEstimate: solutionTightness.optimalSolutionEstimate,
    difficultyScore,
  };

  difficultyState.analysisByStageKey.set(stageKey, analysis);
  return analysis;
}

scoreRandomStageCandidate = function scoreHardRandomStageCandidate(layout) {
  const stageKey = buildStageLayoutKey(layout);
  const familyLabel = layout.familyLabel ?? getStageFamilyLabel(layout.label);
  const solutionStyle = layout.solutionStyle ?? "mixed";
  const routeDistance =
    getManhattanDistance(layout.playerStart, layout.keyPosition) +
    getManhattanDistance(layout.keyPosition, layout.goalPosition);
  const objectPressure =
    layout.bombs.length * 24 +
    layout.disarmItems.length * 12 +
    (layout.wallBlocks?.length ?? 0) * 18 +
    layout.plannedLoops * 40 +
    routeDistance * 2 +
    (layout.difficultySeedWeight ?? 0);

  return (
    scoreStageLayout(layout) * 0.03 +
    objectPressure +
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
};

buildRandomStagePool = function buildHardRandomStagePool(scoredLayouts) {
  const analyzedCandidates = [];
  const preferredCandidates = [];
  const fallbackCandidates = [];
  let narrowPreferredCount = 0;

  for (const candidate of scoredLayouts) {
    const analysis = analyzeRandomStageLayout(candidate.layout);
    if (!analysis.solvable) {
      continue;
    }

    const analyzedCandidate = {
      ...candidate,
      analysis,
      finalScore: candidate.score + analysis.difficultyScore,
    };

    analyzedCandidates.push(analyzedCandidate);

    if (analysis.minSteps >= HARD_RANDOM_STAGE_CONFIG.preferredMinSteps) {
      preferredCandidates.push(analyzedCandidate);

      if (
        analysis.winningFirstMoves <=
          HARD_RANDOM_STAGE_CONFIG.preferredMaxWinningFirstMoves &&
        analysis.forcedStepCount >=
          HARD_RANDOM_STAGE_CONFIG.preferredMinForcedSteps
      ) {
        narrowPreferredCount += 1;
      }
    }

    if (analysis.minSteps >= HARD_RANDOM_STAGE_CONFIG.fallbackMinSteps) {
      fallbackCandidates.push(analyzedCandidate);
    }

    if (
      analyzedCandidates.length >= HARD_RANDOM_STAGE_CONFIG.maxAnalyzedCandidates &&
      preferredCandidates.length >= CONFIG.randomStageChoiceCount
    ) {
      break;
    }
  }

  const narrowPreferredCandidates = preferredCandidates.filter(
    (candidate) =>
      candidate.analysis.winningFirstMoves <=
        HARD_RANDOM_STAGE_CONFIG.preferredMaxWinningFirstMoves &&
      candidate.analysis.forcedStepCount >=
        HARD_RANDOM_STAGE_CONFIG.preferredMinForcedSteps
  );
  const candidateSource = narrowPreferredCandidates.length > 0
    ? narrowPreferredCandidates
    : preferredCandidates.length >= CONFIG.randomStageChoiceCount
      ? preferredCandidates
      : fallbackCandidates.length >= CONFIG.randomStageChoiceCount
        ? fallbackCandidates
        : analyzedCandidates;
  const sortedCandidates = [...candidateSource].sort((left, right) => {
    if (left.analysis.minSteps !== right.analysis.minSteps) {
      return right.analysis.minSteps - left.analysis.minSteps;
    }

    if (left.analysis.forcedStepCount !== right.analysis.forcedStepCount) {
      return right.analysis.forcedStepCount - left.analysis.forcedStepCount;
    }

    if (left.analysis.winningFirstMoves !== right.analysis.winningFirstMoves) {
      return left.analysis.winningFirstMoves - right.analysis.winningFirstMoves;
    }

    if (left.analysis.decoyFirstMoves !== right.analysis.decoyFirstMoves) {
      return right.analysis.decoyFirstMoves - left.analysis.decoyFirstMoves;
    }

    return right.finalScore - left.finalScore;
  });
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

  for (const candidate of sortedCandidates) {
    if (pool.length >= CONFIG.randomStageChoiceCount) {
      break;
    }

    const style = candidate.layout.solutionStyle ?? "mixed";
    if (!coveredStyles.has(style)) {
      tryAddCandidate(candidate);
    }
  }

  for (const candidate of sortedCandidates) {
    if (pool.length >= CONFIG.randomStageChoiceCount) {
      break;
    }

    const family = candidate.layout.familyLabel ?? getStageFamilyLabel(candidate.layout.label);
    if (!coveredFamilies.has(family)) {
      tryAddCandidate(candidate);
    }
  }

  for (const candidate of sortedCandidates) {
    if (pool.length >= CONFIG.randomStageChoiceCount) {
      break;
    }

    tryAddCandidate(candidate);
  }

  return pool;
};

createRandomDesignedStage = function createHardRandomDesignedStage() {
  const layouts = getEnhancedRandomStageLayouts();
  const scoredLayouts = shuffleArray(layouts)
    .map((layout) => ({
      layout,
      score: scoreRandomStageCandidate(layout),
    }))
    .sort((layoutA, layoutB) => layoutB.score - layoutA.score);
  const pool = buildRandomStagePool(scoredLayouts);
  const chosenCandidate = pool.length > 0 ? chooseHardRandomPoolCandidate(pool) : null;
  const layout = chosenCandidate?.layout ?? createFallbackRandomStageLayout();
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

  return buildRandomStageDefinition(layout);
};

globalThis.closedLoopDebug.analyzeRandomStageLayout = analyzeRandomStageLayout;
globalThis.closedLoopDebug.createRandomDesignedStage = createRandomDesignedStage;

function buildRandomStageDefinition(layout) {
  return {
    boardSize: cloneBoardSize(getStageBoardSize(layout)),
    playerStart: clonePosition(layout.playerStart ?? BASE_STAGE.playerStart),
    keyPosition: clonePosition(layout.keyPosition ?? BASE_STAGE.keyPosition),
    goalPosition: clonePosition(layout.goalPosition ?? BASE_STAGE.goalPosition),
    bombs: clonePositions(layout.bombs ?? []),
    disarmItems: clonePositions(layout.disarmItems ?? []),
    wallBlocks: clonePositions(layout.wallBlocks ?? []),
    shields: clonePositions(layout.shields ?? []),
    designLabel: layout.label ?? layout.designLabel ?? "ランダムステージ",
    designNote:
      layout.designNote ??
      buildStageNote({
        ...layout,
        label: layout.label ?? layout.designLabel ?? "ランダムステージ",
      }),
    instructionText: RANDOM_STAGE_INSTRUCTION_TEXT,
    keyInitiallyCollected: false,
    mode: GAME_MODE.random,
    tutorialIndex: null,
  };
}

// ランダム候補が尽きた場合でも、必ず解ける盤面を返すための保険
function createFallbackRandomStageLayout() {
  return {
    ...BASE_STAGE,
    keyPosition: { x: 3, y: 1 },
    goalPosition: { x: 4, y: 3 },
    bombs: [],
    disarmItems: [],
    wallBlocks: [],
    shields: [],
    label: "検証済みフォールバック",
    plannedLoops: 1,
    familyLabel: "フォールバック",
    variantLabel: "安全策",
    solutionStyle: "safe",
    strategyNote: "必ず解ける配置だけを返すための保険です。",
  };
}

function getRandomStageVerificationState() {
  if (!globalThis.__closedLoopRandomStageVerificationState) {
    globalThis.__closedLoopRandomStageVerificationState = {
      solvableByStageKey: new Map(),
    };
  }

  return globalThis.__closedLoopRandomStageVerificationState;
}

function buildAutoSolveCandidatesSync(stage) {
  const autoSolveState = getMakerAutoSolveState();
  const cacheKey = createAutoSolveCandidateKey(stage);
  if (autoSolveState.cacheByStageKey.has(cacheKey)) {
    return autoSolveState.cacheByStageKey.get(cacheKey);
  }

  const candidateMap = new Map();
  const boardSize = getStageBoardSize(stage);
  const borderCells = buildAutoSolveBorderCells(boardSize);

  for (let top = 0; top < boardSize.height - 2; top += 1) {
    for (let left = 0; left < boardSize.width - 2; left += 1) {
      for (let bottom = top + 2; bottom < boardSize.height; bottom += 1) {
        for (let right = left + 2; right < boardSize.width; right += 1) {
          const perimeter =
            2 * ((right - left + 1) + (bottom - top + 1)) - 4;
          if (perimeter > AUTO_SOLVER_CONFIG.maxRectanglePerimeter) {
            continue;
          }

          addAutoSolveCandidate(
            candidateMap,
            stage,
            buildRectangleLoopCells(left, top, right, bottom),
            "rectangle"
          );
        }
      }
    }
  }

  for (let startIndex = 0; startIndex < borderCells.length; startIndex += 1) {
    const startCell = borderCells[startIndex];
    const startSide = getBorderSideName(startCell, boardSize);

    for (let endIndex = startIndex + 1; endIndex < borderCells.length; endIndex += 1) {
      const endCell = borderCells[endIndex];
      const endSide = getBorderSideName(endCell, boardSize);

      addAutoSolveCandidate(
        candidateMap,
        stage,
        buildPolylineCells([startCell, endCell]),
        "border-straight"
      );

      if (startCell.x !== endCell.x && startCell.y !== endCell.y) {
        addAutoSolveCandidate(
          candidateMap,
          stage,
          buildPolylineCells([
            startCell,
            { x: startCell.x, y: endCell.y },
            endCell,
          ]),
          "border-bend"
        );
        addAutoSolveCandidate(
          candidateMap,
          stage,
          buildPolylineCells([
            startCell,
            { x: endCell.x, y: startCell.y },
            endCell,
          ]),
          "border-bend"
        );
      }

      if (
        (startSide === "top" && endSide === "top") ||
        (startSide === "bottom" && endSide === "bottom")
      ) {
        const innerYRange =
          startSide === "top"
            ? { from: 1, to: boardSize.height - 2 }
            : { from: 0, to: boardSize.height - 2 };

        for (let innerY = innerYRange.from; innerY <= innerYRange.to; innerY += 1) {
          addAutoSolveCandidate(
            candidateMap,
            stage,
            buildPolylineCells([
              startCell,
              { x: startCell.x, y: innerY },
              { x: endCell.x, y: innerY },
              endCell,
            ]),
            "border-u"
          );
        }
      }

      if (
        (startSide === "left" && endSide === "left") ||
        (startSide === "right" && endSide === "right")
      ) {
        const innerXRange =
          startSide === "left"
            ? { from: 1, to: boardSize.width - 2 }
            : { from: 0, to: boardSize.width - 2 };

        for (let innerX = innerXRange.from; innerX <= innerXRange.to; innerX += 1) {
          addAutoSolveCandidate(
            candidateMap,
            stage,
            buildPolylineCells([
              startCell,
              { x: innerX, y: startCell.y },
              { x: innerX, y: endCell.y },
              endCell,
            ]),
            "border-u"
          );
        }
      }

      const oppositeVertical =
        (startSide === "top" && endSide === "bottom") ||
        (startSide === "bottom" && endSide === "top");
      const oppositeHorizontal =
        (startSide === "left" && endSide === "right") ||
        (startSide === "right" && endSide === "left");

      if (oppositeVertical) {
        for (let innerY = 1; innerY < boardSize.height - 1; innerY += 1) {
          addAutoSolveCandidate(
            candidateMap,
            stage,
            buildPolylineCells([
              startCell,
              { x: startCell.x, y: innerY },
              { x: endCell.x, y: innerY },
              endCell,
            ]),
            "border-bridge"
          );
        }
      }

      if (oppositeHorizontal) {
        for (let innerX = 1; innerX < boardSize.width - 1; innerX += 1) {
          addAutoSolveCandidate(
            candidateMap,
            stage,
            buildPolylineCells([
              startCell,
              { x: innerX, y: startCell.y },
              { x: innerX, y: endCell.y },
              endCell,
            ]),
            "border-bridge"
          );
        }
      }
    }
  }

  const candidates = [...candidateMap.values()].sort((left, right) => {
    if (left.lineCellCount !== right.lineCellCount) {
      return left.lineCellCount - right.lineCellCount;
    }

    if (left.usesOuterWall !== right.usesOuterWall) {
      return left.usesOuterWall ? -1 : 1;
    }

    return left.drawnCells.length - right.drawnCells.length;
  });

  autoSolveState.cacheByStageKey.set(cacheKey, candidates);
  return candidates;
}

function findStageAutoSolveSolutionSync(stage) {
  const candidates = buildAutoSolveCandidatesSync(stage);
  const initialState = createAutoSolveSearchState(stage);
  const queue = [initialState];
  const visitedStates = new Set([serializeAutoSolveSearchState(initialState)]);

  while (
    queue.length > 0 &&
    visitedStates.size <= AUTO_SOLVER_CONFIG.maxVisitedStates
  ) {
    const currentState = queue.shift();

    if (currentState.clear) {
      return currentState.history;
    }

    if (currentState.history.length >= AUTO_SOLVER_CONFIG.maxSteps) {
      continue;
    }

    const forbiddenKeys = buildAutoSolveForbiddenKeys(stage, currentState);

    for (const loopCandidate of candidates) {
      if (!canAutoSolveCandidateBeDrawn(loopCandidate, forbiddenKeys)) {
        continue;
      }

      const nextState = buildAutoSolveNextState(stage, currentState, loopCandidate);
      if (!nextState) {
        continue;
      }

      if (nextState.clear) {
        return nextState.history;
      }

      const signature = serializeAutoSolveSearchState(nextState);
      if (visitedStates.has(signature)) {
        continue;
      }

      visitedStates.add(signature);
      queue.push(nextState);
    }
  }

  return null;
}

function isRandomStageDefinitionSolvable(stage) {
  const verificationState = getRandomStageVerificationState();
  const stageKey = buildStageLayoutKey(stage);

  if (verificationState.solvableByStageKey.has(stageKey)) {
    return verificationState.solvableByStageKey.get(stageKey);
  }

  const solution = findStageAutoSolveSolutionSync(stage);
  const solvable = Array.isArray(solution) && solution.length > 0;
  verificationState.solvableByStageKey.set(stageKey, solvable);
  return solvable;
}

function isRandomStageLayoutSolvable(layout) {
  return isRandomStageDefinitionSolvable(buildRandomStageDefinition(layout));
}

buildRandomStagePool = function buildVerifiedRandomStagePool(scoredLayouts) {
  const pool = [];
  const poolStageKeys = new Set();
  const coveredStyles = new Set();
  const coveredFamilies = new Set();

  function tryAddCandidate(candidate) {
    const stageKey = buildStageLayoutKey(candidate.layout);

    if (poolStageKeys.has(stageKey)) {
      return false;
    }

    if (!isRandomStageLayoutSolvable(candidate.layout)) {
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
};

createRandomDesignedStage = function createVerifiedRandomDesignedStage() {
  const layouts = STAGE_LIBRARY.length > 0
    ? STAGE_LIBRARY
    : [createFallbackRandomStageLayout()];

  const scoredLayouts = shuffleArray(layouts)
    .map((layout) => ({
      layout,
      score: scoreRandomStageCandidate(layout),
    }))
    .sort((layoutA, layoutB) => layoutB.score - layoutA.score);

  const pool = buildRandomStagePool(scoredLayouts);
  const layout = pool.length > 0
    ? chooseRandomItem(pool).layout
    : createFallbackRandomStageLayout();
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

  return buildRandomStageDefinition(layout);
};

globalThis.closedLoopDebug.findStageAutoSolveSolutionSync = findStageAutoSolveSolutionSync;
globalThis.closedLoopDebug.createRandomDesignedStage = createRandomDesignedStage;

buildRandomStagePool = function buildHardRandomStagePoolFinal(scoredLayouts) {
  const analyzedCandidates = [];
  const preferredCandidates = [];
  const fallbackCandidates = [];
  let narrowPreferredCount = 0;

  for (const candidate of scoredLayouts) {
    const analysis = analyzeRandomStageLayout(candidate.layout);
    if (!analysis.solvable) {
      continue;
    }

    const analyzedCandidate = {
      ...candidate,
      analysis,
      finalScore: candidate.score + analysis.difficultyScore,
    };

    analyzedCandidates.push(analyzedCandidate);

    if (analysis.minSteps >= HARD_RANDOM_STAGE_CONFIG.preferredMinSteps) {
      preferredCandidates.push(analyzedCandidate);

      if (
        analysis.winningFirstMoves <=
          HARD_RANDOM_STAGE_CONFIG.preferredMaxWinningFirstMoves &&
        analysis.forcedStepCount >=
          HARD_RANDOM_STAGE_CONFIG.preferredMinForcedSteps
      ) {
        narrowPreferredCount += 1;
      }
    }

    if (analysis.minSteps >= HARD_RANDOM_STAGE_CONFIG.fallbackMinSteps) {
      fallbackCandidates.push(analyzedCandidate);
    }

    if (
      analyzedCandidates.length >= HARD_RANDOM_STAGE_CONFIG.maxAnalyzedCandidates &&
      preferredCandidates.length >= CONFIG.randomStageChoiceCount &&
      narrowPreferredCount > 0
    ) {
      break;
    }
  }

  const narrowPreferredCandidates = preferredCandidates.filter(
    (candidate) =>
      candidate.analysis.winningFirstMoves <=
        HARD_RANDOM_STAGE_CONFIG.preferredMaxWinningFirstMoves &&
      candidate.analysis.forcedStepCount >=
        HARD_RANDOM_STAGE_CONFIG.preferredMinForcedSteps
  );
  const candidateSource = narrowPreferredCandidates.length > 0
    ? narrowPreferredCandidates
    : preferredCandidates.length >= CONFIG.randomStageChoiceCount
      ? preferredCandidates
      : fallbackCandidates.length >= CONFIG.randomStageChoiceCount
        ? fallbackCandidates
        : analyzedCandidates;
  const sortedCandidates = [...candidateSource].sort((left, right) => {
    if (left.analysis.minSteps !== right.analysis.minSteps) {
      return right.analysis.minSteps - left.analysis.minSteps;
    }

    if (left.analysis.forcedStepCount !== right.analysis.forcedStepCount) {
      return right.analysis.forcedStepCount - left.analysis.forcedStepCount;
    }

    if (left.analysis.winningFirstMoves !== right.analysis.winningFirstMoves) {
      return left.analysis.winningFirstMoves - right.analysis.winningFirstMoves;
    }

    if (left.analysis.decoyFirstMoves !== right.analysis.decoyFirstMoves) {
      return right.analysis.decoyFirstMoves - left.analysis.decoyFirstMoves;
    }

    return right.finalScore - left.finalScore;
  });
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

  for (const candidate of sortedCandidates) {
    if (pool.length >= CONFIG.randomStageChoiceCount) {
      break;
    }

    const style = candidate.layout.solutionStyle ?? "mixed";
    if (!coveredStyles.has(style)) {
      tryAddCandidate(candidate);
    }
  }

  for (const candidate of sortedCandidates) {
    if (pool.length >= CONFIG.randomStageChoiceCount) {
      break;
    }

    const family = candidate.layout.familyLabel ?? getStageFamilyLabel(candidate.layout.label);
    if (!coveredFamilies.has(family)) {
      tryAddCandidate(candidate);
    }
  }

  for (const candidate of sortedCandidates) {
    if (pool.length >= CONFIG.randomStageChoiceCount) {
      break;
    }

    tryAddCandidate(candidate);
  }

  return pool;
};

createRandomDesignedStage = function createHardRandomDesignedStageFinal() {
  const layouts = getEnhancedRandomStageLayouts();
  const scoredLayouts = shuffleArray(layouts)
    .map((layout) => ({
      layout,
      score: scoreRandomStageCandidate(layout),
    }))
    .sort((layoutA, layoutB) => layoutB.score - layoutA.score);
  const pool = buildRandomStagePool(scoredLayouts);
  const chosenCandidate = pool.length > 0 ? chooseHardRandomPoolCandidate(pool) : null;
  const layout = chosenCandidate?.layout ?? createFallbackRandomStageLayout();
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

  return buildRandomStageDefinition(layout);
};

globalThis.closedLoopDebug.createRandomDesignedStage = createRandomDesignedStage;

function ensureRememberedRandomStageReady(forceRegenerate = false) {
  if (forceRegenerate) {
    rememberedRandomStage = createRandomDesignedStage();
    return rememberedRandomStage;
  }

  if (
    rememberedRandomStage &&
    rememberedRandomStage.designLabel !== DEFAULT_RANDOM_STAGE.designLabel
  ) {
    return rememberedRandomStage;
  }

  rememberedRandomStage = createRandomDesignedStage();
  return rememberedRandomStage;
}

function getNextKnownStageNumber(currentStageNumber, stageDifficulty) {
  const stageNumbers = getKnownStageNumbers(stageDifficulty);
  if (stageNumbers.length === 0) {
    return 1;
  }

  const currentIndex = stageNumbers.indexOf(currentStageNumber);
  if (currentIndex < 0 || currentIndex >= stageNumbers.length - 1) {
    return stageNumbers[0];
  }

  return stageNumbers[currentIndex + 1];
}

let lastCanvasClearTouchTime = 0;

// ?????????????????????????
async function handleCanvasClickAfterClear() {
  if (!gameState.clear) {
    return;
  }

  if (gameState.mode === GAME_MODE.random) {
    resetGame(true);
    return;
  }

  if (gameState.mode !== getStageModeKey()) {
    return;
  }

  const stageDifficulty = normalizeStageDifficulty(
    gameState.stage.stageDifficulty ?? getStageJsonState().selectedDifficulty
  );
  const currentStageNumber = Number.isInteger(gameState.stage.stageNumber)
    ? gameState.stage.stageNumber
    : 1;
  const nextStageNumber = getNextKnownStageNumber(currentStageNumber, stageDifficulty);
  await playStageByNumber(nextStageNumber, stageDifficulty);
}

function handleCanvasTouchEndAfterClear(event) {
  if (!gameState.clear || gameState.drawing.active) {
    return;
  }

  lastCanvasClearTouchTime = Date.now();
  preventTouchBrowserAction(event);
  void handleCanvasClickAfterClear();
}

canvas.addEventListener("click", (event) => {
  if (Date.now() - lastCanvasClearTouchTime < 700) {
    return;
  }

  void handleCanvasClickAfterClear(event);
});
canvas.addEventListener("touchend", handleCanvasTouchEndAfterClear, { passive: false });

const ICON_SPRITE_SHEET_PATH = "sozai/icons.png";
const ICON_SPRITE_DEFINITIONS = {
  player: { x: 107, y: 339, width: 216, height: 222, padding: 3 },
  goalOpen: { x: 383, y: 339, width: 220, height: 222, padding: 3 },
  goalClosed: { x: 669, y: 339, width: 218, height: 222, padding: 3 },
  key: { x: 1001, y: 353, width: 125, height: 208, padding: 6 },
  bomb: { x: 120, y: 661, width: 178, height: 221, padding: 4 },
  waterBucket: { x: 400, y: 684, width: 183, height: 198, padding: 4 },
  emptyBucket: { x: 685, y: 684, width: 184, height: 198, padding: 4 },
  wall: { x: 954, y: 683, width: 203, height: 199, padding: 1 },
};

const drawWallBlocksFallback = drawWallBlocks;
const drawPlayerFallback = drawPlayer;
const drawKeyFallback = drawKey;
const drawGoalFallback = drawGoal;
const drawBombsFallback = drawBombs;
const drawDisarmItemsFallback = drawDisarmItems;

function getIconSpriteState() {
  if (!globalThis.__closedLoopIconSpriteState) {
    globalThis.__closedLoopIconSpriteState = {
      image: null,
      loaded: false,
      loading: false,
      failed: false,
    };
  }

  return globalThis.__closedLoopIconSpriteState;
}

function ensureIconSpriteSheet() {
  const spriteState = getIconSpriteState();
  if (spriteState.loaded || spriteState.loading || spriteState.failed) {
    return spriteState;
  }

  if (typeof Image !== "function") {
    spriteState.failed = true;
    return spriteState;
  }

  const image = new Image();
  spriteState.image = image;
  spriteState.loading = true;
  image.onload = () => {
    spriteState.loading = false;
    spriteState.loaded = true;
    render();
  };
  image.onerror = () => {
    spriteState.loading = false;
    spriteState.failed = true;
    render();
  };
  image.src = ICON_SPRITE_SHEET_PATH;

  return spriteState;
}

function drawSpriteAtCell(spriteKey, cell, fallbackDraw) {
  const spriteState = ensureIconSpriteSheet();
  const sprite = ICON_SPRITE_DEFINITIONS[spriteKey];

  if (!spriteState.loaded || !spriteState.image || !sprite) {
    fallbackDraw();
    return;
  }

  const pixelX = cell.x * CONFIG.cellSize;
  const pixelY = cell.y * CONFIG.cellSize;
  const innerSize = CONFIG.cellSize - sprite.padding * 2;
  const scale = Math.min(innerSize / sprite.width, innerSize / sprite.height);
  const drawWidth = Math.max(1, Math.round(sprite.width * scale));
  const drawHeight = Math.max(1, Math.round(sprite.height * scale));
  const drawX = pixelX + Math.round((CONFIG.cellSize - drawWidth) / 2);
  const drawY = pixelY + Math.round((CONFIG.cellSize - drawHeight) / 2);

  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(
    spriteState.image,
    sprite.x,
    sprite.y,
    sprite.width,
    sprite.height,
    drawX,
    drawY,
    drawWidth,
    drawHeight
  );
  context.restore();
}

function drawWallBlocks() {
  if (gameState.wallBlocks.length === 0) {
    return;
  }

  for (const wallBlock of gameState.wallBlocks) {
    drawSpriteAtCell("wall", wallBlock, () => {
      drawCells(
        [wallBlock],
        CONFIG.wallBlockFillStyle,
        CONFIG.wallBlockStrokeStyle
      );
    });
  }
};

drawPlayer = function drawPlayerWithIcon() {
  drawSpriteAtCell("player", gameState.player, () => {
    drawPlayerFallback();
  });
};

drawKey = function drawKeyWithIcon() {
  if (gameState.key.collected) {
    return;
  }

  drawSpriteAtCell("key", gameState.key.position, () => {
    drawKeyFallback();
  });
};

drawGoal = function drawGoalWithIcon() {
  drawSpriteAtCell(
    gameState.key.collected ? "goalOpen" : "goalClosed",
    gameState.goal.position,
    () => {
      drawGoalFallback();
    }
  );
};

drawBombs = function drawBombsWithIcons() {
  const spriteState = ensureIconSpriteSheet();
  if (!spriteState.loaded || !spriteState.image) {
    drawBombsFallback();
    return;
  }

  const explodedBombKeys = buildCellKeySet(gameState.explodedBombs);

  for (const bomb of gameState.bombs) {
    if (explodedBombKeys.has(getCellKey(bomb))) {
      continue;
    }

    drawSpriteAtCell("bomb", bomb, drawBombsFallback);
  }
};

drawDisarmItems = function drawDisarmItemsWithIcons() {
  const spriteState = ensureIconSpriteSheet();
  if (!spriteState.loaded || !spriteState.image) {
    drawDisarmItemsFallback();
    return;
  }

  for (const item of gameState.disarmItems) {
    drawSpriteAtCell("waterBucket", item, drawDisarmItemsFallback);
  }
};

getMakerToolHint = function getMakerToolHintWithBuckets(tool) {
  const hints = {
    [MAKER_TOOL.player]:
      "プレイヤー開始位置を置きます。このマスを含む空間がプレイヤー側として判定されます。",
    [MAKER_TOOL.key]:
      "鍵を置きます。プレイヤーと同じ空間に入った瞬間に取得されます。",
    [MAKER_TOOL.goal]:
      "ゴールを置きます。鍵取得後にプレイヤーと同じ空間へ入るとクリアです。",
    [MAKER_TOOL.bomb]:
      "爆弾を置きます。プレイヤーと同じ空間に入ると即ゲームオーバーです。",
    [MAKER_TOOL.disarm]:
      "水入りバケツを置きます。プレイヤーのいない空間で爆弾と同数なら対消滅します。",
    [MAKER_TOOL.wall]:
      "壁ブロックを置きます。線は通れず、外壁と組み合わせたループ形状にも影響します。",
    [MAKER_TOOL.erase]:
      "爆弾、水入りバケツ、壁ブロックを消します。",
  };

  return hints[tool] ?? "";
};

buildMakerObjectSummary = function buildMakerObjectSummaryWithBuckets() {
  return [
    `爆弾${gameState.bombs.length}個`,
    `水入りバケツ${gameState.disarmItems.length}個`,
    `壁${gameState.wallBlocks.length}個`,
  ].join(" / ");
};

getHudInstructionText = function getHudInstructionTextWithBuckets() {
  if (gameState.mode === GAME_MODE.maker) {
    return gameState.maker.editing
      ? "配置ツールを選んでキャンバスをクリックするとオブジェクトを置けます。"
      : "テストプレイ中です。プレイヤーは移動せず、ループの切り方だけで空間の所属を変えます。";
  }

  if (gameState.mode === GAME_MODE.tutorial) {
    return "チュートリアルです。プレイヤーは移動せず、ループでプレイヤー側の空間を調整して各ルールを確認します。";
  }

  if (gameState.mode === getStageModeKey()) {
    return "番号指定で読み込んだJSONステージです。プレイヤーは移動せず、ループだけで空間を切り替えます。";
  }

  return "ランダムモードです。オブジェクトのあるマスを避けて閉ループを作り、プレイヤーを含む空間に鍵とゴールをそろえます。プレイヤーのいない空間では、爆弾と水入りバケツが同数で対消滅します。"
    + CONTROL_HINT_TEXT;
};

render();

async function startMakerAutoSolve() {
  if (gameState.mode !== GAME_MODE.maker) {
    return;
  }

  const autoSolveState = getMakerAutoSolveState();
  if (autoSolveState.running) {
    return;
  }

  const stageToSolve = cloneStageDefinition(gameState.stage);
  stageToSolve.mode = GAME_MODE.maker;
  stageToSolve.makerEditing = false;
  stageToSolve.selectedMakerTool = gameState.maker.selectedTool;
  stageToSolve.instructionText = MAKER_TEST_INSTRUCTION_TEXT;

  autoSolveState.running = true;
  autoSolveState.runId += 1;
  autoSolveState.lastSolution = null;
  const runId = autoSolveState.runId;
  setMakerAutoSolveStatus("自動解法を準備しています...");
  render();

  try {
    const solution = await findStageAutoSolveSolution(stageToSolve, runId);
    if (isAutoSolveRunCancelled(runId)) {
      return;
    }

    if (!solution || solution.length === 0) {
      autoSolveState.running = false;
      setMakerAutoSolveStatus(
        "現状の自動ソルバでは、解ける手順が見つかりませんでした。",
        true
      );
      render();
      return;
    }

    autoSolveState.lastSolution = solution;
    setMakerAutoSolveStatus(
      `${solution.length}手の解法が見つかりました。再生します...`
    );
    render();

    const solved = await playAutoSolveSolution(stageToSolve, solution, runId);
    if (isAutoSolveRunCancelled(runId)) {
      return;
    }

    autoSolveState.running = false;
    setMakerAutoSolveStatus(
      solved
        ? `${solution.length}手で自動クリアしました。`
        : "解法の再生中に手順を再現できませんでした。",
      !solved
    );
    render();
  } catch (error) {
    if (isAutoSolveRunCancelled(runId)) {
      return;
    }

    autoSolveState.running = false;
    setMakerAutoSolveStatus(`自動解法に失敗しました: ${error.message}`, true);
    render();
  }
}

const renderWithoutAutoSolveHud = render;
render = function renderWithAutoSolveHud() {
  renderWithoutAutoSolveHud();
  syncMakerAutoSolveHud();
};

function registerMakerAutoSolveCancelHandlers() {
  const cancelMessage = "自動解法を中断しました。";
  const clickTargets = [
    resetButton,
    clearLoopButton,
    randomModeButton,
    tutorialModeButton,
    makerModeButton,
    tutorialPrevButton,
    tutorialNextButton,
    makerApplySizeButton,
    makerResetButton,
    makerTestButton,
    makerEditButton,
    getStageJsonUi().loadStageButton,
    getStageJsonUi().chooseStageFolderButton,
  ];

  for (const target of clickTargets) {
    target?.addEventListener("click", () => {
      cancelMakerAutoSolve(cancelMessage);
    });
  }

  canvas.addEventListener(
    "mousedown",
    () => {
      cancelMakerAutoSolve(cancelMessage);
    },
    true
  );
  canvas.addEventListener(
    "touchstart",
    () => {
      cancelMakerAutoSolve(cancelMessage);
    },
    { capture: true, passive: true }
  );

  document.addEventListener(
    "keydown",
    () => {
      cancelMakerAutoSolve(cancelMessage);
    },
    true
  );
}

getMakerAutoSolveUi().button?.addEventListener("click", () => {
  void startMakerAutoSolve();
});
registerMakerAutoSolveCancelHandlers();
globalThis.closedLoopDebug.findStageAutoSolveSolution = findStageAutoSolveSolution;
globalThis.closedLoopDebug.startMakerAutoSolve = startMakerAutoSolve;
render();

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

  gameState.status = gameState.loop ? "ループ成立中" : STATUS.idle;
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();

  if (key === "r") {
    event.preventDefault();
    resetGame(event.shiftKey);
    return;
  }

  if ([
    "arrowup",
    "arrowdown",
    "arrowleft",
    "arrowright",
    "w",
    "a",
    "s",
    "d",
  ].includes(key)) {
    event.preventDefault();
  }
}

function getMakerToolHint(tool) {
  const hints = {
    [MAKER_TOOL.player]:
      "プレイヤー開始位置を置きます。このマスを含む空間がプレイヤー側として判定されます。",
    [MAKER_TOOL.key]:
      "鍵を置きます。プレイヤーと同じ空間に入った瞬間に取得されます。",
    [MAKER_TOOL.goal]:
      "ゴールを置きます。鍵取得後にプレイヤーと同じ空間へ入るとクリアです。",
    [MAKER_TOOL.bomb]:
      "爆弾を置きます。プレイヤーと同じ空間に入ると即ゲームオーバーです。",
    [MAKER_TOOL.disarm]:
      "水入りバケツを置きます。プレイヤーのいない空間で爆弾と同数なら対消滅します。",
    [MAKER_TOOL.wall]:
      "壁ブロックを置きます。線は通れず、外壁と組み合わせたループ形状にも影響します。",
    [MAKER_TOOL.erase]:
      "爆弾、水入りバケツ、壁ブロックを消します。",
  };

  return hints[tool] ?? "";
}

function getHudInstructionText() {
  if (gameState.mode === GAME_MODE.maker) {
    return gameState.maker.editing
      ? "配置ツールを選んでキャンバスをクリックするとオブジェクトを置けます。"
      : "テストプレイ中です。プレイヤーは移動せず、ループの切り方だけで空間の所属を変えます。";
  }

  if (gameState.mode === GAME_MODE.tutorial) {
    return "チュートリアルです。プレイヤーは移動せず、ループでプレイヤー側の空間を調整して各ルールを確認します。";
  }

  if (gameState.mode === getStageModeKey()) {
    return "番号指定で読み込んだJSONステージです。プレイヤーは移動せず、ループだけで空間を切り替えます。";
  }

  return RANDOM_STAGE_INSTRUCTION_TEXT;
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

  return "ループ成立中";
}

function createAutoSolveSearchState(stage) {
  return {
    keyCollected: Boolean(stage.keyInitiallyCollected),
    bombs: clonePositions(stage.bombs),
    disarmItems: clonePositions(stage.disarmItems),
    clear: false,
    history: [],
  };
}

function getAutoSolvePositionSignature(positions) {
  return clonePositions(positions)
    .sort(compareGridPositions)
    .map(getCellKey)
    .join("|");
}

function serializeAutoSolveSearchState(state) {
  return [
    state.keyCollected ? "1" : "0",
    getAutoSolvePositionSignature(state.bombs),
    getAutoSolvePositionSignature(state.disarmItems),
  ].join("||");
}

function buildAutoSolveForbiddenKeys(stage, searchState) {
  const forbiddenKeys = new Set([
    getCellKey(stage.playerStart),
    getCellKey(stage.goalPosition),
    ...searchState.bombs.map(getCellKey),
    ...searchState.disarmItems.map(getCellKey),
  ]);

  if (!searchState.keyCollected) {
    forbiddenKeys.add(getCellKey(stage.keyPosition));
  }

  return forbiddenKeys;
}

function buildAutoSolveNextState(stage, currentState, loopCandidate) {
  const playerSpaceId = getLoopSpaceIdFromPosition(loopCandidate, stage.playerStart);
  if (playerSpaceId === null) {
    return null;
  }

  const bombsBySpace = groupPositionsByLoopSpaceForAutoSolve(
    currentState.bombs,
    loopCandidate
  );
  const disarmBySpace = groupPositionsByLoopSpaceForAutoSolve(
    currentState.disarmItems,
    loopCandidate
  );
  const bombsInPlayerSpace = bombsBySpace.get(playerSpaceId) || [];

  if (bombsInPlayerSpace.length > 0) {
    return null;
  }

  const removedBombKeys = new Set();
  const removedDisarmKeys = new Set();
  const targetSpaceIds = new Set([
    ...bombsBySpace.keys(),
    ...disarmBySpace.keys(),
  ]);

  for (const spaceId of targetSpaceIds) {
    if (spaceId === playerSpaceId) {
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

  const nextBombs = currentState.bombs.filter(
    (bomb) => !removedBombKeys.has(getCellKey(bomb))
  );
  const nextDisarmItems = currentState.disarmItems.filter(
    (item) => !removedDisarmKeys.has(getCellKey(item))
  );
  const nextKeyCollected =
    currentState.keyCollected ||
    getLoopSpaceIdFromPosition(loopCandidate, stage.keyPosition) === playerSpaceId;
  const goalSharesPlayerSpace =
    getLoopSpaceIdFromPosition(loopCandidate, stage.goalPosition) === playerSpaceId;
  const currentBombSignature = getAutoSolvePositionSignature(currentState.bombs);
  const currentDisarmSignature = getAutoSolvePositionSignature(currentState.disarmItems);
  const nextBombSignature = getAutoSolvePositionSignature(nextBombs);
  const nextDisarmSignature = getAutoSolvePositionSignature(nextDisarmItems);

  if (
    nextKeyCollected === currentState.keyCollected &&
    currentBombSignature === nextBombSignature &&
    currentDisarmSignature === nextDisarmSignature &&
    !(nextKeyCollected && goalSharesPlayerSpace)
  ) {
    return null;
  }

  return {
    keyCollected: nextKeyCollected,
    bombs: nextBombs,
    disarmItems: nextDisarmItems,
    clear: nextKeyCollected && goalSharesPlayerSpace,
    history: [
      ...currentState.history,
      {
        drawnCells: clonePositions(loopCandidate.drawnCells),
        kind: loopCandidate.kind,
      },
    ],
  };
}

async function findStageAutoSolveSolution(stage, runId = null) {
  const candidates = await buildAutoSolveCandidates(stage, runId);
  if (runId !== null && isAutoSolveRunCancelled(runId)) {
    return null;
  }

  const initialState = createAutoSolveSearchState(stage);
  const queue = [initialState];
  const visitedStates = new Set([serializeAutoSolveSearchState(initialState)]);
  let exploredStates = 0;

  while (queue.length > 0 && visitedStates.size <= AUTO_SOLVER_CONFIG.maxVisitedStates) {
    if (runId !== null && isAutoSolveRunCancelled(runId)) {
      return null;
    }

    const currentState = queue.shift();
    exploredStates += 1;

    if (exploredStates % AUTO_SOLVER_CONFIG.searchYieldInterval === 0) {
      setMakerAutoSolveStatus(
        `自動解法を探索中... ${exploredStates}状態 / ${visitedStates.size}記録`
      );
      render();
      await waitForAutoSolveTick();
    }

    if (currentState.clear) {
      return currentState.history;
    }

    if (currentState.history.length >= AUTO_SOLVER_CONFIG.maxSteps) {
      continue;
    }

    const forbiddenKeys = buildAutoSolveForbiddenKeys(stage, currentState);

    for (const loopCandidate of candidates) {
      if (!canAutoSolveCandidateBeDrawn(loopCandidate, forbiddenKeys)) {
        continue;
      }

      const nextState = buildAutoSolveNextState(stage, currentState, loopCandidate);
      if (!nextState) {
        continue;
      }

      if (nextState.clear) {
        return nextState.history;
      }

      const signature = serializeAutoSolveSearchState(nextState);
      if (visitedStates.has(signature)) {
        continue;
      }

      visitedStates.add(signature);
      queue.push(nextState);
    }
  }

  return null;
}

async function playAutoSolveSolution(stage, solution, runId) {
  applyStage(cloneStageDefinition(stage));

  for (const step of solution) {
    if (isAutoSolveRunCancelled(runId)) {
      return false;
    }

    clearLoopStateWithoutRender();
    gameState.drawing.active = true;
    gameState.drawing.cells = clonePositions(step.drawnCells);
    updateStatus();
    render();
    await waitForAutoSolveTick(AUTO_SOLVER_CONFIG.animationLoopPreviewMs);

    if (isAutoSolveRunCancelled(runId)) {
      return false;
    }

    const nextLoop = buildLoopFromCells(
      step.drawnCells,
      activeBoardSize,
      gameState.wallBlocks
    );
    if (!nextLoop) {
      return false;
    }

    gameState.loop = nextLoop;
    gameState.drawing.active = false;
    gameState.drawing.cells = [];
    applyLoopEffects();
    render();
    await waitForAutoSolveTick(AUTO_SOLVER_CONFIG.animationLoopApplyMs);
  }

  return gameState.clear;
}
