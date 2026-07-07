const fs = require("fs");
const fsp = require("fs/promises");
const http = require("http");
const https = require("https");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const WORKSPACE_DIR = path.dirname(ROOT_DIR);
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DIST_DIR = path.join(ROOT_DIR, "dist");

const MODEL_ID = "nvidia/nemotron-3-super-120b-a12b:free";
const MAX_MODEL_CONCURRENCY = 3;
const STATUS_CACHE_MS = 15_000;

const DEMO_USER = {
  username: "admin",
  password: "123456",
  displayName: "Demo Student",
};

const QUESTION_BANKS = [
  {
    id: "gmsk",
    name: "GMSK",
    subtitle: "Mixed selective math demo bank",
    description:
      "A 30-question static demo bank randomly mixed across operations, fractions, geometry, data, ratios, probability, time, and reasoning topics.",
    connected: false,
    questionCount: 30,
  },
];

const QUESTIONS = [
  {
    id: "q1",
    bankId: "gmsk",
    title: "Mental Math Drill",
    concept: "Basic Operations",
    difficulty: "Year 4",
    prompt: "Calculate: 48 ÷ 6 + 7 = ?",
    answerText: "15",
    acceptedAnswers: ["15"],
    fallbackExplanation:
      "Work out the division first: 48 ÷ 6 = 8. Then add 7 to get 15. In mixed operations, do multiplication and division before addition and subtraction.",
  },
  {
    id: "q2",
    bankId: "gmsk",
    title: "Fractions in Context",
    concept: "Fractions",
    difficulty: "Year 5",
    prompt: "A class has 24 students. If 3/4 of them joined the choir, how many students joined the choir?",
    answerText: "18 students",
    acceptedAnswers: ["18", "18students", "18student"],
    fallbackExplanation:
      "To find 3/4 of 24, divide 24 by 4 to get 6, then multiply 6 by 3 to get 18. So 18 students joined the choir.",
  },
  {
    id: "q3",
    bankId: "gmsk",
    title: "Perimeter Practice",
    concept: "Measurement",
    difficulty: "Year 6",
    prompt: "A rectangle is 9 cm long and 6 cm wide. What is its perimeter?",
    answerText: "30 cm",
    acceptedAnswers: ["30", "30cm"],
    fallbackExplanation:
      "Perimeter of a rectangle = (length + width) × 2, so (9 + 6) × 2 = 15 × 2 = 30 cm.",
  },
  {
    id: "q4",
    bankId: "gmsk",
    title: "Percentages",
    concept: "Percentages",
    difficulty: "Year 6",
    prompt: "A book originally costs 80 yuan. What is the sale price after a 10% discount?",
    answerText: "72 yuan",
    acceptedAnswers: ["72", "72yuan"],
    fallbackExplanation:
      "A 10% discount means you pay 90% of the original price. Calculate 80 × 0.9 = 72, so the sale price is 72 yuan.",
  },
  {
    id: "q5",
    bankId: "gmsk",
    title: "Order of Operations",
    concept: "Basic Operations",
    difficulty: "Year 4",
    prompt: "Calculate: 36 + 4 × 7 = ?",
    answerText: "64",
    acceptedAnswers: ["64"],
    fallbackExplanation:
      "Multiplication comes before addition. First calculate 4 × 7 = 28, then add 36 to get 64.",
  },
  {
    id: "q6",
    bankId: "gmsk",
    title: "Fraction of a Number",
    concept: "Fractions",
    difficulty: "Year 5",
    prompt: "What is 5/8 of 40?",
    answerText: "25",
    acceptedAnswers: ["25"],
    fallbackExplanation:
      "Divide 40 by 8 to get 5, then multiply by 5. The answer is 25.",
  },
  {
    id: "q7",
    bankId: "gmsk",
    title: "Area Practice",
    concept: "Geometry",
    difficulty: "Year 5",
    prompt: "A rectangle is 12 cm long and 7 cm wide. What is its area?",
    answerText: "84 cm²",
    acceptedAnswers: ["84", "84cm2", "84cm²"],
    fallbackExplanation:
      "Area of a rectangle is length × width. Calculate 12 × 7 = 84, so the area is 84 cm².",
  },
  {
    id: "q8",
    bankId: "gmsk",
    title: "Number Pattern",
    concept: "Patterns",
    difficulty: "Year 4",
    prompt: "Find the next number: 3, 7, 11, 15, ?",
    answerText: "19",
    acceptedAnswers: ["19"],
    fallbackExplanation:
      "Each term increases by 4. Add 4 to 15 to get 19.",
  },
  {
    id: "q9",
    bankId: "gmsk",
    title: "Unit Rate",
    concept: "Ratios",
    difficulty: "Year 5",
    prompt: "If 2 pencils cost $1.50, how much do 6 pencils cost?",
    answerText: "$4.50",
    acceptedAnswers: ["4.5", "4.50", "$4.50", "$4.5"],
    fallbackExplanation:
      "Six pencils is three groups of two pencils. Calculate $1.50 × 3 = $4.50.",
  },
  {
    id: "q10",
    bankId: "gmsk",
    title: "Percentage of a Number",
    concept: "Percentages",
    difficulty: "Year 6",
    prompt: "What is 35% of 200?",
    answerText: "70",
    acceptedAnswers: ["70"],
    fallbackExplanation:
      "35% means 35 out of 100. Calculate 200 × 0.35 = 70.",
  },
  {
    id: "q11",
    bankId: "gmsk",
    title: "Triangle Angles",
    concept: "Geometry",
    difficulty: "Year 6",
    prompt: "A triangle has angles of 50° and 65°. What is the third angle?",
    answerText: "65°",
    acceptedAnswers: ["65", "65°", "65degrees"],
    fallbackExplanation:
      "Angles in a triangle add to 180°. Calculate 180 - 50 - 65 = 65°.",
  },
  {
    id: "q12",
    bankId: "gmsk",
    title: "Adding Fractions",
    concept: "Fractions",
    difficulty: "Year 6",
    prompt: "Calculate: 2/3 + 1/6 = ?",
    answerText: "5/6",
    acceptedAnswers: ["5/6"],
    fallbackExplanation:
      "Change 2/3 to 4/6. Then 4/6 + 1/6 = 5/6.",
  },
  {
    id: "q13",
    bankId: "gmsk",
    title: "Sharing Equally",
    concept: "Word Problems",
    difficulty: "Year 4",
    prompt: "There are 7 boxes with 8 apples in each box. The apples are shared equally among 4 friends. How many apples does each friend get?",
    answerText: "14 apples",
    acceptedAnswers: ["14", "14apples", "14apple"],
    fallbackExplanation:
      "First find all apples: 7 × 8 = 56. Then share them among 4 friends: 56 ÷ 4 = 14.",
  },
  {
    id: "q14",
    bankId: "gmsk",
    title: "Find the Mean",
    concept: "Data",
    difficulty: "Year 5",
    prompt: "Find the mean of 6, 8, 10, and 12.",
    answerText: "9",
    acceptedAnswers: ["9"],
    fallbackExplanation:
      "Add the numbers to get 36. Divide by 4 numbers: 36 ÷ 4 = 9.",
  },
  {
    id: "q15",
    bankId: "gmsk",
    title: "Speed Question",
    concept: "Rates",
    difficulty: "Year 6",
    prompt: "A train travels 45 km in 30 minutes. What is its speed in km/h?",
    answerText: "90 km/h",
    acceptedAnswers: ["90", "90km/h", "90kmh"],
    fallbackExplanation:
      "Thirty minutes is half an hour. If the train travels 45 km in half an hour, it travels 90 km in one hour.",
  },
  {
    id: "q16",
    bankId: "gmsk",
    title: "Expression Value",
    concept: "Algebra",
    difficulty: "Year 5",
    prompt: "If n = 9, calculate 3n + 4.",
    answerText: "31",
    acceptedAnswers: ["31"],
    fallbackExplanation:
      "Substitute n = 9. Then 3n + 4 = 3 × 9 + 4 = 27 + 4 = 31.",
  },
  {
    id: "q17",
    bankId: "gmsk",
    title: "Volume Practice",
    concept: "Measurement",
    difficulty: "Year 6",
    prompt: "A rectangular prism is 4 cm long, 3 cm wide, and 2 cm high. What is its volume?",
    answerText: "24 cm³",
    acceptedAnswers: ["24", "24cm3", "24cm³"],
    fallbackExplanation:
      "Volume is length × width × height. Calculate 4 × 3 × 2 = 24 cm³.",
  },
  {
    id: "q18",
    bankId: "gmsk",
    title: "Decimal Addition",
    concept: "Decimals",
    difficulty: "Year 4",
    prompt: "Calculate: 1.2 + 0.35 = ?",
    answerText: "1.55",
    acceptedAnswers: ["1.55"],
    fallbackExplanation:
      "Write 1.2 as 1.20. Then 1.20 + 0.35 = 1.55.",
  },
  {
    id: "q19",
    bankId: "gmsk",
    title: "Reverse Percentage",
    concept: "Percentages",
    difficulty: "Year 6",
    prompt: "18 is 30% of what number?",
    answerText: "60",
    acceptedAnswers: ["60"],
    fallbackExplanation:
      "If 18 is 30%, then 10% is 6. Therefore 100% is 60.",
  },
  {
    id: "q20",
    bankId: "gmsk",
    title: "Simple Probability",
    concept: "Probability",
    difficulty: "Year 5",
    prompt: "A bag has 3 red marbles and 2 blue marbles. What is the probability of picking a red marble?",
    answerText: "3/5",
    acceptedAnswers: ["3/5", "0.6", "60%"],
    fallbackExplanation:
      "There are 5 marbles in total and 3 are red. The probability is 3/5.",
  },
  {
    id: "q21",
    bankId: "gmsk",
    title: "Time Addition",
    concept: "Time",
    difficulty: "Year 4",
    prompt: "It is 2:35 pm. What time will it be in 50 minutes?",
    answerText: "3:25 pm",
    acceptedAnswers: ["3:25", "3:25pm", "15:25"],
    fallbackExplanation:
      "From 2:35, add 25 minutes to reach 3:00. Add the remaining 25 minutes to get 3:25 pm.",
  },
  {
    id: "q22",
    bankId: "gmsk",
    title: "Doubling Pattern",
    concept: "Patterns",
    difficulty: "Year 4",
    prompt: "Find the next number: 2, 4, 8, 16, ?",
    answerText: "32",
    acceptedAnswers: ["32"],
    fallbackExplanation:
      "Each number doubles. Double 16 to get 32.",
  },
  {
    id: "q23",
    bankId: "gmsk",
    title: "Square Area",
    concept: "Geometry",
    difficulty: "Year 5",
    prompt: "A square has a perimeter of 48 cm. What is its area?",
    answerText: "144 cm²",
    acceptedAnswers: ["144", "144cm2", "144cm²"],
    fallbackExplanation:
      "A square has 4 equal sides, so each side is 48 ÷ 4 = 12 cm. Area is 12 × 12 = 144 cm².",
  },
  {
    id: "q24",
    bankId: "gmsk",
    title: "Ratio Split",
    concept: "Ratios",
    difficulty: "Year 6",
    prompt: "Two numbers are in the ratio 2:3 and their total is 25. What is the larger number?",
    answerText: "15",
    acceptedAnswers: ["15"],
    fallbackExplanation:
      "The ratio has 5 parts in total. Each part is 25 ÷ 5 = 5. The larger number is 3 parts: 3 × 5 = 15.",
  },
  {
    id: "q25",
    bankId: "gmsk",
    title: "Unit Conversion",
    concept: "Measurement",
    difficulty: "Year 5",
    prompt: "How many 250 g bags can be filled from 5 kg of rice?",
    answerText: "20 bags",
    acceptedAnswers: ["20", "20bags", "20bag"],
    fallbackExplanation:
      "Convert 5 kg to 5000 g. Then 5000 ÷ 250 = 20 bags.",
  },
  {
    id: "q26",
    bankId: "gmsk",
    title: "Regular Polygon",
    concept: "Geometry",
    difficulty: "Year 5",
    prompt: "A regular hexagon has side length 9 cm. What is its perimeter?",
    answerText: "54 cm",
    acceptedAnswers: ["54", "54cm"],
    fallbackExplanation:
      "A hexagon has 6 sides. Since each side is 9 cm, the perimeter is 6 × 9 = 54 cm.",
  },
  {
    id: "q27",
    bankId: "gmsk",
    title: "Simple Equation",
    concept: "Algebra",
    difficulty: "Year 5",
    prompt: "Solve for x: x + 18 = 42.",
    answerText: "24",
    acceptedAnswers: ["24"],
    fallbackExplanation:
      "Subtract 18 from both sides. x = 42 - 18 = 24.",
  },
  {
    id: "q28",
    bankId: "gmsk",
    title: "Decimal of a Number",
    concept: "Decimals",
    difficulty: "Year 5",
    prompt: "What is 0.6 of 50?",
    answerText: "30",
    acceptedAnswers: ["30"],
    fallbackExplanation:
      "0.6 means 6 tenths. Calculate 50 × 0.6 = 30.",
  },
  {
    id: "q29",
    bankId: "gmsk",
    title: "Map Scale",
    concept: "Scale",
    difficulty: "Year 6",
    prompt: "On a map, 1 cm represents 5 km. How far is 7 cm on the map?",
    answerText: "35 km",
    acceptedAnswers: ["35", "35km"],
    fallbackExplanation:
      "Each centimetre represents 5 km. Calculate 7 × 5 = 35 km.",
  },
  {
    id: "q30",
    bankId: "gmsk",
    title: "Number Reasoning",
    concept: "Logical Reasoning",
    difficulty: "Year 6",
    prompt: "Two numbers have a sum of 48 and a difference of 6. What is the larger number?",
    answerText: "27",
    acceptedAnswers: ["27"],
    fallbackExplanation:
      "If the numbers were equal, each would be 24. A difference of 6 means the larger is 3 above 24, so the larger number is 27.",
  },
];

