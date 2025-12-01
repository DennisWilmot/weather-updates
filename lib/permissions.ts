/**
 * Comprehensive Permission Definitions for Weather Updates System
 * Based on RBAC Permissions Matrix with 150+ granular permissions
 */

// User roles as defined in the RBAC matrix
export type UserRole = "admin" | "ops" | "field" | "analyst" | "needs";

// All permission strings following {category}_{action} format
export type Permission =
  // User Management Permissions
  | "users_view_directory"
  | "users_view_profiles"
  | "users_create"
  | "users_invite"
  | "users_edit"
  | "users_assign_roles"
  | "users_suspend"
  | "users_delete"
  | "users_reset_passwords"
  | "users_view_activity_logs"
  | "users_manage_permissions"

  // Deployment Management Permissions
  | "deployments_view"
  | "deployments_create"
  | "deployments_edit"
  | "deployments_delete"
  | "deployments_approve"
  | "deployments_assign_workers"
  | "deployments_view_history"
  | "deployments_cancel"
  | "deployments_modify_schedule"

  // Form Management Permissions
  | "forms_view"
  | "forms_create_templates"
  | "forms_edit_templates"
  | "forms_delete_templates"
  | "forms_assign"
  | "forms_publish"
  | "forms_unpublish"
  | "forms_view_submissions"
  | "forms_export_data"

  // Form Type Access Permissions
  | "form_damage_assessment"
  | "form_supply_verification"
  | "form_shelter_survey"
  | "form_medical_intake"
  | "form_water_quality"
  | "form_infrastructure_assessment"
  | "form_emergency_contact"
  | "form_resource_request"
  | "form_people_needs"

  // Dashboard & Maps Permissions
  | "dashboard_view"
  | "maps_view_interactive"
  | "maps_view_all_locations"
  | "maps_view_asset_locations"
  | "maps_view_people_needs"
  | "maps_view_aid_worker_locations"
  | "dashboard_configure_widgets"
  | "dashboard_create_custom_views"
  | "maps_export_data"

  // Assets Portal Permissions
  | "assets_view"
  | "assets_create"
  | "assets_edit"
  | "assets_delete"
  | "assets_assign"
  | "assets_track_distribution"
  | "assets_view_inventory"
  | "assets_export_data"
  | "assets_view_heat_maps"
  | "assets_manage_categories"

  // Places Portal Permissions
  | "places_view"
  | "places_create"
  | "places_edit"
  | "places_delete"
  | "places_update_facility_status"
  | "places_update_utility_status"
  | "places_report_infrastructure_damage"
  | "places_update_shelter_capacity"
  | "places_export_data"

  // People Portal Permissions
  | "people_view_needs"
  | "people_create_needs_reports"
  | "people_edit_needs_reports"
  | "people_delete_needs_reports"
  | "people_view_contact_information"
  | "people_update_needs_status"
  | "people_assign_priority_levels"
  | "people_export_data"
  | "people_view_medical_needs"

  // Aid Workers Portal Permissions
  | "aid_workers_view_all"
  | "aid_workers_view_own_profile"
  | "aid_workers_create_profiles"
  | "aid_workers_edit_profiles"
  | "aid_workers_delete_profiles"
  | "aid_workers_manage_schedules"
  | "aid_workers_view_own_schedule"
  | "aid_workers_update_own_availability"
  | "aid_workers_track_capabilities"
  | "aid_workers_coordinate_deployments"

  // Relief Portal Permissions
  | "relief_view_operations"
  | "relief_create_requests"
  | "relief_approve_requests"
  | "relief_distribute_items"
  | "relief_track_distribution"
  | "relief_manage_inventory"
  | "relief_export_data"

  // Community Feed Permissions
  | "community_view_posts"
  | "community_submit_reports"
  | "community_edit_own_posts"
  | "community_delete_own_posts"
  | "community_moderate_posts"
  | "community_delete_any_posts"
  | "community_flag_inappropriate_content"
  | "community_pin_important_posts"

  // Storm Tracking Permissions
  | "storm_view_data"
  | "storm_update_information"
  | "storm_create_alerts"
  | "storm_publish_warnings"
  | "storm_view_historical_data"
  | "storm_export_data"

  // Emergency Contacts Permissions
  | "emergency_contacts_view"
  | "emergency_contacts_add"
  | "emergency_contacts_edit"
  | "emergency_contacts_delete"
  | "emergency_contacts_call"
  | "emergency_contacts_export_list"

  // Insights & Analytics Permissions
  | "insights_view_dashboards"
  | "insights_view_reports"
  | "insights_create_custom_reports"
  | "insights_export_data"
  | "insights_generate_analytics"
  | "insights_view_trends"
  | "insights_access_raw_data"
  | "insights_create_data_visualizations"

  // System Configuration Permissions
  | "system_access_settings"
  | "system_configure_api_keys"
  | "system_manage_integrations"
  | "system_set_data_retention_policies"
  | "system_configure_backup_settings"
  | "system_manage_security_settings"
  | "system_view_logs"
  | "system_configure_authentication"
  | "system_lockdown"
  | "system_emergency_override"

  // Role Management Permissions
  | "roles_view_all"
  | "roles_create_custom"
  | "roles_edit_permissions"
  | "roles_delete"
  | "roles_assign_form_access"
  | "roles_configure_restrictions"
  | "roles_view_hierarchy"

  // Sensitive Data Access Permissions
  | "sensitive_data_personal_contact"
  | "sensitive_data_medical"
  | "sensitive_data_gps_precise"
  | "sensitive_data_financial"
  | "sensitive_data_government_ids"
  | "sensitive_data_vulnerability_assessments"
  | "sensitive_data_security_locations"

  // Data Export Permissions
  | "export_all_data"
  | "export_form_submissions"
  | "export_analytics_reports"
  | "export_user_data"
  | "export_map_data"
  | "export_asset_records"
  | "export_bulk_data"
  | "export_scheduled"

  // Audit & Logging Permissions
  | "audit_view_logs"
  | "audit_view_own_activity"
  | "audit_export_logs"
  | "audit_track_data_access"
  | "audit_monitor_user_sessions"
  | "audit_view_security_alerts"

  // Communication Permissions
  | "comm_send_system_messages"
  | "comm_send_alerts"
  | "comm_send_direct_messages"
  | "comm_create_broadcast_messages"
  | "comm_access_emergency_broadcast"
  | "comm_view_message_history";

