<template>
  <div class="sensing-clean-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">异常数据处置</h2>
        <p class="page-desc">按「数据质量检查及异常处置」中保存的规则执行质量检查，对检出的缺失/重复/错误数据进行人工修复。</p>
      </div>
      <div class="head-actions">
        <el-button size="small" plain @click="goRules">配置检查规则</el-button>
        <el-button type="primary" size="small" icon="el-icon-search" @click="runInspection">执行质量检查</el-button>
      </div>
    </div>

    <div class="func-desc">
      <p>本页展示规则筛选出的异常数据明细，支持修改/校正并提交修复申请。清洗规则请在「数据质量检查及异常处置」页维护。</p>
    </div>

    <div class="stats-row-inline">
      <span>缺失 <strong>{{ missingRows.length }}</strong></span>
      <span>重复 <strong>{{ duplicateRows.length }}</strong></span>
      <span>错误 <strong>{{ errorRows.length }}</strong></span>
      <span>合计异常 <strong>{{ totalIssues }}</strong></span>
    </div>

    <div class="source-stats">
        <div v-for="s in sourceStats" :key="s.code" class="source-stat-card">
          <span class="name">{{ s.name }}</span>
          <span class="count">{{ s.count }} 条</span>
        </div>
      </div>
      <div class="sub-tabs">
        <div class="sub-tab" :class="{ active: cleanSubTab === 'missing' }" @click="switchSubTab('missing')">数据缺失值处理</div>
        <div class="sub-tab" :class="{ active: cleanSubTab === 'duplicate' }" @click="switchSubTab('duplicate')">重复数据处理</div>
        <div class="sub-tab" :class="{ active: cleanSubTab === 'error' }" @click="switchSubTab('error')">错误数据处理</div>
      </div>
      <div class="search-area">
        <div class="search-row">
          <div class="search-item search-item-keyword">
            <i class="el-icon-search search-icon"></i>
            <input v-model="cleanKeyword" type="text" class="search-input" placeholder="搜索姓名、人员ID、数据源" @keyup.enter="handleCleanSearch" />
          </div>
          <el-select v-model="cleanSourceFilter" placeholder="数据源" clearable size="small" style="width: 200px">
            <el-option v-for="s in sourceOptions" :key="s" :label="s" :value="s" />
          </el-select>
          <el-button type="primary" icon="el-icon-search" :loading="cleanSearchLoading" @click="handleCleanSearch">查询</el-button>
          <el-button @click="resetCleanFilter">重置</el-button>
        </div>
      </div>
      <div class="table-panel">
        <div class="table-body-wrap" v-loading="cleanSearchLoading" element-loading-text="查询中...">
          <div v-show="cleanSubTab === 'missing'">
            <el-table :data="pagedMissingRows" border stripe size="small" style="width: 100%">
              <el-table-column type="index" label="序号" width="60" :index="cleanIndexMethod" />
              <el-table-column prop="sourceName" label="数据源" min-width="160" show-overflow-tooltip />
              <el-table-column prop="name" label="姓名" width="90" />
              <el-table-column prop="personId" label="人员ID" width="110" />
              <el-table-column prop="fieldLabel" label="缺失字段" min-width="140" show-overflow-tooltip />
              <el-table-column prop="fieldValue" label="当前值" width="100">
                <template slot-scope="{ row }"><span class="text-danger">{{ row.fieldValue || "（空）" }}</span></template>
              </el-table-column>
              <el-table-column prop="orgName" label="组织机构" min-width="200" show-overflow-tooltip />
              <el-table-column label="操作" width="80" align="center">
                <template slot-scope="{ row }"><el-button type="text" @click="openEditDialog('missing', row)">修改</el-button></template>
              </el-table-column>
            </el-table>
          </div>
          <div v-show="cleanSubTab === 'duplicate'">
            <el-table :data="pagedDuplicateRows" border stripe size="small" style="width: 100%">
              <el-table-column type="index" label="序号" width="60" :index="cleanIndexMethod" />
              <el-table-column prop="dupGroup" label="重复组" min-width="140" show-overflow-tooltip />
              <el-table-column prop="sourceName" label="数据源" min-width="160" show-overflow-tooltip />
              <el-table-column prop="name" label="姓名" width="90" />
              <el-table-column prop="personId" label="人员ID" width="110" />
              <el-table-column prop="recordDate" label="记录日期" width="120" />
              <el-table-column prop="summary" label="关键记录摘要" min-width="200" show-overflow-tooltip />
              <el-table-column prop="dupCount" label="重复条数" width="90" align="center" />
              <el-table-column label="操作" width="100" align="center">
                <template slot-scope="{ row }"><el-button type="text" @click="removeDuplicate(row)">保留一条</el-button></template>
              </el-table-column>
            </el-table>
          </div>
          <div v-show="cleanSubTab === 'error'">
            <el-table :data="pagedErrorRows" border stripe size="small" style="width: 100%">
              <el-table-column type="index" label="序号" width="60" :index="cleanIndexMethod" />
              <el-table-column prop="sourceName" label="数据源" min-width="160" show-overflow-tooltip />
              <el-table-column prop="name" label="姓名" width="90" />
              <el-table-column prop="fieldLabel" label="问题字段" min-width="140" show-overflow-tooltip />
              <el-table-column prop="fieldValue" label="当前值" min-width="120" show-overflow-tooltip />
              <el-table-column prop="errorReason" label="错误说明" min-width="200" show-overflow-tooltip />
              <el-table-column label="操作" width="80" align="center">
                <template slot-scope="{ row }"><el-button type="text" @click="openEditDialog('error', row)">校正</el-button></template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        <div class="pagination">
          <div class="pagination-info">
            <span>共 {{ cleanListTotal }} 条</span>
            <select v-model.number="cleanPageSize" class="page-size-select" @change="cleanPage = 1">
              <option :value="10">10条/页</option>
              <option :value="25">25条/页</option>
              <option :value="50">50条/页</option>
            </select>
          </div>
          <div class="pagination-nav">
            <button class="page-btn" :disabled="cleanPage === 1" @click="cleanPage--"><i class="el-icon-arrow-left"></i></button>
            <button v-for="p in cleanVisiblePages" :key="p" class="page-btn" :class="{ active: cleanPage === p }" @click="cleanPage = p">{{ p }}</button>
            <button class="page-btn" :disabled="cleanPage >= cleanTotalPages" @click="cleanPage++"><i class="el-icon-arrow-right"></i></button>
          </div>
        </div>
      </div>

    <el-dialog :title="editDialogTitle" :visible.sync="showEditDialog" width="540px" append-to-body @close="resetEditForm">
      <el-form label-width="96px" size="small">
        <el-form-item label="数据源">{{ editRow.sourceName }}</el-form-item>
        <el-form-item label="姓名">{{ editRow.name }}</el-form-item>
        <el-form-item label="修正字段">{{ editRow.fieldLabel }}</el-form-item>
        <el-form-item label="旧值"><span class="old-value" :class="{ empty: editOldValueEmpty }">{{ editOldValueDisplay }}</span></el-form-item>
        <el-form-item label="新值" required>
          <el-date-picker v-if="editFieldMeta.inputType === 'datetime'" v-model="editFormValue" type="datetime" :placeholder="editFieldMeta.placeholder" :format="editFieldMeta.format" :value-format="editFieldMeta.valueFormat" style="width: 100%" />
          <el-date-picker v-else-if="editFieldMeta.inputType === 'date'" v-model="editFormValue" type="date" :placeholder="editFieldMeta.placeholder" :format="editFieldMeta.format" :value-format="editFieldMeta.valueFormat" style="width: 100%" />
          <el-input v-else-if="editFieldMeta.inputType === 'phone'" v-model="editFormValue" :placeholder="editFieldMeta.placeholder" :maxlength="editFieldMeta.maxlength" clearable />
          <el-input v-else v-model="editFormValue" :placeholder="editFieldMeta.placeholder" clearable />
        </el-form-item>
        <el-form-item label="修正原因" required>
          <el-input v-model="editFormReason" type="textarea" :rows="2" placeholder="必填，将写入修复记录" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  loadCleanRules,
  getRepairFieldInputMeta,
  formatRepairOldValue,
  isMissingValue,
} from "../utils/dataCleanRules";
import {
  buildMissingRows,
  buildDuplicateRows,
  buildErrorRows,
  countAbnormalStatsBySource,
} from "../utils/sensingRecords";
import { loadSensingData, saveSensingData, submitDataRepair } from "../utils/dataRepairManagement";

