import { useEventCollector } from './useEventCollector';

interface AdminEventMetadata {
  userId?: number;
  resourceId?: number;
  resourceType?: string;
  originalValue?: any;
  newValue?: any;
  reason?: string;
  source?: 'user' | 'system';
}

export function useAdminEvents() {
  const { collectEvent } = useEventCollector();

  const collectSettingsModified = (
    settingType: string,
    metadata: AdminEventMetadata = {}
  ) => {
    return collectEvent('settings_modified', {
      setting_type: settingType,
      ...metadata
    });
  };

  const collectUserPermissionChanged = (
    userId: number,
    permission: string,
    action: 'granted' | 'revoked',
    metadata: AdminEventMetadata = {}
  ) => {
    return collectEvent('user_permission_changed', {
      user_id: userId,
      permission,
      action,
      ...metadata
    });
  };

  const collectAIModelRetrained = (
    modelType: string,
    metadata: AdminEventMetadata = {}
  ) => {
    return collectEvent('ai_model_retrained', {
      model_type: modelType,
      ...metadata
    });
  };

  const collectAlertConfigurationChanged = (
    alertType: string,
    metadata: AdminEventMetadata = {}
  ) => {
    return collectEvent('alert_configuration_changed', {
      alert_type: alertType,
      ...metadata
    });
  };

  const collectSystemBackupCreated = (
    backupType: string,
    metadata: AdminEventMetadata = {}
  ) => {
    return collectEvent('system_backup_created', {
      backup_type: backupType,
      ...metadata
    });
  };

  const collectSystemRestoreInitiated = (
    restorePoint: string,
    metadata: AdminEventMetadata = {}
  ) => {
    return collectEvent('system_restore_initiated', {
      restore_point: restorePoint,
      ...metadata
    });
  };

  const collectAuditLogExported = (
    dateRange: { start: string; end: string },
    metadata: AdminEventMetadata = {}
  ) => {
    return collectEvent('audit_log_exported', {
      date_range: dateRange,
      ...metadata
    });
  };

  const collectBillingConfigurationChanged = (
    configType: string,
    metadata: AdminEventMetadata = {}
  ) => {
    return collectEvent('billing_configuration_changed', {
      config_type: configType,
      ...metadata
    });
  };

  const collectSecurityPolicyModified = (
    policyType: string,
    metadata: AdminEventMetadata = {}
  ) => {
    return collectEvent('security_policy_modified', {
      policy_type: policyType,
      ...metadata
    });
  };

  const collectMaintenanceModeToggled = (
    enabled: boolean,
    metadata: AdminEventMetadata = {}
  ) => {
    return collectEvent('maintenance_mode_toggled', {
      enabled,
      ...metadata
    });
  };

  return {
    collectSettingsModified,
    collectUserPermissionChanged,
    collectAIModelRetrained,
    collectAlertConfigurationChanged,
    collectSystemBackupCreated,
    collectSystemRestoreInitiated,
    collectAuditLogExported,
    collectBillingConfigurationChanged,
    collectSecurityPolicyModified,
    collectMaintenanceModeToggled
  };
} 