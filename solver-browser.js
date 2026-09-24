(function attachClosedLoopRegionSolver(globalScope) {
  "use strict";

  function clonePosition(position) {
    return { x: position.x, y: position.y };
  }

  function clonePositions(positions) {
    return (positions || []).map(clonePosition);
  }

  function getCellKey(position) {
    return `${position.x},${position.y}`;
  }

  function compareGridPositions(left, right) {
    if (left.y !== right.y) {
      return left.y - right.y;
    }
    return left.x - right.x;
  }

  function normalizeStage(stageJson) {
    return {
      version: Number((stageJson && stageJson.version) || 1),
      boardSize: {
        width: Number((stageJson && stageJson.boardSize && stageJson.boardSize.width) || 10),
        height: Number((stageJson && stageJson.boardSize && stageJson.boardSize.height) || 10),
      },
      playerStart: clonePosition(stageJson.playerStart),
      keyPosition: clonePosition(stageJson.keyPosition),
      goalPosition: clonePosition(stageJson.goalPosition),
      bombs: clonePositions(stageJson.bombs),
      disarmItems: clonePositions(stageJson.disarmItems),
      wallBlocks: clonePositions(stageJson.wallBlocks),
      warps: clonePositions(stageJson.warps),
      lateWarps: clonePositions(stageJson.lateWarps),
      keyInitiallyCollected: Boolean(stageJson.keyInitiallyCollected),
      designLabel: String((stageJson && stageJson.designLabel) || ""),
    };
  }

  function isInsideBoard(position, boardSize) {
    return (
      position.x >= 0 &&
      position.y >= 0 &&
      position.x < boardSize.width &&
      position.y < boardSize.height
    );
  }

  function isBorderCell(position, boardSize) {
    return (
      position.x === 0 ||
      position.y === 0 ||
      position.x === boardSize.width - 1 ||
      position.y === boardSize.height - 1
    );
  }

  function getCellNeighbors(position, boardSize) {
    return [
      { x: position.x + 1, y: position.y },
      { x: position.x - 1, y: position.y },
      { x: position.x, y: position.y + 1 },
      { x: position.x, y: position.y - 1 },
    ].filter((neighbor) => isInsideBoard(neighbor, boardSize));
  }

  function getUniqueCells(cells) {
    const result = [];
    const seen = new Set();
    for (const cell of cells) {
      const key = getCellKey(cell);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      result.push(clonePosition(cell));
    }
    return result;
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
      return segment;
    }

    return [];
  }

  function buildPolylineCells(vertices) {
    if (!Array.isArray(vertices) || vertices.length === 0) {
      return [];
    }

    const cells = [clonePosition(vertices[0])];
    for (let index = 1; index < vertices.length; index += 1) {
      const previous = vertices[index - 1];
      const current = vertices[index];
      if (previous.x !== current.x && previous.y !== current.y) {
        return [];
      }
      cells.push.apply(cells, buildCellSegment(previous, current));
    }

    return getUniqueCells(cells);
  }

  function collectConnectedWallBlocks(drawnCells, wallBlocks, boardSize) {
    if (drawnCells.length === 0 || wallBlocks.length === 0) {
      return [];
    }

    const wallBlockMap = new Map(
      wallBlocks.map((cell) => [getCellKey(cell), clonePosition(cell)])
    );
    const queue = [];
    const visited = new Set();

    for (const drawnCell of drawnCells) {
      for (const neighbor of getCellNeighbors(drawnCell, boardSize)) {
        const key = getCellKey(neighbor);
        if (!wallBlockMap.has(key) || visited.has(key)) {
          continue;
        }
        visited.add(key);
        queue.push(clonePosition(neighbor));
      }
    }

    const result = [];
    while (queue.length > 0) {
      const current = queue.shift();
      result.push(clonePosition(current));

      for (const neighbor of getCellNeighbors(current, boardSize)) {
        const key = getCellKey(neighbor);
        if (!wallBlockMap.has(key) || visited.has(key)) {
          continue;
        }
        visited.add(key);
        queue.push(clonePosition(neighbor));
      }
    }

    return result;
  }

  function analyzeSingleComponentTopology(lineCells, lineCellKeys, boardSize) {
    if (lineCells.length === 0) {
      return null;
    }

    const visited = new Set();
    const queue = [lineCells[0]];
    visited.add(getCellKey(lineCells[0]));

    while (queue.length > 0) {
      const current = queue.shift();
      for (const neighbor of getCellNeighbors(current, boardSize)) {
        const neighborKey = getCellKey(neighbor);
        if (!lineCellKeys.has(neighborKey) || visited.has(neighborKey)) {
          continue;
        }
        visited.add(neighborKey);
        queue.push(neighbor);
      }
    }

    if (visited.size !== lineCells.length) {
      return null;
    }

    const endpointCells = [];
    for (const lineCell of lineCells) {
      let degree = 0;
      for (const neighbor of getCellNeighbors(lineCell, boardSize)) {
        if (lineCellKeys.has(getCellKey(neighbor))) {
          degree += 1;
        }
      }

      if (degree >= 3 || degree === 0) {
        return null;
      }
      if (degree === 1) {
        endpointCells.push(clonePosition(lineCell));
      }
    }

    if (endpointCells.length === 0) {
      return { kind: "cycle", endpointCells: [] };
    }

    if (endpointCells.length !== 2) {
      return null;
    }

    if (!endpointCells.every((cell) => isBorderCell(cell, boardSize))) {
      return null;
    }

    return { kind: "border-path", endpointCells };
  }

  function computeLoopSpaces(lineCellKeys, boardSize) {
    const visited = new Set();
    const spaceByCellKey = new Map();
    const spaces = [];

    for (let y = 0; y < boardSize.height; y += 1) {
      for (let x = 0; x < boardSize.width; x += 1) {
        const startCell = { x, y };
        const startKey = getCellKey(startCell);
        if (visited.has(startKey) || lineCellKeys.has(startKey)) {
          continue;
        }

        const queue = [startCell];
        const cells = [];
        visited.add(startKey);

        while (queue.length > 0) {
          const current = queue.shift();
          cells.push(clonePosition(current));

          for (const neighbor of getCellNeighbors(current, boardSize)) {
            const neighborKey = getCellKey(neighbor);
            if (visited.has(neighborKey) || lineCellKeys.has(neighborKey)) {
              continue;
            }
            visited.add(neighborKey);
            queue.push(neighbor);
          }
        }

        const space = { id: spaces.length, cells };
        for (const cell of cells) {
          spaceByCellKey.set(getCellKey(cell), space.id);
        }
        spaces.push(space);
      }
    }

    return { spaces, spaceByCellKey };
  }

  function buildLoopFromDrawnCells(drawnCells, stage) {
    const boardSize = stage.boardSize;
    const uniqueDrawnCells = getUniqueCells(drawnCells).filter((cell) =>
      isInsideBoard(cell, boardSize)
    );
    const connectedWallBlocks = collectConnectedWallBlocks(
      uniqueDrawnCells,
      stage.wallBlocks || [],
      boardSize
    );
    const lineCells = getUniqueCells(uniqueDrawnCells.concat(connectedWallBlocks));
    const lineCellKeys = new Set(lineCells.map(getCellKey));

    const topology = analyzeSingleComponentTopology(lineCells, lineCellKeys, boardSize);
    if (!topology) {
      return null;
    }

    const computed = computeLoopSpaces(lineCellKeys, boardSize);
    if (computed.spaces.length === 0) {
      return null;
    }

    return {
      drawnCells: uniqueDrawnCells,
      connectedWallBlocks,
      lineCells,
      lineCellKeys,
      spaces: computed.spaces,
      spaceByCellKey: computed.spaceByCellKey,
      kind: topology.kind,
    };
  }

  function createStateSignature(state) {
    const bombSignature = clonePositions(state.bombs).sort(compareGridPositions).map(getCellKey).join("|");
    const disarmSignature = clonePositions(state.disarmItems).sort(compareGridPositions).map(getCellKey).join("|");
    return `${state.playerPosition ? getCellKey(state.playerPosition) : ""}||${state.keyCollected ? 1 : 0}||${bombSignature}||${disarmSignature}`;
  }

  function createInitialState(stage) {
    return {
      playerPosition: clonePosition(stage.playerStart),
      keyCollected: Boolean(stage.keyInitiallyCollected),
      bombs: clonePositions(stage.bombs),
      disarmItems: clonePositions(stage.disarmItems),
      history: [],
      clear: false,
    };
  }

  function groupPositionsBySpace(positions, loop) {
    const grouped = new Map();
    for (const position of positions) {
      const spaceId = loop.spaceByCellKey.get(getCellKey(position));
      if (spaceId === undefined) {
        continue;
      }
      if (!grouped.has(spaceId)) {
        grouped.set(spaceId, []);
      }
      grouped.get(spaceId).push(clonePosition(position));
    }
    return grouped;
  }

  function applyLoop(state, loop, stage) {
    const playerSpaceId = loop.spaceByCellKey.get(getCellKey(state.playerPosition || stage.playerStart));
    if (playerSpaceId === undefined) {
      return null;
    }

    const bombsBySpace = groupPositionsBySpace(state.bombs, loop);
    const disarmBySpace = groupPositionsBySpace(state.disarmItems, loop);
    const bombsInPlayerSpace = bombsBySpace.get(playerSpaceId) || [];
    if (bombsInPlayerSpace.length > 0) {
      return null;
    }

    const removedBombKeys = new Set();
    const removedDisarmKeys = new Set();
    const spaceIds = new Set([].concat(Array.from(bombsBySpace.keys()), Array.from(disarmBySpace.keys())));

    for (const spaceId of spaceIds) {
      if (spaceId === playerSpaceId) {
        continue;
      }

      const bombsInSpace = bombsBySpace.get(spaceId) || [];
      const disarmInSpace = disarmBySpace.get(spaceId) || [];
      if (bombsInSpace.length > 0 && bombsInSpace.length === disarmInSpace.length) {
        for (const bomb of bombsInSpace) {
          removedBombKeys.add(getCellKey(bomb));
        }
        for (const item of disarmInSpace) {
          removedDisarmKeys.add(getCellKey(item));
        }
      }
    }

    const nextBombs = state.bombs.filter((bomb) => !removedBombKeys.has(getCellKey(bomb)));
    const nextDisarmItems = state.disarmItems.filter((item) => !removedDisarmKeys.has(getCellKey(item)));
    const keySpaceId = loop.spaceByCellKey.get(getCellKey(stage.keyPosition));
    const nextKeyCollected = state.keyCollected || keySpaceId === playerSpaceId;
    const goalSpaceId = loop.spaceByCellKey.get(getCellKey(stage.goalPosition));
    const clear = Boolean(nextKeyCollected && goalSpaceId === playerSpaceId);

    const changed =
      nextKeyCollected !== state.keyCollected ||
      nextBombs.length !== state.bombs.length ||
      nextDisarmItems.length !== state.disarmItems.length ||
      clear;

    if (!changed) {
      return null;
    }

    return {
      playerPosition: clonePosition(clear ? stage.goalPosition : !state.keyCollected && nextKeyCollected ? stage.keyPosition : state.playerPosition || stage.playerStart),
      keyCollected: nextKeyCollected,
      bombs: nextBombs,
      disarmItems: nextDisarmItems,
      history: state.history,
      clear,
    };
  }

  function buildBlockedDrawnCellSet(stage, state) {
    const blocked = new Set([
      getCellKey(state.playerPosition || stage.playerStart),
      getCellKey(stage.goalPosition),
    ].concat(
      clonePositions(stage.wallBlocks).map(getCellKey),
      clonePositions(state.bombs).map(getCellKey),
      clonePositions(state.disarmItems).map(getCellKey)
    ));

    if (!state.keyCollected) {
      blocked.add(getCellKey(stage.keyPosition));
    }

    return blocked;
  }

  function lineTouchesImportantObjects(loop, stage, state) {
    const importantKeys = new Set([
      getCellKey(state.playerPosition || stage.playerStart),
      getCellKey(stage.goalPosition),
    ].concat(state.bombs.map(getCellKey), state.disarmItems.map(getCellKey)));

    if (!state.keyCollected) {
      importantKeys.add(getCellKey(stage.keyPosition));
    }

    for (const key of loop.lineCellKeys) {
      if (importantKeys.has(key)) {
        return true;
      }
    }

    return false;
  }

  function createObjectivePoints(stage, state) {
    const target = state.keyCollected ? stage.goalPosition : stage.keyPosition;
    return [state.playerPosition || stage.playerStart, target]
      .concat(state.bombs, state.disarmItems, stage.wallBlocks || []);
  }

  function clampValue(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function buildCandidateCoordinateValues(stage, state) {
    const points = createObjectivePoints(stage, state);
    const xValues = new Set([0, stage.boardSize.width - 1]);
    const yValues = new Set([0, stage.boardSize.height - 1]);

    for (const point of points) {
      for (const delta of [-2, -1, 0, 1, 2]) {
        xValues.add(clampValue(point.x + delta, 0, stage.boardSize.width - 1));
        yValues.add(clampValue(point.y + delta, 0, stage.boardSize.height - 1));
      }
    }

    return {
      xValues: Array.from(xValues).sort((left, right) => left - right),
      yValues: Array.from(yValues).sort((left, right) => left - right),
    };
  }

  function buildPivotNodes(stage, state) {
    const blockedDrawnCells = buildBlockedDrawnCellSet(stage, state);
    const wallBlockKeys = new Set((stage.wallBlocks || []).map(getCellKey));
    const values = buildCandidateCoordinateValues(stage, state);
    const nodeMap = new Map();

    function addNode(cell) {
      if (!isInsideBoard(cell, stage.boardSize)) {
        return;
      }
      const key = getCellKey(cell);
      if (blockedDrawnCells.has(key) || wallBlockKeys.has(key) || nodeMap.has(key)) {
        return;
      }
      nodeMap.set(key, clonePosition(cell));
    }

    for (const x of values.xValues) {
      for (const y of values.yValues) {
        addNode({ x, y });
      }
    }

    for (const point of createObjectivePoints(stage, state)) {
      for (const neighbor of getCellNeighbors(point, stage.boardSize)) {
        addNode(neighbor);
      }
    }

    const nodes = Array.from(nodeMap.values());
    nodes.sort(compareGridPositions);
    return nodes;
  }

  function buildVisibilityGraph(nodes, stage, state) {
    const blockedDrawnCells = buildBlockedDrawnCellSet(stage, state);
    const wallBlockKeys = new Set((stage.wallBlocks || []).map(getCellKey));
    const nodeByKey = new Map(nodes.map((node) => [getCellKey(node), node]));
    const nodesByX = new Map();
    const nodesByY = new Map();

    for (const node of nodes) {
      if (!nodesByX.has(node.x)) {
        nodesByX.set(node.x, []);
      }
      if (!nodesByY.has(node.y)) {
        nodesByY.set(node.y, []);
      }
      nodesByX.get(node.x).push(node);
      nodesByY.get(node.y).push(node);
    }

    const graph = new Map(nodes.map((node) => [getCellKey(node), []]));

    function tryConnect(start, end) {
      const segment = buildCellSegment(start, end);
      if (segment.length === 0) {
        return;
      }

      for (const cell of segment) {
        const key = getCellKey(cell);
        if (blockedDrawnCells.has(key) || wallBlockKeys.has(key)) {
          return;
        }
      }

      graph.get(getCellKey(start)).push({
        toKey: getCellKey(end),
        cells: segment.map(clonePosition),
        length: segment.length,
      });
    }

    for (const columnNodes of nodesByX.values()) {
      columnNodes.sort(compareGridPositions);
      for (let index = 0; index < columnNodes.length; index += 1) {
        for (let otherIndex = index + 1; otherIndex < columnNodes.length; otherIndex += 1) {
          tryConnect(columnNodes[index], columnNodes[otherIndex]);
        }
      }
    }

    for (const rowNodes of nodesByY.values()) {
      rowNodes.sort(compareGridPositions);
      for (let index = 0; index < rowNodes.length; index += 1) {
        for (let otherIndex = index + 1; otherIndex < rowNodes.length; otherIndex += 1) {
          tryConnect(rowNodes[index], rowNodes[otherIndex]);
        }
      }
    }

    const anchors = nodes.filter((node) => {
      if (isBorderCell(node, stage.boardSize)) {
        return true;
      }
      return getCellNeighbors(node, stage.boardSize).some((neighbor) =>
        wallBlockKeys.has(getCellKey(neighbor))
      );
    });

    return { graph, nodeByKey, anchors };
  }

  function getPathCellsFromNodePath(startNode, edges) {
    const cells = [clonePosition(startNode)];
    for (const edge of edges) {
      cells.push.apply(cells, edge.cells.map(clonePosition));
    }
    return getUniqueCells(cells);
  }

  function countPathBends(startNode, edges, nodeByKey) {
    let previousDirection = null;
    let bends = 0;
    let previousNode = startNode;

    for (const edge of edges) {
      const nextNode = nodeByKey.get(edge.toKey);
      const direction =
        previousNode.x === nextNode.x
          ? `v:${Math.sign(nextNode.y - previousNode.y)}`
          : `h:${Math.sign(nextNode.x - previousNode.x)}`;

      if (previousDirection !== null && previousDirection !== direction) {
        bends += 1;
      }
      previousDirection = direction;
      previousNode = nextNode;
    }

    return bends;
  }

  function buildLoopCandidateFromCells(drawnCells, stage, state) {
    if (drawnCells.length === 0) {
      return null;
    }

    const blockedDrawnCells = buildBlockedDrawnCellSet(stage, state);
    if (drawnCells.some((cell) => blockedDrawnCells.has(getCellKey(cell)))) {
      return null;
    }

    const loop = buildLoopFromDrawnCells(drawnCells, stage);
    if (!loop || lineTouchesImportantObjects(loop, stage, state)) {
      return null;
    }

    const nextState = applyLoop(state, loop, stage);
    if (!nextState) {
      return null;
    }

    const targetPosition = state.keyCollected ? stage.goalPosition : stage.keyPosition;
    const playerSpaceId = loop.spaceByCellKey.get(getCellKey(state.playerPosition || stage.playerStart));
    const targetSpaceId = loop.spaceByCellKey.get(getCellKey(targetPosition));
    const removedObjectCount =
      state.bombs.length - nextState.bombs.length +
      (state.disarmItems.length - nextState.disarmItems.length);

    return {
      drawnCells: getUniqueCells(drawnCells),
      loop,
      nextState: {
        playerPosition: nextState.playerPosition,
        keyCollected: nextState.keyCollected,
        bombs: nextState.bombs,
        disarmItems: nextState.disarmItems,
        clear: nextState.clear,
        history: state.history.concat([
          {
            drawnCells: getUniqueCells(drawnCells),
          },
        ]),
      },
      score:
        (nextState.clear ? 100000 : 0) +
        (nextState.keyCollected && !state.keyCollected ? 5000 : 0) +
        (playerSpaceId === targetSpaceId ? 900 : 0) +
        removedObjectCount * 50 -
        drawnCells.length,
    };
  }

  function addCandidateIfUseful(candidateMap, drawnCells, stage, state) {
    const candidate = buildLoopCandidateFromCells(drawnCells, stage, state);
    if (!candidate) {
      return false;
    }

    const signature = Array.from(candidate.loop.lineCellKeys).sort().join("|");
    if (!candidateMap.has(signature) || candidateMap.get(signature).score < candidate.score) {
      candidateMap.set(signature, candidate);
    }
    return true;
  }

  function generateRectangleCycles(stage, state, candidateMap) {
    const values = buildCandidateCoordinateValues(stage, state);

    for (let leftIndex = 0; leftIndex < values.xValues.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < values.xValues.length; rightIndex += 1) {
        const left = values.xValues[leftIndex];
        const right = values.xValues[rightIndex];
        if (right - left < 2) {
          continue;
        }

        for (let topIndex = 0; topIndex < values.yValues.length; topIndex += 1) {
          for (let bottomIndex = topIndex + 1; bottomIndex < values.yValues.length; bottomIndex += 1) {
            const top = values.yValues[topIndex];
            const bottom = values.yValues[bottomIndex];
            if (bottom - top < 2) {
              continue;
            }

            const cells = buildPolylineCells([
              { x: left, y: top },
              { x: right, y: top },
              { x: right, y: bottom },
              { x: left, y: bottom },
              { x: left, y: top },
            ]);

            addCandidateIfUseful(candidateMap, cells, stage, state);
          }
        }
      }
    }
  }

  function getBorderAnchors(stage, state) {
    const blockedDrawnCells = buildBlockedDrawnCellSet(stage, state);
    const anchors = [];

    for (let x = 0; x < stage.boardSize.width; x += 1) {
      for (const y of [0, stage.boardSize.height - 1]) {
        const cell = { x, y };
        if (!blockedDrawnCells.has(getCellKey(cell))) {
          anchors.push(cell);
        }
      }
    }

    for (let y = 1; y < stage.boardSize.height - 1; y += 1) {
      for (const x of [0, stage.boardSize.width - 1]) {
        const cell = { x, y };
        if (!blockedDrawnCells.has(getCellKey(cell))) {
          anchors.push(cell);
        }
      }
    }

    return getUniqueCells(anchors);
  }

  function generateBorderPolylineCandidates(stage, state, candidateMap) {
    const values = buildCandidateCoordinateValues(stage, state);
    const anchors = getBorderAnchors(stage, state);
    const maxCells = 38;

    function tryPolyline(vertices) {
      const drawnCells = buildPolylineCells(vertices);
      if (drawnCells.length === 0 || drawnCells.length > maxCells) {
        return;
      }
      addCandidateIfUseful(candidateMap, drawnCells, stage, state);
    }

    for (let startIndex = 0; startIndex < anchors.length; startIndex += 1) {
      for (let endIndex = startIndex + 1; endIndex < anchors.length; endIndex += 1) {
        const start = anchors[startIndex];
        const end = anchors[endIndex];

        if (start.x === end.x || start.y === end.y) {
          tryPolyline([start, end]);
        }

        tryPolyline([start, { x: end.x, y: start.y }, end]);
        tryPolyline([start, { x: start.x, y: end.y }, end]);

        for (const pivotX of values.xValues) {
          tryPolyline([start, { x: pivotX, y: start.y }, { x: pivotX, y: end.y }, end]);
        }

        for (const pivotY of values.yValues) {
          tryPolyline([start, { x: start.x, y: pivotY }, { x: end.x, y: pivotY }, end]);
        }

        for (const pivotX of values.xValues) {
          for (const pivotY of values.yValues) {
            tryPolyline([
              start,
              { x: pivotX, y: start.y },
              { x: pivotX, y: pivotY },
              { x: end.x, y: pivotY },
              end,
            ]);
            tryPolyline([
              start,
              { x: start.x, y: pivotY },
              { x: pivotX, y: pivotY },
              { x: pivotX, y: end.y },
              end,
            ]);
          }
        }
      }
    }
  }

  function generateGraphPathCandidates(stage, state, candidateMap) {
    const nodes = buildPivotNodes(stage, state);
    const visibility = buildVisibilityGraph(nodes, stage, state);
    const targetPosition = state.keyCollected ? stage.goalPosition : stage.keyPosition;
    const maxEdges = 7;
    const maxCandidates = 6000;
    let generated = 0;

    const anchorOrder = visibility.anchors.slice().sort((left, right) => {
      const leftScore = Math.abs(left.x - targetPosition.x) + Math.abs(left.y - targetPosition.y);
      const rightScore = Math.abs(right.x - targetPosition.x) + Math.abs(right.y - targetPosition.y);
      return leftScore - rightScore;
    });

    function dfs(startNode, currentKey, edges, visitedKeys, totalCells) {
      if (generated >= maxCandidates || edges.length > maxEdges) {
        return;
      }

      if (edges.length > 0 && visitedKeys.has(currentKey)) {
        return;
      }

      const currentNode = visibility.nodeByKey.get(currentKey);
      if (!currentNode) {
        return;
      }

      if (
        edges.length > 0 &&
        visibility.anchors.some((anchor) => getCellKey(anchor) === currentKey)
      ) {
        const bends = countPathBends(startNode, edges, visibility.nodeByKey);
        if (bends <= 6) {
          const drawnCells = getPathCellsFromNodePath(startNode, edges);
          if (addCandidateIfUseful(candidateMap, drawnCells, stage, state)) {
            generated += 1;
          }
        }
      }

      const nextVisited = new Set(visitedKeys);
      nextVisited.add(currentKey);

      const neighbors = (visibility.graph.get(currentKey) || []).filter(
        (edge) => !nextVisited.has(edge.toKey)
      );

      neighbors.sort((left, right) => {
        const leftNode = visibility.nodeByKey.get(left.toKey);
        const rightNode = visibility.nodeByKey.get(right.toKey);
        const leftDistance = Math.abs(leftNode.x - targetPosition.x) + Math.abs(leftNode.y - targetPosition.y);
        const rightDistance = Math.abs(rightNode.x - targetPosition.x) + Math.abs(rightNode.y - targetPosition.y);
        if (leftDistance !== rightDistance) {
          return leftDistance - rightDistance;
        }
        return left.length - right.length;
      });

      for (const edge of neighbors) {
        if (totalCells + edge.length > 34) {
          continue;
        }
        dfs(startNode, edge.toKey, edges.concat([edge]), nextVisited, totalCells + edge.length);
        if (generated >= maxCandidates) {
          return;
        }
      }
    }

    for (const anchor of anchorOrder) {
      const key = getCellKey(anchor);
      dfs(anchor, key, [], new Set(), 1);
      if (generated >= maxCandidates) {
        break;
      }
    }
  }

  function buildStrategicCandidates(stage, state) {
    const candidateMap = new Map();
    generateRectangleCycles(stage, state, candidateMap);
    generateBorderPolylineCandidates(stage, state, candidateMap);
    generateGraphPathCandidates(stage, state, candidateMap);

    return Array.from(candidateMap.values())
      .sort((left, right) => right.score - left.score)
      .slice(0, 1200);
  }

  function findStageRegionBasedSolution(stage, options) {
    const normalizedStage = normalizeStage(stage);
    const maxSteps = Number((options && options.maxSteps) || 6);
    const initialState = createInitialState(normalizedStage);
    const queue = [initialState];
    const visited = new Set([createStateSignature(initialState)]);

    while (queue.length > 0) {
      const currentState = queue.shift();
      if (currentState.clear) {
        return currentState.history;
      }
      if (currentState.history.length >= maxSteps) {
        continue;
      }

      const candidates = buildStrategicCandidates(normalizedStage, currentState);
      for (const candidate of candidates) {
        const nextState = candidate.nextState;
        if (nextState.clear) {
          return nextState.history;
        }

        const signature = createStateSignature(nextState);
        if (visited.has(signature)) {
          continue;
        }
        visited.add(signature);
        queue.push(nextState);
      }
    }

    return null;
  }

  globalScope.closedLoopRegionSolver = {
    applyLoop,
    buildLoopFromDrawnCells,
    buildPolylineCells,
    collectConnectedWallBlocks,
    createInitialState,
    findStageRegionBasedSolution,
    normalizeStage,
  };
})(globalThis);