export default {
  name: "AbnormalDataDisposal",
  data() {
    return {
      cleanRules: [],
      gateRows: [],
      canteenRows: [],
      onlineRows: [],
      missingRows: [],
      duplicateRows: [],
      errorRows: [],
      sourceStats: [],
      cleanSubTab: "missing",
      cleanKeyword: "",
      cleanSourceFilter: "",
      cleanSearchLoading: false,
      cleanPage: 1,
      cleanPageSize: 25,
      showEditDialog: false,
      editMode: "missing",
      editRow: {},
      editOldValue: "",
      editErrorRuleType: "",
      editFormValue: "",
      editFormReason: "",
    };
  },
  computed: {
    totalIssues() {
      return this.missingRows.length + this.duplicateRows.length + this.errorRows.length;
    },
    sourceOptions() {
      const names = new Set();
      [...this.missingRows, ...this.duplicateRows, ...this.errorRows].forEach((r) => {
        if (r.sourceName) names.add(r.sourceName);
      });
      return [...names];
    },
    filteredMissingRows() { return this.filterCleanList(this.missingRows); },
    filteredDuplicateRows() { return this.filterCleanList(this.duplicateRows); },
    filteredErrorRows() { return this.filterCleanList(this.errorRows); },
    cleanListTotal() {
      if (this.cleanSubTab === "missing") return this.filteredMissingRows.length;
      if (this.cleanSubTab === "duplicate") return this.filteredDuplicateRows.length;
      return this.filteredErrorRows.length;
    },
    pagedMissingRows() { return this.pageSlice(this.filteredMissingRows, this.cleanPage, this.cleanPageSize); },
    pagedDuplicateRows() { return this.pageSlice(this.filteredDuplicateRows, this.cleanPage, this.cleanPageSize); },
    pagedErrorRows() { return this.pageSlice(this.filteredErrorRows, this.cleanPage, this.cleanPageSize); },
    cleanTotalPages() { return Math.max(1, Math.ceil(this.cleanListTotal / this.cleanPageSize)); },
    cleanVisiblePages() {
      const total = this.cleanTotalPages;
      const cur = this.cleanPage;
      if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
      if (cur <= 4) return [1, 2, 3, 4, 5];
      if (cur >= total - 3) return [total - 4, total - 3, total - 2, total - 1, total];
      return [cur - 2, cur - 1, cur, cur + 1, cur + 2];
    },
    editDialogTitle() { return this.editMode === "error" ? "错误数据校正" : "缺失值修改"; },
    editFieldMeta() {
      if (!this.editRow.fieldKey) return { inputType: "text", placeholder: "请输入修正后的值" };
      return getRepairFieldInputMeta(this.editRow.sourceCode, this.editRow.fieldKey, this.editRow.fieldLabel, this.editErrorRuleType);
    },
    editOldValueDisplay() { return formatRepairOldValue(this.editOldValue); },
    editOldValueEmpty() { return isMissingValue(this.editOldValue); },
  },
  mounted() {
    this.cleanRules = loadCleanRules();
    this.reloadData(false);
  },
  methods: {
    goRules() {
      this.$router.push("/abnormal-data-processing");
    },
    reloadData(showMsg = true) {
      this.cleanRules = loadCleanRules();
      const data = loadSensingData();
      this.gateRows = data.gateRows;
      this.canteenRows = data.canteenRows;
      this.onlineRows = data.onlineRows;
      this.refreshCleanLists();
      if (showMsg) this.$message.success(`质量检查完成，共检出 ${this.totalIssues} 项异常`);
    },
    runInspection() {
      this.reloadData(true);
    },
    refreshCleanLists() {
      this.missingRows = buildMissingRows(this.gateRows, this.canteenRows, this.onlineRows, this.cleanRules);
      this.duplicateRows = buildDuplicateRows(this.gateRows, this.canteenRows, this.onlineRows, this.cleanRules);
      this.errorRows = buildErrorRows(this.gateRows, this.canteenRows, this.onlineRows, this.cleanRules);
      this.sourceStats = countAbnormalStatsBySource(this.missingRows, this.duplicateRows, this.errorRows);
    },
    switchSubTab(tab) { this.cleanSubTab = tab; this.cleanPage = 1; },
    filterCleanList(list) {
      let data = list;
      if (this.cleanSourceFilter) data = data.filter((r) => r.sourceName === this.cleanSourceFilter);
      if (this.cleanKeyword.trim()) {
        const kw = this.cleanKeyword.trim();
        data = data.filter((r) => (r.name && r.name.includes(kw)) || (r.personId && String(r.personId).includes(kw)) || (r.sourceName && r.sourceName.includes(kw)));
      }
      return data;
    },
    pageSlice(list, page, size) { return list.slice((page - 1) * size, (page - 1) * size + size); },
    cleanIndexMethod(index) { return (this.cleanPage - 1) * this.cleanPageSize + index + 1; },
    withSearchLoading(task, successMsg) {
      if (this.cleanSearchLoading) return;
      this.cleanSearchLoading = true;
      setTimeout(() => { task(); this.cleanSearchLoading = false; if (successMsg) this.$message.success(typeof successMsg === "function" ? successMsg() : successMsg); }, 400);
    },
    handleCleanSearch() { this.withSearchLoading(() => { this.cleanPage = 1; }, () => `查询成功，共 ${this.cleanListTotal} 条`); },
    resetCleanFilter() { this.cleanKeyword = ""; this.cleanSourceFilter = ""; this.cleanPage = 1; },
    findRecord(recordId, sourceCode) {
      if (sourceCode === "offline_gate") return this.gateRows.find((r) => r.id === recordId);
      if (sourceCode === "offline_canteen") return this.canteenRows.find((r) => r.id === recordId);
      return this.onlineRows.find((r) => r.id === recordId);
    },
    resolveErrorRuleType(row) {
      const rule = this.cleanRules.find((r) => r.sourceCode === row.sourceCode);
      const matched = rule?.error?.rules?.find((r) => r.key === row.fieldKey);
      return matched ? matched.type : "";
    },
    openEditDialog(mode, row) {
      this.editMode = mode;
      this.editRow = { ...row };
      this.editErrorRuleType = mode === "error" ? this.resolveErrorRuleType(row) : "";
      const record = this.findRecord(row.recordId, row.sourceCode);
      const raw = record ? record[row.fieldKey] : row.fieldValue;
      this.editOldValue = raw;
      this.editFormValue = isMissingValue(raw) ? "" : String(raw);
      this.editFormReason = "";
      this.showEditDialog = true;
    },
    resetEditForm() { this.editOldValue = ""; this.editErrorRuleType = ""; this.editFormValue = ""; this.editFormReason = ""; },
    validateEditValue(val) {
      const meta = this.editFieldMeta;
      if (isMissingValue(val)) return "请输入有效值";
      if (meta.inputType === "phone" && !/^1\d{10}$/.test(String(val).replace(/\s/g, ""))) return "请输入11位有效手机号";
      if (meta.inputType === "datetime" || meta.inputType === "date") {
        if (!/^\d{4}-\d{2}-\d{2}/.test(String(val))) return "请选择有效的日期时间";
      }
      return "";
    },
    saveEdit() {
      const val = this.editFormValue != null ? String(this.editFormValue).trim() : "";
      const reason = this.editFormReason.trim();
      const err = this.validateEditValue(val);
      if (err) { this.$message.warning(err); return; }
      if (!reason) { this.$message.warning("请填写修正原因"); return; }
      try {
        submitDataRepair({
          recordId: this.editRow.recordId,
          sourceCode: this.editRow.sourceCode,
          sourceName: this.editRow.sourceName,
          name: this.editRow.name,
          personId: this.editRow.personId,
          fieldKey: this.editRow.fieldKey,
          fieldLabel: this.editRow.fieldLabel,
          afterValue: val,
          reason,
          ruleName: this.editMode === "error" ? "字段格式校验" : "必填字段缺失检查",
        });
        this.showEditDialog = false;
        this.$message.success("修复申请已提交，请至「数据修复记录」查看并审批");
      } catch (e) {
        this.$message.warning(e.message || "提交失败");
      }
    },
    removeDuplicate(row) {
      const group = row.dupGroup;
      if (!group) return;
      const filterGroup = (list) => {
        let kept = false;
        return list.filter((r) => {
          if (r.dupGroup !== group) return true;
          if (!kept) { kept = true; return true; }
          return false;
        });
      };
      this.gateRows = filterGroup(this.gateRows);
      this.canteenRows = filterGroup(this.canteenRows);
      this.onlineRows = filterGroup(this.onlineRows);
      saveSensingData({ gateRows: this.gateRows, canteenRows: this.canteenRows, onlineRows: this.onlineRows });
      this.refreshCleanLists();
      this.$message.success("已保留一条记录，重复项已移除");
    },
  },
};
</script>

<style scoped src="../styles/sensing-clean-panel.css"></style>
