<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import {
  NAlert,
  NButton,
  NCard,
  NCheckbox,
  NConfigProvider,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NResult,
  NSpace,
  NSpin,
  NTag,
  NThing,
} from "naive-ui";
import StatusIndicator from "./components/StatusIndicator.vue";
import QuestionFlipCard from "./components/QuestionFlipCard.vue";

const STORAGE_KEY = "math-platform-user";

const status = reactive({
  state: "down",
  activeRequests: 0,
  maxConcurrency: 3,
  queuedRequests: 0,
  platformSummary: "Checking...",
  modelAvailable: false,
  configured: false,
  checkedAt: "",
  model: "nvidia/nemotron-3-super-120b-a12b:free",
});

const loadingBanks = ref(false);
const loadingQuestions = ref(false);
const loginLoading = ref(false);
const view = ref("landing");
const lang = ref("en");
const banks = ref([]);
const questions = ref([]);
const currentBank = ref(null);
const user = ref(readStoredUser());
const loginError = ref("");
const generalError = ref("");
const statusTimer = ref(null);

const loginForm = reactive({
  username: "admin",
  password: "123456",
});

const registerForm = reactive({
  studentName: "",
  parentPhone: "",
  grade: "",
  password: "",
});

const pricingPlans = [
  {
    name: { en: "Free Version", zh: "免费版本" },
    price: "$0",
    note: { en: "Start with a lightweight preview before choosing a paid plan.", zh: "适合先体验题型、讲解风格和学习流程。" },
    features: {
      en: ["Selected sample questions", "AI mistake explanation preview", "Basic learning pathway"],
      zh: ["精选样题体验", "AI 错题讲解预览", "基础学习路径"],
    },
  },
  {
    name: { en: "Paid Version", zh: "付费版本" },
    price: "$29/mo",
    note: { en: "Monthly access for steady practice, review, and course planning.", zh: "月付版本每月 29 美元，适合持续练习、复盘和课程规划。" },
    features: {
      en: ["Full topic-based question banks", "AI mistake review suggestions", "Monthly flexible subscription"],
      zh: ["完整分主题题库", "AI 错题复盘建议", "按月灵活订阅"],
    },
  },
  {
    name: { en: "Lifetime Version", zh: "买断版本" },
    price: "$240",
    note: { en: "One-time purchase for long-term individual learning access.", zh: "买断版本 240 美元，适合长期个人学习使用。" },
    features: {
      en: ["One-time payment", "Long-term access to practice content", "Ongoing course-guide updates"],
      zh: ["一次性购买", "长期访问练习内容", "持续获得课程指南更新"],
    },
  },
  {
    name: { en: "Enterprise Version", zh: "企业版本" },
    price: { en: "Custom", zh: "定制报价" },
    note: {
      en: "For schools, tutoring centres, and teams that need bulk seats and managed rollout.",
      zh: "面向学校、补习机构和团队采购，支持批量账号、统一管理和定制落地方案。",
    },
    features: {
      en: ["Bulk account purchase", "Class or campus management", "Custom onboarding and support"],
      zh: ["批量账号购买", "班级或校区管理", "定制 onboarding 与支持"],
    },
  },
];

const accountComparison = [
  {
    type: "free",
    name: { en: "Free Account", zh: "Free 账户" },
    badge: { en: "Default preview", zh: "默认体验" },
    detail: {
      en: "Shows demo access only, with about 5 questions in each grade bank.",
      zh: "默认进入 Free 账户，只展示 demo 内容，每个年级题库大约 5 道题。",
    },
    features: {
      en: ["Demo questions only", "Limited grade-bank preview", "Basic AI explanation preview"],
      zh: ["仅 demo 题目", "有限年级题库预览", "基础 AI 讲解预览"],
    },
  },
  {
    type: "paid",
    name: { en: "Paid Account", zh: "付款账户" },
    badge: { en: "After demo login", zh: "假登录后显示" },
    detail: {
      en: "Unlocks the complete question sets for each grade bank in this prototype.",
      zh: "假登录成功后显示为付款账户，可看到每个年级题库的完整题目数量。",
    },
    features: {
      en: ["Full question banks", "More practice per grade", "Mistake review and course planning"],
      zh: ["完整题库", "每个年级更多练习", "错题复盘与课程规划"],
    },
  },
];

const topicAreas = [
  { en: "Number and Operations", zh: "数字与运算" },
  { en: "Geometry and Space", zh: "图形与空间" },
  { en: "Word Problem Modelling", zh: "应用题建模" },
  { en: "Logical Reasoning", zh: "逻辑推理" },
  { en: "Speed and Accuracy", zh: "速度与准确率训练" },
  { en: "Selective Mock Questions", zh: "Selective 模拟题" },
];

