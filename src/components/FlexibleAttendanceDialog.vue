<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="dialogVisible"
    width="94%"
    top="3vh"
    append-to-body
    :close-on-click-modal="false"
    custom-class="flex-att-dialog"
  >
    <div v-if="sheet && sheet.days && sheet.days.length" class="flex-att-wrap">
      <div class="flex-att-summary">
        <div class="summary-item">
          <span class="label">姓名</span>
          <span class="value">{{ sheet.name }}</span>
        </div>
        <div class="summary-item">
          <span class="label">员工编码</span>
          <span class="value">{{ sheet.personId }}</span>
        </div>
        <div class="summary-item">
          <span class="label">所属组织</span>
          <span class="value" :title="sheet.orgName">{{ sheet.orgName }}</span>
        </div>
        <div class="summary-item">
          <span class="label">考勤月份</span>
          <span class="value">{{ sheet.yearMonth }}</span>
        </div>
      </div>

      <div class="flex-att-scroll">
        <table class="flex-att-table">
          <thead>
            <tr class="head-row-day">
              <th class="sticky-col sticky-col-1" rowspan="2">姓名</th>
              <th class="sticky-col sticky-col-2" rowspan="2">员工编码</th>
              <th
                v-for="d in sheet.days"
                :key="'day-h-' + d.day"
                colspan="2"
                :class="{ 'is-weekend': d.isWeekend }"
              >
                {{ d.day }}
              </th>
            </tr>
            <tr class="head-row-slot">
              <th
                v-for="h in amPmHeaders"
                :key="h.key"
                :class="{ 'is-weekend': h.weekend }"
              >
                {{ h.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="sticky-col sticky-col-1 name-cell">{{ sheet.name }}</td>
              <td class="sticky-col sticky-col-2 code-cell">{{ sheet.personId }}</td>
              <td
                v-for="c in dayCells"
                :key="c.key"
                :class="[
                  'slot-cell',
                  c.class,
                  { 'is-weekend': c.isWeekend, 'is-status-clickable': c.clickable },
                ]"
                :title="cellTitle(c)"
                @click="onCellClick(c)"
              >
                <span class="cell-text">{{ c.text }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex-att-legend">
        <div class="legend-section">
          <span class="legend-title">基础状态</span>
          <div class="legend-items">
            <span v-for="item in sheet.legend" :key="item.type" class="legend-item">
              <i :class="['legend-mark', 'flex-cell--' + item.type]">{{ item.text }}</i>
              {{ item.label }}
            </span>
          </div>
        </div>
        <div v-if="sheet.leaveLegend && sheet.leaveLegend.length" class="legend-section legend-section--leave">
          <span class="legend-title">休假类型</span>
          <div class="legend-leave-grid">
            <span
              v-for="item in sheet.leaveLegend"
              :key="item.type"
              class="legend-item legend-item--leave"
              :class="'legend-item--' + item.category"
            >
              <i :class="['legend-mark', 'flex-cell--' + item.type]">{{ item.text }}</i>
              {{ item.label }}
            </span>
          </div>
        </div>
        <span class="legend-hint">点击各状态单元格可查看判定依据；证据明细可点击查看无感原始数据</span>
      </div>
    </div>
    <div v-else class="flex-att-empty">暂无考勤数据</div>

    <!-- 判定依据详情 -->
    <el-dialog
      :title="statusDetailTitle"
      :visible.sync="statusDetailVisible"
      width="560px"
      append-to-body
      custom-class="absent-detail-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="activeStatusDetail" class="absent-detail-body">
        <div class="detail-head">
          <div class="detail-head-row">
            <span class="detail-label">员工</span>
            <span>{{ activeStatusDetail.name }}（{{ activeStatusDetail.personId }}）</span>
          </div>
          <div class="detail-head-row">
            <span class="detail-label">考勤日期</span>
            <span>{{ activeStatusDetail.recordDate }}</span>
          </div>
          <div class="detail-head-row">
            <span class="detail-label">时段</span>
            <span>{{ activeStatusDetail.slot }} · {{ activeStatusDetail.statusLabel }}（{{ activeStatusDetail.statusText }}）</span>
          </div>
        </div>

        <section class="detail-section">
          <div class="section-title">判定规则</div>
          <div class="rule-box">
            <div class="rule-row">
              <span class="rule-k">规则名称</span>
              <span>{{ activeStatusDetail.ruleName }}</span>
            </div>
            <div class="rule-row">
              <span class="rule-k">规则层级</span>
              <el-tag size="mini" :type="statusTagType">{{ activeStatusDetail.ruleLevel }}</el-tag>
            </div>
            <div class="rule-row">
              <span class="rule-k">输出表</span>
              <span>{{ activeStatusDetail.targetTable }}</span>
            </div>
            <div class="rule-row">
              <span class="rule-k">数据来源</span>
              <span>{{ activeStatusDetail.dataSources }}</span>
            </div>
            <div class="rule-row rule-row-block">
              <span class="rule-k">判定说明</span>
              <span>{{ activeStatusDetail.ruleDesc }}</span>
            </div>
            <div v-if="activeStatusDetail.evidence || activeStatusDetail.rawEvidence?.hasRawData" class="rule-row rule-row-block">
              <span class="rule-k">证据明细</span>
              <span v-if="activeStatusDetail.evidence" class="evidence-text">{{ activeStatusDetail.evidence }}</span>
              <el-button
                v-if="activeStatusDetail.rawEvidence?.hasRawData"
                type="text"
                class="raw-evidence-link"
                @click="rawEvidenceVisible = true"
              >
                查看无感数据原始记录（{{ activeStatusDetail.rawEvidence.totalCount }} 条）
              </el-button>
              <span v-else-if="!activeStatusDetail.evidence" class="evidence-empty">暂无关联原始记录</span>
            </div>
          </div>
        </section>

        <section v-if="activeStatusDetail.showAppeal" class="detail-section">
          <div class="section-title">旷工异议申请</div>
          <div class="appeal-box">
            <div class="appeal-row">
              <span class="rule-k">是否提交</span>
              <el-tag
                size="small"
                :type="activeStatusDetail.appealSubmitted ? 'primary' : 'info'"
                effect="plain"
              >
                {{ activeStatusDetail.appealSubmitted ? "已提交" : "未提交" }}
              </el-tag>
            </div>
            <template v-if="activeStatusDetail.appealSubmitted">
              <div class="appeal-row">
                <span class="rule-k">申请单号</span>
                <span>{{ activeStatusDetail.appealNo }}</span>
              </div>
              <div class="appeal-row">
                <span class="rule-k">提交时间</span>
                <span>{{ activeStatusDetail.submitTime }}</span>
              </div>
              <div class="appeal-row appeal-row-block">
                <span class="rule-k">申请事由</span>
                <span>{{ activeStatusDetail.submitReason }}</span>
              </div>
            </template>
            <div class="appeal-row">
              <span class="rule-k">审核状态</span>
              <el-tag size="small" :type="activeStatusDetail.appealStatusType" effect="dark">
                {{ activeStatusDetail.appealStatus }}
              </el-tag>
            </div>
          </div>
        </section>

        <section v-if="activeStatusDetail.showAppeal && activeStatusDetail.auditRecords.length" class="detail-section">
          <div class="section-title">审核流程</div>
          <el-timeline class="audit-timeline">
            <el-timeline-item
              v-for="(step, idx) in activeStatusDetail.auditRecords"
              :key="idx"
              :type="timelineType(step.resultType)"
              :timestamp="step.time !== '—' ? step.time : ''"
              placement="top"
            >
              <div class="timeline-node">{{ step.node }}</div>
              <div class="timeline-meta">
                <span v-if="step.user && step.user !== '—'">处理人：{{ step.user }}</span>
                <el-tag size="mini" :type="step.resultType || 'info'">{{ step.result }}</el-tag>
              </div>
              <div v-if="step.remark" class="timeline-remark">{{ step.remark }}</div>
            </el-timeline-item>
          </el-timeline>
        </section>
      </div>
      <span slot="footer">
        <el-button type="primary" @click="statusDetailVisible = false">知道了</el-button>
      </span>
    </el-dialog>

    <!-- 无感数据原始记录 -->
    <el-dialog
      title="无感数据原始记录"
      :visible.sync="rawEvidenceVisible"
      width="720px"
      append-to-body
      custom-class="raw-evidence-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="activeStatusDetail?.rawEvidence?.hasRawData" class="raw-evidence-body">
        <div class="raw-evidence-head">
          <span>{{ activeStatusDetail.name }}（{{ activeStatusDetail.personId }}）</span>
          <span>{{ activeStatusDetail.recordDate }} · {{ activeStatusDetail.slot }}</span>
        </div>
        <section
          v-for="group in activeStatusDetail.rawEvidence.groups"
          :key="group.sourceCode"
          class="raw-evidence-group"
        >
          <div class="raw-group-title">
            {{ group.sourceName }}
            <el-tag size="mini" type="info">{{ group.records.length }} 条</el-tag>
          </div>
          <div
            v-for="(rec, idx) in group.records"
            :key="rec.id || `${group.sourceCode}-${idx}`"
            class="raw-record-card"
          >
            <div class="raw-record-head">记录 {{ idx + 1 }}</div>
            <dl class="raw-field-list">
              <div v-for="field in rec.fields" :key="field.label" class="raw-field-row">
                <dt>{{ field.label }}</dt>
                <dd>{{ field.value }}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
      <div v-else class="flex-att-empty">暂无原始记录</div>
      <span slot="footer">
        <el-button type="primary" @click="rawEvidenceVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <span slot="footer">
      <el-button @click="dialogVisible = false">关闭</el-button>
      <el-button type="primary" icon="el-icon-download" @click="$emit('export', sheet)">导出</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: "FlexibleAttendanceDialog",
  props: {
    visible: { type: Boolean, default: false },
    sheet: { type: Object, default: null },
  },
  data() {
    return {
      statusDetailVisible: false,
      activeStatusDetail: null,
      rawEvidenceVisible: false,
    };
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit("update:visible", val);
      },
    },
    dialogTitle() {
      if (!this.sheet) return "柔性化考勤表";
      return `${this.sheet.name} · 柔性化考勤表`;
    },
    statusDetailTitle() {
      if (!this.activeStatusDetail) return "判定依据";
      return `${this.activeStatusDetail.statusLabel} · 判定依据`;
    },
    statusTagType() {
      const t = this.activeStatusDetail?.statusType;
      if (t === "absent" || t === "late") return "danger";
      if (t === "early") return "warning";
      if (t === "ok" || t === "training") return "success";
      if (t && String(t).startsWith("leave-")) return "info";
      return "info";
    },
    amPmHeaders() {
      if (!this.sheet || !this.sheet.days) return [];
      const list = [];
      this.sheet.days.forEach((d) => {
        list.push({ key: `am-h-${d.day}`, label: "上午", weekend: d.isWeekend });
        list.push({ key: `pm-h-${d.day}`, label: "下午", weekend: d.isWeekend });
      });
      return list;
    },
    dayCells() {
      if (!this.sheet || !this.sheet.days) return [];
      const list = [];
      this.sheet.days.forEach((d) => {
        ["am", "pm"].forEach((slot) => {
          const cellData = d[slot];
          const clickable = cellData?.judgmentDetail && cellData.text !== "—";
          list.push({
            key: `${slot}-${d.day}`,
            text: cellData?.text || "—",
            class: cellData?.class || "",
            leaveTypeName: cellData?.leaveTypeName || null,
            isWeekend: d.isWeekend,
            clickable,
            judgmentDetail: cellData?.judgmentDetail || null,
          });
        });
      });
      return list;
    },
  },
  watch: {
    visible(val) {
      if (!val) {
        this.statusDetailVisible = false;
        this.rawEvidenceVisible = false;
        this.activeStatusDetail = null;
      }
    },
  },
  methods: {
    cellTitle(cell) {
      if (cell.leaveTypeName) {
        return cell.clickable
          ? `${cell.leaveTypeName} · 点击查看判定依据`
          : cell.leaveTypeName;
      }
      return cell.clickable ? "点击查看判定依据" : "";
    },
    onCellClick(cell) {
      if (!cell.clickable || !cell.judgmentDetail) return;
      this.activeStatusDetail = cell.judgmentDetail;
      this.statusDetailVisible = true;
    },
    timelineType(resultType) {
      const map = {
        primary: "primary",
        success: "success",
        warning: "warning",
        danger: "danger",
        info: "info",
      };
      return map[resultType] || "info";
    },
  },
};
</script>

