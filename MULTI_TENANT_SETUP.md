# Multi-Tenant Nexus Setup Guide

## Overview
Nexus is now a fully multi-tenant application with proper organization isolation, just like SYNC. Each organization has its own data silo and users can only access data within their organization.

## Production URL
https://nexus-lwi2xo6sm-aaron-thompsons-projects.vercel.app

## How Multi-Tenancy Works

### Organization Creation
- **Self-Signup**: Any user can create a new organization through the signup flow
- **Admin Role**: The user who creates the organization becomes the admin
- **Data Isolation**: All data is scoped to the organization using `organizationId`
- **Invite System**: Admins can invite users to join their organization

### Data Structure
```
organizations/{organizationId}/
  ├── feed/{postId}
  ├── timepunches/{punchId}
  ├── teams/{teamId}
  ├── shifts/{shiftId}
  └── ... (other collections)

users/{userId} (global, contains organizationId reference)
invites/{inviteId} (global, for cross-org invitations)
```

### Security
- **Firebase Rules**: Comprehensive rules ensure users can only access data within their organization
- **Role-Based Access**: Different permissions for employee/manager/admin/super_admin
- **Invite Validation**: Secure invitation system for adding users to organizations

## Using the Application

### 1. Creating a New Organization
1. Visit the application URL
2. Click "Create Organization" tab
3. Fill in:
   - **Organization Name**: Your company name
   - **Your Full Name**: Admin user's name
   - **Email**: Admin email address
   - **Password**: Secure password
4. Click "Create Organization"
5. You'll be logged in as admin of your new organization

### 2. Signing In to Existing Organization
1. Use the "Sign In" tab
2. Enter email and password of existing user
3. You'll be logged into your organization

### 3. Inviting Users (Coming Soon)
- Admin users will be able to invite new users via email
- Invited users will receive a link to join the organization
- They can create their account and be automatically added to the organization

## Testing Multi-Tenancy

### Test Data Isolation
1. **Create Organization A**: 
   - Name: "Company A"
   - Admin: "admin-a@test.com" / "password123"

2. **Create Organization B**:
   - Name: "Company B" 
   - Admin: "admin-b@test.com" / "password123"

3. **Add Data in Each Org**:
   - Login to Company A, create feed posts, time punches
   - Login to Company B, create different data
   - Verify each admin only sees their organization's data

### Verify Isolation
- ✅ Feed posts are organization-specific
- ✅ Time punches are organization-specific  
- ✅ Employee management is organization-specific
- ✅ All Firebase queries filter by organizationId
- ✅ Security rules prevent cross-organization access

## Current Features with Multi-Tenancy

### ✅ Implemented
- Organization creation on signup
- Organization-scoped data queries
- Firebase security rules with organization isolation
- User authentication with organization context
- Feed system (organization-scoped)
- Timeclock system (organization-scoped)
- Employee management (organization-scoped)

### 🚧 Coming Soon
- User invitation system
- Organization switching (for users in multiple orgs)
- Organization settings management
- Organization onboarding flow

## Database Schema

### Organization Document
```typescript
{
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  settings: {
    enablePhotoOnPunch: boolean;
    enableGpsTracking: boolean;
    timeOffPolicies: { leaveTypes: string[] };
    loginCustomization: LoginCustomization;
    // ... other settings
  }
}
```

### User Document
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  role: 'employee' | 'manager' | 'admin' | 'super_admin';
  organizationId: string; // Key for data isolation
  status: 'active' | 'disabled';
  onboardingCompleted: boolean;
}
```

## Security Rules Summary

### Firestore Rules
- Users can only read/write data in their organization
- Role-based permissions within organization
- Organization owners have full admin access
- Cross-organization data access is prevented

### Storage Rules
- Files are organized by organizationId
- Users can only access files within their organization
- Type and size restrictions enforced
- Admin-only sections for sensitive documents

## Migration from Previous Version

If you had data from the previous demo version:
1. The old `demo-org-1` organization data will be isolated
2. New organizations will have their own data silos
3. Users need to create new organizations through the signup flow
4. No data migration is needed - each organization starts fresh

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Firebase rules are properly deployed
3. Ensure organizationId is properly set in user documents
4. Test with multiple organizations to verify isolation

**Nexus is now a fully multi-tenant SaaS application ready for production use!** 🚀