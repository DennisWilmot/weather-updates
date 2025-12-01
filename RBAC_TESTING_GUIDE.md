# 🔐 RBAC Testing Guide - See Your Permission System in Action!

## 🚀 Quick Start

### 1. **Access the Demo Page**
Navigate to: `http://localhost:3000/rbac-demo`

### 2. **Test Different User Roles**
You'll need users in your `appUsers` Supabase table with different roles to see the full RBAC system in action.

## 📋 Required Database Setup

### Add Test Users to Your `appUsers` Table

```sql
-- Insert test users with different roles
INSERT INTO "users" (email, role, "canViewSensitiveData", "canExportData", "canManageUsers", "fullName") VALUES
('admin@test.com', 'admin', true, true, true, 'Admin User'),
('ops@test.com', 'ops', true, false, false, 'Operations Lead'),
('field@test.com', 'field', false, false, false, 'Field Reporter'),
('analyst@test.com', 'analyst', false, true, false, 'Data Analyst'),
('needs@test.com', 'needs', false, false, false, 'Community Reporter');
```

## 🎯 What You'll See in the Demo

### **1. Role-Based UI Components**
- **Admin Panel** - Only visible to admins
- **Operations Center** - Visible to admins and ops leads
- **Permission-based buttons** - Different actions based on your role
- **Form access list** - Shows which forms you can access

### **2. Interactive Testing**
- **Server Actions** - Test permission-protected server functions
- **API Endpoints** - Test different HTTP methods with permission requirements
- **Real-time results** - See success/failure responses with detailed error messages

### **3. Permission Visualization**
- **Permission flags** - Visual indicators of your capabilities
- **Complete permission list** - All 150+ permissions for your role
- **User info display** - Current role and user details

## 🔍 Testing Scenarios

### **As Admin User (`admin@test.com`)**
✅ **You should see:**
- Full access to all features
- Red admin panel
- All permission flags enabled
- All interactive tests pass
- 150+ permissions listed

### **As Operations Lead (`ops@test.com`)**
✅ **You should see:**
- Operations center access
- Deployment creation buttons
- Most permission flags enabled (except some admin-only)
- Most interactive tests pass (except admin-only)
- ~100+ permissions listed

### **As Field Reporter (`field@test.com`)**
✅ **You should see:**
- Limited dashboard access
- Form submission capabilities
- Basic permission flags
- Some interactive tests fail (permission denied)
- ~50+ permissions listed

### **As Analyst (`analyst@test.com`)**
✅ **You should see:**
- Data export capabilities
- Analytics dashboard access
- Export-related permission flags
- Data export tests pass, others may fail
- ~60+ permissions listed

### **As Needs Reporter (`needs@test.com`)**
✅ **You should see:**
- Very limited access
- Only people needs form access
- Minimal permission flags
- Most interactive tests fail
- ~10 permissions listed

## 🧪 Interactive Tests Explained

### **Server Actions**
1. **Get My Permissions** - Always works, shows your current permissions
2. **Create Deployment** - Requires `deployments_create` permission
3. **Invite User** - Requires `users_invite` permission  
4. **Export Data** - Requires export permissions
5. **Update System Config** - Requires admin role

### **API Endpoints**
1. **GET /api/rbac-test** - Basic authentication only
2. **POST /api/rbac-test** - Requires `deployments_create` permission
3. **PUT /api/rbac-test** - Requires admin role
4. **GET /api/auth/user** - Gets your user data

## 🎨 Visual Indicators

### **Permission Status**
- ✅ **Green** - You have permission
- ❌ **Red** - Permission denied
- 🔒 **Gray** - Feature not available

### **Test Results**
- ✅ **Success** - Action completed successfully
- ❌ **Failed** - Permission denied or error
- ⏳ **Loading** - Test in progress

## 🔧 How to Add the Navigation

Add the RBAC navigation to your layout:

```tsx
// In your layout.tsx or page component
import RBACNavigation from '../components/RBACNavigation';

export default function Layout({ children }) {
  return (
    <div>
      <RBACNavigation />
      {children}
    </div>
  );
}
```

## 📱 Real-World Usage Examples

### **In Your Components**
```tsx
import { usePermission, PermissionGate } from '../hooks/usePermissions';

function MyComponent() {
  const { hasPermission } = usePermission('users_create');
  
  return (
    <div>
      {hasPermission && (
        <button>Create User</button>
      )}
      
      <PermissionGate permission="dashboard_view">
        <Dashboard />
      </PermissionGate>
    </div>
  );
}
```

### **In Your API Routes**
```tsx
import { assertPermission } from '../lib/middleware';

export async function POST(request: Request) {
  const user = await assertPermission(request, 'deployments_create');
  // User has permission, proceed with logic
}
```

### **In Your Server Actions**
```tsx
'use server';
import { assertPermission } from '../lib/actions';

export async function createUser(userData) {
  const user = await assertPermission('users_create');
  // User has permission, proceed with user creation
}
```

## 🐛 Troubleshooting

### **"User not found in application database"**
- Make sure your user exists in the `appUsers` table
- Check that the email matches exactly

### **"Invalid user role"**
- Ensure the role is one of: `admin`, `ops`, `field`, `analyst`, `needs`
- Check for typos in the role field

### **Permission tests always fail**
- Verify your user has the correct role in the database
- Check that the role permissions are properly mapped

### **Components not showing**
- Make sure you're authenticated (signed in)
- Check browser console for any JavaScript errors

## 🎉 Success! 

If everything is working correctly, you should see:
1. **Different UI elements** based on your role
2. **Permission-based navigation** items
3. **Interactive tests** that pass/fail based on your permissions
4. **Real-time permission checking** in both client and server components

The RBAC system is now fully functional and protecting your application! 🔐✨
