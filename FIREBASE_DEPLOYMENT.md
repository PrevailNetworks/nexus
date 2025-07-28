# Firebase Rules Deployment Guide

## Overview
This guide covers deploying the Firestore and Storage security rules to your Firebase project for the Nexus application.

## Prerequisites

- Firebase CLI installed globally
- Access to the Firebase project: `forcelogix-timeclock`
- Admin permissions on the Firebase project

## Installation

1. **Install Firebase CLI (if not already installed):**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in project (if not already done):**
   ```bash
   cd Nexus
   firebase init
   ```
   - Select: Firestore, Storage, Hosting
   - Use existing project: `forcelogix-timeclock`
   - Accept default filenames

## Deployment Commands

### Deploy All Rules and Indexes
```bash
firebase deploy
```

### Deploy Only Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Only Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

### Deploy Only Storage Rules
```bash
firebase deploy --only storage
```

### Deploy Only Hosting
```bash
firebase deploy --only hosting
```

## Security Rules Overview

### Firestore Rules Features
- **Organization-based data isolation**: All data is scoped to organizationId
- **Role-based access control**: Different permissions for employees, managers, admins
- **User status validation**: Only active users can access most features
- **Owner-based permissions**: Users can modify their own data
- **Admin overrides**: Admins have elevated permissions within their organization

### Storage Rules Features
- **File type validation**: Restricts uploads to specific file types
- **File size limits**: 10MB for images, 50MB for documents
- **Organization-scoped storage**: All files are organized by organizationId
- **User-specific access**: Profile photos and temp uploads are user-restricted
- **Admin-only sections**: HR documents and system files require admin access

## Rule Structure

### Key Collections in Firestore Rules:
- `/users/{userId}` - User profiles (cross-organization read, owner/admin write)
- `/organizations/{orgId}/feed/{postId}` - Feed posts
- `/organizations/{orgId}/timepunches/{punchId}` - Time tracking
- `/organizations/{orgId}/employees/{employeeId}` - Employee management
- `/organizations/{orgId}/tasks/{taskId}` - Task management
- `/notifications/{notificationId}` - User notifications

### Key Storage Paths:
- `/feed-images/{orgId}/` - Feed post images
- `/timeclock-photos/{orgId}/` - Punch photos
- `/profile-photos/{orgId}/{userId}/` - User profile photos
- `/employee-documents/{orgId}/{employeeId}/` - HR documents

## Testing Rules

### Local Testing with Emulators
```bash
# Start Firebase emulators
firebase emulators:start

# Test specific rules
firebase emulators:exec --only firestore,storage "npm test"
```

### Manual Testing Steps

1. **Test Feed Access:**
   - Create posts as different users
   - Verify organization isolation
   - Test mention functionality

2. **Test Timeclock:**
   - Punch in/out as employee
   - Verify manager can view employee punches
   - Test photo uploads

3. **Test Employee Management:**
   - Admin should create/edit employees
   - Employees should only read their own data
   - Managers should read team data

## Rollback Procedures

### Rollback Firestore Rules
```bash
# Deploy previous version
firebase deploy --only firestore:rules --project=forcelogix-timeclock
```

### Rollback Storage Rules
```bash
# Deploy previous version  
firebase deploy --only storage --project=forcelogix-timeclock
```

## Monitoring

### Firebase Console Monitoring
1. Go to [Firebase Console](https://console.firebase.google.com/project/forcelogix-timeclock)
2. Navigate to Firestore → Usage
3. Monitor rule evaluations and denied requests
4. Check Storage → Usage for denied uploads

### Error Debugging
- Check browser network tab for `permission-denied` errors
- Review Firebase Console logs
- Test rules with different user roles
- Verify organizationId is properly set in user documents

## Common Issues

### Permission Denied Errors
- **Cause**: User role not properly set or organizationId mismatch
- **Solution**: Verify user document has correct role and organizationId

### File Upload Failures  
- **Cause**: File type or size restrictions
- **Solution**: Check file meets storage rule requirements

### Query Failures
- **Cause**: Missing composite indexes
- **Solution**: Deploy firestore indexes or add suggested index from error

## Production Checklist

- [ ] Rules deployed successfully
- [ ] Indexes deployed and built
- [ ] Test user login/authentication
- [ ] Test feed post creation
- [ ] Test timeclock punch with photo
- [ ] Test employee management (admin user)
- [ ] Test file uploads
- [ ] Monitor error logs for 24 hours
- [ ] Verify no cross-organization data leaks

## Environment Variables

Ensure these are set in Vercel and locally:

```bash
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=forcelogix-timeclock.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=forcelogix-timeclock
VITE_FIREBASE_STORAGE_BUCKET=forcelogix-timeclock.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Support

For deployment issues:
1. Check Firebase CLI version: `firebase --version`
2. Verify project permissions: `firebase projects:list`
3. Review deployment logs
4. Check Firebase Console for rule syntax errors