# Role-Based Access Control (RBAC) Documentation
## Weather Updates System

### Table of Contents
1. [System Overview](#system-overview)
2. [User Roles](#user-roles)
3. [Permission Categories](#permission-categories)
4. [Feature Access Matrix](#feature-access-matrix)
5. [Portal Access Control](#portal-access-control)
6. [Administrative Functions](#administrative-functions)
7. [Authentication & Authorization](#authentication--authorization)
8. [Implementation Details](#implementation-details)

---

## System Overview

The Weather Updates System is a comprehensive emergency management platform for Jamaica that provides real-time weather tracking, community reporting, and resource coordination during natural disasters. The system implements a robust RBAC model to ensure appropriate access to sensitive information and critical functions.

### Key System Features
- **Interactive Map Dashboard** - Real-time visualization of weather data, assets, people needs, and aid worker locations
- **Community Reporting** - Public submission system for status updates and emergency needs
- **Resource Management** - Asset distribution tracking and availability monitoring
- **Emergency Coordination** - Aid worker scheduling and deployment management
- **Administrative Panel** - User management, role assignment, and system configuration
- **Data Analytics** - Insights, reporting, and data export capabilities

---

## User Roles

### 1. **Admin** (System Administrator)
**Description**: Full system access with complete administrative privileges
- **Primary Responsibilities**: System configuration, user management, security oversight
- **Access Level**: Unrestricted access to all system features and data
- **Key Characteristics**: 
  - Can manage all users and roles
  - Access to sensitive data and system logs
  - Can configure system-wide settings
  - Emergency override capabilities

### 2. **Operations Lead** (ops)
**Description**: Manages field deployments and coordinates response operations
- **Primary Responsibilities**: Field deployment coordination, responder assignment, operational oversight
- **Access Level**: Full operational access with limited administrative functions
- **Key Characteristics**:
  - Can create and manage deployments
  - Assign forms and tasks to field workers
  - View user directory (limited)
  - Access to operational insights

### 3. **Field Reporter** (field)
**Description**: Front-line personnel capturing real-time data and status updates
- **Primary Responsibilities**: On-site data collection, status reporting, needs assessment
- **Access Level**: Limited to data entry and viewing assigned tasks
- **Key Characteristics**:
  - Can submit various assessment forms
  - View deployment information
  - Limited access to insights
  - No user management capabilities

### 4. **Insights Analyst** (analyst)
**Description**: Data analysis specialist focused on reporting and trend analysis
- **Primary Responsibilities**: Data analysis, report generation, trend monitoring
- **Access Level**: Read-only access with export capabilities
- **Key Characteristics**:
  - Can view all data for analysis
  - Export data and generate reports
  - No data entry or user management
  - Focus on insights and analytics

### 5. **Coordinator** (coordinator)
**Description**: Mid-level management role for regional coordination
- **Primary Responsibilities**: Regional oversight, resource coordination, local management
- **Access Level**: Regional administrative access with sensitive data viewing
- **Key Characteristics**:
  - Can manage submissions in their region
  - Access to sensitive contact information
  - Limited user management capabilities
  - Regional deployment authority

### 6. **Responder** (responder)
**Description**: First responders and emergency personnel
- **Primary Responsibilities**: Emergency response, public safety, immediate assistance
- **Access Level**: Field access with contact information privileges
- **Key Characteristics**:
  - Can submit emergency updates
  - Access to requester contact information
  - View emergency contacts and resources
  - Real-time communication access

### 7. **Viewer** (viewer)
**Description**: Read-only access for stakeholders and observers
- **Primary Responsibilities**: Monitoring, observation, reporting to external agencies
- **Access Level**: Read-only access to non-sensitive information
- **Key Characteristics**:
  - View public dashboards and maps
  - Access to general statistics
  - No data entry capabilities
  - No access to personal information

### 8. **Custom Roles**
**Description**: Tailored roles created for specific organizational needs
- **Primary Responsibilities**: Varies based on custom configuration
- **Access Level**: Configurable based on specific requirements
- **Key Characteristics**:
  - Flexible permission matrix
  - Custom form access
  - Specific feature limitations
  - Organizational-specific requirements

---

## Permission Categories

### 1. **User Directory Management**
Controls access to user-related functions and information.

**Available Actions**:
- **View**: See user profiles and basic information
- **Invite**: Send invitations to new users
- **Edit**: Modify user profiles and settings
- **Suspend**: Temporarily disable user accounts

**Role Permissions**:
- **Admin**: All actions (View, Invite, Edit, Suspend)
- **Operations Lead**: View only
- **Insights Analyst**: View only
- **Others**: No access

### 2. **Deployments Management**
Controls field mission planning, assignment, and approval processes.

**Available Actions**:
- **View**: See deployment information and schedules
- **Create**: Plan new deployments and missions
- **Edit**: Modify existing deployment details
- **Approve**: Authorize deployment execution

**Role Permissions**:
- **Admin**: All actions (View, Create, Edit, Approve)
- **Operations Lead**: All actions (View, Create, Edit, Approve)
- **Field Reporter**: View only
- **Insights Analyst**: View only
- **Others**: No access

### 3. **Form Builder & Management**
Controls access to form templates, assignment, and publishing.

**Available Actions**:
- **View**: See available forms and templates
- **Create**: Design new form templates
- **Assign**: Distribute forms to users or groups
- **Publish**: Make forms available for use

**Role Permissions**:
- **Admin**: All actions (View, Create, Assign, Publish)
- **Operations Lead**: View, Assign
- **Field Reporter**: View, Assign
- **Insights Analyst**: View only
- **Others**: View only (if assigned)

### 4. **Insights & Data Export**
Controls access to analytics, reporting, and data export functions.

**Available Actions**:
- **View**: Access dashboards and analytics
- **Export**: Download data and generate reports

**Role Permissions**:
- **Admin**: All actions (View, Export)
- **Operations Lead**: View only
- **Field Reporter**: View only
- **Insights Analyst**: All actions (View, Export)
- **Coordinator**: View only
- **Others**: No access

---

## Feature Access Matrix

### Core System Features

| Feature | Admin | Ops Lead | Field Reporter | Analyst | Coordinator | Responder | Viewer |
|---------|-------|----------|----------------|---------|-------------|-----------|--------|
| **Dashboard/Maps** | ✅ Full | ✅ Full | ✅ Limited | ✅ Full | ✅ Regional | ✅ Limited | ✅ Public |
| **Community Feed** | ✅ Manage | ✅ View | ✅ Submit | ✅ View | ✅ Manage | ✅ Submit | ✅ View |
| **Storm Tracking** | ✅ Full | ✅ Full | ✅ View | ✅ Full | ✅ View | ✅ View | ✅ View |
| **Emergency Contacts** | ✅ Manage | ✅ View | ✅ View | ✅ View | ✅ View | ✅ Full | ✅ View |
| **User Management** | ✅ Full | ✅ Limited | ❌ None | ✅ Limited | ✅ Regional | ❌ None | ❌ None |
| **System Config** | ✅ Full | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |

### Portal Access

| Portal | Admin | Ops Lead | Field Reporter | Analyst | Coordinator | Responder | Viewer |
|--------|-------|----------|----------------|---------|-------------|-----------|--------|
| **Assets Portal** | ✅ Full | ✅ Manage | ✅ Submit | ✅ View | ✅ Regional | ✅ Submit | ✅ View |
| **Places Portal** | ✅ Full | ✅ Manage | ✅ Submit | ✅ View | ✅ Regional | ✅ Submit | ✅ View |
| **People Portal** | ✅ Full | ✅ Manage | ✅ Submit | ✅ View | ✅ Regional | ✅ Submit | ✅ View |
| **Aid Workers Portal** | ✅ Full | ✅ Manage | ✅ View | ✅ View | ✅ Regional | ✅ Limited | ❌ None |
| **Relief Portal** | ✅ Full | ✅ Full | ✅ Limited | ✅ View | ✅ Regional | ✅ Limited | ✅ View |

### Form Access Control

| Form Type | Admin | Ops Lead | Field Reporter | Analyst | Coordinator | Responder | Viewer |
|-----------|-------|----------|----------------|---------|-------------|-----------|--------|
| **Damage Assessment** | ✅ All | ✅ Assign | ✅ Submit | ✅ View | ✅ Regional | ✅ Submit | ❌ None |
| **Supply Verification** | ✅ All | ✅ Assign | ✅ Submit | ❌ None | ✅ Regional | ✅ Submit | ❌ None |
| **Shelter Survey** | ✅ All | ✅ Assign | ❌ None | ❌ None | ✅ Regional | ✅ Submit | ❌ None |
| **Medical Intake** | ✅ All | ❌ None | ✅ Submit | ❌ None | ✅ Regional | ✅ Submit | ❌ None |
| **Water Quality** | ✅ All | ❌ None | ❌ None | ✅ View | ✅ Regional | ❌ None | ❌ None |

---

## Portal Access Control

### Assets Portal
**Purpose**: Track asset distributions and availability

**Access Levels**:
- **Full Access** (Admin): Create, edit, delete, assign, export
- **Management Access** (Ops Lead, Coordinator): Create, edit, assign, view
- **Submission Access** (Field Reporter, Responder): Submit new records, view assigned
- **View Access** (Analyst, Viewer): Read-only access to data

**Key Features**:
- Asset distribution tracking (Starlink, iPhones, Powerbanks, Food, Water, etc.)
- Heat maps for distribution patterns
- Recipient information management
- Inventory tracking

### Places Portal
**Purpose**: Monitor operational status of locations and facilities

**Access Levels**:
- **Full Access** (Admin): All operations and configurations
- **Management Access** (Ops Lead, Coordinator): Status updates and assignments
- **Submission Access** (Field Reporter, Responder): Status reporting
- **View Access** (Analyst, Viewer): Monitor status information

**Key Features**:
- Electricity, water, WiFi status tracking
- Shelter capacity monitoring
- Facility operational status
- Infrastructure damage reporting

### People Portal
**Purpose**: Report and track human needs and assistance requirements

**Access Levels**:
- **Full Access** (Admin): Complete needs management
- **Management Access** (Ops Lead, Coordinator): Needs coordination and assignment
- **Submission Access** (Field Reporter, Responder): Needs reporting
- **View Access** (Analyst, Viewer): Needs monitoring

**Key Features**:
- Food, water, shelter needs tracking
- Medical assistance requirements
- Contact information (restricted access)
- Priority assessment

### Aid Workers Portal
**Purpose**: Coordinate aid worker schedules and deployments

**Access Levels**:
- **Full Access** (Admin): Complete workforce management
- **Management Access** (Ops Lead, Coordinator): Schedule coordination
- **Limited Access** (Responder): Own schedule and availability
- **View Access** (Field Reporter, Analyst): Schedule visibility
- **No Access** (Viewer): Restricted for security

**Key Features**:
- Worker capability tracking
- Schedule management (24-72 hour planning)
- Deployment coordination
- Availability tracking

---

## Administrative Functions

### User Management
**Access**: Admin (Full), Operations Lead (Limited View)

**Functions**:
- Create new user accounts
- Assign and modify user roles
- Suspend/activate user accounts
- Reset user passwords
- Manage user permissions
- View user activity logs

### Role Management
**Access**: Admin Only

**Functions**:
- Create custom roles
- Define permission matrices
- Assign form access levels
- Configure role-based restrictions
- Manage system-wide role policies

### System Configuration
**Access**: Admin Only

**Functions**:
- Configure system-wide settings
- Manage API keys and integrations
- Set up authentication providers
- Configure data retention policies
- Manage system security settings

### Data Management
**Access**: Admin (Full), Analyst (Export Only)

**Functions**:
- Export system data
- Generate comprehensive reports
- Manage data retention
- Configure backup policies
- Data anonymization controls

---

## Authentication & Authorization

### Authentication Methods
1. **Better Auth Integration**: Primary authentication system
2. **Email/Password**: Standard login method
3. **Session Management**: Secure session handling
4. **Password Reset**: Self-service password recovery

### Authorization Mechanisms
1. **Role-Based Permissions**: Primary access control method
2. **Feature-Level Restrictions**: Granular access control
3. **Data-Level Security**: Row-level security where applicable
4. **API Authentication**: Secure API access with proper authorization

### Security Features
- **Session Timeout**: Automatic logout after inactivity
- **Password Policies**: Strong password requirements
- **Admin Secret Key**: Additional security layer for admin operations
- **Audit Logging**: Track user actions and system changes

### Access Control Flow
```
User Login → Authentication → Role Verification → Permission Check → Feature Access
```

---

## Implementation Details

### Database Schema
**Users Table** (`appUsers`):
- `id`: Unique user identifier
- `email`: User email address
- `role`: Assigned role name
- `canViewSensitiveData`: Permission flag for sensitive information
- `canExportData`: Permission flag for data export
- `canManageUsers`: Permission flag for user management

**Roles Table** (`roles`):
- `name`: Role identifier (primary key)
- `description`: Role description
- `permissions`: Array of permission strings

### Permission Format
Permissions are stored as string arrays with format: `{category}_{action}`

**Examples**:
- `users_view`: View user directory
- `deployments_create`: Create new deployments
- `forms_assign`: Assign forms to users
- `insights_export`: Export data and reports
- `form_damage`: Access to damage assessment forms

### Middleware Implementation
**File**: `middleware.ts`
- Checks for valid session tokens
- Redirects unauthenticated users to login
- Protects admin routes with additional verification

### API Security
**Admin Routes**: Protected with `ADMIN_SECRET_KEY`
**User Routes**: Session-based authentication
**Public Routes**: Community submissions and public data

### Frontend Access Control
**Route Protection**: Middleware-based route protection
**Component-Level**: Conditional rendering based on permissions
**Feature Flags**: Role-based feature availability

---

## Security Considerations

### Data Protection
- **Sensitive Information**: Contact details restricted to authorized roles
- **Personal Data**: GDPR-compliant data handling
- **Location Data**: Secure handling of GPS coordinates
- **Medical Information**: Restricted access to medical intake forms

### Access Monitoring
- **Audit Trails**: Log all user actions and data access
- **Session Monitoring**: Track active sessions and unusual activity
- **Permission Changes**: Log all role and permission modifications
- **Data Export Tracking**: Monitor data export activities

### Emergency Procedures
- **Admin Override**: Emergency access procedures for critical situations
- **Account Recovery**: Secure account recovery processes
- **System Lockdown**: Ability to restrict access during security incidents
- **Data Breach Response**: Procedures for handling security breaches

---

## Future Enhancements

### Planned Features
1. **Multi-Factor Authentication**: Enhanced security for admin accounts
2. **Granular Permissions**: More detailed permission controls
3. **Temporary Access**: Time-limited role assignments
4. **External Integration**: SSO with government systems
5. **Mobile Authentication**: Biometric authentication for mobile users

### Scalability Considerations
- **Role Hierarchy**: Support for nested role structures
- **Organization Units**: Multi-tenant support for different agencies
- **Regional Permissions**: Geographic-based access controls
- **Dynamic Roles**: Context-aware role assignments

---

*This documentation is maintained by the system administrators and should be updated whenever role definitions or permissions are modified.*

**Last Updated**: November 2024  
**Version**: 1.0  
**Maintained By**: System Administration Team
