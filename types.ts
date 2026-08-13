
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  preferredTranslationLanguage?: string;
  autoDetectLanguage?: boolean;
  soundVolume?: number;
  notificationsEnabled?: boolean;
}

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export type VerificationStatus = 'Unverified' | 'Pending' | 'Verified' | 'Rejected';

export enum UserRole {
  Student = 'Student',
  Professional = 'Professional',
  Professor = 'Professor',
  Staff = 'Staff',
  ForestWarden = 'Forest Warden', // Premium role example
  Admin = 'Guild Administrator'
}

export enum MissionStatus {
  Open = 'Open',
  Claimed = 'Claimed',
  InProgress = 'InProgress',
  Verifying = 'Verifying',
  Verified = 'Verified',
  Completed = 'Completed',
  Hold = 'Hold',
  Urgent = 'Urgent Hiring',
  Expired = 'Expired'
}

export enum MissionType {
  Logistics = 'Logistics',
  Analysis = 'Analysis',
  Security = 'Security',
  Sourcing = 'Sourcing',
  HR = 'HR/Guidance',
  Volunteer = 'Volunteer',
  CriticalOps = 'Critical Ops',
  Audit = 'Audit/Debug',
  ClientRelations = 'Client Relations',
  Engineering = 'Engineering',
  Training = 'Training',
  Events = 'Events',
  OnSite = 'On-site',
  Creative = 'Design/Art',
  Seasonal = 'Seasonal',
  // New Categories
  Exploration = 'Exploration',
  Diplomacy = 'Diplomacy',
  Bounty = 'Bounty Hunting',
  Medical = 'Medical/Rescue',
  Stealth = 'Covert Ops',
  Survival = 'Survival',
  Investigation = 'Investigation',
  CyberSec = 'Cyber Security'
}

export enum MissionDifficulty {
  Rank_E = 'Rank E', // Novice
  Rank_D = 'Rank D', // Easy
  Rank_C = 'Rank C', // Medium
  Rank_B = 'Rank B', // Hard
  Rank_A = 'Rank A', // Expert
  Rank_S = 'Rank S'  // Legendary
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  status: 'Online' | 'Offline' | 'Busy' | 'Away';
  level: number;
  profession?: string; // Specific job title if applicable
  adminTags?: string[]; // Internal tags visible only to admins
}

export interface EnvironmentalData {
  temperature?: string;
  weather?: string;
  visibility?: string;
  terrain?: string;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  level: number;
  exp: number;
  location: string;
  isPremium: boolean;
  verificationStatus: VerificationStatus;
  avatarUrl?: string;
  tags: string[];
  adminTags?: string[]; // Internal tags visible only to admins
  credits: number; // Currency
  contacts: Contact[];
  email?: string;
  phone?: string;
  visibility: {
    email: boolean;
    phone: boolean;
    location: boolean;
  };
}

export interface MissionHistory {
  previousStatus: MissionStatus;
  newStatus: MissionStatus;
  changedBy: string;
  timestamp: string;
  reason?: string;
}

export interface VirtualCoordinates {
  platform: 'Zoom' | 'Google Meet' | 'Discord' | 'Microsoft Teams' | 'Custom';
  link: string;
  roomId?: string;
  password?: string;
  isCertifiedPartner?: boolean;
  passcodeVisibility?: 'public' | 'limited'; // Control viewing standards
}

export interface MissionCompletionSummary {
  voiceSummary: string;
  sentiment: 'Positive' | 'Neutral' | 'Urgent / Caution' | 'Negative' | 'Triumphant';
  sentimentScore: number;
  keywords: string[];
  keyTakeaways: string[];
  lastUpdated: string;
  authorName?: string;
  rawTranscript?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  location: string;
  reward: number;
  customReward?: string;
  type: MissionType;
  difficulty: MissionDifficulty;
  status: MissionStatus;
  postedDate: string;
  expiryDate: string;
  issuerId: string;
  issuerVerified?: boolean;
  assigneeId?: string;
  tags: string[];
  requiredLevel: number;
  isRemote: boolean;
  comments: Comment[];
  proofUrl?: string;
  history: MissionHistory[];
  virtualCoordinates?: VirtualCoordinates;
  environmentalData?: EnvironmentalData;
  completionSummary?: MissionCompletionSummary;
  adminVerification?: {
    isPassed: boolean;
    verifiedBy: string;
    verifiedAt: string;
    notes?: string;
  };
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  senderName?: string; // Display name for the sender (e.g., "Receptionist", "Rogue_01")
  text: string;
  timestamp: number;
  isTyping?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'notice' | 'update' | 'event' | 'maintenance';
  priority: 'low' | 'medium' | 'high';
}

export interface Ad {
  id: string;
  sponsorName: string;
  content: string;
  colorTheme: 'sunset' | 'forest' | 'ocean' | 'gold' | 'royal' | 'midnight' | 'crimson';
  isActive: boolean;
  link?: string;
  startDate?: string;
  endDate?: string;
}

export interface FeedbackItem {
  id: string;
  userId: string;
  userName: string;
  type: 'feedback' | 'report' | 'bug';
  targetId?: string; // Optional target (user ID or mission ID reported)
  content: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Dismissed';
  adminResponse?: string; // Feedback from admin regarding the process
  timestamp: string;
}

export interface MailMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'system' | 'mission' | 'personal' | 'guild';
  relatedMissionId?: string;
  priority?: 'low' | 'normal' | 'high';
  isDeleted?: boolean;
}

export interface AdminLog {
  id: string;
  adminName: string;
  action: string; // e.g., "Verified Mission", "Banned User", "Deleted Ad"
  targetId: string; // Mission ID, User ID, etc.
  details?: string;
  timestamp: string;
}

export interface ChronicleEntry {
  id: string;
  title: string;
  category: 'Personal Log' | 'Guild Saga' | 'Mission Debrief' | 'World Lore';
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  timestamp: string;
  tags: string[];
  significance: 'Minor' | 'Notable' | 'Historic' | 'Legendary';
  isBookmarked?: boolean;
  relatedMissionId?: string;
  likesCount?: number;
  isAiGenerated?: boolean;
  visibility: 'Public' | 'Guild Only' | 'Private';
}

