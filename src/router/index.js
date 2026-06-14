import Vue from 'vue';
import Router from 'vue-router';
import DataAccessManagement from '../views/DataAccessManagement.vue';
import DataConfig from '../views/DataConfig.vue';
import DataCustom from '../views/DataCustom.vue';
import SensingBasicData from '../views/SensingBasicData.vue';
import ExternalApiReceive from '../views/ExternalApiReceive.vue';
import ExternalApiAuth from '../views/ExternalApiAuth.vue';
import ExternalApiTransform from '../views/ExternalApiTransform.vue';
import InterfaceServerConfig from '../views/InterfaceServerConfig.vue';
import InterfaceRequestFormat from '../views/InterfaceRequestFormat.vue';
import MultiSourceCollect from '../views/MultiSourceCollect.vue';
import MultiSourceDisplay from '../views/MultiSourceDisplay.vue';
import EmployeeBasicLedger from '../views/EmployeeBasicLedger.vue';
import StaffAttendanceLedger from '../views/StaffAttendanceLedger.vue';
import StaffAssessmentLedger from '../views/StaffAssessmentLedger.vue';
import BehaviorModeSettings from '../views/BehaviorModeSettings.vue';
import MajorCategory from '../views/MajorCategory.vue';
import OrgManagement from '../views/OrgManagement.vue';
import OrgRelationConfig from '../views/OrgRelationConfig.vue';
import StaffPostRelationConfig from '../views/StaffPostRelationConfig.vue';
import RoleManagement from '../views/RoleManagement.vue';
import RoleHierarchy from '../views/RoleHierarchy.vue';
import RoleUserAssociation from '../views/RoleUserAssociation.vue';
import ModulePermissionAllocation from '../views/ModulePermissionAllocation.vue';
import OrgLevelPermission from '../views/OrgLevelPermission.vue';
import PermissionControl from '../views/PermissionControl.vue';
import LoginLogContent from '../views/LoginLogContent.vue';
import LoginLogQuery from '../views/LoginLogQuery.vue';
import LoginLogManagement from '../views/LoginLogManagement.vue';
import AbnormalDataProcessing from '../views/AbnormalDataProcessing.vue';
import DataRepairRecords from '../views/DataRepairRecords.vue';
import AbnormalDataDisposal from '../views/AbnormalDataDisposal.vue';
import DataExportFunction from '../views/DataExportFunction.vue';
import ExportRecordQuery from '../views/ExportRecordQuery.vue';
import DataDictionary from '../views/DataDictionary.vue';
import ModulePlaceholder from '../views/ModulePlaceholder.vue';
import EmployeeAttendanceData from '../views/EmployeeAttendanceData.vue';
import AttendanceGroupManagement from '../views/AttendanceGroupManagement.vue';
import AbnormalDataManagement from '../views/AbnormalDataManagement.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/employee-attendance-behavior/data',
      name: 'EmployeeAttendanceData',
      component: EmployeeAttendanceData,
      meta: { title: '员工出勤数据管理', description: '员工出勤数据管理页面，展示和管理各类考勤组信息。' }
    },
    {
      path: '/employee-attendance-behavior/abnormal',
      name: 'EmployeeAttendanceAbnormalManagement',
      component: AbnormalDataManagement,
      meta: { title: '员工异常数据管理', description: '员工异常数据管理模块页面，包含异常数据审批、台账信息和预警查询功能。' }
    },
    {
      path: '/employee-attendance-behavior/config',
      name: 'EmployeeAttendanceConfigManagement',
      component: ModulePlaceholder,
      meta: { title: '出勤配置管理', description: '出勤配置管理模块页面，后续承载出勤规则与参数配置功能。' }
    },
    {
      path: '/employee-attendance-behavior/group-management',
      name: 'AttendanceGroupManagement',
      component: AttendanceGroupManagement,
      meta: { title: '考勤组管理', description: '考勤组管理页面，支持用户新增考勤组并关联人员。' }
    },
    {
      path: '/behavior-visual-dashboard/attendance-stats',
      name: 'AttendanceStats',
      component: ModulePlaceholder,
      meta: { title: '出勤情况统计', description: '员工出勤情况统计页面，展示各类出勤数据统计与分析。' }
    },
    {
      path: '/behavior-visual-dashboard/employee-overview',
      name: 'EmployeeBehaviorOverview',
      component: ModulePlaceholder,
      meta: { title: '员工行为总览-员工出勤情况', description: '员工行为总览页面，展示员工出勤情况综合视图。' }
    },
    {
      path: '/behavior-intelligence-scenarios/model-management',
      name: 'ModelManagement',
      component: ModulePlaceholder,
      meta: { title: '智能分析模型管理', description: '智能分析模型管理页面，用于配置和管理各类行为分析模型。' }
    },
    {
      path: '/behavior-intelligence-scenarios/work-saturation',
      name: 'WorkSaturationAnalysis',
      component: ModulePlaceholder,
      meta: { title: '员工工作饱和度分析', description: '员工工作饱和度分析页面，展示员工工作量与饱和度统计。' }
    },
    {
      path: '/employee-credit-profile/evaluation-standard',
      name: 'CreditEvaluationStandard',
      component: ModulePlaceholder,
      meta: { title: '信用评价标准库', description: '信用评价标准库页面，用于管理和维护员工信用评价的标准体系。' }
    },
    {
      path: '/employee-credit-profile/rating-data',
      name: 'CreditRatingData',
      component: ModulePlaceholder,
      meta: { title: '信用评级数据管理', description: '信用评级数据管理页面，用于管理员工信用评级相关数据。' }
    },
    {
      path: '/employee-credit-profile/profile-display',
      name: 'CreditProfileDisplay',
      component: ModulePlaceholder,
      meta: { title: '信用画像展示', description: '信用画像展示页面，可视化展示员工信用画像与指标汇总。' }
    },
    {
      path: '/data-access',
      name: 'DataAccessManagement',
      component: DataAccessManagement
    },
    {
      path: '/data-config',
      name: 'DataConfig',
      component: DataConfig
    },
    {
      path: '/data-custom',
      name: 'DataCustom',
      component: DataCustom
    },
    {
      path: '/sensing-basic/rules',
      name: 'SensingBasicDataRules',
      component: SensingBasicData
    },
    {
      path: '/sensing-basic/clean',
      name: 'SensingBasicData',
      component: SensingBasicData
    },
    {
      path: '/sensing-basic/organize',
      name: 'SensingBasicDataOrganize',
      component: SensingBasicData
    },
    {
      path: '/sensing-basic/output',
      name: 'SensingBasicDataOutput',
      component: SensingBasicData
    },
    {
      path: '/external-api-receive',
      name: 'ExternalApiReceive',
      component: ExternalApiReceive
    },
    {
      path: '/external-api-auth',
      name: 'ExternalApiAuth',
      component: ExternalApiAuth
    },
    {
      path: '/external-api-transform',
      name: 'ExternalApiTransform',
      component: ExternalApiTransform
    },
    {
      path: '/interface-config/server',
      name: 'InterfaceServerConfig',
      component: InterfaceServerConfig
    },
    {
      path: '/interface-config/format',
      name: 'InterfaceRequestFormat',
      component: InterfaceRequestFormat
    },
    {
      path: '/multi-source-aggregation/collect',
      name: 'MultiSourceCollect',
      component: MultiSourceCollect
    },
    {
      path: '/multi-source-aggregation/display',
      name: 'MultiSourceDisplay',
      component: MultiSourceDisplay
    },
    {
      path: '/staff-basic-ledger',
      name: 'EmployeeBasicLedger',
      component: EmployeeBasicLedger
    },
    {
      path: '/staff-attendance-ledger',
      name: 'StaffAttendanceLedger',
      component: StaffAttendanceLedger
    },
    {
      path: '/staff-assessment-ledger',
      name: 'StaffAssessmentLedger',
      component: StaffAssessmentLedger
    },
    {
      path: '/behavior-mode-settings',
      name: 'BehaviorModeSettings',
      component: BehaviorModeSettings
    },
    {
      path: '/major-category',
      name: 'MajorCategory',
      component: MajorCategory
    },
    {
      path: '/org-management',
      name: 'OrgManagement',
      component: OrgManagement
    },
    {
      path: '/org-relation-config',
      name: 'OrgRelationConfig',
      component: OrgRelationConfig
    },
    {
      path: '/staff-post-relation-config',
      name: 'StaffPostRelationConfig',
      component: StaffPostRelationConfig
    },
    {
      path: '/role-management',
      name: 'RoleManagement',
      component: RoleManagement
    },
    {
      path: '/role-hierarchy',
      name: 'RoleHierarchy',
      component: RoleHierarchy
    },
    {
      path: '/role-user-association',
      name: 'RoleUserAssociation',
      component: RoleUserAssociation
    },
    {
      path: '/module-permission-allocation',
      name: 'ModulePermissionAllocation',
      component: ModulePermissionAllocation
    },
    {
      path: '/org-level-permission',
      name: 'OrgLevelPermission',
      component: OrgLevelPermission
    },
    {
      path: '/permission-control',
      name: 'PermissionControl',
      component: PermissionControl
    },
    {
      path: '/login-log-content',
      name: 'LoginLogContent',
      component: LoginLogContent
    },
    {
      path: '/login-log-query',
      name: 'LoginLogQuery',
      component: LoginLogQuery
    },
    {
      path: '/login-log-management',
      name: 'LoginLogManagement',
      component: LoginLogManagement
    },
    {
      path: '/abnormal-data-processing',
      name: 'AbnormalDataProcessing',
      component: AbnormalDataProcessing
    },
    {
      path: '/data-repair-records',
      name: 'DataRepairRecords',
      component: DataRepairRecords
    },
    {
      path: '/abnormal-data-disposal',
      name: 'AbnormalDataDisposal',
      component: AbnormalDataDisposal
    },
    {
      path: '/data-export-function',
      name: 'DataExportFunction',
      component: DataExportFunction
    },
    {
      path: '/export-record-query',
      name: 'ExportRecordQuery',
      component: ExportRecordQuery
    },
    {
      path: '/data-dictionary',
      name: 'DataDictionary',
      component: DataDictionary
    },
    {
      path: '/personal-attendance-app/settings',
      name: 'PersonalAttendanceSettings',
      component: ModulePlaceholder,
      meta: { title: '我的设置', description: '个人出勤管理APP设置页面，用于配置个人偏好与参数。' }
    },
    {
      path: '/personal-attendance-app/attendance-stats',
      name: 'PersonalAttendanceStats',
      component: ModulePlaceholder,
      meta: { title: '出勤统计', description: '个人出勤统计页面，展示个人出勤数据统计与分析。' }
    },
    {
      path: '/personal-attendance-app/home',
      name: 'PersonalAttendanceHome',
      component: ModulePlaceholder,
      meta: { title: '首页', description: '个人出勤管理APP首页，展示个人出勤概览信息。' }
    },
    {
      path: '/team-behavior-portrait/attendance-stability',
      name: 'AttendanceStabilityAnalysis',
      component: ModulePlaceholder,
      meta: { title: '出勤稳定性分析', description: '出勤稳定性分析页面，展示员工或班组的出勤稳定情况。' }
    },
    {
      path: '/team-behavior-portrait/attendance-pattern',
      name: 'AttendancePatternAnalysis',
      component: ModulePlaceholder,
      meta: { title: '出勤时间规律分析', description: '出勤时间规律分析页面，分析员工或班组的出勤时间规律。' }
    },
    {
      path: '/team-behavior-portrait/leave-behavior',
      name: 'LeaveBehaviorAnalysis',
      component: ModulePlaceholder,
      meta: { title: '请假行为分析', description: '请假行为分析页面，统计和分析员工或班组的请假行为模式。' }
    },
    {
      path: '/team-behavior-portrait/comprehensive-evaluation',
      name: 'ComprehensiveEvaluation',
      component: ModulePlaceholder,
      meta: { title: '员工行为画像综合评估', description: '员工行为画像综合评估页面，提供多维度的行为画像综合评分与展示。' }
    },
    {
      path: '/',
      redirect: '/data-access'
    }
  ]
});