/**
 * Role-to-Permission mapping based on RBAC matrix
 * Each role gets specific permissions as defined in the permissions matrix
 */
export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // Admin has ALL permissions - complete system access
    "users_view_directory",
    "users_view_profiles",
    "users_create",
    "users_invite",
    "users_edit",
    "users_assign_roles",
    "users_suspend",
    "users_delete",
    "users_reset_passwords",
    "users_view_activity_logs",
    "users_manage_permissions",
    "deployments_view",
    "deployments_create",
    "deployments_edit",
    "deployments_delete",
    "deployments_approve",
    "deployments_assign_workers",
    "deployments_view_history",
    "deployments_cancel",
    "deployments_modify_schedule",
    "forms_view",
    "forms_create_templates",
    "forms_edit_templates",
    "forms_delete_templates",
    "forms_assign",
    "forms_publish",
    "forms_unpublish",
    "forms_view_submissions",
    "forms_export_data",
    "form_damage_assessment",
    "form_supply_verification",
    "form_shelter_survey",
    "form_medical_intake",
    "form_water_quality",
    "form_infrastructure_assessment",
    "form_emergency_contact",
    "form_resource_request",
    "form_people_needs",
    "dashboard_view",
    "maps_view_interactive",
    "maps_view_all_locations",
    "maps_view_asset_locations",
    "maps_view_people_needs",
    "maps_view_aid_worker_locations",
    "dashboard_configure_widgets",
    "dashboard_create_custom_views",
    "maps_export_data",
    "assets_view",
    "assets_create",
    "assets_edit",
    "assets_delete",
    "assets_assign",
    "assets_track_distribution",
    "assets_view_inventory",
    "assets_export_data",
    "assets_view_heat_maps",
    "assets_manage_categories",
    "places_view",
    "places_create",
    "places_edit",
    "places_delete",
    "places_update_facility_status",
    "places_update_utility_status",
    "places_report_infrastructure_damage",
    "places_update_shelter_capacity",
    "places_export_data",
    "people_view_needs",
    "people_create_needs_reports",
    "people_edit_needs_reports",
    "people_delete_needs_reports",
    "people_view_contact_information",
    "people_update_needs_status",
    "people_assign_priority_levels",
    "people_export_data",
    "people_view_medical_needs",
    "aid_workers_view_all",
    "aid_workers_view_own_profile",
    "aid_workers_create_profiles",
    "aid_workers_edit_profiles",
    "aid_workers_delete_profiles",
    "aid_workers_manage_schedules",
    "aid_workers_view_own_schedule",
    "aid_workers_update_own_availability",
    "aid_workers_track_capabilities",
    "aid_workers_coordinate_deployments",
    "relief_view_operations",
    "relief_create_requests",
    "relief_approve_requests",
    "relief_distribute_items",
    "relief_track_distribution",
    "relief_manage_inventory",
    "relief_export_data",
    "community_view_posts",
    "community_submit_reports",
    "community_edit_own_posts",
    "community_delete_own_posts",
    "community_moderate_posts",
    "community_delete_any_posts",
    "community_flag_inappropriate_content",
    "community_pin_important_posts",
    "storm_view_data",
    "storm_update_information",
    "storm_create_alerts",
    "storm_publish_warnings",
    "storm_view_historical_data",
    "storm_export_data",
    "emergency_contacts_view",
    "emergency_contacts_add",
    "emergency_contacts_edit",
    "emergency_contacts_delete",
    "emergency_contacts_call",
    "emergency_contacts_export_list",
    "insights_view_dashboards",
    "insights_view_reports",
    "insights_create_custom_reports",
    "insights_export_data",
    "insights_generate_analytics",
    "insights_view_trends",
    "insights_access_raw_data",
    "insights_create_data_visualizations",
    "system_access_settings",
    "system_configure_api_keys",
    "system_manage_integrations",
    "system_set_data_retention_policies",
    "system_configure_backup_settings",
    "system_manage_security_settings",
    "system_view_logs",
    "system_configure_authentication",
    "system_lockdown",
    "system_emergency_override",
    "roles_view_all",
    "roles_create_custom",
    "roles_edit_permissions",
    "roles_delete",
    "roles_assign_form_access",
    "roles_configure_restrictions",
    "roles_view_hierarchy",
    "sensitive_data_personal_contact",
    "sensitive_data_medical",
    "sensitive_data_gps_precise",
    "sensitive_data_financial",
    "sensitive_data_government_ids",
    "sensitive_data_vulnerability_assessments",
    "sensitive_data_security_locations",
    "export_all_data",
    "export_form_submissions",
    "export_analytics_reports",
    "export_user_data",
    "export_map_data",
    "export_asset_records",
    "export_bulk_data",
    "export_scheduled",
    "audit_view_logs",
    "audit_view_own_activity",
    "audit_export_logs",
    "audit_track_data_access",
    "audit_monitor_user_sessions",
    "audit_view_security_alerts",
    "comm_send_system_messages",
    "comm_send_alerts",
    "comm_send_direct_messages",
    "comm_create_broadcast_messages",
    "comm_access_emergency_broadcast",
    "comm_view_message_history",
  ],

  ops: [
    // Operations Lead permissions - manages deployments and coordinates operations
    "users_view_directory",
    "users_view_profiles",
    "deployments_view",
    "deployments_create",
    "deployments_edit",
    "deployments_delete",
    "deployments_approve",
    "deployments_assign_workers",
    "deployments_view_history",
    "deployments_cancel",
    "deployments_modify_schedule",
    "forms_view",
    "forms_assign",
    "forms_view_submissions",
    "form_damage_assessment",
    "form_supply_verification",
    "form_infrastructure_assessment",
    "form_emergency_contact",
    "form_resource_request",
    "form_people_needs",
    "dashboard_view",
    "maps_view_interactive",
    "maps_view_all_locations",
    "maps_view_asset_locations",
    "maps_view_people_needs",
    "maps_view_aid_worker_locations",
    "dashboard_configure_widgets",
    "dashboard_create_custom_views",
    "assets_view",
    "assets_create",
    "assets_edit",
    "assets_assign",
    "assets_track_distribution",
    "assets_view_inventory",
    "assets_view_heat_maps",
    "places_view",
    "places_create",
    "places_edit",
    "places_update_facility_status",
    "places_update_utility_status",
    "places_report_infrastructure_damage",
    "places_update_shelter_capacity",
    "people_view_needs",
    "people_create_needs_reports",
    "people_edit_needs_reports",
    "people_view_contact_information",
    "people_update_needs_status",
    "people_assign_priority_levels",
    "people_view_medical_needs",
    "aid_workers_view_all",
    "aid_workers_view_own_profile",
    "aid_workers_create_profiles",
    "aid_workers_edit_profiles",
    "aid_workers_manage_schedules",
    "aid_workers_view_own_schedule",
    "aid_workers_update_own_availability",
    "aid_workers_track_capabilities",
    "aid_workers_coordinate_deployments",
    "relief_view_operations",
    "relief_create_requests",
    "relief_approve_requests",
    "relief_distribute_items",
    "relief_track_distribution",
    "relief_manage_inventory",
    "community_view_posts",
    "community_submit_reports",
    "community_edit_own_posts",
    "community_delete_own_posts",
    "community_moderate_posts",
    "community_delete_any_posts",
    "community_flag_inappropriate_content",
    "community_pin_important_posts",
    "storm_view_data",
    "storm_update_information",
    "storm_create_alerts",
    "storm_publish_warnings",
    "storm_view_historical_data",
    "emergency_contacts_view",
    "emergency_contacts_add",
    "emergency_contacts_edit",
    "emergency_contacts_call",
    // "insights_view_dashboards",
    // "insights_view_reports",
    // "insights_view_trends",
    "roles_view_all",
    "roles_view_hierarchy",
    "sensitive_data_personal_contact",
    "sensitive_data_medical",
    "sensitive_data_gps_precise",
    "sensitive_data_vulnerability_assessments",
    "sensitive_data_security_locations",
    "audit_view_own_activity",
    "comm_send_system_messages",
    "comm_send_alerts",
    "comm_send_direct_messages",
    "comm_create_broadcast_messages",
    "comm_access_emergency_broadcast",
    "comm_view_message_history",
  ],

  field: [
    // Field Reporter permissions - front-line data capture and updates
    "deployments_view",
    "deployments_view_history",
    "forms_view",
    // "forms_assign",
    // "forms_view_submissions",
    "form_damage_assessment",
    "form_medical_intake",
    "form_infrastructure_assessment",
    "form_emergency_contact",
    "form_resource_request",
    "form_people_needs",
    "dashboard_view",
    "maps_view_interactive",
    "maps_view_all_locations",
    "maps_view_asset_locations",
    "maps_view_people_needs",
    "maps_view_aid_worker_locations",
    "assets_view",
    "assets_create",
    "assets_edit",
    "assets_track_distribution",
    "assets_view_inventory",
    "assets_view_heat_maps",
    "places_view",
    "places_create",
    "places_edit",
    "places_update_facility_status",
    "places_update_utility_status",
    "places_report_infrastructure_damage",
    "places_update_shelter_capacity",
    "people_view_needs",
    "people_create_needs_reports",
    "people_edit_needs_reports",
    "people_update_needs_status",
    "people_view_medical_needs",
    "aid_workers_view_all",
    "aid_workers_view_own_profile",
    "aid_workers_view_own_schedule",
    "aid_workers_update_own_availability",
    "relief_view_operations",
    "relief_create_requests",
    "relief_track_distribution",
    "community_view_posts",
    "community_submit_reports",
    "community_edit_own_posts",
    "community_delete_own_posts",
    "community_flag_inappropriate_content",
    "storm_view_data",
    "storm_view_historical_data",
    "emergency_contacts_view",
    "emergency_contacts_call",
    // "insights_view_dashboards",
    // "insights_view_reports",
    // "insights_view_trends",
    "sensitive_data_gps_precise",
    "audit_view_own_activity",
    "comm_send_direct_messages",
    "comm_view_message_history",
  ],

  analyst: [
    // Insights Analyst permissions - data analysis and reporting focus
    "users_view_directory",
    "users_view_profiles",
    "deployments_view",
    "deployments_view_history",
    // "forms_view",
    // "forms_view_submissions",
    // "forms_export_data",
    // "form_damage_assessment",
    // "form_water_quality",
    // "form_infrastructure_assessment",
    // "form_resource_request",
    // "form_people_needs",
    "dashboard_view",
    "maps_view_interactive",
    "maps_view_all_locations",
    "maps_view_asset_locations",
    "maps_view_people_needs",
    "maps_view_aid_worker_locations",
    "dashboard_configure_widgets",
    "dashboard_create_custom_views",
    "maps_export_data",
    "assets_view",
    "assets_track_distribution",
    "assets_view_inventory",
    "assets_export_data",
    "assets_view_heat_maps",
    "places_view",
    "places_export_data",
    "people_view_needs",
    "people_export_data",
    "aid_workers_view_all",
    "aid_workers_view_own_profile",
    "aid_workers_view_own_schedule",
    "aid_workers_update_own_availability",
    "relief_view_operations",
    "relief_track_distribution",
    "relief_export_data",
    "community_view_posts",
    "community_flag_inappropriate_content",
    "storm_view_data",
    "storm_view_historical_data",
    "storm_export_data",
    "emergency_contacts_view",
    "emergency_contacts_export_list",
    "insights_view_dashboards",
    "insights_view_reports",
    "insights_create_custom_reports",
    "insights_export_data",
    "insights_generate_analytics",
    "insights_view_trends",
    "insights_access_raw_data",
    "insights_create_data_visualizations",
    "roles_view_all",
    "roles_view_hierarchy",
    "sensitive_data_gps_precise",
    "sensitive_data_vulnerability_assessments",
    "export_form_submissions",
    "export_analytics_reports",
    "export_map_data",
    "export_asset_records",
    "export_bulk_data",
    "export_scheduled",
    "audit_view_own_activity",
    "comm_send_direct_messages",
  ],

  needs: [
    // Needs role - limited access for community reporting
    "forms_view",
    "form_people_needs",
    // "people_create_needs_reports",
    // "people_edit_needs_reports",
    // "people_update_needs_status",
    // "aid_workers_view_own_profile",
    // "aid_workers_view_own_schedule",
    // "aid_workers_update_own_availability",
    // "community_view_posts",
    // "community_submit_reports",
    // "community_edit_own_posts",
    // "community_delete_own_posts",
    // "community_flag_inappropriate_content",
    // "storm_view_data",
    // "storm_view_historical_data",
    // "emergency_contacts_view",
    // "emergency_contacts_call",
    // "audit_view_own_activity",
    // "comm_send_direct_messages",
  ],
};

