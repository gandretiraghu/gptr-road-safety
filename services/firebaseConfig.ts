
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * --- SECURITY NOTE FOR DEVELOPERS ---
 * 
 * Q: Why are these keys exposed?
 * A: This is a Firebase Client SDK configuration. These keys (apiKey, projectId) are
 *    identifiers, not secrets. They are designed to be exposed in the frontend.
 * 
 *    REAL SECURITY is implemented via:
 *    1. Firestore Security Rules (firestore.rules) - Restricts DB access.
 *    2. Storage Security Rules (storage.rules) - Restricts file uploads.
 *    3. App Check (Optional) - Verifies the app identity.
 *    4. Google Cloud Console Restrictions - Restricts Maps/AI keys to specific domains.
 * 
 *    Do not hide these keys. Secure the resources they point to.
 */

const firebaseConfig = {
  apiKey: "AIzaSyDa95v94xyO-1rkbk5fn6GpEJ-7gF_-52Y",
  authDomain: "gptr-pathole.firebaseapp.com",
  projectId: "gptr-pathole",
  storageBucket: "gptr-pathole.firebasestorage.app",
  messagingSenderId: "639268487401",
  appId: "1:639268487401:web:6c57b52b8a76e043fc7078",
};

// Initialize Firebase (Modular SDK)
const app = initializeApp(firebaseConfig);

// Export instances
// Casting app to any to resolve TS type mismatch between firebase/app and downstream services
export const auth = getAuth(app as any);
export const db = getFirestore(app as any);
export const storage = getStorage(app as any);

// Increase Retry Timeouts for Mobile Networks (30 seconds)
storage.maxUploadRetryTime = 30000;
storage.maxOperationRetryTime = 30000;

export default app;
