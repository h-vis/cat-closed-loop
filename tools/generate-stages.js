const fs = require("fs");
const path = require("path");

const solver = require("../solver");

const DEFAULT_OUTPUT_ROOT = path.join(__dirname, "..", "output");

const DIFFICULTY_CONFIGS = {
  1: {
    boardWidths: [6, 7],
    boardHeights: [6, 7],
    bombRange: [1, 2],
    bucketRange: [0, 1],
    wallSegments: [0, 1],
    wallSegmentLength: [2, 3],
    solveMaxSteps: 4,
  },
  2: {
    boardWidths: [7, 8],
    boardHeights: [7, 8],
    bombRange: [1, 2],
    bucketRange: [0, 2],
    wallSegments: [0, 2],
    wallSegmentLength: [2, 4],
    solveMaxSteps: 5,
  },
  3: {
    boardWidths: [10, 10],
    boardHeights: [10, 10],
    bombRange: [2, 3],
    bucketRange: [0, 2],
    wallSegments: [1, 3],
    wallSegmentLength: [2, 4],
    solveMaxSteps: 6,
  },
  4: {
    boardWidths: [10, 10],
    boardHeights: [10, 10],
    bombRange: [2, 4],
    bucketRange: [1, 3],
    wallSegments: [1, 4],
    wallSegmentLength: [1, 5],
    solveMaxSteps: 6,
  },
  5: {
    boardWidths: [10, 10],
    boardHeights: [10, 10],
    bombRange: [3, 5],
    bucketRange: [1, 4],
    wallSegments: [1, 5],
    wallSegmentLength: [1, 5],
    solveMaxSteps: 6,
  },
};

function createRng(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function parseArgs(argv) {
  const count = Number(argv[0] ?? 1);
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error("Usage: node tools/generate-stages.js <count> [--output output] [--seed 123]");
  }

  const options = {
    count,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    seed: Date.now() & 0xffffffff,
    maxAttemptsPerDifficulty: Math.max(250, count * 400),
  };

  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output" && argv[index + 1]) {
      options.outputRoot = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === "--seed" && argv[index + 1]) {
      options.seed = Number(argv[index + 1]) >>> 0;
      index += 1;
      continue;
    }
    if (arg === "--max-attempts" && argv[index + 1]) {
      options.maxAttemptsPerDifficulty = Number(argv[index + 1]);
      index += 1;
      continue;
    }
  }

  return options;
}

function pickInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

function chance(random, probability) {
  return random() < probability;
}

function getCellKey(position) {
  return `${position.x},${position.y}`;
}

function clonePosition(position) {
  return { x: position.x, y: position.y };
}

function compareGridPositions(left, right) {
  if (left.y !== right.y) {
    return left.y - right.y;
  }
  return left.x - right.x;
}

function isInsideBoard(position, boardSize) {
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x < boardSize.width &&
    position.y < boardSize.height
  );
}

function manhattanDistance(left, right) {
  return Math.abs(left.x - right.x) + Math.abs(left.y - right.y);
}

function buildAllCells(boardSize) {
  const cells = [];
  for (let y = 0; y < boardSize.height; y += 1) {
    for (let x = 0; x < boardSize.width; x += 1) {
      cells.push({ x, y });
    }
  }
  return cells;
}

function takeRandomCell(random, cells, usedKeys, predicate = () => true) {
  const candidates = cells.filter(
    (cell) => !usedKeys.has(getCellKey(cell)) && predicate(cell)
  );
  if (candidates.length === 0) {
    return null;
  }
  return clonePosition(candidates[pickInt(random, 0, candidates.length - 1)]);
}

function reservePosition(usedKeys, position) {
  usedKeys.add(getCellKey(position));
}

function addRandomWallSegments(random, boardSize, usedKeys, segmentCount, segmentLengthRange) {
  const walls = [];
  const wallKeys = new Set();
  const allCells = buildAllCells(boardSize);

  for (let count = 0; count < segmentCount; count += 1) {
    const orientation = chance(random, 0.5) ? "horizontal" : "vertical";
    const length = pickInt(random, segmentLengthRange[0], segmentLengthRange[1]);
    let placed = false;

    for (let attempt = 0; attempt < 30 && !placed; attempt += 1) {
      const start = allCells[pickInt(random, 0, allCells.length - 1)];
      const cells = [];

      for (let index = 0; index < length; index += 1) {
        const cell = {
          x: start.x + (orientation === "horizontal" ? index : 0),
          y: start.y + (orientation === "vertical" ? index : 0),
        };
        if (
          !isInsideBoard(cell, boardSize) ||
          usedKeys.has(getCellKey(cell)) ||
          wallKeys.has(getCellKey(cell))
        ) {
          cells.length = 0;
          break;
        }
        cells.push(cell);
      }

      if (cells.length === length) {
        for (const cell of cells) {
          wallKeys.add(getCellKey(cell));
          walls.push(clonePosition(cell));
        }
        placed = true;
      }
    }
  }

  return walls.sort(compareGridPositions);
}