/**
 * Get all permissions for a given role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

/**
 * Check if a role has any of the specified permissions (OR logic)
 */
export function roleHasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  const rolePerms = rolePermissions[role] || [];
  return permissions.some((permission) => rolePerms.includes(permission));
}

/**
 * Check if a role has all of the specified permissions (AND logic)
 */
export function roleHasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  const rolePerms = rolePermissions[role] || [];
  return permissions.every((permission) => rolePerms.includes(permission));
}

/**
 * Permission flags mapping for database compatibility
 */
export const rolePermissionFlags: Record<
  UserRole,
  {
    canViewSensitiveData: boolean;
    canExportData: boolean;
    canManageUsers: boolean;
    canCreateDeployments: boolean;
    canAssignForms: boolean;
    canApproveRequests: boolean;
    canAccessAdmin: boolean;
    canSubmitPeopleNeeds: boolean;
  }
> = {
  admin: {
    canViewSensitiveData: true,
    canExportData: true,
    canManageUsers: true,
    canCreateDeployments: true,
    canAssignForms: true,
    canApproveRequests: true,
    canAccessAdmin: true,
    canSubmitPeopleNeeds: true,
  },
  ops: {
    canViewSensitiveData: true,
    canExportData: false,
    canManageUsers: false,
    canCreateDeployments: true,
    canAssignForms: true,
    canApproveRequests: true,
    canAccessAdmin: false,
    canSubmitPeopleNeeds: true,
  },
  field: {
    canViewSensitiveData: false,
    canExportData: false,
    canManageUsers: false,
    canCreateDeployments: false,
    canAssignForms: true,
    canApproveRequests: false,
    canAccessAdmin: false,
    canSubmitPeopleNeeds: true,
  },
  analyst: {
    canViewSensitiveData: false,
    canExportData: true,
    canManageUsers: false,
    canCreateDeployments: false,
    canAssignForms: false,
    canApproveRequests: false,
    canAccessAdmin: false,
    canSubmitPeopleNeeds: false,
  },
  needs: {
    canViewSensitiveData: false,
    canExportData: false,
    canManageUsers: false,
    canCreateDeployments: false,
    canAssignForms: false,
    canApproveRequests: false,
    canAccessAdmin: false,
    canSubmitPeopleNeeds: true,
  },
};

