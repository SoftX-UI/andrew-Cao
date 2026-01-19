
import { Mission, MissionStatus, MissionType, User, UserRole, NewsItem, MissionDifficulty, Ad, FeedbackItem, MailMessage } from './types';

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Adventurer Alex',
  role: UserRole.Student,
  level: 5,
  exp: 4500,
  location: 'New York Guild Hall',
  isPremium: false, // Set to true to see global missions
  verificationStatus: 'Unverified',
  tags: ['Fast Learner', 'Night Owl', 'Tech Savvy'],
  adminTags: ['Internal Note: Good Payer', 'Verified ID'],
  credits: 1250,
  email: 'alex.a@guild.net',
  phone: '+1 (555) 019-2834',
  visibility: {
    email: false,
    phone: false,
    location: true
  },
  contacts: [
    {
      id: 'u2',
      name: 'Gary',
      role: 'Student',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gary',
      status: 'Online',
      level: 4,
      profession: 'Rival',
      adminTags: ['Watchlist', 'Aggressive']
    },
    {
      id: 'prof_oak',
      name: 'Prof. Oak',
      role: 'Professor',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oak',
      status: 'Busy',
      level: 50,
      profession: 'Researcher'
    },
    {
      id: 'merch_anna',
      name: 'Anna the Merchant',
      role: 'Professional',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
      status: 'Away',
      level: 12,
      profession: 'Trader'
    }
  ]
};

export const ADMIN_USER: User = {
  id: 'admin_01',
  name: 'Grand Master Solon',
  role: UserRole.Admin,
  level: 99,
  exp: 9999999,
  location: 'Central Command',
  isPremium: true,
  verificationStatus: 'Verified',
  tags: ['Administrator', 'System Control', 'Omnipotent'],
  credits: 5000000,
  email: 'admin.solon@guild.hq',
  phone: 'ENCRYPTED',
  visibility: {
    email: true,
    phone: false,
    location: false
  },
  contacts: []
};

export const ISSUER_USER: User = {
  id: 'issuer_01',
  name: 'Apex Logistics Inc.',
  role: UserRole.Professional,
  level: 45,
  exp: 350000,
  location: 'Trade District HQ',
  isPremium: true,
  verificationStatus: 'Verified',
  tags: ['VIP Client', 'Bulk Hiring', 'Wealthy'],
  adminTags: ['High Value', 'Fast Processing'],
  credits: 2500000,
  email: 'contracts@apex.logistics',
  phone: '+1 (800) APEX-HQ',
  visibility: {
    email: true,
    phone: true,
    location: true
  },
  contacts: []
};

export const PRESET_USERS = [CURRENT_USER, ADMIN_USER, ISSUER_USER];

export const ISSUERS: Record<string, string> = {
  'corp1': 'Global Logistics Corp',
  'prof_oak': 'Prof. Oak',
  'city_hall': 'City Municipality',
  'vip_agent': 'Elite Security Services',
  'tech_inc': 'TechGiant Inc.',
  'ops_team': 'Central Ops Command',
  'guild_master': 'Grand Guild Master',
  'u1': 'Adventurer Alex',
  'u2': 'Gary',
  'issuer_01': 'Apex Logistics Inc.'
};

export const DIFFICULTY_RANKS = [
  MissionDifficulty.Rank_E,
  MissionDifficulty.Rank_D,
  MissionDifficulty.Rank_C,
  MissionDifficulty.Rank_B,
  MissionDifficulty.Rank_A,
  MissionDifficulty.Rank_S,
];

export const STATUS_COLORS: Record<MissionStatus, string> = {
  [MissionStatus.Open]: 'bg-blue-100 text-blue-700 border-blue-200',
  [MissionStatus.Claimed]: 'bg-purple-100 text-purple-700 border-purple-200',
  [MissionStatus.InProgress]: 'bg-amber-100 text-amber-700 border-amber-200',
  [MissionStatus.Verifying]: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  [MissionStatus.Verified]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  [MissionStatus.Completed]: 'bg-green-100 text-green-700 border-green-200',
  [MissionStatus.Hold]: 'bg-orange-100 text-orange-700 border-orange-200',
  [MissionStatus.Urgent]: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
  [MissionStatus.Expired]: 'bg-slate-100 text-slate-500 border-slate-200'
};

export const DIFFICULTY_COLORS: Record<MissionDifficulty, string> = {
  [MissionDifficulty.Rank_E]: 'bg-slate-100 text-slate-600',
  [MissionDifficulty.Rank_D]: 'bg-green-100 text-green-700',
  [MissionDifficulty.Rank_C]: 'bg-blue-100 text-blue-700',
  [MissionDifficulty.Rank_B]: 'bg-indigo-100 text-indigo-700',
  [MissionDifficulty.Rank_A]: 'bg-purple-100 text-purple-700',
  [MissionDifficulty.Rank_S]: 'bg-rose-100 text-rose-700 font-bold border-rose-200 border'
};

