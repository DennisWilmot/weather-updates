/**
 * Interactive RBAC Demo Component
 * Tests server actions and API endpoints with different permissions
 */

'use client';

import { useState } from 'react';
import { usePermission } from '../hooks/usePermissions';
import { 
  createDeployment, 
  inviteUser, 
  exportData, 
  updateSystemConfig,
  getUserPermissionsSummary
} from '../app/actions/rbac-demo-actions';

export default function RBACInteractiveDemo() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const { hasPermission: canCreateDeployments } = usePermission('deployments_create');
  const { hasPermission: canInviteUsers } = usePermission('users_invite');
  const { hasPermission: canExportData } = usePermission(['export_all_data', 'export_form_submissions', 'export_analytics_reports'], false);
  const { hasPermission: isAdmin } = usePermission('system_access_settings');

  const handleAction = async (actionName: string, actionFn: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [actionName]: true }));
    try {
      const result = await actionFn();
      setResults(prev => ({ ...prev, [actionName]: result }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [actionName]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [actionName]: false }));
    }
  };

  const testAPIEndpoint = async (method: string, endpoint: string, data?: any) => {
    const actionName = `api_${method.toLowerCase()}_${endpoint}`;
    setLoading(prev => ({ ...prev, [actionName]: true }));
    
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(data && { body: JSON.stringify(data) })
      });
      
      const result = await response.json();
      setResults(prev => ({ 
        ...prev, 
        [actionName]: { 
          success: response.ok, 
          status: response.status,
          ...result 
        } 
      }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [actionName]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Network error' 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [actionName]: false }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Interactive RBAC Testing</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Server Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Server Actions</h3>
          <div className="space-y-4">
            
            {/* Get Permissions Summary */}
            <TestButton
              title="Get My Permissions"
              description="Always allowed - shows your current permissions"
              available={true}
              loading={loading.permissions}
              result={results.permissions}
              onClick={() => handleAction('permissions', getUserPermissionsSummary)}
            />

            {/* Create Deployment */}
            <TestButton
              title="Create Deployment"
              description="Requires: deployments_create permission"
              available={canCreateDeployments}
              loading={loading.deployment}
              result={results.deployment}
              onClick={() => handleAction('deployment', async () => {
                const formData = new FormData();
                formData.append('name', 'Test Deployment');
                formData.append('location', 'Test Location');
                return createDeployment(formData);
              })}
            />

            {/* Invite User */}
            <TestButton
              title="Invite User"
              description="Requires: users_invite permission"
              available={canInviteUsers}
              loading={loading.invite}
              result={results.invite}
              onClick={() => handleAction('invite', () => 
                inviteUser('test@example.com', 'field')
              )}
            />

            {/* Export Data */}
            <TestButton
              title="Export Data"
              description="Requires: export permissions"
              available={canExportData}
              loading={loading.export}
              result={results.export}
              onClick={() => handleAction('export', () => 
                exportData('forms')
              )}
            />

            {/* Admin Config */}
            <TestButton
              title="Update System Config"
              description="Requires: admin role"
              available={isAdmin}
              loading={loading.config}
              result={results.config}
              onClick={() => handleAction('config', () => 
                updateSystemConfig({ setting1: 'value1', setting2: 'value2' })
              )}
            />
          </div>
        </div>

        {/* API Endpoints */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">API Endpoints</h3>
          <div className="space-y-4">
            
            {/* GET - Basic Auth */}
            <TestButton
              title="GET /api/rbac-test"
              description="Basic authentication required"
              available={true}
              loading={loading.api_get_rbac_test}
              result={results.api_get_rbac_test}
              onClick={() => testAPIEndpoint('GET', 'rbac-test')}
            />

            {/* POST - Permission Required */}
            <TestButton
              title="POST /api/rbac-test"
              description="Requires: deployments_create permission"
              available={canCreateDeployments}
              loading={loading.api_post_rbac_test}
              result={results.api_post_rbac_test}
              onClick={() => testAPIEndpoint('POST', 'rbac-test', { 
                name: 'Test Deployment',
                type: 'emergency'
              })}
            />

            {/* PUT - Admin Role Required */}
            <TestButton
              title="PUT /api/rbac-test"
              description="Requires: admin role"
              available={isAdmin}
              loading={loading.api_put_rbac_test}
              result={results.api_put_rbac_test}
              onClick={() => testAPIEndpoint('PUT', 'rbac-test', { 
                config: 'admin-setting',
                value: 'test-value'
              })}
            />

            {/* User Data API */}
            <TestButton
              title="GET /api/auth/user"
              description="Get current user data"
              available={true}
              loading={loading.api_get_auth_user}
              result={results.api_get_auth_user}
              onClick={() => testAPIEndpoint('GET', 'auth/user')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TestButton({ 
  title, 
  description, 
  available, 
  loading, 
  result, 
  onClick 
}: {
  title: string;
  description: string;
  available: boolean;
  loading: boolean;
  result?: any;
  onClick: () => void;
}) {
  return (
    <div className={`border rounded-lg p-4 ${available ? 'border-gray-200' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className={`font-medium ${available ? 'text-gray-900' : 'text-red-800'}`}>
            {title}
          </h4>
          <p className={`text-sm ${available ? 'text-gray-600' : 'text-red-600'}`}>
            {description}
          </p>
        </div>
        <div className="flex items-center">
          {available ? (
            <span className="text-green-500 text-sm">✅</span>
          ) : (
            <span className="text-red-500 text-sm">❌</span>
          )}
        </div>
      </div>
      
      <button
        onClick={onClick}
        disabled={!available || loading}
        className={`w-full py-2 px-4 rounded text-sm font-medium ${
          available 
            ? 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-blue-300' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? 'Testing...' : 'Test'}
      </button>
      
      {result && (
        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
          <div className={`font-medium mb-1 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
            {result.success ? '✅ Success' : '❌ Failed'}
            {result.status && ` (${result.status})`}
          </div>
          {result.message && (
            <div className="text-gray-700 mb-2">{result.message}</div>
          )}
          {result.error && (
            <div className="text-red-600 mb-2">{result.error}</div>
          )}
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500">View Details</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