class ConcurrencyGate {
  constructor(limit) {
    this.limit = limit;
    this.active = 0;
    this.queue = [];
  }

  async run(task) {
    await this.acquire();
    try {
      return await task();
    } finally {
      this.release();
    }
  }

  acquire() {
    if (this.active < this.limit) {
      this.active += 1;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active += 1;
        resolve();
      });
    });
  }

  release() {
    this.active = Math.max(0, this.active - 1);
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }

  getStats() {
    return {
      maxConcurrency: this.limit,
      activeRequests: this.active,
      queuedRequests: this.queue.length,
    };
  }
}

const analysisGate = new ConcurrencyGate(MAX_MODEL_CONCURRENCY);

let statusCache = {
  expiresAt: 0,
  value: null,
  pending: null,
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(text);
}

function getMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

async function serveStaticFile(res, relativePath) {
  const safePath = relativePath === "/" ? "/index.html" : relativePath;
  const normalized = path
    .normalize(safePath)
    .replace(/^(\.\.[\\/])+/, "")
    .replace(/^[/\\]+/, "");
  const roots = [DIST_DIR, PUBLIC_DIR];

  for (const root of roots) {
    const filePath = path.join(root, normalized);

    try {
      const content = await fsp.readFile(filePath);
      res.writeHead(200, {
        "Content-Type": getMimeType(filePath),
        "Cache-Control": "no-store",
      });
      res.end(content);
      return;
    } catch (error) {
    }
  }

  sendText(res, 404, "Not Found");
}

