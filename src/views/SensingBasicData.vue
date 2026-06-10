<template>
  <div class="sensing-basic-page">
    <div class="page-header">
      <h2>无感基础数据管理</h2>
    </div>
    <div class="third-tabs">
      <div
        class="tab"
        :class="{ active: mainTab === 'rules' }"
        @click="goSection('rules')"
      >
        规则设置
      </div>
      <div
        class="tab"
        :class="{ active: mainTab === 'clean' }"
        @click="goSection('clean')"
      >
        数据清洗
      </div>
      <div
        class="tab"
        :class="{ active: mainTab === 'organize' }"
        @click="goSection('organize')"
      >
        数据整理
      </div>
      <div
        class="tab"
        :class="{ active: mainTab === 'output' }"
        @click="goSection('output')"
      >
        数据结果输出
      </div>
    </div>

    <!-- 规则设置 -->
    <div v-show="mainTab === 'rules'" class="tab-panel tab-panel--rules">
      <div class="workflow-banner">
        <div class="workflow-title">无感数据处理流程</div>
        <div class="workflow-steps">
          <div
            v-for="item in workflowSteps"
            :key="item.step"
            class="workflow-step"
            @click="goWorkflowStep(item.tab)"
          >
            <span class="workflow-step-num">{{ item.step }}</span>
            <div class="workflow-step-body">
              <span class="workflow-step-name">{{ item.title }}</span>
              <span class="workflow-step-desc">{{ item.desc }}</span>
            </div>
            <i
              v-if="item.step < 4"
              class="el-icon-arrow-right workflow-arrow"
            ></i>
          </div>
        </div>
      </div>

      <div class="sub-tabs rules-sub-tabs">
        <div
          class="sub-tab"
          :class="{ active: rulesSubTab === 'clean' }"
          @click="rulesSubTab = 'clean'"
        >
          数据清洗规则
        </div>
        <div
          v-for="tab in businessRuleTabs"
          :key="tab.id"
          class="sub-tab"
          :class="{ active: rulesSubTab === tab.id }"
          @click="rulesSubTab = tab.id"
        >
          {{ tab.shortName }}
        </div>
      </div>

      <div v-show="rulesSubTab === 'clean'" class="rules-sub-panel">
        <div class="func-desc">
          <p>
            按八类无感数据源配置缺失值、重复、错误三类清洗规则；清洗后进入「数据清洗」页人工处理，再经「数据整理」映射为标准宽表。
          </p>
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
                <el-tag v-if="!item.enabled" size="mini" type="info"
                  >停用</el-tag
                >
              </div>
            </aside>
            <main v-if="activeCleanRule" class="rules-editor">
              <div class="rules-editor-head">
                <h3>{{ activeCleanRule.sourceName }}</h3>
                <div class="rules-meta">
                  <span v-if="activeCleanRule.updateTime"
                    >最近更新：{{ activeCleanRule.updateTime }}</span
                  >
                  <span v-if="activeCleanRule.operator"
                    >操作人：{{ activeCleanRule.operator }}</span
                  >
                </div>
              </div>
              <el-form label-width="110px" size="small" class="rules-form">
                <el-form-item label="规则总开关">
                  <el-switch
                    v-model="activeCleanRule.enabled"
                    active-text="启用"
                    inactive-text="停用"
                  />
                </el-form-item>

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
                    <el-option
                      v-for="opt in ruleFieldOptions"
                      :key="opt.key"
                      :label="fieldOptionSearchLabel(opt)"
                      :value="opt.key"
                    >
                      <span class="field-opt-label">{{ opt.label }}</span>
                      <span v-if="opt.en" class="field-opt-en">{{
                        opt.en
                      }}</span>
                    </el-option>
                  </el-select>
                  <div
                    v-if="activeCleanRule.missing.enabled"
                    class="selected-fields-panel"
                  >
                    <div class="selected-fields-head">
                      <span class="selected-fields-title">已选必填字段</span>
                      <span class="selected-fields-count"
                        >{{ ruleMissingSelectedFields.length }} /
                        {{ ruleSchemaFieldCount }}</span
                      >
                    </div>
                    <div
                      v-if="ruleMissingSelectedFields.length"
                      class="selected-fields-tags"
                    >
                      <el-tag
                        v-for="item in ruleMissingSelectedFields"
                        :key="item.key"
                        size="small"
                        type="primary"
                        effect="plain"
                        class="selected-field-tag"
                        closable
                        @close="removeMissingField(item.key)"
                      >
                        {{ fieldOptionSearchLabel(item) }}
                      </el-tag>
                    </div>
                    <div v-else class="selected-fields-empty">
                      暂未选择，请在上方的下拉框中搜索并添加
                    </div>
                  </div>
                  <p class="form-tip">
                    源表共
                    {{ ruleSchemaFieldCount }}
                    个字段可选；下方标签展示当前全部已选项。
                  </p>
                </el-form-item>

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
                    <el-option
                      v-for="opt in ruleDuplicateOptions"
                      :key="opt.key"
                      :label="fieldOptionSearchLabel(opt)"
                      :value="opt.key"
                    >
                      <span class="field-opt-label">{{ opt.label }}</span>
                      <span v-if="opt.en" class="field-opt-en">{{
                        opt.en
                      }}</span>
                    </el-option>
                  </el-select>
                  <div
                    v-if="activeCleanRule.duplicate.enabled"
                    class="selected-fields-panel"
                  >
                    <div class="selected-fields-head">
                      <span class="selected-fields-title">已选唯一性字段</span>
                      <span class="selected-fields-count"
                        >{{ ruleDuplicateSelectedFields.length }} 项</span
                      >
                    </div>
                    <div
                      v-if="ruleDuplicateSelectedFields.length"
                      class="selected-fields-tags"
                    >
                      <el-tag
                        v-for="item in ruleDuplicateSelectedFields"
                        :key="item.key"
                        size="small"
                        type="primary"
                        effect="plain"
                        class="selected-field-tag"
                        closable
                        @close="removeDuplicateField(item.key)"
                      >
                        {{ fieldOptionSearchLabel(item) }}
                      </el-tag>
                    </div>
                    <div v-else class="selected-fields-empty">
                      暂未选择，请在上方的下拉框中搜索并添加
                    </div>
                  </div>
                  <p class="form-tip">
                    所选字段组合完全相同时判定为重复；下方标签展示当前全部已选项。
                  </p>
                </el-form-item>

                <el-divider content-position="left">错误数据规则</el-divider>
                <el-form-item label="启用错误检测">
                  <el-switch v-model="activeCleanRule.error.enabled" />
                </el-form-item>
                <el-table
                  :data="activeCleanRule.error.rules"
                  border
                  size="small"
                  class="error-rules-table"
                >
                  <el-table-column label="字段" min-width="220">
                    <template slot-scope="{ row }">
                      <el-select
                        v-model="row.key"
                        filterable
                        :filter-method="filterFieldOption"
                        size="mini"
                        style="width: 100%"
                        :disabled="!activeCleanRule.error.enabled"
                        @change="(key) => syncErrorRuleField(row, key)"
                      >
                        <el-option
                          v-for="opt in ruleFieldOptions"
                          :key="opt.key"
                          :label="fieldOptionSearchLabel(opt)"
                          :value="opt.key"
                        >
                          <span class="field-opt-label">{{ opt.label }}</span>
                          <span v-if="opt.en" class="field-opt-en">{{
                            opt.en
                          }}</span>
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column label="规则类型" min-width="200">
                    <template slot-scope="{ row }">
                      <el-select
                        v-model="row.type"
                        filterable
                        size="mini"
                        style="width: 100%"
                        :disabled="!activeCleanRule.error.enabled"
                        @change="(type) => onErrorRuleTypeChange(row, type)"
                      >
                        <el-option-group
                          v-for="grp in errorRuleTypeGroups"
                          :key="grp.label"
                          :label="grp.label"
                        >
                          <el-option
                            v-for="t in grp.options"
                            :key="t.value"
                            :label="t.label"
                            :value="t.value"
                          />
                        </el-option-group>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column label="参照对比字段" min-width="200">
                    <template slot-scope="{ row }">
                      <el-select
                        v-if="needsErrorRefField(row.type)"
                        v-model="row.startKey"
                        filterable
                        :filter-method="filterFieldOption"
                        size="mini"
                        style="width: 100%"
                        :disabled="!activeCleanRule.error.enabled"
                        placeholder="选择参照字段"
                        @change="(key) => syncErrorRuleStartField(row, key)"
                      >
                        <el-option
                          v-for="opt in refFieldOptionsForRule(row)"
                          :key="opt.key"
                          :label="fieldOptionSearchLabel(opt)"
                          :value="opt.key"
                        />
                      </el-select>
                      <span v-else class="text-muted">—</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="启用" width="80" align="center">
                    <template slot-scope="{ row }">
                      <el-switch
                        v-model="row.enabled"
                        :disabled="!activeCleanRule.error.enabled"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="80" align="center">
                    <template slot-scope="{ $index }">
                      <el-button type="text" @click="removeErrorRule($index)"
                        >删除</el-button
                      >
                    </template>
                  </el-table-column>
                </el-table>
                <div class="error-rule-add">
                  <el-select
                    v-model="newErrorRuleFieldKey"
                    filterable
                    :filter-method="filterFieldOption"
                    placeholder="搜索并选择字段"
                    size="small"
                    style="width: 280px; margin-right: 8px"
                    clearable
                  >
                    <el-option
                      v-for="opt in ruleFieldOptions"
                      :key="opt.key"
                      :label="fieldOptionSearchLabel(opt)"
                      :value="opt.key"
                    >
                      <span class="field-opt-label">{{ opt.label }}</span>
                      <span v-if="opt.en" class="field-opt-en">{{
                        opt.en
                      }}</span>
                    </el-option>
                  </el-select>
                  <el-select
                    v-model="newErrorRuleType"
                    filterable
                    placeholder="规则类型"
                    size="small"
                    style="width: 220px; margin-right: 8px"
                  >
                    <el-option-group
                      v-for="grp in errorRuleTypeGroups"
                      :key="grp.label"
                      :label="grp.label"
                    >
                      <el-option
                        v-for="t in grp.options"
                        :key="t.value"
                        :label="t.label"
                        :value="t.value"
                      />
                    </el-option-group>
                  </el-select>
                  <el-button
                    size="small"
                    icon="el-icon-plus"
                    @click="addErrorRule"
                    >添加规则</el-button
                  >
                </div>

                <div class="rules-actions">
                  <el-button type="primary" @click="saveCleanRuleConfig"
                    >保存并应用规则</el-button
                  >
                  <el-button @click="resetCurrentCleanRule"
                    >恢复该源默认</el-button
                  >
                </div>
              </el-form>
            </main>
          </div>
        </div>
      </div>

      <div
        v-for="tab in businessRuleTabs"
        :key="tab.id"
        v-show="rulesSubTab === tab.id"
        class="rules-sub-panel"
      >
        <business-rule-panel
          :catalog-id="tab.catalogId"
          :all-configs="businessRuleConfigs"
          @saved="onBusinessRuleSaved"
        />
      </div>
    </div>

    <!-- 数据清洗 -->
    <div v-show="mainTab === 'clean'" class="tab-panel tab-panel--clean">
      <div class="func-desc">
        <p>
          对八类无感数据源进行缺失值、重复、错误识别与人工修复；规则在「规则设置」页维护，修复后进入数据整理映射标准表。
        </p>
      </div>
      <div class="source-stats">
        <div v-for="s in sourceStats" :key="s.code" class="source-stat-card">
          <span class="name">{{ s.name }}</span>
          <span class="count">{{ s.count }} 条</span>
        </div>
      </div>
      <div class="sub-tabs">
        <div
          class="sub-tab"
          :class="{ active: cleanSubTab === 'missing' }"
          @click="cleanSubTab = 'missing'"
        >
          数据缺失值处理
        </div>
        <div
          class="sub-tab"
          :class="{ active: cleanSubTab === 'duplicate' }"
          @click="cleanSubTab = 'duplicate'"
        >
          重复数据处理
        </div>
        <div
          class="sub-tab"
          :class="{ active: cleanSubTab === 'error' }"
          @click="cleanSubTab = 'error'"
        >
          错误数据处理
        </div>
      </div>

      <div class="search-area">
        <div class="search-row">
          <div class="search-item search-item-keyword">
            <i class="el-icon-search search-icon"></i>
            <input
              v-model="cleanKeyword"
              type="text"
              class="search-input"
              placeholder="搜索姓名、人员ID、数据源"
              @keyup.enter="handleCleanSearch"
            />
          </div>
          <el-select
            v-model="cleanSourceFilter"
            placeholder="数据源"
            clearable
            size="small"
            style="width: 200px"
          >
            <el-option
              v-for="s in sourceOptions"
              :key="s"
              :label="s"
              :value="s"
            />
          </el-select>
          <el-button
            type="primary"
            icon="el-icon-search"
            :loading="cleanSearchLoading"
            @click="handleCleanSearch"
            >查询</el-button
          >
          <el-button @click="resetCleanFilter">重置</el-button>
        </div>
      </div>

      <div class="table-panel">
        <div
          class="table-body-wrap"
          v-loading="cleanSearchLoading"
          element-loading-text="查询中..."
        >
          <div
            v-show="cleanSubTab === 'missing'"
            class="table-container table-hscroll-viewport table-fill-viewport"
          >
            <el-table
              :data="pagedMissingRows"
              border
              stripe
              size="small"
              style="width: 100%"
            >
              <el-table-column
                type="index"
                label="序号"
                width="60"
                :index="cleanIndexMethod"
              />
              <el-table-column
                prop="sourceName"
                label="数据源"
                min-width="160"
                show-overflow-tooltip
              />
              <el-table-column prop="name" label="姓名" width="90" />
              <el-table-column prop="personId" label="人员ID" width="110" />
              <el-table-column
                prop="fieldLabel"
                label="缺失字段"
                min-width="140"
                show-overflow-tooltip
              />
              <el-table-column prop="fieldValue" label="当前值" width="100">
                <template slot-scope="{ row }">
                  <span class="text-danger">{{
                    row.fieldValue || "（空）"
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column
                prop="orgName"
                label="组织机构"
                min-width="200"
                show-overflow-tooltip
              />
              <el-table-column label="操作" width="80" align="center">
                <template slot-scope="{ row }">
                  <el-button type="text" @click="openEditDialog('missing', row)"
                    >修改</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div
            v-show="cleanSubTab === 'duplicate'"
            class="table-container table-hscroll-viewport table-fill-viewport"
          >
            <el-table
              :data="pagedDuplicateRows"
              border
              stripe
              size="small"
              style="width: 100%"
            >
              <el-table-column
                type="index"
                label="序号"
                width="60"
                :index="cleanIndexMethod"
              />
              <el-table-column
                prop="dupGroup"
                label="重复组"
                min-width="140"
                show-overflow-tooltip
              />
              <el-table-column
                prop="sourceName"
                label="数据源"
                min-width="160"
                show-overflow-tooltip
              />
              <el-table-column prop="name" label="姓名" width="90" />
              <el-table-column prop="personId" label="人员ID" width="110" />
              <el-table-column prop="recordDate" label="记录日期" width="120" />
              <el-table-column
                prop="summary"
                label="关键记录摘要"
                min-width="200"
                show-overflow-tooltip
              />
              <el-table-column
                prop="dupCount"
                label="重复条数"
                width="90"
                align="center"
              />
              <el-table-column label="操作" width="100" align="center">
                <template slot-scope="{ row }">
                  <el-button type="text" @click="removeDuplicate(row)"
                    >保留一条</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div
            v-show="cleanSubTab === 'error'"
            class="table-container table-hscroll-viewport table-fill-viewport"
          >
            <el-table
              :data="pagedErrorRows"
              border
              stripe
              size="small"
              style="width: 100%"
            >
              <el-table-column
                type="index"
                label="序号"
                width="60"
                :index="cleanIndexMethod"
              />
              <el-table-column
                prop="sourceName"
                label="数据源"
                min-width="160"
                show-overflow-tooltip
              />
              <el-table-column prop="name" label="姓名" width="90" />
              <el-table-column
                prop="fieldLabel"
                label="问题字段"
                min-width="140"
                show-overflow-tooltip
              />
              <el-table-column
                prop="fieldValue"
                label="当前值"
                min-width="120"
                show-overflow-tooltip
              />
              <el-table-column
                prop="errorReason"
                label="错误说明"
                min-width="200"
                show-overflow-tooltip
              />
              <el-table-column label="操作" width="80" align="center">
                <template slot-scope="{ row }">
                  <el-button type="text" @click="openEditDialog('error', row)"
                    >校正</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div class="pagination">
          <div class="pagination-info">
            <span>共 {{ cleanListTotal }} 条</span>
            <select
              v-model.number="cleanPageSize"
              class="page-size-select"
              @change="cleanPage = 1"
            >
              <option :value="10">10条/页</option>
              <option :value="25">25条/页</option>
              <option :value="50">50条/页</option>
            </select>
          </div>
          <div class="pagination-nav">
            <button
              class="page-btn"
              :disabled="cleanPage === 1"
              @click="cleanPage--"
            >
              <i class="el-icon-arrow-left"></i>
            </button>
            <button
              v-for="p in cleanVisiblePages"
              :key="p"
              class="page-btn"
              :class="{ active: cleanPage === p }"
              @click="cleanPage = p"
            >
              {{ p }}
            </button>
            <button
              class="page-btn"
              :disabled="cleanPage >= cleanTotalPages"
              @click="cleanPage++"
            >
              <i class="el-icon-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据整理 -->
    <div v-show="mainTab === 'organize'" class="tab-panel tab-panel--organize">
      <div class="func-desc">
        <p>
          ① 数据一致性处理：八类无感源字段映射为标准字段；②
          多源整合：按人员ID+日期生成业务标准宽表，供考勤/异常/工时规则计算使用。规则在「规则设置」页配置。
        </p>
      </div>
      <div class="sub-tabs">
        <div
          class="sub-tab"
          :class="{ active: organizeSubTab === 'mapping' }"
          @click="organizeSubTab = 'mapping'"
        >
          数据一致性处理
        </div>
        <div
          class="sub-tab"
          :class="{ active: organizeSubTab === 'merge' }"
          @click="organizeSubTab = 'merge'"
        >
          多源数据整合
        </div>
      </div>

      <div v-show="organizeSubTab === 'mapping'" class="table-panel">
        <div class="panel-tip">
          <i class="el-icon-info"></i>
          按无感数据源字段与出勤标准字段建立映射（闸机进出、三餐用餐、登录、休假等）；支持手动新增映射关系。
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
            style="width: 220px"
          >
            <el-option
              v-for="s in sourceOptions"
              :key="s"
              :label="s"
              :value="s"
            />
          </el-select>
          <span v-if="mappingSourceFilter" class="mapping-filter-count">
            共 {{ filteredFieldMappings.length }} 条
          </span>
          <span class="mapping-toolbar-hint"
            >新增映射立即生效，将参与多源整合与结果输出</span
          >
        </div>
        <div class="table-container table-hscroll-viewport table-fill-viewport">
          <el-table
            :data="filteredFieldMappings"
            border
            stripe
            size="small"
            style="width: 100%"
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column
              prop="source"
              label="数据源"
              width="200"
              show-overflow-tooltip
            />
            <el-table-column
              prop="sourceField"
              label="源字段"
              min-width="200"
              show-overflow-tooltip
            />
            <el-table-column
              prop="targetField"
              label="标准字段"
              width="160"
              show-overflow-tooltip
            />
            <el-table-column
              prop="status"
              label="映射状态"
              width="110"
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
            <el-table-column label="操作" width="120" align="center">
              <template slot-scope="{ row }">
                <el-button type="text" @click="openEditMappingDialog(row)"
                  >编辑</el-button
                >
                <el-button
                  type="text"
                  class="btn-text-danger"
                  @click="deleteMapping(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div v-show="organizeSubTab === 'merge'" class="table-panel">
        <div class="search-area">
          <div class="search-row">
            <el-button
              type="primary"
              icon="el-icon-refresh"
              :loading="mergeLoading"
              @click="handleRunMerge"
              >执行整合生成标准表</el-button
            >
          </div>
        </div>
        <div
          class="table-container table-hscroll-viewport"
          v-loading="mergeLoading"
          element-loading-text="处理中..."
        >
          <el-table
            ref="mergeTable"
            :data="mergedRows"
            border
            stripe
            size="small"
            :style="{
              width: '100%',
              minWidth: standardTableScrollWidth + 'px',
            }"
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="name" label="姓名" width="90" />
            <el-table-column prop="personId" label="人员ID" width="110" />
            <el-table-column
              prop="orgName"
              label="组织机构"
              width="220"
              show-overflow-tooltip
            />
            <el-table-column
              prop="orgId"
              label="组织机构ID"
              width="120"
              show-overflow-tooltip
            />
            <el-table-column prop="recordDate" label="记录日期" width="120" />
            <el-table-column
              v-for="col in standardMergeColumns"
              :key="col.prop"
              :prop="col.prop"
              :label="col.label"
              width="170"
              show-overflow-tooltip
            />
            <el-table-column
              prop="mergeStatus"
              label="整合状态"
              width="100"
              align="center"
            >
              <template slot-scope="{ row }">
                <el-tag
                  :type="row.mergeStatus === '已整合' ? 'success' : 'info'"
                  size="small"
                >
                  {{ row.mergeStatus }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 数据结果输出 -->
    <div v-show="mainTab === 'output'" class="tab-panel tab-panel--output">
      <div class="func-desc">
        <p>
          基于标准宽表应用「规则设置」中配置的业务规则，生成无感考勤表、异常考勤校验表、工时统计表（管理类/专业技术类、技能类）。
        </p>
        <p class="form-tip">
          <el-button type="text" size="mini" @click="goSection('rules')"
            >前往规则设置</el-button
          >
          修改考勤/异常/工时规则后，请点击下方「结果表生成」刷新结果。
        </p>
      </div>

      <div class="config-bar config-bar--compact">
        <el-button
          type="primary"
          size="small"
          icon="el-icon-s-operation"
          @click="runBusinessRules"
        >
          结果表生成
        </el-button>
        <span class="merge-hint"
          >按照当前规则设定生成无感考勤表，异常考勤校验表，工时统计</span
        >
      </div>

      <div class="sub-tabs">
        <div
          class="sub-tab"
          :class="{ active: outputSubTab === 'standard' }"
          @click="outputSubTab = 'standard'"
        >
          业务标准表
        </div>
        <div
          class="sub-tab"
          :class="{ active: outputSubTab === 'attendance' }"
          @click="outputSubTab = 'attendance'"
        >
          无感考勤表
        </div>
        <div
          class="sub-tab"
          :class="{ active: outputSubTab === 'abnormal' }"
          @click="outputSubTab = 'abnormal'"
        >
          异常考勤校验表
        </div>
        <div
          class="sub-tab"
          :class="{ active: outputSubTab === 'hours' }"
          @click="outputSubTab = 'hours'"
        >
          工时统计
        </div>
      </div>

      <div class="search-area">
        <div class="search-row">
          <div class="search-item search-item-keyword">
            <i class="el-icon-search search-icon"></i>
            <input
              v-model="outputKeyword"
              type="text"
              class="search-input"
              placeholder="搜索姓名、人员ID"
              @keyup.enter="outputCurrentPage = 1"
            />
          </div>
          <el-select
            v-if="outputSubTab === 'standard'"
            v-model="outputStatusFilter"
            placeholder="整合状态"
            clearable
            size="small"
            style="width: 140px"
          >
            <el-option label="已整合" value="已整合" />
            <el-option label="单源" value="单源" />
          </el-select>
          <el-select
            v-if="outputSubTab === 'attendance'"
            v-model="outputStatusFilter"
            placeholder="考勤类型"
            clearable
            size="small"
            style="width: 140px"
          >
            <el-option label="出勤" value="出勤" />
            <el-option label="培训" value="培训" />
            <el-option label="出差" value="出差" />
            <el-option label="迟到" value="迟到" />
            <el-option label="早退" value="早退" />
          </el-select>
          <el-select
            v-if="outputSubTab === 'hours'"
            v-model="workHoursCategory"
            size="small"
            style="width: 180px"
          >
            <el-option label="管理类/专业技术类" value="management" />
            <el-option label="技能类" value="skill" />
          </el-select>
          <el-button
            type="primary"
            icon="el-icon-search"
            :loading="outputSearchLoading"
            @click="handleOutputSearch"
            >查询</el-button
          >
          <el-button @click="resetOutputFilter">重置</el-button>
          <el-button
            type="primary"
            icon="el-icon-download"
            @click="exportCurrentOutput"
            >导出当前结果</el-button
          >
        </div>
      </div>

      <div class="content-wrapper">
        <div class="org-tree-panel">
          <div class="panel-header">
            <i class="el-icon-office-building"></i>
            <span>组织机构</span>
          </div>
          <div class="tree-search-box">
            <i class="el-icon-search"></i>
            <input v-model="orgTreeKeyword" type="text" placeholder="请输入" />
          </div>
          <div class="tree-container">
            <el-tree
              :data="filteredOrgTree"
              :props="treeProps"
              default-expand-all
              highlight-current
              :expand-on-click-node="false"
              node-key="id"
              @node-click="handleOrgClick"
            />
          </div>
        </div>

        <div class="table-panel">
          <div
            class="table-container table-hscroll-viewport"
            v-loading="outputSearchLoading"
            element-loading-text="查询中..."
          >
            <el-table
              v-if="outputSubTab === 'standard'"
              :data="pagedOutputRows"
              border
              stripe
              size="small"
              :style="{
                width: '100%',
                minWidth: currentOutputScrollWidth + 'px',
              }"
            >
              <el-table-column
                type="index"
                label="序号"
                width="60"
                :index="attendanceIndex"
              />
              <el-table-column
                prop="orgName"
                label="组织机构"
                width="200"
                show-overflow-tooltip
              />
              <el-table-column
                prop="orgId"
                label="组织机构ID"
                width="120"
                show-overflow-tooltip
              />
              <el-table-column prop="name" label="姓名" width="90" />
              <el-table-column prop="personId" label="人员ID" width="110" />
              <el-table-column prop="recordDate" label="记录日期" width="120" />
              <el-table-column
                v-for="col in standardMergeColumns"
                :key="'out-' + col.prop"
                :prop="col.prop"
                :label="col.label"
                width="170"
                show-overflow-tooltip
              />
              <el-table-column
                prop="mergeStatus"
                label="整合状态"
                width="100"
              />
              <el-table-column
                prop="dataSources"
                label="数据来源"
                width="160"
                show-overflow-tooltip
              />
            </el-table>

            <el-table
              v-else-if="outputSubTab === 'attendance'"
              :data="pagedOutputRows"
              border
              stripe
              size="small"
              :style="{
                width: '100%',
                minWidth: currentOutputScrollWidth + 'px',
              }"
              @cell-click="onAttendanceCellClick"
            >
              <el-table-column
                type="index"
                label="序号"
                width="60"
                :index="attendanceIndex"
              />
              <el-table-column
                prop="orgName"
                label="组织机构"
                width="200"
                show-overflow-tooltip
              />
              <el-table-column
                prop="name"
                label="姓名"
                width="100"
                class-name="col-person-name"
                column-key="personName"
                show-overflow-tooltip
              />
              <el-table-column prop="personId" label="人员ID" width="110" />
              <el-table-column prop="recordDate" label="考勤日期" width="120" />
              <el-table-column
                prop="attendanceType"
                label="考勤类型"
                width="100"
              />
              <el-table-column
                prop="arrivalTime"
                label="到岗时间"
                width="170"
              />
              <el-table-column
                prop="departureTime"
                label="离岗时间"
                width="170"
              />
              <el-table-column prop="ruleLevel" label="规则层级" width="100" />
              <el-table-column prop="targetTable" label="输出表" width="120" />
              <el-table-column
                prop="dataSources"
                label="数据来源"
                width="160"
                show-overflow-tooltip
              />
            </el-table>

            <el-table
              v-else-if="outputSubTab === 'abnormal'"
              :data="pagedOutputRows"
              border
              stripe
              size="small"
              :style="{
                width: '100%',
                minWidth: currentOutputScrollWidth + 'px',
              }"
            >
              <el-table-column
                type="index"
                label="序号"
                width="60"
                :index="attendanceIndex"
              />
              <el-table-column
                prop="orgName"
                label="组织机构"
                width="200"
                show-overflow-tooltip
              />
              <el-table-column prop="name" label="姓名" width="90" />
              <el-table-column prop="personId" label="人员ID" width="110" />
              <el-table-column prop="recordDate" label="日期" width="120" />
              <el-table-column
                prop="abnormalType"
                label="异常类型"
                width="130"
              />
              <el-table-column prop="ruleLevel" label="规则层级" width="110" />
              <el-table-column
                prop="detail"
                label="说明"
                width="280"
                show-overflow-tooltip
              />
              <el-table-column
                prop="dataSources"
                label="数据来源"
                width="140"
                show-overflow-tooltip
              />
            </el-table>

            <el-table
              v-else
              :data="pagedOutputRows"
              border
              stripe
              size="small"
              :style="{
                width: '100%',
                minWidth: currentOutputScrollWidth + 'px',
              }"
            >
              <el-table-column
                type="index"
                label="序号"
                width="60"
                :index="attendanceIndex"
              />
              <el-table-column
                prop="orgName"
                label="组织机构"
                width="200"
                show-overflow-tooltip
              />
              <el-table-column prop="name" label="姓名" width="90" />
              <el-table-column prop="personId" label="人员ID" width="110" />
              <el-table-column prop="recordDate" label="日期" width="120" />
              <el-table-column
                prop="attendanceType"
                label="考勤类型"
                width="100"
              />
              <el-table-column prop="hoursType" label="工时类型" width="110" />
              <el-table-column
                prop="workHours"
                label="工时(h)"
                width="90"
                align="center"
              />
              <el-table-column prop="ruleLevel" label="规则层级" width="100" />
              <el-table-column
                prop="dataSources"
                label="数据来源"
                min-width="180"
                show-overflow-tooltip
              />
              <el-table-column
                prop="remark"
                label="计算说明"
                min-width="200"
                show-overflow-tooltip
              />
              <el-table-column prop="category" label="岗位类别" width="140" />
            </el-table>
          </div>
          <div class="pagination">
            <div class="pagination-info">
              <span>共{{ filteredOutputList.length }}条</span>
              <select
                v-model.number="outputPageSize"
                class="page-size-select"
                @change="outputCurrentPage = 1"
              >
                <option :value="10">10条/页</option>
                <option :value="25">25条/页</option>
                <option :value="50">50条/页</option>
              </select>
            </div>
            <div class="pagination-nav">
              <button
                class="page-btn"
                :disabled="outputCurrentPage === 1"
                @click="outputCurrentPage--"
              >
                <i class="el-icon-arrow-left"></i>
              </button>
              <button
                v-for="p in outputVisiblePages"
                :key="p"
                class="page-btn"
                :class="{ active: outputCurrentPage === p }"
                @click="outputCurrentPage = p"
              >
                {{ p }}
              </button>
              <button
                class="page-btn"
                :disabled="outputCurrentPage >= outputTotalPages"
                @click="outputCurrentPage++"
              >
                <i class="el-icon-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <flexible-attendance-dialog
      :visible.sync="showFlexibleAttendance"
      :sheet="flexibleAttendanceSheet"
      @export="exportFlexibleAttendance"
    />

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
              v-for="s in sensingSourceOptions"
              :key="s.name"
              :label="s.name"
              :value="s.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="源字段" prop="sourceField">
          <el-select
            v-model="mappingForm.sourceField"
            placeholder="请选择或输入源字段"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option
              v-for="opt in mappingSourceFieldOptions"
              :key="opt.key"
              :label="fieldOptionSearchLabel(opt)"
              :value="opt.label"
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
        <el-button type="primary" @click="saveMapping">保存</el-button>
      </span>
    </el-dialog>

    <el-dialog
      :title="editDialogTitle"
      :visible.sync="showEditDialog"
      width="480px"
      append-to-body
      @close="editFormValue = ''"
    >
      <el-form label-width="100px" size="small">
        <el-form-item label="数据源">{{ editRow.sourceName }}</el-form-item>
        <el-form-item label="字段">{{ editRow.fieldLabel }}</el-form-item>
        <el-form-item label="新值">
          <el-input v-model="editFormValue" placeholder="请输入修正后的值" />
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
import { generateOrgTree, matchOrgFilter } from "../utils/orgTree";
import {
  SENSING_SOURCES,
  FIELD_MAPPINGS,
  STANDARD_TARGET_FIELDS,
  getStandardMergeColumns,
  createFieldMapping,
  resolveMappingProp,
  generateGateRows,
  generateCanteenRows,
  generateOnlineRows,
  buildMissingRows,
  buildDuplicateRows,
  buildErrorRows,
  buildAttendanceResults,
  buildMergedPreviewRows,
  buildMergedPreviewFromStandardRows,
  countSourceStats,
} from "../utils/sensingRecords";
import {
  RULE_CATALOG,
  DEFAULT_WORK_CONFIG,
  buildPersonDayContextsFromStandardRows,
  generateSenselessAttendanceTable,
  generateAbnormalAttendanceTable,
  generateWorkHoursTable,
} from "../utils/sensingBusinessRules";
import {
  getGlobalWorkConfig,
  getRuleCatalog,
} from "../utils/behaviorModeSettings";
import { buildFlexibleAttendanceSheet } from "../utils/flexibleAttendance";
import FlexibleAttendanceDialog from "../components/FlexibleAttendanceDialog.vue";
import BusinessRulePanel from "../components/BusinessRulePanel.vue";
import {
  BUSINESS_RULE_TABS,
  SENSING_WORKFLOW_STEPS,
  loadAllBusinessRuleConfigs,
  getBusinessRuleConfig,
} from "../utils/businessRuleSettings";
import {
  loadCleanRules,
  saveCleanRules,
  buildDefaultRule,
  getFieldOptionsForSource,
  getDuplicateFieldOptionsForSource,
  getFieldOptionByKey,
  getSchemaFieldCount,
  formatFieldOptionLabel,
  ERROR_RULE_TYPE_GROUPS,
  errorRuleNeedsRefField,
  SOURCE_META,
  filterFieldOption,
} from "../utils/dataCleanRules";

