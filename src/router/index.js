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

Vue.use(Router);

export default new Router({
  routes: [
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
      path: '/',
      redirect: '/data-access'
    }
  ]
});
