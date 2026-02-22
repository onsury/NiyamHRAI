import { FirebaseError } from 'firebase/app';

// A mapping of Firebase auth error codes to user-friendly messages
const AUTH_ERROR_MESSAGES: { [key: string]: string } = {
  'auth/email-already-in-use': 'This email address is already in use by another account.',
  'auth/invalid-email': 'The email address is not valid.',
  'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
  'auth/weak-password': 'The password is too weak.',
  'auth/user-disabled': 'This user has been disabled.',
  'auth/user-not-found': 'No user found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'The credential data is malformed or has expired.',
};

/**
 * Translates a FirebaseError into a user-friendly message.
 * @param error The FirebaseError object.
 * @returns A user-friendly error message string.
 */
export const getFirebaseAuthErrorMessage = (error: FirebaseError): string => {
  return AUTH_ERROR_MESSAGES[error.code] || 'An unexpected error occurred. Please try again.';
};
