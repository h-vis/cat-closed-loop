const fs = require("fs");
const path = require("path");

const solver = require("../solver");

const STAGE_DIR = path.join(__dirname, "..", "stage", "medium");
const DEFAULT_OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "medium-solver-check-results.json"
);

function parseArgs(argv) {
  const options = {
    output: DEFAULT_OUTPUT_PATH,
    maxSteps: 6,
    only: null,
    from: null,
    to: null,
    resume: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--output" && argv[index + 1]) {
      options.output = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--max-steps" && argv[index + 1]) {
      options.maxSteps = Number(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--only" && argv[index + 1]) {
      options.only = argv[index + 1]
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .map(normalizeStageFileName);
      index += 1;
      continue;
    }

    if (arg === "--from" && argv[index + 1]) {
      options.from = normalizeStageFileName(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--to" && argv[index + 1]) {
      options.to = normalizeStageFileName(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--no-resume") {
      options.resume = false;
    }
  }

  return options;
}

function normalizeStageFileName(value) {
  const trimmed = String(value).trim();
  if (/^\d+$/.test(trimmed)) {
    return `${trimmed.padStart(3, "0")}.json`;
  }
  return trimmed.endsWith(".json") ? trimmed : `${trimmed}.json`;
}

function listStageFiles() {
  return fs
    .readdirSync(STAGE_DIR)
    .filter((name) => /^\d+\.json$/.test(name))
    .sort();
}

function loadExistingOutput(outputPath) {
  if (!fs.existsSync(outputPath)) {
    return {
      generatedAt: null,
      options: null,
      summary: null,
      results: [],
    };
  }

  return JSON.parse(fs.readFileSync(outputPath, "utf8"));
}

function buildStageFileList(allFiles, options) {
  let files = allFiles.slice();

  if (options.only && options.only.length > 0) {
    const allowSet = new Set(options.only);
    files = files.filter((file) => allowSet.has(file));
  }

  if (options.from) {
    files = files.filter((file) => file >= options.from);
  }

  if (options.to) {
    files = files.filter((file) => file <= options.to);
  }

  return files;
}

function summarize(results, expectedFiles) {
  const completed = results.filter((result) => expectedFiles.includes(result.file));
  const solved = completed.filter((result) => result.solved).length;
  const unsolved = completed.filter((result) => !result.solved && !result.error).length;
  const errors = completed.filter((result) => Boolean(result.error)).length;
  const missing = expectedFiles.filter(
    (file) => !completed.some((result) => result.file === file)
  );
  const slowest = completed
    .slice()
    .sort((left, right) => right.elapsedMs - left.elapsedMs)
    .slice(0, 10);

  return {
    total: expectedFiles.length,
    completed: completed.length,
    solved,
    unsolved,
    errors,
    missing,
    slowest,
  };
}

function writeOutput(outputPath, payload) {
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const allFiles = listStageFiles();
  const targetFiles = buildStageFileList(allFiles, options);
  const existing = options.resume
    ? loadExistingOutput(options.output)
    : { generatedAt: null, options: null, summary: null, results: [] };
  const existingByFile = new Map(
    (existing.results || []).map((result) => [result.file, result])
  );
  const results = [];

  for (const file of targetFiles) {
    if (options.resume && existingByFile.has(file)) {
      const existingResult = existingByFile.get(file);
      results.push(existingResult);
      console.log(`[skip] ${file} solved=${existingResult.solved} elapsedMs=${existingResult.elapsedMs}`);
      continue;
    }

    const stagePath = path.join(STAGE_DIR, file);
    const stage = solver.loadStageJson(stagePath);
    const startedAt = Date.now();

    let solution = null;
    let error = null;
    try {
      solution = solver.findStageRegionBasedSolution(stage, {
        maxSteps: options.maxSteps,
      });
    } catch (caughtError) {
      error = caughtError && caughtError.stack ? caughtError.stack : String(caughtError);
    }

    const result = {
      file,
      designLabel: stage.designLabel || "",
      solved: Boolean(solution),
      steps: solution ? solution.length : null,
      elapsedMs: Date.now() - startedAt,
      error,
    };

    results.push(result);

    const payload = {
      generatedAt: new Date().toISOString(),
      options,
      summary: summarize(results, targetFiles),
      results,
    };
    writeOutput(options.output, payload);

    const status = result.error
      ? "error"
      : result.solved
        ? `solved:${result.steps}`
        : "unsolved";
    console.log(`[done] ${file} ${status} ${result.elapsedMs}ms`);
  }

  const finalPayload = {
    generatedAt: new Date().toISOString(),
    options,
    summary: summarize(results, targetFiles),
    results,
  };
  writeOutput(options.output, finalPayload);

  console.log("");
  console.log("Summary:");
  console.log(JSON.stringify(finalPayload.summary, null, 2));
  console.log(`Saved: ${options.output}`);
}

main();
