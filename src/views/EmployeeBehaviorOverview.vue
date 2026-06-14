<template>
  <div class="employee-overview-container">
    <!-- 页签 -->
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="员工出勤情况" name="attendance"></el-tab-pane>
      <el-tab-pane label="异常预警" name="warning"></el-tab-pane>
    </el-tabs>

    <!-- 查询栏 -->
    <div class="query-bar">
      <el-form :inline="true" size="small">
        <el-form-item label="统计维度：">
          <el-select v-model="queryParams.dimension" placeholder="请选择" style="width: 150px;">
            <el-option label="按单位" value="unit"></el-option>
            <el-option label="按部门" value="department"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="日期范围：">
          <el-date-picker
            v-model="queryParams.startDate"
            type="date"
            placeholder="起始日期"
            value-format="yyyy-MM-dd"
            style="width: 150px;"
          ></el-date-picker>
          <span style="margin: 0 8px;">-</span>
          <el-date-picker
            v-model="queryParams.endDate"
            type="date"
            placeholder="结束日期"
            value-format="yyyy-MM-dd"
            style="width: 150px;"
          ></el-date-picker>
        </el-form-item>
        
        <el-form-item label="单位：">
          <el-select v-model="queryParams.unit" placeholder="请选择" style="width: 200px;">
            <el-option label="全部单位" value="all"></el-option>
            <el-option label="昆明供电局" value="kunming"></el-option>
            <el-option label="曲靖供电局" value="qujing"></el-option>
            <el-option label="玉溪供电局" value="yuxi"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="handleQuery">查询</el-button>
          <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 顶部统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card" @click="handleCardClick('total')">
        <div class="stat-label">总应出勤人数</div>
        <div class="stat-value">{{ statsData.totalShouldAttendance }}</div>
      </div>
      <div class="stat-card" @click="handleCardClick('actual')">
        <div class="stat-label">实际出勤人数</div>
        <div class="stat-value highlight">{{ statsData.actualAttendance }}</div>
      </div>
      <div class="stat-card" @click="handleCardClick('rate')">
        <div class="stat-label">整体出勤率</div>
        <div class="stat-value success">{{ statsData.overallRate }}</div>
      </div>
      <div class="stat-card" @click="handleCardClick('leave')">
        <div class="stat-label">请假时长</div>
        <div class="stat-value">{{ statsData.leaveDuration }}</div>
      </div>
      <div class="stat-card comparison-card">
        <div class="comparison-title">考勤数据对比</div>
        <el-button type="text" size="small" @click="handleViewComparison">查看详情</el-button>
      </div>
    </div>

    <!-- 黄色提示条 -->
    <el-alert
      title="注：点击【总应出勤人数】、【实际出勤人数】、【整体出勤率】、【请假时长】下方图表跟着动，横向为单位名称。"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 16px;"
    >
      <template slot="default">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>注：点击【总应出勤人数】、【实际出勤人数】、【整体出勤率】、【请假时长】下方图表跟着动，横向为单位名称。</span>
          <el-button type="primary" size="mini" @click="handleExportDetail">导出明细</el-button>
        </div>
      </template>
    </el-alert>

    <!-- 主图表区域 - 柱状图+折线图 -->
    <div class="chart-section main-chart">
      <div ref="mainChart" style="height: 400px;"></div>
    </div>

    <!-- 第二行图表 -->
    <div class="chart-row">
      <!-- 按时出勤&迟到早退率 -->
      <div class="chart-section">
        <div class="chart-header">
          <span class="chart-title">按时出勤&迟到早退率</span>
          <el-button type="primary" size="mini" @click="handleExportChart('punctuality')">导出明细</el-button>
        </div>
        <div ref="punctualityChart" style="height: 250px;"></div>
      </div>

      <!-- 迟到早退人数 -->
      <div class="chart-section">
        <div class="chart-header">
          <span class="chart-title">迟到早退人数</span>
          <el-button type="primary" size="mini" @click="handleExportChart('lateEarly')">导出明细</el-button>
        </div>
        <div ref="lateEarlyChart" style="height: 250px;"></div>
      </div>
    </div>

    <!-- 第三行图表 -->
    <div class="chart-row">
      <!-- 出差&培训工时与专业相关性 -->
      <div class="chart-section">
        <div class="chart-header">
          <span class="chart-title">出差&培训工时与专业相关性</span>
          <el-button type="primary" size="mini" @click="handleExportChart('businessTraining')">导出明细</el-button>
        </div>
        <div ref="businessTrainingChart" style="height: 250px;"></div>
      </div>

      <!-- 专业与作业工时相关性 -->
      <div class="chart-section">
        <div class="chart-header">
          <span class="chart-title">专业与作业工时相关性</span>
          <el-button type="primary" size="mini" @click="handleExportChart('specialty')">导出明细</el-button>
        </div>
        <div ref="specialtyChart" style="height: 250px;"></div>
      </div>
    </div>

    <!-- 年休假请假分布时段 -->
    <div class="chart-section leave-distribution">
      <div class="chart-header">
        <div class="chart-title-wrapper">
          <span class="chart-title">年休假请假分布时段</span>
          <el-form :inline="true" size="mini" style="margin-left: 20px;">
            <el-form-item label="日期范围：">
              <el-date-picker
                v-model="leaveQueryParams.startDate"
                type="date"
                placeholder="起始日期"
                value-format="yyyy-MM-dd"
                style="width: 120px;"
              ></el-date-picker>
              <span style="margin: 0 4px;">-</span>
              <el-date-picker
                v-model="leaveQueryParams.endDate"
                type="date"
                placeholder="结束日期"
                value-format="yyyy-MM-dd"
                style="width: 120px;"
              ></el-date-picker>
            </el-form-item>
          </el-form>
        </div>
        <el-button type="primary" size="mini" @click="handleExportChart('leaveDistribution')">导出明细</el-button>
      </div>
      
      <!-- 气泡图 -->
      <div ref="leaveBubbleChart" style="height: 250px;"></div>
      
      <!-- 数据表格 -->
      <el-table
        :data="leaveTableData"
        border
        stripe
        size="small"
        style="margin-top: 16px;"
      >
        <el-table-column prop="unit" label="单位" min-width="120"></el-table-column>
        <el-table-column prop="specialty" label="专业" min-width="100"></el-table-column>
        <el-table-column prop="fieldWorkCount" label="外勤人次" width="100" align="center"></el-table-column>
        <el-table-column prop="totalDuration" label="总时长" width="100" align="center"></el-table-column>
        <el-table-column prop="avgDuration" label="人均时长" width="100" align="center"></el-table-column>
        <el-table-column prop="businessType" label="业务类型" min-width="120"></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: "EmployeeBehaviorOverview",
  data() {
    return {
      activeTab: 'attendance',
      
      // 查询参数
      queryParams: {
        dimension: 'unit',
        startDate: '',
        endDate: '',
        unit: 'all'
      },
      
      // 年休假查询参数
      leaveQueryParams: {
        startDate: '',
        endDate: ''
      },
      
      // 统计数据
      statsData: {
        totalShouldAttendance: 5280,
        actualAttendance: 5072,
        overallRate: '96.1%',
        leaveDuration: '168.4h'
      },
      
      // 年休假表格数据
      leaveTableData: [
        { unit: '昆明局', specialty: '技术', fieldWorkCount: 56, totalDuration: '216h', avgDuration: '3.9h', businessType: '项目实施' },
        { unit: '玉溪局', specialty: '安监', fieldWorkCount: 34, totalDuration: '128h', avgDuration: '3.8h', businessType: '现场检查' },
        { unit: '曲靖局', specialty: '市场', fieldWorkCount: 29, totalDuration: '96h', avgDuration: '3.3h', businessType: '客户拓展' },
        { unit: '大理局', specialty: '人资', fieldWorkCount: 16, totalDuration: '42h', avgDuration: '2.6h', businessType: '招聘外勤' },
        { unit: '临沧局', specialty: '综合', fieldWorkCount: 11, totalDuration: '31h', avgDuration: '2.8h', businessType: '行政办公' }
      ],
      
      // ECharts实例
      charts: {}
    };
  },
  
  mounted() {
    this.$nextTick(() => {
      this.initCharts();
    });
  },
  
  beforeDestroy() {
    // 销毁所有图表实例
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.dispose();
    });
  },
  
  methods: {
    // 初始化所有图表
    initCharts() {
      this.initMainChart();
      this.initPunctualityChart();
      this.initLateEarlyChart();
      this.initBusinessTrainingChart();
      this.initSpecialtyChart();
      this.initLeaveBubbleChart();
    },
    
    // 主图表 - 柱状图+折线图
    initMainChart() {
      const chart = echarts.init(this.$refs.mainChart);
      this.charts.main = chart;
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' }
        },
        legend: {
          data: ['应出勤人数', '实际出勤人数', '出勤率'],
          top: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['昆明', '曲靖', '玉溪', '保山', '昭通', '丽江', '普洱', '临沧', '楚雄', '红河', '文山', '西双版纳', '大理', '德宏', '怒江', '迪庆'],
          axisLabel: { rotate: 0 }
        },
        yAxis: [
          {
            type: 'value',
            name: '人数',
            min: 0,
            max: 7000,
            interval: 1000,
            position: 'left'
          },
          {
            type: 'value',
            name: '百分比',
            min: 0,
            max: 100,
            interval: 10,
            position: 'right',
            axisLabel: { formatter: '{value}%' }
          }
        ],
        series: [
          {
            name: '应出勤人数',
            type: 'bar',
            stack: 'attendance',
            itemStyle: { color: '#5470c6' },
            data: [3000, 2800, 2500, 2600, 1500, 1800, 2200, 2000, 2400, 2700, 2300, 2100, 2800, 2500, 2200, 2000]
          },
          {
            name: '实际出勤人数',
            type: 'bar',
            stack: 'attendance',
            itemStyle: { color: '#91cc75' },
            data: [2800, 2600, 2300, 2400, 1400, 1700, 2100, 1900, 2300, 2600, 2200, 2000, 2700, 2400, 2100, 1900]
          },
          {
            name: '出勤率',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            itemStyle: { color: '#fac858' },
            lineStyle: { width: 2 },
            data: [93, 93, 92, 92, 93, 94, 95, 95, 96, 96, 96, 95, 96, 96, 95, 95],
            markPoint: {
              data: [
                { type: 'max', name: '最大值' }
              ]
            }
          }
        ]
      };
      
      chart.setOption(option);
    },
    
    // 按时出勤&迟到早退率图表
    initPunctualityChart() {
      const chart = echarts.init(this.$refs.punctualityChart);
      this.charts.punctuality = chart;
      
      const option = {
        tooltip: { trigger: 'axis' },
        legend: {
          data: ['事假', '病假', '年休假'],
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['昆明', '曲靖', '玉溪', '保山', '昭通', '丽江', '普洱', '临沧', '楚雄', '红河', '文山', '西双版纳', '大理', '德宏', '怒江', '迪庆']
        },
        yAxis: {
          type: 'value',
          axisLabel: { formatter: '{value}%' }
        },
        series: [
          {
            name: '事假',
            type: 'line',
            smooth: true,
            itemStyle: { color: '#5470c6' },
            data: [90, 90, 90, 90, 89, 86, 87, 87, 88, 93, 90, 94, 89, 90, 90, 89]
          },
          {
            name: '病假',
            type: 'line',
            smooth: true,
            itemStyle: { color: '#91cc75' },
            data: [4, 4, 2, 11, 14, 7, 8, 10, 2, 7, 10, 4, 11, 10, 10, 11]
          },
          {
            name: '年休假',
            type: 'line',
            smooth: true,
            itemStyle: { color: '#ee6666' },
            data: [6, 6, 8, 3, 1, 7, 5, 3, 10, 0, 0, 2, 0, 0, 0, 0]
          }
        ]
      };
      
      chart.setOption(option);
    },
    
    // 迟到早退人数图表
    initLateEarlyChart() {
      const chart = echarts.init(this.$refs.lateEarlyChart);
      this.charts.lateEarly = chart;
      
      const option = {
        tooltip: { trigger: 'axis' },
        legend: {
          data: ['事假', '病假', '年休假'],
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['昆明', '曲靖', '玉溪', '保山', '昭通', '丽江', '普洱', '临沧', '楚雄', '红河', '文山', '西双版纳', '大理', '德宏', '怒江', '迪庆']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '事假',
            type: 'bar',
            stack: 'late',
            itemStyle: { color: '#5470c6' },
            data: [2, 5, 3, 2, 3, 4, 5, 6, 4, 5, 6, 3, 5, 4, 3, 4]
          },
          {
            name: '病假',
            type: 'bar',
            stack: 'late',
            itemStyle: { color: '#ee6666' },
            data: [1, 10, 2, 3, 6, 7, 10, 14, 7, 12, 14, 15, 14, 12, 10, 11]
          },
          {
            name: '年休假',
            type: 'bar',
            stack: 'late',
            itemStyle: { color: '#fac858' },
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          }
        ]
      };
      
      chart.setOption(option);
    },
    
    // 出差&培训工时与专业相关性 - 散点图
    initBusinessTrainingChart() {
      const chart = echarts.init(this.$refs.businessTrainingChart);
      this.charts.businessTraining = chart;
      
      const option = {
        tooltip: {
          formatter: function(param) {
            return `出差工时: ${param.value[0]}<br/>培训工时: ${param.value[1]}`;
          }
        },
        legend: {
          data: ['出差工时', '培训工时', '线性(出差工时)', '线性(培训工时)'],
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          name: '培训工时',
          min: 0,
          max: 14
        },
        yAxis: {
          type: 'value',
          name: '出差工时',
          min: 0,
          max: 30
        },
        series: [
          {
            name: '出差工时',
            type: 'scatter',
            symbolSize: 8,
            itemStyle: { color: '#5470c6' },
            data: [[1, 25], [2, 5], [3, 12], [4, 12], [5, 13], [6, 5], [7, 16], [8, 24], [9, 5], [10, 17], [11, 22], [12, 3]]
          },
          {
            name: '培训工时',
            type: 'scatter',
            symbolSize: 8,
            itemStyle: { color: '#ee6666' },
            data: [[1, 1], [2, 11], [3, 5], [4, 3], [5, 5], [6, 15], [7, 8], [8, 0], [9, 11], [10, 5], [11, 1], [12, 10]]
          },
          {
            name: '线性(出差工时)',
            type: 'line',
            smooth: false,
            lineStyle: { type: 'dotted', color: '#5470c6' },
            data: [[0, 13], [14, 13]],
            symbol: 'none'
          },
          {
            name: '线性(培训工时)',
            type: 'line',
            smooth: false,
            lineStyle: { type: 'dotted', color: '#ee6666' },
            data: [[0, 5], [14, 7]],
            symbol: 'none'
          }
        ]
      };
      
      chart.setOption(option);
    },
    
    // 专业与作业工时相关性 - 雷达图
    initSpecialtyChart() {
      const chart = echarts.init(this.$refs.specialtyChart);
      this.charts.specialty = chart;
      
      const option = {
        tooltip: {},
        legend: {
          data: ['作业工时时长', '出勤工时'],
          bottom: 0
        },
        radar: {
          indicator: [
            { name: '输电', max: 150 },
            { name: '营配', max: 150 },
            { name: '电网建设', max: 150 },
            { name: '变电', max: 150 },
            { name: '配电', max: 150 }
          ],
          radius: '65%'
        },
        series: [
          {
            name: '专业与作业工时',
            type: 'radar',
            data: [
              {
                value: [120, 80, 60, 100, 90],
                name: '作业工时时长',
                itemStyle: { color: '#91cc75' },
                areaStyle: { opacity: 0.3 }
              },
              {
                value: [100, 120, 80, 110, 100],
                name: '出勤工时',
                itemStyle: { color: '#5470c6' },
                areaStyle: { opacity: 0.3 }
              }
            ]
          }
        ]
      };
      
      chart.setOption(option);
    },
    
    // 年休假请假分布时段 - 气泡图
    initLeaveBubbleChart() {
      const chart = echarts.init(this.$refs.leaveBubbleChart);
      this.charts.leaveBubble = chart;
      
      const option = {
        tooltip: {
          formatter: function(param) {
            return `外勤频次: ${param.value[0]}<br/>时长(h): ${param.value[1]}`;
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          name: '外勤频次',
          min: 0,
          max: 60
        },
        yAxis: {
          type: 'value',
          name: '时长(h)',
          min: 0,
          max: 250
        },
        series: [
          {
            type: 'scatter',
            symbolSize: function(data) {
              return Math.sqrt(data[2]) * 5;
            },
            itemStyle: {
              color: function(params) {
                const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'];
                return colors[params.dataIndex % colors.length];
              }
            },
            data: [
              [55, 220, 100],
              [35, 125, 80],
              [28, 95, 60],
              [15, 42, 40],
              [10, 31, 30]
            ]
          }
        ]
      };
      
      chart.setOption(option);
    },
    
    // 查询
    handleQuery() {
      console.log('=== 查询 ===');
      console.log('查询参数:', this.queryParams);
      this.$message.success('查询成功');
      // 这里调用后端API重新加载数据并刷新图表
    },
    
    // 重置
    handleReset() {
      console.log('=== 重置 ===');
      this.queryParams = {
        dimension: 'unit',
        startDate: '',
        endDate: '',
        unit: 'all'
      };
      this.leaveQueryParams = {
        startDate: '',
        endDate: ''
      };
      this.$message.info('已重置查询条件');
    },
    
    // 统计卡片点击
    handleCardClick(type) {
      console.log('=== 卡片点击 ===', type);
      // 这里实现点击卡片后刷新下方图表的逻辑
      this.$message.info(`点击了${type}卡片`);
    },
    
    // 查看对比详情
    handleViewComparison() {
      console.log('=== 查看对比详情 ===');
      this.$message.info('查看考勤数据对比详情功能待开发');
    },
    
    // 导出明细
    handleExportDetail() {
      console.log('=== 导出明细 ===');
      this.$confirm('确定要导出当前数据吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      })
        .then(() => {
          this.$message.success('导出成功');
        })
        .catch(() => {});
    },
    
    // 导出图表数据
    handleExportChart(chartType) {
      console.log('=== 导出图表数据 ===', chartType);
      this.$message.success(`已导出${chartType}图表数据`);
    }
  }
};
</script>

<style scoped>
.employee-overview-container {
  padding: 16px;
  background: #f5f7fa;
  min-height: calc(100vh - 100px);
}

/* 查询栏 */
.query-bar {
  background: #fff;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 统计卡片 */
.stats-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  padding: 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-value.highlight {
  color: #409EFF;
}

.stat-value.success {
  color: #67C23A;
}

.comparison-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
}

.comparison-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

/* 图表区域 */
.chart-section {
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.chart-title-wrapper {
  display: flex;
  align-items: center;
}

/* 图表行 */
.chart-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.chart-row .chart-section {
  flex: 1;
}

/* 年休假分布区域 */
.leave-distribution {
  margin-bottom: 0;
}

/* 响应式 */
@media (max-width: 1200px) {
  .chart-row {
    flex-direction: column;
  }
  
  .stats-cards {
    flex-wrap: wrap;
  }
  
  .stat-card {
    min-width: calc(50% - 8px);
  }
}
</style>
