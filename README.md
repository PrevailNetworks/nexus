# Nexus - Comprehensive Workforce Management Platform

A modern, multi-tenant workforce management platform built with React, TypeScript, and Firebase. Nexus provides organizations with a complete solution for employee management, team collaboration, time tracking, and organizational communication.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11-orange.svg)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1-blue.svg)](https://tailwindcss.com/)

## 🚀 Live Demo

This project is deployed on **Vercel** with Firebase backend integration.

## ✨ Core Features

### 🏢 **Multi-Tenant Architecture**
- **Organization Isolation**: Complete data separation between organizations
- **Self-Service Signup**: Organizations can sign up and create their own workspace
- **Role-Based Access Control**: Admin, Manager, and Employee roles with granular permissions
- **Scalable Infrastructure**: Built to handle multiple organizations with Firebase

### 👥 **Employee Management**
- **Complete Employee Profiles**: Personal info, contracts, documents, permissions
- **Department Management**: Organize employees by departments with filtering
- **Document Management**: Secure file uploads with categorization
- **Training & Certification Tracking**: Monitor employee development and compliance
- **PTO Management**: Leave balance tracking with organization-specific policies
- **Performance Reviews**: Track employee performance and growth

### ⏰ **Time & Attendance**
- **Digital Timeclock**: Clock in/out functionality with GPS tracking
- **Overtime Management**: Request and approval workflow for overtime
- **Time Management**: Comprehensive time tracking and reporting
- **Mobile Punch**: Mobile-optimized clock-in experience
- **Auto Clock-out**: Configurable automatic clock-out for compliance

### 📊 **Workforce Analytics**
- **Real-time Dashboards**: Comprehensive analytics and reporting
- **Department Insights**: Performance metrics by department
- **Engagement Tracking**: Employee engagement and satisfaction metrics
- **Productivity Analytics**: Team efficiency and project delivery tracking
- **Custom Reports**: Generate detailed workforce reports

### 💰 **Financial Management**
- **Payroll Integration**: Employee compensation and benefits tracking
- **Expense Management**: Mileage rates and reimbursement tracking
- **Budget Oversight**: Department and project budget management

### 🔄 **Team Collaboration**
- **Company Feed**: Organization-wide communication and updates
- **Announcements**: Priority-based announcement system with admin controls
- **Kudos System**: Peer recognition and employee appreciation
- **Team Calendar**: Events, birthdays, anniversaries, and meetings
- **Project Management**: Track projects with team collaboration

### 🛡️ **Security & Compliance**
- **Firebase Security Rules**: Organization-scoped data access
- **Role-Based Permissions**: Granular access control by user role
- **Audit Trails**: Track all system changes and access
- **Data Privacy**: GDPR-compliant data handling and storage

## 🛠 Tech Stack

### **Frontend**
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **React Router DOM** - Client-side routing

### **Backend & Database**
- **Firebase Firestore** - NoSQL database with real-time sync
- **Firebase Authentication** - Secure user authentication
- **Firebase Storage** - File storage for documents and images
- **Firebase Security Rules** - Organization-level data isolation

### **Styling & UI**
- **Tailwind CSS v4** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled UI primitives
- **shadcn/ui** - Beautiful, reusable UI components
- **Lucide React** - Comprehensive icon library

### **State Management**
- **React Context API** - Global state management
- **Firebase SDK** - Real-time data synchronization
- **Custom Hooks** - Reusable stateful logic

## 📁 Project Structure

```
nexus/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # shadcn/ui base components
│   │   ├── admin/           # Admin-specific components
│   │   │   ├── EditEmployeeContainer.tsx
│   │   │   ├── ContractTab.tsx
│   │   │   ├── DocumentTab.tsx
│   │   │   ├── PermissionsTab.tsx
│   │   │   ├── PTOTab.tsx
│   │   │   ├── TrainingTab.tsx
│   │   │   ├── ReimbursementTab.tsx
│   │   │   ├── TimeManagementTab.tsx
│   │   │   └── ClockInOutTab.tsx
│   │   ├── CompanyAnnouncements.tsx
│   │   ├── EmployeeDirectory.tsx
│   │   ├── Header.tsx
│   │   ├── KudosFeed.tsx
│   │   ├── TimeclockWidget.tsx
│   │   └── ...
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx
│   │   ├── EmployeeManagementPage.tsx
│   │   ├── TimeclockPage.tsx
│   │   ├── FeedPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── ...
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useFirestore.ts
│   ├── lib/                 # Utility functions
│   │   ├── firebase.ts
│   │   └── utils.ts
│   ├── types/               # TypeScript type definitions
│   └── data/                # Constants and configurations
├── firestore.rules          # Firebase security rules
├── public/                  # Static assets
└── dist/                    # Build output
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ 
- **npm** 9+ or **yarn** 1.22+
- **Firebase Project** with Firestore and Authentication enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PrevailNetworks/nexus.git
   cd nexus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Deploy Firebase Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
# Build the project
npm run build

# Preview the build
npm run preview
```

## 🌐 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables**
   Add your Firebase configuration in the Vercel dashboard.

## 📊 Workforce Management Features

### Employee Management Dashboard

| Feature | Description | Access Level |
|---------|-------------|--------------|
| **Employee Profiles** | Complete employee information management | Admin/Manager |
| **Contract Management** | Employment contracts and compensation | Admin |
| **Document Storage** | Secure document uploads and categorization | Admin/Manager |
| **Training Records** | Track certifications and training progress | Admin/Manager |
| **PTO Tracking** | Leave balance and request management | All Users |
| **Performance Reviews** | Employee evaluation and feedback | Admin/Manager |

### Time & Attendance

| Feature | Description | Benefits |
|---------|-------------|----------|
| **Digital Timeclock** | Web and mobile clock in/out | Accurate time tracking |
| **GPS Verification** | Location-based punch verification | Prevent time fraud |
| **Overtime Management** | Request and approval workflow | Compliance management |
| **Automatic Alerts** | Missing punches and overtime alerts | Reduce payroll errors |

### Analytics & Reporting

- **📈 Real-time Analytics**: Live workforce metrics and KPIs
- **📊 Department Insights**: Performance by department and team
- **👥 Employee Engagement**: Track satisfaction and retention metrics
- **💼 Project Analytics**: Monitor project progress and team efficiency
- **📋 Compliance Reports**: Generate reports for auditing and compliance

## 🔧 Multi-Tenant Configuration

### Organization Setup

Each organization gets:
- **Isolated Database**: Complete data separation using Firestore subcollections
- **Custom Branding**: Organization-specific theming and branding
- **Role Management**: Admin-defined roles and permissions
- **Feature Controls**: Enable/disable features per organization

### Security Model

```javascript
// Firebase Security Rules Example
match /organizations/{organizationId} {
  allow read, write: if belongsToOrganization(organizationId) && isAuthenticated();
  
  match /employees/{employeeId} {
    allow read: if belongsToOrganization(organizationId);
    allow write: if belongsToOrganization(organizationId) && 
                    (isAdmin() || isManager());
  }
}
```

## 🔐 Role-Based Access Control

### User Roles

| Role | Permissions | Access Level |
|------|-------------|--------------|
| **Super Admin** | Full system access | All features |
| **Admin** | Organization management | All org features |
| **Manager** | Team management | Employee mgmt, reports |
| **Employee** | Self-service features | Personal data, time tracking |

### Permission Matrix

- ✅ **Create/Edit Employees**: Admin, Manager
- ✅ **View Analytics**: Admin, Manager  
- ✅ **Manage Time-off**: Admin, Manager, Employee (own)
- ✅ **Clock In/Out**: All users
- ✅ **View Company Feed**: All users
- ✅ **Create Announcements**: Admin

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Firebase Development

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if needed)
firebase init

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy to Firebase Hosting (optional)
firebase deploy --only hosting
```

### Code Style

- **ESLint**: Configured for React and TypeScript
- **Prettier**: Automatic code formatting
- **TypeScript**: Strict type checking enabled
- **Firebase SDK v9**: Modular SDK for optimal bundle size

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Firebase** for the robust backend infrastructure
- **Radix UI** for accessible component primitives
- **shadcn/ui** for the beautiful component library
- **Tailwind CSS** for the utility-first styling approach
- **Lucide** for the comprehensive icon library

## 📞 Support

For questions, issues, or feature requests:
- **Issues**: [GitHub Issues](https://github.com/PrevailNetworks/nexus/issues)
- **Discussions**: [GitHub Discussions](https://github.com/PrevailNetworks/nexus/discussions)

---

**Nexus** - Empowering organizations with comprehensive workforce management.

Built with ❤️ by [Prevail Networks](https://github.com/PrevailNetworks)