function buildRandomStage(random, difficulty) {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const boardSize = {
    width: pickInt(random, config.boardWidths[0], config.boardWidths[1]),
    height: pickInt(random, config.boardHeights[0], config.boardHeights[1]),
  };

  const usedKeys = new Set();
  const allCells = buildAllCells(boardSize);
  const center = {
    x: Math.floor(boardSize.width / 2),
    y: Math.floor(boardSize.height / 2),
  };

  const playerStart = takeRandomCell(
    random,
    allCells,
    usedKeys,
    (cell) => manhattanDistance(cell, center) >= Math.floor(boardSize.width / 2)
  );
  reservePosition(usedKeys, playerStart);

  const keyPosition = takeRandomCell(
    random,
    allCells,
    usedKeys,
    (cell) => manhattanDistance(cell, playerStart) >= Math.floor((boardSize.width + boardSize.height) / 3)
  );
  reservePosition(usedKeys, keyPosition);

  const goalPosition = takeRandomCell(
    random,
    allCells,
    usedKeys,
    (cell) =>
      manhattanDistance(cell, keyPosition) >= Math.floor((boardSize.width + boardSize.height) / 3) &&
      manhattanDistance(cell, playerStart) >= Math.floor((boardSize.width + boardSize.height) / 3)
  );
  reservePosition(usedKeys, goalPosition);

  const bombCount = pickInt(random, config.bombRange[0], config.bombRange[1]);
  const bombs = [];
  for (let index = 0; index < bombCount; index += 1) {
    const bomb = takeRandomCell(
      random,
      allCells,
      usedKeys,
      (cell) =>
        manhattanDistance(cell, playerStart) >= 2 &&
        manhattanDistance(cell, keyPosition) >= 1
    );
    if (!bomb) {
      break;
    }
    bombs.push(bomb);
    reservePosition(usedKeys, bomb);
  }

  if (bombs.length === 0) {
    return null;
  }

  const includeBuckets = chance(random, 0.7);
  const includeWarps = chance(random, 0.35);
  const includeLateWarps = chance(random, 0.35);

  const disarmItems = [];
  if (includeBuckets) {
    const targetBuckets = Math.min(
      bombs.length,
      pickInt(random, config.bucketRange[0], config.bucketRange[1])
    );
    for (let index = 0; index < targetBuckets; index += 1) {
      const bucket = takeRandomCell(
        random,
        allCells,
        usedKeys,
        (cell) =>
          manhattanDistance(cell, playerStart) >= 2 &&
          manhattanDistance(cell, goalPosition) >= 1
      );
      if (!bucket) {
        break;
      }
      disarmItems.push(bucket);
      reservePosition(usedKeys, bucket);
    }
  }

  function createWarpPair() {
    const first = takeRandomCell(
      random,
      allCells,
      usedKeys,
      (cell) => manhattanDistance(cell, playerStart) >= 2
    );
    if (!first) {
      return [];
    }
    reservePosition(usedKeys, first);

    const second = takeRandomCell(
      random,
      allCells,
      usedKeys,
      (cell) =>
        manhattanDistance(cell, first) >= Math.floor((boardSize.width + boardSize.height) / 3)
    );
    if (!second) {
      usedKeys.delete(getCellKey(first));
      return [];
    }
    reservePosition(usedKeys, second);
    return [first, second];
  }

  const warps = includeWarps ? createWarpPair() : [];
  const lateWarps = includeLateWarps ? createWarpPair() : [];

  const wallSegmentCount = pickInt(
    random,
    config.wallSegments[0],
    config.wallSegments[1]
  );
  const wallBlocks = addRandomWallSegments(
    random,
    boardSize,
    usedKeys,
    wallSegmentCount,
    config.wallSegmentLength
  );

  return {
    version: 1,
    boardSize,
    playerStart,
    keyPosition,
    goalPosition,
    bombs,
    disarmItems,
    warps,
    lateWarps,
    wallBlocks,
    keyInitiallyCollected: false,
    designLabel: `Generated D${difficulty}`,
    designNote: `auto-generated difficulty ${difficulty}`,
    instructionText:
      "Generated stage. Collect the key, avoid bombs, and reach the goal.",
  };
}

