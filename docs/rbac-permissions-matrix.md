# RBAC Permissions Matrix - Weather Updates System

## Granular Role-Based Access Control

---

## Permission Legend

- ✅ Has Access
- ❌ No Access

---

## User Roles

### 1. **Admin** (System Administrator)

Full system access with complete administrative privileges

### 2. **Operations Lead** (ops)

Manages field deployments and coordinates response operations

### 3. **Field Reporter** (field)

Front-line personnel capturing real-time data and status updates

### 4. **Insights Analyst** (analyst)

Data analysis specialist focused on reporting and trend analysis

### 5. **Needs** (needs)

Limited role specifically for reporting people needs only

---

## 1. User Management Permissions

| Permission                  | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| --------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **View User Directory**     | ✅    | ✅       | ❌             | ✅      | ❌    |
| **View User Profiles**      | ✅    | ✅       | ❌             | ✅      | ❌    |
| **Create User Accounts**    | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Invite New Users**        | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Edit User Profiles**      | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Assign User Roles**       | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Suspend User Accounts**   | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Delete User Accounts**    | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Reset User Passwords**    | ✅    | ❌       | ❌             | ❌      | ❌    |
| **View User Activity Logs** | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Manage User Permissions** | ✅    | ❌       | ❌             | ❌      | ❌    |

---

## 2. Deployment Management Permissions

| Permission                        | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| --------------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **View Deployments**              | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Create Deployments**            | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Edit Deployments**              | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Delete Deployments**            | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Approve Deployments**           | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Assign Workers to Deployments** | ✅    | ✅       | ❌             | ❌      | ❌    |
| **View Deployment History**       | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Cancel Deployments**            | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Modify Deployment Schedule**    | ✅    | ✅       | ❌             | ❌      | ❌    |

---

## 3. Form Management Permissions

| Permission                | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **View Forms**            | ✅    | ✅       | ✅             | ✅      | ✅    |
| **Create Form Templates** | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Edit Form Templates**   | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Delete Form Templates** | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Assign Forms to Users** | ✅    | ✅       | ✅             | ❌      | ❌    |
| **Publish Forms**         | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Unpublish Forms**       | ✅    | ❌       | ❌             | ❌      | ❌    |
| **View Form Submissions** | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Export Form Data**      | ✅    | ❌       | ❌             | ✅      | ❌    |

---

## 4. Form Type Access Permissions

| Form Type                     | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ----------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **Damage Assessment**         | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Supply Verification**       | ✅    | ✅       | ✅             | ❌      | ❌    |
| **Shelter Survey**            | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Medical Intake**            | ✅    | ❌       | ✅             | ❌      | ❌    |
| **Water Quality**             | ✅    | ❌       | ❌             | ✅      | ❌    |
| **Infrastructure Assessment** | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Emergency Contact Form**    | ✅    | ✅       | ✅             | ❌      | ❌    |
| **Resource Request**          | ✅    | ✅       | ✅             | ✅      | ❌    |
| **People Needs Form**         | ✅    | ✅       | ✅             | ✅      | ✅    |

---

## 5. Dashboard & Maps Permissions

| Permission                      | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ------------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **View Dashboard**              | ✅    | ✅       | ✅             | ✅      | ❌    |
| **View Interactive Maps**       | ✅    | ✅       | ✅             | ✅      | ❌    |
| **View All Locations**          | ✅    | ✅       | ✅             | ✅      | ❌    |
| **View Asset Locations**        | ✅    | ✅       | ✅             | ✅      | ❌    |
| **View People Needs**           | ✅    | ✅       | ✅             | ✅      | ❌    |
| **View Aid Worker Locations**   | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Configure Dashboard Widgets** | ✅    | ✅       | ❌             | ✅      | ❌    |
| **Create Custom Views**         | ✅    | ✅       | ❌             | ✅      | ❌    |
| **Export Map Data**             | ✅    | ❌       | ❌             | ✅      | ❌    |

---

## 6. Assets Portal Permissions