export const TYPE_ICONS: Record<MissionType, string> = {
  [MissionType.Logistics]: '📦',
  [MissionType.Analysis]: '🔍',
  [MissionType.Security]: '🛡️',
  [MissionType.Sourcing]: '🛒',
  [MissionType.HR]: '👥',
  [MissionType.Volunteer]: '🤝',
  [MissionType.CriticalOps]: '🚨',
  [MissionType.Audit]: '📊',
  [MissionType.ClientRelations]: '💼',
  [MissionType.Engineering]: '⚙️',
  [MissionType.Training]: '📚',
  [MissionType.Events]: '🎉',
  [MissionType.OnSite]: '🏗️',
  [MissionType.Creative]: '🎨',
  [MissionType.Seasonal]: '❄️',
  [MissionType.Exploration]: '🧭',
  [MissionType.Diplomacy]: '🕊️',
  [MissionType.Bounty]: '🎯',
  [MissionType.Medical]: '⚕️',
  [MissionType.Stealth]: '🥷',
  [MissionType.Survival]: '🔥',
  [MissionType.Investigation]: '🕵️',
  [MissionType.CyberSec]: '💻',
};

export const TYPE_COLORS: Record<MissionType, string> = {
  [MissionType.Logistics]: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  [MissionType.Analysis]: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  [MissionType.Security]: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  [MissionType.Sourcing]: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  [MissionType.HR]: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  [MissionType.Volunteer]: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
  [MissionType.CriticalOps]: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  [MissionType.Audit]: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  [MissionType.ClientRelations]: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  [MissionType.Engineering]: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  [MissionType.Training]: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800',
  [MissionType.Events]: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  [MissionType.OnSite]: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
  [MissionType.Creative]: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-800',
  [MissionType.Seasonal]: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  [MissionType.Exploration]: 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-900/30 dark:text-stone-300 dark:border-stone-800',
  [MissionType.Diplomacy]: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  [MissionType.Bounty]: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
  [MissionType.Medical]: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900',
  [MissionType.Stealth]: 'bg-slate-800 text-slate-200 border-slate-700 dark:bg-black dark:text-slate-400 dark:border-slate-800',
  [MissionType.Survival]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  [MissionType.Investigation]: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  [MissionType.CyberSec]: 'bg-emerald-950 text-emerald-400 border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
};

export const AD_THEMES: Record<string, string> = {
  sunset: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
  forest: 'bg-gradient-to-r from-emerald-500 to-green-700',
  ocean: 'bg-gradient-to-r from-blue-500 to-cyan-400',
  gold: 'bg-gradient-to-r from-amber-400 to-yellow-600',
  royal: 'bg-gradient-to-r from-purple-600 to-indigo-800',
  midnight: 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900',
  crimson: 'bg-gradient-to-r from-red-600 to-rose-800',
};

export const MOCK_ADS: Ad[] = [
  {
    id: 'ad1',
    sponsorName: 'Smithy & Sons',
    content: '50% OFF ON ALL ARMOR THIS WEEKEND',
    colorTheme: 'sunset',
    isActive: true,
    startDate: new Date().toISOString(),
    link: '#'
  },
  {
    id: 'ad2',
    sponsorName: 'The Potion Lab',
    content: 'Buy 2 Health Potions, Get 1 Mana Potion FREE!',
    colorTheme: 'forest',
    isActive: false,
    startDate: new Date().toISOString(),
    link: '#'
  },
  {
    id: 'ad3',
    sponsorName: 'Arcane Travel',
    content: 'Fast travel points now open in the Frostpeaks region!',
    colorTheme: 'ocean',
    isActive: false,
    startDate: new Date().toISOString(),
    link: '#'
  }
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: 'n1',
    title: 'System Maintenance Scheduled',
    content: 'The guild servers will undergo maintenance tonight at 02:00 AM EST. Expected downtime is 30 minutes.',
    date: new Date().toISOString(),
    type: 'maintenance',
    priority: 'medium'
  },
  {
    id: 'n2',
    title: 'New Region Unlocked: Frostpeaks',
    content: 'The path to Frostpeaks is now open for adventurers Rank C and above. Check the mission board for new opportunities.',
    date: new Date(Date.now() - 86400000).toISOString(),
    type: 'update',
    priority: 'high'
  },
  {
    id: 'n3',
    title: 'Community Event: Winter Festival',
    content: 'Join us in the Central Plaza for the annual Winter Festival. Double EXP for all seasonal missions!',
    date: new Date(Date.now() - 172800000).toISOString(),
    type: 'event',
    priority: 'low'
  },
  {
    id: 'n4',
    title: 'Policy Update: Tax Withholding',
    content: 'Please review the updated tax withholding rates for fiscal year 2025 in your profile settings.',
    date: new Date(Date.now() - 259200000).toISOString(),
    type: 'notice',
    priority: 'medium'
  }
];