/**
 * Get permission flags for a role
 */
export function getPermissionFlagsForRole(role: UserRole) {
  return rolePermissionFlags[role];
}

/**
 * Permission categories for organization
 */
export const permissionCategories = {
  users: "User Management",
  deployments: "Deployment Management",
  forms: "Form Management",
  form: "Form Type Access",
  dashboard: "Dashboard & Maps",
  maps: "Maps & Visualization",
  assets: "Assets Portal",
  places: "Places Portal",
  people: "People Portal",
  aid_workers: "Aid Workers Portal",
  relief: "Relief Portal",
  community: "Community Feed",
  storm: "Storm Tracking",
  emergency_contacts: "Emergency Contacts",
  insights: "Insights & Analytics",
  system: "System Configuration",
  roles: "Role Management",
  sensitive_data: "Sensitive Data Access",
  export: "Data Export",
  audit: "Audit & Logging",
  comm: "Communication",
} as const;

/**
 * Get category for a permission
 */
export function getPermissionCategory(permission: Permission): string {
  const category = permission.split("_")[0];
  return (
    permissionCategories[category as keyof typeof permissionCategories] ||
    "Other"
  );
}

/**
 * Validate if a role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return ["admin", "ops", "field", "analyst", "needs"].includes(role);
}

/**
 * Represents a user with additional role and permissions.
 */
export type UserWithRole = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  phoneNumber?: string | null;
  imageUrl?: string | null;
  role: UserRole;
  organization?: string | null;
  department?: string | null;
  canCreateDeployments?: boolean;
  canAssignForms?: boolean;
  canApproveRequests?: boolean;
  canAccessAdmin?: boolean;
  canSubmitPeopleNeeds?: boolean;
  canViewSensitiveData?: boolean;
  canExportData?: boolean;
  canManageUsers?: boolean;
  lastActiveAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  username?: string | null;
  permissions: Permission[];
};
