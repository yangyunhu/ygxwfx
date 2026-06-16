<template>
  <div class="data-collection-panel">
    <section class="panel-block">
      <h3 class="block-title"><span class="section-dot" />数据采集</h3>
      <el-form :inline="true" size="small" class="section-form">
        <el-form-item label="数据来源：">
          <el-select v-model="collectionQuery.dataSource" placeholder="请选择" style="width: 140px">
            <el-option v-for="opt in dataSourceOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据范围：">
          <el-select v-model="collectionQuery.dataRange" placeholder="请选择" style="width: 140px">
            <el-option v-for="opt in dataRangeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="专业：" class="form-item--specialty">
          <el-checkbox-group v-model="collectionQuery.specialties" class="specialty-checkboxes">
            <el-checkbox v-for="sp in specialtyOptions" :key="sp" :label="sp">{{ sp }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item class="section-form__actions">
          <el-button type="primary" icon="el-icon-search" @click="handleCollectionQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetCollectionQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="section-toolbar">
        <el-button type="primary" size="small" icon="el-icon-plus" @click="openCollectionDialog()">新增</el-button>
      </div>

      <el-table :data="filteredCollectionRows" border stripe size="small" header-cell-class-name="panel-table-header">
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="dataSourceLabel" label="数据来源" min-width="120" align="center" />
        <el-table-column prop="dataRangeLabel" label="数据范围" min-width="120" align="center" />
        <el-table-column prop="specialty" label="专业分类" width="110" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '启用' ? 'success' : 'info'" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="openCollectionDialog(scope.row)">编辑</el-button>
            <el-button type="text" size="small" class="danger-text" @click="handleCollectionDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <section class="panel-block">
      <h3 class="block-title"><span class="section-dot" />数据整合</h3>
      <el-form :inline="true" size="small" class="section-form">
        <el-form-item label="单位：">
          <el-select v-model="integrationQuery.unit" placeholder="请选择" style="width: 150px" clearable>
            <el-option v-for="opt in integrationUnitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门：">
          <el-select v-model="integrationQuery.department" placeholder="请选择" style="width: 140px" clearable>
            <el-option v-for="opt in integrationDeptOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="班组：">
          <el-select v-model="integrationQuery.team" placeholder="请选择" style="width: 130px" clearable>
            <el-option v-for="opt in integrationTeamOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="专业：">
          <el-select v-model="integrationQuery.specialty" placeholder="请选择" style="width: 120px" clearable>
            <el-option v-for="opt in integrationSpecialtyOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="人员姓名：">
          <el-input v-model="integrationQuery.personName" placeholder="请输入" style="width: 140px" clearable />
        </el-form-item>
        <el-form-item class="section-form__actions">
          <el-button type="primary" icon="el-icon-search" @click="handleIntegrationQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetIntegrationQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="section-toolbar">
        <el-button type="primary" size="small" icon="el-icon-plus" @click="openIntegrationDialog()">新增</el-button>
        <el-button size="small" icon="el-icon-edit" :disabled="!integrationSelection.length" @click="openIntegrationDialog(integrationSelection[0])">
          编辑
        </el-button>
        <el-button type="primary" plain size="small" icon="el-icon-download" @click="handleIntegrationExport">导出</el-button>
      </div>

      <el-table
        :data="filteredIntegrationRows"
        border
        stripe
        size="small"
        header-cell-class-name="panel-table-header"
        @selection-change="(rows) => { integrationSelection = rows; }"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column prop="unit" label="单位" min-width="130" show-overflow-tooltip />
        <el-table-column prop="department" label="部门" min-width="120" show-overflow-tooltip />
        <el-table-column prop="team" label="班组" min-width="110" show-overflow-tooltip />
        <el-table-column prop="name" label="姓名" width="100" align="center" />
        <el-table-column prop="specialty" label="专业分类" width="110" align="center" />
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="openIntegrationDialog(scope.row)">编辑</el-button>
            <el-button type="text" size="small" class="danger-text" @click="handleIntegrationDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog :title="collectionDialogTitle" :visible.sync="collectionDialogVisible" width="480px" append-to-body>
      <el-form :model="collectionForm" label-width="100px" size="small">
        <el-form-item label="数据来源" required>
          <el-select v-model="collectionForm.dataSource" style="width: 100%">
            <el-option v-for="opt in dataSourceOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据范围">
          <el-select v-model="collectionForm.dataRange" style="width: 100%">
            <el-option v-for="opt in dataRangeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="专业分类" required>
          <el-select v-model="collectionForm.specialty" style="width: 100%">
            <el-option v-for="sp in specialtyOptions" :key="sp" :label="sp" :value="sp" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="collectionForm.status">
            <el-radio label="启用">启用</el-radio>
            <el-radio label="停用">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="collectionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCollection">保存</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="integrationDialogTitle" :visible.sync="integrationDialogVisible" width="520px" append-to-body>
      <el-form :model="integrationForm" label-width="100px" size="small">
        <el-form-item label="单位" required>
          <el-input v-model="integrationForm.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-form-item label="部门" required>
          <el-select v-model="integrationForm.department" style="width: 100%">
            <el-option v-for="opt in integrationDeptOptions.filter((o) => o.value)" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="班组" required>
          <el-select v-model="integrationForm.team" style="width: 100%">
            <el-option v-for="opt in integrationTeamOptions.filter((o) => o.value)" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="integrationForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="专业分类" required>
          <el-select v-model="integrationForm.specialty" style="width: 100%">
            <el-option v-for="opt in integrationSpecialtyOptions.filter((o) => o.value)" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="integrationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveIntegration">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  DATA_SOURCE_OPTIONS,
  DATA_RANGE_OPTIONS,
  COLLECTION_SPECIALTY_OPTIONS,
  INTEGRATION_UNIT_OPTIONS,
  INTEGRATION_DEPARTMENT_OPTIONS,
  INTEGRATION_TEAM_OPTIONS,
  INTEGRATION_SPECIALTY_OPTIONS,
  DEFAULT_COLLECTION_QUERY,
  DEFAULT_INTEGRATION_QUERY,
  generateCollectionRows,
  filterCollectionRows,
  generateIntegrationRows,
  filterIntegrationRows,
  dataSourceLabel,
  dataRangeLabel,
} from "../utils/dataCollectionIntegrationData";
import { downloadTableWithLog } from "../utils/exportLogger";