<style scoped>
.flex-att-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.flex-att-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 28px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f0f7ff 0%, #fafbfc 100%);
  border: 1px solid #d9ecff;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  min-width: 160px;
}

.summary-item .label {
  color: #909399;
  flex-shrink: 0;
}

.summary-item .value {
  color: #303133;
  font-weight: 600;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flex-att-scroll {
  min-height: 280px;
  max-height: calc(100vh - 260px);
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.flex-att-table {
  border-collapse: separate;
  border-spacing: 0;
  min-width: max-content;
  width: max-content;
  font-size: 13px;
}

.flex-att-table th,
.flex-att-table td {
  border: 1px solid #dcdfe6;
  text-align: center;
  vertical-align: middle;
  padding: 0;
}

.flex-att-table thead th {
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
  height: 36px;
  min-width: 44px;
}

.flex-att-table thead .head-row-day th {
  background: #ecf5ff;
  color: #303133;
  font-size: 12px;
}

.flex-att-table thead .is-weekend {
  background: #f4f4f5;
  color: #909399;
}

.flex-att-table .sticky-col {
  position: sticky;
  z-index: 2;
  background: #fff;
  font-weight: 600;
}

.flex-att-table .sticky-col-1 {
  left: 0;
  min-width: 72px;
  width: 72px;
}

.flex-att-table .sticky-col-2 {
  left: 72px;
  min-width: 100px;
  width: 100px;
  box-shadow: 4px 0 6px -4px rgba(0, 0, 0, 0.12);
}

.flex-att-table thead .sticky-col {
  z-index: 3;
  background: #ecf5ff;
}

.flex-att-table .name-cell {
  color: #409eff;
}

.flex-att-table .slot-cell {
  width: 44px;
  min-width: 44px;
  height: 40px;
  font-size: 14px;
  font-weight: 600;
}

.flex-cell--ok {
  background: #f0f9eb;
  color: #67c23a;
}

.flex-cell--late {
  background: #fef0f0;
  color: #f56c6c;
}

.flex-cell--early {
  background: #fdf6ec;
  color: #e6a23c;
}

.flex-cell--absent {
  background: #fde2e2;
  color: #f56c6c;
}

.flex-cell--leave {
  background: #e8f4ff;
  color: #409eff;
}

.flex-cell--leave-annual {
  background: #e8f4ff;
  color: #409eff;
}

.flex-cell--leave-personal {
  background: #eef2f7;
  color: #5470a5;
}

.flex-cell--leave-sick {
  background: #fef0f0;
  color: #f56c6c;
}

.flex-cell--leave-home {
  background: #fdf6ec;
  color: #e6a23c;
}

.flex-cell--leave-marriage {
  background: #fff7e6;
  color: #d48806;
}

.flex-cell--leave-bereavement {
  background: #f4f4f5;
  color: #606266;
}

.flex-cell--leave-miscarriage {
  background: #fde8e8;
  color: #c45656;
}

.flex-cell--leave-maternity {
  background: #f9ecf9;
  color: #b86bd7;
}

.flex-cell--leave-breastfeeding {
  background: #fce8f3;
  color: #d46b9a;
}

.flex-cell--leave-nursing {
  background: #e8f8f0;
  color: #3eaf7c;
}

.flex-cell--leave-contraception {
  background: #fef0f0;
  color: #e85d5d;
}

.flex-cell--leave-childcare {
  background: #e6f7ef;
  color: #2ea86a;
}

.flex-cell--leave-parent_care {
  background: #e8f4ff;
  color: #5b8fd9;
}

.flex-cell--leave-other {
  background: #f4f4f5;
  color: #909399;
}

.flex-cell--travel {
  background: #f4f4f5;
  color: #606266;
}

.flex-cell--training {
  background: #f0f9eb;
  color: #67c23a;
}

.flex-cell--weekend {
  background: #fafafa;
  color: #909399;
  font-size: 12px;
  font-weight: 500;
}

.flex-cell--empty {
  background: #fff;
  color: #c0c4cc;
}

.flex-att-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 4px 0;
  font-size: 12px;
  color: #606266;
}

.legend-section {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px 14px;
}

.legend-section--leave {
  padding: 10px 12px;
  background: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  flex: 1;
}

.legend-leave-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  flex: 1;
}