const courseGuide = [
  {
    week: { en: "Weeks 1-2", zh: "第 1-2 周" },
    title: { en: "Foundation Diagnosis", zh: "诊断基础" },
    detail: {
      en: "Complete an entry check to locate weak spots in arithmetic, geometry, and reasoning.",
      zh: "完成入门测评，定位运算、图形、逻辑等薄弱点。",
    },
  },
  {
    week: { en: "Weeks 3-4", zh: "第 3-4 周" },
    title: { en: "Topic Breakthrough", zh: "专题突破" },
    detail: {
      en: "Practise high-frequency question types by level and record why mistakes happened.",
      zh: "围绕高频题型做分层练习，并记录错题原因。",
    },
  },
  {
    week: { en: "Weeks 5-6", zh: "第 5-6 周" },
    title: { en: "Mock Exam Sprint", zh: "模拟冲刺" },
    detail: {
      en: "Use timed sets to train speed, then review key steps with AI explanations.",
      zh: "用限时套题训练速度，配合 AI 解释复盘关键步骤。",
    },
  },
];

const i18n = {
  en: {
    navHome: "Home",
    navLogin: "Login",
    navRegister: "Register",
    navBanks: "Banks",
    languageButton: "中文",
    platformKicker: "Selective Math Learning Platform",
    landingTitle: "Selective Math Growth Studio",
    registerTitle: "Create Your Learning Account",
    loginTitle: "Welcome Back to Selective Math",
    defaultTitle: "Math Learning Platform for Years 4-6",
    landingDescription:
      "A Years 4-6 selective math training site with public pricing, topic-focused content, partner information, and a course guide.",
    registerDescription: "A polished registration preview. The form is visual only for now.",
    loginDescription: "Use the demo credentials to enter the existing question bank experience.",
    practiceDescription:
      "Submit an answer to flip the card. Incorrect answers trigger a short AI explanation.",
    defaultDescription:
      "Login, question bank selection, flashcard practice, and model status monitoring are all connected.",
    heroKicker: "Years 4-6 Selective Prep",
    heroTitle:
      "Practice, explanations, review, and course planning in one calm learning space.",
    heroSubtitle:
      "For upper-primary selective math preparation across number operations, geometry, logical reasoning, and word-problem modelling. Students practise first, then use mistake explanations to see what to improve next.",
    loginNow: "Log In",
    registerNow: "Register Preview",
    freeDemo: "View Free Demo",
    todayOpen: "Open Today",
    selectedBank: "Selected question bank + AI mistake explanations",
    yearsCovered: "year levels",
    topicCount: "core topic areas",
    courseStages: "course stages",
    demoLogin: "Demo login:",
    priceKicker: "Price Disclosure",
    priceTitle: "Public Pricing",
    transparent: "Transparent",
    accountKicker: "Account Access",
    accountTitle: "Free vs Paid Account",
    currentAccount: "Current account",
    freeAccount: "Free account",
    paidAccount: "Paid account",
    freeAccountNote: "Demo mode: about 5 questions per grade bank.",
    paidAccountNote: "Paid mode: full question banks are visible.",
    paidLoginHint: "Demo login upgrades this preview to a paid account.",
    questions: "questions",
    contentKicker: "Question-Oriented Content",
    contentTitle: "Topic-Focused Practice",
    contentCopy:
      "Questions follow the common abilities tested in selective math: concept mastery, speed, reading accuracy, and reasoning.",
    partnerKicker: "Partner Program",
    partnerTitle: "Partnership Information",
    partnerCopy:
      "Open to tutoring centres, independent teachers, and community learning hubs. Partners can use it for course leads, class practice, diagnostic displays, and local question-bank building.",
    campusTag: "Campus co-branding",
    agencyTag: "Course agency",
    contentTag: "Content co-building",
    courseKicker: "Course Guide",
    courseTitle: "Course Guide",
    loginIntroTitle: "Continue Your Math Training",
    loginIntroCopy:
      "Log in to choose a topic bank, practise with flip cards, and review mistakes. The demo account is still available for quick testing.",
    mistakeReview: "Mistake review",
    bankPractice: "Question bank practice",
    loginFormTitle: "Student Login",
    username: "Username",
    usernamePlaceholder: "Enter your username",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    enterPlatform: "Enter Platform",
    noAccount: "No account yet? View the registration page",
    registerFormTitle: "Create Learning Account",
    studentName: "Student name",
    studentNamePlaceholder: "Enter student name",
    parentContact: "Parent phone or email",
    parentContactPlaceholder: "Parent contact",
    yearLevel: "Year level",
    yearLevelPlaceholder: "Year 4 / Year 5 / Year 6",
    createPassword: "Password",
    createPasswordPlaceholder: "Create a password",
    consent: "I have read the course notes and public pricing.",
    createPreview: "Create Account Preview",
    backToLogin: "Already have an account? Back to login",
    benefitsKicker: "Account Benefits",
    benefitsTitle: "Learning Path Shown After Registration",
    benefitDiagnosisTitle: "Entry diagnosis",
    benefitDiagnosisCopy: "Use a compact question set to understand the current foundation.",
    benefitExplainTitle: "Mistake explanation",
    benefitExplainCopy: "Turn each wrong answer into student-friendly steps.",
    benefitGuideTitle: "Course suggestion",
    benefitGuideCopy: "Arrange topic practice and mock training by week.",
    registerNotice: "This registration page is a visual preview and is not connected to a real sign-up API yet.",
    questionBanks: "Question Banks",
    chooseBank: "Choose a Question Bank",
    bankSubtitle: "Mixed selective math demo bank",
    bankDescription:
      "A 30-question static demo bank randomly mixed across operations, fractions, geometry, data, ratios, probability, time, and reasoning topics.",
    refreshStatus: "Refresh Model Status",
    logout: "Log Out",
    demoQuestions: "demo questions",
    liveBank: "Live question bank",
    placeholderBank: "Placeholder question bank",
    openBank: "Open Bank",
    practiceKickerSuffix: "Demo",
    practiceTitleSuffix: "Flashcard Practice",
    backToBanks: "Back to Banks",
    practiceInfo:
      "Each question is presented as a card. After you submit, the card flips to reveal the answer. If the answer is incorrect, nvidia/nemotron-3-super-120b-a12b:free provides a short explanation for Years 4-6 learners.",
    noQuestionsTitle: "Questions have not loaded yet",
    noQuestionsDescription:
      "This bank currently uses demo data. Once a live question bank is connected, the question list will appear here.",
  },
  zh: {
    navHome: "首页",
    navLogin: "登录",
    navRegister: "注册",
    navBanks: "题库",
    languageButton: "EN",
    platformKicker: "Selective 数学学习平台",
    landingTitle: "Selective 数学成长工作室",
    registerTitle: "创建学习账号",
    loginTitle: "欢迎回到 Selective 数学平台",
    defaultTitle: "4-6 年级数学学习平台",
    landingDescription: "面向 Years 4-6 的数学择校训练：首页展示价格公示、题目方向、招商合作和课程指南。",
    registerDescription: "这是一个精修后的注册页视觉稿，目前只展示样式。",
    loginDescription: "使用 demo 账号进入现有题库体验。",
    practiceDescription: "提交答案后卡片会翻面。答错时会触发简短 AI 讲解。",
    defaultDescription: "登录、题库选择、翻卡练习和模型状态监控都已经连通。",
    heroKicker: "4-6 年级 Selective 备考",
    heroTitle: "把练题、讲解、复盘和课程规划放在一个安静清晰的学习空间里。",
    heroSubtitle:
      "面向小学高年级择校数学训练，覆盖数字运算、图形空间、逻辑推理和应用题建模。学生可以先做题，再通过错题讲解看到下一步该补什么。",
    loginNow: "立即登录",
    registerNow: "注册体验",
    freeDemo: "查看 Free Demo",
    todayOpen: "今日开放内容",
    selectedBank: "精选题库 + AI 错题讲解",
    yearsCovered: "年级覆盖",
    topicCount: "核心题目方向",
    courseStages: "课程阶段",
    demoLogin: "Demo 登录：",
    priceKicker: "价格公示",
    priceTitle: "价格公示",
    transparent: "公开透明",
    accountKicker: "账户权限",
    accountTitle: "Free 账户与付款账户区别",
    currentAccount: "当前账户",
    freeAccount: "Free 账户",
    paidAccount: "付款账户",
    freeAccountNote: "Demo 模式：每个年级题库约 5 道题。",
    paidAccountNote: "付款模式：展示完整题库内容。",
    paidLoginHint: "使用 demo 假登录后，这个视觉稿会显示为付款账户。",
    questions: "道题",
    contentKicker: "题目面向内容",
    contentTitle: "题目面向内容",
    contentCopy: "题目围绕 Selective 数学常见能力展开，先看概念掌握，再看速度、审题和表达。",
    partnerKicker: "招商合作",
    partnerTitle: "招商信息",
    partnerCopy: "面向补习机构、独立老师和社区学习中心开放合作。可用于课程引流、班级练习、错题诊断展示和本地化题库共建。",
    campusTag: "校区联名",
    agencyTag: "课程代理",
    contentTag: "内容共建",
    courseKicker: "课程指南",
    courseTitle: "课程指南",
    loginIntroTitle: "继续你的数学训练",
    loginIntroCopy: "登录后进入题库，选择对应主题，开始翻卡练习和错题讲解。当前仍保留 demo 账号，方便快速体验。",
    mistakeReview: "错题复盘",
    bankPractice: "题库练习",
    loginFormTitle: "学生登录",
    username: "用户名",
    usernamePlaceholder: "请输入用户名",
    password: "密码",
    passwordPlaceholder: "请输入密码",
    enterPlatform: "进入平台",
    noAccount: "没有账号？先看注册页",
    registerFormTitle: "创建学习账号",
    studentName: "学生姓名",
    studentNamePlaceholder: "请输入学生姓名",
    parentContact: "家长电话或邮箱",
    parentContactPlaceholder: "请输入家长联系方式",
    yearLevel: "年级",
    yearLevelPlaceholder: "Year 4 / Year 5 / Year 6",
    createPassword: "密码",
    createPasswordPlaceholder: "创建密码",
    consent: "我已阅读课程说明和价格公示。",
    createPreview: "创建账号预览",
    backToLogin: "已有账号，返回登录",
    benefitsKicker: "账号权益",
    benefitsTitle: "注册后可展示的学习路径",
    benefitDiagnosisTitle: "入门诊断",
    benefitDiagnosisCopy: "用少量题目判断当前基础。",
    benefitExplainTitle: "错题讲解",
    benefitExplainCopy: "把错误原因写成学生能理解的步骤。",
    benefitGuideTitle: "课程建议",
    benefitGuideCopy: "按周安排专题练习和模拟训练。",
    registerNotice: "注册页目前仅为视觉稿，尚未连接真实账号创建接口。",
    questionBanks: "题库",
    chooseBank: "选择题库",
    bankSubtitle: "混合 Selective 数学 demo 题库",
    bankDescription: "30 道静态 demo 题，随机混合运算、分数、几何、数据、比例、概率、时间和推理等主题。",
    refreshStatus: "刷新模型状态",
    logout: "退出登录",
    demoQuestions: "道 demo 题",
    liveBank: "真实题库",
    placeholderBank: "占位题库",
    openBank: "打开题库",
    practiceKickerSuffix: "Demo",
    practiceTitleSuffix: "翻卡练习",
    backToBanks: "返回题库",
    practiceInfo:
      "每道题都会以卡片形式展示。提交后卡片翻面显示答案；如果答错，nvidia/nemotron-3-super-120b-a12b:free 会为 4-6 年级学生提供简短讲解。",
    noQuestionsTitle: "题目还没有加载",
    noQuestionsDescription: "当前题库使用 demo 数据。接入真实题库后，题目列表会显示在这里。",
  },
};

