# Demo Data Setup Instructions

## 1. Access the Application
Visit: https://nexus-3v8w9p2ir-aaron-thompsons-projects.vercel.app

## 2. Create Demo Account
Click "Continue with Demo Account" on the login page. This will create a demo user with admin privileges.

## 3. Seed Demo Data (Manual Process)

### Step 1: Open Browser Console
- Press F12 to open Developer Tools
- Go to the Console tab

### Step 2: Create Demo Users
Run this code in the console to create additional demo users:

```javascript
// Create additional demo users
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { firestore } from './src/lib/firebase';

const organizationId = 'demo-org-1';

const demoUsers = [
  {
    uid: 'demo-manager-1',
    email: 'manager@nexus.com',
    displayName: 'Jane Manager',
    role: 'manager',
    status: 'active',
    organizationId,
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
    createdAt: Timestamp.now(),
  },
  {
    uid: 'demo-employee-1',
    email: 'employee@nexus.com',
    displayName: 'John Employee',
    role: 'employee',
    status: 'active',
    organizationId,
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    createdAt: Timestamp.now(),
  },
];

// Create users
for (const user of demoUsers) {
  await setDoc(doc(firestore, 'users', user.uid), user);
}
console.log('Demo users created!');
```

### Step 3: Create Demo Feed Posts
```javascript
// Create demo feed posts
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const demoFeedPosts = [
  {
    authorId: 'demo-user-id', // Use the current user's ID
    content: 'Welcome to Nexus! 🎉 This is our new company intranet. Feel free to share updates, ask questions, and connect with your colleagues.',
    mentions: { userIds: [], teamIds: [] },
    visibility: 'everyone',
    reactions: {},
    replyCount: 0,
    createdAt: Timestamp.now(),
  },
  {
    authorId: 'demo-user-id',
    content: 'Great work everyone on the Q3 goals! 📊 We\'ve exceeded our targets and the team effort has been amazing.',
    mentions: { userIds: [], teamIds: [] },
    visibility: 'everyone',
    reactions: {},
    replyCount: 0,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
  },
];

// Create feed posts
for (const post of demoFeedPosts) {
  await addDoc(collection(firestore, `organizations/${organizationId}/feed`), post);
}
console.log('Demo feed posts created!');
```

## 4. Test the Application

### Features to Test:
1. **Authentication**: Login/logout functionality
2. **Feed**: Navigate to Feed page and verify posts load
3. **Timeclock**: Test punch in/out functionality
4. **Employee Management**: Test admin user management (if admin role)

### Login Credentials:
- **Demo Account**: Use "Continue with Demo Account" button
- **Email/Password**: demo@nexus.com / demo123

## 5. Troubleshooting

### Feed Not Loading:
1. Check browser console for errors
2. Verify Firebase rules are deployed
3. Ensure user has organizationId set to 'demo-org-1'

### Authentication Issues:
1. Clear browser cache and cookies
2. Check Firebase console for authentication errors
3. Verify environment variables are set in Vercel

### Permissions Issues:
1. Verify user role is set correctly
2. Check Firebase security rules
3. Ensure organizationId matches across user and data

## 6. Adding More Demo Data

You can add more demo data by following the patterns above:
- More users with different roles
- Additional feed posts
- Time punch records
- Teams and projects

Each data type should include the correct organizationId and follow the schema defined in the types file.