// Firebase Data Seeding Script
// Run this in the browser console after logging in to seed demo data

import { collection, doc, setDoc, addDoc, Timestamp } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { Role, FIRESTORE_COLLECTIONS } from '../types';

const organizationId = 'demo-org-1';

// Demo users
const demoUsers = [
  {
    uid: 'demo-admin-1',
    email: 'admin@nexus.com',
    displayName: 'Admin User',
    role: Role.ADMIN,
    status: 'active',
    organizationId,
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    createdAt: Timestamp.now(),
  },
  {
    uid: 'demo-manager-1',
    email: 'manager@nexus.com',
    displayName: 'Jane Manager',
    role: Role.MANAGER,
    status: 'active',
    organizationId,
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
    createdAt: Timestamp.now(),
  },
  {
    uid: 'demo-employee-1',
    email: 'employee@nexus.com',
    displayName: 'John Employee',
    role: Role.EMPLOYEE,
    status: 'active',
    organizationId,
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    createdAt: Timestamp.now(),
  },
  {
    uid: 'demo-employee-2',
    email: 'sarah@nexus.com',
    displayName: 'Sarah Wilson',
    role: Role.EMPLOYEE,
    status: 'active',
    organizationId,
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    createdAt: Timestamp.now(),
  },
];

// Demo feed posts
const demoFeedPosts = [
  {
    authorId: 'demo-admin-1',
    content: 'Welcome to Nexus! 🎉 This is our new company intranet. Feel free to share updates, ask questions, and connect with your colleagues.',
    mentions: { userIds: [], teamIds: [] },
    visibility: 'everyone',
    reactions: { '👍': ['demo-manager-1', 'demo-employee-1'] },
    replyCount: 1,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
    parentPostId: null,
  },
  {
    authorId: 'demo-manager-1',
    content: 'Great work everyone on the Q3 goals! 📊 We\'ve exceeded our targets and the team effort has been amazing.',
    mentions: { userIds: [], teamIds: [] },
    visibility: 'everyone',
    reactions: { '🎉': ['demo-admin-1'], '👏': ['demo-employee-1', 'demo-employee-2'] },
    replyCount: 0,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000)), // 4 hours ago
    parentPostId: null,
  },
  {
    authorId: 'demo-employee-1',
    content: 'Looking forward to the team building event next week! Who else is excited? 🏐',
    mentions: { userIds: [], teamIds: [] },
    visibility: 'everyone',
    reactions: { '🙋‍♀️': ['demo-employee-2'], '🎯': ['demo-manager-1'] },
    replyCount: 0,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000)), // 6 hours ago
    parentPostId: null,
  },
];

// Demo teams
const demoTeams = [
  {
    id: 'team-engineering',
    name: 'Engineering',
    description: 'Software development team',
    memberIds: ['demo-employee-1', 'demo-employee-2'],
    managerId: 'demo-manager-1',
    createdAt: Timestamp.now(),
  },
  {
    id: 'team-admin',
    name: 'Administration',
    description: 'Administrative team',
    memberIds: ['demo-admin-1'],
    managerId: 'demo-admin-1',
    createdAt: Timestamp.now(),
  },
];

// Demo time punches
const demoTimePunches = [
  {
    userId: 'demo-employee-1',
    punchType: 'in',
    punchTime: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 60 * 1000)), // 8 hours ago
    location: 'Office - Main Floor',
    organizationId,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 60 * 1000)),
  },
  {
    userId: 'demo-employee-2',
    punchType: 'in',
    punchTime: Timestamp.fromDate(new Date(Date.now() - 7.5 * 60 * 60 * 1000)), // 7.5 hours ago
    location: 'Office - Main Floor',
    organizationId,
    createdAt: Timestamp.fromDate(new Date(Date.now() - 7.5 * 60 * 60 * 1000)),
  },
];

export async function seedFirebaseData() {
  try {
    console.log('Starting Firebase data seeding...');

    // Seed users
    console.log('Seeding users...');
    for (const user of demoUsers) {
      await setDoc(doc(firestore, FIRESTORE_COLLECTIONS.USERS, user.uid), user);
    }

    // Seed teams
    console.log('Seeding teams...');
    for (const team of demoTeams) {
      await setDoc(doc(firestore, `organizations/${organizationId}/${FIRESTORE_COLLECTIONS.TEAMS}`, team.id), team);
    }

    // Seed feed posts
    console.log('Seeding feed posts...');
    for (const post of demoFeedPosts) {
      await addDoc(collection(firestore, `organizations/${organizationId}/${FIRESTORE_COLLECTIONS.FEED}`), post);
    }

    // Seed time punches
    console.log('Seeding time punches...');
    for (const punch of demoTimePunches) {
      await addDoc(collection(firestore, `organizations/${organizationId}/${FIRESTORE_COLLECTIONS.TIMEPUNCHES}`), punch);
    }

    console.log('✅ Firebase data seeding completed successfully!');
    console.log('Demo accounts:');
    console.log('- Admin: admin@nexus.com / demo123');
    console.log('- Manager: manager@nexus.com / demo123');
    console.log('- Employee: employee@nexus.com / demo123');
    
  } catch (error) {
    console.error('❌ Error seeding Firebase data:', error);
  }
}

// Auto-run if in development mode
if (import.meta.env.DEV) {
  console.log('Firebase seeder loaded. Run seedFirebaseData() in console to seed data.');
  (window as any).seedFirebaseData = seedFirebaseData;
}