| Permission                   | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ---------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **View Assets**              | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Create Asset Records**     | ✅    | ✅       | ✅             | ❌      | ❌    |
| **Edit Asset Records**       | ✅    | ✅       | ✅             | ❌      | ❌    |
| **Delete Asset Records**     | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Assign Assets**            | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Track Asset Distribution** | ✅    | ✅       | ✅             | ✅      | ❌    |
| **View Asset Inventory**     | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Export Asset Data**        | ✅    | ❌       | ❌             | ✅      | ❌    |
| **View Heat Maps**           | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Manage Asset Categories**  | ✅    | ❌       | ❌             | ❌      | ❌    |

---

## 7. Places Portal Permissions

| Permission                       | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| -------------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **View Places**                  | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Create Place Records**         | ✅    | ✅       | ✅             | ❌      | ❌    |
| **Edit Place Records**           | ✅    | ✅       | ✅             | ❌      | ❌    |
| **Delete Place Records**         | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Update Facility Status**       | ✅    | ✅       | ✅             | ❌      | ❌    |
| **Update Utility Status**        | ✅    | ✅       | ✅             | ❌      | ❌    |
| **Report Infrastructure Damage** | ✅    | ✅       | ✅             | ❌      | ❌    |
| **Update Shelter Capacity**      | ✅    | ✅       | ✅             | ❌      | ❌    |
| **Export Place Data**            | ✅    | ❌       | ❌             | ✅      | ❌    |

---

## 8. People Portal Permissions

| Permission                   | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ---------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **View People Needs**        | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Create Needs Reports**     | ✅    | ✅       | ✅             | ❌      | ✅    |
| **Edit Needs Reports**       | ✅    | ✅       | ✅             | ❌      | ✅    |
| **Delete Needs Reports**     | ✅    | ❌       | ❌             | ❌      | ❌    |
| **View Contact Information** | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Update Needs Status**      | ✅    | ✅       | ✅             | ❌      | ✅    |
| **Assign Priority Levels**   | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Export People Data**       | ✅    | ❌       | ❌             | ✅      | ❌    |
| **View Medical Needs**       | ✅    | ✅       | ✅             | ❌      | ❌    |

---

## 9. Aid Workers Portal Permissions

| Permission                    | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ----------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **View All Aid Workers**      | ✅    | ✅       | ✅             | ✅      | ❌    |
| **View Own Profile**          | ✅    | ✅       | ✅             | ✅      | ✅    |
| **Create Worker Profiles**    | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Edit Worker Profiles**      | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Delete Worker Profiles**    | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Manage Schedules**          | ✅    | ✅       | ❌             | ❌      | ❌    |
| **View Own Schedule**         | ✅    | ✅       | ✅             | ✅      | ✅    |
| **Update Own Availability**   | ✅    | ✅       | ✅             | ✅      | ✅    |
| **Track Worker Capabilities** | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Coordinate Deployments**    | ✅    | ✅       | ❌             | ❌      | ❌    |

---

## 10. Relief Portal Permissions

| Permission                    | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ----------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **View Relief Operations**    | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Create Relief Requests**    | ✅    | ✅       | ✅             | ❌      | ❌    |
| **Approve Relief Requests**   | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Distribute Relief Items**   | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Track Relief Distribution** | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Manage Relief Inventory**   | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Export Relief Data**        | ✅    | ❌       | ❌             | ✅      | ❌    |

---

## 11. Community Feed Permissions

| Permission                     | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ------------------------------ | ----- | -------- | -------------- | ------- | ----- |
| **View Community Posts**       | ✅    | ✅       | ✅             | ✅      | ✅    |
| **Submit Community Reports**   | ✅    | ✅       | ✅             | ❌      | ✅    |
| **Edit Own Posts**             | ✅    | ✅       | ✅             | ❌      | ✅    |
| **Delete Own Posts**           | ✅    | ✅       | ✅             | ❌      | ✅    |
| **Moderate Community Posts**   | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Delete Any Posts**           | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Flag Inappropriate Content** | ✅    | ✅       | ✅             | ✅      | ✅    |
| **Pin Important Posts**        | ✅    | ✅       | ❌             | ❌      | ❌    |

