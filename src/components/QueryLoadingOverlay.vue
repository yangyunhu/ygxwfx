<template>
  <transition name="query-loading-fade">
    <div v-show="visible" class="query-loading-mask" role="alertdialog" aria-busy="true" aria-live="polite">
      <div class="query-loading-dialog">
        <div class="query-loading-spinner" aria-hidden="true">
          <span class="query-loading-ring"></span>
          <span class="query-loading-ring query-loading-ring--delay"></span>
        </div>
        <p class="query-loading-title">{{ text }}</p>
        <p class="query-loading-tip">请稍候，正在为您筛选数据</p>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: "QueryLoadingOverlay",
  data() {
    return {
      visible: false,
      text: "正在查询...",
    };
  },
};
</script>

<style scoped>
.query-loading-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 35, 65, 0.42);
  backdrop-filter: blur(2px);
}

.query-loading-dialog {
  min-width: 280px;
  padding: 28px 36px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 40, 90, 0.18);
  text-align: center;
}

.query-loading-spinner {
  position: relative;
  width: 52px;
  height: 52px;
  margin: 0 auto 16px;
}

.query-loading-ring {
  position: absolute;
  inset: 0;
  border: 3px solid #e8f3ff;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: query-loading-spin 0.9s linear infinite;
}

.query-loading-ring--delay {
  inset: 7px;
  border-width: 2px;
  border-top-color: #79bbff;
  animation-duration: 1.2s;
  animation-direction: reverse;
}

.query-loading-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 0.5px;
}

.query-loading-tip {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

@keyframes query-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

.query-loading-fade-enter-active,
.query-loading-fade-leave-active {
  transition: opacity 0.22s ease;
}

.query-loading-fade-enter-active .query-loading-dialog,
.query-loading-fade-leave-active .query-loading-dialog {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.query-loading-fade-enter,
.query-loading-fade-leave-to {
  opacity: 0;
}

.query-loading-fade-enter .query-loading-dialog,
.query-loading-fade-leave-to .query-loading-dialog {
  transform: scale(0.92);
  opacity: 0;
}
</style>