const t = computed(() => i18n[lang.value]);
const isZh = computed(() => lang.value === "zh");
const accountType = computed(() => (user.value?.accountType === "paid" ? "paid" : "free"));
const isPaidAccount = computed(() => accountType.value === "paid");
const accountLabel = computed(() => (isPaidAccount.value ? t.value.paidAccount : t.value.freeAccount));
const accountNote = computed(() => (isPaidAccount.value ? t.value.paidAccountNote : t.value.freeAccountNote));
const accountTagType = computed(() => (isPaidAccount.value ? "success" : "warning"));

const themeOverrides = {
  common: {
    primaryColor: "#1d4ed8",
    primaryColorHover: "#1e40af",
    primaryColorPressed: "#1e3a8a",
    successColor: "#15803d",
    warningColor: "#d97706",
    errorColor: "#b91c1c",
    borderRadius: "18px",
    fontFamily: "'Aptos', 'Segoe UI', sans-serif",
  },
  Card: {
    borderRadius: "28px",
  },
};

const headerTitle = computed(() => {
  if (view.value === "landing") {
    return t.value.landingTitle;
  }

  if (view.value === "register") {
    return t.value.registerTitle;
  }

  if (view.value === "login") {
    return t.value.loginTitle;
  }

  if (view.value === "practice" && currentBank.value) {
    return `${copy(currentBank.value.name)} ${t.value.practiceTitleSuffix}`;
  }

  return t.value.defaultTitle;
});

