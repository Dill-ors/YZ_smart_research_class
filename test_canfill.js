const allowedRoles = undefined;
const allowedUsers = ['u5'];
const userRole = 'teacher';
const currentUser = { id: 'u6', username: 'teacher2' };
const isEditMode = false;

const noPermissionsSet = (!allowedRoles || allowedRoles.length === 0) && (!allowedUsers || allowedUsers.length === 0);
const hasRoleAccess = allowedRoles && allowedRoles.includes(userRole);
const hasUserAccess = allowedUsers && (allowedUsers.includes(currentUser?.id) || allowedUsers.includes(currentUser?.username));
const canFill = isEditMode || noPermissionsSet || hasRoleAccess || hasUserAccess;

console.log({
  noPermissionsSet,
  hasRoleAccess,
  hasUserAccess,
  canFill
});