async function serveApplicationShell(res) {
  const distIndex = path.join(DIST_DIR, "index.html");

  try {
    const content = await fsp.readFile(distIndex);
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(content);
    return;
  } catch (error) {
  }

  sendText(
    res,
    503,
    "Frontend build not found. Run `npm run dev:client` for development, or `npm run build` before `npm start`."
  );
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      chunks.push(chunk);
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    req.on("error", reject);
  });
}

async function readJsonBody(req) {
  const raw = await readRequestBody(req);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error("Invalid JSON body");
  }
}

function normalizeAnswer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[,.!?]/g, "");
}

function checkAnswer(question, userAnswer) {
  const normalized = normalizeAnswer(userAnswer);
  return question.acceptedAnswers.some((answer) => normalizeAnswer(answer) === normalized);
}

function findQuestionById(questionId) {
  return QUESTIONS.find((question) => question.id === questionId);
}

function sanitizeApiKey(rawValue) {
  return String(rawValue || "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/;$/, "");
}

function extractApiKeyFromJsonContent(content) {
  try {
    const parsed = JSON.parse(content);
    if (!parsed) {
      return "";
    }

    const candidates = [
      parsed["open-router.key"],
      parsed.openRouterKey,
      parsed.OPENROUTER_API_KEY,
      parsed.openrouter,
      parsed.apiKey,
    ];

    return sanitizeApiKey(candidates.find(Boolean));
  } catch (error) {
    return "";
  }
}

function extractApiKeyFromText(content) {
  const patterns = [
    /open-router\.key\s*:\s*([A-Za-z0-9._-]+)/i,
    /OPENROUTER_API_KEY\s*=\s*([A-Za-z0-9._-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return sanitizeApiKey(match[1]);
    }
  }

  return "";
}

function getOpenRouterApiKey() {
  const direct = sanitizeApiKey(process.env.OPENROUTER_API_KEY);
  if (direct) {
    return direct;
  }

  const candidateFiles = [
    path.join(WORKSPACE_DIR, "key.json"),
    path.join(WORKSPACE_DIR, "key.md"),
  ];

  for (const filePath of candidateFiles) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    const key =
      path.extname(filePath).toLowerCase() === ".json"
        ? extractApiKeyFromJsonContent(content)
        : extractApiKeyFromText(content);

    if (key) {
      return key;
    }
  }

  return "";
}

function httpRequest(urlString, { method = "GET", headers = {}, body = "", timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(urlString);
    const request = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method,
        headers,
      },
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const rawBody = Buffer.concat(chunks).toString("utf8");
          resolve({
            statusCode: response.statusCode || 500,
            headers: response.headers,
            body: rawBody,
          });
        });
      }
    );

    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error("Request timeout"));
    });

    request.on("error", reject);

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

