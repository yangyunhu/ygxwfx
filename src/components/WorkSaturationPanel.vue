<template>
  <div class="work-saturation-panel">
    <el-tabs v-model="subTab" class="sub-tabs">
      <el-tab-pane label="工作饱和度计算" name="calc" />
      <el-tab-pane label="饱和度规则设定" name="rules" />
      <el-tab-pane label="饱和度关联岗位配置" name="positions" />
      <el-tab-pane label="饱和度分析" name="analysis" />
      <el-tab-pane label="饱和度预警规则配置" name="overtimeWarn" />
    </el-tabs>

    <!-- 1. 工作饱和度计算 -->
    <div v-show="subTab === 'calc'" class="sub-tab-body">
      <section class="panel-section">
        <el-form :inline="true" size="small" class="section-form">
          <el-form-item label="单位：">
            <el-select v-model="calcQuery.unit" style="width: 160px">
              <el-option v-for="opt in unitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="部门：">
            <el-select v-model="calcQuery.department" style="width: 150px">
              <el-option v-for="opt in departmentOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-radio-group v-model="calcQuery.granularity" size="small">
              <el-radio label="day">日</el-radio>
              <el-radio label="week">周</el-radio>
              <el-radio label="month">月</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item class="section-form__actions">
            <el-button type="primary" plain icon="el-icon-upload2" @click="handleCalcExport">导出</el-button>
            <el-button type="primary" icon="el-icon-search" @click="handleCalcQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetCalcQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="pagedCalcData" border stripe size="small" header-cell-class-name="panel-table-header">
          <el-table-column prop="rank" label="排名" width="80" align="center" />
          <el-table-column prop="employeeName" label="姓名" width="100" align="center" />
          <el-table-column label="工作饱和度" width="120" align="center">
            <template slot-scope="scope">
              <span :class="saturationClass(scope.row.saturation)">{{ scope.row.saturation }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="taskHours" label="任务工时" width="100" align="center" />
          <el-table-column prop="actualHours" label="实际工作时长" width="130" align="center" />
        </el-table>
        <div class="panel-pagination">
          <el-pagination
            :current-page="calcPage"
            :page-sizes="[10, 25, 50]"
            :page-size="calcPageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredCalcData.length"
            @size-change="onCalcSizeChange"
            @current-change="(v) => { calcPage = v; }"
          />
        </div>
      </section>
    </div>

    <!-- 2. 饱和度规则设定 -->
    <div v-show="subTab === 'rules'" class="sub-tab-body">
      <section class="panel-section">
        <el-form :inline="true" size="small" class="section-form">
          <el-form-item label="单位：">
            <el-select v-model="ruleQuery.unit" style="width: 160px">
              <el-option v-for="opt in unitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="饱和度层级：">
            <el-select v-model="ruleQuery.level" style="width: 120px">
              <el-option v-for="opt in levelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item class="section-form__actions">
            <el-button type="primary" icon="el-icon-search" @click="handleRuleQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetRuleQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="section-toolbar">
          <el-button type="primary" size="small" icon="el-icon-plus" @click="openRuleDialog()">新增规则</el-button>
        </div>

        <el-table
          :data="pagedRuleData"
          border
          stripe
          size="small"
          header-cell-class-name="panel-table-header"
          @selection-change="(s) => { ruleSelection = s; }"
        >
          <el-table-column type="selection" width="48" align="center" />
          <el-table-column type="index" label="序号" width="70" align="center" :index="ruleIndexMethod" />
          <el-table-column prop="ruleName" label="饱和度名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="level" label="饱和度层级" width="110" align="center">
            <template slot-scope="scope">
              <el-tag :type="levelTagType(scope.row.level)" size="mini">{{ scope.row.level }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="threshold" label="阈值" width="120" align="center" />
          <el-table-column prop="effectScope" label="生效范围" width="110" align="center" />
          <el-table-column prop="changeTime" label="变更时间" width="150" align="center">
            <template slot-scope="scope">{{ scope.row.changeTime || "—" }}</template>
          </el-table-column>
          <el-table-column prop="changeUser" label="变更用户" width="100" align="center" />
          <el-table-column prop="prevRule" label="变更前规则" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openRuleDialog(scope.row)">编辑</el-button>
              <el-button type="text" size="small" class="danger-text" @click="handleRuleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="panel-pagination">
          <el-pagination
            :current-page="rulePage"
            :page-sizes="[10, 25, 50]"
            :page-size="rulePageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredRuleData.length"
            @size-change="onRuleSizeChange"
            @current-change="(v) => { rulePage = v; }"
          />
        </div>
      </section>
    </div>

    <!-- 3. 饱和度关联岗位配置 -->
    <div v-show="subTab === 'positions'" class="sub-tab-body">
      <section class="panel-section">
        <el-form :inline="true" size="small" class="section-form">
          <el-form-item label="单位：">
            <el-select v-model="positionQuery.unit" style="width: 160px">
              <el-option v-for="opt in unitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="出勤模式：">
            <el-select v-model="positionQuery.attendanceMode" style="width: 140px">
              <el-option v-for="opt in attendanceModeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item class="section-form__actions">
            <el-button type="primary" icon="el-icon-search" @click="handlePositionQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetPositionQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="section-toolbar">
          <el-button type="primary" size="small" icon="el-icon-plus" @click="openPositionDialog()">
            新增饱和度关联岗位配置
          </el-button>
        </div>

        <el-table :data="pagedPositionData" border stripe size="small" header-cell-class-name="panel-table-header">
          <el-table-column type="index" label="序号" width="70" align="center" :index="positionIndexMethod" />
          <el-table-column prop="employeeName" label="员工姓名" width="100" align="center" />
          <el-table-column prop="department" label="所在部门" min-width="130" show-overflow-tooltip />
          <el-table-column prop="position" label="岗位" min-width="120" show-overflow-tooltip />
          <el-table-column prop="attendanceMode" label="出勤模式" width="110" align="center" />
          <el-table-column prop="linkedRuleName" label="关联的饱和度名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="judgeResult" label="饱和度判定结果" width="130" align="center">
            <template slot-scope="scope">
              <el-tag :type="levelTagType(scope.row.judgeResult)" size="mini">{{ scope.row.judgeResult }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openPositionDialog(scope.row)">修改饱和度关联岗位</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="panel-pagination">
          <el-pagination
            :current-page="positionPage"
            :page-sizes="[10, 25, 50]"
            :page-size="positionPageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredPositionData.length"
            @size-change="onPositionSizeChange"
            @current-change="(v) => { positionPage = v; }"
          />
        </div>
      </section>
    </div>

    <!-- 4. 饱和度分析 -->
    <div v-show="subTab === 'analysis'" class="sub-tab-body">
      <section class="panel-section chart-section">
        <h3 class="block-title"><span class="section-dot" />饱和度分级</h3>
        <el-form :inline="true" size="small" class="section-form section-form--compact">
          <el-form-item label="时间：">
            <el-date-picker v-model="gradingQuery.startDate" type="date" value-format="yyyy-MM-dd" style="width: 140px" />
            <span class="date-sep">~</span>
            <el-date-picker v-model="gradingQuery.endDate" type="date" value-format="yyyy-MM-dd" style="width: 140px" />
          </el-form-item>
          <el-form-item class="section-form__actions">
            <el-button type="primary" icon="el-icon-search" @click="handleGradingQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetGradingQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <div ref="gradingChart" class="chart-box chart-box--sm" />
      </section>

      <section class="panel-section">
        <h3 class="block-title"><span class="section-dot" />饱和度预警</h3>
        <el-form :inline="true" size="small" class="section-form section-form--compact">
          <el-form-item label="单位：">
            <el-select v-model="warningQuery.unit" style="width: 160px">
              <el-option v-for="opt in unitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="">
            <span class="threshold-label">饱和度 &gt;</span>
            <el-input-number v-model="warningQuery.highThreshold" :min="50" :max="100" size="small" controls-position="right" />
            <span class="threshold-unit">%</span>
          </el-form-item>
          <el-form-item label="">
            <span class="threshold-label">饱和度 &lt;</span>
            <el-input-number v-model="warningQuery.lowThreshold" :min="0" :max="50" size="small" controls-position="right" />
            <span class="threshold-unit">%</span>
          </el-form-item>
          <el-form-item class="section-form__actions">
            <el-button type="primary" icon="el-icon-search" @click="handleWarningQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetWarningQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="pagedWarningData" border stripe size="small" header-cell-class-name="panel-table-header">
          <el-table-column type="index" label="序号" width="70" align="center" :index="warningIndexMethod" />
          <el-table-column prop="employeeName" label="员工姓名" width="100" align="center" />
          <el-table-column prop="department" label="所属部门" min-width="130" show-overflow-tooltip />
          <el-table-column prop="position" label="岗位" min-width="120" show-overflow-tooltip />
          <el-table-column label="饱和度" width="100" align="center">
            <template slot-scope="scope">
              <span :class="saturationClass(scope.row.saturation)">{{ scope.row.saturation }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="是否异常" width="100" align="center">
            <template slot-scope="scope">
              <span :class="scope.row.isAbnormal ? 'abnormal-yes' : ''">{{ scope.row.isAbnormal ? "是" : "否" }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="abnormalRate" label="异常情况" width="100" align="center">
            <template slot-scope="scope">{{ scope.row.abnormalRate || "—" }}</template>
          </el-table-column>
        </el-table>
        <div class="panel-pagination">
          <el-pagination
            :current-page="warningPage"
            :page-sizes="[10, 25, 50]"
            :page-size="warningPageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredWarningData.length"
            @size-change="onWarningSizeChange"
            @current-change="(v) => { warningPage = v; }"
          />
        </div>
      </section>

      <section class="panel-section chart-section">
        <h3 class="block-title"><span class="section-dot" />饱和度对比分析</h3>
        <el-form :inline="true" size="small" class="section-form section-form--compact">
          <el-form-item label="单位：">
            <el-select v-model="compareQuery.unit" style="width: 160px">
              <el-option v-for="opt in unitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="部门：">
            <el-select v-model="compareQuery.department" style="width: 150px">
              <el-option v-for="opt in departmentOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item class="section-form__actions">
            <el-button type="primary" icon="el-icon-search" @click="handleCompareQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetCompareQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <p class="chart-subtitle">部门平均饱和度</p>
        <div ref="deptCompareChart" class="chart-box chart-box--sm" />
        <p class="chart-subtitle">岗位平均饱和度</p>
        <div ref="posCompareChart" class="chart-box chart-box--sm" />
      </section>

      <section class="panel-section chart-section">
        <h3 class="block-title"><span class="section-dot" />饱和度相关性分析</h3>
        <el-form :inline="true" size="small" class="section-form section-form--compact">
          <el-form-item label="单位：">
            <el-select v-model="correlationQuery.unit" style="width: 160px">
              <el-option v-for="opt in unitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item class="section-form__actions">
            <el-button type="primary" icon="el-icon-search" @click="handleCorrelationQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetCorrelationQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <p class="chart-subtitle">业务用时长与员工绩效结果</p>
        <div ref="radarChart" class="chart-box chart-box--lg" />
      </section>
    </div>

    <!-- 5. 饱和度预警规则配置 -->
    <div v-show="subTab === 'overtimeWarn'" class="sub-tab-body">
      <section class="panel-section">
        <h3 class="block-title"><span class="section-dot" />预警规则配置</h3>
        <p class="section-desc">预警维度：<strong>加班时长</strong> — 员工结束工作时间超过设定阈值，且连续天数达到要求时触发预警。</p>
        <el-form :inline="true" size="small" class="section-form">
          <el-form-item label="单位：">
            <el-select v-model="overtimeRuleQuery.unit" style="width: 160px">
              <el-option v-for="opt in unitOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="预警级别：">
            <el-select v-model="overtimeRuleQuery.level" style="width: 120px">
              <el-option v-for="opt in overtimeLevelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item class="section-form__actions">
            <el-button type="primary" icon="el-icon-search" @click="handleOvertimeRuleQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetOvertimeRuleQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="section-toolbar">
          <el-button type="primary" size="small" icon="el-icon-plus" @click="openOvertimeRuleDialog()">新增预警规则</el-button>
        </div>

        <el-table :data="pagedOvertimeRuleData" border stripe size="small" header-cell-class-name="panel-table-header">
          <el-table-column type="index" label="序号" width="70" align="center" :index="overtimeRuleIndexMethod" />
          <el-table-column prop="ruleName" label="规则名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="dimension" label="预警维度" width="100" align="center" />
          <el-table-column prop="endTimeThreshold" label="结束时间阈值" width="120" align="center">
            <template slot-scope="scope">超过 {{ scope.row.endTimeThreshold }}</template>
          </el-table-column>
          <el-table-column prop="consecutiveDays" label="连续天数" width="100" align="center">
            <template slot-scope="scope">≥ {{ scope.row.consecutiveDays }} 天</template>
          </el-table-column>
          <el-table-column prop="level" label="预警级别" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="levelTagType(scope.row.level)" size="mini">{{ scope.row.level }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="effectScope" label="生效范围" width="110" align="center" />
          <el-table-column label="状态" width="90" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.enabled ? 'success' : 'info'" size="mini">{{ scope.row.enabled ? "启用" : "停用" }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openOvertimeRuleDialog(scope.row)">编辑</el-button>
              <el-button type="text" size="small" class="danger-text" @click="handleOvertimeRuleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="panel-pagination">
          <el-pagination
            :current-page="overtimeRulePage"
            :page-sizes="[10, 25, 50]"
            :page-size="overtimeRulePageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredOvertimeRuleData.length"
            @size-change="onOvertimeRuleSizeChange"
            @current-change="(v) => { overtimeRulePage = v; }"
          />
        </div>
      </section>

      <section class="panel-section chart-section">
        <h3 class="block-title"><span class="section-dot" />预警分析展示</h3>
        <p class="section-desc">
          分析规则：连续加班结束时间超过 <strong>00:00</strong>，且连续天数 ≥
          <strong>{{ overtimeAnalysisQuery.minConsecutiveDays }}</strong> 天的预警触发情况。
        </p>
        <div class="warn-summary-row">
          <div class="warn-summary-item">
            <span class="warn-summary-item__label">累计预警人次</span>
            <span class="warn-summary-item__value">{{ overtimeAnalysisData.summary.totalWarning }}</span>
          </div>
          <div class="warn-summary-item">
            <span class="warn-summary-item__label">最长连续天数</span>
            <span class="warn-summary-item__value">{{ overtimeAnalysisData.summary.maxConsecutiveDays }} 天</span>
          </div>
          <div class="warn-summary-item">
            <span class="warn-summary-item__label">日均加班时长</span>
            <span class="warn-summary-item__value">{{ overtimeAnalysisData.summary.avgOvertimeHours }} h</span>
          </div>
        </div>
        <el-form :inline="true" size="small" class="section-form section-form--compact">
          <el-form-item label="单位：">
            <el-select v-model="overtimeAnalysisQuery.unit" style="width: 160px">
              <el-option v-for="opt in unitOptions.filter((o) => o.value !== 'all')" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间：">
            <el-date-picker v-model="overtimeAnalysisQuery.startDate" type="date" value-format="yyyy-MM-dd" style="width: 140px" />
            <span class="date-sep">~</span>
            <el-date-picker v-model="overtimeAnalysisQuery.endDate" type="date" value-format="yyyy-MM-dd" style="width: 140px" />
          </el-form-item>
          <el-form-item label="连续天数：">
            <el-input-number v-model="overtimeAnalysisQuery.minConsecutiveDays" :min="3" :max="15" size="small" controls-position="right" />
            <span class="threshold-unit">天</span>
          </el-form-item>
          <el-form-item class="section-form__actions">
            <el-button type="primary" icon="el-icon-search" @click="handleOvertimeAnalysisQuery">查询</el-button>
            <el-button icon="el-icon-refresh" @click="resetOvertimeAnalysisQuery">重置</el-button>
          </el-form-item>
        </el-form>
        <p class="chart-subtitle">近30日加班超时与预警触发趋势</p>
        <div ref="overtimeTrendChart" class="chart-box chart-box--sm" />
        <p class="chart-subtitle">各部门预警触发人数</p>
        <div ref="overtimeDeptChart" class="chart-box chart-box--sm" />
      </section>

      <section class="panel-section">
        <h3 class="block-title"><span class="section-dot" />预警人员明细</h3>
        <el-table :data="pagedOvertimeAlertData" border stripe size="small" header-cell-class-name="panel-table-header">
          <el-table-column type="index" label="序号" width="70" align="center" :index="overtimeAlertIndexMethod" />
          <el-table-column prop="employeeName" label="员工姓名" width="100" align="center" />
          <el-table-column prop="department" label="所属部门" min-width="130" show-overflow-tooltip />
          <el-table-column prop="position" label="岗位" min-width="120" show-overflow-tooltip />
          <el-table-column prop="lastEndTime" label="最近结束时间" width="120" align="center" />
          <el-table-column prop="consecutiveDays" label="连续天数" width="100" align="center">
            <template slot-scope="scope">
              <span :class="scope.row.consecutiveDays >= overtimeAnalysisQuery.minConsecutiveDays ? 'abnormal-yes' : ''">
                {{ scope.row.consecutiveDays }} 天
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="totalOvertimeHours" label="累计加班(h)" width="110" align="center" />
          <el-table-column prop="warningLevel" label="预警级别" width="100" align="center">
            <template slot-scope="scope">
              <el-tag :type="levelTagType(scope.row.warningLevel)" size="mini">{{ scope.row.warningLevel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="warningStatus" label="预警状态" width="100" align="center">
            <template slot-scope="scope">
              <span :class="scope.row.warningStatus === '已触发' ? 'abnormal-yes' : ''">{{ scope.row.warningStatus }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="panel-pagination">
          <el-pagination
            :current-page="overtimeAlertPage"
            :page-sizes="[10, 25, 50]"
            :page-size="overtimeAlertPageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredOvertimeAlertData.length"
            @size-change="onOvertimeAlertSizeChange"
            @current-change="(v) => { overtimeAlertPage = v; }"
          />
        </div>
      </section>
    </div>

    <!-- 规则弹窗 -->
    <el-dialog :title="ruleDialogTitle" :visible.sync="ruleDialogVisible" width="540px" append-to-body>
      <el-form :model="ruleForm" label-width="110px" size="small">
        <el-form-item label="饱和度名称" required>
          <el-input v-model="ruleForm.ruleName" />
        </el-form-item>
        <el-form-item label="饱和度层级">
          <el-select v-model="ruleForm.level" style="width: 100%">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值">
          <el-input v-model="ruleForm.threshold" placeholder="如 100% ~ 90%" />
        </el-form-item>
        <el-form-item label="生效范围">
          <el-select v-model="ruleForm.effectScope" style="width: 100%">
            <el-option v-for="s in effectScopeOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </div>
    </el-dialog>

    <!-- 岗位关联弹窗 -->
    <el-dialog :title="positionDialogTitle" :visible.sync="positionDialogVisible" width="540px" append-to-body>
      <el-form :model="positionForm" label-width="130px" size="small">
        <el-form-item label="员工姓名" required>
          <el-input v-model="positionForm.employeeName" />
        </el-form-item>
        <el-form-item label="所在部门" required>
          <el-select v-model="positionForm.department" style="width: 100%">
            <el-option
              v-for="opt in departmentOptions.filter((o) => o.value !== 'all')"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位" required>
          <el-input v-model="positionForm.position" />
        </el-form-item>
        <el-form-item label="出勤模式">
          <el-select v-model="positionForm.attendanceMode" style="width: 100%">
            <el-option label="固定出勤" value="固定出勤" />
            <el-option label="轮班" value="轮班" />
            <el-option label="不定时出勤" value="不定时出勤" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联的饱和度名称">
          <el-input v-model="positionForm.linkedRuleName" />
        </el-form-item>
        <el-form-item label="饱和度判定结果">
          <el-select v-model="positionForm.judgeResult" style="width: 100%">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="positionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePosition">保存</el-button>
      </div>
    </el-dialog>

    <!-- 加班预警规则弹窗 -->
    <el-dialog :title="overtimeRuleDialogTitle" :visible.sync="overtimeRuleDialogVisible" width="560px" append-to-body>
      <el-form :model="overtimeRuleForm" label-width="120px" size="small">
        <el-form-item label="规则名称" required>
          <el-input v-model="overtimeRuleForm.ruleName" />
        </el-form-item>
        <el-form-item label="预警维度">
          <el-input v-model="overtimeRuleForm.dimension" disabled />
        </el-form-item>
        <el-form-item label="结束时间阈值">
          <span class="threshold-label">超过</span>
          <el-time-picker
            v-model="overtimeRuleForm.endTimeThreshold"
            value-format="HH:mm"
            format="HH:mm"
            placeholder="选择时间"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="连续天数">
          <el-input-number v-model="overtimeRuleForm.consecutiveDays" :min="1" :max="30" controls-position="right" />
          <span class="threshold-unit">天</span>
        </el-form-item>
        <el-form-item label="预警级别">
          <el-select v-model="overtimeRuleForm.level" style="width: 100%">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="生效范围">
          <el-select v-model="overtimeRuleForm.effectScope" style="width: 100%">
            <el-option v-for="s in effectScopeOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="overtimeRuleForm.enabled" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="overtimeRuleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveOvertimeRule">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from "echarts";
import { baseChartOption, legendTopCenter, legendBottomCenter } from "../utils/chartTheme";
import {
  MODULE_UNIT_OPTIONS,
  MODULE_DEPARTMENT_OPTIONS,
  SATURATION_LEVEL_OPTIONS,
  ATTENDANCE_MODE_OPTIONS,
  EFFECT_SCOPE_OPTIONS,
  OVERTIME_WARNING_LEVEL_OPTIONS,
  DEFAULT_CALC_QUERY,
  DEFAULT_RULE_QUERY,
  DEFAULT_POSITION_QUERY,
  DEFAULT_GRADING_QUERY,
  DEFAULT_WARNING_QUERY,
  DEFAULT_COMPARE_QUERY,
  DEFAULT_CORRELATION_QUERY,
  DEFAULT_OVERTIME_WARN_RULE_QUERY,
  DEFAULT_OVERTIME_WARN_ANALYSIS_QUERY,
  generateSaturationCalcRows,
  filterSaturationCalcRows,
  generateSaturationRuleRows,
  filterSaturationRuleRows,
  generatePositionLinkRows,
  filterPositionLinkRows,
  buildGradingChartData,
  generateWarningRows,
  filterWarningRows,
  buildCompareChartData,
  buildCorrelationRadarData,
  generateOvertimeWarningRuleRows,
  filterOvertimeWarningRuleRows,
  buildOvertimeWarningAnalysisChart,
  generateOvertimeWarningAlertRows,
  filterOvertimeWarningAlertRows,
  unitLabel,
} from "../utils/workSaturationModuleData";
import { downloadTableWithLog } from "../utils/exportLogger";

export default {
  name: "WorkSaturationPanel",
  props: {
    panelActive: { type: Boolean, default: true },
  },
  data() {
    return {
      subTab: "calc",
      unitOptions: MODULE_UNIT_OPTIONS,
      departmentOptions: MODULE_DEPARTMENT_OPTIONS,
      levelOptions: SATURATION_LEVEL_OPTIONS,
      attendanceModeOptions: ATTENDANCE_MODE_OPTIONS,
      effectScopeOptions: EFFECT_SCOPE_OPTIONS,
      calcQuery: { ...DEFAULT_CALC_QUERY },
      calcAllRows: generateSaturationCalcRows(),
      calcPage: 1,
      calcPageSize: 10,
      ruleQuery: { ...DEFAULT_RULE_QUERY },
      ruleAllRows: generateSaturationRuleRows(),
      rulePage: 1,
      rulePageSize: 10,
      ruleSelection: [],
      ruleDialogVisible: false,
      ruleForm: {},
      ruleEditingId: null,
      positionQuery: { ...DEFAULT_POSITION_QUERY },
      positionAllRows: generatePositionLinkRows(),
      positionPage: 1,
      positionPageSize: 10,
      positionDialogVisible: false,
      positionForm: {},
      positionEditingId: null,
      gradingQuery: { ...DEFAULT_GRADING_QUERY },
      gradingData: buildGradingChartData(DEFAULT_GRADING_QUERY),
      warningQuery: { ...DEFAULT_WARNING_QUERY },
      warningAllRows: generateWarningRows(),
      warningPage: 1,
      warningPageSize: 10,
      compareQuery: { ...DEFAULT_COMPARE_QUERY },
      compareData: buildCompareChartData(DEFAULT_COMPARE_QUERY),
      correlationQuery: { ...DEFAULT_CORRELATION_QUERY },
      correlationData: buildCorrelationRadarData(DEFAULT_CORRELATION_QUERY),
      overtimeLevelOptions: OVERTIME_WARNING_LEVEL_OPTIONS,
      overtimeRuleQuery: { ...DEFAULT_OVERTIME_WARN_RULE_QUERY },
      overtimeRuleAllRows: generateOvertimeWarningRuleRows(),
      overtimeRulePage: 1,
      overtimeRulePageSize: 10,
      overtimeRuleDialogVisible: false,
      overtimeRuleForm: {},
      overtimeRuleEditingId: null,
      overtimeAnalysisQuery: { ...DEFAULT_OVERTIME_WARN_ANALYSIS_QUERY },
      overtimeAnalysisData: buildOvertimeWarningAnalysisChart(DEFAULT_OVERTIME_WARN_ANALYSIS_QUERY),
      overtimeAlertAllRows: generateOvertimeWarningAlertRows(),
      overtimeAlertPage: 1,
      overtimeAlertPageSize: 10,
      charts: {},
      resizeHandler: null,
    };
  },
  computed: {
    filteredCalcData() {
      return filterSaturationCalcRows(this.calcAllRows, this.calcQuery);
    },
    pagedCalcData() {
      const s = (this.calcPage - 1) * this.calcPageSize;
      return this.filteredCalcData.slice(s, s + this.calcPageSize);
    },
    filteredRuleData() {
      return filterSaturationRuleRows(this.ruleAllRows, this.ruleQuery);
    },
    pagedRuleData() {
      const s = (this.rulePage - 1) * this.rulePageSize;
      return this.filteredRuleData.slice(s, s + this.rulePageSize);
    },
    filteredPositionData() {
      return filterPositionLinkRows(this.positionAllRows, this.positionQuery);
    },
    pagedPositionData() {
      const s = (this.positionPage - 1) * this.positionPageSize;
      return this.filteredPositionData.slice(s, s + this.positionPageSize);
    },
    filteredWarningData() {
      return filterWarningRows(this.warningAllRows, this.warningQuery);
    },
    pagedWarningData() {
      const s = (this.warningPage - 1) * this.warningPageSize;
      return this.filteredWarningData.slice(s, s + this.warningPageSize);
    },
    filteredOvertimeRuleData() {
      return filterOvertimeWarningRuleRows(this.overtimeRuleAllRows, this.overtimeRuleQuery);
    },
    pagedOvertimeRuleData() {
      const s = (this.overtimeRulePage - 1) * this.overtimeRulePageSize;
      return this.filteredOvertimeRuleData.slice(s, s + this.overtimeRulePageSize);
    },
    filteredOvertimeAlertData() {
      return filterOvertimeWarningAlertRows(this.overtimeAlertAllRows, {
        unit: this.overtimeAnalysisQuery.unit,
        minConsecutiveDays: this.overtimeAnalysisQuery.minConsecutiveDays,
      });
    },
    pagedOvertimeAlertData() {
      const s = (this.overtimeAlertPage - 1) * this.overtimeAlertPageSize;
      return this.filteredOvertimeAlertData.slice(s, s + this.overtimeAlertPageSize);
    },
    ruleDialogTitle() {
      return this.ruleEditingId ? "编辑规则" : "新增规则";
    },
    positionDialogTitle() {
      return this.positionEditingId ? "修改饱和度关联岗位" : "新增饱和度关联岗位配置";
    },
    overtimeRuleDialogTitle() {
      return this.overtimeRuleEditingId ? "编辑预警规则" : "新增预警规则";
    },
  },
  watch: {
    panelActive(val) {
      if (val && this.subTab === "analysis") this.ensureChartsReady();
      if (val && this.subTab === "overtimeWarn") this.ensureOvertimeChartsReady();
    },
    subTab(val) {
      if (!this.panelActive) return;
      if (val === "analysis") this.ensureChartsReady();
      if (val === "overtimeWarn") this.ensureOvertimeChartsReady();
    },
  },
  mounted() {
    this.resizeHandler = () => this.resizeCharts();
    window.addEventListener("resize", this.resizeHandler);
    if (this.panelActive && this.subTab === "analysis") this.ensureChartsReady();
    if (this.panelActive && this.subTab === "overtimeWarn") this.ensureOvertimeChartsReady();
  },
  beforeDestroy() {
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    Object.values(this.charts).forEach((c) => c && c.dispose());
  },
  methods: {
    saturationClass(val) {
      if (val >= 90) return "sat-high";
      if (val >= 70) return "sat-normal";
      if (val >= 50) return "sat-low";
      return "sat-critical";
    },
    levelTagType(level) {
      if (level === "高") return "danger";
      if (level === "中") return "warning";
      return "info";
    },
    onCalcSizeChange(v) { this.calcPageSize = v; this.calcPage = 1; },
    onRuleSizeChange(v) { this.rulePageSize = v; this.rulePage = 1; },
    onPositionSizeChange(v) { this.positionPageSize = v; this.positionPage = 1; },
    onWarningSizeChange(v) { this.warningPageSize = v; this.warningPage = 1; },
    ruleIndexMethod(i) { return (this.rulePage - 1) * this.rulePageSize + i + 1; },
    positionIndexMethod(i) { return (this.positionPage - 1) * this.positionPageSize + i + 1; },
    warningIndexMethod(i) { return (this.warningPage - 1) * this.warningPageSize + i + 1; },
    handleCalcQuery() { this.calcPage = 1; },
    resetCalcQuery() { this.calcQuery = { ...DEFAULT_CALC_QUERY }; this.calcPage = 1; },
    handleCalcExport() {
      const source = this.filteredCalcData;
      if (!source.length) { this.$message.warning("暂无可导出数据"); return; }
      downloadTableWithLog({
        headers: ["排名", "姓名", "工作饱和度(%)", "任务工时", "实际工作时长"],
        rows: source.map((r) => [r.rank, r.employeeName, r.saturation, r.taskHours, r.actualHours]),
        format: "csv",
        baseFilename: "工作饱和度计算",
        meta: {
          moduleCode: "saturation_calc",
          moduleName: "工作饱和度计算",
          moduleGroup: "员工工作饱和度分析",
          searchCriteria: {
            unit: unitLabel(this.calcQuery.unit),
            department: this.calcQuery.department,
            granularity: { day: "日", week: "周", month: "月" }[this.calcQuery.granularity],
          },
        },
      });
      this.$message.success(`已导出 ${source.length} 条记录`);
    },
    handleRuleQuery() { this.rulePage = 1; },
    resetRuleQuery() { this.ruleQuery = { ...DEFAULT_RULE_QUERY }; this.rulePage = 1; },
    openRuleDialog(row) {
      if (row) {
        this.ruleEditingId = row.id;
        this.ruleForm = { ...row };
      } else {
        this.ruleEditingId = null;
        this.ruleForm = {
          ruleName: "",
          level: "中",
          threshold: "90% ~ 80%",
          effectScope: "全体员工",
          changeUser: "张三",
          prevRule: "",
        };
      }
      this.ruleDialogVisible = true;
    },
    saveRule() {
      if (!this.ruleForm.ruleName) { this.$message.warning("请填写饱和度名称"); return; }
      const payload = {
        ...this.ruleForm,
        changeTime: new Date().toISOString().slice(0, 16).replace("T", " "),
        changeUser: "张三",
        prevRule: this.ruleForm.prevRule || `阈值: ${this.ruleForm.threshold}; 生效范围: ${this.ruleForm.effectScope}`,
        unitKey: "kunming",
        unit: "昆明供电局",
      };
      if (this.ruleEditingId) {
        const idx = this.ruleAllRows.findIndex((r) => r.id === this.ruleEditingId);
        if (idx >= 0) this.$set(this.ruleAllRows, idx, { ...this.ruleAllRows[idx], ...payload });
      } else {
        const newId = Math.max(0, ...this.ruleAllRows.map((r) => r.id)) + 1;
        this.ruleAllRows.unshift({ id: newId, ...payload });
      }
      this.ruleDialogVisible = false;
      this.$message.success("规则已保存");
    },
    handleRuleDelete(row) {
      this.$confirm(`确定删除规则「${row.ruleName}」？`, "提示", { type: "warning" })
        .then(() => {
          this.ruleAllRows = this.ruleAllRows.filter((r) => r.id !== row.id);
          this.$message.success("已删除");
        })
        .catch(() => {});
    },
    handlePositionQuery() { this.positionPage = 1; },
    resetPositionQuery() { this.positionQuery = { ...DEFAULT_POSITION_QUERY }; this.positionPage = 1; },
    openPositionDialog(row) {
      if (row) {
        this.positionEditingId = row.id;
        this.positionForm = { ...row };
      } else {
        this.positionEditingId = null;
        this.positionForm = {
          employeeName: "",
          department: "人力资源部",
          position: "",
          attendanceMode: "固定出勤",
          linkedRuleName: "人力资源饱和度规则",
          judgeResult: "中",
          unitKey: "kunming",
          unit: "昆明供电局",
        };
      }
      this.positionDialogVisible = true;
    },
    savePosition() {
      if (!this.positionForm.employeeName || !this.positionForm.position) {
        this.$message.warning("请完善配置信息");
        return;
      }
      const payload = { ...this.positionForm, unitKey: "kunming", unit: "昆明供电局" };
      if (this.positionEditingId) {
        const idx = this.positionAllRows.findIndex((r) => r.id === this.positionEditingId);
        if (idx >= 0) this.$set(this.positionAllRows, idx, { ...this.positionAllRows[idx], ...payload });
      } else {
        const newId = Math.max(0, ...this.positionAllRows.map((r) => r.id)) + 1;
        this.positionAllRows.unshift({ id: newId, ...payload });
      }
      this.positionDialogVisible = false;
      this.$message.success("配置已保存");
    },
    handleGradingQuery() {
      this.gradingData = buildGradingChartData(this.gradingQuery);
      this.renderGradingChart();
    },
    resetGradingQuery() {
      this.gradingQuery = { ...DEFAULT_GRADING_QUERY };
      this.gradingData = buildGradingChartData(this.gradingQuery);
      this.renderGradingChart();
    },
    handleWarningQuery() { this.warningPage = 1; },
    resetWarningQuery() {
      this.warningQuery = { ...DEFAULT_WARNING_QUERY };
      this.warningPage = 1;
    },
    handleCompareQuery() {
      this.compareData = buildCompareChartData(this.compareQuery);
      this.renderCompareCharts();
    },
    resetCompareQuery() {
      this.compareQuery = { ...DEFAULT_COMPARE_QUERY };
      this.compareData = buildCompareChartData(this.compareQuery);
      this.renderCompareCharts();
    },
    handleCorrelationQuery() {
      this.correlationData = buildCorrelationRadarData(this.correlationQuery);
      this.renderRadarChart();
    },
    resetCorrelationQuery() {
      this.correlationQuery = { ...DEFAULT_CORRELATION_QUERY };
      this.correlationData = buildCorrelationRadarData(this.correlationQuery);
      this.renderRadarChart();
    },
    onOvertimeRuleSizeChange(v) { this.overtimeRulePageSize = v; this.overtimeRulePage = 1; },
    onOvertimeAlertSizeChange(v) { this.overtimeAlertPageSize = v; this.overtimeAlertPage = 1; },
    overtimeRuleIndexMethod(i) { return (this.overtimeRulePage - 1) * this.overtimeRulePageSize + i + 1; },
    overtimeAlertIndexMethod(i) { return (this.overtimeAlertPage - 1) * this.overtimeAlertPageSize + i + 1; },
    handleOvertimeRuleQuery() { this.overtimeRulePage = 1; },
    resetOvertimeRuleQuery() {
      this.overtimeRuleQuery = { ...DEFAULT_OVERTIME_WARN_RULE_QUERY };
      this.overtimeRulePage = 1;
    },
    openOvertimeRuleDialog(row) {
      if (row) {
        this.overtimeRuleEditingId = row.id;
        this.overtimeRuleForm = { ...row };
      } else {
        this.overtimeRuleEditingId = null;
        this.overtimeRuleForm = {
          ruleName: "",
          dimension: "加班时长",
          endTimeThreshold: "00:00",
          consecutiveDays: 5,
          level: "高",
          effectScope: "全体员工",
          enabled: true,
          changeUser: "张三",
          prevRule: "",
        };
      }
      this.overtimeRuleDialogVisible = true;
    },
    saveOvertimeRule() {
      if (!this.overtimeRuleForm.ruleName) {
        this.$message.warning("请填写规则名称");
        return;
      }
      const payload = {
        ...this.overtimeRuleForm,
        dimension: "加班时长",
        changeTime: new Date().toISOString().slice(0, 16).replace("T", " "),
        changeUser: "张三",
        prevRule: this.overtimeRuleForm.prevRule
          || `结束时间超过 ${this.overtimeRuleForm.endTimeThreshold}；连续天数 ≥ ${this.overtimeRuleForm.consecutiveDays}`,
        unitKey: this.overtimeRuleQuery.unit === "all" ? "kunming" : this.overtimeRuleQuery.unit,
        unit: unitLabel(this.overtimeRuleQuery.unit === "all" ? "kunming" : this.overtimeRuleQuery.unit),
      };
      if (this.overtimeRuleEditingId) {
        const idx = this.overtimeRuleAllRows.findIndex((r) => r.id === this.overtimeRuleEditingId);
        if (idx >= 0) this.$set(this.overtimeRuleAllRows, idx, { ...this.overtimeRuleAllRows[idx], ...payload });
      } else {
        const newId = Math.max(0, ...this.overtimeRuleAllRows.map((r) => r.id)) + 1;
        this.overtimeRuleAllRows.unshift({ id: newId, ...payload });
      }
      this.overtimeRuleDialogVisible = false;
      this.$message.success("预警规则已保存");
    },
    handleOvertimeRuleDelete(row) {
      this.$confirm(`确定删除预警规则「${row.ruleName}」？`, "提示", { type: "warning" })
        .then(() => {
          this.overtimeRuleAllRows = this.overtimeRuleAllRows.filter((r) => r.id !== row.id);
          this.$message.success("已删除");
        })
        .catch(() => {});
    },
    handleOvertimeAnalysisQuery() {
      this.overtimeAnalysisData = buildOvertimeWarningAnalysisChart(this.overtimeAnalysisQuery);
      this.overtimeAlertPage = 1;
      this.renderOvertimeAnalysisCharts();
    },
    resetOvertimeAnalysisQuery() {
      this.overtimeAnalysisQuery = { ...DEFAULT_OVERTIME_WARN_ANALYSIS_QUERY };
      this.overtimeAnalysisData = buildOvertimeWarningAnalysisChart(this.overtimeAnalysisQuery);
      this.overtimeAlertPage = 1;
      this.renderOvertimeAnalysisCharts();
    },
    ensureOvertimeChartsReady() {
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          this.initOvertimeCharts(true);
          this.renderOvertimeAnalysisCharts();
          this.resizeCharts();
        });
      });
    },
    initOvertimeCharts(forceReinit = false) {
      const refs = {
        overtimeTrend: "overtimeTrendChart",
        overtimeDept: "overtimeDeptChart",
      };
      Object.keys(refs).forEach((key) => {
        const el = this.$refs[refs[key]];
        if (!el) return;
        if (forceReinit && this.charts[key]) {
          this.charts[key].dispose();
          delete this.charts[key];
        }
        if (!this.charts[key] && el.clientWidth > 0) {
          this.charts[key] = echarts.init(el);
        }
      });
    },
    renderOvertimeAnalysisCharts() {
      this.renderOvertimeTrendChart();
      this.renderOvertimeDeptChart();
    },
    renderOvertimeTrendChart() {
      const chart = this.charts.overtimeTrend;
      if (!chart) return;
      const d = this.overtimeAnalysisData;
      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "axis" },
          legend: legendBottomCenter(["加班超时人次", "预警触发人次", "日均加班时长(h)"]),
          grid: { left: "2%", right: "4%", top: "12%", bottom: "16%", containLabel: true },
          xAxis: {
            type: "category",
            boundaryGap: true,
            data: d.dates,
            axisLabel: { interval: 2, fontSize: 11 },
          },
          yAxis: [
            {
              type: "value",
              name: "人次",
              min: 0,
              axisLabel: { fontSize: 10 },
              splitLine: { lineStyle: { color: "#EEEEEE" } },
            },
            {
              type: "value",
              name: "工时(h)",
              min: 0,
              axisLabel: { fontSize: 10 },
              splitLine: { show: false },
            },
          ],
          series: [
            {
              name: "加班超时人次",
              type: "bar",
              barMaxWidth: 14,
              itemStyle: { color: "#91D5FF", borderRadius: [2, 2, 0, 0] },
              data: d.overtimePersonCount,
            },
            {
              name: "预警触发人次",
              type: "bar",
              barMaxWidth: 14,
              itemStyle: { color: "#F5222D", borderRadius: [2, 2, 0, 0] },
              data: d.warningPersonCount,
            },
            {
              name: "日均加班时长(h)",
              type: "line",
              yAxisIndex: 1,
              smooth: true,
              symbol: "circle",
              symbolSize: 5,
              lineStyle: { width: 2, color: "#FA8C16" },
              itemStyle: { color: "#FA8C16" },
              data: d.overtimeHours,
            },
          ],
        }),
        true
      );
      chart.resize();
    },
    renderOvertimeDeptChart() {
      const chart = this.charts.overtimeDept;
      if (!chart) return;
      const d = this.overtimeAnalysisData;
      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "axis", formatter: (p) => `${p[0].name}<br/>预警人数：<strong>${p[0].value}</strong> 人` },
          grid: { left: "2%", right: "3%", top: "10%", bottom: "14%", containLabel: true },
          xAxis: {
            type: "category",
            data: d.deptNames,
            axisLabel: { interval: 0, rotate: 20, fontSize: 11 },
          },
          yAxis: { type: "value", min: 0, name: "人数", axisLabel: { fontSize: 10 } },
          series: [{
            name: "预警人数",
            type: "bar",
            barMaxWidth: 36,
            itemStyle: {
              color: {
                type: "linear",
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: "#FF7875" },
                  { offset: 1, color: "#FFA39E" },
                ],
              },
              borderRadius: [3, 3, 0, 0],
            },
            label: { show: true, position: "top", fontSize: 10, color: "#F5222D" },
            data: d.deptWarningCount,
          }],
        }),
        true
      );
      chart.resize();
    },
    ensureChartsReady() {
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          this.initCharts(true);
          this.renderAllAnalysisCharts();
          this.resizeCharts();
        });
      });
    },
    initCharts(forceReinit = false) {
      const refs = {
        grading: "gradingChart",
        deptCompare: "deptCompareChart",
        posCompare: "posCompareChart",
        radar: "radarChart",
      };
      Object.keys(refs).forEach((key) => {
        const el = this.$refs[refs[key]];
        if (!el) return;
        if (forceReinit && this.charts[key]) {
          this.charts[key].dispose();
          delete this.charts[key];
        }
        if (!this.charts[key] && el.clientWidth > 0) {
          this.charts[key] = echarts.init(el);
        }
      });
    },
    resizeCharts() {
      Object.values(this.charts).forEach((c) => c && c.resize());
    },
    renderAllAnalysisCharts() {
      this.renderGradingChart();
      this.renderCompareCharts();
      this.renderRadarChart();
    },
    renderGradingChart() {
      const chart = this.charts.grading;
      if (!chart) return;
      const { days, levels, levelLabels } = this.gradingData;
      chart.setOption(
        baseChartOption({
          tooltip: {
            trigger: "axis",
            formatter: (params) => {
              const p = params[0];
              const lvl = levels[p.dataIndex];
              return `${p.name}<br/>饱和度分级：<strong>${lvl.label}</strong>`;
            },
          },
          grid: { left: "4%", right: "3%", top: "12%", bottom: "12%", containLabel: true },
          xAxis: { type: "category", boundaryGap: false, data: days, axisLabel: { interval: 2, fontSize: 11 } },
          yAxis: {
            type: "value",
            min: 0,
            max: 2,
            interval: 1,
            axisLabel: { formatter: (v) => levelLabels[v] || "", fontSize: 11 },
          },
          series: [{
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 7,
            lineStyle: { width: 2.5, color: "#52C41A" },
            itemStyle: { color: "#52C41A" },
            data: levels.map((l) => l.value),
          }],
        }),
        true
      );
      chart.resize();
    },
    renderCompareCharts() {
      this.renderDeptCompareChart();
      this.renderPosCompareChart();
    },
    renderDeptCompareChart() {
      const chart = this.charts.deptCompare;
      if (!chart) return;
      const { deptNames, deptSaturation } = this.compareData;
      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "axis", formatter: (p) => `${p[0].name}<br/>平均饱和度：<strong>${p[0].value}%</strong>` },
          grid: { left: "2%", right: "3%", top: "8%", bottom: "14%", containLabel: true },
          xAxis: { type: "category", boundaryGap: false, data: deptNames, axisLabel: { interval: 0, rotate: 20, fontSize: 11 } },
          yAxis: { type: "value", min: 0, max: 100, interval: 20, axisLabel: { formatter: "{value}%", fontSize: 11 } },
          series: [{
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 7,
            lineStyle: { width: 2.5, color: "#52C41A" },
            itemStyle: { color: "#52C41A" },
            data: deptSaturation,
          }],
        }),
        true
      );
      chart.resize();
    },
    renderPosCompareChart() {
      const chart = this.charts.posCompare;
      if (!chart) return;
      const { positionNames, positionSaturation } = this.compareData;
      chart.setOption(
        baseChartOption({
          tooltip: { trigger: "axis" },
          grid: { left: "2%", right: "3%", top: "8%", bottom: "14%", containLabel: true },
          xAxis: { type: "category", boundaryGap: false, data: positionNames, axisLabel: { interval: 0, rotate: 20, fontSize: 11 } },
          yAxis: { type: "value", min: 0, max: 100, interval: 20, axisLabel: { formatter: "{value}%", fontSize: 11 } },
          series: [{
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 7,
            lineStyle: { width: 2.5, color: "#13C2C2" },
            itemStyle: { color: "#13C2C2" },
            data: positionSaturation,
          }],
        }),
        true
      );
      chart.resize();
    },
    renderRadarChart() {
      const chart = this.charts.radar;
      if (!chart) return;
      const { dims, seriesA, seriesB } = this.correlationData;
      chart.setOption(
        baseChartOption({
          tooltip: {},
          legend: { ...legendTopCenter(["本期", "上期"]), top: 28 },
          radar: {
            indicator: dims.map((name) => ({ name, max: 100 })),
            center: ["50%", "58%"],
            radius: "78%",
            splitNumber: 4,
            axisName: {
              fontSize: 12,
              color: "#606266",
              lineHeight: 16,
            },
            splitArea: {
              areaStyle: { color: ["rgba(24,144,255,0.02)", "rgba(24,144,255,0.06)"] },
            },
          },
          series: [{
            type: "radar",
            symbolSize: 8,
            lineStyle: { width: 2.5 },
            data: [
              { name: "本期", value: seriesA, areaStyle: { color: "rgba(24,144,255,0.25)" }, lineStyle: { color: "#1890FF" }, itemStyle: { color: "#1890FF" } },
              { name: "上期", value: seriesB, areaStyle: { color: "rgba(19,194,194,0.2)" }, lineStyle: { color: "#13C2C2" }, itemStyle: { color: "#13C2C2" } },
            ],
          }],
        }),
        true
      );
      chart.resize();
    },
  },
};
</script>

