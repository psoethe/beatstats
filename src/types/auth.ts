export interface AuthUser {
  name: string;
  email: string;
  picture?: string;
  sub?: string;
  authenticatedAt: number;
}

// Whitelisted family members who have access to private historical export files
export const FAMILY_ADMIN_EMAILS: string[] = [
  'psoethe@gmail.com',
  'alicebsoethe@gmail.com',
];

export function isFamilyAdmin(email: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return FAMILY_ADMIN_EMAILS.includes(normalized);
}

// Allow all valid Google accounts to sign in and use Spotify Live API
export function isEmailAuthorized(email: string): boolean {
  return !!email && email.includes('@');
}