.legend-title {
  font-weight: 600;
  color: #303133;
  flex-shrink: 0;
  min-width: 56px;
  line-height: 24px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-item--leave {
  padding: 2px 6px;
  border-radius: 4px;
  background: #fff;
}

.legend-item--medical .legend-mark {
  border-color: #fbc4c4;
}

.legend-item--maternity .legend-mark {
  border-color: #e8c4f0;
}

.legend-item--care .legend-mark {
  border-color: #b8e6cf;
}

.cell-text {
  display: inline-block;
  line-height: 1;
}

.legend-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 24px;
  border-radius: 4px;
  font-style: normal;
  font-weight: 600;
  font-size: 13px;
  border: 1px solid #ebeef5;
}

.flex-att-empty {
  padding: 40px;
  text-align: center;
  color: #909399;
}

.legend-hint {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

.slot-cell.is-status-clickable {
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.1s;
}

.slot-cell.is-status-clickable:hover {
  box-shadow: inset 0 0 0 2px #409eff;
  transform: scale(1.05);
}

.evidence-text {
  white-space: pre-line;
  line-height: 1.7;
}

.raw-evidence-link {
  padding-left: 0;
  margin-top: 4px;
  font-weight: 600;
}

.evidence-empty {
  color: #909399;
  font-size: 12px;
}

.raw-evidence-body {
  max-height: calc(100vh - 280px);
  overflow: auto;
}

.raw-evidence-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
}

