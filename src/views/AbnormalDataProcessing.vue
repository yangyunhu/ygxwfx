<template>
  <div class="sensing-clean-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">数据质量检查及异常处置</h2>
        <p class="page-desc">按八类无感数据源配置缺失、重复、错误三类清洗规则；规则保存后请在「异常数据处置」中执行检查并人工修复。</p>
      </div>
      <el-button size="small" type="primary" plain @click="goRepair">前往异常处置</el-button>
    </div>

    <div class="func-desc">
      <p>本页仅维护清洗规则，不展示检出问题明细。按下方页签分别配置缺失值、重复数据、错误数据规则，左侧选择数据源后保存即可。</p>
    </div>

    <div class="sub-tabs rules-type-tabs">
      <div class="sub-tab" :class="{ active: ruleSubTab === 'missing' }" @click="ruleSubTab = 'missing'">缺失值规则</div>
      <div class="sub-tab" :class="{ active: ruleSubTab === 'duplicate' }" @click="ruleSubTab = 'duplicate'">重复数据规则</div>
      <div class="sub-tab" :class="{ active: ruleSubTab === 'error' }" @click="ruleSubTab = 'error'">错误数据规则</div>
    </div>

    <div class="clean-rules-panel">
      <div class="rules-layout">
        <aside class="rules-source-aside">
          <div class="aside-title">数据源</div>
          <div
            v-for="item in cleanRules"
            :key="item.sourceCode"
            class="rules-source-item"
            :class="{ active: activeRuleSource === item.sourceCode }"
            @click="selectRuleSource(item.sourceCode)"
          >
            <span class="rules-source-name">{{ item.sourceName }}</span>
            <el-tag v-if="!item.enabled" size="mini" type="info">停用</el-tag>
          </div>
        </aside>
        <main v-if="activeCleanRule" class="rules-editor">
          <div class="rules-editor-head">
            <h3>{{ activeCleanRule.sourceName }}</h3>
            <div class="rules-meta">
              <span v-if="activeCleanRule.updateTime">最近更新：{{ activeCleanRule.updateTime }}</span>
              <span v-if="activeCleanRule.operator">操作人：{{ activeCleanRule.operator }}</span>
            </div>
          </div>
          <el-form label-width="110px" size="small">
            <el-form-item label="规则总开关">
              <el-switch v-model="activeCleanRule.enabled" active-text="启用" inactive-text="停用" />
            </el-form-item>

            <template v-if="ruleSubTab === 'missing'">
            <el-divider content-position="left">缺失值规则</el-divider>
            <el-form-item label="启用缺失检测">
              <el-switch v-model="activeCleanRule.missing.enabled" />
            </el-form-item>
            <el-form-item label="必填字段">
              <el-select
                v-model="ruleMissingSelectedKeys"
                multiple
                filterable
                :filter-method="filterFieldOption"
                placeholder="搜索并选择必填字段（源表全字段）"
                style="width: 100%"
                :disabled="!activeCleanRule.missing.enabled"
              >
                <el-option v-for="opt in ruleFieldOptions" :key="opt.key" :label="fieldOptionSearchLabel(opt)" :value="opt.key">
                  <span class="field-opt-label">{{ opt.label }}</span>
                  <span v-if="opt.en" class="field-opt-en">{{ opt.en }}</span>
                </el-option>
              </el-select>
              <div v-if="activeCleanRule.missing.enabled" class="selected-fields-panel">
                <div class="selected-fields-head">
                  <span class="selected-fields-title">已选必填字段</span>
                  <span class="selected-fields-count">{{ ruleMissingSelectedFields.length }} / {{ ruleSchemaFieldCount }}</span>
                </div>
                <div v-if="ruleMissingSelectedFields.length" class="selected-fields-tags">
                  <el-tag v-for="item in ruleMissingSelectedFields" :key="item.key" size="small" type="primary" effect="plain" closable @close="removeMissingField(item.key)">
                    {{ fieldOptionSearchLabel(item) }}
                  </el-tag>
                </div>
                <div v-else class="selected-fields-empty">暂未选择必填字段</div>
              </div>
              <p class="form-tip">源表共 {{ ruleSchemaFieldCount }} 个字段可选；下方标签展示当前全部已选项。</p>
            </el-form-item>
            </template>

            <template v-if="ruleSubTab === 'duplicate'">
            <el-divider content-position="left">重复数据规则</el-divider>
            <el-form-item label="启用重复检测">
              <el-switch v-model="activeCleanRule.duplicate.enabled" />
            </el-form-item>
            <el-form-item label="唯一性字段">
              <el-select
                v-model="ruleDuplicateSelectedKeys"
                multiple
                filterable
                :filter-method="filterFieldOption"
                placeholder="搜索并选择唯一性组合字段"
                style="width: 100%"
                :disabled="!activeCleanRule.duplicate.enabled"
              >
                <el-option v-for="opt in ruleDuplicateOptions" :key="opt.key" :label="fieldOptionSearchLabel(opt)" :value="opt.key">
                  <span class="field-opt-label">{{ opt.label }}</span>
                  <span v-if="opt.en" class="field-opt-en">{{ opt.en }}</span>
                </el-option>
              </el-select>
              <div v-if="activeCleanRule.duplicate.enabled" class="selected-fields-panel">
                <div class="selected-fields-head">
                  <span class="selected-fields-title">已选唯一性字段</span>
                  <span class="selected-fields-count">{{ ruleDuplicateSelectedFields.length }} 项</span>
                </div>
                <div v-if="ruleDuplicateSelectedFields.length" class="selected-fields-tags">
                  <el-tag v-for="item in ruleDuplicateSelectedFields" :key="item.key" size="small" type="primary" effect="plain" closable @close="removeDuplicateField(item.key)">
                    {{ fieldOptionSearchLabel(item) }}
                  </el-tag>
                </div>
                <div v-else class="selected-fields-empty">暂未选择唯一性字段</div>
              </div>
            </el-form-item>
            </template>

            <template v-if="ruleSubTab === 'error'">
            <el-divider content-position="left">错误数据规则</el-divider>
            <el-form-item label="启用错误检测">
              <el-switch v-model="activeCleanRule.error.enabled" />
            </el-form-item>
            <el-table :data="activeCleanRule.error.rules" border size="small" class="error-rules-table">
              <el-table-column label="字段" min-width="200">
                <template slot-scope="{ row }">
                  <el-select v-model="row.key" filterable :filter-method="filterFieldOption" size="mini" style="width: 100%" :disabled="!activeCleanRule.error.enabled" @change="(key) => syncErrorRuleField(row, key)">
                    <el-option v-for="opt in ruleFieldOptions" :key="opt.key" :label="fieldOptionSearchLabel(opt)" :value="opt.key" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="规则类型" min-width="180">
                <template slot-scope="{ row }">
                  <el-select v-model="row.type" filterable size="mini" style="width: 100%" :disabled="!activeCleanRule.error.enabled" @change="(type) => onErrorRuleTypeChange(row, type)">
                    <el-option-group v-for="grp in errorRuleTypeGroups" :key="grp.label" :label="grp.label">
                      <el-option v-for="t in grp.options" :key="t.value" :label="t.label" :value="t.value" />
                    </el-option-group>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="参照字段" min-width="180">
                <template slot-scope="{ row }">
                  <el-select v-if="needsErrorRefField(row.type)" v-model="row.startKey" filterable :filter-method="filterFieldOption" size="mini" style="width: 100%" :disabled="!activeCleanRule.error.enabled" @change="(key) => syncErrorRuleStartField(row, key)">
                    <el-option v-for="opt in refFieldOptionsForRule(row)" :key="opt.key" :label="fieldOptionSearchLabel(opt)" :value="opt.key" />
                  </el-select>
                  <span v-else class="text-muted">—</span>
                </template>
              </el-table-column>
              <el-table-column label="启用" width="70" align="center">
                <template slot-scope="{ row }"><el-switch v-model="row.enabled" :disabled="!activeCleanRule.error.enabled" /></template>
              </el-table-column>
              <el-table-column label="操作" width="70" align="center">
                <template slot-scope="{ $index }"><el-button type="text" @click="removeErrorRule($index)">删除</el-button></template>
              </el-table-column>
            </el-table>
            <div class="error-rule-add">
              <el-select v-model="newErrorRuleFieldKey" filterable :filter-method="filterFieldOption" placeholder="选择字段" size="small" style="width: 240px; margin-right: 8px" clearable>
                <el-option v-for="opt in ruleFieldOptions" :key="opt.key" :label="fieldOptionSearchLabel(opt)" :value="opt.key" />
              </el-select>
              <el-select v-model="newErrorRuleType" filterable placeholder="规则类型" size="small" style="width: 200px; margin-right: 8px">
                <el-option-group v-for="grp in errorRuleTypeGroups" :key="grp.label" :label="grp.label">
                  <el-option v-for="t in grp.options" :key="t.value" :label="t.label" :value="t.value" />
                </el-option-group>
              </el-select>
              <el-button size="small" icon="el-icon-plus" @click="addErrorRule">添加规则</el-button>
            </div>
            </template>

            <div class="rules-actions">
              <el-button type="primary" @click="saveCleanRuleConfig">保存并应用规则</el-button>
              <el-button @click="resetCurrentCleanRule">恢复该源默认</el-button>
            </div>
          </el-form>
        </main>
      </div>
    </div>
  </div>