async function jsonRequest(url, options = {}) {
  const response = await httpRequest(url, options);
  let parsed = null;

  try {
    parsed = JSON.parse(response.body);
  } catch (error) {
    parsed = null;
  }

  return {
    ...response,
    json: parsed,
  };
}

async function fetchOpenRouterStatusSummary() {
  try {
    const response = await jsonRequest("https://status.openrouter.ai/api/v2/status.json", {
      timeoutMs: 8000,
    });

    if (response.statusCode >= 200 && response.statusCode < 300 && response.json?.status) {
      return {
        reachable: true,
        summary: response.json.status.description || "Unknown",
      };
    }
  } catch (error) {
  }

  try {
    const response = await httpRequest("https://status.openrouter.ai/", {
      timeoutMs: 8000,
    });

    const summaryMatch = response.body.match(
      /(All Systems Operational|Partial System Outage|Major Outage|Under Maintenance)/i
    );

    return {
      reachable: response.statusCode >= 200 && response.statusCode < 500,
      summary: summaryMatch ? summaryMatch[1] : "Unknown",
    };
  } catch (error) {
    return {
      reachable: false,
      summary: "Unreachable",
    };
  }
}

function deriveAppStatus({ configured, modelAvailable, platformReachable, activeRequests, queuedRequests }) {
  if (!configured || !platformReachable || !modelAvailable) {
    return "down";
  }

  if (activeRequests >= MAX_MODEL_CONCURRENCY || queuedRequests > 0) {
    return "busy";
  }

  return "ready";
}

