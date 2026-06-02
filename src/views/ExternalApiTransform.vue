<template>
  <div class="perm-page">
    <!-- 字段映射配置区 -->
    <el-card class="section-card" shadow="hover">
      <div slot="header" class="card-header">
        <span class="card-title">
          <i class="el-icon-s-grid"></i>
          字段映射配置
        </span>
        <span class="card-subtitle">外部字段 → 标准字段</span>
      </div>

      <!-- 功能说明 -->
      <el-alert
        title="功能说明"
        type="info"
        :closable="false"
        show-icon
        class="section-tip"
      >
        按外部 API
        字段与标准表字段建立映射（数据源为八类无感数据）；支持手动新增、编辑与删除映射关系，保存后参与数据转换。
      </el-alert>

      <!-- 工具栏 -->
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
        <el-tag
          v-if="mappingSourceFilter"
          type="info"
          size="small"
          effect="plain"
        >
          共 {{ filteredMapping.length }} 条
        </el-tag>
        <span class="toolbar-hint">
          <i class="el-icon-info"></i>
          新增映射保存后立即参与转换
        </span>
      </div>

      <!-- 映射表格 -->
      <div class="table-wrapper">
        <el-table
          :data="filteredMapping"
          border
          stripe
          size="small"
          :header-cell-style="{
            background: '#f5f7fa',
            color: '#606266',
            fontWeight: '600',
          }"
          class="mapping-table"
        >
          <el-table-column
            type="index"
            label="序号"
            width="50"
            align="center"
            fixed="left"
          />
          <el-table-column
            prop="source"
            label="数据源"
            width="110"
            show-overflow-tooltip
            fixed="left"
          >
            <template slot-scope="{ row }">
              <el-tag size="mini" effect="plain">{{ row.source }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column
            prop="externalField"
            label="外部字段"
            width="130"
            show-overflow-tooltip
          >
            <template slot-scope="{ row }">
              <code class="field-code">{{ row.externalField }}</code>
            </template>
          </el-table-column>
          <el-table-column label="" width="30" align="center">
            <template>
              <i class="el-icon-right arrow-icon"></i>
            </template>
          </el-table-column>
          <el-table-column
            prop="targetField"
            label="标准字段"
            width="120"
            show-overflow-tooltip
          >
            <template slot-scope="{ row }">
              <span class="target-field">{{ row.targetField }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="label"
            label="说明"
            width="250"
            show-overflow-tooltip
          />
          <el-table-column label="必填" width="60" align="center">
            <template>
              <el-tag size="mini" type="danger" effect="plain">必填</el-tag>
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
                effect="light"
              >
                <i
                  :class="
                    row.status === '已映射'
                      ? 'el-icon-success'
                      : 'el-icon-warning'
                  "
                ></i>
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="110" align="center">
            <template slot-scope="{ row }">
              <el-button
                type="text"
                size="small"
                icon="el-icon-edit"
                @click="openEditMappingDialog(row)"
                >编辑</el-button
              >
              <el-button
                type="text"
                size="small"
                icon="el-icon-delete"
                class="btn-text-danger"
                @click="deleteMapping(row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 操作按钮 -->
      <div class="table-actions">
        <el-button type="primary" icon="el-icon-check" @click="persistMapping">
          保存映射
        </el-button>
        <el-tag
          type="info"
          size="small"
          effect="plain"
          style="margin-left: 12px"
        >
          <i class="el-icon-timer"></i>
          保存后自动生效
        </el-tag>
      </div>
    </el-card>

    <!-- 转换结果预览区 -->
    <el-card class="section-card" shadow="hover">
      <div slot="header" class="card-header">
        <span class="card-title">
          <i class="el-icon-view"></i>
          转换结果预览
        </span>
        <el-button
          size="small"
          type="primary"
          icon="el-icon-refresh"
          @click="runTransform"
        >
          执行转换
        </el-button>
      </div>

      <!-- 空状态提示 -->
      <el-empty
        v-if="!previewRows || previewRows.length === 0"
        description="暂无转换数据，请先在「数据接收与解析」接入数据"
        :image-size="120"
      >
        <el-button type="primary" size="small" @click="runTransform">
          加载示例数据
        </el-button>
      </el-empty>

      <!-- 预览表格 -->
      <el-table
        v-else
        :data="previewRows"
        border
        stripe
        size="small"
        :header-cell-style="{
          background: '#f5f7fa',
          color: '#606266',
          fontWeight: '600',
        }"
        :style="{ width: '100%', minWidth: previewTableMinWidth + 'px' }"
        class="preview-table"
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
    </el-card>

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
/* 页面头部卡片 */
.page-header-card {
  margin-bottom: 16px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.page-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.page-icon {
  font-size: 36px;
  color: #fff;
  margin-top: 4px;
  background: rgba(255, 255, 255, 0.2);
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.page-title {
  margin: 0 0 6px 0;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
}

.page-desc {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

/* 卡片通用样式 */
.section-card {
  margin-bottom: 16px;
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s;
}

.section-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title i {
  font-size: 18px;
  color: #409eff;
}

.card-subtitle {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

/* 提示信息 */
.section-tip {
  margin-bottom: 16px;
  border-radius: 6px;
}

/* 工具栏 */
.mapping-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  flex-wrap: wrap;
}

.toolbar-hint {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.toolbar-hint i {
  color: #409eff;
}

/* 表格样式 */
.table-wrapper {
  overflow-x: auto;
  overflow-y: visible;
  margin: 0 -16px;
  padding: 0 16px;
}

.mapping-table,
.preview-table {
  border-radius: 6px;
  overflow: hidden;
  min-width: 740px;
}

.mapping-table >>> .el-table__header,
.preview-table >>> .el-table__header {
  background: #f5f7fa;
}

.mapping-table >>> .el-table__body-wrapper {
  max-height: 600px;
  overflow-y: auto;
}

.field-code {
  background: #f5f7fa;
  color: #e6a23c;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  font-weight: 500;
}

.target-field {
  color: #409eff;
  font-weight: 500;
}

.arrow-icon {
  color: #c0c4cc;
  font-size: 16px;
}

/* 操作按钮 */
.btn-text-danger {
  color: #f56c6c;
}

.btn-text-danger:hover {
  color: #f78989;
}

.table-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 空状态 */
.preview-table >>> .el-empty {
  padding: 40px 0;
}

/* 警告卡片 */
.warning-card {
  border-left: 4px solid #e6a23c;
}

.warning-card >>> .el-card__header {
  background: #fdf6ec;
  border-bottom: 1px solid #faecd8;
}

/* 对话框样式 */
.el-dialog >>> .el-dialog__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px 20px;
  border-radius: 6px 6px 0 0;
}

.el-dialog >>> .el-dialog__title {
  color: #fff;
  font-weight: 600;
}

.el-dialog >>> .el-dialog__headerbtn .el-dialog__close {
  color: #fff;
  font-size: 18px;
}

.el-dialog >>> .el-dialog__body {
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-left {
    width: 100%;
  }

  .mapping-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-hint {
    margin-left: 0;
    justify-content: flex-start;
  }

  .mapping-toolbar .el-select,
  .mapping-toolbar .el-button {
    width: 100%;
  }
}

/* 动画效果 */
.section-card {
  animation: fadeInUp 0.4s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 标签样式优化 */
.mapping-table >>> .el-tag,
.mapping-toolbar >>> .el-tag {
  border-radius: 4px;
  font-weight: 500;
}

.mapping-toolbar >>> .el-tag--info.el-tag--plain {
  background: #f5f7fa;
  border-color: #dcdfe6;
  color: #909399;
}
</style>