export default {
  name: "SensingBasicData",
  components: {
    FlexibleAttendanceDialog,
    BusinessRulePanel,
  },
  data() {
    return {
      mainTab: "clean",
      rulesSubTab: "attendance", // 默认显示第一个业务规则：无感考勤规则
      businessRuleConfigs: {},
      cleanSubTab: "missing",
      organizeSubTab: "mapping",
      cleanKeyword: "",
      cleanSourceFilter: "",
      mappingSourceFilter: "",
      gateRows: [],
      canteenRows: [],
      onlineRows: [],
      missingRows: [],
      duplicateRows: [],
      errorRows: [],
      removedDupGroups: [],
      fieldMappings: FIELD_MAPPINGS.map((m, i) => ({
        ...m,
        id: `map-init-${i}`,
        isManual: false,
      })),
      showMappingDialog: false,
      mappingDialogMode: "add",
      mappingForm: {
        id: "",
        source: "",
        sourceField: "",
        targetField: "",
        prop: "",
      },
      mappingFormRules: {
        source: [
          { required: true, message: "请选择数据源", trigger: "change" },
        ],
        sourceField: [
          { required: true, message: "请填写源字段", trigger: "change" },
        ],
        targetField: [
          { required: true, message: "请选择标准字段", trigger: "change" },
        ],
        prop: [{ required: true, message: "请填写字段标识", trigger: "blur" }],
      },
      mergedRows: [],
      attendanceRows: [],
      sourceStats: [],
      personContexts: [],
      senselessAttendanceRows: [],
      abnormalRows: [],
      workHoursRows: [],
      workHoursCategory: "management",
      workConfig: {
        ...DEFAULT_WORK_CONFIG,
        lateDays: DEFAULT_WORK_CONFIG.loginLateConsecutiveDays,
      },
      workConfigArrival: DEFAULT_WORK_CONFIG.arrivalTime,
      workConfigDeparture: DEFAULT_WORK_CONFIG.departureTime,
      ruleCatalog: RULE_CATALOG,
      outputSubTab: "standard",
      outputKeyword: "",
      outputStatusFilter: "",
      outputSelectedOrg: "",
      orgTreeKeyword: "",
      orgTree: [],
      treeProps: { label: "name", children: "children" },
      cleanSearchLoading: false,
      mergeLoading: false,
      outputSearchLoading: false,
      cleanPage: 1,
      cleanPageSize: 25,
      outputCurrentPage: 1,
      outputPageSize: 25,
      showEditDialog: false,
      editMode: "missing",
      editRow: {},
      editFormValue: "",
      showFlexibleAttendance: false,
      flexibleAttendanceSheet: null,
      cleanRules: [],
      activeRuleSource: "offline_gate",
      newErrorRuleFieldKey: "",
      newErrorRuleType: "datetime",
    };
  },
  computed: {
    standardMergeColumns() {
      return getStandardMergeColumns(this.fieldMappings);
    },
    sensingSourceOptions() {
      return SENSING_SOURCES;
    },
    standardTargetOptions() {
      return STANDARD_TARGET_FIELDS;
    },
    mappingSourceFieldOptions() {
      const src = SENSING_SOURCES.find(
        (s) => s.name === this.mappingForm.source,
      );
      if (!src) return [];
      return getFieldOptionsForSource(src.code);
    },
    mappingDialogTitle() {
      return this.mappingDialogMode === "add" ? "新增字段映射" : "编辑字段映射";
    },
    /** 多源整合表总列宽（触发横向滚动） */
    standardTableScrollWidth() {
      const fixed = 60 + 90 + 110 + 220 + 120 + 120 + 100;
      const std = this.standardMergeColumns.length * 170;
      return fixed + std;
    },
    currentOutputScrollWidth() {
      if (this.outputSubTab === "standard") {
        return (
          60 +
          200 +
          90 +
          110 +
          120 +
          120 +
          this.standardMergeColumns.length * 170 +
          100 +
          160
        );
      }
      if (this.outputSubTab === "attendance") {
        return 60 + 200 + 100 + 110 + 120 + 100 + 170 + 170 + 100 + 120 + 160;
      }
      if (this.outputSubTab === "abnormal") {
        return 60 + 200 + 90 + 110 + 120 + 130 + 110 + 280 + 140;
      }
      return 60 + 200 + 90 + 110 + 120 + 100 + 110 + 90 + 100 + 180 + 200 + 140;
    },
    sourceOptions() {
      return SENSING_SOURCES.map((s) => s.name);
    },
    filteredFieldMappings() {
      if (!this.mappingSourceFilter) return this.fieldMappings;
      return this.fieldMappings.filter(
        (m) => m.source === this.mappingSourceFilter,
      );
    },
    filteredMissingRows() {
      return this.filterCleanList(this.missingRows);
    },
    filteredDuplicateRows() {
      return this.filterCleanList(this.duplicateRows);
    },
    filteredErrorRows() {
      return this.filterCleanList(this.errorRows);
    },
    cleanListTotal() {
      if (this.cleanSubTab === "missing")
        return this.filteredMissingRows.length;
      if (this.cleanSubTab === "duplicate")
        return this.filteredDuplicateRows.length;
      return this.filteredErrorRows.length;
    },
    pagedMissingRows() {
      return this.pageSlice(
        this.filteredMissingRows,
        this.cleanPage,
        this.cleanPageSize,
      );
    },
    pagedDuplicateRows() {
      return this.pageSlice(
        this.filteredDuplicateRows,
        this.cleanPage,
        this.cleanPageSize,
      );
    },
    pagedErrorRows() {
      return this.pageSlice(
        this.filteredErrorRows,
        this.cleanPage,
        this.cleanPageSize,
      );
    },
    cleanTotalPages() {
      return Math.max(1, Math.ceil(this.cleanListTotal / this.cleanPageSize));
    },
    cleanVisiblePages() {
      const total = this.cleanTotalPages;
      const cur = this.cleanPage;
      if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
      if (cur <= 4) return [1, 2, 3, 4, 5];
      if (cur >= total - 3)
        return [total - 4, total - 3, total - 2, total - 1, total];
      return [cur - 2, cur - 1, cur, cur + 1, cur + 2];
    },
    activeCleanRule() {
      return (
        this.cleanRules.find((r) => r.sourceCode === this.activeRuleSource) ||
        null
      );
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
          (f.fieldType && String(f.fieldType).toLowerCase().includes("time")),
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
        if (!rule) return [];
        return (rule.missing.fields || []).map((f) => f.key);
      },
      set(keys) {
        const rule = this.activeCleanRule;
        if (!rule) return;
        const opts = this.ruleFieldOptions;
        rule.missing.fields = keys.map((key) => {
          const found = opts.find((o) => o.key === key);
          return { key, label: found ? found.label : key };
        });
      },
    },
    ruleDuplicateSelectedKeys: {
      get() {
        const rule = this.activeCleanRule;
        if (!rule) return [];
        return (rule.duplicate.keyFields || []).map((f) => f.key);
      },
      set(keys) {
        const rule = this.activeCleanRule;
        if (!rule) return;
        const opts = this.ruleDuplicateOptions;
        rule.duplicate.keyFields = keys.map((key) => {
          const found = opts.find((o) => o.key === key);
          return { key, label: found ? found.label : key };
        });
      },
    },
    ruleMissingSelectedFields() {
      const keys = this.ruleMissingSelectedKeys;
      return keys.map((key) => {
        const found = this.ruleFieldOptions.find((o) => o.key === key);
        return found || { key, label: key };
      });
    },
    ruleDuplicateSelectedFields() {
      const keys = this.ruleDuplicateSelectedKeys;
      return keys.map((key) => {
        const found = this.ruleDuplicateOptions.find((o) => o.key === key);
        return found || { key, label: key };
      });
    },
    filteredOrgTree() {
      const keyword = this.orgTreeKeyword.trim();
      if (!keyword) return this.orgTree;
      const filterNodes = (nodes) =>
        nodes.reduce((acc, node) => {
          const children = node.children ? filterNodes(node.children) : [];
          if (node.name.includes(keyword) || children.length) {
            acc.push({
              ...node,
              children: children.length ? children : node.children,
            });
          }
          return acc;
        }, []);
      return filterNodes(this.orgTree);
    },
    currentOutputList() {
      if (this.outputSubTab === "attendance")
        return this.senselessAttendanceRows;
      if (this.outputSubTab === "abnormal") return this.abnormalRows;
      if (this.outputSubTab === "hours") return this.workHoursRows;
      return this.mergedRows;
    },
    filteredOutputList() {
      let data = this.currentOutputList;
      if (this.outputSelectedOrg) {
        data = data.filter((r) =>
          matchOrgFilter(r.orgName, this.outputSelectedOrg),
        );
      }
      if (this.outputStatusFilter && this.outputSubTab === "standard") {
        data = data.filter((r) => r.mergeStatus === this.outputStatusFilter);
      }
      if (this.outputStatusFilter && this.outputSubTab === "attendance") {
        data = data.filter((r) => r.attendanceType === this.outputStatusFilter);
      }
      if (this.outputKeyword.trim()) {
        const kw = this.outputKeyword.trim();
        data = data.filter(
          (r) => r.name.includes(kw) || String(r.personId).includes(kw),
        );
      }
      return data;
    },
    pagedOutputRows() {
      const start = (this.outputCurrentPage - 1) * this.outputPageSize;
      return this.filteredOutputList.slice(start, start + this.outputPageSize);
    },
    outputTotalPages() {
      return Math.max(
        1,
        Math.ceil(this.filteredOutputList.length / this.outputPageSize),
      );
    },
    outputVisiblePages() {
      const total = this.outputTotalPages;
      const cur = this.outputCurrentPage;
      if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
      if (cur <= 4) return [1, 2, 3, 4, 5];
      if (cur >= total - 3)
        return [total - 4, total - 3, total - 2, total - 1, total];
      return [cur - 2, cur - 1, cur, cur + 1, cur + 2];
    },
    editDialogTitle() {
      return this.editMode === "error" ? "错误数据校正" : "缺失值修改";
    },
    workflowSteps() {
      return SENSING_WORKFLOW_STEPS;
    },
    businessRuleTabs() {
      return BUSINESS_RULE_TABS;
    },
  },
  watch: {
    "$route.path": {
      immediate: true,
      handler(path) {
        const allowed = ["rules", "clean", "organize", "output"];
        // 从路径中提取 section
        let section = "clean"; // 默认值
        if (path.includes("/sensing-basic/")) {
          const parts = path.split("/sensing-basic/");
          if (parts.length > 1) {
            section = parts[1];
          }
        }
        if (allowed.includes(section)) {
          this.mainTab = section;
        }
      },
    },
    cleanSubTab() {
      this.cleanPage = 1;
    },
    outputSubTab() {
      this.outputCurrentPage = 1;
      this.outputStatusFilter = "";
      if (this.outputSubTab === "hours") {
        this.refreshWorkHours();
      }
    },
    workHoursCategory() {
      this.refreshWorkHours();
      this.outputCurrentPage = 1;
    },
    mainTab(tab) {
      if (
        tab === "organize" &&
        this.organizeSubTab === "merge" &&
        !this.mergedRows.length
      ) {
        this.runMerge();
      }
      // 切换到规则设置页签时，默认显示第一个业务规则
      if (tab === "rules" && this.rulesSubTab === "clean") {
        this.rulesSubTab = "attendance";
      }
    },
  },
  mounted() {
    // 初始化时根据路由设置mainTab
    const path = this.$route.path;
    const allowed = ["rules", "clean", "organize", "output"];
    let section = "clean";
    if (path.includes("/sensing-basic/")) {
      const parts = path.split("/sensing-basic/");
      if (parts.length > 1) {
        section = parts[1];
      }
    }
    if (allowed.includes(section)) {
      this.mainTab = section;
    }

    this.orgTree = generateOrgTree();
    this.syncBehaviorModeConfig();
    this.loadCleanRulesConfig();
    this.loadBusinessRuleConfigs();
    this.loadData();
  },
  methods: {
    goSection(section) {
      const path = `/sensing-basic/${section}`;
      if (this.$route.path !== path) {
        this.$router.push(path).catch(() => {});
      }
      this.mainTab = section;
    },
    goWorkflowStep(tab) {
      this.goSection(tab);
    },
    loadBusinessRuleConfigs() {
      this.businessRuleConfigs = loadAllBusinessRuleConfigs();
    },
    onBusinessRuleSaved() {
      this.loadBusinessRuleConfigs();
      this.syncBehaviorModeConfig();
      if (this.mergedRows.length) {
        this.runBusinessRules(false);
      }
    },
    loadCleanRulesConfig() {
      this.cleanRules = loadCleanRules();
      if (
        !this.cleanRules.some((r) => r.sourceCode === this.activeRuleSource)
      ) {
        this.activeRuleSource = SOURCE_META[0]?.code || "offline_gate";
      }
    },
    selectRuleSource(code) {
      this.activeRuleSource = code;
      this.newErrorRuleFieldKey = "";
    },
    filterFieldOption,
    fieldOptionSearchLabel(opt) {
      return formatFieldOptionLabel(opt);
    },
    removeMissingField(key) {
      this.ruleMissingSelectedKeys = this.ruleMissingSelectedKeys.filter(
        (k) => k !== key,
      );
    },
    removeDuplicateField(key) {
      this.ruleDuplicateSelectedKeys = this.ruleDuplicateSelectedKeys.filter(
        (k) => k !== key,
      );
    },
    syncErrorRuleField(row, key) {
      const opt = getFieldOptionByKey(this.activeRuleSource, key);
      if (!opt) return;
      row.key = opt.key;
      row.label = opt.label;
    },
    syncErrorRuleStartField(row, key) {
      const opt = getFieldOptionByKey(this.activeRuleSource, key);
      if (!opt) return;
      row.startKey = opt.key;
      row.startLabel = opt.label;
    },
    needsErrorRefField(type) {
      return errorRuleNeedsRefField(type);
    },
    refFieldOptionsForRule(row) {
      if (row.type === "time_order" || row.type === "same_calendar_day") {
        return this.timeLikeFieldOptions;
      }
      return this.ruleFieldOptions;
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
      this.refreshCleanLists();
      this.$message.success(`「${rule.sourceName}」清洗规则已保存并应用`);
    },
    resetCurrentCleanRule() {
      const code = this.activeRuleSource;
      const idx = this.cleanRules.findIndex((r) => r.sourceCode === code);
      if (idx < 0) return;
      this.$confirm("确定恢复该数据源的默认清洗规则？", "提示", {
        type: "warning",
      })
        .then(() => {
          const next = [...this.cleanRules];
          next[idx] = buildDefaultRule(code);
          this.cleanRules = saveCleanRules(next, "当前用户");
          this.refreshCleanLists();
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
      const opt = getFieldOptionByKey(
        this.activeRuleSource,
        this.newErrorRuleFieldKey,
      );
      if (!opt) return;
      if (
        rule.error.rules.some(
          (r) => r.key === opt.key && r.type === this.newErrorRuleType,
        )
      ) {
        this.$message.warning("该字段下已存在相同类型的规则");
        return;
      }
      const item = {
        key: opt.key,
        label: opt.label,
        type: this.newErrorRuleType,
        enabled: true,
      };
      if (errorRuleNeedsRefField(this.newErrorRuleType)) {
        const start = this.refFieldOptionsForRule(item).find(
          (f) => f.key !== opt.key,
        );
        if (start) {
          item.startKey = start.key;
          item.startLabel = start.label;
        }
      }
      rule.error.rules.push(item);
      this.newErrorRuleFieldKey = "";
    },
    removeErrorRule(index) {
      const rule = this.activeCleanRule;
      if (!rule) return;
      rule.error.rules.splice(index, 1);
    },
    loadData() {
      this.gateRows = generateGateRows();
      this.canteenRows = generateCanteenRows();
      this.onlineRows = generateOnlineRows();
      this.sourceStats = countSourceStats(
        this.gateRows,
        this.canteenRows,
        this.onlineRows,
      );
      this.refreshCleanLists();
      this.rebuildStandardAndRules();
    },
    syncBehaviorModeConfig() {
      const wc = getGlobalWorkConfig();
      this.workConfigArrival = wc.arrivalTime;
      this.workConfigDeparture = wc.departureTime;
      this.workConfig = {
        ...wc,
        lateDays: wc.loginLateConsecutiveDays,
      };
      this.ruleCatalog = getRuleCatalog();
    },
    getWorkConfig() {
      const wc = getGlobalWorkConfig();
      return {
        arrivalTime: this.workConfigArrival || wc.arrivalTime,
        departureTime: this.workConfigDeparture || wc.departureTime,
        overtimeStartTime: wc.overtimeStartTime,
        loginLateConsecutiveDays:
          this.workConfig.lateDays ?? wc.loginLateConsecutiveDays,
      };
    },
    rebuildStandardAndRules() {
      this.attendanceRows = buildAttendanceResults(
        this.gateRows,
        this.canteenRows,
        this.onlineRows,
      );
      this.mergedRows = buildMergedPreviewFromStandardRows(
        this.attendanceRows,
        this.fieldMappings,
      );
      this.personContexts = buildPersonDayContextsFromStandardRows(
        this.attendanceRows,
      );
      this.runBusinessRules(false);
    },
    runBusinessRules(showMsg = true) {
      const config = this.getWorkConfig();
      this.senselessAttendanceRows = generateSenselessAttendanceTable(
        this.personContexts,
        config,
      );
      this.abnormalRows = generateAbnormalAttendanceTable(
        this.personContexts,
        config,
        getBusinessRuleConfig("abnormal", this.businessRuleConfigs),
      );
      this.refreshWorkHours();
      if (showMsg) {
        this.$message.success(
          `规则计算完成：考勤 ${this.senselessAttendanceRows.length} 条，异常 ${this.abnormalRows.length} 条，工时 ${this.workHoursRows.length} 条`,
        );
      }
    },
    refreshWorkHours() {
      const catalogId =
        this.workHoursCategory === "skill" ? "hours_skill" : "hours_mgmt";
      const ruleCfg = getBusinessRuleConfig(
        catalogId,
        this.businessRuleConfigs,
      );
      this.workHoursRows = generateWorkHoursTable(
        this.personContexts,
        this.senselessAttendanceRows,
        this.workHoursCategory,
        ruleCfg,
        ruleCfg.hoursParams,
      );
    },
    refreshCleanLists() {
      this.missingRows = buildMissingRows(
        this.gateRows,
        this.canteenRows,
        this.onlineRows,
        this.cleanRules,
      );
      this.duplicateRows = buildDuplicateRows(
        this.gateRows,
        this.canteenRows,
        this.onlineRows,
        this.cleanRules,
      ).filter((r) => !this.removedDupGroups.includes(r.dupGroup));
      this.errorRows = buildErrorRows(
        this.gateRows,
        this.canteenRows,
        this.onlineRows,
        this.cleanRules,
      );
    },
    filterCleanList(list) {
      let data = list;
      if (this.cleanSourceFilter) {
        data = data.filter((r) => r.sourceName === this.cleanSourceFilter);
      }
      if (this.cleanKeyword.trim()) {
        const kw = this.cleanKeyword.trim();
        data = data.filter(
          (r) =>
            (r.name && r.name.includes(kw)) ||
            (r.personId && String(r.personId).includes(kw)) ||
            (r.sourceName && r.sourceName.includes(kw)),
        );
      }
      return data;
    },
    pageSlice(list, page, size) {
      const start = (page - 1) * size;
      return list.slice(start, start + size);
    },
    cleanIndexMethod(index) {
      return (this.cleanPage - 1) * this.cleanPageSize + index + 1;
    },
    withSearchLoading(loadingKey, task, successMsg) {
      if (this[loadingKey]) return;
      this[loadingKey] = true;
      setTimeout(() => {
        task();
        this[loadingKey] = false;
        if (successMsg) {
          const msg =
            typeof successMsg === "function" ? successMsg() : successMsg;
          this.$message.success(msg);
        }
      }, 400);
    },
    handleCleanSearch() {
      this.withSearchLoading(
        "cleanSearchLoading",
        () => {
          this.cleanPage = 1;
        },
        () => `查询成功，共 ${this.cleanListTotal} 条`,
      );
    },
    handleOutputSearch() {
      this.withSearchLoading(
        "outputSearchLoading",
        () => {
          this.outputCurrentPage = 1;
        },
        () => `查询成功，共 ${this.filteredOutputList.length} 条`,
      );
    },
    handleRunMerge() {
      this.withSearchLoading(
        "mergeLoading",
        () => {
          this.runMerge(false);
        },
        () => `标准表已生成 ${this.mergedRows.length} 条，并完成规则计算`,
      );
    },
    resetCleanFilter() {
      this.cleanKeyword = "";
      this.cleanSourceFilter = "";
      this.cleanPage = 1;
    },
    openEditDialog(mode, row) {
      this.editMode = mode;
      this.editRow = { ...row };
      this.editFormValue = row.fieldValue || "";
      this.showEditDialog = true;
    },
    saveEdit() {
      const val = this.editFormValue.trim();
      if (!val) {
        this.$message.warning("请输入有效值");
        return;
      }
      const { recordId, fieldKey } = this.editRow;
      const updateRow = (list) => {
        const item = list.find((r) => r.id === recordId);
        if (item) item[fieldKey] = val;
      };
      updateRow(this.gateRows);
      updateRow(this.canteenRows);
      updateRow(this.onlineRows);
      this.refreshCleanLists();
      this.rebuildStandardAndRules();
      this.showEditDialog = false;
      this.$message.success("保存成功，相关列表已更新");
    },
    removeDuplicate(row) {
      const group = row.dupGroup;
      if (!group) return;
      let kept = false;
      this.gateRows = this.gateRows.filter((r) => {
        if (r.dupGroup !== group) return true;
        if (!kept) {
          kept = true;
          return true;
        }
        return false;
      });
      this.removedDupGroups.push(group);
      this.refreshCleanLists();
      this.rebuildStandardAndRules();
      this.$message.success("已保留一条记录，重复项已移除");
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
        sourceField: row.sourceField,
        targetField: row.targetField,
        prop: row.prop,
        status: row.status,
        isManual: row.isManual,
      };
      this.showMappingDialog = true;
    },
    resetMappingForm() {
      this.mappingForm = {
        id: "",
        source: "",
        sourceField: "",
        targetField: "",
        prop: "",
      };
      if (this.$refs.mappingFormRef) {
        this.$refs.mappingFormRef.clearValidate();
      }
    },
    onMappingSourceChange() {
      this.mappingForm.sourceField = "";
    },
    onMappingTargetChange(val) {
      this.mappingForm.prop = resolveMappingProp(
        val,
        this.fieldMappings.filter((m) => m.id !== this.mappingForm.id),
      );
    },
    saveMapping() {
      const form = this.$refs.mappingFormRef;
      if (!form) return;
      form.validate((valid) => {
        if (!valid) return;
        const result = createFieldMapping(
          {
            ...this.mappingForm,
            status: "已映射",
            isManual:
              this.mappingDialogMode === "add"
                ? true
                : this.mappingForm.isManual,
          },
          this.fieldMappings,
        );
        if (!result.ok) {
          this.$message.warning(result.message);
          return;
        }
        if (this.mappingDialogMode === "add") {
          this.fieldMappings.push(result.mapping);
          this.$message.success("映射已新增");
        } else {
          const idx = this.fieldMappings.findIndex(
            (m) => m.id === result.mapping.id,
          );
          if (idx >= 0) {
            this.$set(this.fieldMappings, idx, result.mapping);
            this.$message.success("映射已更新");
          }
        }
        this.showMappingDialog = false;
        if (this.mergedRows.length) {
          this.rebuildStandardAndRules();
        }
      });
    },
    deleteMapping(row) {
      this.$confirm(
        `确定删除映射「${row.sourceField} → ${row.targetField}」？`,
        "提示",
        {
          type: "warning",
        },
      )
        .then(() => {
          this.fieldMappings = this.fieldMappings.filter(
            (m) => m.id !== row.id,
          );
          this.rebuildStandardAndRules();
          this.$message.success("已删除映射");
        })
        .catch(() => {});
    },
    onAttendanceCellClick(row, column) {
      if (!row) return;
      if (
        column &&
        (column.columnKey === "personName" || column.label === "姓名")
      ) {
        this.openFlexibleAttendance(row);
      }
    },
    openFlexibleAttendance(row) {
      if (!row || !row.personId) {
        this.$message.warning("缺少人员ID，无法查看柔性化考勤表");
        return;
      }
      try {
        const period = row.recordDate ? row.recordDate.slice(0, 7) : undefined;
        const absentDates = (this.abnormalRows || [])
          .filter(
            (r) =>
              r.personId === row.personId &&
              r.abnormalType === "旷工" &&
              r.recordDate &&
              (!period || r.recordDate.startsWith(period)),
          )
          .map((r) => r.recordDate);

        this.flexibleAttendanceSheet = buildFlexibleAttendanceSheet({
          personId: row.personId,
          contexts: this.personContexts,
          attendanceRows: this.senselessAttendanceRows,
          config: this.getWorkConfig(),
          yearMonth: period,
          absentDates,
          abnormalRows: this.abnormalRows,
          gateRows: this.gateRows,
          canteenRows: this.canteenRows,
          onlineRows: this.onlineRows,
          standardRows: this.mergedRows,
        });
        this.$nextTick(() => {
          this.showFlexibleAttendance = true;
        });
      } catch (err) {
        console.error(err);
        this.$message.error("打开柔性化考勤表失败，请刷新页面后重试");
      }
    },
    exportFlexibleAttendance(sheet) {
      if (!sheet) return;
      const dayHeaders = sheet.days.flatMap((d) => [
        `${d.day}日上午`,
        `${d.day}日下午`,
      ]);
      const dayValues = sheet.days.flatMap((d) => [d.am.text, d.pm.text]);
      const headers = ["姓名", "员工编码", "考勤月份", ...dayHeaders];
      const row = [sheet.name, sheet.personId, sheet.yearMonth, ...dayValues];
      const csv = [headers, row]
        .map((line) =>
          line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
      const blob = new Blob(["\ufeff" + csv], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `柔性化考勤表_${sheet.name}_${sheet.yearMonth}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.$message.success("导出成功");
    },
    runMerge(showMsg = true) {
      this.rebuildStandardAndRules();
      this.$nextTick(() => {
        const table = this.$refs.mergeTable;
        if (table && table.doLayout) table.doLayout();
      });
      if (showMsg) {
        this.$message.success(
          `标准表已生成 ${this.mergedRows.length} 条，并完成规则计算`,
        );
      }
    },
    handleOrgClick(data) {
      this.outputSelectedOrg = data.id === 1 ? "" : data.name;
      this.outputCurrentPage = 1;
    },
    resetOutputFilter() {
      this.outputKeyword = "";
      this.outputStatusFilter = "";
      this.outputSelectedOrg = "";
      this.orgTreeKeyword = "";
      this.outputCurrentPage = 1;
    },
    attendanceIndex(index) {
      return (this.outputCurrentPage - 1) * this.outputPageSize + index + 1;
    },
    exportCurrentOutput() {
      const data = this.filteredOutputList;
      if (!data.length) {
        this.$message.warning("没有数据可导出");
        return;
      }
      let headers = [];
      let rows = [];
      const tab = this.outputSubTab;
      if (tab === "standard") {
        headers = [
          "组织机构",
          "组织机构ID",
          "姓名",
          "人员ID",
          "记录日期",
          ...this.standardMergeColumns.map((c) => c.label),
          "整合状态",
          "数据来源",
        ];
        rows = data.map((r) => [
          r.orgName,
          r.orgId,
          r.name,
          r.personId,
          r.recordDate,
          ...this.standardMergeColumns.map((c) => r[c.prop]),
          r.mergeStatus,
          r.dataSources,
        ]);
      } else if (tab === "attendance") {
        headers = [
          "组织机构",
          "姓名",
          "人员ID",
          "日期",
          "考勤类型",
          "到岗时间",
          "离岗时间",
          "规则层级",
          "输出表",
        ];
        rows = data.map((r) => [
          r.orgName,
          r.name,
          r.personId,
          r.recordDate,
          r.attendanceType,
          r.arrivalTime,
          r.departureTime,
          r.ruleLevel,
          r.targetTable,
        ]);
      } else if (tab === "abnormal") {
        headers = [
          "组织机构",
          "姓名",
          "人员ID",
          "日期",
          "异常类型",
          "规则层级",
          "说明",
        ];
        rows = data.map((r) => [
          r.orgName,
          r.name,
          r.personId,
          r.recordDate,
          r.abnormalType,
          r.ruleLevel,
          r.detail,
        ]);
      } else {
        headers = [
          "组织机构",
          "姓名",
          "人员ID",
          "日期",
          "考勤类型",
          "工时类型",
          "工时",
          "规则层级",
          "数据来源",
          "计算说明",
          "岗位类别",
        ];
        rows = data.map((r) => [
          r.orgName,
          r.name,
          r.personId,
          r.recordDate,
          r.attendanceType,
          r.hoursType,
          r.workHours,
          r.ruleLevel,
          r.dataSources,
          r.remark,
          r.category,
        ]);
      }
      const csv = [headers, ...rows]
        .map((line) =>
          line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");
      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const names = {
        standard: "业务标准表",
        attendance: "无感考勤表",
        abnormal: "异常考勤校验表",
        hours: "工时统计",
      };
      a.download = `${names[tab]}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      this.$message.success(`已导出 ${data.length} 条记录`);
    },
  },
};
</script>

<style scoped>
.sensing-basic-page {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: 100%;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.tab-panel {
  min-width: 0;
  max-width: 100%;
}

.tab-panel--output {
  display: flex;
  flex-direction: column;
  min-height: 500px;
  overflow-x: auto;
}

/* 允许数据结果输出页面水平滚动 */
.sensing-basic-page .main-content {
  overflow-x: auto !important;
}

.content-wrapper {
  display: flex;
  gap: 16px;
  min-height: 0;
  flex: 1;
}

.table-container {
  flex: 1;
  padding: 16px;
  min-height: 0;
}

.table-hscroll-viewport {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  overflow-x: auto !important;
  overflow-y: visible !important;
  -webkit-overflow-scrolling: touch;
}

.third-tabs {
  display: flex;
  margin-bottom: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.third-tabs .tab {
  padding: 14px 24px;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  font-weight: 500;
}

.third-tabs .tab.active {
  color: #409eff;
  font-weight: 600;
  border-bottom-color: #409eff;
  background-color: #ecf5ff;
}

.sub-tabs {
  display: flex;
  margin-bottom: 16px;
  background: #fff;
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  width: fit-content;
}

.sub-tab {
  padding: 8px 20px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  border-radius: 4px;
}

.sub-tab.active {
  background: #409eff;
  color: #fff;
}

.func-desc {
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #fdf6ec;
  border-left: 4px solid #e6a23c;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.search-area {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.search-item-keyword {
  position: relative;
  width: 260px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #c0c4cc;
  z-index: 1;
}

.search-input {
  width: 100%;
  height: 32px;
  padding: 0 12px 0 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.table-panel {
  min-width: 0;
  max-width: 100%;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8eaed;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: block;
}

.panel-tip {
  padding: 12px 16px;
  font-size: 13px;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
}

.panel-tip i {
  color: #409eff;
  margin-right: 6px;
}

.mapping-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
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

.merge-hint {
  font-size: 13px;
  color: #909399;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
}

.pagination-info {
  font-size: 13px;
  color: #606266;
}

.page-size-select {
  margin-left: 8px;
  height: 28px;
}

.pagination-nav {
  display: flex;
  gap: 6px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.page-btn.active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.org-tree-panel {
  width: 260px;
  flex-shrink: 0;
  align-self: stretch;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8eaed;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 14px 20px;
  background: #409eff;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.tree-search-box {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
  gap: 8px;
}

.tree-search-box input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.text-danger {
  color: #f56c6c;
}

.source-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.source-stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.source-stat-card .name {
  color: #606266;
}

.source-stat-card .count {
  color: #409eff;
  font-weight: 600;
}

.rule-catalog {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.rule-card {
  background: #fff;
  border-radius: 8px;
  padding: 8px 10px;
  border-left: 4px solid #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.rule-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.rule-meta {
  font-size: 12px;
  color: #909399;
  margin: 4px 0;
}

.rule-desc {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}

.config-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-size: 13px;
}

.config-bar label {
  color: #606266;
}

.workflow-banner {
  margin-bottom: 16px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #d9ecff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.08);
}

.workflow-title {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 12px;
}

.workflow-steps {
  display: flex;
  align-items: stretch;
  gap: 8px;
  flex-wrap: wrap;
}

.workflow-step {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 180px;
  padding: 10px 12px;
  background: #ecf5ff;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.workflow-step:hover {
  background: #d9ecff;
}

.workflow-step-num {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.workflow-step-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.workflow-step-name {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.workflow-step-desc {
  font-size: 11px;
  color: #909399;
  line-height: 1.4;
}

.workflow-arrow {
  color: #b3d8ff;
  font-size: 14px;
  margin-left: auto;
}

.rules-sub-tabs {
  margin-bottom: 16px;
  flex-wrap: wrap;
  width: 100%;
  max-width: 100%;
}

.rules-sub-panel {
  min-width: 0;
}

.config-bar--compact {
  margin-bottom: 12px;
}

.clean-rules-panel {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8eaed;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 16px;
}

.rules-layout {
  display: flex;
  gap: 16px;
  min-height: 520px;
}

.rules-source-aside {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid #ebeef5;
  padding-right: 12px;
}

.aside-title {
  font-size: 13px;
  color: #909399;
  margin-bottom: 10px;
  padding-left: 8px;
}

.rules-source-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
}

.rules-source-item:hover {
  background: #f5f7fa;
}

.rules-source-item.active {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 600;
}

.rules-source-name {
  flex: 1;
  line-height: 1.4;
}

.rules-editor {
  flex: 1;
  min-width: 0;
}

.rules-editor-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.rules-editor-head h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.rules-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 16px;
}

.rule-field-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
}

.field-opt-label {
  float: left;
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.field-opt-en {
  float: right;
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

.text-muted {
  color: #c0c4cc;
}

.form-tip {
  margin: 6px 0 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.selected-fields-panel {
  margin-top: 10px;
  padding: 10px 12px;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 6px;
}

.selected-fields-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.selected-fields-title {
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
}

.selected-fields-count {
  font-size: 12px;
  color: #66b1ff;
}

.selected-fields-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-fields-tags .el-tag.selected-field-tag {
  max-width: 100%;
  height: auto;
  white-space: normal;
  line-height: 1.4;
  padding: 4px 8px;
  background-color: #fff;
  border-color: #b3d8ff;
  color: #409eff;
}

.selected-fields-tags .el-tag.selected-field-tag .el-tag__close {
  color: #409eff;
}

.selected-fields-tags .el-tag.selected-field-tag .el-tag__close:hover {
  color: #66b1ff;
  background-color: #ecf5ff;
}

.selected-fields-empty {
  font-size: 12px;
  color: #c0c4cc;
  line-height: 1.6;
}

.error-rules-table {
  margin-bottom: 12px;
}

.error-rule-add {
  margin-bottom: 20px;
}

.rules-actions {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

/* 列数较少时表格撑满容器，避免右侧留白 */
.table-fill-viewport {
  overflow-x: hidden !important;
}

.table-fill-viewport .el-table {
  width: 100% !important;
}
</style>

<style>
/* 无感考勤表：姓名列蓝色可点击（用 prop 默认渲染，避免自定义插槽不显示） */
.sensing-basic-page .el-table td.col-person-name {
  cursor: pointer;
}

.sensing-basic-page .el-table td.col-person-name .cell {
  color: #409eff !important;
  font-weight: 500;
  cursor: pointer !important;
}

.sensing-basic-page .el-table td.col-person-name:hover .cell {
  color: #66b1ff !important;
  text-decoration: underline;
}
</style>
