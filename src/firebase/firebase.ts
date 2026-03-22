import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { firebaseConfig } from './config';

// Initialize Firebase app (avoid re-initialization in hot-reload environments)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export Firebase service instances
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics is optional and only available in browser environments
export const analyticsPromise = isSupported().then((supported) =>
  supported ? getAnalytics(app) : null
);

export default app;
