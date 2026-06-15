<template>
  <div class="credit-rating-data-page">
    <div class="page-shell">
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="员工信用基础数据维护" name="basicData" />
        <el-tab-pane label="员工信用评级结果展示" name="ratingResult" />
        <el-tab-pane label="信用修复" name="creditRepair" />
      </el-tabs>

      <div class="tab-body">
        <!-- Tab1: 员工信用基础数据维护 -->
        <div v-show="activeTab === 'basicData'" class="tab-panel">
          <div class="panel-layout">
            <aside class="org-sidebar">
              <div class="org-search">
                <el-input
                  v-model="basicOrgKeyword"
                  placeholder="请输入"
                  prefix-icon="el-icon-search"
                  size="small"
                  clearable
                />
              </div>
              <div class="org-tree-toolbar">
                <span class="org-tree-toolbar__tip">已选 <strong>{{ basicCheckedOrgKeys.length }}</strong> 个组织</span>
                <el-button v-if="basicCheckedOrgKeys.length" type="text" size="mini" @click="clearBasicOrg">清空</el-button>
              </div>
              <div class="org-tree-wrap">
                <el-tree
                  ref="basicOrgTree"
                  :data="filteredBasicOrgTree"
                  :props="treeProps"
                  show-checkbox
                  check-on-click-node
                  node-key="id"
                  default-expand-all
                  :expand-on-click-node="false"
                  @check="syncBasicOrgKeys"
                >
                  <span slot-scope="{ node, data }" class="tree-node">
                    <i :class="data.icon || 'el-icon-folder'" />
                    <span class="tree-label">{{ node.label }}</span>
                  </span>
                </el-tree>
              </div>
            </aside>

            <div class="right-panel">
              <el-form :inline="true" size="small" class="filter-form">
                <el-form-item label="行为类别：">
                  <el-select v-model="basicQuery.behaviorCategory" style="width: 100px">
                    <el-option v-for="o in behaviorCategoryFilter" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="行为名称：">
                  <el-input v-model="basicQuery.behaviorName" placeholder="请输入" clearable style="width: 130px" />
                </el-form-item>
                <el-form-item label="所属专业：">
                  <el-select v-model="basicQuery.profession" style="width: 100px">
                    <el-option v-for="o in professionFilter" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" icon="el-icon-search" @click="basicPage = 1">查询</el-button>
                  <el-button icon="el-icon-refresh" @click="resetBasicQuery">重置</el-button>
                </el-form-item>
              </el-form>

              <div class="action-bar">
                <div class="action-bar__left">
                  <el-button type="primary" size="small" @click="handleBasicAdd">新增</el-button>
                  <el-button size="small" :disabled="!basicSelection.length" @click="handleBasicDelete">删除</el-button>
                  <el-button size="small" @click="$message.info('导入功能待对接')">导入</el-button>
                  <el-button size="small" @click="exportBasicData">导出</el-button>
                </div>
                <el-button type="primary" size="small" @click="$message.success('已提交执行评价')">执行评价</el-button>
              </div>

              <el-table
                :data="pagedBasicRows"
                border
                stripe
                size="small"
                header-cell-class-name="table-header"
                @selection-change="(s) => { basicSelection = s; }"
              >
                <el-table-column type="selection" width="48" align="center" />
                <el-table-column prop="name" label="姓名" width="90" align="center" />
                <el-table-column prop="orgPath" label="组织路径" min-width="200" show-overflow-tooltip />
                <el-table-column prop="unitName" label="单位名称" width="120" show-overflow-tooltip />
                <el-table-column label="行为类别" width="100" align="center">
                  <template slot="header"><span class="required-col">行为类别</span></template>
                  <template slot-scope="scope">{{ scope.row.behaviorCategory }}</template>
                </el-table-column>
                <el-table-column label="行为名称" min-width="130" show-overflow-tooltip>
                  <template slot="header"><span class="required-col">行为名称</span></template>
                  <template slot-scope="scope">{{ scope.row.behaviorName }}</template>
                </el-table-column>
                <el-table-column label="所属专业" width="100" align="center">
                  <template slot="header"><span class="required-col">所属专业</span></template>
                  <template slot-scope="scope">{{ scope.row.profession }}</template>
                </el-table-column>
                <el-table-column label="分值" width="80" align="center">
                  <template slot="header"><span class="required-col">分值</span></template>
                  <template slot-scope="scope">
                    <span :class="scope.row.score >= 0 ? 'score-pos' : 'score-neg'">{{ scope.row.score }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" align="center" fixed="right">
                  <template slot-scope="scope">
                    <el-button type="text" size="small" @click="viewBasicRow(scope.row)">查看</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div class="pagination-wrap">
                <el-pagination
                  :current-page="basicPage"
                  :page-sizes="[10, 25, 50]"
                  :page-size="basicPageSize"
                  layout="total, sizes, prev, pager, next, jumper"
                  :total="filteredBasicRows.length"
                  @size-change="(v) => { basicPageSize = v; basicPage = 1; }"
                  @current-change="(v) => { basicPage = v; }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Tab2: 员工信用评级结果展示 -->
        <div v-show="activeTab === 'ratingResult'" class="tab-panel">
          <div class="panel-layout">
            <aside class="org-sidebar">
              <div class="org-search">
                <el-input
                  v-model="resultOrgKeyword"
                  placeholder="组织架构"
                  prefix-icon="el-icon-search"
                  size="small"
                  clearable
                />
              </div>
              <div class="org-tree-toolbar">
                <span class="org-tree-toolbar__tip">已选 <strong>{{ resultCheckedOrgKeys.length }}</strong> 个组织</span>
                <el-button v-if="resultCheckedOrgKeys.length" type="text" size="mini" @click="clearResultOrg">清空</el-button>
              </div>
              <div class="org-tree-wrap">
                <el-tree
                  ref="resultOrgTree"
                  :data="filteredResultOrgTree"
                  :props="treeProps"
                  show-checkbox
                  check-on-click-node
                  node-key="id"
                  default-expand-all
                  :expand-on-click-node="false"
                  @check="syncResultOrgKeys"
                >
                  <span slot-scope="{ node, data }" class="tree-node">
                    <i :class="data.icon || 'el-icon-folder'" />
                    <span class="tree-label">{{ node.label }}</span>
                  </span>
                </el-tree>
              </div>
            </aside>

            <div class="right-panel">
              <el-tabs v-model="resultSubTab" class="sub-tabs">
                <el-tab-pane label="①-信用评级结果台账查询" name="ledger" />
                <el-tab-pane label="②-正负向数据统计" name="posNeg" />
                <el-tab-pane label="③-专业加扣分情况统计" name="profession" />
              </el-tabs>

              <!-- 台账查询 -->
              <div v-show="resultSubTab === 'ledger'" class="sub-panel">
                <el-form :inline="true" size="small" class="filter-form">
                  <el-form-item label="岗位：">
                    <el-input v-model="resultQuery.position" placeholder="请输入" clearable style="width: 120px" />
                  </el-form-item>
                  <el-form-item label="行为类别：">
                    <el-select v-model="resultQuery.behaviorCategory" style="width: 100px">
                      <el-option v-for="o in behaviorCategoryFilter" :key="o.value" :label="o.label" :value="o.value" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="修复分类：">
                    <el-select v-model="resultQuery.repairCategory" style="width: 110px">
                      <el-option v-for="o in repairCategoryFilter" :key="o.value" :label="o.label" :value="o.value" />
                    </el-select>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" icon="el-icon-search" @click="resultPage = 1">查询</el-button>
                    <el-button icon="el-icon-refresh" @click="resetResultQuery">重置</el-button>
                  </el-form-item>
                </el-form>
                <div class="action-bar action-bar--compact">
                  <el-button size="small" icon="el-icon-download" @click="exportResultLedger">导出</el-button>
                </div>
                <el-table
                  :data="pagedResultRows"
                  border
                  stripe
                  size="small"
                  header-cell-class-name="table-header"
                  @selection-change="(s) => { resultSelection = s; }"
                >
                  <el-table-column type="selection" width="48" align="center" />
                  <el-table-column type="index" label="序号" width="70" align="center" :index="resultIndex" />
                  <el-table-column prop="name" label="姓名" width="90" align="center" />
                  <el-table-column prop="employeeId" label="员工ID" width="110" align="center" />
                  <el-table-column prop="department" label="部门（层级到班组）" min-width="160" show-overflow-tooltip />
                  <el-table-column prop="position" label="岗位" width="110" align="center" />
                  <el-table-column label="评价年度" width="100" align="center">
                    <template slot-scope="scope">{{ scope.row.evalYear }}年</template>
                  </el-table-column>
                  <el-table-column prop="resultSource" label="评价结果来源" min-width="120" show-overflow-tooltip />
                  <el-table-column prop="creditScore" label="信用得分" width="90" align="center" />
                  <el-table-column prop="creditGrade" label="信用等级" width="90" align="center" />
                  <el-table-column label="操作" width="100" align="center" fixed="right">
                    <template slot-scope="scope">
                      <el-button type="text" size="small" @click="viewResultDetail(scope.row)">查看详情</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="pagination-wrap">
                  <el-pagination
                    :current-page="resultPage"
                    :page-sizes="[10, 25, 50]"
                    :page-size="resultPageSize"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="filteredResultRows.length"
                    @size-change="(v) => { resultPageSize = v; resultPage = 1; }"
                    @current-change="(v) => { resultPage = v; }"
                  />
                </div>
              </div>

              <!-- 正负向数据统计 -->
              <div v-show="resultSubTab === 'posNeg'" class="sub-panel">
                <el-form :inline="true" size="small" class="filter-form">
                  <el-form-item label="岗位：">
                    <el-input v-model="posNegQuery.position" placeholder="请输入" clearable style="width: 120px" />
                  </el-form-item>
                  <el-form-item label="行为类别：">
                    <el-select v-model="posNegQuery.behaviorCategory" style="width: 100px">
                      <el-option v-for="o in behaviorCategoryFilter" :key="o.value" :label="o.label" :value="o.value" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="修复分类：">
                    <el-select v-model="posNegQuery.repairCategory" style="width: 110px">
                      <el-option v-for="o in repairCategoryFilter" :key="o.value" :label="o.label" :value="o.value" />
                    </el-select>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" icon="el-icon-search" @click="posNegPage = 1">查询</el-button>
                    <el-button icon="el-icon-refresh" @click="resetPosNegQuery">重置</el-button>
                  </el-form-item>
                </el-form>
                <div class="action-bar action-bar--compact">
                  <el-button size="small" icon="el-icon-download" @click="exportPosNegStat">导出</el-button>
                </div>
                <el-table
                  :data="pagedPosNegRows"
                  border
                  stripe
                  size="small"
                  header-cell-class-name="table-header"
                  @selection-change="(s) => { posNegSelection = s; }"
                >
                  <el-table-column type="selection" width="48" align="center" />
                  <el-table-column type="index" label="序号" width="70" align="center" :index="posNegIndex" />
                  <el-table-column prop="name" label="姓名" width="90" align="center" />
                  <el-table-column prop="employeeId" label="员工ID" width="110" align="center" />
                  <el-table-column prop="department" label="部门（层级到班组）" min-width="160" show-overflow-tooltip />
                  <el-table-column prop="position" label="岗位" width="110" align="center" />
                  <el-table-column label="加分项" width="90" align="center">
                    <template slot-scope="scope">
                      <span v-if="scope.row.addScore > 0" class="score-pos">+{{ scope.row.addScore }}</span>
                      <span v-else>-</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="减分项" width="90" align="center">
                    <template slot-scope="scope">
                      <span v-if="scope.row.deductScore > 0" class="score-neg">-{{ scope.row.deductScore }}</span>
                      <span v-else>-</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="behaviorCategory" label="行为类别" width="100" align="center" />
                  <el-table-column prop="repairCategory" label="修复分类" width="110" align="center" />
                  <el-table-column label="操作" width="100" align="center" fixed="right">
                    <template slot-scope="scope">
                      <el-button type="text" size="small" @click="viewPosNegDetail(scope.row)">查看详情</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="pagination-wrap">
                  <el-pagination
                    :current-page="posNegPage"
                    :page-sizes="[10, 25, 50]"
                    :page-size="posNegPageSize"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="filteredPosNegRows.length"
                    @size-change="(v) => { posNegPageSize = v; posNegPage = 1; }"
                    @current-change="(v) => { posNegPage = v; }"
                  />
                </div>
              </div>

              <!-- 专业加扣分统计 -->
              <div v-show="resultSubTab === 'profession'" class="sub-panel">
                <el-form :inline="true" size="small" class="filter-form">
                  <el-form-item label="岗位：">
                    <el-input v-model="professionQuery.position" placeholder="请输入" clearable style="width: 120px" />
                  </el-form-item>
                  <el-form-item label="行为类别：">
                    <el-select v-model="professionQuery.behaviorCategory" style="width: 100px">
                      <el-option v-for="o in behaviorCategoryFilter" :key="o.value" :label="o.label" :value="o.value" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="修复分类：">
                    <el-select v-model="professionQuery.repairCategory" style="width: 110px">
                      <el-option v-for="o in repairCategoryFilter" :key="o.value" :label="o.label" :value="o.value" />
                    </el-select>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" icon="el-icon-search" @click="professionPage = 1">查询</el-button>
                    <el-button icon="el-icon-refresh" @click="resetProfessionQuery">重置</el-button>
                  </el-form-item>
                </el-form>
                <div class="action-bar action-bar--compact">
                  <el-button size="small" icon="el-icon-download" @click="exportProfessionStat">导出</el-button>
                </div>
                <el-table
                  :data="pagedProfessionRows"
                  border
                  stripe
                  size="small"
                  header-cell-class-name="table-header"
                  @selection-change="(s) => { professionSelection = s; }"
                >
                  <el-table-column type="selection" width="48" align="center" />
                  <el-table-column type="index" label="序号" width="70" align="center" :index="professionIndex" />
                  <el-table-column prop="profession" label="专业" width="90" align="center" />
                  <el-table-column prop="name" label="姓名" width="90" align="center" />
                  <el-table-column prop="employeeId" label="员工ID" width="110" align="center" />
                  <el-table-column prop="department" label="部门（层级到班组）" min-width="150" show-overflow-tooltip />
                  <el-table-column prop="position" label="岗位" width="100" align="center" />
                  <el-table-column label="评价年度" width="100" align="center">
                    <template slot-scope="scope">{{ scope.row.evalYear }}年</template>
                  </el-table-column>
                  <el-table-column prop="resultSource" label="评价结果来源" min-width="120" show-overflow-tooltip />
                  <el-table-column prop="creditScore" label="信用得分" width="90" align="center" />
                  <el-table-column prop="creditGrade" label="信用等级" width="90" align="center" />
                  <el-table-column label="操作" width="100" align="center" fixed="right">
                    <template slot-scope="scope">
                      <el-button type="text" size="small" @click="viewProfessionDetail(scope.row)">查看详情</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="pagination-wrap">
                  <el-pagination
                    :current-page="professionPage"
                    :page-sizes="[10, 25, 50]"
                    :page-size="professionPageSize"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="filteredProfessionRows.length"
                    @size-change="(v) => { professionPageSize = v; professionPage = 1; }"
                    @current-change="(v) => { professionPage = v; }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab3: 信用修复 -->
        <div v-show="activeTab === 'creditRepair'" class="tab-panel">
          <el-form :inline="true" size="small" class="filter-form filter-form--repair">
            <el-form-item label="申请人：">
              <el-input v-model="repairQuery.applicant" placeholder="请输入" clearable style="width: 120px" />
            </el-form-item>
            <el-form-item label="修复来源：">
              <el-select v-model="repairQuery.repairSource" style="width: 120px">
                <el-option v-for="o in repairSourceOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="修复类别：">
              <el-select v-model="repairQuery.repairCategory" style="width: 120px">
                <el-option v-for="o in repairCategoryOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="年度：">
              <el-select v-model="repairQuery.year" style="width: 110px">
                <el-option v-for="o in yearFilter" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态：">
              <el-select v-model="repairQuery.status" style="width: 110px">
                <el-option v-for="o in repairStatusOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="单位：">
              <el-select v-model="repairQuery.unit" style="width: 140px">
                <el-option v-for="o in unitFilter" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item class="filter-form__actions">
              <el-button type="primary" icon="el-icon-search" @click="repairPage = 1">查询</el-button>
              <el-button icon="el-icon-refresh" @click="resetRepairQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="action-bar">
            <div class="action-bar__left">
              <el-button type="primary" size="small" @click="handleRepairAdd">新增</el-button>
              <el-button size="small" :disabled="!repairSelection.length" @click="handleRepairDelete">删除</el-button>
              <el-button size="small" @click="exportRepairData">导出</el-button>
              <el-button type="primary" size="small" :disabled="!repairSelection.length" @click="handleRepairAudit">审核</el-button>
              <el-button size="small" :disabled="!repairSelection.length" @click="handleRepairReturn">退回</el-button>
            </div>
          </div>

          <el-table
            :data="pagedRepairRows"
            border
            stripe
            size="small"
            header-cell-class-name="table-header"
            @selection-change="(s) => { repairSelection = s; }"
          >
            <el-table-column type="selection" width="48" align="center" />
            <el-table-column type="index" label="序号" width="70" align="center" :index="repairIndex" />
            <el-table-column prop="applicant" label="申请人" width="90" align="center" />
            <el-table-column prop="repairSource" label="信用修复来源" width="120" align="center" />
            <el-table-column prop="repairCategory" label="修复类别" width="110" align="center" />
            <el-table-column prop="applyDate" label="申请日期" width="110" align="center" />
            <el-table-column label="年度" width="80" align="center">
              <template slot-scope="scope">{{ scope.row.year }}年</template>
            </el-table-column>
            <el-table-column prop="reason" label="申请原因" min-width="160" show-overflow-tooltip />
            <el-table-column label="附件资料" width="90" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="$message.info(`下载附件：${scope.row.applicant}`)">下载</el-button>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template slot-scope="scope">
                <el-tag :type="repairStatusTagType(scope.row.status)" size="mini">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="viewRepairRow(scope.row)">查看</el-button>
                <template v-if="scope.row.status === '待提交'">
                  <el-button type="text" size="small" @click="editRepairRow(scope.row)">编辑</el-button>
                  <el-button type="text" size="small" class="danger-text" @click="deleteRepairRow(scope.row)">删除</el-button>
                </template>
                <el-button v-if="scope.row.status === '待审核'" type="text" size="small" @click="auditRepairRow(scope.row)">审核</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrap">
            <el-pagination
              :current-page="repairPage"
              :page-sizes="[10, 25, 50]"
              :page-size="repairPageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredRepairRows.length"
              @size-change="(v) => { repairPageSize = v; repairPage = 1; }"
              @current-change="(v) => { repairPage = v; }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getCreditRatingOrgTree,
  DEFAULT_BASIC_QUERY,
  DEFAULT_RESULT_QUERY,
  DEFAULT_REPAIR_QUERY,
  generateBasicCreditRows,
  filterBasicCreditRows,
  generateRatingResultRows,
  filterRatingResultRows,
  generatePosNegStatRows,
  filterPosNegStatRows,
  generateProfessionStatRows,
  filterProfessionStatRows,
  generateCreditRepairRows,
  filterCreditRepairRows,
  BEHAVIOR_CATEGORY_FILTER,
  PROFESSION_FILTER,
  REPAIR_CATEGORY_FILTER,
  REPAIR_SOURCE_OPTIONS,
  REPAIR_CATEGORY_OPTIONS,
  REPAIR_STATUS_OPTIONS,
  YEAR_FILTER,
  UNIT_FILTER,
  repairStatusTagType,
} from "../utils/creditRatingData";
import { downloadTableWithLog } from "../utils/exportLogger";