function analyzeSolution(stage, solution) {
  let state = solver.createInitialState(stage);
  let maxSpaces = 0;
  const spacesPerMove = [];

  for (const step of solution) {
    const loop = solver.buildLoopFromDrawnCells(step.drawnCells, stage);
    if (!loop) {
      throw new Error("Generated solution replay failed: invalid loop.");
    }

    spacesPerMove.push(loop.spaces.length);
    maxSpaces = Math.max(maxSpaces, loop.spaces.length);

    const nextState = solver.applyLoop(state, loop, stage);
    if (!nextState) {
      throw new Error("Generated solution replay failed: loop had no effect.");
    }
    state = {
      ...nextState,
      history: state.history.concat([step]),
    };
  }

  return {
    solved: state.clear,
    steps: solution.length,
    maxSpacesPerMove: maxSpaces,
    spacesPerMove,
  };
}

function classifyDifficulty(metrics) {
  const score = metrics.steps * 2 + Math.max(0, metrics.maxSpacesPerMove - 2);

  if (score <= 4) {
    return 1;
  }
  if (score <= 6) {
    return 2;
  }
  if (score <= 8) {
    return 3;
  }
  if (score <= 10) {
    return 4;
  }
  return 5;
}

function stageSignature(stage) {
  const encodeList = (items) =>
    items.map(getCellKey).sort().join("|");

  return [
    `${stage.boardSize.width}x${stage.boardSize.height}`,
    getCellKey(stage.playerStart),
    getCellKey(stage.keyPosition),
    getCellKey(stage.goalPosition),
    encodeList(stage.bombs),
    encodeList(stage.disarmItems),
    encodeList(stage.warps),
    encodeList(stage.lateWarps),
    encodeList(stage.wallBlocks),
  ].join("||");
}

function ensureDir(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function writeStageFile(outputRoot, difficulty, index, stage, metrics, solution) {
  const directoryPath = path.join(outputRoot, String(difficulty));
  ensureDir(directoryPath);

  const stageJson = {
    ...stage,
    designLabel: `Generated ${difficulty}-${String(index).padStart(3, "0")}`,
    designNote: `auto-generated difficulty=${difficulty} steps=${metrics.steps} maxSpacesPerMove=${metrics.maxSpacesPerMove}`,
    generatedMetrics: metrics,
    generatedSolutionPreview: solution,
  };

  const filePath = path.join(directoryPath, `${String(index).padStart(3, "0")}.json`);
  fs.writeFileSync(filePath, JSON.stringify(stageJson, null, 2));
  return filePath;
}

function generateDifficultySet(random, difficulty, count, outputRoot, maxAttemptsPerDifficulty) {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const results = [];
  const seenSignatures = new Set();
  let attempts = 0;

  while (results.length < count && attempts < maxAttemptsPerDifficulty) {
    attempts += 1;
    const stage = buildRandomStage(random, difficulty);
    if (!stage) {
      continue;
    }

    const signature = stageSignature(stage);
    if (seenSignatures.has(signature)) {
      continue;
    }
    seenSignatures.add(signature);

    let solution = null;
    try {
      solution = solver.findStageRegionBasedSolution(stage, {
        maxSteps: config.solveMaxSteps,
      });
    } catch (error) {
      continue;
    }

    if (!solution || solution.length === 0) {
      continue;
    }

    let metrics;
    try {
      metrics = analyzeSolution(stage, solution);
    } catch (error) {
      continue;
    }

    if (!metrics.solved) {
      continue;
    }

    const classifiedDifficulty = classifyDifficulty(metrics);
    if (classifiedDifficulty !== difficulty) {
      continue;
    }

    const filePath = writeStageFile(
      outputRoot,
      difficulty,
      results.length + 1,
      stage,
      metrics,
      solution
    );

    results.push({
      difficulty,
      filePath,
      attempts,
      metrics,
      featureFlags: {
        bombs: stage.bombs.length,
        buckets: stage.disarmItems.length,
        purpleWarp: stage.warps.length === 2,
        blueWarp: stage.lateWarps.length === 2,
        walls: stage.wallBlocks.length,
      },
    });

    console.log(
      `[generated] difficulty=${difficulty} count=${results.length}/${count} file=${filePath} steps=${metrics.steps} maxSpaces=${metrics.maxSpacesPerMove}`
    );
  }

  return {
    difficulty,
    attempts,
    generated: results.length,
    requested: count,
    results,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const random = createRng(options.seed);
  ensureDir(options.outputRoot);

  console.log(`seed=${options.seed}`);
  console.log(`output=${options.outputRoot}`);

  const summaries = [];
  for (let difficulty = 1; difficulty <= 5; difficulty += 1) {
    const summary = generateDifficultySet(
      random,
      difficulty,
      options.count,
      options.outputRoot,
      options.maxAttemptsPerDifficulty
    );
    summaries.push(summary);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    seed: options.seed,
    countPerDifficulty: options.count,
    outputRoot: options.outputRoot,
    summaries,
  };

  const reportPath = path.join(options.outputRoot, "generation-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("");
  console.log(JSON.stringify(report, null, 2));
  console.log(`Saved report: ${reportPath}`);
}

main();
