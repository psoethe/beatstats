export interface AuthUser {
  name: string;
  email: string;
  picture?: string;
  sub?: string;
  authenticatedAt: number;
}

export const ALLOWED_EMAILS: string[] = [
  'psoethe@gmail.com',
  'alicebsoethe@gmail.com',
];

export function isEmailAuthorized(email: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ALLOWED_EMAILS.includes(normalized);
}
