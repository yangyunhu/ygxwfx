<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">数据展示及导入导出</h2>
        <p class="page-desc">
          按组织机构层级展示出勤轨迹明细，支持 CSV 导入导出。
        </p>
      </div>
      <div class="head-actions">
        <el-tag
          v-if="aggregated && aggregated.aggregatedAt"
          size="small"
          type="info"
        >
          最近汇集：{{ formatAggregatedAt(aggregated.aggregatedAt) }}
        </el-tag>
      </div>
    </div>

    <div class="agg-pane-toolbar">
      <el-button size="small" icon="el-icon-upload2" @click="triggerImport"
        >导入</el-button
      >
      <el-button
        size="small"
        icon="el-icon-download"
        :disabled="!displayRows.length"
        @click="exportData"
        >导出</el-button
      >
      <span class="agg-pane-hint"
        >按组织机构层级展示出勤轨迹明细，支持 CSV 导入导出</span
      >
    </div>

    <div class="perm-layout agg-display-layout">
      <aside class="perm-sidebar">
        <div class="sidebar-head">组织机构</div>
        <div class="sidebar-search">
          <el-input
            v-model="orgKeyword"
            placeholder="机构名称"
            prefix-icon="el-icon-search"
            size="small"
            clearable
          />
        </div>
        <div class="sidebar-body">
          <el-tree
            ref="orgTree"
            :data="displayOrgTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            highlight-current
            default-expand-all
            :expand-on-click-node="false"
            @node-click="handleOrgClick"
          />
        </div>
      </aside>

      <main class="perm-main agg-display-main">
        <section class="config-card agg-pane-card agg-display-card">
          <div class="card-head agg-display-card__head">
            <div class="card-title card-title-inline">
              出勤轨迹明细
              <span v-if="selectedOrgName" class="org-tag">{{
                selectedOrgName
              }}</span>
            </div>
            <el-input
              v-model="personKeyword"
              placeholder="人员ID/姓名"
              prefix-icon="el-icon-search"
              size="small"
              clearable
              style="width: 180px"
            />
          </div>
          <div ref="displayTableWrap" class="agg-table-body">
            <el-table
              :data="pagedRows"
              border
              stripe
              size="small"
              style="width: 100%"
              :height="displayTableHeight"
              empty-text="暂无轨迹数据"
            >
              <el-table-column
                type="index"
                label="序号"
                width="55"
                :index="indexMethod"
              />
              <el-table-column prop="personId" label="人员ID" width="100" />
              <el-table-column prop="name" label="姓名" width="80" />
              <el-table-column
                prop="orgName"
                label="组织机构"
                min-width="180"
                show-overflow-tooltip
              />
              <el-table-column prop="recordDate" label="日期" width="110" />
              <el-table-column
                prop="arrivalTime"
                label="到岗"
                width="150"
                show-overflow-tooltip
              />
              <el-table-column
                prop="departureTime"
                label="离岗"
                width="150"
                show-overflow-tooltip
              />
              <el-table-column
                label="用餐/登录"
                min-width="140"
                show-overflow-tooltip
              >
                <template slot-scope="{ row }">{{
                  mealLoginSummary(row)
                }}</template>
              </el-table-column>
              <el-table-column
                prop="dataSources"
                label="数据来源"
                min-width="140"
                show-overflow-tooltip
              />
              <el-table-column prop="status" label="状态" width="120" />
              <el-table-column label="操作" width="80" align="center">
                <template slot-scope="{ row }">
                  <el-button
                    type="text"
                    size="small"
                    @click="openTrackDetail(row)"
                    >轨迹</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="pager agg-display-card__pager">
            <el-pagination
              background
              layout="total, prev, pager, next, sizes"
              :total="displayRows.length"
              :current-page.sync="page"
              :page-size.sync="pageSize"
              :page-sizes="[10, 20, 50]"
            />
          </div>
        </section>
      </main>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".csv"
      style="display: none"
      @change="handleImportFile"
    />

    <el-dialog
      title="出勤轨迹详情"
      :visible.sync="showDetail"
      width="640px"
      append-to-body
    >
      <el-descriptions v-if="detailRow" :column="2" border size="small">
        <el-descriptions-item label="人员ID">{{
          detailRow.personId
        }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{
          detailRow.name
        }}</el-descriptions-item>
        <el-descriptions-item label="组织机构" :span="2">{{
          detailRow.orgName
        }}</el-descriptions-item>
        <el-descriptions-item label="考勤日期">{{
          detailRow.recordDate
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{
          detailRow.status
        }}</el-descriptions-item>
        <el-descriptions-item label="到岗时间">{{
          detailRow.arrivalTime
        }}</el-descriptions-item>
        <el-descriptions-item label="离岗时间">{{
          detailRow.departureTime
        }}</el-descriptions-item>
        <el-descriptions-item label="早餐">{{
          detailRow.breakfastTime
        }}</el-descriptions-item>
        <el-descriptions-item label="午餐">{{
          detailRow.lunchTime
        }}</el-descriptions-item>
        <el-descriptions-item label="晚餐">{{
          detailRow.dinnerTime
        }}</el-descriptions-item>
        <el-descriptions-item label="登录">{{
          detailRow.loginTime
        }}</el-descriptions-item>
        <el-descriptions-item label="休假类型">{{
          detailRow.leaveType || "—"
        }}</el-descriptions-item>
        <el-descriptions-item label="休假开始">{{
          detailRow.leaveStartTime || "—"
        }}</el-descriptions-item>
        <el-descriptions-item label="休假结束">{{
          detailRow.leaveEndTime || "—"
        }}</el-descriptions-item>
        <el-descriptions-item label="出差开始">{{
          detailRow.businessTripStartTime || "—"
        }}</el-descriptions-item>
        <el-descriptions-item label="出差结束">{{
          detailRow.businessTripEndTime || "—"
        }}</el-descriptions-item>
        <el-descriptions-item label="外出开始">{{
          detailRow.travelStartTime || "—"
        }}</el-descriptions-item>
        <el-descriptions-item label="培训开始">{{
          detailRow.trainingStartTime || "—"
        }}</el-descriptions-item>
        <el-descriptions-item label="培训结束">{{
          detailRow.trainingEndTime || "—"
        }}</el-descriptions-item>
        <el-descriptions-item label="工作票">{{
          detailRow.workTicketRange || "—"
        }}</el-descriptions-item>
        <el-descriptions-item label="数据来源" :span="2">{{
          detailRow.dataSources
        }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
import { loadOrgTree } from "../utils/orgManagement";
import {
  loadAggregatedData,
  filterByOrg,
  filterOrgTreeForAggregation,
  exportTrajectoryCsv,
  parseImportedTrajectoryCsv,
  mergeImportedRows,
  paginateRows,
} from "../utils/multiSourceAggregation";

export default {
  name: "MultiSourceDisplay",
  data() {
    return {
      aggregated: null,
      orgTree: [],
      orgKeyword: "",
      selectedOrgId: 1,
      selectedOrgName: "全部",
      personKeyword: "",
      filterPersonId: "",
      page: 1,
      pageSize: 20,
      showDetail: false,
      detailRow: null,
      displayTableHeight: 360,
    };
  },
  computed: {
    stats() {
      return (this.aggregated && this.aggregated.stats) || {};
    },
    displayOrgTree() {
      return filterOrgTreeForAggregation(this.orgTree, this.orgKeyword);
    },
    displayRows() {
      if (!this.aggregated) return [];
      let rows = filterByOrg(this.aggregated.rows, this.selectedOrgId);
      if (this.filterPersonId) {
        rows = rows.filter((r) => r.personId === this.filterPersonId);
      }
      const kw = this.personKeyword.trim().toLowerCase();
      if (kw) {
        rows = rows.filter(
          (r) =>
            r.personId.toLowerCase().includes(kw) ||
            (r.name && r.name.toLowerCase().includes(kw)),
        );
      }
      return rows;
    },
    pagedRows() {
      return paginateRows(this.displayRows, this.page, this.pageSize).list;
    },
  },
  watch: {
    "$route.query": {
      immediate: true,
      handler(query) {
        this.filterPersonId = query.personId || "";
        if (query.keyword) {
          this.personKeyword = query.keyword;
        }
        this.page = 1;
      },
    },
  },
  mounted() {
    this.orgTree = loadOrgTree();
    this.reload();
    this.$nextTick(() => this.updateDisplayTableHeight());
    window.addEventListener("resize", this.updateDisplayTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.updateDisplayTableHeight);
  },
  methods: {
    updateDisplayTableHeight() {
      const wrap = this.$refs.displayTableWrap;
      if (!wrap) return;
      const h = wrap.clientHeight;
      this.displayTableHeight = h > 120 ? h : 120;
    },
    reload() {
      this.aggregated = loadAggregatedData();
    },
    handleOrgClick(data) {
      this.selectedOrgId = data.id;
      this.selectedOrgName = data.id === 1 ? "全部" : data.name;
      this.filterPersonId = "";
      this.page = 1;
    },
    formatAggregatedAt(iso) {
      if (!iso) return "—";
      try {
        return iso.replace("T", " ").slice(0, 19);
      } catch (e) {
        return iso;
      }
    },
    mealLoginSummary(row) {
      const parts = [];
      if (row.lunchTime && row.lunchTime !== "—") parts.push("午餐");
      if (row.loginTime && row.loginTime !== "—") parts.push("登录");
      return parts.length ? parts.join("、") : "—";
    },
    openTrackDetail(row) {
      this.detailRow = row;
      this.showDetail = true;
    },
    indexMethod(index) {
      return (this.page - 1) * this.pageSize + index + 1;
    },
    exportData() {
      const criteria =
        this.selectedOrgName === "全部" ? "全部机构" : this.selectedOrgName;
      exportTrajectoryCsv(
        this.displayRows,
        `多源数据汇总_${Date.now()}.csv`,
        criteria,
      );
      this.$message.success("导出完成");
    },
    triggerImport() {
      this.$refs.fileInput.click();
    },
    handleImportFile(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = parseImportedTrajectoryCsv(ev.target.result);
          if (!imported.length) {
            this.$message.warning("未能解析导入数据");
            return;
          }
          this.aggregated = mergeImportedRows(imported);
          this.$message.success(`已导入 ${imported.length} 条并合并入汇总`);
        } catch (err) {
          this.$message.warning("导入失败");
        }
        e.target.value = "";
      };
      reader.readAsText(file, "UTF-8");
    },
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
<style scoped>
.head-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-items: center;
}
.agg-pane-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}
.agg-pane-hint {
  font-size: 12px;
  color: #909399;
}
.agg-pane-card {
  margin-bottom: 0;
}
.agg-display-layout {
  display: flex;
  align-items: stretch;
  height: calc(100vh - 280px);
  min-height: 420px;
  max-height: calc(100vh - 280px);
}
.agg-display-layout .perm-sidebar {
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.agg-display-layout .sidebar-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.agg-display-main {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  flex: 1;
}
.agg-display-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  margin-bottom: 0;
  overflow: hidden;
}
.agg-display-card__head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.agg-table-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.agg-display-card__pager {
  flex-shrink: 0;
  margin-top: 0;
  padding-top: 12px;
}
.card-title-inline {
  margin: 0;
  border: none;
  padding: 0;
}
.org-tag {
  margin-left: 8px;
  font-size: 12px;
  color: #409eff;
  font-weight: normal;
}
.pager {
  margin-top: 12px;
  text-align: right;
}
</style>
