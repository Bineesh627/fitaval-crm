// Standalone API client for Fitaval CRM
// Provides persistent localStorage-backed data management and authentication
import { ASSETS } from '@/utils/imageUrl';

const STORAGE_KEYS = {
  MEMBERS: 'fitaval_members',
  PLANS: 'fitaval_plans',
  TRANSACTIONS: 'fitaval_transactions',
  TRAINERS: 'fitaval_trainers',
  GYM_PROFILE: 'fitaval_gym_profile',
  WALLET_TRANSACTIONS: 'fitaval_wallet_transactions',
  AUTH_USER: 'fitaval_auth_user',
  AUTH_TOKEN: 'fitaval_auth_token',
};

// Seed initial gym CRM data if not already present
function initStorage() {
  if (typeof window === 'undefined') return;

  const today = new Date();
  const formatDate = (date) => date.toISOString().split('T')[0];
  const shiftDays = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return formatDate(d);
  };

  // Migrate legacy external links to local assets if found
  const storedTrainers = localStorage.getItem(STORAGE_KEYS.TRAINERS);
  if (storedTrainers && storedTrainers.includes('unsplash.com')) {
    localStorage.removeItem(STORAGE_KEYS.TRAINERS);
  }
  const storedGym = localStorage.getItem(STORAGE_KEYS.GYM_PROFILE);
  if (storedGym && storedGym.includes('unsplash.com')) {
    localStorage.removeItem(STORAGE_KEYS.GYM_PROFILE);
  }

  // 1. Initial Membership Plans
  if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
    const initialPlans = [
      {
        id: 'plan_1',
        name: 'Monthly Basic',
        duration_days: 30,
        price: 1499,
        benefits: 'Gym floor access, standard locker use, 1 fitness evaluation',
        is_active: true,
        created_date: shiftDays(-60),
      },
      {
        id: 'plan_2',
        name: 'Quarterly Pro',
        duration_days: 90,
        price: 3999,
        benefits: 'Gym access + steam/sauna access + 2 personal training sessions',
        is_active: true,
        created_date: shiftDays(-50),
      },
      {
        id: 'plan_3',
        name: 'Annual Elite',
        duration_days: 365,
        price: 11999,
        benefits: 'Unlimited gym access, all group classes, monthly nutritionist consult, free gym kit',
        is_active: true,
        created_date: shiftDays(-40),
      },
      {
        id: 'plan_4',
        name: 'VIP All-Access',
        duration_days: 365,
        price: 18999,
        benefits: '24/7 access, reserved locker, weekly 1-on-1 PT, VIP lounge access, 5 guest passes',
        is_active: true,
        created_date: shiftDays(-30),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(initialPlans));
  }

  // 2. Initial Members
  if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
    const initialMembers = [
      {
        id: 'mem_1',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '+91 98234 56781',
        plan_id: 'plan_3',
        plan_name: 'Annual Elite',
        start_date: shiftDays(-120),
        expiry_date: shiftDays(245),
        status: 'active',
        source: 'walk-in',
        created_date: shiftDays(-120),
      },
      {
        id: 'mem_2',
        name: 'Priya Patel',
        email: 'priya.patel@example.com',
        phone: '+91 97123 45672',
        plan_id: 'plan_2',
        plan_name: 'Quarterly Pro',
        start_date: shiftDays(-85),
        expiry_date: shiftDays(5),
        status: 'expiring',
        source: 'referral',
        created_date: shiftDays(-85),
      },
      {
        id: 'mem_3',
        name: 'Amit Verma',
        email: 'amit.verma@example.com',
        phone: '+91 99876 54321',
        plan_id: 'plan_1',
        plan_name: 'Monthly Basic',
        start_date: shiftDays(-25),
        expiry_date: shiftDays(5),
        status: 'expiring',
        source: 'instagram',
        created_date: shiftDays(-25),
      },
      {
        id: 'mem_4',
        name: 'Sneha Reddy',
        email: 'sneha.reddy@example.com',
        phone: '+91 94455 66778',
        plan_id: 'plan_4',
        plan_name: 'VIP All-Access',
        start_date: shiftDays(-60),
        expiry_date: shiftDays(305),
        status: 'active',
        source: 'google',
        created_date: shiftDays(-60),
      },
      {
        id: 'mem_5',
        name: 'Vikram Singh',
        email: 'vikram.singh@example.com',
        phone: '+91 93322 11445',
        plan_id: 'plan_1',
        plan_name: 'Monthly Basic',
        start_date: shiftDays(-45),
        expiry_date: shiftDays(-15),
        status: 'inactive',
        source: 'walk-in',
        created_date: shiftDays(-45),
      },
      {
        id: 'mem_6',
        name: 'Ananya Deshmukh',
        email: 'ananya.d@example.com',
        phone: '+91 91234 88990',
        plan_id: 'plan_2',
        plan_name: 'Quarterly Pro',
        start_date: shiftDays(-30),
        expiry_date: shiftDays(60),
        status: 'active',
        source: 'website',
        created_date: shiftDays(-30),
      },
      {
        id: 'mem_7',
        name: 'Karan Mehra',
        email: 'karan.m@example.com',
        phone: '+91 98877 66554',
        plan_id: 'plan_1',
        plan_name: 'Monthly Basic',
        start_date: shiftDays(-10),
        expiry_date: shiftDays(20),
        status: 'active',
        source: 'walk-in',
        created_date: shiftDays(-10),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(initialMembers));
  }

  // 3. Initial Transactions
  if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
    const initialTransactions = [
      {
        id: 'tx_1',
        type: 'income',
        amount: 11999,
        category: 'Membership',
        payment_method: 'upi',
        date: formatDate(today),
        description: 'Annual Elite plan payment - Rahul Sharma',
        created_date: formatDate(today),
      },
      {
        id: 'tx_2',
        type: 'income',
        amount: 3999,
        category: 'Renewal',
        payment_method: 'card',
        date: shiftDays(-1),
        description: 'Quarterly Pro renewal - Priya Patel',
        created_date: shiftDays(-1),
      },
      {
        id: 'tx_3',
        type: 'expense',
        amount: 2500,
        category: 'Maintenance',
        payment_method: 'bank_transfer',
        date: shiftDays(-2),
        description: 'Treadmill belt servicing & lubricating',
        created_date: shiftDays(-2),
      },
      {
        id: 'tx_4',
        type: 'income',
        amount: 2500,
        category: 'Personal Training',
        payment_method: 'upi',
        date: shiftDays(-3),
        description: '10 Personal Training sessions add-on',
        created_date: shiftDays(-3),
      },
      {
        id: 'tx_5',
        type: 'expense',
        amount: 18000,
        category: 'Salary',
        payment_method: 'bank_transfer',
        date: shiftDays(-4),
        description: 'Trainer advance stipend payout',
        created_date: shiftDays(-4),
      },
      {
        id: 'tx_6',
        type: 'income',
        amount: 18999,
        category: 'Membership',
        payment_method: 'card',
        date: shiftDays(-5),
        description: 'VIP All-Access membership - Sneha Reddy',
        created_date: shiftDays(-5),
      },
      {
        id: 'tx_7',
        type: 'expense',
        amount: 4500,
        category: 'Electricity',
        payment_method: 'upi',
        date: shiftDays(-6),
        description: 'HVAC AC maintenance & electricity utility bill',
        created_date: shiftDays(-6),
      },
      {
        id: 'tx_8',
        type: 'income',
        amount: 1499,
        category: 'Membership',
        payment_method: 'cash',
        date: formatDate(today),
        description: 'Monthly Basic plan - Karan Mehra',
        created_date: formatDate(today),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initialTransactions));
  }

  // 4. Initial Trainers
  if (!localStorage.getItem(STORAGE_KEYS.TRAINERS)) {
    const initialTrainers = [
      {
        id: 'trn_1',
        name: 'Alex Carter',
        photo_url: ASSETS.trainers.alex,
        specialization: 'CrossFit & Functional Training',
        experience_years: 7,
        certifications: 'CrossFit Level 2, ACE Certified Personal Trainer, CPR/AED',
        bio: 'Passionate about athletic performance, functional movement mechanics, and high-intensity conditioning.',
        created_date: shiftDays(-90),
      },
      {
        id: 'trn_2',
        name: 'Sarah Jenkins',
        photo_url: ASSETS.trainers.sarah,
        specialization: 'Strength & Hypertrophy Coach',
        experience_years: 5,
        certifications: 'CSCS (NSCA), ISSA Bodybuilding Specialist',
        bio: 'Helping clients build sustainable strength, lean muscle mass, and progressive overload discipline.',
        created_date: shiftDays(-75),
      },
      {
        id: 'trn_3',
        name: 'Vikram Malhotra',
        photo_url: ASSETS.trainers.vikram,
        specialization: 'Mobility, Yoga & Rehab',
        experience_years: 9,
        certifications: 'RYT 500 Yoga Alliance, FMS Functional Movement Screen',
        bio: 'Specialist in postural correction, mobility enhancement, and injury rehabilitation.',
        created_date: shiftDays(-60),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TRAINERS, JSON.stringify(initialTrainers));
  }

  // 5. Initial Gym Profile
  if (!localStorage.getItem(STORAGE_KEYS.GYM_PROFILE)) {
    const initialProfile = [
      {
        id: 'profile_1',
        name: 'Fitaval Health & Fitness Club',
        logo_url: ASSETS.gym.logo,
        address: 'Sector 18, Commercial Plaza, 3rd Floor',
        city: 'Gurugram, Haryana',
        phone: '+91 98765 43210',
        email: 'info@fitaval.com',
        operating_hours: 'Monday – Saturday: 5:30 AM – 10:30 PM | Sunday: 7:00 AM – 8:00 PM',
        description: 'Fitaval is a state-of-the-art fitness community offering cutting-edge equipment, world-class personal coaching, luxury recovery amenities, and holistic health tracking.',
        amenities: ['Parking', 'Showers', 'Lockers', 'AC', 'WiFi', 'Personal Training', 'Group Classes', 'Sauna'],
        gallery: [
          ASSETS.gym.floor,
          ASSETS.gym.weights,
          ASSETS.gym.cardio,
        ],
        created_date: shiftDays(-180),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.GYM_PROFILE, JSON.stringify(initialProfile));
  }

  // 6. Initial Wallet Transactions
  if (!localStorage.getItem(STORAGE_KEYS.WALLET_TRANSACTIONS)) {
    const initialWallet = [
      {
        id: 'wtx_1',
        type: 'credit',
        amount: 8500,
        platform_fee: 170,
        date: formatDate(today),
        description: 'Fitaval App Marketplace - Membership subscription pass',
        created_date: formatDate(today),
      },
      {
        id: 'wtx_2',
        type: 'credit',
        amount: 4200,
        platform_fee: 84,
        date: shiftDays(-2),
        description: 'PT Session Package Booking via Fitaval App',
        created_date: shiftDays(-2),
      },
      {
        id: 'wtx_3',
        type: 'withdrawal',
        amount: 10000,
        platform_fee: 0,
        date: shiftDays(-4),
        description: 'Bank account settlement transfer (Ref #SETL-98432)',
        created_date: shiftDays(-4),
      },
      {
        id: 'wtx_4',
        type: 'credit',
        amount: 6000,
        platform_fee: 120,
        date: shiftDays(-5),
        description: 'Quarterly pass purchase via Fitaval Member Portal',
        created_date: shiftDays(-5),
      },
    ];
    localStorage.setItem(STORAGE_KEYS.WALLET_TRANSACTIONS, JSON.stringify(initialWallet));
  }

  // 7. Initial Auth User
  if (!localStorage.getItem(STORAGE_KEYS.AUTH_USER)) {
    const defaultUser = {
      id: 'usr_admin',
      name: 'Gym Owner',
      email: 'admin@fitaval.com',
      role: 'admin',
    };
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(defaultUser));
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'fitaval_demo_session_token_123');
  }
}

