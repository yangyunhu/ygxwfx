<template>
  <div class="data-custom-page">
    <div class="page-header">
      <h2>无感数据自定义</h2>
    </div>
    <div class="third-tabs">
      <div
        class="tab"
        :class="{ active: activeTab === 'import' }"
        @click="activeTab = 'import'"
      >
        数据线下导入维护
      </div>
      <div
        class="tab"
        :class="{ active: activeTab === 'mode' }"
        @click="activeTab = 'mode'"
      >
        无感数据模式维护
      </div>
    </div>

    <!-- 数据线下导入维护 -->
    <div v-show="activeTab === 'import'" class="tab-panel">
      <div class="sub-tabs">
        <!-- 动态显示线下接入的数据源按钮 -->
        <div
          v-for="source in offlineSources"
          :key="source.dataType"
          class="sub-tab sub-tab-button"
          :class="{ active: dataType === source.dataType }"
          @click="switchDataType(source.dataType)"
        >
          {{ source.sourceName }}
        </div>
      </div>

      <div class="search-area">
        <div class="search-row">
          <div class="search-item search-item-keyword">
            <i class="el-icon-search search-icon"></i>
            <input
              v-model="searchKeyword"
              type="text"
              class="search-input"
              :placeholder="searchPlaceholder"
              @keyup.enter="handleSearch"
            />
          </div>
          <el-button type="primary" icon="el-icon-search" @click="handleSearch"
            >查询</el-button
          >
          <el-button @click="handleReset">重置</el-button>
          <el-button icon="el-icon-download" @click="downloadTemplate"
            >下载模板</el-button
          >
          <el-upload
            class="import-upload"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            accept=".xlsx,.xls,.csv"
            :on-change="handleImportFile"
          >
            <el-button type="primary" icon="el-icon-upload2">导入</el-button>
          </el-upload>
          <el-button icon="el-icon-download" @click="exportData"
            >导出</el-button
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
              :default-expand-all="true"
              :highlight-current="true"
              :expand-on-click-node="false"
              node-key="id"
              @node-click="handleOrgNodeClick"
            >
              <span class="custom-tree-node" slot-scope="{ node, data }">
                <i
                  :class="data.icon || 'el-icon-folder'"
                  class="tree-node-icon"
                ></i>
                <span class="tree-node-label">{{ node.label }}</span>
              </span>
            </el-tree>
          </div>
        </div>

        <div class="table-panel">
          <div class="table-container table-hscroll-viewport">
            <el-table
              ref="importTable"
              :data="pagedListData"
              border
              stripe
              size="small"
              :fit="false"
              :style="{ width: importTableScrollWidth + 'px' }"
              :empty-text="'暂无数据'"
            >
              <el-table-column
                type="index"
                label="序号"
                width="60"
                :index="indexMethod"
              />
              <!-- 动态表格列 -->
              <el-table-column
                v-for="field in currentDataSourceFields"
                :key="field.prop"
                :prop="field.prop"
                :label="field.label"
                :width="field.width || 150"
                show-overflow-tooltip
              />
              <el-table-column
                prop="importTime"
                label="导入时间"
                width="170"
                show-overflow-tooltip
              />
            </el-table>
          </div>

          <div class="pagination">
            <div class="pagination-info">
              <span>共{{ listTotal }}条</span>
              <select
                v-model.number="pageSize"
                class="page-size-select"
                @change="currentPage = 1"
              >
                <option :value="10">10条/页</option>
                <option :value="25">25条/页</option>
                <option :value="50">50条/页</option>
              </select>
            </div>
            <div class="pagination-nav">
              <button
                class="page-btn"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                <i class="el-icon-arrow-left"></i>
              </button>
              <button
                v-for="page in listVisiblePages"
                :key="'p-' + page"
                class="page-btn"
                :class="{ active: currentPage === page }"
                @click="currentPage = page"
              >
                {{ page }}
              </button>
              <span v-if="listShowEllipsis" class="page-ellipsis">...</span>
              <button
                class="page-btn"
                :disabled="currentPage === listTotalPages"
                @click="currentPage++"
              >
                <i class="el-icon-arrow-right"></i>
              </button>
              <div class="jump-page">
                <span>跳至</span>
                <input
                  v-model="jumpPage"
                  type="number"
                  min="1"
                  :max="listTotalPages"
                  @keyup.enter="jumpToPage"
                />
                <span>页</span>
                <button class="btn-go" @click="jumpToPage">GO</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无感数据模式维护 -->
    <div v-show="activeTab === 'mode'" class="tab-panel">
      <div class="search-area">
        <div class="search-row">
          <div class="search-item search-item-keyword">
            <i class="el-icon-search search-icon"></i>
            <input
              v-model="modeSearchKeyword"
              type="text"
              class="search-input"
              placeholder="搜索数据源名称"
              @keyup.enter="handleModeSearch"
            />
          </div>
          <div class="search-item">
            <label>数据源：</label>
            <select
              v-model="modeSourceFilter"
              class="form-select"
              @change="modeCurrentPage = 1"
            >
              <option value="">全部</option>
              <option
                v-for="item in modeSourceOptions"
                :key="item.code"
                :value="item.code"
              >
                {{ item.name }}
              </option>
            </select>
          </div>
          <div class="search-item">
            <label>接入模式：</label>
            <select
              v-model="modeAccessFilter"
              class="form-select"
              @change="onModeFilterChange"
            >
              <option value="">全部</option>
              <option value="offline">线下接入</option>
              <option value="online">线上接入</option>
            </select>
          </div>
          <el-button
            type="primary"
            icon="el-icon-search"
            @click="handleModeSearch"
            >查询</el-button
          >
          <el-button @click="handleModeReset">重置</el-button>
          <el-button
            type="primary"
            icon="el-icon-plus"
            @click="openAddModeDialog"
            >新增</el-button
          >
        </div>
      </div>

      <div class="content-wrapper content-wrapper--mode">
        <div class="table-panel">
          <div class="mode-tip">
            <i class="el-icon-info"></i>
            接入模式支持手动选择「线上接入」或「线下接入」；线上接入可配置南网数据中心或
            API 接口。
          </div>
          <div class="table-container table-hscroll-viewport">
            <el-table
              ref="modeTable"
              :data="modePagedListData"
              border
              stripe
              size="small"
              :fit="false"
              :style="{ width: modeTableScrollWidth + 'px' }"
              empty-text="暂无数据"
            >
              <el-table-column
                type="index"
                label="序号"
                width="60"
                :index="modeIndexMethod"
              />
              <el-table-column
                prop="sourceName"
                label="数据源名称"
                min-width="200"
                show-overflow-tooltip
              />
              <el-table-column label="接入模式" width="130" align="center">
                <template slot-scope="{ row }">
                  <el-select
                    :value="row.accessMode"
                    size="mini"
                    class="mode-access-select"
                    @change="(val) => handleAccessModeChange(row, val)"
                  >
                    <el-option label="线下接入" value="offline" />
                    <el-option label="线上接入" value="online" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="线上接入方式" width="120" align="center">
                <template slot-scope="{ row }">
                  <span v-if="row.accessMode === 'online'">{{
                    onlineTypeLabel(row.onlineType)
                  }}</span>
                  <span v-else class="text-muted">—</span>
                </template>
              </el-table-column>
              <el-table-column label="数据字段" min-width="420">
                <template slot-scope="{ row }">
                  <span class="mode-field-summary" :title="row.fieldSummary">
                    {{ row.fieldSummary }}
                  </span>
                  <span class="mode-field-count"
                    >（{{ (row.fields || []).length }}项）</span
                  >
                </template>
              </el-table-column>
              <el-table-column
                prop="applicableOrg"
                label="适用组织"
                min-width="160"
                show-overflow-tooltip
              />
              <el-table-column label="状态" width="90" align="center">
                <template slot-scope="{ row }">
                  <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
                    {{ row.enabled ? "已启用" : "未启用" }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="updateTime"
                label="最后修改时间"
                width="160"
                show-overflow-tooltip
              />
              <el-table-column
                prop="operator"
                label="操作人"
                width="90"
                show-overflow-tooltip
              />
              <el-table-column
                label="操作"
                width="100"
                fixed="right"
                align="center"
              >
                <template slot-scope="{ row }">
                  <el-button type="text" @click="openModeConfigDialog(row)"
                    >配置</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="pagination">
            <div class="pagination-info">
              <span>共{{ modeListTotal }}条</span>
              <select
                v-model.number="modePageSize"
                class="page-size-select"
                @change="modeCurrentPage = 1"
              >
                <option :value="10">10条/页</option>
                <option :value="25">25条/页</option>
                <option :value="50">50条/页</option>
              </select>
            </div>
            <div class="pagination-nav">
              <button
                class="page-btn"
                :disabled="modeCurrentPage === 1"
                @click="modeCurrentPage--"
              >
                <i class="el-icon-arrow-left"></i>
              </button>
              <button
                v-for="page in modeVisiblePages"
                :key="'m-' + page"
                class="page-btn"
                :class="{ active: modeCurrentPage === page }"
                @click="modeCurrentPage = page"
              >
                {{ page }}
              </button>
              <span v-if="modeShowEllipsis" class="page-ellipsis">...</span>
              <button
                class="page-btn"
                :disabled="modeCurrentPage === modeTotalPages"
                @click="modeCurrentPage++"
              >
                <i class="el-icon-arrow-right"></i>
              </button>
              <div class="jump-page">
                <span>跳至</span>
                <input
                  v-model="modeJumpPage"
                  type="number"
                  min="1"
                  :max="modeTotalPages"
                  @keyup.enter="modeJumpToPage"
                />
                <span>页</span>
                <button class="btn-go" @click="modeJumpToPage">GO</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模式配置弹窗（置于页签外层，避免切换页签时遮罩残留） -->
    <el-dialog
      :title="modeDialogTitle"
      :visible.sync="showModeDialog"
      width="600px"
      append-to-body
      :close-on-click-modal="false"
      @close="closeModeDialog"
    >
      <el-form
        ref="modeFormRef"
        :model="modeForm"
        :rules="modeFormRules"
        label-width="120px"
        size="small"
      >
        <el-form-item
          v-if="modeDialogMode === 'add'"
          label="数据源名称"
          prop="sourceName"
        >
          <el-input
            v-model="modeForm.sourceName"
            placeholder="请输入数据源名称"
            maxlength="80"
            show-word-limit
          />
        </el-form-item>
        <el-form-item v-else label="数据源名称">
          <span>{{ currentModeItem.sourceName }}</span>
        </el-form-item>
        <el-form-item
          v-if="modeDialogMode === 'add'"
          label="数据源编码"
          prop="sourceCode"
        >
          <el-input
            v-model="modeForm.sourceCode"
            placeholder="留空则自动生成，如 custom_travel"
          />
        </el-form-item>
        <el-form-item label="接入模式" prop="accessMode">
          <el-radio-group
            v-model="modeForm.accessMode"
            @change="onModeFormAccessChange"
          >
            <el-radio label="offline">线下接入</el-radio>
            <el-radio label="online">线上接入</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="modeForm.accessMode === 'online'"
          label="线上接入方式"
          prop="onlineType"
        >
          <el-radio-group v-model="modeForm.onlineType">
            <el-radio label="api">API接口</el-radio>
            <el-radio label="datacenter">南网数据中心</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="
            modeForm.accessMode === 'online' && modeForm.onlineType === 'api'
          "
          label="API地址"
          prop="apiUrl"
        >
          <el-input v-model="modeForm.apiUrl" placeholder="请输入接口地址" />
        </el-form-item>
        <el-form-item
          v-if="
            modeForm.accessMode === 'online' &&
            modeForm.onlineType === 'datacenter'
          "
          label="数据中心表"
          prop="datacenterTable"
        >
          <el-input
            v-model="modeForm.datacenterTable"
            placeholder="请输入数据中心表名/主题"
          />
        </el-form-item>
        <el-form-item
          v-if="modeDialogMode === 'add'"
          label="数据字段"
          prop="fieldsList"
        >
          <el-select
            v-model="modeForm.fieldsList"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入字段名称后回车添加"
            style="width: 100%"
          />
          <div class="form-hint">至少添加一个字段，如：姓名、人员ID</div>
        </el-form-item>
        <el-form-item
          v-else
          :label="`数据字段（共 ${(currentModeItem.fields || []).length} 项）`"
        >
          <div class="field-tags field-tags--scroll">
            <el-tag
              v-for="(f, idx) in currentModeItem.fields"
              :key="`${
                typeof f === 'object' ? f.code || f.en || f.zh : f
              }-${idx}`"
              size="mini"
              type="info"
              >{{ typeof f === "object" ? f.zh || f.code || f.en : f }}</el-tag
            >
          </div>
        </el-form-item>
        <el-form-item label="适用组织" prop="applicableOrg">
          <el-input
            v-model="modeForm.applicableOrg"
            placeholder="适用组织机构范围"
          />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch
            v-model="modeForm.enabled"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="modeForm.remark"
            type="textarea"
            :rows="2"
            placeholder="选填"
          />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="closeModeDialog">取消</el-button>
        <el-button
          type="primary"
          :loading="modeSaveLoading"
          @click="saveModeConfig"
          >保存</el-button
        >
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { generateOrgTree, matchOrgFilter } from "../utils/orgTree";
import { SENSING_ACCESS_SOURCES } from "../utils/dataAccessManagement";

const GATE_HEADERS = [
  "姓名",
  "电话",
  "人员ID",
  "所属组织机构",
  "组织机构ID",
  "闸机进入时间记录",
  "闸机出去时间记录",
];
const CANTEEN_HEADERS = [
  "姓名",
  "电话",
  "人员ID",
  "所属组织机构",
  "组织机构ID",
  "食堂早餐用餐记录",
  "食堂午餐用餐记录",
  "食堂晚餐用餐记录",
];
const MODE_STORAGE_KEY = "ygxwfx_data_custom_modes";

/** 模式维护列表顺序（与八类无感数据一致） */
const MODE_SOURCE_ORDER = [
  "offline_gate",
  "offline_canteen",
  "online_travel",
  "online_login",
  "online_leave",
  "online_learn",
  "online_workticket",
  "online_car",
];

function buildFieldSummary(fields) {
  if (!fields || fields.length === 0) return "—";

  // 兼容对象数组和字符串数组
  const fieldNames = fields.map((f) => {
    if (typeof f === "object" && f !== null) {
      return f.zh || f.code || f.en || "—";
    }
    return f;
  });

  // 如果字段太多，只显示前几个+总数
  if (fieldNames.length > 10) {
    return fieldNames.slice(0, 10).join("、") + " 等";
  }

  return fieldNames.join("、");
}

function fieldsFromSchema(sourceCode) {
  const src = SENSING_ACCESS_SOURCES.find((s) => s.code === sourceCode);
  return src
    ? src.fields.map((f) => ({
        code: f.en || f.code, // 使用 en 属性（英文代码）
        zh: f.zh,
        type: f.type,
      }))
    : [];
}

function isBuiltinModeSource(sourceCode) {
  return MODE_SOURCE_ORDER.includes(sourceCode);
}

/** 内置线上数据源 — 统一南网数据中心接入及源表 */
const ONLINE_DATACENTER_BY_CODE = {
  online_travel: "TWB_T_TRAVEL_TRAVEL_APPLY_I",
  online_learn: "TWC_HR_TRAIN_CLASS_STUDENT_HOURS_QTY_I",
  online_login: "TB_LOGIN_LOG",
  online_leave: "HR_STAFF_HUMAN_HOLIDAY",
  online_workticket: "TWC_SP_PD_REPAIR_PLAN_DET_A",
  online_car: "TWB_CAR_APPLY_I",
};

function normalizeOnlineModeItem(item) {
  const table = ONLINE_DATACENTER_BY_CODE[item.sourceCode];
  if (item.accessMode !== "online" || !table) return item;
  return {
    ...item,
    onlineType: "datacenter",
    apiUrl: "",
    datacenterTable: table,
  };
}

function syncBuiltinModeFields(item, template) {
  if (!template || !isBuiltinModeSource(item.sourceCode)) return item;
  return {
    ...item,
    sourceName: template.sourceName,
    fields: [...template.fields],
    fieldSummary: template.fieldSummary,
    fieldCount: template.fields.length,
  };
}

function normalizeModeConfigs(stored, defaults) {
  const defaultByCode = Object.fromEntries(
    (defaults || []).map((d) => [d.sourceCode, d]),
  );
  const storedByCode = new Map((stored || []).map((s) => [s.sourceCode, s]));

  const list = (defaults || []).map((def) => {
    const prev = storedByCode.get(def.sourceCode);
    let item = prev ? { ...def, ...prev, id: prev.id ?? def.id } : { ...def };
    item = normalizeOnlineModeItem(item);
    return syncBuiltinModeFields(item, def);
  });

  (stored || []).forEach((s) => {
    if (!defaultByCode[s.sourceCode]) {
      const fields = s.fields || [];
      list.push(
        normalizeOnlineModeItem({
          ...s,
          fieldSummary: s.fieldSummary || buildFieldSummary(fields),
          fieldCount: fields.length,
        }),
      );
    }
  });

  return list.sort((a, b) => (a.id || 0) - (b.id || 0));
}

function loadModeConfigsFromStorage(defaultList) {
  const STORAGE_KEY_WITH_VERSION = MODE_STORAGE_KEY + "_v2"; // 增加版本号强制更新

  // 强制清除旧缓存,避免字段重复和数据格式错误问题
  localStorage.removeItem(MODE_STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY_WITH_VERSION);

  // 直接使用最新的默认配置
  const initial = defaultList;
  localStorage.setItem(STORAGE_KEY_WITH_VERSION, JSON.stringify(initial));
  return initial;
}

function saveModeConfigsToStorage(list) {
  const STORAGE_KEY_WITH_VERSION = MODE_STORAGE_KEY + "_v2";
  localStorage.setItem(STORAGE_KEY_WITH_VERSION, JSON.stringify(list));
}

function createEmptyModeForm() {
  return {
    sourceName: "",
    sourceCode: "",
    fieldsList: [],
    accessMode: "online",
    onlineType: "datacenter",
    apiUrl: "",
    datacenterTable: "",
    applicableOrg: "云南电网有限责任公司",
    enabled: true,
    remark: "",
  };
}

export default {
  name: "DataCustom",
  data() {
    return {
      activeTab: "import",
      dataType: "gate",
      searchKeyword: "",
      selectedOrg: "",
      orgTreeKeyword: "",
      orgTree: [],
      gateData: [],
      canteenData: [],
      currentPage: 1,
      pageSize: 25,
      jumpPage: "",
      modeConfigs: [],
      modeSearchKeyword: "",
      modeSourceFilter: "",
      modeAccessFilter: "",
      modeCurrentPage: 1,
      modePageSize: 25,
      modeJumpPage: "",
      showModeDialog: false,
      modeDialogMode: "edit",
      modeSaveLoading: false,
      currentModeItem: {},
      modeForm: createEmptyModeForm(),
      modeFormRules: {
        sourceName: [
          { required: true, message: "请输入数据源名称", trigger: "blur" },
        ],
        accessMode: [
          { required: true, message: "请选择接入模式", trigger: "change" },
        ],
        fieldsList: [
          {
            type: "array",
            required: true,
            min: 1,
            message: "请至少添加一个数据字段",
            trigger: "change",
          },
        ],
        applicableOrg: [
          { required: true, message: "请填写适用组织", trigger: "blur" },
        ],
      },
      treeProps: {
        label: "name",
        children: "children",
      },
    };
  },
  computed: {
    importTableScrollWidth() {
      if (this.dataType === "gate") {
        return 60 + 90 + 120 + 110 + 220 + 120 + 180 + 180 + 170;
      }
      return 60 + 90 + 120 + 110 + 220 + 120 + 170 * 4;
    },
    modeTableScrollWidth() {
      return 60 + 200 + 130 + 130 + 420 + 160 + 90 + 160 + 100;
    },
    searchPlaceholder() {
      // 根据当前数据源显示不同的搜索提示
      const isOfflineSource = this.dataType.startsWith("offline_");
      if (isOfflineSource) {
        const sourceCode = this.dataType.replace("offline_", "");
        const modeConfig = this.modeConfigs.find(
          (m) => m.sourceCode === sourceCode,
        );
        if (modeConfig) {
          return `搜索${modeConfig.sourceName}的姓名、电话、人员ID`;
        }
      }
      return "搜索姓名、电话、人员ID";
    },
    offlineSources() {
      // 直接使用响应式的modeConfigs数据,而不是从localStorage读取
      // 这样当modeConfigs变化时,offlineSources会自动更新
      if (!this.modeConfigs || this.modeConfigs.length === 0) return [];

      console.log("=== offlineSources DEBUG ===");
      console.log("modeConfigs:", this.modeConfigs);

      // 过滤出接入模式为"线下接入"且已启用的数据源
      const offlineModes = this.modeConfigs.filter(
        (m) => m.accessMode === "offline" && m.enabled,
      );

      // 转换为按钮所需的格式
      return offlineModes.map((m) => ({
        id: m.id,
        sourceCode: m.sourceCode,
        sourceName: m.sourceName,
        dataType: `offline_${m.sourceCode}`, // 使用sourceCode作为唯一标识
      }));
    },
    // 当前数据源的字段配置
    currentDataSourceFields() {
      // 判断是否是线下数据源
      const isOfflineSource = this.dataType.startsWith("offline_");

      if (isOfflineSource) {
        // 从 sourceCode 提取实际编码 (去掉 'offline_' 前缀)
        const sourceCode = this.dataType.replace("offline_", "");

        // 从 modeConfigs 中查找对应的配置
        const modeConfig = this.modeConfigs.find(
          (m) => m.sourceCode === sourceCode,
        );

        if (modeConfig && modeConfig.fields && modeConfig.fields.length > 0) {
          // 兼容两种格式：字符串数组和对象数组
          // 使用 Map 去重，避免重复的字段
          const fieldMap = new Map();

          modeConfig.fields.forEach((f, index) => {
            let prop, label;

            // 如果是对象格式
            if (typeof f === "object" && f !== null) {
              prop = f.code || f.en || f.zh;
              label = f.zh || f.code || f.en;
            } else if (typeof f === "string") {
              // 如果是字符串格式(只有中文名称)
              prop = f;
              label = f;
            } else {
              return; // 跳过无效字段
            }

            // 如果 prop 已存在，跳过（去重）
            if (fieldMap.has(prop)) {
              return;
            }

            // 计算宽度
            const code = f.code || f.en || "";
            const width =
              code === "name" || label === "姓名"
                ? 90
                : code === "phone" || label === "电话"
                ? 120
                : code === "personId" ||
                  label === "人员ID" ||
                  label === "用户ID"
                ? 110
                : code === "orgName" ||
                  label === "所属组织机构" ||
                  label === "单位名称"
                ? 220
                : code === "orgId" ||
                  label === "组织机构ID" ||
                  label === "单位ID"
                ? 120
                : 150;

            fieldMap.set(prop, { prop, label, width });
          });

          const result = Array.from(fieldMap.values());
          return result;
        }
      }

      // 默认:闸机门禁(兼容旧版dataType)
      if (this.dataType === "gate") {
        return [
          { prop: "name", label: "姓名", width: 90 },
          { prop: "phone", label: "电话", width: 120 },
          { prop: "idCard", label: "员工身份证号", width: 180 },
          { prop: "orgName", label: "所属组织机构", width: 220 },
          { prop: "passTime", label: "时间", width: 170 },
          { prop: "entryTime", label: "闸机进入时间记录", width: 180 },
          { prop: "exitTime", label: "闸机出去时间记录", width: 180 },
        ];
      }

      // 默认:食堂用餐记录(兼容旧版dataType)
      if (this.dataType === "canteen") {
        return [
          { prop: "name", label: "姓名", width: 90 },
          { prop: "phone", label: "电话", width: 120 },
          { prop: "idCard", label: "员工身份证号", width: 180 },
          { prop: "orgName", label: "所属组织机构", width: 220 },
          { prop: "mealTime", label: "时间", width: 170 },
          { prop: "breakfast", label: "食堂早餐用餐记录", width: 170 },
          { prop: "lunch", label: "食堂午餐用餐记录", width: 170 },
          { prop: "dinner", label: "食堂晚餐用餐记录", width: 170 },
        ];
      }

      console.log("No fields found, returning empty array");
      return [];
    },
    // 获取当前数据源的基础字段映射(用于示例数据)
    currentBaseFieldMapping() {
      const isOfflineSource = this.dataType.startsWith("offline_");
      if (!isOfflineSource) return {};

      const sourceCode = this.dataType.replace("offline_", "");
      const modeConfig = this.modeConfigs.find(
        (m) => m.sourceCode === sourceCode,
      );

      if (!modeConfig || !modeConfig.fields) return {};

      // 查找 name, phone, personId, orgName, orgId 对应的实际字段
      const mapping = {};
      modeConfig.fields.forEach((f) => {
        // 兼容对象和字符串格式
        if (typeof f === "string") return; // 跳过字符串格式的字段
        if (!f || !f.zh) return; // 跳过无效字段

        const code = (f.code || f.en || "").toLowerCase();
        const zh = f.zh || "";
        const actualCode = f.code || f.en; // 实际使用的代码

        // 映射姓名字段
        if (
          code.includes("name") ||
          zh.includes("姓名") ||
          zh.includes("人员名称") ||
          zh.includes("用户") ||
          zh.includes("制单人")
        ) {
          if (!mapping.name) mapping.name = actualCode;
        }
        // 映射电话字段
        if (
          code.includes("phone") ||
          code.includes("mobile") ||
          zh.includes("电话") ||
          zh.includes("手机")
        ) {
          if (!mapping.phone) mapping.phone = actualCode;
        }
        // 映射人员ID字段
        if (
          code.includes("user_id") ||
          code.includes("person_id") ||
          code.includes("traveler_id") ||
          zh.includes("人员ID") ||
          zh.includes("用户ID") ||
          zh.includes("制单人ID")
        ) {
          if (!mapping.personId) mapping.personId = actualCode;
        }
        // 映射组织名称字段
        if (
          zh.includes("单位名称") ||
          zh.includes("部门名称") ||
          zh.includes("组织名称")
        ) {
          if (!mapping.orgName) mapping.orgName = actualCode;
        }
        // 映射组织ID字段
        if (
          code.includes("org_id") ||
          code.includes("unit_id") ||
          code.includes("dept_id") ||
          zh.includes("单位ID") ||
          zh.includes("部门ID") ||
          zh.includes("组织ID")
        ) {
          if (!mapping.orgId) mapping.orgId = actualCode;
        }
      });

      return mapping;
    },
    filteredOrgTree() {
      const keyword = this.orgTreeKeyword.trim();
      if (!keyword) return this.orgTree;

      const filterNodes = (nodes) =>
        nodes.reduce((acc, node) => {
          const children = node.children ? filterNodes(node.children) : [];
          const matched = node.name.includes(keyword);
          if (matched || children.length) {
            acc.push({
              ...node,
              children: children.length ? children : node.children,
            });
          }
          return acc;
        }, []);

      return filterNodes(this.orgTree);
    },
    activeListData() {
      // 判断是否是线下数据源
      const isOfflineSource = this.dataType.startsWith("offline_");

      let source;
      if (isOfflineSource) {
        // 从 sourceCode 提取实际编码
        const sourceCode = this.dataType.replace("offline_", "");

        // 根据 sourceCode 返回对应的数据
        if (sourceCode === "offline_gate") {
          source = this.gateData;
        } else if (sourceCode === "offline_canteen") {
          source = this.canteenData;
        } else {
          // 其他6个数据源,动态生成示例数据
          source = this.generateOtherDataSourceMockData(sourceCode);
        }
      } else {
        // 兼容旧的硬编码数据源
        source = this.dataType === "gate" ? this.gateData : this.canteenData;
      }

      let data = source;

      // 获取字段映射,用于搜索
      const mapping = this.currentBaseFieldMapping;

      if (this.selectedOrg) {
        data = data.filter((item) => {
          const orgValue = mapping.orgName
            ? item[mapping.orgName]
            : item.orgName;
          return matchOrgFilter(orgValue, this.selectedOrg);
        });
      }
      if (this.searchKeyword.trim()) {
        const kw = this.searchKeyword.trim();
        data = data.filter((item) => {
          const nameValue = mapping.name ? item[mapping.name] : item.name;
          const phoneValue = mapping.phone ? item[mapping.phone] : item.phone;
          const personIdValue = mapping.personId
            ? item[mapping.personId]
            : item.personId;

          return (
            (nameValue && String(nameValue).includes(kw)) ||
            (phoneValue && String(phoneValue).includes(kw)) ||
            (personIdValue && String(personIdValue).includes(kw))
          );
        });
      }
      return data;
    },
    pagedListData() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.activeListData.slice(start, start + this.pageSize);
    },
    listTotal() {
      return this.activeListData.length;
    },
    listTotalPages() {
      return Math.max(1, Math.ceil(this.listTotal / this.pageSize));
    },
    listVisiblePages() {
      const pages = [];
      const total = this.listTotalPages;
      const current = this.currentPage;

      if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
      } else if (current <= 4) {
        pages.push(1, 2, 3, 4, 5);
      } else if (current >= total - 3) {
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(current - 2, current - 1, current, current + 1, current + 2);
      }
      return pages;
    },
    listShowEllipsis() {
      return (
        this.listTotalPages > 7 &&
        !(this.currentPage <= 4 || this.currentPage >= this.listTotalPages - 3)
      );
    },
    modeSourceOptions() {
      return [...this.modeConfigs]
        .sort((a, b) => (a.id || 0) - (b.id || 0))
        .map((item) => ({ code: item.sourceCode, name: item.sourceName }));
    },
    modeActiveListData() {
      let data = this.modeConfigs;

      if (this.modeSourceFilter) {
        data = data.filter((item) => item.sourceCode === this.modeSourceFilter);
      }
      if (this.modeAccessFilter) {
        data = data.filter((item) => item.accessMode === this.modeAccessFilter);
      }
      if (this.modeSearchKeyword.trim()) {
        const kw = this.modeSearchKeyword.trim();
        data = data.filter(
          (item) =>
            item.sourceName.includes(kw) || item.fieldSummary.includes(kw),
        );
      }
      return data;
    },
    modePagedListData() {
      const start = (this.modeCurrentPage - 1) * this.modePageSize;
      return this.modeActiveListData.slice(start, start + this.modePageSize);
    },
    modeListTotal() {
      return this.modeActiveListData.length;
    },
    modeTotalPages() {
      return Math.max(1, Math.ceil(this.modeListTotal / this.modePageSize));
    },
    modeVisiblePages() {
      const pages = [];
      const total = this.modeTotalPages;
      const current = this.modeCurrentPage;

      if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
      } else if (current <= 4) {
        pages.push(1, 2, 3, 4, 5);
      } else if (current >= total - 3) {
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(current - 2, current - 1, current, current + 1, current + 2);
      }
      return pages;
    },
    modeShowEllipsis() {
      return (
        this.modeTotalPages > 7 &&
        !(
          this.modeCurrentPage <= 4 ||
          this.modeCurrentPage >= this.modeTotalPages - 3
        )
      );
    },
    modeDialogTitle() {
      if (this.modeDialogMode === "add") return "新增数据源模式";
      return `数据源模式配置 - ${this.currentModeItem.sourceName || ""}`;
    },
  },
  mounted() {
    this.orgTree = generateOrgTree();
    this.gateData = this.generateGateMockData();
    this.canteenData = this.generateCanteenMockData();
    this.modeConfigs = loadModeConfigsFromStorage(this.generateModeConfigs());

    // 默认选中第一个线下接入的数据源
    this.$nextTick(() => {
      if (this.offlineSources && this.offlineSources.length > 0) {
        this.dataType = this.offlineSources[0].dataType;
      }
    });

    this.$nextTick(() => this.layoutImportTable());
  },
  watch: {
    activeTab(val) {
      if (val !== "mode") {
        this.closeModeDialog();
      }
      if (val === "import") {
        this.$nextTick(() => this.layoutImportTable());
      }
      if (val === "mode") {
        this.$nextTick(() => this.layoutModeTable());
      }
    },
    dataType() {
      this.$nextTick(() => this.layoutImportTable());
    },
  },
  methods: {
    layoutImportTable() {
      const table = this.$refs.importTable;
      if (table && table.doLayout) {
        table.doLayout();
      }
    },
    layoutModeTable() {
      const table = this.$refs.modeTable;
      if (table && table.doLayout) {
        table.doLayout();
      }
    },
    switchDataType(type) {
      this.dataType = type;
      this.currentPage = 1;
      this.searchKeyword = "";
    },
    indexMethod(index) {
      return (this.currentPage - 1) * this.pageSize + index + 1;
    },
    handleOrgNodeClick(data) {
      if (data.id === 1) {
        this.selectedOrg = "";
      } else {
        this.selectedOrg = data.name;
      }
      this.currentPage = 1;
    },
    onModeFilterChange() {
      this.modeCurrentPage = 1;
    },
    handleModeSearch() {
      this.modeCurrentPage = 1;
      this.$message.success(`查询成功，共找到 ${this.modeListTotal} 条记录`);
    },
    handleModeReset() {
      this.modeSearchKeyword = "";
      this.modeSourceFilter = "";
      this.modeAccessFilter = "";
      this.modeCurrentPage = 1;
    },
    modeJumpToPage() {
      const page = parseInt(this.modeJumpPage, 10);
      if (page >= 1 && page <= this.modeTotalPages) {
        this.modeCurrentPage = page;
      }
      this.modeJumpPage = "";
    },
    modeIndexMethod(index) {
      return (this.modeCurrentPage - 1) * this.modePageSize + index + 1;
    },
    onlineTypeLabel(type) {
      return type === "api"
        ? "API接口"
        : type === "datacenter"
        ? "南网数据中心"
        : "—";
    },
    applyAccessMode(target, accessMode) {
      target.accessMode = accessMode;
      if (accessMode === "offline") {
        target.onlineType = "";
        target.apiUrl = "";
        target.datacenterTable = "";
      } else {
        target.onlineType = target.onlineType || "datacenter";
        if (target.onlineType === "datacenter" && !target.datacenterTable) {
          target.datacenterTable =
            ONLINE_DATACENTER_BY_CODE[target.sourceCode] || "";
        }
      }
      target.updateTime = this.formatDateTime();
      target.operator = "当前用户";
    },
    handleAccessModeChange(row, accessMode) {
      if (!accessMode || row.accessMode === accessMode) return;
      const target = this.modeConfigs.find((item) => item.id === row.id);
      if (!target) return;
      this.applyAccessMode(target, accessMode);
      saveModeConfigsToStorage(this.modeConfigs);
      this.$message.success(
        `已切换为${accessMode === "online" ? "线上接入" : "线下接入"}`,
      );
    },
    openModeConfigDialog(row) {
      this.modeDialogMode = "edit";
      this.currentModeItem = { ...row };
      this.modeForm = {
        ...createEmptyModeForm(),
        accessMode: row.accessMode,
        onlineType: row.onlineType || "datacenter",
        apiUrl: row.apiUrl || "",
        datacenterTable: row.datacenterTable || "",
        applicableOrg: row.applicableOrg || "",
        enabled: row.enabled,
        remark: row.remark || "",
      };
      this.showModeDialog = true;
      this.$nextTick(() => {
        if (this.$refs.modeFormRef) this.$refs.modeFormRef.clearValidate();
      });
    },
    openAddModeDialog() {
      this.modeDialogMode = "add";
      this.currentModeItem = {};
      this.modeForm = createEmptyModeForm();
      this.showModeDialog = true;
      this.$nextTick(() => {
        if (this.$refs.modeFormRef) this.$refs.modeFormRef.clearValidate();
      });
    },
    closeModeDialog() {
      this.showModeDialog = false;
      this.modeSaveLoading = false;
      this.modeDialogMode = "edit";
      this.$nextTick(() => {
        document.body.classList.remove("el-popup-parent--hidden");
        const modal = document.querySelector(".v-modal");
        if (
          modal &&
          !document.querySelector(
            ".el-dialog__wrapper:not([style*='display: none'])",
          )
        ) {
          modal.parentNode && modal.parentNode.removeChild(modal);
        }
      });
    },
    onModeFormAccessChange(val) {
      if (val === "offline") {
        this.modeForm.onlineType = "";
        this.modeForm.apiUrl = "";
        this.modeForm.datacenterTable = "";
      } else if (!this.modeForm.onlineType) {
        this.modeForm.onlineType = "datacenter";
      }
    },
    validateModeForm() {
      if (this.modeForm.accessMode === "online") {
        if (!this.modeForm.onlineType) {
          this.$message.warning("请选择线上接入方式");
          return false;
        }
        if (
          this.modeForm.onlineType === "api" &&
          !this.modeForm.apiUrl.trim()
        ) {
          this.$message.warning("请填写 API 接口地址");
          return false;
        }
        if (
          this.modeForm.onlineType === "datacenter" &&
          !this.modeForm.datacenterTable.trim()
        ) {
          this.$message.warning("请填写数据中心表名");
          return false;
        }
      }
      return true;
    },
    saveModeConfig() {
      const submit = () => {
        if (!this.validateModeForm()) return;

        this.modeSaveLoading = true;
        setTimeout(() => {
          if (this.modeDialogMode === "add") {
            const name = this.modeForm.sourceName.trim();
            if (this.modeConfigs.some((item) => item.sourceName === name)) {
              this.modeSaveLoading = false;
              this.$message.warning("数据源名称已存在");
              return;
            }
            const newId = this.modeConfigs.length
              ? Math.max(...this.modeConfigs.map((item) => item.id)) + 1
              : 1;
            const fields = [...this.modeForm.fieldsList];
            const code =
              this.modeForm.sourceCode.trim() ||
              `custom_${Date.now().toString(36)}`;
            const item = {
              id: newId,
              sourceCode: code,
              sourceName: name,
              fields,
              fieldSummary: buildFieldSummary(fields),
              fieldCount: fields.length,
              accessMode: this.modeForm.accessMode,
              onlineType:
                this.modeForm.accessMode === "online"
                  ? this.modeForm.onlineType
                  : "",
              apiUrl:
                this.modeForm.accessMode === "online" &&
                this.modeForm.onlineType === "api"
                  ? this.modeForm.apiUrl.trim()
                  : "",
              datacenterTable:
                this.modeForm.accessMode === "online" &&
                this.modeForm.onlineType === "datacenter"
                  ? this.modeForm.datacenterTable.trim()
                  : "",
              applicableOrg: this.modeForm.applicableOrg.trim(),
              enabled: this.modeForm.enabled,
              remark: this.modeForm.remark || "",
              updateTime: this.formatDateTime(),
              operator: "当前用户",
              isCustom: true,
            };
            this.modeConfigs.unshift(item);
            saveModeConfigsToStorage(this.modeConfigs);
            this.modeCurrentPage = 1;
            this.$message.success("新增成功");
          } else {
            const target = this.modeConfigs.find(
              (item) => item.id === this.currentModeItem.id,
            );
            if (target) {
              this.applyAccessMode(target, this.modeForm.accessMode);
              if (target.accessMode === "online") {
                target.onlineType = this.modeForm.onlineType;
                target.apiUrl = this.modeForm.apiUrl;
                target.datacenterTable = this.modeForm.datacenterTable;
              }
              target.applicableOrg = this.modeForm.applicableOrg;
              target.enabled = this.modeForm.enabled;
              target.remark = this.modeForm.remark;
            }
            saveModeConfigsToStorage(this.modeConfigs);
            this.$message.success("配置保存成功");
          }
          this.modeSaveLoading = false;
          this.showModeDialog = false;
        }, 400);
      };

      if (this.modeDialogMode === "add") {
        this.$refs.modeFormRef.validate((valid) => {
          if (valid) submit();
        });
      } else {
        submit();
      }
    },
    generateModeConfigs() {
      const orgDefault = "云南电网有限责任公司";
      const now = "2026-05-27 16:00:00";
      const byCode = Object.fromEntries(
        SENSING_ACCESS_SOURCES.map((s) => [s.code, s]),
      );

      return MODE_SOURCE_ORDER.map((code, index) => {
        const src = byCode[code];
        if (!src) return null;
        const fields = fieldsFromSchema(code);
        const base = {
          id: index + 1,
          sourceCode: code,
          sourceName: src.name,
          fields,
          fieldSummary: buildFieldSummary(fields),
          fieldCount: fields.length,
          enabled: true,
          applicableOrg: orgDefault,
          updateTime: now,
          operator: "张三",
          remark: "",
        };
        if (src.category === "offline") {
          return {
            ...base,
            accessMode: "offline",
            onlineType: "",
            apiUrl: "",
            datacenterTable: "",
          };
        }
        return {
          ...base,
          accessMode: "online",
          onlineType: "datacenter",
          apiUrl: "",
          datacenterTable: ONLINE_DATACENTER_BY_CODE[code] || src.sourceTable,
        };
      }).filter(Boolean);
    },
    handleSearch() {
      this.currentPage = 1;
      this.$message.success(`查询成功，共找到 ${this.listTotal} 条记录`);
    },
    handleReset() {
      this.searchKeyword = "";
      this.selectedOrg = "";
      this.orgTreeKeyword = "";
      this.currentPage = 1;
    },
    jumpToPage() {
      const page = parseInt(this.jumpPage, 10);
      if (page >= 1 && page <= this.listTotalPages) {
        this.currentPage = page;
      }
      this.jumpPage = "";
    },
    downloadTemplate() {
      // 使用动态字段配置生成表头
      const headers = this.currentDataSourceFields.map((f) => f.label);

      // 根据当前数据源生成文件名
      const isOfflineSource = this.dataType.startsWith("offline_");
      let sourceName = "无感数据";
      if (isOfflineSource) {
        const sourceCode = this.dataType.replace("offline_", "");
        const modeConfig = this.modeConfigs.find(
          (m) => m.sourceCode === sourceCode,
        );
        if (modeConfig) {
          sourceName = modeConfig.sourceName;
        }
      }

      this.downloadCsv(headers, [], `${sourceName}导入模板.csv`);
      this.$message.success("模板下载成功");
    },
    exportData() {
      const data = this.activeListData;
      if (!data.length) {
        this.$message.warning("没有数据可导出");
        return;
      }

      // 使用动态字段配置生成表头
      const headers = this.currentDataSourceFields.map((f) => f.label);
      headers.push("导入时间");

      const rows = data.map((item) => {
        // 根据当前字段配置提取数据
        const row = this.currentDataSourceFields.map((f) => item[f.prop] || "");
        row.push(item.importTime);
        return row;
      });

      // 根据当前数据源生成文件名
      const isOfflineSource = this.dataType.startsWith("offline_");
      let sourceName = "无感数据";
      if (isOfflineSource) {
        const sourceCode = this.dataType.replace("offline_", "");
        const modeConfig = this.modeConfigs.find(
          (m) => m.sourceCode === sourceCode,
        );
        if (modeConfig) {
          sourceName = modeConfig.sourceName;
        }
      }

      this.downloadCsv(headers, rows, `${sourceName}_${this.formatDate()}.csv`);
      this.$message.success("导出成功");
    },
    handleImportFile(file) {
      const raw = file.raw;
      if (!raw) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = String(e.target.result).replace(/^\uFEFF/, "");
          const lines = text.split(/\r?\n/).filter((line) => line.trim());
          if (lines.length < 2) {
            this.$message.error("文件内容为空或格式不正确");
            return;
          }
          const headers = this.parseCsvLine(lines[0]);
          const expected =
            this.dataType === "gate" ? GATE_HEADERS : CANTEEN_HEADERS;
          const valid = expected.every((h, i) => headers[i] === h);
          if (!valid) {
            this.$message.error(
              "导入文件表头与当前数据类型模板不一致，请使用对应模板",
            );
            return;
          }

          const imported = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = this.parseCsvLine(lines[i]);
            if (!cols.length || !cols[0]) continue;
            const now = this.formatDateTime();
            if (this.dataType === "gate") {
              imported.push({
                id: Date.now() + i,
                name: cols[0],
                phone: cols[1],
                personId: cols[2],
                orgName: cols[3],
                orgId: cols[4],
                entryTime: cols[5],
                exitTime: cols[6],
                importTime: now,
              });
            } else {
              imported.push({
                id: Date.now() + i,
                name: cols[0],
                phone: cols[1],
                personId: cols[2],
                orgName: cols[3],
                orgId: cols[4],
                breakfast: cols[5],
                lunch: cols[6],
                dinner: cols[7],
                importTime: now,
              });
            }
          }

          if (!imported.length) {
            this.$message.warning("未解析到有效数据行");
            return;
          }

          if (this.dataType === "gate") {
            this.gateData = [...imported, ...this.gateData];
          } else {
            this.canteenData = [...imported, ...this.canteenData];
          }
          this.currentPage = 1;
          this.$message.success(`成功导入 ${imported.length} 条数据`);
        } catch (err) {
          this.$message.error("文件解析失败，请检查格式");
        }
      };
      reader.readAsText(raw, "UTF-8");
    },
    parseCsvLine(line) {
      const result = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === "," && !inQuotes) {
          result.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
      result.push(cur);
      return result;
    },
    downloadCsv(headers, rows, fileName) {
      let content = "\uFEFF" + headers.join(",") + "\n";
      rows.forEach((row) => {
        content +=
          row
            .map((cell) => {
              const val = cell == null ? "" : String(cell);
              return val.match(/[,"\n]/) ? `"${val.replace(/"/g, '""')}"` : val;
            })
            .join(",") + "\n";
      });
      const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
    },
    formatDate() {
      return new Date().toLocaleDateString().replace(/\//g, "-");
    },
    formatDateTime() {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate(),
      )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    },
    generateGateMockData() {
      const orgs = [
        {
          name: "办公室（党委办公室、董事会办公室、总经理办公室）",
          id: "ORG-108",
        },
        { name: "人力资源部", id: "ORG-110" },
        { name: "数字化部", id: "ORG-115" },
        { name: "生产技术部", id: "ORG-119" },
        { name: "市场营销部（客户服务部）", id: "ORG-116" },
      ];
      const names = [
        "张伟",
        "李娜",
        "王强",
        "刘洋",
        "陈静",
        "赵敏",
        "孙浩",
        "周婷",
      ];
      const list = [];
      for (let i = 0; i < 48; i++) {
        const org = orgs[i % orgs.length];
        const day = String((i % 28) + 1).padStart(2, "0");
        list.push({
          id: i + 1,
          name: names[i % names.length],
          phone: `138${String(10000000 + i).slice(-8)}`,
          idCard: `530${String(i % 10)}${String(1000000000 + i).slice(-10)}`,
          orgName: org.name,
          passTime: `2026-05-${day} 08:${String((i % 50) + 10).padStart(
            2,
            "0",
          )}:00`,
          entryTime: `2026-05-${day} 08:${String((i % 50) + 10).padStart(
            2,
            "0",
          )}:00`,
          exitTime: `2026-05-${day} 18:${String((i % 50) + 10).padStart(
            2,
            "0",
          )}:00`,
          importTime: `2026-05-27 ${String(9 + (i % 8)).padStart(
            2,
            "0",
          )}:30:00`,
        });
      }
      return list;
    },
    /** 食堂用餐记录：有记录返回 yyyy-MM-dd HH:mm:ss，无记录返回 — */
    formatMealTime(i, mealOffset, baseHour) {
      const slot = (i + mealOffset) % 3;
      if (slot !== 0) return "—";
      const day = String((i % 28) + 1).padStart(2, "0");
      const hour = baseHour + (i % 2);
      const minute = String((i * 7 + mealOffset * 11) % 60).padStart(2, "0");
      return `2026-05-${day} ${String(hour).padStart(2, "0")}:${minute}:00`;
    },
    generateCanteenMockData() {
      const orgs = [
        {
          name: "办公室（党委办公室、董事会办公室、总经理办公室）",
          id: "ORG-108",
        },
        { name: "人力资源部", id: "ORG-110" },
        { name: "数字化部", id: "ORG-115" },
        { name: "生产技术部", id: "ORG-119" },
      ];
      const names = ["张明", "李华", "王芳", "赵军", "杨丽", "吴刚"];
      const list = [];
      for (let i = 0; i < 42; i++) {
        const org = orgs[i % orgs.length];
        const day = String((i % 28) + 1).padStart(2, "0");
        list.push({
          id: i + 1,
          name: names[i % names.length],
          phone: `139${String(20000000 + i).slice(-8)}`,
          idCard: `530${String(i % 10)}${String(1000000000 + i).slice(-10)}`,
          orgName: org.name,
          mealTime: `2026-05-${day} 12:${String((i % 50) + 10).padStart(
            2,
            "0",
          )}:00`,
          breakfast: this.formatMealTime(i, 0, 7),
          lunch: this.formatMealTime(i, 1, 12),
          dinner: this.formatMealTime(i, 2, 18),
          importTime: `2026-05-26 ${String(10 + (i % 6)).padStart(
            2,
            "0",
          )}:15:00`,
        });
      }
      return list;
    },
    // 为其他6个数据源生成示例数据(暂时清空)
    generateOtherDataSourceMockData(sourceCode) {
      // 返回空数组,不生成示例数据
      return [];
    },
  },
};
</script>