export default {
  name: "DataCollectionIntegrationPanel",
  data() {
    return {
      dataSourceOptions: DATA_SOURCE_OPTIONS,
      dataRangeOptions: DATA_RANGE_OPTIONS,
      specialtyOptions: COLLECTION_SPECIALTY_OPTIONS,
      integrationUnitOptions: INTEGRATION_UNIT_OPTIONS,
      integrationDeptOptions: INTEGRATION_DEPARTMENT_OPTIONS,
      integrationTeamOptions: INTEGRATION_TEAM_OPTIONS,
      integrationSpecialtyOptions: INTEGRATION_SPECIALTY_OPTIONS,
      collectionQuery: { ...DEFAULT_COLLECTION_QUERY, specialties: [] },
      collectionAllRows: generateCollectionRows(),
      integrationQuery: { ...DEFAULT_INTEGRATION_QUERY },
      integrationAllRows: generateIntegrationRows(),
      integrationSelection: [],
      collectionDialogVisible: false,
      collectionForm: {},
      collectionEditingId: null,
      integrationDialogVisible: false,
      integrationForm: {},
      integrationEditingId: null,
    };
  },
  computed: {
    filteredCollectionRows() {
      return filterCollectionRows(this.collectionAllRows, this.collectionQuery);
    },
    filteredIntegrationRows() {
      return filterIntegrationRows(this.integrationAllRows, this.integrationQuery);
    },
    collectionDialogTitle() {
      return this.collectionEditingId ? "编辑数据采集" : "新增数据采集";
    },
    integrationDialogTitle() {
      return this.integrationEditingId ? "编辑数据整合" : "新增数据整合";
    },
  },
  methods: {
    handleCollectionQuery() {},
    resetCollectionQuery() {
      this.collectionQuery = { ...DEFAULT_COLLECTION_QUERY, specialties: [] };
    },
    openCollectionDialog(row) {
      if (row) {
        this.collectionEditingId = row.id;
        this.collectionForm = {
          dataSource: row.dataSource,
          dataRange: row.dataRange,
          specialty: row.specialty,
          status: row.status,
        };
      } else {
        this.collectionEditingId = null;
        this.collectionForm = {
          dataSource: "business",
          dataRange: "all",
          specialty: "信息",
          status: "启用",
        };
      }
      this.collectionDialogVisible = true;
    },
    saveCollection() {
      if (!this.collectionForm.specialty) {
        this.$message.warning("请选择专业分类");
        return;
      }
      const payload = {
        ...this.collectionForm,
        dataSourceLabel: dataSourceLabel(this.collectionForm.dataSource),
        dataRangeLabel: dataRangeLabel(this.collectionForm.dataRange),
      };
      if (this.collectionEditingId) {
        const idx = this.collectionAllRows.findIndex((r) => r.id === this.collectionEditingId);
        if (idx >= 0) this.$set(this.collectionAllRows, idx, { ...this.collectionAllRows[idx], ...payload });
      } else {
        const newId = Math.max(0, ...this.collectionAllRows.map((r) => r.id)) + 1;
        this.collectionAllRows.unshift({ id: newId, ...payload });
      }
      this.collectionDialogVisible = false;
      this.$message.success("保存成功");
    },
    handleCollectionDelete(row) {
      this.$confirm(`确定删除「${row.dataSourceLabel} · ${row.specialty}」配置？`, "提示", { type: "warning" })
        .then(() => {
          this.collectionAllRows = this.collectionAllRows.filter((r) => r.id !== row.id);
          this.$message.success("已删除");
        })
        .catch(() => {});
    },
    handleIntegrationQuery() {
      this.integrationSelection = [];
    },
    resetIntegrationQuery() {
      this.integrationQuery = { ...DEFAULT_INTEGRATION_QUERY };
      this.integrationSelection = [];
    },
    openIntegrationDialog(row) {
      if (row) {
        this.integrationEditingId = row.id;
        this.integrationForm = { ...row };
      } else {
        this.integrationEditingId = null;
        this.integrationForm = {
          unit: "XXXXX公司",
          department: "运维部",
          team: "电气一班",
          name: "",
          specialty: "电气",
        };
      }
      this.integrationDialogVisible = true;
    },
    saveIntegration() {
      if (!this.integrationForm.unit || !this.integrationForm.name) {
        this.$message.warning("请完善整合信息");
        return;
      }
      const payload = { ...this.integrationForm };
      if (this.integrationEditingId) {
        const idx = this.integrationAllRows.findIndex((r) => r.id === this.integrationEditingId);
        if (idx >= 0) this.$set(this.integrationAllRows, idx, { ...this.integrationAllRows[idx], ...payload });
      } else {
        const newId = Math.max(0, ...this.integrationAllRows.map((r) => r.id)) + 1;
        this.integrationAllRows.unshift({ id: newId, ...payload });
      }
      this.integrationDialogVisible = false;
      this.$message.success("保存成功");
    },
    handleIntegrationDelete(row) {
      this.$confirm(`确定删除「${row.name}」整合记录？`, "提示", { type: "warning" })
        .then(() => {
          this.integrationAllRows = this.integrationAllRows.filter((r) => r.id !== row.id);
          this.$message.success("已删除");
        })
        .catch(() => {});
    },
    handleIntegrationExport() {
      const source = this.filteredIntegrationRows;
      if (!source.length) {
        this.$message.warning("暂无可导出数据");
        return;
      }
      downloadTableWithLog({
        headers: ["单位", "部门", "班组", "姓名", "专业分类"],
        rows: source.map((r) => [r.unit, r.department, r.team, r.name, r.specialty]),
        format: "csv",
        baseFilename: "数据整合明细",
        meta: {
          moduleCode: "data_integration",
          moduleName: "数据整合",
          moduleGroup: "智能分析模型管理",
          searchCriteria: { ...this.integrationQuery },
        },
      });
      this.$message.success(`已导出 ${source.length} 条记录`);
    },
  },
};
</script>

<style scoped>
.data-collection-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-width: 0;
}

.panel-block {
  padding: 14px 16px 16px;
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.block-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.section-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1890ff;
  flex-shrink: 0;
}

.section-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f2f5;
}

.section-form >>> .el-form-item {
  margin-bottom: 8px;
}

.section-form__actions {
  margin-left: auto;
}

.form-item--specialty {
  flex: 1 1 100%;
  min-width: 0;
}

.specialty-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  max-width: 100%;
}

.specialty-checkboxes >>> .el-checkbox {
  margin-right: 0;
}

.section-toolbar {
  margin-bottom: 12px;
}

.panel-block >>> .panel-table-header {
  background: #e8f4ff !important;
  color: #303133;
  font-weight: 500;
}

.danger-text {
  color: #f56c6c;
}

@media (max-width: 768px) {
  .section-form__actions {
    margin-left: 0;
    width: 100%;
  }
}
</style>
