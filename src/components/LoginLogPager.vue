<template>
  <div class="login-log-pager">
    <div class="pager-left">
      <span>共 <strong>{{ total }}</strong> 条记录</span>
      <span class="pager-size-label">每页显示</span>
      <el-radio-group v-model="sizeProxy" size="mini" @change="handleSizeChange">
        <el-radio-button v-for="n in pageSizes" :key="n" :label="n">{{ n }}</el-radio-button>
      </el-radio-group>
    </div>
    <div class="pager-right">
      <el-button size="mini" icon="el-icon-arrow-left" :disabled="pageProxy <= 1" @click="goPage(pageProxy - 1)" />
      <span class="page-indicator">{{ pageProxy }} / {{ totalPages }}</span>
      <el-button size="mini" icon="el-icon-arrow-right" :disabled="pageProxy >= totalPages" @click="goPage(pageProxy + 1)" />
      <span class="go-label">GO</span>
      <el-input
        v-model="jumpPage"
        size="mini"
        class="go-input"
        @keyup.enter.native="handleJump"
      />
      <el-button size="mini" type="primary" plain @click="handleJump">跳转</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: "LoginLogPager",
  props: {
    total: { type: Number, default: 0 },
    page: { type: Number, default: 1 },
    pageSize: { type: Number, default: 20 },
    pageSizes: { type: Array, default: () => [10, 20, 30] },
  },
  data() {
    return {
      jumpPage: "",
    };
  },
  computed: {
    pageProxy: {
      get() {
        return this.page;
      },
      set(val) {
        this.$emit("update:page", val);
      },
    },
    sizeProxy: {
      get() {
        return this.pageSize;
      },
      set(val) {
        this.$emit("update:pageSize", val);
      },
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.total / this.pageSize));
    },
  },
  watch: {
    page() {
      this.jumpPage = String(this.page);
    },
  },
  mounted() {
    this.jumpPage = String(this.page);
  },
  methods: {
    goPage(p) {
      const next = Math.min(Math.max(1, p), this.totalPages);
      this.pageProxy = next;
      this.jumpPage = String(next);
    },
    handleSizeChange() {
      this.pageProxy = 1;
      this.jumpPage = "1";
      this.$emit("size-change");
    },
    handleJump() {
      const n = parseInt(this.jumpPage, 10);
      if (Number.isNaN(n)) return;
      this.goPage(n);
    },
  },
};
</script>

<style scoped>
.login-log-pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  font-size: 13px;
  color: #606266;
}

.pager-left,
.pager-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pager-left strong {
  color: #409eff;
}

.pager-size-label {
  margin-left: 8px;
  color: #909399;
}

.page-indicator {
  min-width: 56px;
  text-align: center;
}

.go-label {
  margin-left: 4px;
  font-weight: 600;
  color: #909399;
}

.go-input {
  width: 52px;
}

.go-input >>> .el-input__inner {
  text-align: center;
  padding: 0 4px;
}
</style>
