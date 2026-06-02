<template>
  <div class="behavior-mode-page employee-ledger-page">
    <div class="page-layout">
      <aside class="org-sidebar">
        <div class="org-search">
          <el-input
            v-model="orgTreeKeyword"
            placeholder="关键字搜索组织"
            prefix-icon="el-icon-search"
            size="small"
            clearable
          />
        </div>
        <div class="scope-hint">
          <span
            class="scope-item"
            :class="{ active: !selectedOrgId }"
            @click="selectGlobalScope"
          >
            <i class="el-icon-s-home" />
            全公司默认配置
          </span>
        </div>
        <div class="org-tree-wrap">
          <el-tree
            :data="filteredOrgTree"
            :props="treeProps"
            default-expand-all
            highlight-current
            :expand-on-click-node="false"
            node-key="id"
            :current-node-key="selectedOrgId"
            @node-click="handleOrgClick"
          >
            <span slot-scope="{ node, data }" class="tree-node">
              <i :class="data.icon || 'el-icon-folder'" />
              <span class="tree-label">{{ node.label }}</span>
              <el-tag
                v-if="hasOverride(data.id)"
                size="mini"
                type="warning"
                class="override-tag"
              >
                已覆盖
              </el-tag>
            </span>
          </el-tree>
        </div>
      </aside>

      <main class="main-panel">
        <section class="query-panel">
          <div class="query-panel-head">
            <div>
              <span class="query-title">行为模式设置信息</span>
              <p class="panel-desc">
                配置员工出勤判定规则，包含工时统计、休假安排、评估标准等。保存后同步应用于无感考勤、考勤台账与评估台账。
              </p>
            </div>
            <div class="query-actions">
              <el-button type="primary" size="small" icon="el-icon-check" @click="handleSave">
                保存配置
              </el-button>
              <el-button size="small" icon="el-icon-refresh-left" @click="handleReset">
                恢复默认
              </el-button>
            </div>
          </div>

          <div class="scope-banner">
            <i class="el-icon-setting" />
            <span>
              当前编辑范围：
              <strong>{{ scopeLabel }}</strong>
              <template v-if="selectedOrgId">
                （仅覆盖该组织，未单独设置的项继承全公司默认）
              </template>
            </span>
            <span v-if="settings.updatedAt" class="updated-at">
              最近保存：{{ formatTime(settings.updatedAt) }}
            </span>
          </div>
        </section>

        <section class="config-section">
          <el-tabs v-model="activeTab" type="border-card">
            <el-tab-pane label="基础考勤模式" name="work">
              <el-form label-width="140px" size="small" class="config-form">
                <el-form-item label="到岗时间">
                  <el-time-select
                    v-model="editWorkConfig.arrivalTime"
                    :picker-options="timePickerOptions"
                    placeholder="选择到岗时间"
                    style="width: 160px"
                  />
                  <span class="field-hint">闸机进入不晚于此时间视为正常到岗</span>
                </el-form-item>
                <el-form-item label="离岗时间">
                  <el-time-select
                    v-model="editWorkConfig.departureTime"
                    :picker-options="timePickerOptions"
                    placeholder="选择离岗时间"
                    style="width: 160px"
                  />
                  <span class="field-hint">闸机离开不早于此时间视为正常离岗</span>
                </el-form-item>
                <el-form-item label="加班起算时间">
                  <el-time-select
                    v-model="editWorkConfig.overtimeStartTime"
                    :picker-options="timePickerOptions"
                    placeholder="选择加班起算"
                    style="width: 160px"
                  />
                  <span class="field-hint">离岗晚于此时间开始计加班时长</span>
                </el-form-item>
                <el-form-item label="登录迟到连续天数">
                  <el-input-number
                    v-model="editWorkConfig.loginLateConsecutiveDays"
                    :min="1"
                    :max="10"
                    controls-position="right"
                  />
                  <span class="field-hint">连续 N 个工作日登录迟到触发异常校验</span>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="休假安排" name="leave" :disabled="isOrgScope">
              <el-alert
                v-if="isOrgScope"
                title="休假类型为全公司统一配置，请在「全公司默认配置」下编辑"
                type="info"
                :closable="false"
                show-icon
                class="org-scope-alert"
              />
              <p class="tab-desc">
                人资休假台账中的假期类型及优先级。有休假记录的日期优先判为请假，不再按闸机判断出勤。
              </p>
              <div class="table-container table-hscroll-viewport">
                <el-table :data="editLeaveTypes" border size="small" style="width: 100%">
                  <el-table-column prop="name" label="假期类型" width="120" />
                  <el-table-column label="规则优先级" width="120" align="center">
                    <template slot-scope="{ row }">
                      第 {{ row.priority }} 层
                    </template>
                  </el-table-column>
                  <el-table-column label="计入评估请假天数" width="160" align="center">
                    <template slot-scope="{ row }">
                      <el-switch v-model="row.countsForAssessment" />
                    </template>
                  </el-table-column>
                  <el-table-column label="启用" width="80" align="center">
                    <template slot-scope="{ row }">
                      <el-switch v-model="row.enabled" />
                    </template>
                  </el-table-column>
                  <el-table-column label="说明">
                    <template slot-scope="{ row }">
                      {{ leaveTypeDesc(row) }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <el-tab-pane label="工时统计规则" name="hours" :disabled="isOrgScope">
              <el-alert
                v-if="isOrgScope"
                title="工时规则为全公司统一配置，请在「全公司默认配置」下编辑"
                type="info"
                :closable="false"
                show-icon
                class="org-scope-alert"
              />
              <p class="tab-desc">按岗位类别绑定工时计算规则链，与无感数据管理中的工时输出一致。</p>
              <div class="post-rule-grid">
                <div v-for="cat in postCategoryOptions" :key="cat" class="post-rule-card">
                  <span class="post-rule-label">{{ cat }}</span>
                  <el-select
                    v-model="editPostCategoryRules[cat]"
                    size="small"
                    placeholder="选择规则"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="rule in hoursRuleOptions"
                      :key="rule.id"
                      :label="rule.name"
                      :value="rule.id"
                    />
                  </el-select>
                </div>
              </div>

              <div class="rule-catalog-cards">
                <div
                  v-for="rule in editRuleCatalog.filter((r) => r.id.startsWith('hours_'))"
                  :key="rule.id"
                  class="rule-catalog-card"
                >
                  <div class="rule-catalog-head">
                    <el-switch v-model="rule.enabled" />
                    <span class="rule-catalog-name">{{ rule.name }}</span>
                    <el-tag size="mini">{{ rule.levels }} 层</el-tag>
                  </div>
                  <p class="rule-catalog-desc">{{ rule.desc }}</p>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="评估标准" name="assessment">
              <p class="tab-desc">与考勤评估台账联动，按月自动评估优秀 / 良好 / 不合格。</p>
              <el-form label-width="160px" size="small" class="config-form">
                <el-form-item label="不合格·旷工下限">
                  <el-input-number
                    v-model="editAssessment.absentFailMin"
                    :min="1"
                    :max="10"
                    controls-position="right"
                  />
                  <span class="field-hint">旷工次数 ≥ 此值判定为不合格</span>
                </el-form-item>
                <el-form-item label="优秀·请假上限">
                  <el-input-number
                    v-model="editAssessment.excellentMaxLeave"
                    :min="0"
                    :max="30"
                    controls-position="right"
                  />
                  <span class="field-hint">无旷工且请假 ≤ 此值判定为优秀</span>
                </el-form-item>
                <el-form-item label="良好·请假上限">
                  <el-input-number
                    v-model="editAssessment.goodMaxLeave"
                    :min="0"
                    :max="30"
                    controls-position="right"
                  />
                  <span class="field-hint">无旷工且请假 ≤ 此值判定为良好</span>
                </el-form-item>
              </el-form>

              <div class="assessment-preview">
                <div
                  v-for="rule in previewAssessmentRules"
                  :key="rule.result"
                  class="rule-card"
                  :class="'rule-card--' + resultClass(rule.result)"
                >
                  <span class="rule-result">{{ rule.result }}</span>
                  <span class="rule-desc">{{ rule.desc }}</span>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="规则链明细" name="chain" :disabled="isOrgScope">
              <el-alert
                v-if="isOrgScope"
                title="规则链为全公司统一配置，请在「全公司默认配置」下编辑"
                type="info"
                :closable="false"
                show-icon
                class="org-scope-alert"
              />
              <p class="tab-desc">无感考勤与异常校验的完整规则层级，旷工判定弹窗中的规则来源与此一致。</p>
              <div class="rule-catalog-cards rule-catalog-cards--compact">
                <div v-for="rule in editRuleCatalog" :key="rule.id" class="rule-catalog-card">
                  <div class="rule-catalog-head">
                    <el-switch v-model="rule.enabled" />
                    <span class="rule-catalog-name">{{ rule.name }}</span>
                    <el-tag size="mini">{{ rule.levels }} 层</el-tag>
                  </div>
                  <p class="rule-catalog-desc">{{ rule.desc }}</p>
                </div>
              </div>

              <div class="table-container table-hscroll-viewport chain-table-wrap">
                <el-table :data="ruleChainRows" border size="small" style="width: 100%">
                  <el-table-column prop="catalogName" label="规则组" width="180" />
                  <el-table-column prop="level" label="层级" width="70" align="center" />
                  <el-table-column prop="layerName" label="规则名称" width="140" />
                  <el-table-column prop="dataSource" label="数据来源" width="140" />
                  <el-table-column prop="output" label="输出结果" min-width="160" />
                </el-table>
              </div>
            </el-tab-pane>
          </el-tabs>
        </section>
      </main>
    </div>
  </div>
</template>

<script>
import { generateOrgTree } from "../utils/orgTree";
import {
  loadBehaviorModeSettings,
  saveBehaviorModeSettings,
  resetBehaviorModeSettings,
  getAssessmentRules,
  getRuleChainRows,
  hasOrgOverride,
  POST_CATEGORY_OPTIONS,
} from "../utils/behaviorModeSettings";

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default {
  name: "BehaviorModeSettings",
  data() {
    return {
      orgTree: [],
      orgTreeKeyword: "",
      treeProps: { label: "name", children: "children" },
      selectedOrgId: null,
      selectedOrgName: "",
      activeTab: "work",
      settings: loadBehaviorModeSettings(),
      editWorkConfig: {},
      editLeaveTypes: [],
      editPostCategoryRules: {},
      editAssessment: {},
      editRuleCatalog: [],
      timePickerOptions: {
        start: "06:00",
        step: "00:15",
        end: "22:00",
      },
      postCategoryOptions: POST_CATEGORY_OPTIONS,
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
    scopeLabel() {
      return this.selectedOrgId ? this.selectedOrgName : "全公司默认";
    },
    isOrgScope() {
      return Boolean(this.selectedOrgId);
    },
    hoursRuleOptions() {
      return this.editRuleCatalog.filter((r) => r.id.startsWith("hours_"));
    },
    previewAssessmentRules() {
      return getAssessmentRules(this.editAssessment);
    },
    ruleChainRows() {
      const enabledIds = new Set(
        this.editRuleCatalog.filter((r) => r.enabled !== false).map((r) => r.id)
      );
      return getRuleChainRows().filter((r) => enabledIds.has(r.catalogId));
    },
  },
  mounted() {
    this.orgTree = generateOrgTree();
    this.loadEditorFromSettings();
  },
  methods: {
    hasOverride(orgId) {
      return hasOrgOverride(orgId);
    },
    selectGlobalScope() {
      this.selectedOrgId = null;
      this.selectedOrgName = "";
      this.loadEditorFromSettings();
    },
    handleOrgClick(data) {
      if (data.id === 1) {
        this.selectGlobalScope();
        return;
      }
      this.selectedOrgId = data.id;
      this.selectedOrgName = data.name;
      this.loadEditorFromSettings();
    },
    loadEditorFromSettings() {
      this.settings = loadBehaviorModeSettings();
      const global = this.settings.global;
      const override = this.selectedOrgId
        ? this.settings.orgOverrides[String(this.selectedOrgId)] || {}
        : null;

      if (this.selectedOrgId && override) {
        this.editWorkConfig = cloneDeep({
          ...global.workConfig,
          ...(override.workConfig || {}),
        });
        this.editAssessment = cloneDeep({
          ...global.assessment,
          ...(override.assessment || {}),
        });
      } else if (this.selectedOrgId) {
        this.editWorkConfig = cloneDeep(global.workConfig);
        this.editAssessment = cloneDeep(global.assessment);
      } else {
        this.editWorkConfig = cloneDeep(global.workConfig);
        this.editAssessment = cloneDeep(global.assessment);
      }

      this.editLeaveTypes = cloneDeep(global.leaveTypes);
      this.editPostCategoryRules = cloneDeep(global.postCategoryRules);
      this.editRuleCatalog = cloneDeep(global.ruleCatalog);
    },
    handleSave() {
      if (this.editAssessment.excellentMaxLeave > this.editAssessment.goodMaxLeave) {
        this.$message.warning("优秀请假上限不能大于良好请假上限");
        return;
      }

      const next = cloneDeep(this.settings);

      if (this.selectedOrgId) {
        const key = String(this.selectedOrgId);
        next.orgOverrides[key] = {
          workConfig: cloneDeep(this.editWorkConfig),
          assessment: cloneDeep(this.editAssessment),
        };
      } else {
        next.global.workConfig = cloneDeep(this.editWorkConfig);
        next.global.leaveTypes = cloneDeep(this.editLeaveTypes);
        next.global.postCategoryRules = cloneDeep(this.editPostCategoryRules);
        next.global.assessment = cloneDeep(this.editAssessment);
        next.global.ruleCatalog = cloneDeep(this.editRuleCatalog);
      }

      this.settings = saveBehaviorModeSettings(next);
      this.$message.success("行为模式配置已保存");
    },
    handleReset() {
      this.$confirm("确定恢复为系统默认配置？此操作不可撤销。", "恢复默认", {
        type: "warning",
      })
        .then(() => {
          this.settings = resetBehaviorModeSettings();
          this.selectedOrgId = null;
          this.selectedOrgName = "";
          this.loadEditorFromSettings();
          this.$message.success("已恢复默认配置");
        })
        .catch(() => {});
    },
    leaveTypeDesc(row) {
      if (!row.enabled) return "已停用，不参与休假判定";
      return row.countsForAssessment
        ? "参与休假判定，计入评估台账请假天数"
        : "参与休假判定，不计入评估请假天数";
    },
    formatTime(iso) {
      if (!iso) return "";
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    },
    resultClass(result) {
      if (result === "优秀") return "excellent";
      if (result === "良好") return "good";
      return "fail";
    },
  },
};
</script>

<style scoped>
.behavior-mode-page {
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
  align-items: flex-start;
  margin-bottom: 12px;
}

.query-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.panel-desc {
  margin: 6px 0 0;
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

.scope-hint {
  padding: 8px 12px;
  border-bottom: 1px solid #ebeef5;
}

.scope-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
}

.scope-item:hover {
  background: #f5f7fa;
  color: #409eff;
}

.scope-item.active {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}

.override-tag {
  margin-left: 6px;
  flex-shrink: 0;
}

.scope-banner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

.scope-banner i {
  color: #409eff;
}

.updated-at {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
}

.config-section {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  flex: 1;
  min-width: 0;
}

.config-form {
  max-width: 640px;
  padding: 8px 0;
}

.field-hint {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

.tab-desc {
  font-size: 12px;
  color: #909399;
  margin: 0 0 14px;
  line-height: 1.5;
}

.post-rule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.post-rule-card {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fafafa;
}

.post-rule-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.rule-catalog-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.rule-catalog-cards--compact {
  margin-bottom: 12px;
}

.rule-catalog-card {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
}

.rule-catalog-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.rule-catalog-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.rule-catalog-desc {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.assessment-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.rule-card {
  flex: 1;
  min-width: 180px;
  padding: 10px 14px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  background: #fafafa;
}

.rule-card--excellent {
  border-color: #c2e7b0;
  background: #f0f9eb;
}

.rule-card--good {
  border-color: #f5dab1;
  background: #fdf6ec;
}

.rule-card--fail {
  border-color: #fbc4c4;
  background: #fef0f0;
}

.rule-result {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.rule-desc {
  font-size: 12px;
  color: #606266;
}

.chain-table-wrap {
  margin-top: 8px;
}

.org-scope-alert {
  margin-bottom: 12px;
}

.behavior-mode-page .query-panel-head {
  align-items: flex-start;
}

.behavior-mode-page .panel-desc {
  margin: 6px 0 0;
}
</style>
