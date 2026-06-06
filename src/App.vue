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
  platformSummary: "检查中",
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
    return `${currentBank.value.name} 卡片式练习`;
  }

  return "4-6 年级数学学习平台";
});

const statusDescription = computed(() => {
  if (view.value === "practice") {
    return "提交后翻转卡片显示答案，答错时调用大模型生成解析。";
  }

  return "登录、题库选择、卡片做题和模型状态监控都已经接入。";
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
    throw new Error(data.message || "请求失败");
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
      platformSummary: "状态接口失败",
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
                    <template #header>Vue 3 + Naive UI 前端基座</template>
                    <template #description>
                      这一版前端已经改成 Vue 组件结构，后续接真实题库、学习报告和教师端都会更顺手。
                    </template>
                  </n-thing>

                  <n-space wrap>
                    <n-tag round type="success">Vue 3</n-tag>
                    <n-tag round type="info">Naive UI</n-tag>
                    <n-tag round type="warning">OpenRouter</n-tag>
                  </n-space>

                  <n-alert type="info" :show-icon="false">
                    演示登录账号：<strong>admin</strong>，密码：<strong>123456</strong>
                  </n-alert>
                </n-space>
              </n-card>
            </n-grid-item>

            <n-grid-item>
              <n-card class="feature-card" :bordered="false">
                <n-form label-placement="top" @submit.prevent="login">
                  <n-form-item label="用户名">
                    <n-input v-model:value="loginForm.username" size="large" placeholder="请输入用户名" />
                  </n-form-item>
                  <n-form-item label="密码">
                    <n-input
                      v-model:value="loginForm.password"
                      type="password"
                      size="large"
                      placeholder="请输入密码"
                      show-password-on="click"
                    />
                  </n-form-item>
                  <n-space vertical :size="12">
                    <n-button type="primary" size="large" :loading="loginLoading" @click="login">
                      进入平台
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
              <h2 class="section-title">选择题库</h2>
            </div>
            <n-space>
              <n-button quaternary type="primary" @click="refreshStatus(true)">刷新模型状态</n-button>
              <n-button tertiary @click="logout">退出登录</n-button>
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
                      <n-tag round type="info">{{ bank.questionCount }} 题演示</n-tag>
                    </n-space>

                    <div class="card-copy">{{ bank.description }}</div>

                    <n-space justify="space-between" align="center">
                      <n-tag round :type="bank.connected ? 'success' : 'warning'">
                        {{ bank.connected ? "真实题库" : "占位题库" }}
                      </n-tag>
                      <n-button type="primary" @click="openBank(bank.id)">进入题库</n-button>
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
              <h2 class="section-title">{{ currentBank?.name || "GMSK" }} 卡片式练习</h2>
            </div>
            <n-space>
              <n-button quaternary type="primary" @click="refreshStatus(true)">刷新模型状态</n-button>
              <n-button tertiary @click="view = 'home'">返回题库</n-button>
            </n-space>
          </n-space>

          <n-alert type="info" :show-icon="false" class="section-alert">
            每道题是一张卡片。提交后会翻面显示正确答案；如果答错，会调用
            <code>nvidia/nemotron-3-super-120b-a12b:free</code> 输出面向 4-6 年级学生的简洁解析。
          </n-alert>

          <n-spin :show="loadingQuestions">
            <n-result
              v-if="!questions.length && !loadingQuestions"
              status="418"
              title="题目还没加载出来"
              description="当前题库是演示数据。如果后续接入真实题库，这里会直接展示题目列表。"
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
