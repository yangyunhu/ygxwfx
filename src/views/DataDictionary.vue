<template>
  <div class="perm-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">数据字典</h2>
        <p class="page-desc">
          管理系统中的字典数据，包括字典类型和字典项的增删改查。
        </p>
      </div>
      <div>
        <el-button size="small" icon="el-icon-plus" @click="handleAddDict"
          >新增字典组</el-button
        >
        <el-button
          size="small"
          icon="el-icon-edit"
          :disabled="!selectedGroup"
          @click="handleEditGroup"
          >编辑字典组</el-button
        >
      </div>
    </div>

    <div class="dict-layout">
      <!-- 左侧：数据字典组列表 -->
      <div class="dict-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title"
            >字典组总数 <strong>{{ dictGroups.length }}</strong></span
          >
        </div>
        <div class="sidebar-list" v-loading="loading">
          <div
            v-for="group in dictGroups"
            :key="group.dictCode"
            class="dict-group-item"
            :class="{
              active:
                selectedGroup && selectedGroup.dictCode === group.dictCode,
            }"
            @click="selectGroup(group)"
          >
            <div class="group-info">
              <div class="group-name">{{ group.dictName }}</div>
              <div class="group-code">{{ group.dictCode }}</div>
            </div>
            <div class="group-count">{{ group.itemCount }}项</div>
          </div>
          <div v-if="!dictGroups.length" class="empty-tip">暂无字典组</div>
        </div>
      </div>

      <!-- 右侧：字典项列表 -->
      <div class="dict-content">
        <div class="content-header">
          <div class="content-title">
            <span v-if="selectedGroup">{{ selectedGroup.dictName }}</span>
            <span v-else class="placeholder">请选择字典组</span>
          </div>
          <div v-if="selectedGroup" class="content-actions">
            <el-button size="small" icon="el-icon-plus" @click="handleAddItem"
              >新增字典项</el-button
            >
          </div>
        </div>

        <div v-if="selectedGroup" class="content-table">
          <el-table :data="dictItems" border size="small" v-loading="loading">
            <el-table-column prop="itemCode" label="字典项编码" width="150" />
            <el-table-column
              prop="itemName"
              label="字典项名称"
              width="150"
            />
            <el-table-column prop="itemValue" label="字典值" width="120" />
            <el-table-column
              prop="sort"
              label="排序"
              width="80"
              align="center"
            />
            <el-table-column
              prop="status"
              label="状态"
              width="100"
              align="center"
            >
              <template slot-scope="{ row }">
                <el-tag
                  :type="row.status === '1' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ row.status === "1" ? "启用" : "禁用" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="itemType"
              label="字典项类型"
              width="130"
              align="center"
            >
              <template slot-scope="{ row }">
                <el-tag
                  :type="row.itemType === 'sys' ? 'warning' : 'info'"
                  size="small"
                >
                  {{ row.itemType === "sys" ? "系统内置" : "非系统内置" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="remark"
              label="备注"
              width="200"
              show-overflow-tooltip
            />
            <el-table-column
              label="操作"
              width="150"
              align="center"
            >
              <template slot-scope="{ row }">
                <el-button
                  type="text"
                  size="small"
                  :disabled="row.itemType === 'sys'"
                  @click="handleEditItem(row)"
                  >编辑</el-button
                >
                <el-button
                  type="text"
                  size="small"
                  style="color: #f56c6c"
                  :disabled="row.itemType === 'sys'"
                  @click="handleDeleteItem(row)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              :current-page="page"
              :page-size="pageSize"
              :total="dictItems.length"
              layout="total, prev, pager, next"
              @current-change="page = $event"
            />
          </div>
        </div>

        <div v-else class="empty-content">
          <i
            class="el-icon-document"
            style="font-size: 64px; color: #c0c4cc"
          ></i>
          <p style="color: #909399; margin-top: 16px">
            请从左侧选择一个字典组查看字典项
          </p>
        </div>
      </div>
    </div>

    <!-- 新增/编辑字典组弹窗 -->
    <el-dialog
      :title="groupFormTitle"
      :visible.sync="groupDialogVisible"
      width="600px"
      @close="resetGroupForm"
    >
      <el-form
        :model="groupForm"
        :rules="groupRules"
        ref="groupForm"
        label-width="100px"
      >
        <el-form-item label="字典组名称" prop="dictName">
          <el-input
            v-model="groupForm.dictName"
            placeholder="请输入字典组名称"
          />
        </el-form-item>
        <el-form-item label="字典组编码" prop="dictCode">
          <el-input
            v-model="groupForm.dictCode"
            placeholder="请输入字典组编码，仅允许英文字母和下划线"
            :disabled="isEditGroup"
          />
          <div class="form-tip">
            格式：仅允许英文字母和下划线，例如：user_type
          </div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="groupForm.status">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="groupForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="groupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitGroupForm">确定</el-button>
      </div>
    </el-dialog>

    <!-- 新增/编辑字典项弹窗 -->
    <el-dialog
      :title="itemFormTitle"
      :visible.sync="itemDialogVisible"
      width="600px"
      @close="resetItemForm"
    >
      <el-form
        :model="itemForm"
        :rules="itemRules"
        ref="itemForm"
        label-width="100px"
      >
        <el-form-item label="字典项名称" prop="itemName">
          <el-input
            v-model="itemForm.itemName"
            placeholder="请输入字典项名称"
          />
        </el-form-item>
        <el-form-item label="字典项编码" prop="itemCode">
          <el-input
            v-model="itemForm.itemCode"
            placeholder="请输入字典项编码，仅允许英文字母和下划线"
            :disabled="isEditItem"
          />
          <div class="form-tip">
            格式：仅允许英文字母和下划线，例如：normal_user
          </div>
        </el-form-item>
        <el-form-item label="字典值" prop="itemValue">
          <el-input v-model="itemForm.itemValue" placeholder="请输入字典值" />
        </el-form-item>
        <el-form-item label="字典项类型" prop="itemType">
          <el-select
            v-model="itemForm.itemType"
            placeholder="请选择字典项类型"
            style="width: 100%"
            :disabled="isEditItem"
          >
            <el-option label="系统内置字典项" value="sys" />
            <el-option label="非系统内置字典项" value="biz" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="itemForm.sort"
            :min="1"
            :max="999"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="itemForm.status">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="itemForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitItemForm">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "DataDictionary",
  data() {
    return {
      loading: false,
      page: 1,
      pageSize: 20,
      dictGroups: [], // 字典组列表
      dictItems: [], // 当前选中字典组的字典项列表
      selectedGroup: null, // 当前选中的字典组

      // 字典组表单
      groupDialogVisible: false,
      isEditGroup: false,
      groupForm: {
        dictCode: "",
        dictName: "",
        status: "1",
        remark: "",
      },
      groupRules: {
        dictCode: [
          { required: true, message: "请输入字典编码", trigger: "blur" },
          {
            pattern: /^[a-zA-Z_]+$/,
            message: "字典编码只能包含英文字母和下划线，不允许数字和其他字符",
            trigger: "blur",
          },
        ],
        dictName: [
          { required: true, message: "请输入字典名称", trigger: "blur" },
        ],
      },

      // 字典项表单
      itemDialogVisible: false,
      isEditItem: false,
      itemForm: {
        itemCode: "",
        itemName: "",
        itemValue: "",
        itemType: "biz",
        sort: 1,
        status: "1",
        remark: "",
      },
      itemRules: {
        itemCode: [
          { required: true, message: "请输入字典项编码", trigger: "blur" },
          {
            pattern: /^[a-zA-Z_]+$/,
            message: "字典项编码只能包含英文字母和下划线，不允许数字和其他字符",
            trigger: "blur",
          },
        ],
        itemName: [
          { required: true, message: "请输入字典项名称", trigger: "blur" },
        ],
        itemValue: [
          { required: true, message: "请输入字典值", trigger: "blur" },
        ],
        itemType: [
          { required: true, message: "请选择字典项类型", trigger: "change" },
        ],
      },
    };
  },
  computed: {
    groupFormTitle() {
      return this.isEditGroup ? "编辑字典组" : "新增字典组";
    },
    itemFormTitle() {
      return this.isEditItem ? "编辑字典项" : "新增字典项";
    },
  },
  mounted() {
    this.loadData();
  },
  methods: {
    loadData() {
      this.loading = true;
      // TODO: 从后端或 localStorage 加载数据
      setTimeout(() => {
        // 字典组数据
        this.dictGroups = [
          {
            dictCode: "user_type",
            dictName: "用户类型",
            status: "1",
            remark: "系统用户类型字典",
            createTime: "2024-01-01 10:00:00",
            itemCount: 3,
          },
          {
            dictCode: "gender",
            dictName: "性别",
            status: "1",
            remark: "用户性别字典",
            createTime: "2024-01-02 10:00:00",
            itemCount: 2,
          },
          {
            dictCode: "org_level",
            dictName: "组织级别",
            status: "1",
            remark: "组织机构级别字典",
            createTime: "2024-01-03 10:00:00",
            itemCount: 4,
          },
        ];

        // 默认选中第一个
        if (this.dictGroups.length > 0) {
          this.selectGroup(this.dictGroups[0]);
        }

        this.loading = false;
      }, 500);
    },
    // 选择字典组
    selectGroup(group) {
      this.selectedGroup = group;
      this.page = 1;
      this.loadDictItems(group.dictCode);
    },
    // 加载字典项数据
    loadDictItems(dictCode) {
      this.loading = true;
      // TODO: 根据 dictCode 从后端加载字典项
      setTimeout(() => {
        // 示例数据
        const mockItems = {
          user_type: [
            {
              itemCode: "user_type_admin",
              itemName: "管理员",
              itemValue: "1",
              itemType: "sys",
              sort: 1,
              status: "1",
              remark: "系统管理员",
            },
            {
              itemCode: "user_type_normal",
              itemName: "普通用户",
              itemValue: "2",
              itemType: "sys",
              sort: 2,
              status: "1",
              remark: "普通用户",
            },
            {
              itemCode: "user_type_guest",
              itemName: "访客",
              itemValue: "3",
              itemType: "biz",
              sort: 3,
              status: "0",
              remark: "临时访客",
            },
          ],
          gender: [
            {
              itemCode: "gender_male",
              itemName: "男",
              itemValue: "1",
              itemType: "sys",
              sort: 1,
              status: "1",
              remark: "男性",
            },
            {
              itemCode: "gender_female",
              itemName: "女",
              itemValue: "2",
              itemType: "sys",
              sort: 2,
              status: "1",
              remark: "女性",
            },
          ],
          org_level: [
            {
              itemCode: "org_level_province",
              itemName: "省级",
              itemValue: "1",
              itemType: "sys",
              sort: 1,
              status: "1",
              remark: "省级组织",
            },
            {
              itemCode: "org_level_city",
              itemName: "市级",
              itemValue: "2",
              itemType: "sys",
              sort: 2,
              status: "1",
              remark: "市级组织",
            },
            {
              itemCode: "org_level_county",
              itemName: "县级",
              itemValue: "3",
              itemType: "sys",
              sort: 3,
              status: "1",
              remark: "县级组织",
            },
            {
              itemCode: "org_level_unit",
              itemName: "单位级",
              itemValue: "4",
              itemType: "sys",
              sort: 4,
              status: "1",
              remark: "单位级组织",
            },
          ],
        };

        this.dictItems = mockItems[dictCode] || [];
        this.loading = false;
      }, 300);
    },
    // 新增字典组
    handleAddDict() {
      this.isEditGroup = false;
      this.groupDialogVisible = true;
    },
    // 编辑字典组
    handleEditGroup() {
      this.isEditGroup = true;
      Object.assign(this.groupForm, this.selectedGroup);
      this.groupDialogVisible = true;
    },
    // 新增字典项
    handleAddItem() {
      this.isEditItem = false;
      this.itemDialogVisible = true;
    },
    // 编辑字典项
    handleEditItem(row) {
      if (row.itemType === "sys") {
        this.$message.warning("系统内置字典项不允许编辑");
        return;
      }
      this.isEditItem = true;
      Object.assign(this.itemForm, row);
      this.itemDialogVisible = true;
    },
    // 删除字典项
    handleDeleteItem(row) {
      if (row.itemType === "sys") {
        this.$message.warning("系统内置字典项不允许删除");
        return;
      }
      this.$confirm(`确定要删除字典项"${row.itemName}"吗？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.$message.success("删除成功");
        })
        .catch(() => {});
    },

    // 提交字典组表单
    submitGroupForm() {
      this.$refs.groupForm.validate((valid) => {
        if (valid) {
          if (this.isEditGroup) {
            // 编辑逻辑
            Object.assign(this.selectedGroup, this.groupForm);
            this.$message.success("字典组更新成功");
          } else {
            // 新增逻辑
            const newGroup = {
              ...this.groupForm,
              itemCount: 0,
              createTime: new Date().toLocaleString(),
            };
            this.dictGroups.push(newGroup);
            this.$message.success("字典组新增成功");
            // 自动选中新新增的字典组
            this.selectGroup(newGroup);
          }
          this.groupDialogVisible = false;
        }
      });
    },

    // 提交字典项表单
    submitItemForm() {
      this.$refs.itemForm.validate((valid) => {
        if (valid) {
          if (this.isEditItem) {
            // 编辑逻辑
            const index = this.dictItems.findIndex(
              (item) => item.itemCode === this.itemForm.itemCode,
            );
            if (index > -1) {
              Object.assign(this.dictItems[index], this.itemForm);
            }
            this.$message.success("字典项更新成功");
          } else {
            // 新增逻辑
            const newItem = {
              ...this.itemForm,
            };
            this.dictItems.push(newItem);
            // 更新字典组的项数量
            if (this.selectedGroup) {
              this.selectedGroup.itemCount = this.dictItems.length;
            }
            this.$message.success("字典项新增成功");
          }
          this.itemDialogVisible = false;
        }
      });
    },

    // 重置字典组表单
    resetGroupForm() {
      this.$refs.groupForm && this.$refs.groupForm.resetFields();
      this.groupForm = {
        dictCode: "",
        dictName: "",
        status: "1",
        remark: "",
      };
    },

    // 重置字典项表单
    resetItemForm() {
      this.$refs.itemForm && this.$refs.itemForm.resetFields();
      this.itemForm = {
        itemCode: "",
        itemName: "",
        itemValue: "",
        itemType: "biz",
        sort: 1,
        status: "1",
        remark: "",
      };
    },

    // 自动生成字典编码
    autoGenerateDictCode() {},

    // 自动生成字典项编码
    autoGenerateItemCode() {},
  },
};
</script>

<style scoped src="../styles/permission-page.css"></style>
<style scoped>
/* 左右布局 */
.dict-layout {
  display: flex;
  gap: 16px;
  height: calc(100vh - 200px);
  margin-top: 16px;
}

/* 左侧字典组列表 */
.dict-sidebar {
  width: 300px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #f5f7fa;
}

.sidebar-title {
  font-size: 14px;
  color: #606266;
}

.sidebar-title strong {
  color: #409eff;
  margin-left: 4px;
}

.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.dict-group-item {
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dict-group-item:hover {
  border-color: #b3d8ff;
  background: #ecf5ff;
}

.dict-group-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.group-info {
  flex: 1;
}

.group-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.group-code {
  font-size: 12px;
  color: #909399;
}

.group-count {
  font-size: 12px;
  color: #409eff;
  font-weight: 500;
  flex-shrink: 0;
}

.empty-tip {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}

/* 右侧字典项列表 */
.dict-content {
  flex: 1;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background: #f5f7fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.content-title .placeholder {
  color: #909399;
  font-weight: 400;
}

.content-actions {
  display: flex;
  gap: 8px;
}

.content-table {
  flex: 1;
  overflow: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content-table ::v-deep .el-table {
  flex: 1;
  overflow-x: auto;
  min-width: 1100px;
}

.content-table ::v-deep .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

.pagination-wrapper {
  margin-top: 16px;
  padding: 16px;
  text-align: right;
}

/* 系统内置字典项的操作按钮禁用样式 */
.content-table ::v-deep .el-button.is-disabled {
  color: #c0c4cc !important;
  cursor: not-allowed;
}

.empty-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
</style>
.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
</style>
.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}
</style>
