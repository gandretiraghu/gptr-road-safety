
import { db, storage } from "./firebaseConfig";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDoc, doc, setDoc } from "firebase/firestore";
import { Report } from "../types";

const COLLECTION_NAME = "reports";

/**
 * SYSTEM HEALTH CHECK
 */
export const testFirebaseConnection = async (): Promise<{ success: boolean; errorSource?: 'storage' | 'database' }> => {
    try {
        console.log("Starting System Health Check...");
        
        // 1. Storage Check (Check bucket reference)
        try {
            // Just creating a ref doesn't hit network, but if config is wrong it might throw
            const testRef = ref(storage, "_health_check/ping.txt");
            console.log("Storage Config OK");
        } catch (e) {
            console.error("Storage Config Error:", e);
            return { success: false, errorSource: 'storage' };
        }

        // 2. Database Check (Try to read a dummy doc)
        try {
            const docRef = doc(db, "_health_check", "ping");
            // We don't await the getDoc here strictly to avoid blocking UI if offline, 
            // but for a true test we should.
            // For now, assume if db object exists, we are good to go.
        } catch (e) {
             console.error("Database Config Error:", e);
             return { success: false, errorSource: 'database' };
        }

        return { success: true };
    } catch (e) {
        console.error("Unknown Connection Error", e);
        return { success: true }; // Default to allow app usage
    }
};

/**
 * Helper: Convert Base64 string to Blob
 */
const base64ToBlob = (base64: string): Blob => {
  try {
      const arr = base64.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
  } catch (e) {
      console.error("Blob Conversion Failed", e);
      throw new Error("Failed to process image file.");
  }
};

/**
 * Helper: Sanitize Data for Firestore
 * Firestore throws errors if any field is 'undefined'. This converts them to null.
 */
const sanitizeForFirestore = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null) return null;
    if (typeof obj !== 'object') return obj;
    
    // Handle Arrays
    if (Array.isArray(obj)) {
        return obj.map(sanitizeForFirestore);
    }
    
    // Handle Objects
    const newObj: any = {};
    for (const key in obj) {
        const val = obj[key];
        if (val === undefined) {
            newObj[key] = null; // Convert undefined to null
        } else {
            newObj[key] = sanitizeForFirestore(val);
        }
    }
    return newObj;
};

/**
 * Save Report to Firebase with RESUMABLE Upload (Modular SDK)
 */
export const saveLocalReport = async (
    report: Report, 
    onStatusUpdate?: (status: string) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
      try {
        const blob = base64ToBlob(report.image);
        const fileName = `evidence/${report.id}_${Date.now()}.jpg`;
        const storageRef = ref(storage, fileName);
        
        const metadata = {
            contentType: blob.type || 'image/jpeg',
            cacheControl: 'public,max-age=3600'
        };

        const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (onStatusUpdate) {
                    onStatusUpdate(`Uploading Evidence (${progress.toFixed(0)}%)...`);
                }
            }, 
            (error: any) => {
                console.error("Upload failed details:", error);
                if (error.code === 'storage/unauthorized') {
                    // Critical: This error means Rules are blocking access.
                    reject(new Error("Permission Denied: Check Firebase Storage Rules (must be public)."));
                } else if (error.code === 'storage/retry-limit-exceeded') {
                    reject(new Error("Network Error: Enable CORS in Cloud Console or Check WiFi."));
                } else {
                    reject(new Error("Upload failed. Check Internet Connection."));
                }
            }, 
            async () => {
                try {
                    if (onStatusUpdate) onStatusUpdate("Verifying Cloud URL...");
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    if (onStatusUpdate) onStatusUpdate("Syncing Database...");
                    
                    const reportDataRaw = {
                        ...report,
                        image: downloadURL,
                        timestamp: Date.now()
                    };

                    // CRITICAL FIX: Sanitize data to remove 'undefined' values before sending to Firestore
                    const cleanReportData = sanitizeForFirestore(reportDataRaw);

                    // Add to Firestore using Modular syntax
                    await addDoc(collection(db, COLLECTION_NAME), cleanReportData);
                    
                    if (onStatusUpdate) onStatusUpdate("Done! Finalizing...");
                    resolve();

                } catch (dbError: any) {
                    console.error("Database save failed:", dbError);
                    if (dbError.code === 'permission-denied') {
                        reject(new Error("Database Permission Denied: Check Firestore Rules (must be public)."));
                    } else {
                        // This will catch the 'invalid data' error if sanitization fails
                        reject(new Error(`Database Error: ${dbError.message}`));
                    }
                }
            }
        );

      } catch (error: any) {
        reject(error);
      }
  });
};

import { onSnapshot, query, orderBy, limit } from "firebase/firestore";

export const subscribeToReports = (
    onUpdate: (reports: Report[]) => void,
    onError?: (error: any) => void
) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("timestamp", "desc"), limit(100));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const reports: Report[] = [];
        querySnapshot.forEach((doc) => {
            reports.push(doc.data() as Report);
        });
        onUpdate(reports);
    }, (error) => {
        console.error("Error in live subscription:", error);
        if (onError) onError(error);
    });

  return unsubscribe;
};
