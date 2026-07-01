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
});

const emit = defineEmits(["submitted"]);

const answer = ref("");
const feedback = ref("");
const pending = ref(false);
const flipped = ref(false);
const result = ref(null);

const resultType = computed(() => {
  if (!result.value) {
    return "info";
  }

  return result.value.correct ? "success" : "error";
});

const resultLabel = computed(() => {
  if (!result.value) {
    return "Pending Review";
  }

  return result.value.correct ? "Correct Answer" : "Needs Review";
});

async function submit() {
  if (!answer.value.trim()) {
    feedback.value = "Please enter an answer first.";
    return;
  }

  pending.value = true;
  feedback.value = "Checking your answer. If it is incorrect, it will enter the AI explanation queue.";

  try {
    const submission = await props.submitAnswer(props.question.id, answer.value.trim());
    result.value = submission;
    feedback.value = "";
    flipped.value = true;
    emit("submitted", submission);
  } catch (error) {
    feedback.value = error.message || "Submission failed";
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
                <p class="section-kicker">Question</p>
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
                placeholder="Enter your answer"
                size="large"
                @keyup.enter="submit"
              />
              <n-button type="primary" size="large" :loading="pending" @click="submit">
                Submit and View Result
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
              {{ result?.correct ? "You solved this one correctly" : "Review the correct answer and explanation" }}
            </h3>
            <div class="answer-panel">Correct answer: {{ result?.correctAnswer }}</div>
            <div class="analysis-panel">{{ result?.analysis }}</div>
            <n-text depth="3">
              Explanation source: {{ result?.source === "model" ? "OpenRouter model" : "Local fallback" }}
            </n-text>
            <n-button tertiary type="primary" @click="resetCard">Back to Question</n-button>
          </n-space>
        </n-card>
      </div>
    </div>
  </div>
</template>
