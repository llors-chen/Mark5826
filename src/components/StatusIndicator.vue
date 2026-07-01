<script setup>
import { computed } from "vue";
import { NCard, NSpace, NTag, NThing } from "naive-ui";

const props = defineProps({
  status: {
    type: Object,
    required: true,
  },
});

const statusType = computed(() => {
  if (props.status.state === "ready") return "success";
  if (props.status.state === "busy") return "warning";
  return "error";
});

const statusLabel = computed(() => {
  if (props.status.state === "ready") return "Model Ready";
  if (props.status.state === "busy") return "Model Busy";
  return "Model Unavailable";
});
</script>

<template>
  <n-card class="status-card" :bordered="false">
    <n-space vertical :size="12">
      <n-space align="center" justify="space-between">
        <n-thing>
          <template #header>OpenRouter Monitor</template>
          <template #description>{{ status.model }}</template>
        </n-thing>
        <n-tag round :type="statusType" size="large">
          {{ statusLabel }}
        </n-tag>
      </n-space>

      <n-space wrap>
        <n-tag round type="info">Concurrency {{ status.activeRequests }}/{{ status.maxConcurrency }}</n-tag>
        <n-tag round :type="status.queuedRequests > 0 ? 'warning' : 'success'">
          Queue {{ status.queuedRequests }}
        </n-tag>
        <n-tag round :type="status.modelAvailable ? 'success' : 'error'">
          Model {{ status.modelAvailable ? "found" : "unavailable" }}
        </n-tag>
        <n-tag round :type="status.configured ? 'success' : 'error'">
          Key {{ status.configured ? "configured" : "missing" }}
        </n-tag>
      </n-space>

      <div class="status-meta">
        Platform status: {{ status.platformSummary }}<br />
        Last checked: {{ new Date(status.checkedAt || Date.now()).toLocaleString() }}
      </div>
    </n-space>
  </n-card>
</template>
