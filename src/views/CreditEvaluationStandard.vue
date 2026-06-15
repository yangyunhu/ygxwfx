<template>
  <div class="credit-standard-page">
    <div class="page-shell">
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="标准库类目管理" name="category" />
        <el-tab-pane label="单位标准库" name="unitStandard" />
        <el-tab-pane label="信用评级管理" name="rating" />
      </el-tabs>

      <div class="tab-body">
        <!-- 标准库类目管理 -->
        <div v-show="activeTab === 'category'" class="tab-panel">
          <el-form :inline="true" size="small" class="filter-form filter-form--category">
            <el-form-item label="行为类别：">
              <el-select v-model="categoryQuery.behaviorCategory" style="width: 110px">
                <el-option v-for="o in behaviorCategoryOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="行为名称：">
              <el-input v-model="categoryQuery.behaviorName" placeholder="请输入" clearable style="width: 130px" />
            </el-form-item>
            <el-form-item label="分值：">
              <el-input v-model="categoryQuery.score" placeholder="请输入" clearable style="width: 90px" />
            </el-form-item>
            <el-form-item label="类目归属：">
              <el-select v-model="categoryQuery.categoryBelong" style="width: 110px">
                <el-option v-for="o in categoryBelongOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="所属专业：">
              <el-select v-model="categoryQuery.profession" style="width: 100px">
                <el-option v-for="o in professionOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="">
              <el-radio-group v-model="categoryQuery.scopeType" size="small">
                <el-radio label="本部">本部</el-radio>
                <el-radio label="通用">通用</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item class="filter-form__unit">
              <span class="filter-label">所属单位：</span>
              <el-select v-model="categoryQuery.orgUnit" style="width: 200px">
                <el-option :label="ROOT_ORG_LABEL" :value="ROOT_ORG_LABEL" />
              </el-select>
            </el-form-item>
            <el-form-item class="filter-form__actions">
              <el-button type="primary" icon="el-icon-search" @click="categoryPage = 1">查询</el-button>
              <el-button icon="el-icon-refresh" @click="resetCategoryQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="action-bar">
            <div class="action-bar__left">
              <el-button type="primary" size="small" @click="handleCategoryAdd">新增</el-button>
              <el-button size="small" :disabled="!categorySelection.length" @click="handleCategoryBatchDelete">删除</el-button>
              <el-button size="small" @click="$message.info('导入功能待对接')">导入</el-button>
            </div>
            <el-button type="text" size="small" @click="$message.info('申请记录功能待对接')">申请记录</el-button>
          </div>

          <el-table
            :data="pagedCategoryRows"
            border
            stripe
            size="small"
            header-cell-class-name="table-header"
            @selection-change="(s) => { categorySelection = s; }"
          >
            <el-table-column type="selection" width="48" align="center" />
            <el-table-column type="index" label="序号" width="70" align="center" :index="categoryIndex" />
            <el-table-column prop="behaviorCategory" label="行为类别" width="100" align="center" />
            <el-table-column prop="behaviorName" label="行为名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="profession" label="所属专业" width="100" align="center" />
            <el-table-column label="分值" width="100" align="center">
              <template slot-scope="scope">
                <el-input
                  v-if="scope.$index === 0 && categoryPage === 1"
                  v-model="scope.row.scoreText"
                  size="mini"
                  style="width: 72px"
                />
                <span v-else>{{ scope.row.scoreText }}</span>
              </template>
            </el-table-column>
            <el-table-column label="类目归属" width="100" align="center">
              <template slot-scope="scope">
                <span :class="scope.row.categoryBelong === '通用库' ? 'tag-general' : ''">
                  {{ scope.row.categoryBelong }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="是否为修复类" width="120" align="center">
              <template slot-scope="scope">{{ scope.row.isRepair ? "是" : "否" }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template slot-scope="scope">{{ scope.row.enabled ? "启动" : "停用" }}</template>
            </el-table-column>
            <el-table-column prop="recorder" label="录入人" width="90" align="center" />
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="viewCategoryRow(scope.row)">查看</el-button>
                <el-button type="text" size="small" @click="toggleCategoryStatus(scope.row)">
                  {{ scope.row.enabled ? "停用" : "启用" }}
                </el-button>
                <el-button type="text" size="small" class="danger-text" @click="deleteCategoryRow(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrap">
            <el-pagination
              :current-page="categoryPage"
              :page-sizes="[10, 25, 50]"
              :page-size="categoryPageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredCategoryRows.length"
              @size-change="(v) => { categoryPageSize = v; categoryPage = 1; }"
              @current-change="(v) => { categoryPage = v; }"
            />
          </div>
        </div>

        <!-- 单位标准库 -->
        <div v-show="activeTab === 'unitStandard'" class="tab-panel">
          <el-form :inline="true" size="small" class="filter-form">
            <el-form-item label="年度：">
              <el-select v-model="unitLibQuery.year" style="width: 120px">
                <el-option v-for="o in yearOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="名称：">
              <el-input v-model="unitLibQuery.name" placeholder="请输入" clearable style="width: 180px" />
            </el-form-item>
            <el-form-item class="filter-form__actions">
              <el-button type="primary" icon="el-icon-search" @click="unitLibPage = 1">查询</el-button>
              <el-button icon="el-icon-refresh" @click="resetUnitLibQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="action-bar">
            <div class="action-bar__left">
              <el-button type="primary" size="small" @click="handleUnitLibAdd">新增</el-button>
              <el-button size="small" :disabled="!unitLibSelection.length" @click="handleUnitLibBatchDelete">删除</el-button>
              <el-button size="small" @click="$message.info('导入功能待对接')">导入</el-button>
              <el-button size="small" @click="exportUnitLibrary">导出</el-button>
            </div>
          </div>

          <el-table
            :data="pagedUnitLibRows"
            border
            stripe
            size="small"
            header-cell-class-name="table-header"
            @selection-change="(s) => { unitLibSelection = s; }"
          >
            <el-table-column type="selection" width="48" align="center" />
            <el-table-column type="index" label="序号" width="70" align="center" :index="unitLibIndex" />
            <el-table-column prop="yearLabel" label="年度" width="100" align="center" />
            <el-table-column prop="standardName" label="信用评级名称" min-width="220" show-overflow-tooltip />
            <el-table-column label="启用状态" width="100" align="center">
              <template slot-scope="scope">
                <span :class="scope.row.enabled ? 'status-on' : 'status-off'">
                  {{ scope.row.enabled ? "启用" : "停用" }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="evaluationScope" label="评价范围" min-width="140" show-overflow-tooltip />
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="viewUnitLibRow(scope.row)">查看</el-button>
                <el-button type="text" size="small" @click="editUnitLibRow(scope.row)">编辑</el-button>
                <el-button type="text" size="small" class="danger-text" @click="deleteUnitLibRow(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrap">
            <el-pagination
              :current-page="unitLibPage"
              :page-sizes="[10, 25, 50]"
              :page-size="unitLibPageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredUnitLibRows.length"
              @size-change="(v) => { unitLibPageSize = v; unitLibPage = 1; }"
              @current-change="(v) => { unitLibPage = v; }"
            />
          </div>
        </div>

        <!-- 信用评级管理 -->
        <div v-show="activeTab === 'rating'" class="tab-panel">
          <section class="rating-block">
            <div class="rating-block__head">
              <h3 class="rating-block__title">等级分数区间配置</h3>
              <span class="rating-block__tip">总分：0 ~ 100 分</span>
            </div>
            <div class="action-bar action-bar--compact">
              <el-button type="primary" size="small" @click="addGradeRange">新增</el-button>
              <el-button size="small" :disabled="!gradeSelection.length" @click="deleteGradeRanges">删除</el-button>
            </div>
            <el-table
              :data="gradeRanges"
              border
              stripe
              size="small"
              header-cell-class-name="table-header"
              @selection-change="(s) => { gradeSelection = s; }"
            >
              <el-table-column type="selection" width="48" align="center" />
              <el-table-column type="index" label="序号" width="70" align="center" />
              <el-table-column prop="grade" label="等级" width="120" align="center" />
              <el-table-column prop="scoreMin" label="最低分" width="120" align="center" />
              <el-table-column prop="scoreMax" label="最高分" width="120" align="center" />
            </el-table>
          </section>

          <section class="rating-block">
            <div class="rating-block__head">
              <h3 class="rating-block__title">专业评分占比配置</h3>
            </div>
            <div class="action-bar action-bar--compact">
              <el-button type="primary" size="small" @click="addProfessionRatio">新增</el-button>
              <el-button size="small" :disabled="!ratioSelection.length" @click="deleteProfessionRatios">删除</el-button>
            </div>
            <el-table
              :data="professionRatios"
              border
              stripe
              size="small"
              header-cell-class-name="table-header"
              @selection-change="(s) => { ratioSelection = s; }"
            >
              <el-table-column type="selection" width="48" align="center" />
              <el-table-column type="index" label="序号" width="70" align="center" />
              <el-table-column label="专业" min-width="160">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.profession" size="mini" placeholder="请输入专业" />
                </template>
              </el-table-column>
              <el-table-column label="百分比" width="160" align="center">
                <template slot-scope="scope">
                  <el-input v-model.number="scope.row.ratio" size="mini" style="width: 100px">
                    <template slot="append">%</template>
                  </el-input>
                </template>
              </el-table-column>
            </el-table>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  ROOT_ORG_LABEL,
  BEHAVIOR_CATEGORY_OPTIONS,
  CATEGORY_BELONG_OPTIONS,
  PROFESSION_OPTIONS,
  YEAR_OPTIONS,
  DEFAULT_CATEGORY_QUERY,
  DEFAULT_UNIT_LIB_QUERY,
  generateCategoryBehaviorRows,
  filterCategoryBehaviorRows,
  generateUnitLibraryRows,
  filterUnitLibraryRows,
  getGradeScoreRanges,
  getProfessionRatioRows,
} from "../utils/creditStandardData";
import { downloadTableWithLog } from "../utils/exportLogger";

export default {
  name: "CreditEvaluationStandard",
  data() {
    return {
      activeTab: "category",
      ROOT_ORG_LABEL,
      behaviorCategoryOptions: BEHAVIOR_CATEGORY_OPTIONS,
      categoryBelongOptions: CATEGORY_BELONG_OPTIONS,
      professionOptions: PROFESSION_OPTIONS,
      yearOptions: YEAR_OPTIONS,
      categoryQuery: { ...DEFAULT_CATEGORY_QUERY },
      categoryAllRows: generateCategoryBehaviorRows(),
      categoryPage: 1,
      categoryPageSize: 10,
      categorySelection: [],
      unitLibQuery: { ...DEFAULT_UNIT_LIB_QUERY },
      unitLibAllRows: generateUnitLibraryRows(),
      unitLibPage: 1,
      unitLibPageSize: 10,
      unitLibSelection: [],
      gradeRanges: getGradeScoreRanges(),
      gradeSelection: [],
      professionRatios: getProfessionRatioRows(),
      ratioSelection: [],
    };
  },
  computed: {
    filteredCategoryRows() {
      return filterCategoryBehaviorRows(this.categoryAllRows, this.categoryQuery);
    },
    pagedCategoryRows() {
      const s = (this.categoryPage - 1) * this.categoryPageSize;
      return this.filteredCategoryRows.slice(s, s + this.categoryPageSize);
    },
    filteredUnitLibRows() {
      return filterUnitLibraryRows(this.unitLibAllRows, this.unitLibQuery);
    },
    pagedUnitLibRows() {
      const s = (this.unitLibPage - 1) * this.unitLibPageSize;
      return this.filteredUnitLibRows.slice(s, s + this.unitLibPageSize);
    },
  },
  methods: {
    categoryIndex(i) {
      return (this.categoryPage - 1) * this.categoryPageSize + i + 1;
    },
    unitLibIndex(i) {
      return (this.unitLibPage - 1) * this.unitLibPageSize + i + 1;
    },
    resetCategoryQuery() {
      this.categoryQuery = { ...DEFAULT_CATEGORY_QUERY };
      this.categoryPage = 1;
    },
    resetUnitLibQuery() {
      this.unitLibQuery = { ...DEFAULT_UNIT_LIB_QUERY };
      this.unitLibPage = 1;
    },
    handleCategoryAdd() {
      this.categoryAllRows.unshift({
        id: Date.now(),
        behaviorCategory: "负向",
        behaviorName: "新增行为项",
        profession: "安监",
        score: 10,
        scoreText: "10分",
        categoryBelong: "本地库",
        isRepair: false,
        enabled: true,
        recorder: "张山",
        scopeType: this.categoryQuery.scopeType,
      });
      this.$message.success("已新增行为类目");
    },
    handleCategoryBatchDelete() {
      const ids = new Set(this.categorySelection.map((r) => r.id));
      this.categoryAllRows = this.categoryAllRows.filter((r) => !ids.has(r.id));
      this.categorySelection = [];
      this.$message.success("已删除选中项");
    },
    viewCategoryRow(row) {
      this.$message.info(`查看：${row.behaviorName}`);
    },
    toggleCategoryStatus(row) {
      row.enabled = !row.enabled;
      this.$message.success(`已${row.enabled ? "启用" : "停用"}`);
    },
    deleteCategoryRow(row) {
      this.categoryAllRows = this.categoryAllRows.filter((r) => r.id !== row.id);
      this.$message.success("已删除");
    },
    handleUnitLibAdd() {
      this.unitLibAllRows.unshift({
        id: Date.now(),
        year: "2026",
        yearLabel: "2026年",
        standardName: "2026员工信用评级标准库",
        enabled: true,
        evaluationScope: "昆明供电局",
        unitKey: "kunming",
      });
      this.$message.success("已新增标准库");
    },
    handleUnitLibBatchDelete() {
      const ids = new Set(this.unitLibSelection.map((r) => r.id));
      this.unitLibAllRows = this.unitLibAllRows.filter((r) => !ids.has(r.id));
      this.unitLibSelection = [];
      this.$message.success("已删除选中项");
    },
    viewUnitLibRow(row) {
      this.$message.info(`查看：${row.standardName}`);
    },
    editUnitLibRow(row) {
      this.$prompt("请输入标准库名称", "编辑", { inputValue: row.standardName })
        .then(({ value }) => {
          row.standardName = value;
          this.$message.success("已保存");
        })
        .catch(() => {});
    },
    deleteUnitLibRow(row) {
      this.unitLibAllRows = this.unitLibAllRows.filter((r) => r.id !== row.id);
      this.$message.success("已删除");
    },
    exportUnitLibrary() {
      const source = this.filteredUnitLibRows;
      downloadTableWithLog({
        headers: ["序号", "年度", "信用评级名称", "启用状态", "评价范围"],
        rows: source.map((r, i) => [i + 1, r.yearLabel, r.standardName, r.enabled ? "启用" : "停用", r.evaluationScope]),
        format: "csv",
        baseFilename: "单位标准库",
        meta: { moduleCode: "credit_unit_library", moduleName: "单位标准库", moduleGroup: "信用评价标准库" },
      });
      this.$message.success(`已导出 ${source.length} 条记录`);
    },
    addGradeRange() {
      const newId = Math.max(0, ...this.gradeRanges.map((r) => r.id)) + 1;
      this.gradeRanges.push({ id: newId, grade: "E级", scoreMin: 0, scoreMax: 0 });
    },
    deleteGradeRanges() {
      const ids = new Set(this.gradeSelection.map((r) => r.id));
      this.gradeRanges = this.gradeRanges.filter((r) => !ids.has(r.id));
      this.gradeSelection = [];
      this.$message.success("已删除");
    },
    addProfessionRatio() {
      const newId = Math.max(0, ...this.professionRatios.map((r) => r.id)) + 1;
      this.professionRatios.push({ id: newId, profession: "", ratio: 0 });
    },
    deleteProfessionRatios() {
      const ids = new Set(this.ratioSelection.map((r) => r.id));
      this.professionRatios = this.professionRatios.filter((r) => !ids.has(r.id));
      this.ratioSelection = [];
      this.$message.success("已删除");
    },
  },
};
</script>

<style scoped>
.credit-standard-page {
  min-height: calc(100vh - 100px);
  padding: 0 4px 20px;
  background: #f5f5f5;
  box-sizing: border-box;
}

.page-shell {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.main-tabs { padding: 0 16px; }
.main-tabs >>> .el-tabs__header { margin-bottom: 0; }
.main-tabs >>> .el-tabs__nav-wrap::after { height: 1px; background: #e8e8e8; }
.main-tabs >>> .el-tabs__item { height: 44px; line-height: 44px; font-size: 14px; color: #606266; }
.main-tabs >>> .el-tabs__item.is-active { color: #1890ff; font-weight: 500; }
.main-tabs >>> .el-tabs__active-bar { background-color: #1890ff; height: 2px; }

.tab-body { min-height: 480px; padding: 16px; }
.tab-panel { min-height: 440px; }

.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
}

.filter-form--category { position: relative; }
.filter-form >>> .el-form-item { margin-bottom: 8px; }
.filter-form__actions { margin-left: auto; }
.filter-form__unit { margin-left: auto; margin-right: 12px; }
.filter-label { margin-right: 6px; font-size: 13px; color: #606266; }

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.action-bar__left { display: flex; gap: 8px; }
.action-bar--compact { justify-content: flex-start; gap: 8px; }

>>> .table-header {
  background: #e8f4ff !important;
  color: #303133;
  font-weight: 500;
}

.pagination-wrap { margin-top: 14px; text-align: right; }

.tag-general { color: #fa8c16; font-weight: 500; }
.status-on { color: #52c41a; }
.status-off { color: #909399; }
.danger-text { color: #f56c6c; }

.rating-block {
  margin-bottom: 24px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #ebeef5;
}

.rating-block:last-child { border-bottom: none; margin-bottom: 0; }

.rating-block__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.rating-block__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.rating-block__tip {
  font-size: 13px;
  color: #606266;
}

@media (max-width: 992px) {
  .filter-form__unit { margin-left: 0; }
  .filter-form__actions { margin-left: 0; width: 100%; }
}
</style>