const statusDescription = computed(() => {
  if (view.value === "landing") {
    return t.value.landingDescription;
  }

  if (view.value === "register") {
    return t.value.registerDescription;
  }

  if (view.value === "login") {
    return t.value.loginDescription;
  }

  if (view.value === "practice") {
    return t.value.practiceDescription;
  }

  return t.value.defaultDescription;
});

function copy(value) {
  if (typeof value === "string") {
    return value;
  }

  return value?.[lang.value] || value?.en || "";
}

function toggleLang() {
  lang.value = isZh.value ? "en" : "zh";
}

function bankSubtitle(bank) {
  return copy(bank.subtitle) || t.value.bankSubtitle;
}

function bankDescription(bank) {
  return copy(bank.description) || t.value.bankDescription;
}

function questionCountText(bank) {
  if (isPaidAccount.value) {
    return isZh.value ? `${bank.questionCount}${t.value.questions}` : `${bank.questionCount} ${t.value.questions}`;
  }

  return isZh.value ? `${bank.questionCount}${t.value.demoQuestions}` : `${bank.questionCount} ${t.value.demoQuestions}`;
}

function showBanks() {
  view.value = "home";

  if (!banks.value.length) {
    loadBanks();
  }
}

function readStoredUser() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function saveUser(nextUser) {
  user.value = nextUser;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
}

