<script setup>
import { computed } from "vue";
import { NCard, NSpace, NTag, NThing } from "naive-ui";

const props = defineProps({
  status: {
    type: Object,
    required: true,
  },
  lang: {
    type: String,
    default: "en",
  },
});

const t = computed(() => {
  if (props.lang === "zh") {
    return {
      title: "OpenRouter 监控",
      ready: "模型就绪",
      busy: "模型繁忙",
      unavailable: "模型不可用",
      concurrency: "并发",
      queue: "队列",
      model: "模型",
      found: "可用",
      modelUnavailable: "不可用",
      key: "密钥",
      configured: "已配置",
      missing: "缺失",
      platformStatus: "平台状态",
      lastChecked: "上次检查",
    };
  }

  return {
    title: "OpenRouter Monitor",
    ready: "Model Ready",
    busy: "Model Busy",
    unavailable: "Model Unavailable",
    concurrency: "Concurrency",
    queue: "Queue",
    model: "Model",
    found: "found",
    modelUnavailable: "unavailable",
    key: "Key",
    configured: "configured",
    missing: "missing",
    platformStatus: "Platform status",
    lastChecked: "Last checked",
  };
});

const statusType = computed(() => {
  if (props.status.state === "ready") return "success";
  if (props.status.state === "busy") return "warning";
  return "error";
});

const statusLabel = computed(() => {
  if (props.status.state === "ready") return t.value.ready;
  if (props.status.state === "busy") return t.value.busy;
  return t.value.unavailable;
});
</script>

<template>
  <n-card class="status-card" :bordered="false">
    <n-space vertical :size="12">
      <n-space align="center" justify="space-between">
        <n-thing>
          <template #header>{{ t.title }}</template>
          <template #description>{{ status.model }}</template>
        </n-thing>
        <n-tag round :type="statusType" size="large">
          {{ statusLabel }}
        </n-tag>
      </n-space>

      <n-space wrap>
        <n-tag round type="info">{{ t.concurrency }} {{ status.activeRequests }}/{{ status.maxConcurrency }}</n-tag>
        <n-tag round :type="status.queuedRequests > 0 ? 'warning' : 'success'">
          {{ t.queue }} {{ status.queuedRequests }}
        </n-tag>
        <n-tag round :type="status.modelAvailable ? 'success' : 'error'">
          {{ t.model }} {{ status.modelAvailable ? t.found : t.modelUnavailable }}
        </n-tag>
        <n-tag round :type="status.configured ? 'success' : 'error'">
          {{ t.key }} {{ status.configured ? t.configured : t.missing }}
        </n-tag>
      </n-space>

      <div class="status-meta">
        {{ t.platformStatus }}: {{ status.platformSummary }}<br />
        {{ t.lastChecked }}: {{ new Date(status.checkedAt || Date.now()).toLocaleString() }}
      </div>
    </n-space>
  </n-card>
</template>
