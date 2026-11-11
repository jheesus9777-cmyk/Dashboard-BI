import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  onSnapshot,
  query,
  limit,
  orderBy,
  QueryConstraint,
  DocumentData,
  Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

/**
 * PetStock BI - Firebase Client
 * STRICTLY READ-ONLY CONFIGURATION
 * Project: gen-lang-client-0982055042
 * Database: ai-studio-petstockprogesti-6d3a6858-5a35-4ae5-b55a-5f3b68b28564
 * 
 * IMPORTANT: In accordance with executive requirements, NO write, update or delete operations
 * are implemented or permitted anywhere in this codebase.
 */

const TARGET_PROJECT_ID = 'gen-lang-client-0982055042';
const TARGET_DATABASE_ID = 'ai-studio-petstockprogesti-6d3a6858-5a35-4ae5-b55a-5f3b68b28564';

// Environment or default client configuration for project
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyForPetStockClientBIReadOnly',
  authDomain: `${TARGET_PROJECT_ID}.firebaseapp.com`,
  projectId: TARGET_PROJECT_ID,
  storageBucket: `${TARGET_PROJECT_ID}.appspot.com`,
  messagingSenderId: '355838406939',
  appId: '1:355838406939:web:petstockbi6d3a6858',
};

// Initialize Firebase App safely (singleton)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore targeting the specific designated named database
export let db: Firestore;
try {
  db = getFirestore(app, TARGET_DATABASE_ID);
} catch {
  // Fallback to default firestore if named db throws in certain environments
  db = getFirestore(app);
}

// Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Authorized direct email
export const AUTHORIZED_EMAIL = 'jheesus.9777@gmail.com';

export function isAuthorizedUser(user: User | { email?: string | null } | null): boolean {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === AUTHORIZED_EMAIL.toLowerCase();
}

/**
 * READ-ONLY: fetch documents from collection
 */
export async function fetchCollectionReadOnly<T = DocumentData>(
  collectionName: 'sales' | 'products' | 'kardex' | 'expenses',
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as T[];
  } catch (error) {
    console.warn(`[Firestore Read-Only] Note when querying ${collectionName}:`, error);
    throw error;
  }
}

/**
 * READ-ONLY: Real-time listener for collection
 */
export function listenCollectionReadOnly<T = DocumentData>(
  collectionName: 'sales' | 'products' | 'kardex' | 'expenses',
  onData: (data: T[]) => void,
  onError?: (error: Error) => void,
  maxItems = 300
) {
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, limit(maxItems));
    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as unknown as T[];
        onData(items);
      },
      (err) => {
        console.warn(`[Firestore Real-Time Read-Only] ${collectionName} listener:`, err);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.warn(`[Firestore Real-Time Read-Only] Failed to setup listener for ${collectionName}:`, err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Google Auth popup login
 */
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign out
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