<style scoped>
.data-custom-page {
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

.third-tabs .tab:hover {
  color: #409eff;
  background-color: #f5f7fa;
}

.third-tabs .tab.active {
  color: #409eff;
  font-weight: 600;
  border-bottom-color: #409eff;
  background-color: #ecf5ff;
}

.sub-tabs {
  display: flex;
  gap: 0;
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

.sub-tab:hover {
  color: #409eff;
}

.sub-tab.active {
  color: #fff;
  background: #409eff;
}

/* 线下接入数据源按钮样式 */
.sub-tab-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.sub-tab-button:hover {
  color: #409eff;
  background: #ecf5ff;
}

.sub-tab-button.active {
  color: #fff;
  background: #409eff;
}

.search-area {
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e8eaed;
}

.search-row {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
}

.search-row .el-button {
  flex-shrink: 0;
}

.import-upload {
  display: inline-block;
}

.search-item {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.search-item.search-item-keyword {
  position: relative;
  width: 220px;
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

.search-input:focus {
  border-color: #409eff;
}

.content-wrapper {
  display: flex;
  gap: 16px;
  min-height: 0;
}

.content-wrapper--mode .table-panel {
  width: 100%;
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
  display: flex;
  align-items: center;
}

.panel-header i {
  margin-right: 8px;
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
}

.custom-tree-node {
  display: flex;
  align-items: center;
  overflow: hidden;
}

.tree-node-icon {
  margin-right: 6px;
  color: #909399;
  font-size: 14px;
}

.tree-node-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.tree-container ::v-deep .el-tree-node__content {
  height: 36px;
}

.tree-container ::v-deep .el-tree-node.is-current > .el-tree-node__content {
  background-color: #ecf5ff;
  color: #409eff;
}

.table-panel {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8eaed;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.table-container {
  flex: 1;
  overflow: hidden;
  padding: 16px;
  min-height: 0;
}

.table-hscroll-viewport {
  overflow-x: auto;
  overflow-y: visible;
  width: 100%;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #606266;
}

.page-size-select {
  height: 28px;
  padding: 0 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
}

.pagination-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
}

.page-btn.active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.page-btn:disabled {
  cursor: not-allowed;
  color: #c0c4cc;
  background: #f5f7fa;
}

.page-ellipsis {
  color: #909399;
}

.jump-page {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  font-size: 13px;
  color: #606266;
}

.jump-page input {
  width: 50px;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
}

.btn-go {
  height: 32px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
}

.form-select {
  height: 32px;
  padding: 0 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  background: #fff;
  min-width: 140px;
}

.form-select:focus {
  outline: none;
  border-color: #409eff;
}

.mode-tip {
  padding: 10px 16px;
  margin: 0 12px;
  margin-top: 12px;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.mode-tip i {
  color: #409eff;
  margin-right: 6px;
}

.text-muted {
  color: #c0c4cc;
}

.form-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
  line-height: 1.4;
}

.field-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.field-tags--scroll {
  max-height: 200px;
  overflow-y: auto;
  padding: 4px 0;
}

.mode-field-summary {
  display: inline;
  line-height: 1.5;
  word-break: break-all;
}

.mode-field-count {
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
}

.mode-access-select {
  width: 108px;
}

.mode-access-select >>> .el-input__inner {
  padding: 0 8px;
  text-align: center;
}
</style>
