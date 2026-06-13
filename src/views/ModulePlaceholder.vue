<template>
  <div class="module-placeholder-page">
    <div class="placeholder-card">
      <h2>{{ pageTitle }}</h2>
      <p>{{ pageDesc }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: "ModulePlaceholder",
  computed: {
    pageTitle() {
      return this.$route.meta?.title || this.$route.name || "模块页面";
    },
    pageDesc() {
      return this.$route.meta?.description || "页面建设中，后续将承载对应业务功能。";
    },
  },
};
</script>

<style scoped>
.module-placeholder-page {
  min-height: 100%;
  padding: 20px;
  background: #f5f7fa;
}

.placeholder-card {
  min-height: 240px;
  padding: 24px 28px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.placeholder-card h2 {
  margin: 0 0 10px;
  font-size: 22px;
  color: #303133;
}

.placeholder-card p {
  margin: 0;
  font-size: 14px;
  color: #909399;
  line-height: 1.8;
}
</style>