export default {
  name: "CreditRatingData",
  data() {
    return {
      activeTab: "basicData",
      treeProps: { label: "name", children: "children" },
      orgTree: getCreditRatingOrgTree(),
      behaviorCategoryFilter: BEHAVIOR_CATEGORY_FILTER,
      professionFilter: PROFESSION_FILTER,
      repairCategoryFilter: REPAIR_CATEGORY_FILTER,
      repairSourceOptions: REPAIR_SOURCE_OPTIONS,
      repairCategoryOptions: REPAIR_CATEGORY_OPTIONS,
      repairStatusOptions: REPAIR_STATUS_OPTIONS,
      yearFilter: YEAR_FILTER,
      unitFilter: UNIT_FILTER,
      // Tab1
      basicOrgKeyword: "",
      basicCheckedOrgKeys: [],
      basicQuery: { ...DEFAULT_BASIC_QUERY },
      basicAllRows: generateBasicCreditRows(),
      basicPage: 1,
      basicPageSize: 10,
      basicSelection: [],
      // Tab2
      resultSubTab: "ledger",
      resultOrgKeyword: "",
      resultCheckedOrgKeys: [],
      resultQuery: { ...DEFAULT_RESULT_QUERY },
      resultAllRows: generateRatingResultRows(),
      posNegQuery: { ...DEFAULT_RESULT_QUERY },
      posNegAllRows: generatePosNegStatRows(),
      posNegPage: 1,
      posNegPageSize: 10,
      posNegSelection: [],
      professionQuery: { ...DEFAULT_RESULT_QUERY },
      professionAllRows: generateProfessionStatRows(),
      professionPage: 1,
      professionPageSize: 10,
      professionSelection: [],
      resultPage: 1,
      resultPageSize: 10,
      resultSelection: [],
      // Tab3
      repairQuery: { ...DEFAULT_REPAIR_QUERY },
      repairAllRows: generateCreditRepairRows(),
      repairPage: 1,
      repairPageSize: 10,
      repairSelection: [],
    };
  },
  computed: {
    filteredBasicOrgTree() {
      return this.filterOrgTree(this.basicOrgKeyword);
    },
    filteredResultOrgTree() {
      return this.filterOrgTree(this.resultOrgKeyword);
    },
    filteredBasicRows() {
      return filterBasicCreditRows(this.basicAllRows, this.basicQuery, {
        checkedOrgKeys: this.basicCheckedOrgKeys,
        orgTree: this.orgTree,
      });
    },
    pagedBasicRows() {
      const s = (this.basicPage - 1) * this.basicPageSize;
      return this.filteredBasicRows.slice(s, s + this.basicPageSize);
    },
    filteredResultRows() {
      return filterRatingResultRows(this.resultAllRows, this.resultQuery, {
        checkedOrgKeys: this.resultCheckedOrgKeys,
        orgTree: this.orgTree,
      });
    },
    pagedResultRows() {
      const s = (this.resultPage - 1) * this.resultPageSize;
      return this.filteredResultRows.slice(s, s + this.resultPageSize);
    },
    filteredPosNegRows() {
      return filterPosNegStatRows(this.posNegAllRows, this.posNegQuery, {
        checkedOrgKeys: this.resultCheckedOrgKeys,
        orgTree: this.orgTree,
      });
    },
    pagedPosNegRows() {
      const s = (this.posNegPage - 1) * this.posNegPageSize;
      return this.filteredPosNegRows.slice(s, s + this.posNegPageSize);
    },
    filteredProfessionRows() {
      return filterProfessionStatRows(this.professionAllRows, this.professionQuery, {
        checkedOrgKeys: this.resultCheckedOrgKeys,
        orgTree: this.orgTree,
      });
    },
    pagedProfessionRows() {
      const s = (this.professionPage - 1) * this.professionPageSize;
      return this.filteredProfessionRows.slice(s, s + this.professionPageSize);
    },
    filteredRepairRows() {
      return filterCreditRepairRows(this.repairAllRows, this.repairQuery);
    },
    pagedRepairRows() {
      const s = (this.repairPage - 1) * this.repairPageSize;
      return this.filteredRepairRows.slice(s, s + this.repairPageSize);
    },
  },
  methods: {
    repairStatusTagType,
    filterOrgTree(keyword) {
      const kw = (keyword || "").trim();
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
    syncBasicOrgKeys() {
      this.$nextTick(() => {
        this.basicCheckedOrgKeys = this.$refs.basicOrgTree ? this.$refs.basicOrgTree.getCheckedKeys() : [];
        this.basicPage = 1;
      });
    },
    clearBasicOrg() {
      this.basicCheckedOrgKeys = [];
      this.$nextTick(() => {
        if (this.$refs.basicOrgTree) this.$refs.basicOrgTree.setCheckedKeys([]);
      });
      this.basicPage = 1;
    },
    syncResultOrgKeys() {
      this.$nextTick(() => {
        this.resultCheckedOrgKeys = this.$refs.resultOrgTree ? this.$refs.resultOrgTree.getCheckedKeys() : [];
        this.resultPage = 1;
        this.posNegPage = 1;
        this.professionPage = 1;
      });
    },
    clearResultOrg() {
      this.resultCheckedOrgKeys = [];
      this.$nextTick(() => {
        if (this.$refs.resultOrgTree) this.$refs.resultOrgTree.setCheckedKeys([]);
      });
      this.resultPage = 1;
      this.posNegPage = 1;
      this.professionPage = 1;
    },
    resetBasicQuery() {
      this.basicQuery = { ...DEFAULT_BASIC_QUERY };
      this.basicOrgKeyword = "";
      this.clearBasicOrg();
      this.basicPage = 1;
    },
    resetResultQuery() {
      this.resultQuery = { ...DEFAULT_RESULT_QUERY };
      this.resultOrgKeyword = "";
      this.clearResultOrg();
      this.resultPage = 1;
    },
    resetPosNegQuery() {
      this.posNegQuery = { ...DEFAULT_RESULT_QUERY };
      this.resultOrgKeyword = "";
      this.clearResultOrg();
      this.posNegPage = 1;
    },
    resetProfessionQuery() {
      this.professionQuery = { ...DEFAULT_RESULT_QUERY };
      this.resultOrgKeyword = "";
      this.clearResultOrg();
      this.professionPage = 1;
    },
    resetRepairQuery() {
      this.repairQuery = { ...DEFAULT_REPAIR_QUERY };
      this.repairPage = 1;
    },
    basicIndex(i) {
      return (this.basicPage - 1) * this.basicPageSize + i + 1;
    },
    resultIndex(i) {
      return (this.resultPage - 1) * this.resultPageSize + i + 1;
    },
    posNegIndex(i) {
      return (this.posNegPage - 1) * this.posNegPageSize + i + 1;
    },
    professionIndex(i) {
      return (this.professionPage - 1) * this.professionPageSize + i + 1;
    },
    repairIndex(i) {
      return (this.repairPage - 1) * this.repairPageSize + i + 1;
    },
    handleBasicAdd() {
      this.basicAllRows.unshift({
        id: Date.now(),
        name: "张三",
        orgPath: "云南电网/昆明供电局/安监部/运维一组",
        unitName: "昆明供电局",
        behaviorCategory: "负向",
        behaviorName: "A类违章",
        profession: "安监",
        score: -5,
        orgId: 122,
      });
      this.$message.success("已新增");
    },
    handleBasicDelete() {
      const ids = new Set(this.basicSelection.map((r) => r.id));
      this.basicAllRows = this.basicAllRows.filter((r) => !ids.has(r.id));
      this.basicSelection = [];
      this.$message.success("已删除选中项");
    },
    viewBasicRow(row) {
      this.$message.info(`查看：${row.name} - ${row.behaviorName}`);
    },
    exportBasicData() {
      const source = this.filteredBasicRows;
      downloadTableWithLog({
        headers: ["姓名", "组织路径", "单位名称", "行为类别", "行为名称", "所属专业", "分值"],
        rows: source.map((r) => [r.name, r.orgPath, r.unitName, r.behaviorCategory, r.behaviorName, r.profession, r.score]),
        format: "csv",
        baseFilename: "员工信用基础数据",
        meta: { moduleCode: "credit_basic_data", moduleName: "员工信用基础数据维护", moduleGroup: "信用评级数据管理" },
      });
      this.$message.success(`已导出 ${source.length} 条记录`);
    },
    viewResultDetail(row) {
      this.$message.info(`查看详情：${row.name}（${row.creditGrade}，${row.creditScore}分）`);
    },
    viewPosNegDetail(row) {
      const addText = row.addScore > 0 ? `加分${row.addScore}` : "无加分";
      const deductText = row.deductScore > 0 ? `减分${row.deductScore}` : "无减分";
      this.$message.info(`查看详情：${row.name}（${addText}，${deductText}，${row.behaviorCategory}）`);
    },
    viewProfessionDetail(row) {
      this.$message.info(`查看详情：${row.profession} - ${row.name}（${row.creditGrade}，${row.creditScore}分）`);
    },
    exportResultLedger() {
      const source = this.filteredResultRows;
      downloadTableWithLog({
        headers: ["序号", "姓名", "员工ID", "部门", "岗位", "评价年度", "评价结果来源", "信用得分", "信用等级"],
        rows: source.map((r, i) => [i + 1, r.name, r.employeeId, r.department, r.position, `${r.evalYear}年`, r.resultSource, r.creditScore, r.creditGrade]),
        format: "csv",
        baseFilename: "信用评级结果台账",
        meta: { moduleCode: "credit_result_ledger", moduleName: "信用评级结果台账", moduleGroup: "信用评级数据管理" },
      });
      this.$message.success(`已导出 ${source.length} 条记录`);
    },
    exportPosNegStat() {
      const source = this.filteredPosNegRows;
      downloadTableWithLog({
        headers: ["序号", "姓名", "员工ID", "部门", "岗位", "加分项", "减分项", "行为类别", "修复分类"],
        rows: source.map((r, i) => [
          i + 1,
          r.name,
          r.employeeId,
          r.department,
          r.position,
          r.addScore > 0 ? `+${r.addScore}` : "-",
          r.deductScore > 0 ? `-${r.deductScore}` : "-",
          r.behaviorCategory,
          r.repairCategory,
        ]),
        format: "csv",
        baseFilename: "正负向数据统计",
        meta: { moduleCode: "credit_pos_neg_stat", moduleName: "正负向数据统计", moduleGroup: "信用评级数据管理" },
      });
      this.$message.success(`已导出 ${source.length} 条记录`);
    },
    exportProfessionStat() {
      const source = this.filteredProfessionRows;
      downloadTableWithLog({
        headers: ["序号", "专业", "姓名", "员工ID", "部门", "岗位", "评价年度", "评价结果来源", "信用得分", "信用等级"],
        rows: source.map((r, i) => [
          i + 1,
          r.profession,
          r.name,
          r.employeeId,
          r.department,
          r.position,
          `${r.evalYear}年`,
          r.resultSource,
          r.creditScore,
          r.creditGrade,
        ]),
        format: "csv",
        baseFilename: "专业加扣分情况统计",
        meta: { moduleCode: "credit_profession_stat", moduleName: "专业加扣分情况统计", moduleGroup: "信用评级数据管理" },
      });
      this.$message.success(`已导出 ${source.length} 条记录`);
    },
    handleRepairAdd() {
      this.repairAllRows.unshift({
        id: Date.now(),
        applicant: "张三",
        repairSource: "日常评价",
        repairCategory: "行为修复",
        applyDate: "2026-06-15",
        year: "2026",
        reason: "新增修复申请",
        status: "待提交",
        unitName: "昆明供电局",
      });
      this.$message.success("已新增");
    },
    handleRepairDelete() {
      const ids = new Set(this.repairSelection.map((r) => r.id));
      this.repairAllRows = this.repairAllRows.filter((r) => !ids.has(r.id));
      this.repairSelection = [];
      this.$message.success("已删除选中项");
    },
    handleRepairAudit() {
      this.repairSelection.forEach((r) => {
        if (r.status === "待审核") r.status = "已完成";
      });
      this.$message.success("已审核选中项");
    },
    handleRepairReturn() {
      this.repairSelection.forEach((r) => {
        if (r.status === "待审核") r.status = "待提交";
      });
      this.$message.success("已退回选中项");
    },
    viewRepairRow(row) {
      this.$message.info(`查看：${row.applicant} - ${row.reason}`);
    },
    editRepairRow(row) {
      this.$prompt("请输入申请原因", "编辑", { inputValue: row.reason })
        .then(({ value }) => {
          row.reason = value;
          this.$message.success("已保存");
        })
        .catch(() => {});
    },
    deleteRepairRow(row) {
      this.repairAllRows = this.repairAllRows.filter((r) => r.id !== row.id);
      this.$message.success("已删除");
    },
    auditRepairRow(row) {
      row.status = "已完成";
      this.$message.success("审核通过");
    },
    exportRepairData() {
      const source = this.filteredRepairRows;
      downloadTableWithLog({
        headers: ["序号", "申请人", "信用修复来源", "修复类别", "申请日期", "年度", "申请原因", "状态"],
        rows: source.map((r, i) => [i + 1, r.applicant, r.repairSource, r.repairCategory, r.applyDate, `${r.year}年`, r.reason, r.status]),
        format: "csv",
        baseFilename: "信用修复",
        meta: { moduleCode: "credit_repair", moduleName: "信用修复", moduleGroup: "信用评级数据管理" },
      });
      this.$message.success(`已导出 ${source.length} 条记录`);
    },
  },
};
</script>

<style scoped>
.credit-rating-data-page {
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
  max-height: calc(100vh - 220px);
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
}

.sub-tabs { margin-bottom: 12px; }
.sub-tabs >>> .el-tabs__header { margin-bottom: 0; }
.sub-tabs >>> .el-tabs__item { height: 36px; line-height: 36px; font-size: 13px; }
.sub-panel { min-height: 360px; }

.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
}

.filter-form >>> .el-form-item { margin-bottom: 8px; }
.filter-form__actions { margin-left: auto; }

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.action-bar__left { display: flex; gap: 8px; flex-wrap: wrap; }
.action-bar--compact { justify-content: flex-start; }

>>> .table-header {
  background: #e8f4ff !important;
  color: #303133;
  font-weight: 500;
}

.pagination-wrap { margin-top: 14px; text-align: right; }

.required-col::after {
  content: "*";
  color: #f56c6c;
  margin-left: 2px;
}

.score-pos { color: #52c41a; font-weight: 500; }
.score-neg { color: #f56c6c; font-weight: 500; }
.danger-text { color: #f56c6c; }

@media (max-width: 992px) {
  .panel-layout { flex-direction: column; }
  .org-sidebar { width: 100%; max-height: 320px; }
}
</style>
