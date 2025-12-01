/**
 * RBAC Demo Server Actions
 * Shows how to protect server actions with permissions
 */

'use server';

import { 
  assertPermission, 
  assertRole, 
  getCurrentUser,
  checkPermission 
} from '../../lib/actions';

/**
 * Create a deployment (requires deployments_create permission)
 */
export async function createDeployment(formData: FormData) {
  try {
    const user = await assertPermission('deployments_create');
    
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    
    // Simulate deployment creation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: `Deployment "${name}" created successfully at ${location}`,
      createdBy: user.email,
      role: user.role
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Invite a user (requires users_invite permission)
 */
export async function inviteUser(email: string, role: string) {
  try {
    const user = await assertPermission('users_invite');
    
    // Additional validation for admin role assignment
    if (role === 'admin' && user.role !== 'admin') {
      throw new Error('Only admins can invite other admins');
    }
    
    // Simulate user invitation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: `Invitation sent to ${email} with role ${role}`,
      invitedBy: user.email
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Export data (requires export permissions)
 */
export async function exportData(dataType: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }
    
    // Check different export permissions based on data type
    let hasPermission = false;
    let requiredPermission = '';
    
    switch (dataType) {
      case 'forms':
        hasPermission = await checkPermission('export_form_submissions');
        requiredPermission = 'export_form_submissions';
        break;
      case 'analytics':
        hasPermission = await checkPermission('export_analytics_reports');
        requiredPermission = 'export_analytics_reports';
        break;
      case 'all':
        hasPermission = await checkPermission('export_all_data');
        requiredPermission = 'export_all_data';
        break;
      default:
        throw new Error('Invalid data type');
    }
    
    if (!hasPermission) {
      throw new Error(`Permission required: ${requiredPermission}`);
    }
    
    // Simulate data export
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      message: `${dataType} data exported successfully`,
      exportUrl: `/downloads/export-${Date.now()}.csv`,
      exportedBy: user.email
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Admin-only system configuration
 */
export async function updateSystemConfig(config: Record<string, any>) {
  try {
    const user = await assertRole('admin');
    
    // Simulate system configuration update
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      message: 'System configuration updated successfully',
      config,
      updatedBy: user.email
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get user permissions summary
 */
export async function getUserPermissionsSummary() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }
    
    return {
      success: true,
      user: {
        email: user.email,
        role: user.role,
        flags: {
          canViewSensitiveData: user.canViewSensitiveData,
          canExportData: user.canExportData,
          canManageUsers: user.canManageUsers,
          canCreateDeployments: user.canCreateDeployments,
          canAssignForms: user.canAssignForms,
          canApproveRequests: user.canApproveRequests,
          canAccessAdmin: user.canAccessAdmin,
          canSubmitPeopleNeeds: user.canSubmitPeopleNeeds,
        }
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
