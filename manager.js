const DIFFICULTIES = [
  { key: "low", label: "Easy" },
  { key: "medium", label: "Normal" },
  { key: "high", label: "Hard" },
];

const PREMIUM_PACK_ID = "premium_stage_pack";

const state = {
  directoryHandle: null,
  stageOrderByDifficulty: {
    low: [],
    medium: [],
    high: [],
  },
  premiumByDifficulty: {
    low: new Set(),
    medium: new Set(),
    high: new Set(),
  },
  stagesByDifficulty: {
    low: new Map(),
    medium: new Map(),
    high: new Map(),
  },
};

const ui = {
  status: document.getElementById("managerStatus"),
  difficultySections: document.getElementById("managerDifficultySections"),
  manifestOutput: document.getElementById("managerManifestOutput"),
  premiumOutput: document.getElementById("managerPremiumOutput"),
  reloadButton: document.getElementById("managerReloadButton"),
  chooseFolderButton: document.getElementById("managerChooseFolderButton"),
  saveAllButton: document.getElementById("managerSaveAllButton"),
};

function setStatus(message, isError = false) {
  if (!ui.status) {
    return;
  }

  ui.status.hidden = !message;
  ui.status.textContent = message;
  ui.status.classList.toggle("is-error", isError);
}

function formatStageNumber(stageNumber) {
  return String(stageNumber).padStart(3, "0");
}

function getRenumberedStageNumber(index) {
  return index + 1;
}

function normalizeStageNumbers(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values
        .map((value) => Number.parseInt(String(value), 10))
        .filter((value) => Number.isInteger(value) && value > 0)
    ),
  ];
}

function expandRanges(ranges) {
  if (!Array.isArray(ranges)) {
    return [];
  }

  const numbers = [];
  for (const range of ranges) {
    const from = Number.parseInt(String(range?.from), 10);
    const to = Number.parseInt(String(range?.to), 10);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
      continue;
    }

    for (let value = from; value <= to; value += 1) {
      numbers.push(value);
    }
  }

  return numbers;
}

function sanitizeJsonText(jsonText) {
  let sanitized = "";
  let inString = false;
  let escaping = false;

  for (let index = 0; index < jsonText.length; index += 1) {
    const character = jsonText[index];

    if (escaping) {
      sanitized += character;
      escaping = false;
      continue;
    }

    if (character === "\\") {
      sanitized += character;
      escaping = true;
      continue;
    }

    if (character === "\"") {
      sanitized += character;
      inString = !inString;
      continue;
    }

    if (inString) {
      if (character === "\r") {
        sanitized += "\\r";
        continue;
      }
      if (character === "\n") {
        sanitized += "\\n";
        continue;
      }
      if (character === "\t") {
        sanitized += "\\t";
        continue;
      }
    }

    sanitized += character;
  }

  return sanitized;
}

function parseJsonLenient(jsonText) {
  try {
    return JSON.parse(jsonText);
  } catch (_error) {
    try {
      return JSON.parse(sanitizeJsonText(jsonText));
    } catch (_nestedError) {
      return null;
    }
  }
}

async function readJsonWithXhr(path) {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.overrideMimeType?.("application/json");
    request.open("GET", path, true);
    request.onload = () => {
      if (request.status !== 0 && (request.status < 200 || request.status >= 300)) {
        resolve(null);
        return;
      }

      try {
        resolve(parseJsonLenient(request.responseText));
      } catch (_error) {
        resolve(null);
      }
    };
    request.onerror = () => resolve(null);
    request.send();
  });
}

async function readJsonResource(path) {
  const response = await fetch(path, { cache: "no-store" }).catch(() => null);
  if (response?.ok) {
    const text = await response.text().catch(() => null);
    return text === null ? null : parseJsonLenient(text);
  }

  return readJsonWithXhr(path);
}