// Entity store helper
function createEntityStore(storageKey) {
  const getItems = () => {
    try {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveItems = (items) => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  };

  return {
    async list(sortField, limit = 100) {
      initStorage();
      let items = [...getItems()];
      if (sortField) {
        const isDesc = sortField.startsWith('-');
        const field = isDesc ? sortField.substring(1) : sortField;
        items.sort((a, b) => {
          const valA = a[field] ?? '';
          const valB = b[field] ?? '';
          if (valA < valB) return isDesc ? 1 : -1;
          if (valA > valB) return isDesc ? -1 : 1;
          return 0;
        });
      }
      return items.slice(0, limit);
    },

    async get(id) {
      initStorage();
      const items = getItems();
      return items.find((i) => i.id === id) || null;
    },

    async create(data) {
      initStorage();
      const items = getItems();
      const newItem = {
        id: 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        created_date: new Date().toISOString().split('T')[0],
        ...data,
      };
      items.unshift(newItem);
      saveItems(items);
      return newItem;
    },

    async update(id, patch) {
      initStorage();
      const items = getItems();
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) {
        throw new Error('Item not found');
      }
      items[index] = { ...items[index], ...patch };
      saveItems(items);
      return items[index];
    },

    async delete(id) {
      initStorage();
      const items = getItems();
      const filtered = items.filter((i) => i.id !== id);
      saveItems(filtered);
      return { success: true };
    },
  };
}

