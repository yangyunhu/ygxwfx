<template>
  <div class="attendance-ledger-page employee-ledger-page">
    <div class="page-layout">
      <aside class="org-sidebar">
        <div class="org-search">
          <el-input
            v-model="orgTreeKeyword"
            placeholder="关键字搜索"
            prefix-icon="el-icon-search"
            size="small"
            clearable
          />
        </div>
        <div class="org-tree-wrap">
          <el-tree
            :data="filteredOrgTree"
            :props="treeProps"
            default-expand-all
            highlight-current
            :expand-on-click-node="false"
            node-key="id"
            @node-click="handleOrgClick"
          >
            <span slot-scope="{ node, data }" class="tree-node">
              <i :class="data.icon || 'el-icon-folder'" />
              <span class="tree-label">{{ node.label }}</span>
            </span>
          </el-tree>
        </div>
      </aside>

      <main class="main-panel">
        <section class="query-panel">
          <div class="query-panel-head">
            <span class="query-title">查询条件</span>
            <div class="query-actions">
              <el-button type="primary" icon="el-icon-search" size="small" @click="handleSearch">
                查询
              </el-button>
              <el-button size="small" @click="handleReset">清空</el-button>
              <el-button type="text" size="small" @click="queryExpanded = !queryExpanded">
                {{ queryExpanded ? "收起" : "展开" }}
                <i :class="queryExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
              </el-button>
            </div>
          </div>

          <p class="panel-desc">
            记录员工出勤、请假、加班等情况，数据与无感考勤表一致，用于考勤管理与工资核算。
          </p>

          <div class="query-row">
            <span class="query-label">记录类型</span>
            <div class="tag-group">
              <span
                v-for="c in recordCategoryOptions"
                :key="c"
                class="filter-tag"
                :class="{ active: selectedCategories.includes(c) }"
                @click="toggleCategory(c)"
              >
                {{ c }}
              </span>
            </div>
          </div>

          <div v-show="queryExpanded" class="query-body">
            <div class="query-row">
              <span class="query-label">姓名</span>
              <el-input
                v-model="keyword"
                placeholder="搜索姓名、人员ID"
                size="small"
                class="query-input-wide"
                clearable
                @keyup.enter.native="handleSearch"
              />
            </div>

            <div class="query-row">
              <span class="query-label">考勤类型</span>
              <el-select
                v-model="attendanceTypeFilter"
                placeholder="全部"
                clearable
                size="small"
                style="width: 160px"
              >
                <el-option
                  v-for="t in attendanceTypeOptions"
                  :key="t"
                  :label="t"
                  :value="t"
                />
              </el-select>
            </div>

            <div class="query-row">
              <span class="query-label">考勤日期</span>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                size="small"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                style="width: 280px"
              />
            </div>
          </div>
        </section>

        <section class="toolbar">
          <el-button size="small" icon="el-icon-download" @click="exportList">
            导出
          </el-button>
          <span v-if="selectedRows.length" class="toolbar-tip">
            已选 {{ selectedRows.length }} 条（导出将优先使用已选数据）
          </span>
        </section>

        <section class="table-section">
          <div class="table-container table-hscroll-viewport">
            <el-table
              ref="dataTable"
              :data="pagedList"
              border
              stripe
              size="small"
              :fit="false"
              :style="{ width: tableScrollWidth + 'px' }"
              @selection-change="onSelectionChange"
              @cell-click="onCellClick"
            >
              <el-table-column type="selection" width="45" />
              <el-table-column type="index" label="序号" width="55" :index="indexMethod" />
              <el-table-column prop="recordCategory" label="记录类型" width="100" align="center" />
              <el-table-column prop="orgName" label="所属组织机构" width="200" show-overflow-tooltip />
              <el-table-column
                prop="name"
                label="姓名"
                width="100"
                class-name="col-person-name"
                column-key="personName"
                show-overflow-tooltip
              >
                <template slot-scope="{ row }">
                  <span class="person-name-text">{{ row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="personId" label="人员ID" width="110" show-overflow-tooltip />
              <el-table-column prop="recordDate" label="考勤日期" width="120" />
              <el-table-column prop="attendanceType" label="考勤类型" width="100" align="center" />
              <el-table-column prop="arrivalTime" label="到岗时间" width="170" show-overflow-tooltip />
              <el-table-column prop="departureTime" label="离岗时间" width="170" show-overflow-tooltip />
              <el-table-column prop="ruleLevel" label="规则层级" width="100" align="center" />
              <el-table-column prop="targetTable" label="输出表" width="120" show-overflow-tooltip />
              <el-table-column prop="dataSources" label="数据来源" width="160" show-overflow-tooltip />
              <el-table-column prop="remark" label="备注" width="180" show-overflow-tooltip />
            </el-table>
          </div>

          <div class="pagination-bar">
            <span class="total-text">共 {{ filteredList.length }} 条</span>
            <el-pagination
              background
              layout="sizes, prev, pager, next, jumper"
              :current-page.sync="currentPage"
              :page-size.sync="pageSize"
              :page-sizes="[10, 25, 50, 100]"
              :total="filteredList.length"
              @size-change="currentPage = 1"
              @current-change="onPageChange"
            />
          </div>
        </section>
      </main>
    </div>

    <flexible-attendance-dialog
      :visible.sync="showFlexibleAttendance"
      :sheet="flexibleAttendanceSheet"
      @export="exportFlexibleAttendance"
    />
  </div>
</template>

<script>
import { generateOrgTree, matchOrgFilter } from "../utils/orgTree";
import {
  buildAttendanceLedgerData,
  exportAttendanceLedgerCsv,
  RECORD_CATEGORY_OPTIONS,
  ATTENDANCE_TYPE_OPTIONS,
} from "../utils/attendanceLedger";
import { getGlobalWorkConfig } from "../utils/behaviorModeSettings";
import { buildFlexibleAttendanceSheet } from "../utils/flexibleAttendance";
import { generateGateRows, generateCanteenRows, generateOnlineRows } from "../utils/sensingRecords";
import FlexibleAttendanceDialog from "../components/FlexibleAttendanceDialog.vue";

export default {
  name: "StaffAttendanceLedger",
  components: { FlexibleAttendanceDialog },
  data() {
    return {
      list: [],
      personContexts: [],
      abnormalRows: [],
      orgTree: [],
      orgTreeKeyword: "",
      treeProps: { label: "name", children: "children" },
      selectedOrg: "",
      queryExpanded: true,
      keyword: "",
      selectedCategories: [],
      attendanceTypeFilter: "",
      dateRange: null,
      currentPage: 1,
      pageSize: 25,
      selectedRows: [],
      showFlexibleAttendance: false,
      flexibleAttendanceSheet: null,
      recordCategoryOptions: RECORD_CATEGORY_OPTIONS,
      attendanceTypeOptions: ATTENDANCE_TYPE_OPTIONS,
    };
  },
  computed: {
    filteredOrgTree() {
      const kw = (this.orgTreeKeyword || "").trim();
      if (!kw) return this.orgTree;
      const filter = (nodes) =>
        nodes
          .map((n) => {
            const children = n.children ? filter(n.children) : [];
            const match = (n.name || "").includes(kw);
            if (match || children.length) {
              return { ...n, children: children.length ? children : n.children };
            }
            return null;
          })
          .filter(Boolean);
      return filter(this.orgTree);
    },
    filteredList() {
      let data = this.list;
      if (this.selectedOrg) {
        data = data.filter((r) => matchOrgFilter(r.orgName, this.selectedOrg));
      }
      if (this.selectedCategories.length) {
        data = data.filter((r) => this.selectedCategories.includes(r.recordCategory));
      }
      if (this.attendanceTypeFilter) {
        data = data.filter((r) => r.attendanceType === this.attendanceTypeFilter);
      }
      if (this.dateRange && this.dateRange.length === 2) {
        const [from, to] = this.dateRange;
        data = data.filter((r) => r.recordDate >= from && r.recordDate <= to);
      }
      const kw = (this.keyword || "").trim();
      if (kw) {
        data = data.filter(
          (r) => (r.name || "").includes(kw) || String(r.personId || "").includes(kw)
        );
      }
      return data;
    },
    pagedList() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredList.slice(start, start + this.pageSize);
    },
    tableScrollWidth() {
      return (
        45 +
        55 +
        100 +
        200 +
        100 +
        110 +
        120 +
        100 +
        170 +
        170 +
        100 +
        120 +
        160 +
        180
      );
    },
  },
  mounted() {
    this.orgTree = generateOrgTree();
    this.loadData();
  },
  methods: {
    getWorkConfig() {
      return { ...getGlobalWorkConfig() };
    },
    loadData() {
      const { rows, personContexts, abnormalRows } = buildAttendanceLedgerData(this.getWorkConfig());
      this.list = rows;
      this.personContexts = personContexts;
      this.abnormalRows = abnormalRows;
    },
    handleOrgClick(data) {
      this.selectedOrg = data.id === 1 ? "" : data.name;
      this.currentPage = 1;
    },
    toggleCategory(c) {
      const idx = this.selectedCategories.indexOf(c);
      if (idx >= 0) {
        this.selectedCategories.splice(idx, 1);
      } else {
        this.selectedCategories.push(c);
      }
    },
    handleSearch() {
      this.currentPage = 1;
    },
    handleReset() {
      this.keyword = "";
      this.selectedCategories = [];
      this.attendanceTypeFilter = "";
      this.dateRange = null;
      this.selectedOrg = "";
      this.currentPage = 1;
    },
    indexMethod(index) {
      return (this.currentPage - 1) * this.pageSize + index + 1;
    },
    onSelectionChange(rows) {
      this.selectedRows = rows;
    },
    onPageChange() {
      this.$nextTick(() => {
        const table = this.$refs.dataTable;
        if (table && table.doLayout) table.doLayout();
      });
    },
    onCellClick(row, column) {
      if (!row) return;
      if (column && (column.columnKey === "personName" || column.label === "姓名")) {
        this.openFlexibleAttendance(row);
      }
    },
    openFlexibleAttendance(row) {
      if (!row || !row.personId) {
        this.$message.warning("缺少人员ID，无法查看柔性化考勤表");
        return;
      }
      try {
        const period = row.recordDate ? row.recordDate.slice(0, 7) : undefined;
        const absentDates = (this.abnormalRows || [])
          .filter(
            (r) =>
              r.personId === row.personId &&
              r.abnormalType === "旷工" &&
              r.recordDate &&
              (!period || r.recordDate.startsWith(period))
          )
          .map((r) => r.recordDate);

        this.flexibleAttendanceSheet = buildFlexibleAttendanceSheet({
          personId: row.personId,
          contexts: this.personContexts,
          attendanceRows: this.list.filter((r) => r.recordCategory !== "加班情况" || r.attendanceType !== "加班"),
          config: this.getWorkConfig(),
          yearMonth: period,
          absentDates,
          abnormalRows: this.abnormalRows,
          gateRows: generateGateRows(),
          canteenRows: generateCanteenRows(),
          onlineRows: generateOnlineRows(),
        });
        this.$nextTick(() => {
          this.showFlexibleAttendance = true;
        });
      } catch (err) {
        console.error(err);
        this.$message.error("打开柔性化考勤表失败，请刷新页面后重试");
      }
    },
    exportFlexibleAttendance(sheet) {
      if (!sheet) return;
      const dayHeaders = sheet.days.flatMap((d) => [`${d.day}日上午`, `${d.day}日下午`]);
      const dayValues = sheet.days.flatMap((d) => [d.am.text, d.pm.text]);
      const headers = ["姓名", "员工编码", "考勤月份", ...dayHeaders];
      const row = [sheet.name, sheet.personId, sheet.yearMonth, ...dayValues];
      const csv = [headers, row]
        .map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `柔性化考勤表_${sheet.name}_${sheet.yearMonth}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.$message.success("导出成功");
    },
    getExportRows() {
      return this.selectedRows.length ? this.selectedRows : this.filteredList;
    },
    exportList() {
      const rows = this.getExportRows();
      if (!rows.length) {
        this.$message.warning("没有可导出的数据");
        return;
      }
      exportAttendanceLedgerCsv(rows, `考勤管理台账_${Date.now()}.csv`);
      this.$message.success(`导出成功，共 ${rows.length} 条`);
    },
  },
};
</script>

<style scoped>
.attendance-ledger-page {
  min-height: calc(100vh - 60px);
  padding: 12px 16px;
  background: #f0f2f5;
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;
}

.page-layout {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-height: 0;
}

.org-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.org-search {
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
}

.org-tree-wrap {
  flex: 1;
  overflow: auto;
  padding: 8px 4px;
}

.tree-node {
  display: flex;
  align-items: center;
  font-size: 13px;
  overflow: hidden;
}

.tree-node i {
  margin-right: 6px;
  color: #909399;
}

.tree-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.main-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.query-panel {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.query-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.query-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.panel-desc {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.query-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.query-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  font-size: 13px;
}

.query-row:last-child {
  margin-bottom: 0;
}

.query-label {
  width: 72px;
  flex-shrink: 0;
  color: #606266;
  line-height: 28px;
}

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.filter-tag {
  padding: 4px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
  cursor: pointer;
  color: #606266;
  background: #fff;
  font-size: 12px;
  line-height: 1.4;
  user-select: none;
}

.filter-tag:hover {
  border-color: #409eff;
  color: #409eff;
}

.filter-tag.active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

.query-input-wide {
  max-width: 420px;
}

.query-body {
  border-top: 1px dashed #ebeef5;
  padding-top: 12px;
}

.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.toolbar-tip {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.table-section {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.table-container {
  width: 100%;
}

.table-hscroll-viewport {
  overflow-x: auto;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;
}

.total-text {
  font-size: 13px;
  color: #606266;
}

.attendance-ledger-page .el-table td.col-person-name .cell,
.attendance-ledger-page .el-table td.col-person-name .person-name-text {
  color: #409eff !important;
  font-weight: 500;
  cursor: pointer;
}

.attendance-ledger-page .el-table td.col-person-name:hover .person-name-text {
  color: #66b1ff !important;
  text-decoration: underline;
}
</style>