async function buildLlmStatus() {
  const apiKey = getOpenRouterApiKey();
  const queueStats = analysisGate.getStats();
  const result = {
    model: MODEL_ID,
    configured: Boolean(apiKey),
    platformReachable: false,
    platformSummary: "Not checked",
    modelAvailable: false,
    maxConcurrency: queueStats.maxConcurrency,
    activeRequests: queueStats.activeRequests,
    queuedRequests: queueStats.queuedRequests,
    checkedAt: new Date().toISOString(),
    state: "down",
  };

  const platformStatus = await fetchOpenRouterStatusSummary();
  result.platformReachable = platformStatus.reachable;
  result.platformSummary = platformStatus.summary;

  if (!apiKey) {
    result.state = deriveAppStatus(result);
    return result;
  }

  try {
    const modelsResponse = await jsonRequest("https://openrouter.ai/api/v1/models", {
      timeoutMs: 10000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const collection = Array.isArray(modelsResponse.json)
      ? modelsResponse.json
      : Array.isArray(modelsResponse.json?.data)
      ? modelsResponse.json.data
      : Array.isArray(modelsResponse.json?.models)
      ? modelsResponse.json.models
      : [];

    result.modelAvailable = collection.some((item) => item && item.id === MODEL_ID);
  } catch (error) {
    result.modelAvailable = false;
  }

  result.state = deriveAppStatus(result);
  return result;
}

async function getLlmStatus(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && statusCache.value && statusCache.expiresAt > now) {
    const queueStats = analysisGate.getStats();
    return {
      ...statusCache.value,
      ...queueStats,
      state: deriveAppStatus({
        ...statusCache.value,
        ...queueStats,
      }),
      checkedAt: new Date().toISOString(),
    };
  }

  if (!forceRefresh && statusCache.pending) {
    return statusCache.pending;
  }

  statusCache.pending = buildLlmStatus()
    .then((value) => {
      statusCache.value = value;
      statusCache.expiresAt = Date.now() + STATUS_CACHE_MS;
      statusCache.pending = null;
      return value;
    })
    .catch((error) => {
      statusCache.pending = null;
      return {
        model: MODEL_ID,
        configured: Boolean(getOpenRouterApiKey()),
        platformReachable: false,
        platformSummary: "Check failed",
        modelAvailable: false,
        ...analysisGate.getStats(),
        checkedAt: new Date().toISOString(),
        state: "down",
      };
    });

  return statusCache.pending;
}

async function generateMistakeAnalysis(question, studentAnswer) {
  const apiKey = getOpenRouterApiKey();

  if (!apiKey) {
    return {
      source: "fallback",
      analysis: `The model is not configured right now, so here is the local explanation: ${question.fallbackExplanation}`,
    };
  }

  const payload = JSON.stringify({
    model: MODEL_ID,
    messages: [
      {
        role: "system",
        content:
          "You are a math teacher for students in Years 4-6. Reply in concise English using two short parts: 1. Mistake 2. Correct approach. Keep it under 120 words, use a warm tone, and avoid complex terminology.",
      },
      {
        role: "user",
        content: [
          `Question: ${question.prompt}`,
          `Concept: ${question.concept}`,
          `Student answer: ${studentAnswer}`,
          `Correct answer: ${question.answerText}`,
        ].join("\n"),
      },
    ],
    temperature: 0.2,
  });

  try {
    const response = await jsonRequest("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      timeoutMs: 20_000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: payload,
    });

    const content = response.json?.choices?.[0]?.message?.content;

    if (response.statusCode >= 200 && response.statusCode < 300 && content) {
      return {
        source: "model",
        analysis: content.trim(),
      };
    }

    return {
      source: "fallback",
      analysis: `The model is temporarily unavailable, so here is the local explanation: ${question.fallbackExplanation}`,
    };
  } catch (error) {
    return {
      source: "fallback",
      analysis: `The model connection failed, so here is the local explanation: ${question.fallbackExplanation}`,
    };
  }
}

