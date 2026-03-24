export const ROLES = {
  ADMIN: 'admin',
  DISTRICT_DIRECTOR: 'district_director',
  DISTRICT_RESEARCHER: 'district_researcher',
  PRINCIPAL: 'principal',
  TEACHER: 'teacher'
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    canDelete: true,
    canModifyStructure: true,
    canPublish: true,
    canViewAll: true,
    canFill: true,
  },
  [ROLES.DISTRICT_DIRECTOR]: {
    canDelete: true,
    canModifyStructure: true,
    canPublish: true,
    canViewAll: true,
    canFill: true,
  },
  [ROLES.PRINCIPAL]: {
    canDelete: true,
    canModifyStructure: true,
    canPublish: true,
    canViewAll: true,
    canFill: true,
  },
  [ROLES.DISTRICT_RESEARCHER]: {
    canDelete: false,
    canModifyStructure: false,
    canPublish: false,
    canViewAll: true,
    canFill: true,
  },
  [ROLES.TEACHER]: {
    canDelete: false,
    canModifyStructure: false,
    canPublish: false,
    canViewAll: false, // Maybe only view assigned ones? For now, keep it simple
    canFill: true,
  }
};

export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  const rolePerms = ROLE_PERMISSIONS[user.role];
  return rolePerms ? !!rolePerms[permission] : false;
};

// Check if a user can fill a specific question
export const canFillQuestion = (user, questionPermissions) => {
  if (!user || !user.role) return false;
  // If no specific permissions set for the question, assume anyone who can fill can fill it
  if (!questionPermissions || questionPermissions.length === 0) return hasPermission(user, 'canFill');
  
  // Admin/Principal/Director can always fill? The requirement says:
  // "收到问卷的人不能修改问卷，只能填写自己需要填写的部分"
  // So even admin should follow question permissions if they are filling? 
  // Let's assume question permissions apply to everyone strictly when filling.
  return questionPermissions.includes(user.role);
};
