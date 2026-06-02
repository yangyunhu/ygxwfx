<template>
  <div class="business-rule-panel">
    <div class="func-desc">
      <p>{{ meta.desc }}</p>
      <p class="form-tip">输出目标：<strong>{{ meta.outputTable }}</strong>，共 {{ meta.levels }} 层规则链</p>
      <p v-if="catalogId === 'attendance'" class="form-tip flow-tip">
        规则链按层级自上而下执行：某层校验通过但无数据时自动进入下一层。
        第 1–6 层结果写入<strong>无感考勤表</strong>，第 7–9 层结果写入<strong>异常考勤校验表</strong>。
      </p>
      <p v-if="catalogId === 'abnormal'" class="form-tip flow-tip">
        校验按层级自上而下执行：某层发现异常即停止后续校验，结果写入<strong>异常考勤校验表</strong>。
        第 4、5 层需满足连续工作日阈值（X）方判定为异常。
      </p>
      <p v-if="catalogId === 'hours_mgmt'" class="form-tip flow-tip">
        以<strong>无感考勤表</strong>考勤类型为前提，按层级自上而下匹配：培训→出差→闸机→登录；
        某层无数据时自动进入下一层，结果写入<strong>工时统计表（管理类/专业技术类）</strong>。
      </p>
      <p v-if="catalogId === 'hours_skill'" class="form-tip flow-tip">
        以<strong>无感考勤表</strong>考勤类型为前提，按层级自上而下匹配：培训→工作票→出差→闸机→登录；
        某层无数据时自动进入下一层，结果写入<strong>工时统计表（技能类）</strong>。
      </p>
    </div>

    <el-form label-width="120px" size="small" class="rules-form">
      <el-form-item label="规则总开关">
        <el-switch v-model="localConfig.enabled" active-text="启用" inactive-text="停用" />
      </el-form-item>

      <template v-if="localConfig.workConfig">
        <el-divider content-position="left">考勤时间参数</el-divider>
        <el-form-item label="上岗时间">
          <el-time-picker
            v-model="localConfig.workConfig.arrivalTime"
            value-format="HH:mm"
            format="HH:mm"
            placeholder="上岗时间"
            style="width: 160px"
          />
          <span class="field-hint">{{ workTimeHint }}</span>
        </el-form-item>
        <el-form-item label="离岗时间">
          <el-time-picker
            v-model="localConfig.workConfig.departureTime"
            value-format="HH:mm"
            format="HH:mm"
            placeholder="离岗时间"
            style="width: 160px"
          />
          <span class="field-hint">{{ departureTimeHint }}</span>
        </el-form-item>
        <el-form-item
          v-if="catalogId === 'attendance' || catalogId === 'abnormal'"
          label="连续工作日阈值"
        >
          <el-input-number
            v-model="localConfig.workConfig.loginLateConsecutiveDays"
            :min="1"
            :max="30"
            style="width: 160px"
          />
          <span class="field-hint">{{ consecutiveDaysHint }}</span>
        </el-form-item>
      </template>

      <template v-if="localConfig.hoursParams">
        <el-divider content-position="left">工时计算参数</el-divider>
        <el-form-item label="培训默认工时(h)">
          <el-input-number
            v-model="localConfig.hoursParams.trainingHoursDefault"
            :min="0"
            :max="24"
            :step="0.5"
            :precision="1"
            style="width: 160px"
          />
          <span v-if="catalogId === 'hours_mgmt'" class="field-hint">第 1 层无课表时长时的兜底值</span>
          <span v-if="catalogId === 'hours_skill'" class="field-hint">技能第 1 层无课表时长时的兜底值</span>
        </el-form-item>
        <el-form-item label="出差工时(h/天)">
          <el-input-number
            v-model="localConfig.hoursParams.travelHoursPerDay"
            :min="0"
            :max="24"
            :step="0.5"
            :precision="1"
            style="width: 160px"
          />
          <span v-if="catalogId === 'hours_mgmt'" class="field-hint">对应第 2 层出差工时</span>
          <span v-if="catalogId === 'hours_skill'" class="field-hint">技能第 3 层出差工时</span>
        </el-form-item>
        <el-form-item v-if="catalogId === 'hours_skill'" label="工作票兜底工时(h)">
          <el-input-number
            v-model="localConfig.hoursParams.workTicketHoursDefault"
            :min="0"
            :max="24"
            :step="0.5"
            :precision="1"
            style="width: 160px"
          />
          <span class="field-hint">技能第 2 层无起止时长时的默认值</span>
        </el-form-item>
        <template v-if="catalogId === 'hours_mgmt' || catalogId === 'hours_skill'">
          <el-form-item label="登录起算时间">
            <el-time-picker
              v-model="localConfig.hoursParams.loginEarliestAfter"
              value-format="HH:mm"
              format="HH:mm"
              placeholder="08:00"
              style="width: 160px"
            />
            <span class="field-hint">登录工时层：该时间之后的最早登录作为起算点</span>
          </el-form-item>
          <el-form-item label="登录截止窗口">
            <el-time-picker
              v-model="localConfig.hoursParams.loginLatestFrom"
              value-format="HH:mm"
              format="HH:mm"
              placeholder="18:00"
              style="width: 120px"
            />
            <span class="field-hint" style="margin-left: 8px; margin-right: 8px">至</span>
            <el-time-picker
              v-model="localConfig.hoursParams.loginLatestTo"
              value-format="HH:mm"
              format="HH:mm"
              placeholder="22:00"
              style="width: 120px"
            />
            <span class="field-hint">登录工时层：窗口内最晚登录作为截止点</span>
          </el-form-item>
        </template>
        <el-form-item v-if="catalogId === 'hours_skill'" label="登录兜底工时(h)">
          <el-input-number
            v-model="localConfig.hoursParams.loginHoursPerDay"
            :min="0"
            :max="24"
            :step="0.5"
            :precision="1"
            style="width: 160px"
          />
          <span class="field-hint">技能第 5 层无法按登录窗口计算时的默认值</span>
        </el-form-item>
        <el-form-item v-if="catalogId === 'hours_mgmt'" label="登录兜底工时(h)">
          <el-input-number
            v-model="localConfig.hoursParams.loginHoursPerDay"
            :min="0"
            :max="24"
            :step="0.5"
            :precision="1"
            style="width: 160px"
          />
          <span class="field-hint">第 4 层无法按登录窗口计算时的默认值</span>
        </el-form-item>
      </template>

      <el-divider content-position="left">规则层级</el-divider>
      <el-table :data="localConfig.layers" border size="small" class="layer-rules-table">
        <el-table-column prop="level" label="层级" width="60" align="center" fixed="left" />
        <el-table-column prop="name" label="规则名称" min-width="100" fixed="left" />
        <el-table-column prop="source" label="数据源" min-width="120" show-overflow-tooltip />
        <el-table-column prop="logic" label="业务实现逻辑" min-width="220" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <span class="logic-text">{{ row.logic || "—" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="关键字段" min-width="180">
          <template slot-scope="{ row }">
            <div class="layer-key-fields">
              <el-tag
                v-for="f in row.keyFields"
                :key="f"
                size="mini"
                type="primary"
                effect="plain"
                class="selected-field-tag"
              >
                {{ f }}
              </el-tag>
              <span v-if="!row.keyFields || !row.keyFields.length" class="text-muted">—</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="output" label="输出类型" width="90" show-overflow-tooltip />
        <el-table-column prop="targetTable" label="输出目标" width="130" show-overflow-tooltip>
          <template slot-scope="{ row }">
            <el-tag
              v-if="row.targetTable"
              size="mini"
              :type="row.targetTable === '无感考勤表' ? 'success' : 'warning'"
              effect="plain"
            >
              {{ row.targetTable }}
            </el-tag>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="70" align="center">
          <template slot-scope="{ row }">
            <el-switch v-model="row.enabled" :disabled="!localConfig.enabled" />
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="120">
          <template slot-scope="{ row }">
            <el-input
              v-model="row.remark"
              size="mini"
              placeholder="可选说明"
              :disabled="!localConfig.enabled"
            />
          </template>
        </el-table-column>
      </el-table>

      <div class="rules-actions">
        <el-button type="primary" @click="handleSave">保存规则</el-button>
        <el-button @click="handleReset">恢复默认</el-button>
        <span v-if="localConfig.updateTime" class="rules-save-meta">
          最近更新：{{ localConfig.updateTime }} · {{ localConfig.operator }}
        </span>
      </div>
    </el-form>
  </div>
</template>

<script>
import {
  BUSINESS_RULE_TABS,
  buildDefaultBusinessRuleConfig,
  getBusinessRuleConfig,
  saveBusinessRuleConfig,
} from "../utils/businessRuleSettings";

export default {
  name: "BusinessRulePanel",
  props: {
    catalogId: { type: String, required: true },
    allConfigs: { type: Object, default: null },
  },
  data() {
    return {
      localConfig: buildDefaultBusinessRuleConfig(this.catalogId),
    };
  },
  computed: {
    meta() {
      return (
        BUSINESS_RULE_TABS.find((t) => t.catalogId === this.catalogId) || {
          desc: "",
          outputTable: "",
          levels: 0,
        }
      );
    },
    workTimeHint() {
      if (this.catalogId === "abnormal") return "对应第 2、4 层闸机/登录迟到判定";
      return "对应规则第 4–6 层闸机判定、第 7–8 层登录判定";
    },
    departureTimeHint() {
      if (this.catalogId === "abnormal") return "对应第 3 层闸机早退判定";
      return "对应规则第 4、7 层离岗窗口判定";
    },
    consecutiveDaysHint() {
      if (this.catalogId === "abnormal") {
        return "对应第 4 层登录连续迟到、第 5 层在岗证据不足";
      }
      return "对应规则第 8 层：X 个工作日内最早登录均晚于上岗时间";
    },
  },
  watch: {
    catalogId: {
      immediate: true,
      handler(id) {
        this.loadConfig(id);
      },
    },
    allConfigs: {
      deep: true,
      handler() {
        this.loadConfig(this.catalogId);
      },
    },
  },
  methods: {
    loadConfig(catalogId) {
      this.localConfig = JSON.parse(
        JSON.stringify(getBusinessRuleConfig(catalogId, this.allConfigs))
      );
    },
    handleSave() {
      const enabledLayers = (this.localConfig.layers || []).filter((l) => l.enabled);
      if (this.localConfig.enabled && !enabledLayers.length) {
        this.$message.warning("请至少启用一层规则，或关闭规则总开关");
        return;
      }
      const saved = saveBusinessRuleConfig(this.catalogId, this.localConfig, "当前用户");
      this.localConfig = JSON.parse(JSON.stringify(saved));
      this.$emit("saved", this.catalogId);
      this.$message.success(`「${this.meta.name || this.catalogId}」已保存`);
    },
    handleReset() {
      this.$confirm("确定恢复该规则的默认配置？", "提示", { type: "warning" })
        .then(() => {
          this.localConfig = buildDefaultBusinessRuleConfig(this.catalogId);
          const saved = saveBusinessRuleConfig(this.catalogId, this.localConfig, "当前用户");
          this.localConfig = JSON.parse(JSON.stringify(saved));
          this.$emit("saved", this.catalogId);
          this.$message.success("已恢复默认");
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.business-rule-panel {
  padding: 0 4px;
}

.layer-rules-table {
  margin-bottom: 16px;
}

.layer-key-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.layer-key-fields .selected-field-tag {
  background-color: #fff;
  border-color: #b3d8ff;
  color: #409eff;
}

.rules-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.rules-save-meta {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}

.text-muted {
  color: #c0c4cc;
}

.form-tip {
  margin: 4px 0 0;
  font-size: 12px;
  color: #909399;
}

.flow-tip {
  color: #e6a23c;
  background: #fdf6ec;
  padding: 8px 12px;
  border-radius: 4px;
  line-height: 1.6;
}

.field-hint {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

.logic-text {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}
</style>