.raw-evidence-group {
  margin-bottom: 16px;
}

.raw-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 3px solid #67c23a;
}

.raw-record-card {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: #fafafa;
}

.raw-record-head {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.raw-field-list {
  margin: 0;
}

.raw-field-row {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 13px;
  line-height: 1.6;
}

.raw-field-row dt {
  flex: 0 0 140px;
  margin: 0;
  color: #909399;
}

.raw-field-row dd {
  margin: 0;
  color: #303133;
  word-break: break-all;
}

.absent-detail-body {
  font-size: 13px;
  color: #606266;
}

.detail-head {
  padding: 12px 14px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 16px;
}

.detail-head-row {
  display: flex;
  gap: 12px;
  line-height: 1.8;
}

.detail-label {
  color: #909399;
  width: 64px;
  flex-shrink: 0;
}

.detail-section {
  margin-bottom: 18px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.rule-box,
.appeal-box {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px 14px;
  background: #fafafa;
}

.rule-row,
.appeal-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  line-height: 1.6;
}

.rule-row:last-child,
.appeal-row:last-child {
  margin-bottom: 0;
}

.rule-row-block,
.appeal-row-block {
  flex-direction: column;
  gap: 4px;
}

.rule-k {
  color: #909399;
  width: 72px;
  flex-shrink: 0;
}

.audit-timeline {
  padding-left: 4px;
}

.timeline-node {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.timeline-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #909399;
}

.timeline-remark {
  margin-top: 6px;
  font-size: 12px;
  color: #f56c6c;
  background: #fef0f0;
  padding: 6px 8px;
  border-radius: 4px;
}
</style>

<style>
.absent-detail-dialog {
  z-index: 3100 !important;
}
.raw-evidence-dialog {
  z-index: 3200 !important;
}
.flex-att-dialog {
  z-index: 3000 !important;
}

.flex-att-dialog .el-dialog__body {
  padding: 12px 20px 8px;
}

.flex-att-dialog .el-dialog__header {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 12px;
}
</style>
