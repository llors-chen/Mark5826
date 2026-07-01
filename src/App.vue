<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import {
  NAlert,
  NButton,
  NCard,
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
const view = ref("login");
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
  if (view.value === "practice" && currentBank.value) {
    return `${currentBank.value.name} Flashcard Practice`;
  }

  return "Math Learning Platform for Years 4-6";
});

const statusDescription = computed(() => {
  if (view.value === "practice") {
    return "Submit an answer to flip the card. Incorrect answers trigger a short AI explanation.";
  }

  return "Login, question bank selection, flashcard practice, and model status monitoring are all connected.";
});

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
    const data = await requestJson("/api/banks");
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
    const data = await requestJson(`/api/banks/${bankId}/questions`);
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

function logout() {
  clearUser();
  currentBank.value = null;
  questions.value = [];
  view.value = "login";
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

  if (user.value) {
    await loadBanks();
    view.value = "home";
  }
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
          <p class="section-kicker">Selective Math Learning Platform</p>
          <h1 class="hero-title">{{ headerTitle }}</h1>
          <p class="hero-subtitle">{{ statusDescription }}</p>
        </div>

        <status-indicator :status="status" />
      </n-layout-header>

      <n-layout-content class="app-content">
        <section v-if="view === 'login'" class="page-section">
          <n-grid cols="1 s:2" responsive="screen" :x-gap="24" :y-gap="24">
            <n-grid-item>
              <n-card class="feature-card" :bordered="false">
                <n-space vertical :size="20">
                  <n-thing>
                    <template #header>Vue 3 + Naive UI Frontend Base</template>
                    <template #description>
                      This frontend now uses a Vue component structure, making it easier to connect real question banks,
                      learning reports, and a future teacher dashboard.
                    </template>
                  </n-thing>

                  <n-space wrap>
                    <n-tag round type="success">Vue 3</n-tag>
                    <n-tag round type="info">Naive UI</n-tag>
                    <n-tag round type="warning">OpenRouter</n-tag>
                  </n-space>

                  <n-alert type="info" :show-icon="false">
                    Demo login: <strong>admin</strong>, password: <strong>123456</strong>
                  </n-alert>
                </n-space>
              </n-card>
            </n-grid-item>

            <n-grid-item>
              <n-card class="feature-card" :bordered="false">
                <n-form label-placement="top" @submit.prevent="login">
                  <n-form-item label="Username">
                    <n-input v-model:value="loginForm.username" size="large" placeholder="Enter your username" />
                  </n-form-item>
                  <n-form-item label="Password">
                    <n-input
                      v-model:value="loginForm.password"
                      type="password"
                      size="large"
                      placeholder="Enter your password"
                      show-password-on="click"
                    />
                  </n-form-item>
                  <n-space vertical :size="12">
                    <n-button type="primary" size="large" :loading="loginLoading" @click="login">
                      Enter Platform
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

        <section v-else-if="view === 'home'" class="page-section">
          <n-space justify="space-between" align="center" class="section-toolbar">
            <div>
              <p class="section-kicker">Question Banks</p>
              <h2 class="section-title">Choose a Question Bank</h2>
            </div>
            <n-space>
              <n-button quaternary type="primary" @click="refreshStatus(true)">Refresh Model Status</n-button>
              <n-button tertiary @click="logout">Log Out</n-button>
            </n-space>
          </n-space>

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
                        <p class="section-kicker">{{ bank.subtitle }}</p>
                        <h3 class="section-title section-title--small">{{ bank.name }}</h3>
                      </div>
                      <n-tag round type="info">{{ bank.questionCount }} demo questions</n-tag>
                    </n-space>

                    <div class="card-copy">{{ bank.description }}</div>

                    <n-space justify="space-between" align="center">
                      <n-tag round :type="bank.connected ? 'success' : 'warning'">
                        {{ bank.connected ? "Live question bank" : "Placeholder question bank" }}
                      </n-tag>
                      <n-button type="primary" @click="openBank(bank.id)">Open Bank</n-button>
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
              <p class="section-kicker">{{ currentBank?.name || "GMSK" }} Demo</p>
              <h2 class="section-title">{{ currentBank?.name || "GMSK" }} Flashcard Practice</h2>
            </div>
            <n-space>
              <n-button quaternary type="primary" @click="refreshStatus(true)">Refresh Model Status</n-button>
              <n-button tertiary @click="view = 'home'">Back to Banks</n-button>
            </n-space>
          </n-space>

          <n-alert type="info" :show-icon="false" class="section-alert">
            Each question is presented as a card. After you submit, the card flips to reveal the answer. If the
            answer is incorrect, <code>nvidia/nemotron-3-super-120b-a12b:free</code> provides a short explanation
            for Years 4-6 learners.
          </n-alert>

          <n-spin :show="loadingQuestions">
            <n-result
              v-if="!questions.length && !loadingQuestions"
              status="418"
              title="Questions have not loaded yet"
              description="This bank currently uses demo data. Once a live question bank is connected, the question list will appear here."
            />

            <n-grid v-else cols="1 m:2" responsive="screen" :x-gap="24" :y-gap="24">
              <n-grid-item v-for="question in questions" :key="question.id">
                <question-flip-card
                  :question="question"
                  :submit-answer="submitAnswer"
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
