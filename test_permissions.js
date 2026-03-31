const assert = require('assert');

function testPermissions(allowedRoles, allowedUsers, userRole, userId, username) {
  const noPermissionsSet = (!allowedRoles || allowedRoles.length === 0) && (!allowedUsers || allowedUsers.length === 0);
  const hasRoleAccess = allowedRoles && allowedRoles.includes(userRole);
  const hasUserAccess = allowedUsers && (allowedUsers.includes(userId) || allowedUsers.includes(username));
  const canFill = false || noPermissionsSet || hasRoleAccess || hasUserAccess;
  return !!canFill;
}

console.log("Empty permissions, teacher:", testPermissions(undefined, undefined, 'teacher', 'u6', 'teacher2'));
console.log("Only user u5, user u5:", testPermissions(undefined, ['u5'], 'teacher', 'u5', 'teacher1'));
console.log("Only user u5, user u6 (other teacher):", testPermissions(undefined, ['u5'], 'teacher', 'u6', 'teacher2'));
console.log("Role teacher, user u5, user u6:", testPermissions(['teacher'], ['u5'], 'teacher', 'u6', 'teacher2'));