---

## 12. Storm Tracking Permissions

| Permission                     | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ------------------------------ | ----- | -------- | -------------- | ------- | ----- |
| **View Storm Data**            | ✅    | ✅       | ✅             | ✅      | ✅    |
| **Update Storm Information**   | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Create Storm Alerts**        | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Publish Storm Warnings**     | ✅    | ✅       | ❌             | ❌      | ❌    |
| **View Historical Storm Data** | ✅    | ✅       | ✅             | ✅      | ✅    |
| **Export Storm Data**          | ✅    | ❌       | ❌             | ✅      | ❌    |

---

## 13. Emergency Contacts Permissions

| Permission                    | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ----------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **View Emergency Contacts**   | ✅    | ✅       | ✅             | ✅      | ✅    |
| **Add Emergency Contacts**    | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Edit Emergency Contacts**   | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Delete Emergency Contacts** | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Call Emergency Contacts**   | ✅    | ✅       | ✅             | ❌      | ✅    |
| **Export Contact List**       | ✅    | ❌       | ❌             | ✅      | ❌    |

---

## 14. Insights & Analytics Permissions

| Permission                     | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ------------------------------ | ----- | -------- | -------------- | ------- | ----- |
| **View Dashboards**            | ✅    | ✅       | ✅             | ✅      | ❌    |
| **View Reports**               | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Create Custom Reports**      | ✅    | ❌       | ❌             | ✅      | ❌    |
| **Export Data**                | ✅    | ❌       | ❌             | ✅      | ❌    |
| **Generate Analytics**         | ✅    | ❌       | ❌             | ✅      | ❌    |
| **View Trends**                | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Access Raw Data**            | ✅    | ❌       | ❌             | ✅      | ❌    |
| **Create Data Visualizations** | ✅    | ❌       | ❌             | ✅      | ❌    |

---

## 15. System Configuration Permissions

| Permission                      | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ------------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **Access System Settings**      | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Configure API Keys**          | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Manage Integrations**         | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Set Data Retention Policies** | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Configure Backup Settings**   | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Manage Security Settings**    | ✅    | ❌       | ❌             | ❌      | ❌    |
| **View System Logs**            | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Configure Authentication**    | ✅    | ❌       | ❌             | ❌      | ❌    |
| **System Lockdown**             | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Emergency Override**          | ✅    | ❌       | ❌             | ❌      | ❌    |

---

## 16. Role Management Permissions

| Permission                      | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ------------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **View All Roles**              | ✅    | ✅       | ❌             | ✅      | ❌    |
| **Create Custom Roles**         | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Edit Role Permissions**       | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Delete Roles**                | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Assign Form Access**          | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Configure Role Restrictions** | ✅    | ❌       | ❌             | ❌      | ❌    |
| **View Role Hierarchy**         | ✅    | ✅       | ❌             | ✅      | ❌    |

---

## 17. Sensitive Data Access Permissions

| Data Type                        | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| -------------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **Personal Contact Information** | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Medical Information**          | ✅    | ✅       | ❌             | ❌      | ❌    |
| **GPS Coordinates (Precise)**    | ✅    | ✅       | ✅             | ✅      | ❌    |
| **Financial Information**        | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Government IDs**               | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Vulnerability Assessments**    | ✅    | ✅       | ❌             | ✅      | ❌    |
| **Security Sensitive Locations** | ✅    | ✅       | ❌             | ❌      | ❌    |

---

## 18. Data Export Permissions

