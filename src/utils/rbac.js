export const ROLES = {
  ADMIN: 'admin',
  DISTRICT_DIRECTOR: 'district_director',
  PRINCIPAL: 'principal',
  TEACHER: 'teacher'
};

// 权限定义说明：
// - canDelete: 可以删除数据
// - canModifyStructure: 可以修改数据结构（如问卷模板）
// - canPublish: 可以发布内容
// - canViewAll: 可以查看所有数据（不受学校/区域限制）
// - canFill: 可以填写问卷/记录
// - canManageSchedules: 可以管理日程安排（添加、修改、删除日程）
// 注意：canViewAll 为 true 表示用户可以查看所有数据，为 false 表示只能查看权限范围内的数据

// 各角色权限详细说明：
// 1. 管理员 (admin):
//    - 可以查看和管理所有学校的日程安排和听课记录
//    - 可以删除、修改、发布任何数据
//    - 可以管理所有日程安排
//    - 可以填写听课记录
//
// 2. 区教研主任 (district_director):
//    - 只能查看和管理所辖区域的学校数据
//    - 可以删除、修改、发布权限范围内的数据
//    - 可以管理所辖区域的日程安排
//    - 可以填写听课记录
//
// 3. 校长 (principal):
//    - 只能查看和管理自己学校的日程安排
//    - 可以删除、修改、发布自己学校的数据
//    - 可以管理自己学校的日程安排
//    - 可以填写听课记录
//
// 4. 教师 (teacher):
//    - 只能查看和管理自己作为听课人的日程安排
//    - 可以填写听课记录（将状态从scheduled更新为completed）
//    - 不能删除、修改数据结构、发布内容
//    - 不能管理日程安排（只能填写已有的日程安排）
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    canDelete: true,
    canModifyStructure: true,
    canPublish: true,
    canViewAll: true,
    canFill: true,
    canManageSchedules: true,
  },
  [ROLES.DISTRICT_DIRECTOR]: {
    canDelete: true,
    canModifyStructure: true,
    canPublish: true,
    canViewAll: false, // 只能查看所辖区域的数据
    canFill: true,
    canManageSchedules: true,
  },
  [ROLES.PRINCIPAL]: {
    canDelete: true,
    canModifyStructure: true,
    canPublish: true,
    canViewAll: false, // 只能查看自己学校的数据
    canFill: true,
    canManageSchedules: true,
  },
  [ROLES.TEACHER]: {
    canDelete: false,
    canModifyStructure: false,
    canPublish: false,
    canViewAll: false, // 只能查看分配给自己的数据
    canFill: true,
    canManageSchedules: false,
  }
};

export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  const rolePerms = ROLE_PERMISSIONS[user.role];
  return rolePerms ? !!rolePerms[permission] : false;
};

/**
 * 判断用户是否为教师角色
 */
export const isTeacher = (user) => {
  return user?.role === ROLES.TEACHER;
};

/**
 * 判断用户是否可以编辑日程基本信息
 * 非教师角色（管理员、区教研主任、校长）可以编辑基本信息
 */
export const canEditScheduleBasic = (user) => {
  if (!user || !user.role) return false;
  return [ROLES.ADMIN, ROLES.DISTRICT_DIRECTOR, ROLES.PRINCIPAL].includes(user.role);
};

/**
 * 判断用户是否可以编辑日程的评价内容
 * 只有教师角色可以编辑评价（填写听课记录）
 */
export const canEditScheduleEvaluation = (user, schedule) => {
  if (!user || !user.role) return false;
  // 教师只能编辑自己作为听课人的记录
  if (user.role === ROLES.TEACHER) {
    return schedule?.observer === user.name;
  }
  return false;
};

/**
 * 判断用户是否可以删除日程/听课记录
 */
export const canDeleteSchedule = (user, schedule) => {
  if (!user || !user.role || !schedule) return false;

  // 有管理权限的角色可以删除
  if (hasPermission(user, 'canManageSchedules')) {
    return true;
  }

  // 教师可以删除自己创建的记录
  if (user.role === ROLES.TEACHER && schedule.createdBy === user.id) {
    return true;
  }

  // 教师可以删除自己作为听课人的记录（向后兼容）
  if (user.role === ROLES.TEACHER && schedule.observer === user.name) {
    return true;
  }

  return false;
};
