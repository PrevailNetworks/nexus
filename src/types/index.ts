import { Timestamp, GeoPoint } from 'firebase/firestore';

export { Timestamp, GeoPoint };

export const Role = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type Role = typeof Role[keyof typeof Role];

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface LoginCustomization {
    logoUrl?: string;
    backgroundColor?: string;
    primaryColor?: string;
    welcomeMessage?: string;
}

export type PayPeriodFrequency = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';

export interface AuditEntry {
  editorId: string;
  editorName: string;
  changeReason: string;
  previousPunchTime: Timestamp;
  editedAt: Timestamp;
}

export interface AuditChange {
    field: string;
    oldValue: any;
    newValue: any;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  actorId: string; // user who performed action
  actorName: string;
  action: string; // e.g., 'user.invite', 'shift.create'
  target?: {
    type: string;
    id: string;
    name?: string;
  };
  entityType?: string;
  changes?: AuditChange[];
  timestamp: Timestamp;
  details?: Record<string, any>;
}

export type DailyHours = {
  isOpen: boolean;
  open: string; // "HH:mm"
  close: string; // "HH:mm"
};

export type OperatingHours = {
  [day: string]: DailyHours;
};

export interface Organization {
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  settings?: {
    enablePhotoOnPunch?: boolean;
    enableGpsTracking?: boolean;
    loginCustomization?: LoginCustomization;
    operatingHours?: OperatingHours;
    payroll?: {
        payPeriodFrequency: PayPeriodFrequency;
        overtimeThresholdHours?: number; // Weekly threshold
        doubleTimeThresholdHours?: number; // Weekly threshold
    };
    timeOffPolicies?: {
        leaveTypes: string[];
    };
    autoClockOut?: {
        enabled: boolean;
        time: string; // "HH:mm"
    };
    phone?: string;
    dateFormat?: string; // 'Month/Day/Year' etc.
    teamSize?: string; // '1-10', '11-50' etc.
    timezone?: string;
  };
}

export const DocumentType = {
    IDENTIFICATION: 'Identification',
    RESUME: 'Resume',
    CERTIFICATIONS: 'Certifications',
    LICENSES: 'Licenses',
    CONTRACTS: 'Contracts',
    PERFORMANCE_REVIEW: 'Performance Review',
    OTHER: 'Other',
} as const;

export type DocumentType = typeof DocumentType[keyof typeof DocumentType];

export interface EmployeeDocument {
    id: string; // Firestore document ID
    friendlyName: string;
    storagePath: string; // Path in Firebase Storage
    originalFilename: string;
    documentType: DocumentType;
    uploadTimestamp: Timestamp;
    uploadedBy: string; // UID of uploader
    uploadedByName: string; // Name of uploader
    fileType: string; // e.g., 'image/png', 'application/pdf' for icon/thumbnail logic
    downloadURL: string;
}

export interface TrainingRecord {
    id: string;
    name: string;
    completedDate: Timestamp;
    status: 'completed' | 'pending';
    documentUrl?: string;
    documentName?: string;
}

export const OvertimeStatus = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const;

export type OvertimeStatus = typeof OvertimeStatus[keyof typeof OvertimeStatus];

export interface OvertimeRequest {
    id: string;
    userId: string;
    organizationId: string;
    requestDate: Timestamp;
    overtimeDate: Timestamp;
    startTime: Timestamp;
    endTime: Timestamp;
    durationHours: number;
    reason: string;
    status: OvertimeStatus;
    approverId?: string;
    approverName?: string;
    approvedAt?: Timestamp;
}

export interface AppUser {
  uid: string; // The Firebase Authentication UID. This is the primary key.
  organizationId: string;
  email: string | null;
  role: Role;
  displayName: string | null;
  photoURL?: string | null;
  status?: 'active' | 'disabled' | 'inactive';
  firstName?: string;
  lastName?: string;
  department?: string; // Corresponds to departmentCode for reporting/filtering
  position?: string;
  hireDate?: Timestamp | null;
  managerId?: string;
  teams?: string[]; // New: List of team IDs the user belongs to
  feedLastSeen?: Timestamp; // New: Timestamp of the last feed visit