export const MOCK_FEEDBACKS: FeedbackItem[] = [
  {
    id: 'f1',
    userId: 'u2',
    userName: 'Gary',
    type: 'report',
    targetId: 'm5',
    content: 'The issuer refused to pay after I completed the task perfectly.',
    status: 'Pending',
    timestamp: new Date(Date.now() - 100000).toISOString()
  },
  {
    id: 'f2',
    userId: 'u3',
    userName: 'Rogue123',
    type: 'bug',
    content: 'The map flickers when I enter the Frostpeaks region.',
    status: 'In Progress',
    adminResponse: 'We are aware of the graphical glitch. Patch incoming.',
    timestamp: new Date(Date.now() - 500000).toISOString()
  },
  {
    id: 'f3',
    userId: 'merch_anna',
    userName: 'Anna the Merchant',
    type: 'feedback',
    content: 'The new tax calculator is very helpful for my business. Thanks!',
    status: 'Resolved',
    adminResponse: 'Glad to hear it!',
    timestamp: new Date(Date.now() - 86400000).toISOString()
  }
];

export const MOCK_MAIL: MailMessage[] = [
  {
    id: 'mail_1',
    senderId: 'system',
    senderName: 'Guild Command',
    senderRole: 'System',
    subject: 'Welcome to Nova Core',
    content: 'Welcome, Adventurer. Your registration is complete. Please complete your profile to access higher rank missions. As a member of the guild, you are expected to uphold the code of conduct.',
    timestamp: new Date(Date.now() - 10000000).toISOString(),
    isRead: true,
    type: 'system',
    priority: 'high'
  },
  {
    id: 'mail_2',
    senderId: 'issuer_01',
    senderName: 'Apex Logistics Inc.',
    senderRole: 'Issuer',
    subject: 'Mission Update: #M921',
    content: 'We have reviewed your submission for the Urgent Delivery mission. Payment has been released to your account. Excellent work on the delivery time.',
    timestamp: new Date(Date.now() - 8640000).toISOString(),
    isRead: false,
    type: 'mission',
    relatedMissionId: 'm1',
    priority: 'normal'
  },
  {
    id: 'mail_3',
    senderId: 'u2',
    senderName: 'Gary',
    senderRole: 'Student',
    subject: 'About the raid',
    content: 'Are you joining the raid this weekend? We need a tank for the Frostpeaks dungeon. Let me know if you are interested.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
    type: 'personal',
    priority: 'normal'
  },
  {
    id: 'mail_4',
    senderId: 'system',
    senderName: 'Tax Office',
    senderRole: 'Admin',
    subject: 'Monthly Tax Summary',
    content: 'Your estimated tax withholding for this month has been updated based on your recent mission completions. Please review your fiscal summary in the Profile tab.',
    timestamp: new Date(Date.now() - 43200000).toISOString(),
    isRead: false,
    type: 'guild',
    priority: 'normal'
  }
];