async function handleLogin(req, res) {
  const body = await readJsonBody(req);
  const username = String(body.username || "").trim();
  const password = String(body.password || "").trim();

  if (username === DEMO_USER.username && password === DEMO_USER.password) {
    return sendJson(res, 200, {
      ok: true,
      user: {
        username: DEMO_USER.username,
        displayName: DEMO_USER.displayName,
      },
    });
  }

  return sendJson(res, 401, {
    ok: false,
    message: "Incorrect username or password. Demo account: admin / 123456",
  });
}

function handleBanks(res) {
  sendJson(res, 200, {
    banks: QUESTION_BANKS,
  });
}

function handleQuestions(res, bankId) {
  const bank = QUESTION_BANKS.find((item) => item.id === bankId);
  if (!bank) {
    return sendJson(res, 404, {
      message: "Question bank not found",
    });
  }

  const questions = QUESTIONS.filter((question) => question.bankId === bankId).map((question) => ({
    id: question.id,
    bankId: question.bankId,
    title: question.title,
    concept: question.concept,
    difficulty: question.difficulty,
    prompt: question.prompt,
  }));

  return sendJson(res, 200, {
    bank,
    questions,
  });
}

async function handleSubmission(req, res, questionId) {
  const question = findQuestionById(questionId);
  if (!question) {
    return sendJson(res, 404, {
      message: "Question not found",
    });
  }

  const body = await readJsonBody(req);
  const answer = String(body.answer || "").trim();

  if (!answer) {
    return sendJson(res, 400, {
      message: "Please enter an answer first.",
    });
  }

  const correct = checkAnswer(question, answer);
  if (correct) {
    return sendJson(res, 200, {
      questionId: question.id,
      correct: true,
      submittedAnswer: answer,
      correctAnswer: question.answerText,
      analysis:
        "Correct. You used the key steps for this question, so you are ready to move on to the next one.",
      source: "local",
      queue: analysisGate.getStats(),
    });
  }

  const explanation = await analysisGate.run(() => generateMistakeAnalysis(question, answer));

  return sendJson(res, 200, {
    questionId: question.id,
    correct: false,
    submittedAnswer: answer,
    correctAnswer: question.answerText,
    analysis: explanation.analysis,
    source: explanation.source,
    queue: analysisGate.getStats(),
  });
}