  // from edit employee tabs
  profileColor?: string;
  username?: string;
  employeeId?: string;
  quickClockInPin?: string;

  location?: {
      addressLine?: string;
      city?: string;
      state?: string;
      zip?: string;
  };
   phone?: {
      cell?: string;
      work?: string;
      home?: string;
  };
   emergencyContact?: {
      name?: string;
      phone?: string;
      role?: string;
  };
   ptoBalances?: {
      [leaveType: string]: number;
  };
  payroll?: {
      paidType?: 'hourly' | 'salary';
      payWage?: string;
      breakSetting?: 'paid' | 'unpaid';
      timeRounding?: 'exact' | '15min' | '6min';
      reimbursementSettings?: {
          mileageRate?: number;
          requireReceipt?: boolean;
      };
  };
  punchSettings?: {
    allowMobile: boolean;
    trackGps: boolean;
    exemptFromAutoClockOut?: boolean;
  };
   notifications?: {
      primaryEmail?: string;
      secondaryEmail?: string;
      alertOnClockIn?: boolean;
      alertOnClockOut?: boolean;
  };
   scheduleSettings?: {
      allowedDeviationMinutes?: number;
      emailWeeklySchedule?: boolean;
      emailMonthlySchedule?: boolean;
  };

  // Contract tab fields
  contractId?: string;
  contractCountry?: string;
  taxResidencyDate?: Timestamp | null;
  contractEndDate?: Timestamp | null;
  jobLevel?: string;
  expectedWorkHours?: number; // per week
  employmentStatus?: 'Fulltime' | 'Part-time' | 'Contract';
  workingScope?: string; // a long text/markdown field
  firstPaymentAmount?: number;
  
  // New fields for Document and Training tabs
  trainings?: TrainingRecord[];
  onboardingCompleted?: boolean;
}

export const TimePunchType = {
    IN: 'in',
    OUT: 'out',
    BREAK_START: 'break_start',
    BREAK_END: 'break_end',
} as const;

export type TimePunchType = typeof TimePunchType[keyof typeof TimePunchType];

export interface TimePunch {
    id: string;
    userId: string;
    organizationId: string;
    punchTime: Timestamp;
    type: TimePunchType;
    isAutoClockOut: boolean;
    auditTrail?: AuditEntry[]; // Equivalent to isEdited/editHistory
    comment?: string;
    location?: GeoPoint;
    photoUrl?: string;
    ipAddress?: string;
    deviceUsed?: string;
    locationCode?: string; // For job costing
    departmentCode?: string; // For job costing
}

export interface Shift {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  startTime: Timestamp;
  endTime: Timestamp;
  title?: string;
  notes?: string;
  color?: string;
}

export const PTOStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  CANCELLED: 'cancelled',
} as const;

export type PTOStatus = typeof PTOStatus[keyof typeof PTOStatus];

export interface PTORequest {
  id: string;
  userId: string;
  userName: string;
  organizationId: string;
  leaveType: string;
  startDate: Timestamp;
  endDate: Timestamp;
  days: number;
  status: PTOStatus;
  reason?: string;
  approverId?: string;
  approvedAt?: Timestamp;
  createdAt: Timestamp;
  managerId?: string;
  managerNotes?: string;
  cancellationReason?: string;
}

export type PTORequestFormData = {
    startDate: string;
    endDate: string;
    leaveType: string;
    reason: string;
};

