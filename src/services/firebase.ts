import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use default database if firestoreDatabaseId is not provided or is "(default)"
const databaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' 
  ? firebaseConfig.firestoreDatabaseId 
  : undefined;

export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firestore connected successfully');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration or internet connection.');
    } else {
      console.error('Firestore connection test failed:', error);
    }
  }
}

export { signInWithPopup, signOut };