<style scoped>
.work-saturation-panel {
  width: 100%;
  min-width: 0;
  min-height: 520px;
  box-sizing: border-box;
}

.sub-tabs { margin-bottom: 12px; }
.sub-tabs >>> .el-tabs__header { margin-bottom: 0; }
.sub-tabs >>> .el-tabs__item { height: 40px; line-height: 40px; font-size: 14px; }
.sub-tabs >>> .el-tabs__item.is-active { color: #1890ff; font-weight: 500; }
.sub-tabs >>> .el-tabs__active-bar { background-color: #1890ff; }

.sub-tab-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-width: 0;
}

.panel-section {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
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
  align-items: center;
  width: 100%;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
}

.section-form--compact {
  margin-bottom: 10px;
  padding-bottom: 10px;
}

.section-form >>> .el-form-item { margin-bottom: 8px; }
.section-form__actions { margin-left: auto; }
.section-toolbar { margin-bottom: 12px; }

.panel-section >>> .panel-table-header {
  background: #e8f4ff !important;
  color: #303133;
  font-weight: 500;
}

.panel-pagination { margin-top: 14px; text-align: right; }
.date-sep { margin: 0 6px; color: #909399; }

.threshold-label { margin-right: 6px; font-size: 13px; color: #606266; }
.threshold-unit { margin-left: 4px; font-size: 13px; color: #606266; }

.sat-high { color: #f5222d; font-weight: 600; }
.sat-normal { color: #52c41a; font-weight: 600; }
.sat-low { color: #faad14; font-weight: 600; }
.sat-critical { color: #909399; font-weight: 600; }
.abnormal-yes { color: #f5222d; font-weight: 600; }
.danger-text { color: #f56c6c; }

.section-desc {
  margin: -4px 0 12px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.warn-summary-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.warn-summary-item {
  flex: 1;
  min-width: 140px;
  padding: 10px 14px;
  background: #fff7e6;
  border: 1px solid #ffe7ba;
  border-radius: 4px;
}

.warn-summary-item__label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.warn-summary-item__value {
  font-size: 20px;
  font-weight: 600;
  color: #fa8c16;
}

.chart-subtitle {
  margin: 8px 0 4px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  text-align: center;
}

.chart-box {
  display: block;
  width: 100%;
  min-width: 0;
  height: 300px;
  box-sizing: border-box;
}

.chart-box--sm { height: 260px; }

.chart-box--lg {
  height: 420px;
  min-height: 380px;
}

@media (max-width: 768px) {
  .section-form__actions { margin-left: 0; width: 100%; }
}
</style>