async function handleApi(req, res, pathname) {
  if (req.method === "POST" && pathname === "/api/login") {
    return handleLogin(req, res);
  }

  if (req.method === "GET" && pathname === "/api/banks") {
    return handleBanks(res);
  }

  const questionsMatch = pathname.match(/^\/api\/banks\/([^/]+)\/questions$/);
  if (req.method === "GET" && questionsMatch) {
    return handleQuestions(res, questionsMatch[1]);
  }

  const submitMatch = pathname.match(/^\/api\/questions\/([^/]+)\/submit$/);
  if (req.method === "POST" && submitMatch) {
    return handleSubmission(req, res, submitMatch[1]);
  }

  if (req.method === "GET" && pathname === "/api/llm/status") {
    const status = await getLlmStatus();
    return sendJson(res, 200, status);
  }

  if (req.method === "POST" && pathname === "/api/llm/status/refresh") {
    const status = await getLlmStatus(true);
    return sendJson(res, 200, status);
  }

  return sendJson(res, 404, {
    message: "API route not found",
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  try {
    if (req.method === "GET" && requestUrl.pathname === "/health") {
      return sendJson(res, 200, {
        ok: true,
      });
    }

    if (requestUrl.pathname.startsWith("/api/")) {
      return await handleApi(req, res, requestUrl.pathname);
    }

    if (requestUrl.pathname === "/" || requestUrl.pathname.startsWith("/app")) {
      return serveApplicationShell(res);
    }

    const served = await serveStaticFile(res, requestUrl.pathname);
    return served;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return sendJson(res, 500, {
      message,
    });
  }
});

server.listen(PORT, () => {
  console.log(`Math platform MVP running at http://localhost:${PORT}`);
});