async function readStageJson(difficulty, stageNumber) {
  const primaryPath = `stage/${difficulty}/${formatStageNumber(stageNumber)}.json`;
  const fallbackPath = `stage/${formatStageNumber(stageNumber)}.json`;
  return (await readJsonResource(primaryPath)) ?? (await readJsonResource(fallbackPath));
}

function collectPremiumSetsFromConfig(premiumConfig) {
  const premiumByDifficulty = {
    low: new Set(),
    medium: new Set(),
    high: new Set(),
  };

  for (const pack of premiumConfig?.packs ?? []) {
    if (pack?.id !== PREMIUM_PACK_ID) {
      continue;
    }

    for (const { key } of DIFFICULTIES) {
      const explicit = normalizeStageNumbers(pack.stageNumbersByDifficulty?.[key]);
      const ranged = expandRanges(pack.rangesByDifficulty?.[key]);
      for (const stageNumber of [...explicit, ...ranged]) {
        premiumByDifficulty[key].add(stageNumber);
      }
    }
  }

  return premiumByDifficulty;
}

async function loadStageManagerData() {
  try {
    setStatus("ステージ設定を読み込んでいます...");

    const [manifest, premiumConfig] = await Promise.all([
      readJsonResource("stage/manifest.json"),
      readJsonResource("stage/premium-packs.json"),
    ]);

    if (!manifest) {
      throw new Error("stage/manifest.json を読み込めませんでした。");
    }

    const premiumByDifficulty = collectPremiumSetsFromConfig(premiumConfig);

    for (const { key } of DIFFICULTIES) {
      const stageOrder = normalizeStageNumbers(manifest?.[key]);
      state.stageOrderByDifficulty[key] = stageOrder;
      state.premiumByDifficulty[key] = premiumByDifficulty[key];
      state.stagesByDifficulty[key] = new Map();
    }

    const stageLoads = [];
    for (const { key } of DIFFICULTIES) {
      for (const stageNumber of state.stageOrderByDifficulty[key]) {
        stageLoads.push(
          readStageJson(key, stageNumber).then((stageJson) => {
            if (stageJson) {
              state.stagesByDifficulty[key].set(stageNumber, stageJson);
            }
          })
        );
      }
    }

    await Promise.all(stageLoads);
    updateOutputs();
    renderDifficultySections();
    setStatus("ステージ管理データを読み込みました。");
  } catch (error) {
    setStatus(`読み込みに失敗しました: ${error.message}`, true);
  }
}

function buildManifestJson() {
  return {
    low: state.stageOrderByDifficulty.low.map((_stageNumber, index) => getRenumberedStageNumber(index)),
    medium: state.stageOrderByDifficulty.medium.map((_stageNumber, index) => getRenumberedStageNumber(index)),
    high: state.stageOrderByDifficulty.high.map((_stageNumber, index) => getRenumberedStageNumber(index)),
  };
}

function compressStageNumbersToRanges(stageNumbers) {
  const normalized = normalizeStageNumbers(stageNumbers).sort((left, right) => left - right);
  if (normalized.length === 0) {
    return [];
  }

  const ranges = [];
  let start = normalized[0];
  let previous = normalized[0];

  for (let index = 1; index < normalized.length; index += 1) {
    const current = normalized[index];
    if (current === previous + 1) {
      previous = current;
      continue;
    }

    ranges.push({ from: start, to: previous });
    start = current;
    previous = current;
  }

  ranges.push({ from: start, to: previous });
  return ranges;
}

function buildPremiumConfigJson() {
  const rangesByDifficulty = {};

  for (const { key } of DIFFICULTIES) {
    const premiumNumbersInOrder = state.stageOrderByDifficulty[key]
      .map((stageNumber, index) => (
        state.premiumByDifficulty[key].has(stageNumber) ? getRenumberedStageNumber(index) : null
      ))
      .filter((stageNumber) => stageNumber !== null);

    const ranges = compressStageNumbersToRanges(premiumNumbersInOrder);
    if (ranges.length > 0) {
      rangesByDifficulty[key] = ranges;
    }
  }

  return {
    packs: [
      {
        id: PREMIUM_PACK_ID,
        rangesByDifficulty,
      },
    ],
  };
}

