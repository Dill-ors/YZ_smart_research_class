export const ROLES = {
  ADMIN: 'admin',
  DISTRICT_DIRECTOR: 'district_director',
  DISTRICT_RESEARCHER: 'district_researcher',
  PRINCIPAL: 'principal',
  TEACHER: 'teacher'
};

const ROLE_PERMISSIONS = {
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

