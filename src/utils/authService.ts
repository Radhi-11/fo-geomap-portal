const AUTH_USER_KEY = 'auth_user';
const APP_USERS_KEY = 'app_users';
const ADMIN_USER_KEY = 'admin_user';

export interface AuthUser {
  username: string;
  fullName?: string;
  email?: string;
  companyName?: string;
  password: string;
  role: 'admin' | 'user';
  mustChangePassword: boolean;
}

const DEFAULT_ADMIN: AuthUser = {
  username: 'admin',
  fullName: 'Administrator',
  password: 'admin123',
  role: 'admin',
  mustChangePassword: false,
};

export const ensureAdminUser = (): AuthUser => {
  const stored = localStorage.getItem(ADMIN_USER_KEY);
  if (stored) return JSON.parse(stored) as AuthUser;
  const admin = { ...DEFAULT_ADMIN };
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
  return admin;
};

export const getAdminUser = (): AuthUser => {
  return ensureAdminUser();
};

export const saveAdminUser = (admin: AuthUser): void => {
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
};

export const getCurrentUser = (): AuthUser | null => {
  const saved = localStorage.getItem(AUTH_USER_KEY);
  return saved ? (JSON.parse(saved) as AuthUser) : null;
};

export const setCurrentUser = (user: AuthUser): void => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const getRegisteredUsers = (): AuthUser[] => {
  return JSON.parse(localStorage.getItem(APP_USERS_KEY) || '[]') as AuthUser[];
};

export const saveRegisteredUsers = (users: AuthUser[]): void => {
  localStorage.setItem(APP_USERS_KEY, JSON.stringify(users));
};

export const findUserByUsername = (username: string): AuthUser | null => {
  const admin = getAdminUser();
  if (admin.username === username) return admin;
  const users = getRegisteredUsers();
  return users.find((u) => u.username === username || u.email === username) || null;
};

export const updateAdminCredentials = (username: string, fullName: string, password?: string): AuthUser => {
  const admin = getAdminUser();
  const updated = {
    ...admin,
    username,
    fullName,
    password: password || admin.password,
  };
  saveAdminUser(updated);
  return updated;
};

export const updateRegularUserCredentials = (
  currentUsername: string,
  newUsername: string,
  fullName: string,
  password?: string
): AuthUser | null => {
  const users = getRegisteredUsers();
  const userIndex = users.findIndex(
    (u) => u.username === currentUsername || u.email === currentUsername
  );
  if (userIndex === -1) return null;

  const updated = {
    ...users[userIndex],
    username: newUsername,
    fullName,
    password: password || users[userIndex].password,
  };
  users[userIndex] = updated;
  saveRegisteredUsers(users);
  return updated;
};

export const checkUsernameTaken = (username: string, currentUsername?: string): boolean => {
  const admin = getAdminUser();
  if (admin.username === username && admin.username !== currentUsername) return true;
  const users = getRegisteredUsers();
  return users.some(
    (u) =>
      (u.username === username || u.email === username) &&
      u.username !== currentUsername &&
      u.email !== currentUsername
  );
};

export const generateTempPassword = (): string => {
  return Math.random().toString(36).slice(-8);
};
