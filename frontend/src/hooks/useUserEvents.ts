import { useEventCollector } from './useEventCollector';

interface UserEventMetadata {
  userId?: number;
  originalValue?: any;
  newValue?: any;
  reason?: string;
  source?: 'user' | 'system' | 'ai';
  sessionId?: string;
  ipAddress?: string;
  deviceInfo?: string;
  roleId?: number;
  roleName?: string;
  permissionId?: number;
  permissionName?: string;
}

export function useUserEvents() {
  const { collectEvent } = useEventCollector();

  const collectUserLogin = (
    userId: number,
    metadata: UserEventMetadata = {}
  ) => {
    return collectEvent('user_login', {
      user_id: userId,
      ...metadata
    });
  };

  const collectUserLogout = (
    userId: number,
    metadata: UserEventMetadata = {}
  ) => {
    return collectEvent('user_logout', {
      user_id: userId,
      ...metadata
    });
  };

  const collectUserPermissionGranted = (
    userId: number,
    permissionId: number,
    permissionName: string,
    metadata: UserEventMetadata = {}
  ) => {
    return collectEvent('user_permission_granted', {
      user_id: userId,
      permission_id: permissionId,
      permission_name: permissionName,
      ...metadata
    });
  };

  const collectUserPermissionRevoked = (
    userId: number,
    permissionId: number,
    permissionName: string,
    reason: string,
    metadata: UserEventMetadata = {}
  ) => {
    return collectEvent('user_permission_revoked', {
      user_id: userId,
      permission_id: permissionId,
      permission_name: permissionName,
      revocation_reason: reason,
      ...metadata
    });
  };

  const collectUserRoleAssigned = (
    userId: number,
    roleId: number,
    roleName: string,
    metadata: UserEventMetadata = {}
  ) => {
    return collectEvent('user_role_assigned', {
      user_id: userId,
      role_id: roleId,
      role_name: roleName,
      ...metadata
    });
  };

  const collectUserRoleRemoved = (
    userId: number,
    roleId: number,
    roleName: string,
    reason: string,
    metadata: UserEventMetadata = {}
  ) => {
    return collectEvent('user_role_removed', {
      user_id: userId,
      role_id: roleId,
      role_name: roleName,
      removal_reason: reason,
      ...metadata
    });
  };

  const collectUserSessionStarted = (
    userId: number,
    sessionId: string,
    metadata: UserEventMetadata = {}
  ) => {
    return collectEvent('user_session_started', {
      user_id: userId,
      session_id: sessionId,
      ...metadata
    });
  };

  const collectUserSessionEnded = (
    userId: number,
    sessionId: string,
    metadata: UserEventMetadata = {}
  ) => {
    return collectEvent('user_session_ended', {
      user_id: userId,
      session_id: sessionId,
      ...metadata
    });
  };

  return {
    collectUserLogin,
    collectUserLogout,
    collectUserPermissionGranted,
    collectUserPermissionRevoked,
    collectUserRoleAssigned,
    collectUserRoleRemoved,
    collectUserSessionStarted,
    collectUserSessionEnded
  };
} 