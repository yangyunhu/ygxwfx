<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">数据处理与转换</h2>
        <p class="page-desc">
          将外部数据转换为系统内部格式，映射至标准表字段，供无感考勤规则链使用。
        </p>
      </div>
      <el-button size="small" icon="el-icon-refresh-left" @click="resetMapping"
        >恢复默认映射</el-button
      >
    </div>

    <div class="stats-row">
      <span
        >映射规则 <strong>{{ mapping.length }}</strong></span
      >
      <span
        >已映射 <strong>{{ mappedCount }}</strong></span
      >
      <span
        >已转换 <strong>{{ attendanceRows.length }}</strong> 条</span
      >
      <span
        >标准字段 <strong>{{ targetFields.length }}</strong></span
      >
    </div>

    <section class="config-card mapping-section">
      <div class="card-title">字段映射配置（外部 → 标准表）</div>
      <div class="panel-tip">
        <i class="el-icon-info"></i>
        按外部 API
        字段与标准表字段建立映射（数据源为八类无感数据）；支持手动新增、编辑与删除映射关系，保存后参与数据转换。
      </div>
      <div class="mapping-toolbar">
        <el-button
          type="primary"
          icon="el-icon-plus"
          size="small"
          @click="openAddMappingDialog"
        >
          新增映射
        </el-button>
        <el-select
          v-model="mappingSourceFilter"
          placeholder="筛选数据源"
          clearable
          size="small"
          style="width: 280px"
        >
          <el-option
            v-for="s in sourceOptions"
            :key="s"
            :label="s"
            :value="s"
          />
        </el-select>
        <span v-if="mappingSourceFilter" class="mapping-filter-count">
          共 {{ filteredMapping.length }} 条
        </span>
        <span class="mapping-toolbar-hint">新增映射保存后立即参与转换</span>
      </div>
      <el-table :data="filteredMapping" border stripe size="small">
        <el-table-column type="index" label="序号" width="55" />
        <el-table-column
          prop="source"
          label="数据源"
          width="140"
          show-overflow-tooltip
        />
        <el-table-column
          prop="externalField"
          label="外部字段"
          width="120"
          show-overflow-tooltip
        />
        <el-table-column label="" width="40" align="center">→</el-table-column>
        <el-table-column
          prop="targetField"
          label="标准字段"
          width="120"
          show-overflow-tooltip
        />
        <el-table-column
          prop="label"
          label="说明"
          width="140"
          show-overflow-tooltip
        />
        <el-table-column label="必填" width="60" align="center">
          <template>
            <el-tag size="mini" type="danger">是</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          label="映射状态"
          width="90"
          align="center"
        >
          <template slot-scope="{ row }">
            <el-tag
              :type="row.status === '已映射' ? 'success' : 'warning'"
              size="small"
            >
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template slot-scope="{ row }">
            <el-button
              type="text"
              size="small"
              @click="openEditMappingDialog(row)"
              >编辑</el-button
            >
            <el-button
              type="text"
              size="small"
              class="btn-text-danger"
              @click="deleteMapping(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <el-button
        size="small"
        type="primary"
        plain
        style="margin-top: 12px"
        @click="persistMapping"
        >保存映射</el-button
      >
    </section>

    <section class="config-card standard-fields-section">
      <div class="card-head standard-fields-section__head">
        <div class="card-title card-title-inline">标准表字段说明</div>
        <span class="standard-fields-count"
          >共 {{ targetFields.length }} 项，均为必填</span
        >
      </div>
      <div class="standard-fields-grid">
        <div
          v-for="field in targetFields"
          :key="field.key"
          class="standard-field-item"
        >
          <div class="standard-field-item__main">
            <span class="standard-field-item__label">{{ field.label }}</span>
            <code class="standard-field-item__key">{{ field.key }}</code>
          </div>
          <el-tag type="danger" size="mini">必填</el-tag>
        </div>
      </div>
    </section>

    <section class="config-card">
      <div class="card-head">
        <div class="card-title" style="margin: 0; border: none; padding: 0">
          转换结果预览
        </div>
        <el-button size="small" type="primary" @click="runTransform"
          >执行转换（示例数据）</el-button
        >
      </div>
      <div class="preview-table-wrap">
        <el-table
          :data="previewRows"
          border
          size="small"
          :style="{ width: '100%', minWidth: previewTableMinWidth + 'px' }"
          empty-text="暂无转换数据，请先在「数据接收与解析」接入数据"
        >
          <el-table-column type="index" label="序号" width="55" fixed="left" />
          <el-table-column
            v-for="col in standardPreviewColumns"
            :key="col.prop"
            :prop="col.prop"
            :label="col.label"
            width="120"
            show-overflow-tooltip
          />
        </el-table>
      </div>
    </section>

    <section
      v-if="transformResult && transformResult.failed.length"
      class="config-card"
    >
      <div class="card-title">转换失败记录</div>
      <el-table :data="transformResult.failed" border size="small">
        <el-table-column prop="index" label="序号" width="60" />
        <el-table-column label="错误" min-width="280">
          <template slot-scope="{ row }">{{ row.errors.join("；") }}</template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog
      :title="mappingDialogTitle"
      :visible.sync="showMappingDialog"
      width="520px"
      append-to-body
      @close="resetMappingForm"
    >
      <el-form
        ref="mappingFormRef"
        :model="mappingForm"
        :rules="mappingFormRules"
        label-width="100px"
        size="small"
      >
        <el-form-item label="数据源" prop="source">
          <el-select
            v-model="mappingForm.source"
            placeholder="请选择数据源"
            filterable
            style="width: 100%"
            @change="onMappingSourceChange"
          >
            <el-option
              v-for="s in sourceOptions"
              :key="s"
              :label="s"
              :value="s"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="外部字段" prop="externalField">
          <el-select
            v-model="mappingForm.externalField"
            placeholder="请选择或输入外部字段"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option
              v-for="f in mappingExternalFieldOptions"
              :key="f"
              :label="f"
              :value="f"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标准字段" prop="targetField">
          <el-select
            v-model="mappingForm.targetField"
            placeholder="请选择或输入标准字段"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
            @change="onMappingTargetChange"
          >
            <el-option
              v-for="t in standardTargetOptions"
              :key="t.label"
              :label="t.label"
              :value="t.label"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="字段标识" prop="prop">
          <el-input
            v-model="mappingForm.prop"
            placeholder="自动生成，可手动调整"
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showMappingDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMappingDialog">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getAccessSourceFieldLabelsByName } from "../utils/sensingAccessSchemas";
import {
  ATTENDANCE_TABLE_FIELDS,
  loadFieldMapping,
  saveFieldMapping,
  resetFieldMapping,
  loadAttendanceBuffer,
  transformToAttendanceTable,
  createExternalFieldMapping,
  resolveExternalMappingProp,
  SENSING_SOURCE_NAMES,
  SAMPLE_PAYLOAD,
  parseExternalPayload,
} from "../utils/externalApiManagement";
import {
  STANDARD_TABLE_FIELDS,
  normalizeToStandardRow,
} from "../utils/standardTableFields";