function clearUser() {
  user.value = null;
  window.localStorage.removeItem(STORAGE_KEY);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

async function refreshStatus(force = false) {
  try {
    const endpoint = force ? "/api/llm/status/refresh" : "/api/llm/status";
    const nextStatus =
      force
        ? await requestJson(endpoint, { method: "POST", body: "{}" })
        : await requestJson(endpoint);

    Object.assign(status, nextStatus);
  } catch (error) {
    Object.assign(status, {
      state: "down",
      activeRequests: 0,
      maxConcurrency: 3,
      queuedRequests: 0,
      platformSummary: "Status endpoint unavailable",
      modelAvailable: false,
      configured: false,
      checkedAt: new Date().toISOString(),
      model: status.model,
    });
  }
}

function startStatusPolling() {
  refreshStatus(true);
  statusTimer.value = window.setInterval(() => {
    refreshStatus(false);
  }, 5000);
}

async function loadBanks() {
  loadingBanks.value = true;
  generalError.value = "";

  try {
    const params = new URLSearchParams({ account: accountType.value });
    const data = await requestJson(`/api/banks?${params.toString()}`);
    banks.value = data.banks || [];
  } catch (error) {
    generalError.value = error.message;
  } finally {
    loadingBanks.value = false;
  }
}

async function openBank(bankId) {
  loadingQuestions.value = true;
  generalError.value = "";

  try {
    const params = new URLSearchParams({ account: accountType.value });
    const data = await requestJson(`/api/banks/${bankId}/questions?${params.toString()}`);
    currentBank.value = data.bank;
    questions.value = data.questions || [];
    view.value = "practice";
  } catch (error) {
    generalError.value = error.message;
  } finally {
    loadingQuestions.value = false;
  }
}

async function login() {
  loginLoading.value = true;
  loginError.value = "";

  try {
    const result = await requestJson("/api/login", {
      method: "POST",
      body: JSON.stringify(loginForm),
    });

    saveUser(result.user);
    await loadBanks();
    view.value = "home";
  } catch (error) {
    loginError.value = error.message;
  } finally {
    loginLoading.value = false;
  }
}

async function logout() {
  clearUser();
  currentBank.value = null;
  questions.value = [];
  view.value = "landing";
  await loadBanks();
}

async function submitAnswer(questionId, answer) {
  const result = await requestJson(`/api/questions/${questionId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });

  refreshStatus(false);
  return result;
}

function onCardSubmitted() {
  refreshStatus(false);
}

onMounted(async () => {
  startStatusPolling();

  await loadBanks();
});

onBeforeUnmount(() => {
  if (statusTimer.value) {
    window.clearInterval(statusTimer.value);
  }
});
</script>

<template>
  <n-config-provider :theme="null" :theme-overrides="themeOverrides">
    <n-layout class="app-shell">
      <n-layout-header bordered class="app-header">
        <div class="brand-copy">
          <n-space wrap class="top-nav" :size="8">
            <n-button quaternary size="small" @click="view = 'landing'">{{ t.navHome }}</n-button>
            <n-button quaternary size="small" @click="view = 'login'">{{ t.navLogin }}</n-button>
            <n-button quaternary size="small" @click="view = 'register'">{{ t.navRegister }}</n-button>
            <n-button quaternary size="small" @click="showBanks">{{ t.navBanks }}</n-button>
          </n-space>
          <p class="section-kicker">{{ t.platformKicker }}</p>
          <h1 class="hero-title">{{ headerTitle }}</h1>
          <p class="hero-subtitle">{{ statusDescription }}</p>
        </div>

        <div class="header-tools">
          <n-button class="language-toggle" type="primary" secondary @click="toggleLang">
            {{ t.languageButton }}
          </n-button>
          <status-indicator :status="status" :lang="lang" />
        </div>
      </n-layout-header>

      <n-layout-content class="app-content">
        <section v-if="view === 'landing'" class="page-section landing-page">
          <div class="home-hero">
            <div class="home-hero__copy">
              <p class="section-kicker">{{ t.heroKicker }}</p>
              <h2 class="home-hero__title">{{ t.heroTitle }}</h2>
              <p class="hero-subtitle">
                {{ t.heroSubtitle }}
              </p>
              <n-space wrap :size="12" class="hero-actions">
                <n-button type="primary" size="large" @click="view = 'login'">{{ t.loginNow }}</n-button>
                <n-button secondary type="primary" size="large" @click="showBanks">{{ t.freeDemo }}</n-button>
                <n-button tertiary size="large" @click="view = 'register'">{{ t.registerNow }}</n-button>
              </n-space>
            </div>

            <n-card class="hero-side-card" :bordered="false">
              <n-space vertical :size="16">
                <div>
                  <p class="section-kicker">{{ t.todayOpen }}</p>
                  <h3 class="section-title section-title--small">{{ t.selectedBank }}</h3>
                </div>
                <div class="hero-metric-grid">
                  <div>
                    <strong>4-6</strong>
                    <span>{{ t.yearsCovered }}</span>
                  </div>
                  <div>
                    <strong>6</strong>
                    <span>{{ t.topicCount }}</span>
                  </div>
                  <div>
                    <strong>3</strong>
                    <span>{{ t.courseStages }}</span>
                  </div>
                </div>
                <n-alert type="info" :show-icon="false">
                  {{ t.demoLogin }} <strong>admin</strong>, {{ t.password }}: <strong>123456</strong>
                </n-alert>
              </n-space>
            </n-card>
          </div>

          <section class="content-band">
            <n-space justify="space-between" align="end" class="section-toolbar">
              <div>
                <p class="section-kicker">{{ t.priceKicker }}</p>
                <h2 class="section-title">{{ t.priceTitle }}</h2>
              </div>
              <n-tag round type="success">{{ t.transparent }}</n-tag>
            </n-space>

            <n-grid cols="1 m:2 l:4" responsive="screen" :x-gap="18" :y-gap="18">
              <n-grid-item v-for="plan in pricingPlans" :key="copy(plan.name)">
                <n-card class="price-card" :bordered="false">
                  <n-space vertical :size="14">
                    <div>
                      <p class="section-kicker">{{ copy(plan.name) }}</p>
                      <div class="price-line">{{ copy(plan.price) }}</div>
                      <p class="card-copy">{{ copy(plan.note) }}</p>
                    </div>
                    <ul class="plain-list">
                      <li v-for="feature in plan.features[lang]" :key="feature">{{ feature }}</li>
                    </ul>
                  </n-space>
                </n-card>
              </n-grid-item>
            </n-grid>
          </section>

          <section class="content-band">
            <div>
              <p class="section-kicker">{{ t.accountKicker }}</p>
              <h2 class="section-title">{{ t.accountTitle }}</h2>
            </div>
            <n-grid cols="1 m:2" responsive="screen" :x-gap="18" :y-gap="18">
              <n-grid-item v-for="item in accountComparison" :key="copy(item.name)">
                <n-card class="account-card" :bordered="false">
                  <n-space vertical :size="14">
                    <n-space justify="space-between" align="start">
                      <div>
                        <p class="section-kicker">{{ copy(item.badge) }}</p>
                        <h3 class="section-title section-title--small">{{ copy(item.name) }}</h3>
                      </div>
                      <n-tag round :type="item.type === 'paid' ? 'success' : 'warning'">
                        {{ copy(item.badge) }}
                      </n-tag>
                    </n-space>
                    <p class="card-copy">{{ copy(item.detail) }}</p>
                    <ul class="plain-list">
                      <li v-for="feature in item.features[lang]" :key="feature">{{ feature }}</li>
                    </ul>
                  </n-space>
                </n-card>
              </n-grid-item>
            </n-grid>
          </section>

          <section class="content-band">
            <n-grid cols="1 l:2" responsive="screen" :x-gap="24" :y-gap="24">
              <n-grid-item>
                <n-card class="feature-card" :bordered="false">
                  <n-space vertical :size="18">
                    <div>
                      <p class="section-kicker">{{ t.contentKicker }}</p>
                      <h2 class="section-title">{{ t.contentTitle }}</h2>
                    </div>
                    <p class="card-copy">
                      {{ t.contentCopy }}
                    </p>
                    <div class="topic-grid">
                      <n-tag v-for="topic in topicAreas" :key="topic.en" round type="info">
                        {{ copy(topic) }}
                      </n-tag>
                    </div>
                  </n-space>
                </n-card>
              </n-grid-item>

              <n-grid-item>
                <n-card class="feature-card" :bordered="false">
                  <n-space vertical :size="18">
                    <div>
                      <p class="section-kicker">{{ t.partnerKicker }}</p>
                      <h2 class="section-title">{{ t.partnerTitle }}</h2>
                    </div>
                    <p class="card-copy">
                      {{ t.partnerCopy }}
                    </p>
                    <n-space wrap>
                      <n-tag round type="success">{{ t.campusTag }}</n-tag>
                      <n-tag round type="warning">{{ t.agencyTag }}</n-tag>
                      <n-tag round type="info">{{ t.contentTag }}</n-tag>
                    </n-space>
                  </n-space>
                </n-card>
              </n-grid-item>
            </n-grid>
          </section>

          <section class="content-band">
            <div>
              <p class="section-kicker">{{ t.courseKicker }}</p>
              <h2 class="section-title">{{ t.courseTitle }}</h2>
            </div>
            <div class="course-timeline">
              <div v-for="item in courseGuide" :key="item.week" class="course-step">
                <span>{{ copy(item.week) }}</span>
                <h3>{{ copy(item.title) }}</h3>
                <p>{{ copy(item.detail) }}</p>
              </div>
            </div>
          </section>
        </section>

        <section v-else-if="view === 'login'" class="page-section auth-section">
          <n-grid cols="1 s:2" responsive="screen" :x-gap="24" :y-gap="24">
            <n-grid-item>
              <n-card class="auth-card auth-card--intro" :bordered="false">
                <n-space vertical :size="20">
                  <n-thing>
                    <template #header>{{ t.loginIntroTitle }}</template>
                    <template #description>
                      {{ t.loginIntroCopy }}
                    </template>
                  </n-thing>

                  <n-space wrap>
                    <n-tag round type="success">{{ t.mistakeReview }}</n-tag>
                    <n-tag round type="info">{{ t.bankPractice }}</n-tag>
                    <n-tag round type="warning">AI Explanation</n-tag>
                  </n-space>

                  <n-alert type="info" :show-icon="false">
                    {{ t.demoLogin }} <strong>admin</strong>, {{ t.password }}: <strong>123456</strong>
                  </n-alert>
                </n-space>
              </n-card>
            </n-grid-item>

            <n-grid-item>
              <n-card class="auth-card" :bordered="false">
                <div class="auth-heading">
                  <p class="section-kicker">Login</p>
                  <h2 class="section-title">{{ t.loginFormTitle }}</h2>
                </div>
                <n-form label-placement="top" @submit.prevent="login">
                  <n-form-item :label="t.username">
                    <n-input v-model:value="loginForm.username" size="large" :placeholder="t.usernamePlaceholder" />
                  </n-form-item>
                  <n-form-item :label="t.password">
                    <n-input
                      v-model:value="loginForm.password"
                      type="password"
                      size="large"
                      :placeholder="t.passwordPlaceholder"
                      show-password-on="click"
                    />
                  </n-form-item>
                  <n-space vertical :size="12">
                    <n-button type="primary" size="large" :loading="loginLoading" @click="login">
                      {{ t.enterPlatform }}
                    </n-button>
                    <n-button quaternary type="primary" @click="view = 'register'">
                      {{ t.noAccount }}
                    </n-button>
                    <n-alert v-if="loginError" type="error" :show-icon="false">
                      {{ loginError }}
                    </n-alert>
                  </n-space>
                </n-form>
              </n-card>
            </n-grid-item>
          </n-grid>
        </section>

        <section v-else-if="view === 'register'" class="page-section auth-section">
          <n-grid cols="1 m:2" responsive="screen" :x-gap="24" :y-gap="24">
            <n-grid-item>
              <n-card class="auth-card" :bordered="false">
                <div class="auth-heading">
                  <p class="section-kicker">Register</p>
                  <h2 class="section-title">{{ t.registerFormTitle }}</h2>
                </div>
                <n-form label-placement="top">
                  <n-form-item :label="t.studentName">
                    <n-input v-model:value="registerForm.studentName" size="large" :placeholder="t.studentNamePlaceholder" />
                  </n-form-item>
                  <n-form-item :label="t.parentContact">
                    <n-input v-model:value="registerForm.parentPhone" size="large" :placeholder="t.parentContactPlaceholder" />
                  </n-form-item>
                  <n-form-item :label="t.yearLevel">
                    <n-input v-model:value="registerForm.grade" size="large" :placeholder="t.yearLevelPlaceholder" />
                  </n-form-item>
                  <n-form-item :label="t.createPassword">
                    <n-input
                      v-model:value="registerForm.password"
                      type="password"
                      size="large"
                      :placeholder="t.createPasswordPlaceholder"
                      show-password-on="click"
                    />
                  </n-form-item>
                  <n-space vertical :size="14">
                    <n-checkbox>{{ t.consent }}</n-checkbox>
                    <n-button type="primary" size="large">{{ t.createPreview }}</n-button>
                    <n-button quaternary type="primary" @click="view = 'login'">{{ t.backToLogin }}</n-button>
                  </n-space>
                </n-form>
              </n-card>
            </n-grid-item>

            <n-grid-item>
              <n-card class="auth-card auth-card--intro" :bordered="false">
                <n-space vertical :size="18">
                  <div>
                    <p class="section-kicker">{{ t.benefitsKicker }}</p>
                    <h2 class="section-title">{{ t.benefitsTitle }}</h2>
                  </div>
                  <div class="benefit-list">
                    <div>
                      <strong>{{ t.benefitDiagnosisTitle }}</strong>
                      <span>{{ t.benefitDiagnosisCopy }}</span>
                    </div>
                    <div>
                      <strong>{{ t.benefitExplainTitle }}</strong>
                      <span>{{ t.benefitExplainCopy }}</span>
                    </div>
                    <div>
                      <strong>{{ t.benefitGuideTitle }}</strong>
                      <span>{{ t.benefitGuideCopy }}</span>
                    </div>
                  </div>
                  <n-alert type="warning" :show-icon="false">
                    {{ t.registerNotice }}
                  </n-alert>
                </n-space>
              </n-card>
            </n-grid-item>
          </n-grid>
        </section>

        <section v-else-if="view === 'home'" class="page-section">
          <n-space justify="space-between" align="center" class="section-toolbar">
            <div>
              <p class="section-kicker">{{ t.questionBanks }}</p>
              <h2 class="section-title">{{ t.chooseBank }}</h2>
              <p class="card-copy account-summary">
                {{ t.currentAccount }}: <strong>{{ accountLabel }}</strong> · {{ accountNote }}
              </p>
            </div>
            <n-space>
              <n-tag round :type="accountTagType">{{ accountLabel }}</n-tag>
              <n-button quaternary type="primary" @click="refreshStatus(true)">{{ t.refreshStatus }}</n-button>
              <n-button v-if="user" tertiary @click="logout">{{ t.logout }}</n-button>
              <n-button v-else tertiary @click="view = 'login'">{{ t.loginNow }}</n-button>
            </n-space>
          </n-space>

          <n-alert v-if="!isPaidAccount" type="warning" :show-icon="false" class="section-alert">
            {{ t.paidLoginHint }}
          </n-alert>

          <n-alert v-if="generalError" type="error" :show-icon="false" class="section-alert">
            {{ generalError }}
          </n-alert>

          <n-spin :show="loadingBanks">
            <n-grid cols="1 s:2 l:3" responsive="screen" :x-gap="24" :y-gap="24">
              <n-grid-item v-for="bank in banks" :key="bank.id">
                <n-card class="bank-card" :bordered="false">
                  <n-space vertical :size="18">
                    <n-space justify="space-between" align="start">
                      <div>
                        <p class="section-kicker">{{ bankSubtitle(bank) }}</p>
                        <h3 class="section-title section-title--small">{{ copy(bank.name) }}</h3>
                      </div>
                      <n-tag round type="info">
                        {{ questionCountText(bank) }}
                      </n-tag>
                    </n-space>

                    <div class="card-copy">{{ bankDescription(bank) }}</div>

                    <n-space justify="space-between" align="center">
                      <n-tag round :type="bank.connected ? 'success' : 'warning'">
                        {{ bank.connected ? t.liveBank : t.placeholderBank }}
                      </n-tag>
                      <n-button type="primary" @click="openBank(bank.id)">{{ t.openBank }}</n-button>
                    </n-space>
                  </n-space>
                </n-card>
              </n-grid-item>
            </n-grid>
          </n-spin>
        </section>

        <section v-else class="page-section">
          <n-space justify="space-between" align="center" class="section-toolbar">
            <div>
              <p class="section-kicker">{{ copy(currentBank?.name) || "GMSK" }} {{ t.practiceKickerSuffix }}</p>
              <h2 class="section-title">{{ copy(currentBank?.name) || "GMSK" }} {{ t.practiceTitleSuffix }}</h2>
            </div>
            <n-space>
              <n-button quaternary type="primary" @click="refreshStatus(true)">{{ t.refreshStatus }}</n-button>
              <n-button tertiary @click="view = 'home'">{{ t.backToBanks }}</n-button>
            </n-space>
          </n-space>

          <n-alert type="info" :show-icon="false" class="section-alert">
            {{ t.practiceInfo }}
          </n-alert>

          <n-spin :show="loadingQuestions">
            <n-result
              v-if="!questions.length && !loadingQuestions"
              status="418"
              :title="t.noQuestionsTitle"
              :description="t.noQuestionsDescription"
            />

            <n-grid v-else cols="1 m:2" responsive="screen" :x-gap="24" :y-gap="24">
              <n-grid-item v-for="question in questions" :key="question.id">
                <question-flip-card
                  :question="question"
                  :submit-answer="submitAnswer"
                  :lang="lang"
                  @submitted="onCardSubmitted"
                />
              </n-grid-item>
            </n-grid>
          </n-spin>
        </section>
      </n-layout-content>
    </n-layout>
  </n-config-provider>
</template>
