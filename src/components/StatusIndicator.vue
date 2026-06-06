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
  if (props.status.state === "ready") return "模型就绪";
  if (props.status.state === "busy") return "模型繁忙";
  return "模型不可用";
});
</script>

<template>
  <n-card class="status-card" :bordered="false">
    <n-space vertical :size="12">
      <n-space align="center" justify="space-between">
        <n-thing>
          <template #header>OpenRouter 监控</template>
          <template #description>{{ status.model }}</template>
        </n-thing>
        <n-tag round :type="statusType" size="large">
          {{ statusLabel }}
        </n-tag>
      </n-space>

      <n-space wrap>
        <n-tag round type="info">并发 {{ status.activeRequests }}/{{ status.maxConcurrency }}</n-tag>
        <n-tag round :type="status.queuedRequests > 0 ? 'warning' : 'success'">
          排队 {{ status.queuedRequests }}
        </n-tag>
        <n-tag round :type="status.modelAvailable ? 'success' : 'error'">
          模型{{ status.modelAvailable ? "已找到" : "不可用" }}
        </n-tag>
        <n-tag round :type="status.configured ? 'success' : 'error'">
          Key {{ status.configured ? "已配置" : "未配置" }}
        </n-tag>
      </n-space>

      <div class="status-meta">
        平台状态：{{ status.platformSummary }}<br />
        最近检查：{{ new Date(status.checkedAt || Date.now()).toLocaleString() }}
      </div>
    </n-space>
  </n-card>
</template>
