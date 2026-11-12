import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import fallbackConfig from '../../firebase-applet-config.json';

// Read config from Vite environment variables (e.g. on Vercel)
// Vite client environment variables MUST begin with VITE_
const env = import.meta.env;

const apiKey = env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey || '';
const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain || '';
const projectId = env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId || '';
const storageBucket = env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket || '';
const messagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId || '';
const appId = env.VITE_FIREBASE_APP_ID || fallbackConfig.appId || '';
const measurementId = env.VITE_FIREBASE_MEASUREMENT_ID || fallbackConfig.measurementId || '';

export const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  ...(measurementId ? { measurementId } : {}),
};

// Database ID handling:
// - Standard Firebase Console projects use the "(default)" database.
// - If the user deployed to Vercel with VITE_FIREBASE_PROJECT_ID, default to the standard database
//   unless VITE_FIREBASE_DATABASE_ID is explicitly provided and is not "(default)".
// - In AI Studio preview without VITE_FIREBASE_PROJECT_ID, use fallbackConfig.firestoreDatabaseId if non-default.
let customDatabaseId: string | undefined = undefined;

if (env.VITE_FIREBASE_DATABASE_ID && env.VITE_FIREBASE_DATABASE_ID !== '(default)' && env.VITE_FIREBASE_DATABASE_ID.trim() !== '') {
  customDatabaseId = env.VITE_FIREBASE_DATABASE_ID.trim();
} else if (!env.VITE_FIREBASE_PROJECT_ID && (fallbackConfig as any).firestoreDatabaseId) {
  const fallbackDbId = (fallbackConfig as any).firestoreDatabaseId;
  if (fallbackDbId && fallbackDbId !== '(default)') {
    customDatabaseId = fallbackDbId;
  }
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: getFirestore(app) connects to (default) database. Only pass second argument for named databases.
export const db = customDatabaseId ? getFirestore(app, customDatabaseId) : getFirestore(app);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    if (!apiKey || !projectId) {
      console.warn('Firebase config is missing apiKey or projectId. Please set VITE_FIREBASE_* environment variables in Vercel.');
      return false;
    }
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using local fallback.');
      return false;
    }
    console.error('Firebase test connection check:', error);
    return true;
  }
}