export const MOCK_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Urgent: Deliver Confidential Documents',
    description: 'A sealed envelope needs to be transported to the Downtown branch within 2 hours. High stealth required.',
    location: 'New York Guild Hall',
    reward: 500,
    type: MissionType.Logistics,
    difficulty: MissionDifficulty.Rank_D,
    status: MissionStatus.Urgent,
    postedDate: new Date(Date.now() - 3600000).toISOString(),
    expiryDate: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
    issuerId: 'corp1',
    issuerVerified: true,
    tags: ['Speed', 'Trust'],
    requiredLevel: 2,
    isRemote: false,
    comments: [],
    history: [
      {
        previousStatus: MissionStatus.Open,
        newStatus: MissionStatus.Urgent,
        changedBy: 'Global Logistics Corp',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        reason: 'Client escalated priority'
      }
    ]
  },
  {
    id: 'm2',
    title: 'Research Analysis: Ancient Code',
    description: 'Decipher the legacy codebase for the new migration project. Remote work allowed.',
    location: 'Virtual',
    reward: 1200,
    type: MissionType.Analysis,
    difficulty: MissionDifficulty.Rank_B,
    status: MissionStatus.Open,
    postedDate: new Date(Date.now() - 86400000).toISOString(),
    expiryDate: new Date(Date.now() + 604800000).toISOString(),
    issuerId: 'prof_oak',
    issuerVerified: true,
    tags: ['Coding', 'Patience'],
    requiredLevel: 5,
    isRemote: true,
    comments: [
      { id: 'c1', userId: 'u2', userName: 'Gary', text: 'Is this COBOL or Fortran?', timestamp: new Date().toISOString() }
    ],
    history: [
       {
        previousStatus: MissionStatus.Open,
        newStatus: MissionStatus.Open,
        changedBy: 'Prof. Oak',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        reason: 'Mission Created'
      }
    ]
  },
  {
    id: 'm3',
    title: 'Local Park Cleanup (Charity)',
    description: 'Join the community to clean up Central Park. Reward is purely Karma and tax deduction credits.',
    location: 'New York Guild Hall',
    reward: 0,
    type: MissionType.Volunteer,
    difficulty: MissionDifficulty.Rank_E,
    status: MissionStatus.Open,
    postedDate: new Date(Date.now() - 100000).toISOString(),
    expiryDate: new Date(Date.now() + 86400000).toISOString(),
    issuerId: 'city_hall',
    issuerVerified: true,
    tags: ['Community', 'Nature'],
    requiredLevel: 1,
    isRemote: false,
    comments: [],
    history: []
  },
  {
    id: 'm4',
    title: 'Security Detail for VIP',
    description: 'Escort a visiting dignitary from the airport to the hotel. Danger level: Low.',
    location: 'Los Angeles Guild Hall',
    reward: 3000,
    type: MissionType.Security,
    difficulty: MissionDifficulty.Rank_A,
    status: MissionStatus.Open,
    postedDate: new Date(Date.now() - 200000).toISOString(),
    expiryDate: new Date(Date.now() + 400000000).toISOString(),
    issuerId: 'vip_agent',
    issuerVerified: false,
    tags: ['Strength', 'Alertness'],
    requiredLevel: 10,
    isRemote: false,
    comments: [],
    history: []
  },
  {
    id: 'm5',
    title: 'Mentorship: Junior Dev',
    description: 'Guide a new joiner through their first sprint.',
    location: 'New York Guild Hall',
    reward: 800,
    type: MissionType.HR,
    difficulty: MissionDifficulty.Rank_C,
    status: MissionStatus.InProgress,
    postedDate: new Date(Date.now() - 5000000).toISOString(),
    expiryDate: new Date(Date.now() + 100000000).toISOString(),
    issuerId: 'tech_inc',
    issuerVerified: true,
    tags: ['Teaching', 'Kindness'],
    requiredLevel: 7,
    isRemote: true,
    comments: [],
    history: [
        {
        previousStatus: MissionStatus.Open,
        newStatus: MissionStatus.InProgress,
        changedBy: 'Adventurer Alex',
        timestamp: new Date(Date.now() - 1000000).toISOString(),
        reason: 'Accepted mission'
      }
    ]
  },
  {
    id: 'm6',
    title: 'Emergency: Server Outage Recovery',
    description: 'Critical system failure at Data Center 4. Immediate onsite assistance required.',
    location: 'New York Guild Hall',
    reward: 2000,
    type: MissionType.CriticalOps,
    difficulty: MissionDifficulty.Rank_B,
    status: MissionStatus.Urgent,
    postedDate: new Date(Date.now() - 1800000).toISOString(),
    expiryDate: new Date(Date.now() + 3600000).toISOString(),
    issuerId: 'ops_team',
    issuerVerified: true,
    tags: ['DevOps', 'Crisis'],
    requiredLevel: 8,
    isRemote: false,
    comments: [],
    history: []
  },
  {
    id: 'm7',
    title: 'Client Negotiation: Trade Deal',
    description: 'Represent the guild in negotiating a new supply contract with the eastern merchants.',
    location: 'Frostpeaks',
    reward: 1500,
    type: MissionType.ClientRelations,
    difficulty: MissionDifficulty.Rank_C,
    status: MissionStatus.Open,
    postedDate: new Date(Date.now() - 400000).toISOString(),
    expiryDate: new Date(Date.now() + 864000000).toISOString(),
    issuerId: 'guild_master',
    issuerVerified: true,
    tags: ['Speech', 'Barter'],
    requiredLevel: 6,
    isRemote: false,
    comments: [],
    history: []
  },
  {
    id: 'm8',
    title: 'Winter Ops: Grand Plaza Snow Clear',
    description: 'The annual Winter Festival is approaching. We need a team to clear the Grand Plaza of snow and set up ice sculptures.',
    location: 'Frostpeaks',
    reward: 450,
    type: MissionType.Seasonal,
    difficulty: MissionDifficulty.Rank_D,
    status: MissionStatus.Open,
    postedDate: new Date(Date.now() - 7200000).toISOString(),
    expiryDate: new Date(Date.now() + 259200000).toISOString(),
    issuerId: 'city_hall',
    issuerVerified: true,
    tags: ['Winter', 'Strength', 'Festival'],
    requiredLevel: 3,
    isRemote: false,
    comments: [],
    history: []
  }
];
