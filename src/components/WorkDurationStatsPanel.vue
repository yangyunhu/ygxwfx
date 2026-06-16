<template>
  <div class="work-duration-panel">
    <div class="panel-layout">
      <aside class="org-sidebar">
        <div class="org-search">
          <el-input
            v-model="orgTreeKeyword"
            placeholder="请输入"
            prefix-icon="el-icon-search"
            size="small"
            clearable
          />
        </div>
        <div class="org-tree-toolbar">
          <span class="org-tree-toolbar__tip">
            已选 <strong>{{ checkedOrgCount }}</strong> 个组织
          </span>
          <el-button
            v-if="checkedOrgKeys.length"
            type="text"
            size="mini"
            @click="clearOrgSelection"
          >
            清空
          </el-button>
        </div>
        <div class="org-tree-wrap">
          <el-tree
            ref="orgTree"
            :data="filteredOrgTree"
            :props="treeProps"
            show-checkbox
            check-on-click-node
            node-key="id"
            default-expand-all
            :expand-on-click-node="false"
            @check="handleTreeCheck"
          >
            <span slot-scope="{ node, data }" class="tree-node">
              <i :class="data.icon || 'el-icon-folder'" />
              <span class="tree-label">{{ node.label }}</span>
            </span>
          </el-tree>
        </div>
      </aside>

      <div class="right-panel">
        <div class="query-bar">
          <el-form :inline="true" size="small">
            <el-form-item label="时间范围：">
              <el-date-picker
                v-model="queryParams.startDate"
                type="date"
                placeholder="开始日期"
                value-format="yyyy-MM-dd"
                style="width: 150px"
              />
              <span class="date-sep">-</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                placeholder="结束日期"
                value-format="yyyy-MM-dd"
                style="width: 150px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
              <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="action-bar">
          <el-button type="primary" plain icon="el-icon-upload2" @click="handleExport">导出</el-button>
        </div>

        <div class="table-wrapper">
          <el-table
            :data="pagedTableData"
            border
            stripe
            style="width: 100%"
            :height="tableHeight"
            header-cell-class-name="table-header-cell"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="48" align="center" />
            <el-table-column type="index" label="序号" width="60" align="center" :index="indexMethod" />
            <el-table-column prop="unit" label="单位" min-width="120" show-overflow-tooltip />
            <el-table-column prop="department" label="部门" min-width="160" show-overflow-tooltip />
            <el-table-column prop="team" label="班组" min-width="120" show-overflow-tooltip />
            <el-table-column prop="onDutyCount" label="在职人数(在岗)" width="130" align="center" />
            <el-table-column label="出勤工时(h)" width="110" align="center">
              <template slot-scope="scope">
                <span :class="hoursClass(scope.row)">{{ formatNumber(scope.row.attendanceHours) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="出勤总工时(h)" width="130" align="center">
              <template slot-scope="scope">
                <span :class="hoursClass(scope.row)">{{ formatNumber(scope.row.totalHours) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="饱和工时(h)" width="120" align="center">
              <template slot-scope="scope">
                <span :class="saturationClass(scope.row)">{{ formatNumber(scope.row.saturationHours) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="平均工时(h)" width="110" align="center">
              <template slot-scope="scope">
                <span :class="hoursClass(scope.row)">{{ formatNumber(scope.row.averageHours) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="standardTotalHours" label="标准总工时(h)" width="130" align="center">
              <template slot-scope="scope">
                {{ formatNumber(scope.row.standardTotalHours) }}
              </template>
            </el-table-column>
            <el-table-column label="明细信息" width="100" align="center" fixed="right">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="handleViewDetail(scope.row)">查看明细</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pagination-wrapper">
          <el-pagination
            :current-page="currentPage"
            :page-sizes="[10, 20, 50]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredTableData.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>

    <el-dialog
      :visible.sync="detailDialogVisible"
      width="78%"
      top="6vh"
      @close="handleDetailDialogClose"
    >
      <span slot="title" class="detail-dialog-title">
        <span class="detail-dialog-title__text">{{ detailDialogTitle }}</span>
        <el-button
          type="primary"
          plain
          size="small"
          icon="el-icon-download"
          @click="handleDetailExport"
        >
          导出
        </el-button>
      </span>
      <div class="detail-summary">
        <span>单位：{{ detailRow.unit }}</span>
        <span>部门：{{ detailRow.department }}</span>
        <span>班组：{{ detailRow.team }}</span>
        <span>统计区间：{{ queryParams.startDate }} 至 {{ queryParams.endDate }}</span>
      </div>
      <el-table :data="detailTableData" border stripe size="small" max-height="420">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="employeeNo" label="员工编号" width="110" align="center" />
        <el-table-column prop="employeeName" label="姓名" width="100" align="center" />
        <el-table-column prop="date" label="日期" width="120" align="center" />
        <el-table-column prop="attendanceHours" label="出勤工时(h)" width="120" align="center">
          <template slot-scope="scope">
            <span :class="scope.row.attendanceHours >= 8 ? 'hours-ok' : 'hours-low'">
              {{ formatNumber(scope.row.attendanceHours) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="standardHours" label="标准工时(h)" width="120" align="center" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag
              :type="scope.row.status === '正常' ? 'success' : scope.row.status === '略低' ? 'warning' : 'danger'"
              size="mini"
            >
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import {
  defaultDateRange,
  filterWorkDurationRows,
  findOrgNodeById,
  generateWorkDurationDetails,
  generateWorkDurationRows,
  getWorkDurationOrgTree,
} from "../utils/workDurationData";
import { downloadTableWithLog } from "../utils/exportLogger";

export default {
  name: "WorkDurationStatsPanel",
  data() {
    const { startDate, endDate } = defaultDateRange();
    return {
      orgTree: getWorkDurationOrgTree(),
      orgTreeKeyword: "",
      treeProps: { label: "name", children: "children" },
      checkedOrgKeys: [],
      queryParams: { startDate, endDate },
      allRows: [],
      selectedRows: [],
      currentPage: 1,
      pageSize: 10,
      detailDialogVisible: false,
      detailRow: {},
      detailTableData: [],
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
    filteredTableData() {
      return filterWorkDurationRows(this.allRows, {
        checkedOrgKeys: this.checkedOrgKeys,
        orgTree: this.orgTree,
      });
    },
    checkedOrgCount() {
      if (!this.checkedOrgKeys.length) return 0;
      if (this.checkedOrgKeys.includes(1)) return 1;
      return this.checkedOrgKeys.length;
    },
    checkedOrgLabel() {
      if (!this.checkedOrgKeys.length) return "全部";
      if (this.checkedOrgKeys.includes(1)) return "云南电网有限责任公司";
      return this.checkedOrgKeys
        .map((id) => {
          const node = findOrgNodeById(this.orgTree, id);
          return node ? node.name : id;
        })
        .join("、");
    },
    pagedTableData() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredTableData.slice(start, start + this.pageSize);
    },
    detailDialogTitle() {
      if (!this.detailRow.team) return "出勤明细";
      return `${this.detailRow.unit} - ${this.detailRow.team} 出勤明细`;
    },
    tableHeight() {
      return "calc(100vh - 340px)";
    },
  },
  created() {
    this.refreshData();
  },
  methods: {
    refreshData() {
      this.allRows = generateWorkDurationRows({
        startDate: this.queryParams.startDate,
        endDate: this.queryParams.endDate,
      });
    },
    formatNumber(val) {
      if (val == null || val === "") return "-";
      return Number(val).toFixed(2);
    },
    hoursClass(row) {
      return row.meetsStandard ? "hours-ok" : "hours-low";
    },
    saturationClass(row) {
      return row.exceedsSaturation ? "hours-warn" : "hours-sat";
    },
    indexMethod(index) {
      return (this.currentPage - 1) * this.pageSize + index + 1;
    },
    syncCheckedOrgKeys() {
      this.checkedOrgKeys = this.$refs.orgTree ? this.$refs.orgTree.getCheckedKeys() : [];
      this.currentPage = 1;
    },
    handleTreeCheck() {
      this.$nextTick(() => this.syncCheckedOrgKeys());
    },
    clearOrgSelection() {
      this.checkedOrgKeys = [];
      this.$nextTick(() => {
        if (this.$refs.orgTree) {
          this.$refs.orgTree.setCheckedKeys([]);
        }
      });
      this.currentPage = 1;
    },
    handleQuery() {
      this.syncCheckedOrgKeys();
      this.refreshData();
      this.currentPage = 1;
    },
    handleReset() {
      const { startDate, endDate } = defaultDateRange();
      this.queryParams = { startDate, endDate };
      this.checkedOrgKeys = [];
      this.orgTreeKeyword = "";
      this.currentPage = 1;
      this.$nextTick(() => {
        if (this.$refs.orgTree) {
          this.$refs.orgTree.setCheckedKeys([]);
        }
      });
      this.refreshData();
    },
    handleSelectionChange(selection) {
      this.selectedRows = selection;
    },
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
    },
    handleCurrentChange(val) {
      this.currentPage = val;
    },
    handleViewDetail(row) {
      this.detailRow = { ...row };
      this.detailTableData = generateWorkDurationDetails(row, {
        startDate: this.queryParams.startDate,
        endDate: this.queryParams.endDate,
      });
      this.detailDialogVisible = true;
    },
    handleDetailDialogClose() {
      this.detailRow = {};
      this.detailTableData = [];
    },
    handleDetailExport() {
      if (!this.detailTableData.length) {
        this.$message.warning("暂无可导出数据");
        return;
      }
      const headers = ["序号", "员工编号", "姓名", "日期", "出勤工时(h)", "标准工时(h)", "状态"];
      const rows = this.detailTableData.map((row, idx) => [
        idx + 1,
        row.employeeNo,
        row.employeeName,
        row.date,
        this.formatNumber(row.attendanceHours),
        this.formatNumber(row.standardHours),
        row.status,
      ]);
      const safeName = `${this.detailRow.unit || ""}_${this.detailRow.team || "出勤明细"}`.replace(
        /[\\/:*?"<>|]/g,
        "_"
      );
      downloadTableWithLog({
        headers,
        rows,
        format: "csv",
        baseFilename: safeName,
        meta: {
          moduleCode: "work_duration_detail",
          moduleName: "工作时长统计-出勤明细",
          moduleGroup: "员工工作饱和度分析",
          searchCriteria: {
            unit: this.detailRow.unit,
            department: this.detailRow.department,
            team: this.detailRow.team,
            startDate: this.queryParams.startDate,
            endDate: this.queryParams.endDate,
          },
        },
      });
      this.$message.success(`已导出 ${rows.length} 条明细记录`);
    },
    handleExport() {
      const source = this.selectedRows.length ? this.selectedRows : this.filteredTableData;
      if (!source.length) {
        this.$message.warning("暂无可导出数据");
        return;
      }
      const headers = [
        "序号",
        "单位",
        "部门",
        "班组",
        "在职人数(在岗)",
        "出勤工时(h)",
        "出勤总工时(h)",
        "饱和工时(h)",
        "平均工时(h)",
        "标准总工时(h)",
      ];
      const rows = source.map((row, idx) => [
        idx + 1,
        row.unit,
        row.department,
        row.team,
        row.onDutyCount,
        this.formatNumber(row.attendanceHours),
        this.formatNumber(row.totalHours),
        this.formatNumber(row.saturationHours),
        this.formatNumber(row.averageHours),
        this.formatNumber(row.standardTotalHours),
      ]);
      downloadTableWithLog({
        headers,
        rows,
        format: "csv",
        baseFilename: "工作时长统计",
        meta: {
          moduleCode: "work_duration_stats",
          moduleName: "工作时长统计",
          moduleGroup: "员工工作饱和度分析",
          searchCriteria: {
            startDate: this.queryParams.startDate,
            endDate: this.queryParams.endDate,
            org: this.checkedOrgLabel,
          },
        },
      });
      this.$message.success(`已导出 ${rows.length} 条记录`);
    },
  },
};
</script>

<style scoped>
.work-duration-panel {
  min-height: 520px;
}

.panel-layout {
  display: flex;
  gap: 12px;
  align-items: stretch;
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
  max-height: calc(100vh - 200px);
}

.org-search {
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
}

.org-tree-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid #ebeef5;
  background: #fafbfc;
  font-size: 12px;
  color: #909399;
}

.org-tree-toolbar__tip strong {
  color: #1890ff;
  font-weight: 600;
}

.org-tree-wrap {
  flex: 1;
  min-height: 280px;
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

.right-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
}

.query-bar {
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 12px;
}

.date-sep {
  margin: 0 8px;
  color: #909399;
}

.action-bar {
  margin-bottom: 12px;
}

.table-wrapper {
  flex: 1;
  min-height: 0;
}

.pagination-wrapper {
  margin-top: 12px;
  text-align: right;
}

.work-duration-panel >>> .table-header-cell {
  background: #e8f4ff !important;
  color: #303133;
  font-weight: 500;
}

.hours-ok {
  color: #52c41a;
  font-weight: 600;
}

.hours-low {
  color: #f5222d;
  font-weight: 600;
}

.hours-warn {
  color: #fa8c16;
  font-weight: 600;
}

.hours-sat {
  color: #1890ff;
  font-weight: 600;
}

.detail-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  margin-bottom: 14px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

.detail-dialog-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 36px;
}

.detail-dialog-title__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.work-duration-panel >>> .el-table__body tr:hover > td {
  background: #f0f7ff !important;
}

.work-duration-panel >>> .el-tree-node__content {
  height: 32px;
}

.work-duration-panel >>> .el-tree-node__content > .el-checkbox {
  margin-right: 6px;
}
</style>