</template>

<script>
import {
  loadCleanRules,
  saveCleanRules,
  buildDefaultRule,
  SOURCE_META,
  getFieldOptionsForSource,
  getFieldOptionByKey,
  getDuplicateFieldOptionsForSource,
  getSchemaFieldCount,
  formatFieldOptionLabel,
  ERROR_RULE_TYPE_GROUPS,
  errorRuleNeedsRefField,
  filterFieldOption,
} from "../utils/dataCleanRules";

export default {
  name: "AbnormalDataProcessing",
  data() {
    return {
      cleanRules: [],
      activeRuleSource: SOURCE_META[0]?.code || "offline_gate",
      ruleSubTab: "missing",
      newErrorRuleFieldKey: "",
      newErrorRuleType: "phone",
    };
  },
  computed: {
    activeCleanRule() {
      return this.cleanRules.find((r) => r.sourceCode === this.activeRuleSource) || null;
    },
    ruleFieldOptions() {
      return getFieldOptionsForSource(this.activeRuleSource);
    },
    ruleSchemaFieldCount() {
      return getSchemaFieldCount(this.activeRuleSource);
    },
    timeLikeFieldOptions() {
      return this.ruleFieldOptions.filter(
        (f) =>
          (f.label && (f.label.includes("时间") || f.label.includes("日期"))) ||
          (f.fieldType && String(f.fieldType).toLowerCase().includes("time"))
      );
    },
    ruleDuplicateOptions() {
      return getDuplicateFieldOptionsForSource(this.activeRuleSource);
    },
    errorRuleTypeGroups() {
      return ERROR_RULE_TYPE_GROUPS;
    },
    ruleMissingSelectedKeys: {
      get() {
        const rule = this.activeCleanRule;
        return rule ? (rule.missing.fields || []).map((f) => f.key) : [];
      },
      set(keys) {
        const rule = this.activeCleanRule;
        if (!rule) return;
        rule.missing.fields = keys.map((key) => {
          const found = this.ruleFieldOptions.find((o) => o.key === key);
          return { key, label: found ? found.label : key };
        });
      },
    },
    ruleDuplicateSelectedKeys: {
      get() {
        const rule = this.activeCleanRule;
        return rule ? (rule.duplicate.keyFields || []).map((f) => f.key) : [];
      },
      set(keys) {
        const rule = this.activeCleanRule;
        if (!rule) return;
        rule.duplicate.keyFields = keys.map((key) => {
          const found = this.ruleDuplicateOptions.find((o) => o.key === key);
          return { key, label: found ? found.label : key };
        });
      },
    },
    ruleMissingSelectedFields() {
      return this.ruleMissingSelectedKeys.map((key) => this.ruleFieldOptions.find((o) => o.key === key) || { key, label: key });
    },
    ruleDuplicateSelectedFields() {
      return this.ruleDuplicateSelectedKeys.map((key) => this.ruleDuplicateOptions.find((o) => o.key === key) || { key, label: key });
    },
  },
  mounted() {
    this.loadCleanRulesConfig();
  },
  methods: {
    filterFieldOption,
    loadCleanRulesConfig() {
      this.cleanRules = loadCleanRules();
      if (!this.cleanRules.some((r) => r.sourceCode === this.activeRuleSource)) {
        this.activeRuleSource = SOURCE_META[0]?.code || "offline_gate";
      }
    },
    goRepair() {
      this.$router.push("/abnormal-data-disposal");
    },
    selectRuleSource(code) {
      this.activeRuleSource = code;
      this.newErrorRuleFieldKey = "";
    },
    fieldOptionSearchLabel(opt) {
      return formatFieldOptionLabel(opt);
    },
    removeMissingField(key) {
      this.ruleMissingSelectedKeys = this.ruleMissingSelectedKeys.filter((k) => k !== key);
    },
    removeDuplicateField(key) {
      this.ruleDuplicateSelectedKeys = this.ruleDuplicateSelectedKeys.filter((k) => k !== key);
    },
    syncErrorRuleField(row, key) {
      const opt = getFieldOptionByKey(this.activeRuleSource, key);
      if (opt) {
        row.key = opt.key;
        row.label = opt.label;
      }
    },
    syncErrorRuleStartField(row, key) {
      const opt = getFieldOptionByKey(this.activeRuleSource, key);
      if (opt) {
        row.startKey = opt.key;
        row.startLabel = opt.label;
      }
    },
    needsErrorRefField(type) {
      return errorRuleNeedsRefField(type);
    },
    refFieldOptionsForRule(row) {
      return row.type === "time_order" || row.type === "same_calendar_day" ? this.timeLikeFieldOptions : this.ruleFieldOptions;
    },
    onErrorRuleTypeChange(row, type) {
      if (!errorRuleNeedsRefField(type)) {
        row.startKey = undefined;
        row.startLabel = undefined;
      }
    },
    saveCleanRuleConfig() {
      const rule = this.activeCleanRule;
      if (!rule) return;
      if (rule.missing.enabled && !rule.missing.fields.length) {
        this.$message.warning("请至少选择一个必填字段，或关闭缺失值检测");
        return;
      }
      if (rule.duplicate.enabled && !rule.duplicate.keyFields.length) {
        this.$message.warning("请至少选择一个重复判定字段，或关闭重复检测");
        return;
      }
      this.cleanRules = saveCleanRules(this.cleanRules, "当前用户");
      this.$message.success(`「${rule.sourceName}」清洗规则已保存并应用`);
    },
    resetCurrentCleanRule() {
      const code = this.activeRuleSource;
      const idx = this.cleanRules.findIndex((r) => r.sourceCode === code);
      if (idx < 0) return;
      this.$confirm("确定恢复该数据源的默认清洗规则？", "提示", { type: "warning" })
        .then(() => {
          const next = [...this.cleanRules];
          next[idx] = buildDefaultRule(code);
          this.cleanRules = saveCleanRules(next, "当前用户");
          this.$message.success("已恢复默认规则");
        })
        .catch(() => {});
    },
    addErrorRule() {
      const rule = this.activeCleanRule;
      if (!rule || !this.newErrorRuleFieldKey) {
        this.$message.warning("请选择要添加规则的字段");
        return;
      }
      const opt = getFieldOptionByKey(this.activeRuleSource, this.newErrorRuleFieldKey);
      if (!opt) return;
      if (rule.error.rules.some((r) => r.key === opt.key && r.type === this.newErrorRuleType)) {
        this.$message.warning("该字段下已存在相同类型的规则");
        return;
      }
      const item = { key: opt.key, label: opt.label, type: this.newErrorRuleType, enabled: true };
      if (errorRuleNeedsRefField(this.newErrorRuleType)) {
        const start = this.refFieldOptionsForRule(item).find((f) => f.key !== opt.key);
        if (start) {
          item.startKey = start.key;
          item.startLabel = start.label;
        }
      }
      rule.error.rules.push(item);
      this.newErrorRuleFieldKey = "";
    },
    removeErrorRule(index) {
      this.activeCleanRule.error.rules.splice(index, 1);
    },
  },
};
</script>

<style scoped src="../styles/sensing-clean-panel.css"></style>
