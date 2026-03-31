
function testPermissions(allowedRoles, allowedUsers, userRole, userId, username) {
  const noPermissionsSet = (!allowedRoles || allowedRoles.length === 0) && (!allowedUsers || allowedUsers.length === 0);
  const hasRoleAccess = allowedRoles && allowedRoles.includes(userRole);
  const hasUserAccess = allowedUsers && (allowedUsers.includes(userId) || allowedUsers.includes(username));
  const canFill = false || noPermissionsSet || (allowedUsers?.length > 0 ? hasUserAccess : hasRoleAccess);
  return !!canFill;
}
console.log('Role teacher + user u5, user u6:', testPermissions(['teacher'], ['u5'], 'teacher', 'u6', 'teacher2'));