export const TimesheetStatus = {
  OPEN: 'open',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type TimesheetStatus = typeof TimesheetStatus[keyof typeof TimesheetStatus];

export interface Timesheet {
  id: string;
  userId: string;
  userName:string;
  organizationId: string;
  payPeriodStart: Timestamp;
  payPeriodEnd: Timestamp;
  status: TimesheetStatus;
  totalHours?: number;
  submittedAt?: Timestamp;
  approverId?: string;
  approverName?: string;
}

export interface Invite {
    id: string;
    email: string;
    displayName: string;
    role: Role;
    organizationId: string;
    organizationName: string;
    createdAt: Timestamp;
}

export type Priority = 'high' | 'medium' | 'low';

export const TaskStatus = {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress', 
    COMPLETED: 'completed',
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export type ProjectViewType = 'board' | 'list' | 'calendar';

export interface Project {
    id: string;
    organizationId: string;
    name: string;
    description?: string;
    ownerId: string;
    memberIds: string[];
    priority?: Priority;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    startDate?: Timestamp;
    endDate?: Timestamp;
    view?: ProjectViewType;
    color?: string;
}

export interface Section {
    id: string;
    name: string;
    order: number;
    createdAt: Timestamp;
}

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

export interface TaskComment {
    id: string;
    userId: string;
    userName: string;
    userPhotoURL?: string;
    text: string;
    createdAt: Timestamp;
}

export interface TaskAttachment {
    id: string;
    name: string;
    url: string;
    uploadedAt: Timestamp;
}

export interface Task {
    id: string;
    organizationId: string;
    projectId: string;
    sectionId: string;
    parentTaskId?: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: Priority;
    progress?: number;
    assigneeIds: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    startDate?: Timestamp;
    dueDate?: Timestamp;
    notes?: string;
    assignerId?: string;
    assignerName?: string;
    completedAt?: Timestamp;
    subtasks?: Subtask[];
    comments?: TaskComment[];
    attachments?: TaskAttachment[];
}

export interface UserWithStatus extends AppUser {
    currentStatus: 'Clocked In' | 'On Break' | 'Clocked Out';
    lastPunchTime: Timestamp | null;
    lastPunchType: TimePunchType | null;
    lastMessage?: string;
}


export interface OvertimeRequest {
  id: string;
  userId: string;
  organizationId: string;
  requestDate: Timestamp;
  overtimeDate: Timestamp;
  startTime: Timestamp;
  endTime: Timestamp;
  durationHours: number;
  reason: string;
  status: OvertimeStatus;
  approverId?: string;
  approverName?: string;
  approvedAt?: Timestamp;
}

export interface KnowledgeBaseArticle {
  id: string; // Firestore document ID
  organizationId: string;
  title: string;
  category: string;
  content: string; // Markdown content
  tags: string[];
  createdAt: Timestamp;
}

export interface Announcement {
  id: string;
  organizationId: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// New types for Feed & Teams
export interface Team {
    id: string;
    organizationId: string;
    teamName: string;
    memberIds: string[];
}

export interface FeedPostMention {
    userIds: string[];
    teamIds: string[];
}

export interface FeedPost {
    id: string;
    organizationId: string;
    authorId: string;
    content: string;
    imageUrl?: string;
    mentions: FeedPostMention;
    visibility: 'everyone' | 'teams' | 'users';
    createdAt: Timestamp;
    lastEditedAt?: Timestamp;
    scheduledAt?: Timestamp;
    locationName?: string;
    locationCoords?: GeoPoint;
    reactions?: { [emoji: string]: string[] }; // emoji -> array of userIds
    parentPostId?: string;
    replyCount?: number;
}

// Firebase collections constants
export const FIRESTORE_COLLECTIONS = {
  ORGANIZATIONS: 'organizations',
  USERS: 'users',
  TIMEPUNCHES: 'timePunches',
  SHIFTS: 'shifts',
  PTO_REQUESTS: 'ptoRequests',
  TIMESHEETS: 'timesheets',
  INVITES: 'invites',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  AUDIT_LOGS: 'auditLogs',
  OVERTIME_REQUESTS: 'overtimeRequests',
  KNOWLEDGE_BASE: 'knowledgeBase',
  TEAMS: 'teams',
  FEED: 'feed',
  DOCUMENTS: 'documents',
  ANNOUNCEMENTS: 'announcements',
} as const;