export default {
  name: "ExternalApiTransform",
  data() {
    return {
      mapping: loadFieldMapping(),
      targetFields: ATTENDANCE_TABLE_FIELDS,
      attendanceRows: loadAttendanceBuffer(),
      transformResult: null,
      mappingSourceFilter: "",
      showMappingDialog: false,
      mappingDialogMode: "add",
      mappingForm: {
        id: "",
        source: "",
        externalField: "",
        targetField: "",
        prop: "",
      },
      mappingFormRules: {
        source: [
          { required: true, message: "请选择数据源", trigger: "change" },
        ],
        externalField: [
          { required: true, message: "请填写外部字段", trigger: "change" },
        ],
        targetField: [
          { required: true, message: "请选择标准字段", trigger: "change" },
        ],
      },
    };
  },
  computed: {
    sourceOptions() {
      return SENSING_SOURCE_NAMES;
    },
    mappingExternalFieldOptions() {
      const sourceFields = getAccessSourceFieldLabelsByName(
        this.mappingForm.source,
      );
      const mappedFields = this.mapping
        .filter((m) => m.source === this.mappingForm.source)
        .map((m) => m.externalField);
      return [...new Set([...sourceFields, ...mappedFields])];
    },
    standardTargetOptions() {
      return STANDARD_TABLE_FIELDS.map((f) => ({
        label: f.label,
        prop: f.prop,
      }));
    },
    filteredMapping() {
      if (!this.mappingSourceFilter) return this.mapping;
      return this.mapping.filter((m) => m.source === this.mappingSourceFilter);
    },
    mappedCount() {
      return this.mapping.filter((m) => m.status === "已映射").length;
    },
    mappingDialogTitle() {
      return this.mappingDialogMode === "add" ? "新增字段映射" : "编辑字段映射";
    },
    standardPreviewColumns() {
      return STANDARD_TABLE_FIELDS.map((f) => ({
        prop: f.prop,
        label: f.label,
      }));
    },
    previewTableMinWidth() {
      return 55 + this.standardPreviewColumns.length * 140;
    },
    previewRows() {
      return this.attendanceRows
        .slice(0, 20)
        .map((row) => normalizeToStandardRow(row));
    },
  },
  mounted() {
    this.reload();
  },
  methods: {
    reload() {
      this.mapping = loadFieldMapping();
      this.attendanceRows = loadAttendanceBuffer();
    },
    persistMapping() {
      saveFieldMapping(this.mapping);
      this.$message.success("映射已保存");
    },
    resetMapping() {
      this.$confirm("确定恢复为默认映射配置？", "提示", { type: "warning" })
        .then(() => {
          this.mapping = resetFieldMapping();
          this.$message.success("已恢复默认映射");
        })
        .catch(() => {});
    },
    openAddMappingDialog() {
      this.mappingDialogMode = "add";
      this.resetMappingForm();
      this.showMappingDialog = true;
    },
    openEditMappingDialog(row) {
      this.mappingDialogMode = "edit";
      this.mappingForm = {
        id: row.id,
        source: row.source,
        externalField: row.externalField,
        targetField: row.targetField,
        prop: row.prop,
      };
      this.showMappingDialog = true;
    },
    resetMappingForm() {
      this.mappingForm = {
        id: "",
        source: SENSING_SOURCE_NAMES[0] || "闸机门禁数据",
        externalField: "",
        targetField: "",
        prop: "",
      };
      if (this.$refs.mappingFormRef) {
        this.$refs.mappingFormRef.clearValidate();
      }
    },
    onMappingSourceChange() {
      this.mappingForm.externalField = "";
    },
    onMappingTargetChange(val) {
      this.mappingForm.prop = resolveExternalMappingProp(
        val,
        this.mapping.filter((m) => m.id !== this.mappingForm.id),
      );
    },
    saveMappingDialog() {
      const form = this.$refs.mappingFormRef;
      if (!form) return;
      form.validate((valid) => {
        if (!valid) return;
        const result = createExternalFieldMapping(
          {
            ...this.mappingForm,
            status: "已映射",
            isManual: this.mappingDialogMode === "add",
          },
          this.mapping,
        );
        if (!result.ok) {
          this.$message.warning(result.message);
          return;
        }
        if (this.mappingDialogMode === "add") {
          this.mapping.push(result.mapping);
          this.$message.success("映射已新增");
        } else {
          const idx = this.mapping.findIndex((m) => m.id === result.mapping.id);
          if (idx >= 0) {
            this.$set(this.mapping, idx, result.mapping);
            this.$message.success("映射已更新");
          }
        }
        saveFieldMapping(this.mapping);
        this.showMappingDialog = false;
      });
    },
    deleteMapping(row) {
      this.$confirm(
        `确定删除映射「${row.externalField} → ${row.targetField}」？`,
        "提示",
        {
          type: "warning",
        },
      )
        .then(() => {
          this.mapping = this.mapping.filter((m) => m.id !== row.id);
          saveFieldMapping(this.mapping);
          this.$message.success("已删除映射");
        })
        .catch(() => {});
    },
    runTransform() {
      const parsed = parseExternalPayload(SAMPLE_PAYLOAD);
      if (!parsed.records) return;
      this.transformResult = transformToAttendanceTable(
        parsed.records,
        this.mapping,
        {
          batchId: parsed.batchId,
          sourceName: "示例转换",
        },
      );
      this.attendanceRows = [
        ...this.transformResult.rows,
        ...this.attendanceRows,
      ];
      this.$message.success(
        `转换完成：成功 ${this.transformResult.successCount} 条，失败 ${this.transformResult.failCount} 条`,
      );
    },
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
<style scoped>
/* 修复布局，确保页面不会被左侧菜单遮挡，并且不会超出右边屏幕 */
.perm-page {
  padding: 20px;
  background: #f0f2f5;
  min-height: 100%;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.mapping-section {
  padding-bottom: 16px;
}
.panel-tip {
  margin: 0 0 12px;
  padding: 10px 14px;
  font-size: 13px;
  color: #606266;
  background: #ecf5ff;
  border-radius: 4px;
}
.panel-tip i {
  color: #409eff;
  margin-right: 6px;
}
.mapping-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.mapping-toolbar-hint {
  font-size: 12px;
  color: #909399;
}
.mapping-filter-count {
  font-size: 12px;
  color: #606266;
}
.btn-text-danger {
  color: #f56c6c;
}
.btn-text-danger:hover {
  color: #f78989;
}
.standard-fields-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.card-title-inline {
  margin: 0;
  border: none;
  padding: 0;
}
.standard-fields-count {
  font-size: 12px;
  color: #909399;
}
.standard-fields-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.standard-field-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  min-height: 44px;
}
.standard-field-item__main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.standard-field-item__label {
  font-size: 12px;
  color: #303133;
  font-weight: 500;
}
.standard-field-item__key {
  font-size: 10px;
  color: #909399;
  background: #f0f2f5;
  padding: 1px 4px;
  border-radius: 2px;
}
@media (max-width: 640px) {
  .standard-fields-grid {
    grid-template-columns: 1fr;
  }
}
.preview-table-wrap {
  overflow-x: auto;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}
</style>
