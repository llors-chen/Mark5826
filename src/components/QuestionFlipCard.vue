<script setup>
import { computed, ref } from "vue";
import {
  NButton,
  NCard,
  NInput,
  NSpace,
  NTag,
  NText,
} from "naive-ui";

const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
  submitAnswer: {
    type: Function,
    required: true,
  },
  lang: {
    type: String,
    default: "en",
  },
});

const emit = defineEmits(["submitted"]);

const answer = ref("");
const feedback = ref("");
const pending = ref(false);
const flipped = ref(false);
const result = ref(null);

const t = computed(() => {
  if (props.lang === "zh") {
    return {
      pendingReview: "等待批改",
      correctAnswerLabel: "回答正确",
      needsReview: "需要复盘",
      emptyAnswer: "请先输入答案。",
      checking: "正在检查答案。如果答错，会进入 AI 讲解队列。",
      submissionFailed: "提交失败",
      question: "题目",
      answerPlaceholder: "输入你的答案",
      submit: "提交并查看结果",
      solved: "这道题做对了",
      review: "查看正确答案和讲解",
      correctAnswer: "正确答案",
      explanationSource: "讲解来源",
      modelSource: "OpenRouter 模型",
      fallbackSource: "本地兜底讲解",
      back: "返回题目",
    };
  }

  return {
    pendingReview: "Pending Review",
    correctAnswerLabel: "Correct Answer",
    needsReview: "Needs Review",
    emptyAnswer: "Please enter an answer first.",
    checking: "Checking your answer. If it is incorrect, it will enter the AI explanation queue.",
    submissionFailed: "Submission failed",
    question: "Question",
    answerPlaceholder: "Enter your answer",
    submit: "Submit and View Result",
    solved: "You solved this one correctly",
    review: "Review the correct answer and explanation",
    correctAnswer: "Correct answer",
    explanationSource: "Explanation source",
    modelSource: "OpenRouter model",
    fallbackSource: "Local fallback",
    back: "Back to Question",
  };
});

const resultType = computed(() => {
  if (!result.value) {
    return "info";
  }

  return result.value.correct ? "success" : "error";
});

const resultLabel = computed(() => {
  if (!result.value) {
    return t.value.pendingReview;
  }

  return result.value.correct ? t.value.correctAnswerLabel : t.value.needsReview;
});

async function submit() {
  if (!answer.value.trim()) {
    feedback.value = t.value.emptyAnswer;
    return;
  }

  pending.value = true;
  feedback.value = t.value.checking;

  try {
    const submission = await props.submitAnswer(props.question.id, answer.value.trim());
    result.value = submission;
    feedback.value = "";
    flipped.value = true;
    emit("submitted", submission);
  } catch (error) {
    feedback.value = error.message || t.value.submissionFailed;
  } finally {
    pending.value = false;
  }
}

function resetCard() {
  flipped.value = false;
}
</script>

<template>
  <div class="flip-card" :class="{ 'flip-card--flipped': flipped }">
    <div class="flip-card__inner">
      <div class="flip-card__face">
        <n-card class="question-card" :bordered="false">
          <n-space vertical :size="20">
            <n-space justify="space-between" align="start">
              <div>
                <p class="section-kicker">{{ t.question }}</p>
                <h3 class="question-title">{{ question.title }}</h3>
              </div>

              <n-space wrap justify="end">
                <n-tag round type="info">{{ question.difficulty }}</n-tag>
                <n-tag round type="success">{{ question.concept }}</n-tag>
              </n-space>
            </n-space>

            <div class="question-body">
              {{ question.prompt }}
            </div>

            <n-space vertical :size="12">
              <n-input
                v-model:value="answer"
                :placeholder="t.answerPlaceholder"
                size="large"
                @keyup.enter="submit"
              />
              <n-button type="primary" size="large" :loading="pending" @click="submit">
                {{ t.submit }}
              </n-button>
              <n-text depth="3">{{ feedback }}</n-text>
            </n-space>
          </n-space>
        </n-card>
      </div>

      <div class="flip-card__face flip-card__face--back">
        <n-card class="question-card" :bordered="false">
          <n-space vertical :size="18">
            <n-tag round size="large" :type="resultType">
              {{ resultLabel }}
            </n-tag>
            <h3 class="question-title">
              {{ result?.correct ? t.solved : t.review }}
            </h3>
            <div class="answer-panel">{{ t.correctAnswer }}: {{ result?.correctAnswer }}</div>
            <div class="analysis-panel">{{ result?.analysis }}</div>
            <n-text depth="3">
              {{ t.explanationSource }}: {{ result?.source === "model" ? t.modelSource : t.fallbackSource }}
            </n-text>
            <n-button tertiary type="primary" @click="resetCard">{{ t.back }}</n-button>
          </n-space>
        </n-card>
      </div>
    </div>
  </div>
</template>
