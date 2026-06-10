<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">导出记录查询</h2>
        <p class="page-desc">按时间段、业务模块、文件格式、操作人等条件查询系统导出记录。</p>
      </div>
      <div class="head-actions">
        <span class="export-format-label">导出格式</span>
        <el-select v-model="exportFormat" size="small" style="width: 100px">
          <el-option label="CSV" value="csv" />
          <el-option label="Excel" value="excel" />
          <el-option label="TXT" value="txt" />
        </el-select>
        <el-button size="small" icon="el-icon-download" :disabled="!resultList.length" @click="exportResult">
          导出查询结果
        </el-button>
      </div>
    </div>

    <export-retention-alert />

    <section class="config-card">
      <el-form :inline="true" size="small" class="query-form">
        <el-form-item label="时间段">
          <el-date-picker
            v-model="query.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="yyyy-MM-dd"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="业务模块">
          <el-select v-model="query.moduleCode" clearable placeholder="全部" style="width: 180px">
            <el-option v-for="m in modules" :key="m.code" :label="m.name" :value="m.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件格式">
          <el-select v-model="query.fileFormat" clearable placeholder="全部" style="width: 100px">
            <el-option v-for="f in formatOptions" :key="f.value" :label="f.label" :value="f.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="query.operator" placeholder="操作人" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="文件名/模块" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
          <el-button icon="el-icon-refresh-left" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <div class="stats-row">
      <span>查询结果 <strong>{{ resultList.length }}</strong> 条</span>
    </div>

    <section class="config-card">
      <el-table :data="pagedList" border size="small" empty-text="请设置条件后点击查询">
        <el-table-column type="index" label="序号" width="55" :index="indexMethod" />
        <el-table-column prop="exportTime" label="导出时间" width="160" />
        <el-table-column prop="moduleGroup" label="模块分组" width="120" show-overflow-tooltip />
        <el-table-column prop="moduleName" label="业务模块" min-width="150" show-overflow-tooltip />
        <el-table-column prop="operator" label="操作人" width="90" />
      </el-table>
      <div class="pager">
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :total="resultList.length"
          :current-page.sync="page"
          :page-size.sync="pageSize"
          :page-sizes="[10, 20, 50, 100]"
        />
      </div>
    </section>

    <el-dialog title="导出记录详情" :visible.sync="showDetail" width="560px" append-to-body>
      <el-descriptions v-if="detailRow" :column="2" border size="small">
        <el-descriptions-item label="导出时间">{{ detailRow.exportTime }}</el-descriptions-item>
        <el-descriptions-item label="模块分组">{{ detailRow.moduleGroup }}</el-descriptions-item>
        <el-descriptions-item label="业务模块">{{ detailRow.moduleName }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detailRow.operator }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
import ExportRetentionAlert from "../components/ExportRetentionAlert.vue";
import {
  EXPORT_MODULE_REGISTRY,
  FILE_FORMAT_OPTIONS,
  loadExportRecords,
  filterExportRecords,
  paginateExportRecords,
} from "../utils/exportRecordManagement";
import { downloadTableWithLog } from "../utils/exportLogger";

export default {
  name: "ExportRecordQuery",
  components: { ExportRetentionAlert },
  data() {
    return {
      allRecords: [],
      resultList: [],
      modules: EXPORT_MODULE_REGISTRY,
      formatOptions: FILE_FORMAT_OPTIONS,
      query: {
        dateRange: null,
        moduleCode: "",
        fileFormat: "",
        operator: "",
        keyword: "",
      },
      page: 1,
      pageSize: 20,
      exportFormat: "excel",
      showDetail: false,
      detailRow: null,
    };
  },
  computed: {
    pagedList() {
      return paginateExportRecords(this.resultList, this.page, this.pageSize).list;
    },
  },
  mounted() {
    this.allRecords = loadExportRecords();
    this.resultList = [...this.allRecords];
  },
  methods: {
    handleSearch() {
      this.resultList = filterExportRecords(this.allRecords, this.query);
      this.page = 1;
      if (!this.resultList.length) this.$message.info("未查询到符合条件的导出记录");
    },
    handleReset() {
      this.query = { dateRange: null, moduleCode: "", fileFormat: "", operator: "", keyword: "" };
      this.resultList = [...this.allRecords];
      this.page = 1;
    },
    indexMethod(index) {
      return (this.page - 1) * this.pageSize + index + 1;
    },
    openDetail(row) {
      this.detailRow = row;
      this.showDetail = true;
    },
    exportResult() {
      const headers = ["导出时间", "模块分组", "业务模块", "操作人"];
      const rows = this.resultList.map((r) => [r.exportTime, r.moduleGroup, r.moduleName, r.operator]);
      downloadTableWithLog({
        headers,
        rows,
        format: this.exportFormat,
        baseFilename: "导出记录查询结果",
        meta: {
          moduleCode: "export-record-query",
          moduleName: "导出记录查询",
          moduleGroup: "日志管理",
          searchCriteria: "导出记录筛选结果",
        },
      });
      const formatLabels = { csv: "CSV", excel: "Excel", txt: "TXT" };
      this.$message.success(`已导出 ${this.resultList.length} 条记录（${formatLabels[this.exportFormat] || "Excel"}）`);
    },
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
<style scoped>
.query-form { margin-bottom: 0; }
.pager { margin-top: 12px; text-align: right; }
.export-format-label {
  font-size: 13px;
  color: #606266;
  margin-right: 4px;
}
</style>