function updateOutputs() {
  if (ui.manifestOutput) {
    ui.manifestOutput.value = JSON.stringify(buildManifestJson(), null, 2);
  }
  if (ui.premiumOutput) {
    ui.premiumOutput.value = JSON.stringify(buildPremiumConfigJson(), null, 2);
  }
}

async function moveStage(difficulty, index, offset) {
  const order = state.stageOrderByDifficulty[difficulty];
  const nextIndex = index + offset;
  if (nextIndex < 0 || nextIndex >= order.length) {
    return;
  }

  [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
  updateOutputs();
  renderDifficultySections();

  if (!state.directoryHandle) {
    setStatus("並び順を更新しました。保存先フォルダを選ぶと、並び替え時に自動で連番保存します。");
    return;
  }

  try {
    await saveAllStageManagerFiles();
    setStatus("並び替えに合わせてステージ本体まで保存しました。");
  } catch (error) {
    setStatus(`並び替え後の保存に失敗しました: ${error.message}`, true);
  }
}

function togglePremiumStage(difficulty, stageNumber, shouldBePremium) {
  const premiumSet = state.premiumByDifficulty[difficulty];
  if (shouldBePremium) {
    premiumSet.add(stageNumber);
  } else {
    premiumSet.delete(stageNumber);
  }
  updateOutputs();
}

function drawStageThumbnail(canvas, stageJson) {
  const context = canvas.getContext("2d");
  const boardWidth = Number(stageJson?.boardSize?.width ?? 10);
  const boardHeight = Number(stageJson?.boardSize?.height ?? 10);
  const width = canvas.width;
  const height = canvas.height;
  const cellSize = Math.min((width - 16) / boardWidth, (height - 16) / boardHeight);
  const boardPixelWidth = boardWidth * cellSize;
  const boardPixelHeight = boardHeight * cellSize;
  const offsetX = (width - boardPixelWidth) / 2;
  const offsetY = (height - boardPixelHeight) / 2;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#eff5f8";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#ffffff";
  context.fillRect(offsetX, offsetY, boardPixelWidth, boardPixelHeight);

  context.strokeStyle = "rgba(17, 25, 33, 0.14)";
  context.lineWidth = 1;
  for (let x = 0; x <= boardWidth; x += 1) {
    const lineX = offsetX + x * cellSize;
    context.beginPath();
    context.moveTo(lineX, offsetY);
    context.lineTo(lineX, offsetY + boardPixelHeight);
    context.stroke();
  }
  for (let y = 0; y <= boardHeight; y += 1) {
    const lineY = offsetY + y * cellSize;
    context.beginPath();
    context.moveTo(offsetX, lineY);
    context.lineTo(offsetX + boardPixelWidth, lineY);
    context.stroke();
  }

  const fillCell = (point, color, inset = 0.16) => {
    if (!point) {
      return;
    }

    const x = offsetX + point.x * cellSize + cellSize * inset;
    const y = offsetY + point.y * cellSize + cellSize * inset;
    const size = cellSize * (1 - inset * 2);
    context.fillStyle = color;
    context.fillRect(x, y, size, size);
  };

  for (const point of stageJson.wallBlocks ?? []) {
    fillCell(point, "#165eab", 0.08);
  }
  for (const point of stageJson.bombs ?? []) {
    fillCell(point, "#2d3138", 0.22);
  }
  for (const point of stageJson.disarmItems ?? []) {
    fillCell(point, "#e7a646", 0.2);
  }
  for (const point of stageJson.warps ?? []) {
    fillCell(point, "#9458d8", 0.18);
  }
  for (const point of stageJson.lateWarps ?? []) {
    fillCell(point, "#56bfd6", 0.18);
  }

  fillCell(stageJson.goalPosition, "#d79f29", 0.18);
  fillCell(stageJson.keyPosition, "#f0c44d", 0.28);
  fillCell(stageJson.playerStart, "#cc513f", 0.18);

  context.strokeStyle = "#6f6249";
  context.lineWidth = 2;
  context.strokeRect(offsetX, offsetY, boardPixelWidth, boardPixelHeight);
}

function createStageCard(difficulty, stageNumber, index) {
  const stageJson = state.stagesByDifficulty[difficulty].get(stageNumber);
  const isPremium = state.premiumByDifficulty[difficulty].has(stageNumber);
  const renumberedStageNumber = getRenumberedStageNumber(index);

  const article = document.createElement("article");
  article.className = "stage-manager-card";

  const canvas = document.createElement("canvas");
  canvas.className = "stage-manager-thumb";
  canvas.width = 160;
  canvas.height = 120;
  if (stageJson) {
    drawStageThumbnail(canvas, stageJson);
  }

  const meta = document.createElement("div");
  meta.className = "stage-manager-meta";

  const title = document.createElement("div");
  title.className = "stage-manager-title";
  title.textContent = `${formatStageNumber(renumberedStageNumber)} ${stageJson?.designLabel ?? "読み込み失敗"}`.trim();

  const subline = document.createElement("div");
  subline.className = "stage-manager-subline";
  subline.textContent = stageJson
    ? `元ファイル: ${formatStageNumber(stageNumber)}.json`
    : `元ファイル: ${formatStageNumber(stageNumber)}.json / JSON を読めませんでした`;

  const controls = document.createElement("div");
  controls.className = "stage-manager-controls";

  const moveUpButton = document.createElement("button");
  moveUpButton.type = "button";
  moveUpButton.className = "secondary-button";
  moveUpButton.textContent = "↑";
  moveUpButton.disabled = index === 0;
  moveUpButton.addEventListener("click", () => {
    void moveStage(difficulty, index, -1);
  });

  const moveDownButton = document.createElement("button");
  moveDownButton.type = "button";
  moveDownButton.className = "secondary-button";
  moveDownButton.textContent = "↓";
  moveDownButton.disabled = index === state.stageOrderByDifficulty[difficulty].length - 1;
  moveDownButton.addEventListener("click", () => {
    void moveStage(difficulty, index, 1);
  });

  const premiumLabel = document.createElement("label");
  premiumLabel.className = "stage-manager-premium-toggle";

  const premiumCheckbox = document.createElement("input");
  premiumCheckbox.type = "checkbox";
  premiumCheckbox.checked = isPremium;
  premiumCheckbox.addEventListener("change", () => {
    togglePremiumStage(difficulty, stageNumber, premiumCheckbox.checked);
  });

  const premiumText = document.createElement("span");
  premiumText.textContent = "有料";

  premiumLabel.append(premiumCheckbox, premiumText);
  controls.append(moveUpButton, moveDownButton, premiumLabel);

  meta.append(title, subline, controls);
  article.append(canvas, meta);
  return article;
}

function renderDifficultySections() {
  if (!ui.difficultySections) {
    return;
  }

  ui.difficultySections.innerHTML = "";

  for (const { key, label } of DIFFICULTIES) {
    const section = document.createElement("section");
    section.className = "manager-difficulty-section";

    const header = document.createElement("div");
    header.className = "manager-difficulty-header";

    const title = document.createElement("h2");
    title.textContent = `${label} (${state.stageOrderByDifficulty[key].length})`;
    header.append(title);

    const list = document.createElement("div");
    list.className = "stage-manager-list";
    for (const [index, stageNumber] of state.stageOrderByDifficulty[key].entries()) {
      list.append(createStageCard(key, stageNumber, index));
    }

    section.append(header, list);
    ui.difficultySections.append(section);
  }
}

function downloadTextFile(fileName, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function saveTextFile(fileName, text) {
  if (state.directoryHandle) {
    const fileHandle = await state.directoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(text);
    await writable.close();
    return "saved";
  }

  downloadTextFile(fileName, text);
  return "downloaded";
}

async function chooseSaveDirectory() {
  if (typeof window.showDirectoryPicker !== "function") {
    setStatus("このブラウザでは保存先フォルダを選べません。保存時はダウンロードになります。");
    return;
  }

  try {
    state.directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    setStatus("保存先フォルダを選択しました。以後は並び替え時に連番で自動保存します。");
  } catch (error) {
    if (error?.name === "AbortError") {
      return;
    }

    setStatus(`保存先フォルダの選択に失敗しました: ${error.message}`, true);
  }
}

async function saveStageJsonFile(difficultyHandle, stageNumber, stageJson) {
  const fileHandle = await difficultyHandle.getFileHandle(`${formatStageNumber(stageNumber)}.json`, {
    create: true,
  });
  const writable = await fileHandle.createWritable();
  await writable.write(`${JSON.stringify(stageJson, null, 2)}\n`);
  await writable.close();
}

async function removeObsoleteStageFiles(difficultyHandle, activeStageNumbers) {
  for await (const entry of difficultyHandle.values()) {
    if (entry.kind !== "file" || !entry.name.endsWith(".json")) {
      continue;
    }

    const matched = entry.name.match(/^(\d{3})\.json$/);
    if (!matched) {
      continue;
    }

    const stageNumber = Number.parseInt(matched[1], 10);
    if (!activeStageNumbers.has(stageNumber)) {
      await difficultyHandle.removeEntry(entry.name).catch(() => {});
    }
  }
}

async function saveAllStageJsonFiles() {
  if (!state.directoryHandle) {
    return "downloaded";
  }

  for (const { key } of DIFFICULTIES) {
    const difficultyHandle = await state.directoryHandle.getDirectoryHandle(key, { create: true });
    const activeStageNumbers = new Set();

    for (const [index, originalStageNumber] of state.stageOrderByDifficulty[key].entries()) {
      const stageJson = state.stagesByDifficulty[key].get(originalStageNumber);
      if (!stageJson) {
        continue;
      }

      const renumberedStageNumber = getRenumberedStageNumber(index);
      activeStageNumbers.add(renumberedStageNumber);
      await saveStageJsonFile(difficultyHandle, renumberedStageNumber, stageJson);
    }

    await removeObsoleteStageFiles(difficultyHandle, activeStageNumbers);
  }

  return "saved";
}

async function saveAllStageManagerFiles() {
  const manifestText = `${JSON.stringify(buildManifestJson(), null, 2)}\n`;
  const premiumText = `${JSON.stringify(buildPremiumConfigJson(), null, 2)}\n`;

  await saveAllStageJsonFiles();
  await saveTextFile("manifest.json", manifestText);
  await saveTextFile("premium-packs.json", premiumText);
}

async function saveAllFiles() {
  try {
    if (state.directoryHandle) {
      await saveAllStageManagerFiles();
      setStatus("ステージ本体・manifest.json・premium-packs.json をまとめて保存しました。");
      return;
    }

    downloadTextFile("manifest.json", `${JSON.stringify(buildManifestJson(), null, 2)}\n`);
    downloadTextFile("premium-packs.json", `${JSON.stringify(buildPremiumConfigJson(), null, 2)}\n`);
    setStatus("manifest.json と premium-packs.json をダウンロードしました。保存先フォルダを選ぶと、ステージ本体もまとめて保存できます。");
  } catch (error) {
    setStatus(`全体保存に失敗しました: ${error.message}`, true);
  }
}

ui.reloadButton?.addEventListener("click", () => {
  void loadStageManagerData();
});

ui.chooseFolderButton?.addEventListener("click", () => {
  void chooseSaveDirectory();
});

ui.saveAllButton?.addEventListener("click", () => {
  void saveAllFiles();
});

void loadStageManagerData();