| Export Type                  | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ---------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **Export All Data**          | ✅    | ❌       | ❌             | ✅      | ❌    |
| **Export Form Submissions**  | ✅    | ❌       | ❌             | ✅      | ❌    |
| **Export Analytics Reports** | ✅    | ❌       | ❌             | ✅      | ❌    |
| **Export User Data**         | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Export Map Data**          | ✅    | ❌       | ❌             | ✅      | ❌    |
| **Export Asset Records**     | ✅    | ❌       | ❌             | ✅      | ❌    |
| **Bulk Data Export**         | ✅    | ❌       | ❌             | ✅      | ❌    |
| **Scheduled Exports**        | ✅    | ❌       | ❌             | ✅      | ❌    |

---

## 19. Audit & Logging Permissions

| Permission                | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ------------------------- | ----- | -------- | -------------- | ------- | ----- |
| **View Audit Logs**       | ✅    | ❌       | ❌             | ❌      | ❌    |
| **View Own Activity Log** | ✅    | ✅       | ✅             | ✅      | ✅    |
| **Export Audit Logs**     | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Track Data Access**     | ✅    | ❌       | ❌             | ❌      | ❌    |
| **Monitor User Sessions** | ✅    | ❌       | ❌             | ❌      | ❌    |
| **View Security Alerts**  | ✅    | ❌       | ❌             | ❌      | ❌    |

---

## 20. Communication Permissions

| Permission                     | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ------------------------------ | ----- | -------- | -------------- | ------- | ----- |
| **Send System-wide Messages**  | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Send Alerts**                | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Send Direct Messages**       | ✅    | ✅       | ✅             | ✅      | ✅    |
| **Create Broadcast Messages**  | ✅    | ✅       | ❌             | ❌      | ❌    |
| **Access Emergency Broadcast** | ✅    | ✅       | ❌             | ❌      | ❌    |
| **View Message History**       | ✅    | ✅       | ✅             | ❌      | ❌    |

---

## Permission Flags Summary

### Database Permission Flags

| Flag                   | Admin | Ops Lead | Field Reporter | Analyst | Needs |
| ---------------------- | ----- | -------- | -------------- | ------- | ----- |
| `canViewSensitiveData` | ✅    | ✅       | ❌             | ❌      | ❌    |
| `canExportData`        | ✅    | ❌       | ❌             | ✅      | ❌    |
| `canManageUsers`       | ✅    | ❌       | ❌             | ❌      | ❌    |
| `canCreateDeployments` | ✅    | ✅       | ❌             | ❌      | ❌    |
| `canAssignForms`       | ✅    | ✅       | ✅             | ❌      | ❌    |
| `canApproveRequests`   | ✅    | ✅       | ❌             | ❌      | ❌    |
| `canAccessAdmin`       | ✅    | ❌       | ❌             | ❌      | ❌    |
| `canSubmitPeopleNeeds` | ✅    | ✅       | ✅             | ❌      | ✅    |

---

## Implementation Notes

### Permission String Format

```
{category}_{action}
```

### Example Permission Strings

- `users_view` - View user directory
- `users_create` - Create new users
- `users_edit` - Edit user profiles
- `users_delete` - Delete user accounts
- `deployments_view` - View deployments
- `deployments_create` - Create deployments
- `deployments_approve` - Approve deployments
- `forms_view` - View forms
- `forms_create` - Create form templates
- `forms_assign` - Assign forms to users
- `forms_publish` - Publish forms
- `insights_view` - View analytics
- `insights_export` - Export data
- `form_damage` - Access damage assessment forms
- `form_medical` - Access medical intake forms
- `form_people_needs` - Access people needs form
- `sensitive_data_view` - View sensitive information
- `admin_override` - Emergency admin access

---

## Role-Specific Notes

### Needs Role

The **Needs** role is a specialized, limited-access role designed specifically for community members or volunteers who:

- Can only submit People Needs reports
- Can view and edit their own submissions
- Have access to basic community features
- Cannot access administrative, analytical, or operational features
- Ideal for public-facing needs reporting

**Primary Use Case**: Community reporting portal where residents can report their needs during emergencies

---

_Document Version: 2.0_  
_Last Updated: November 2024_  
_Total Permissions Mapped: 150+_  
_Roles: 5 (Admin, Ops Lead, Field Reporter, Analyst, Needs)_