// Initialise storage on load
if (typeof window !== 'undefined') {
  initStorage();
}

// Client API matching exact surface expected by pages
export const client = {
  entities: {
    Member: createEntityStore(STORAGE_KEYS.MEMBERS),
    MembershipPlan: createEntityStore(STORAGE_KEYS.PLANS),
    Transaction: createEntityStore(STORAGE_KEYS.TRANSACTIONS),
    Trainer: createEntityStore(STORAGE_KEYS.TRAINERS),
    GymProfile: createEntityStore(STORAGE_KEYS.GYM_PROFILE),
    WalletTransaction: createEntityStore(STORAGE_KEYS.WALLET_TRANSACTIONS),
  },

  auth: {
    async me() {
      initStorage();
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        throw new Error('Not authenticated');
      }
      const rawUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      return rawUser
        ? JSON.parse(rawUser)
        : { id: 'usr_admin', name: 'Gym Owner', email: 'admin@fitaval.com', role: 'admin' };
    },

    async loginViaEmailPassword(email, password) {
      initStorage();
      const user = {
        id: 'usr_' + Date.now(),
        name: email.split('@')[0],
        email,
        role: 'admin',
      };
      const token = 'token_' + Date.now();
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      return { user, token };
    },

    async register({ email, password }) {
      initStorage();
      const user = {
        id: 'usr_' + Date.now(),
        name: email.split('@')[0],
        email,
        role: 'admin',
      };
      localStorage.setItem('fitaval_pending_reg', JSON.stringify({ user, password }));
      return { success: true, message: 'OTP sent' };
    },

    async verifyOtp({ email, otpCode }) {
      initStorage();
      let user = {
        id: 'usr_' + Date.now(),
        name: email.split('@')[0],
        email,
        role: 'admin',
      };
      const pending = localStorage.getItem('fitaval_pending_reg');
      if (pending) {
        try {
          user = JSON.parse(pending).user;
        } catch {
          // ignore
        }
      }
      const token = 'token_' + Date.now();
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      localStorage.removeItem('fitaval_pending_reg');
      return { access_token: token, user };
    },

    async resendOtp(email) {
      return { success: true };
    },

    setToken(token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    },

    async resetPasswordRequest(email) {
      return { success: true };
    },

    async resetPassword({ resetToken, newPassword }) {
      return { success: true };
    },

    loginWithProvider(provider, returnTo = '/') {
      const user = {
        id: 'usr_google_' + Date.now(),
        name: 'Fitaval User',
        email: 'user@fitaval.com',
        role: 'admin',
      };
      const token = 'token_google_' + Date.now();
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      window.location.href = returnTo;
    },

    logout(redirectUrl) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },

    redirectToLogin(returnUrl) {
      const target = returnUrl ? `/login?returnTo=${encodeURIComponent(returnUrl)}` : '/login';
      window.location.href = target;
    },

    isAuthenticated() {
      return Boolean(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN));
    },
  },

  app: {
    async getPublicSettings() {
      return {
        id: 'fitaval-crm',
        public_settings: {
          app_name: 'Fitaval Gym Manager',
          auth_mode: 'public',
        },
      };
    },
  },

  integrations: {
    Core: {
      async UploadPublicFile({ file }) {
        return new Promise((resolve, reject) => {
          if (!file) {
            reject(new Error('No file provided'));
            return;
          }
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({ file_url: e.target?.result });
          };
          reader.onerror = () => {
            reject(new Error('Failed to read file'));
          };
          reader.readAsDataURL(file);
        });
      },
    },
  },
};

// Default export
export default client;
