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
    subtitle: "当前演示题库",
    description: "目前首页仅展示 GMSK 题库入口。真实题库尚未接入，这里先用 4 道演示题完成交互流程。",
    connected: false,
    questionCount: 4,
  },
];

const QUESTIONS = [
  {
    id: "q1",
    bankId: "gmsk",
    title: "速算练习",
    concept: "四则运算",
    difficulty: "Year 4",
    prompt: "计算：48 ÷ 6 + 7 = ?",
    answerText: "15",
    acceptedAnswers: ["15"],
    fallbackExplanation:
      "先算除法 48 ÷ 6 = 8，再算加法 8 + 7 = 15。遇到混合运算时，先乘除，后加减。",
  },
  {
    id: "q2",
    bankId: "gmsk",
    title: "分数应用",
    concept: "分数",
    difficulty: "Year 5",
    prompt: "一个班有 24 名学生，其中 3/4 参加了合唱队。参加合唱队的有多少人？",
    answerText: "18 人",
    acceptedAnswers: ["18", "18人"],
    fallbackExplanation:
      "求 24 的 3/4，就是先用 24 ÷ 4 = 6，再用 6 × 3 = 18，所以参加合唱队的有 18 人。",
  },
  {
    id: "q3",
    bankId: "gmsk",
    title: "小数与周长",
    concept: "测量",
    difficulty: "Year 6",
    prompt: "一个长方形的长是 9 cm，宽是 6 cm，它的周长是多少厘米？",
    answerText: "30 cm",
    acceptedAnswers: ["30", "30cm"],
    fallbackExplanation:
      "长方形周长 = (长 + 宽) × 2，所以 (9 + 6) × 2 = 15 × 2 = 30 cm。",
  },
  {
    id: "q4",
    bankId: "gmsk",
    title: "百分数",
    concept: "百分数",
    difficulty: "Year 6",
    prompt: "一本书原价 80 元，打九折后售价是多少元？",
    answerText: "72 元",
    acceptedAnswers: ["72", "72元"],
    fallbackExplanation:
      "九折表示付原价的 90%。先把 80 × 0.9，得到 72，所以现价是 72 元。",
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
    .replace(/[，,。.!?？]/g, "")
    .replace(/厘米/g, "cm")
    .replace(/元/g, "元");
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
    platformSummary: "未检查",
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
        platformSummary: "检查失败",
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
      analysis: `模型当前未配置，先使用本地解析：${question.fallbackExplanation}`,
    };
  }

  const payload = JSON.stringify({
    model: MODEL_ID,
    messages: [
      {
        role: "system",
        content:
          "你是一名面向 4-6 年级学生的数学老师。请用简洁中文输出两小段：1. 错误点 2. 正确思路。控制在 120 字内，语气温和，不要使用复杂术语。",
      },
      {
        role: "user",
        content: [
          `题目：${question.prompt}`,
          `知识点：${question.concept}`,
          `学生答案：${studentAnswer}`,
          `正确答案：${question.answerText}`,
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
      analysis: `模型暂时不可用，先使用本地解析：${question.fallbackExplanation}`,
    };
  } catch (error) {
    return {
      source: "fallback",
      analysis: `模型连接失败，先使用本地解析：${question.fallbackExplanation}`,
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
    message: "用户名或密码错误。演示账号：admin / 123456",
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
      message: "题库不存在",
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
      message: "题目不存在",
    });
  }

  const body = await readJsonBody(req);
  const answer = String(body.answer || "").trim();

  if (!answer) {
    return sendJson(res, 400, {
      message: "请先输入答案。",
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
        "回答正确。你已经抓住这道题的关键步骤了，可以继续挑战下一题。",
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
