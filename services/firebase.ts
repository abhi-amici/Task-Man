import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// --- Firebase Initialization ---
let app: FirebaseApp | undefined;
let db: Firestore | undefined;

// NOTE FOR DEVELOPER:
// The Firebase configuration is hardcoded here for demonstration purposes in a browser-only environment.
// In a production application with a build process (like Vite or Create React App),
// you should use environment variables (e.g., import.meta.env.VITE_FIREBASE_API_KEY)
// to avoid exposing sensitive keys directly in the source code.
const firebaseConfig = {
  apiKey: "AIzaSyDN9p-vbs7tvRqUTp6qiIYiuiiWkcat4Hw", // <-- PASTE YOUR FIREBASE API KEY HERE
  authDomain: "task-management-4b03e.firebaseapp.com", // <-- PASTE YOUR AUTH DOMAIN HERE
  projectId: "task-management-4b03e", // <-- PASTE YOUR PROJECT ID HERE
  storageBucket: "task-management-4b03e.firebasestorage.app", // <-- PASTE YOUR STORAGE BUCKET HERE
  messagingSenderId: "828306482605", // <-- PASTE YOUR SENDER ID HERE
  appId: "1:828306482605:web:c15322254285b4c7ce6d24" // <-- PASTE YOUR APP ID HERE
};

// The previous method of using `process.env` does not work in a browser environment without a build step.

// Only initialize Firebase if the necessary configuration is present and is not a placeholder.
// Replace the placeholder values with your actual credentials to connect to your Firebase instance.
if (firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_PROJECT_ID") {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    } catch (error) {
        console.error("Firebase initialization failed. Please check your configuration in services/firebase.ts", error);
    }
} else {
    console.warn("Firebase configuration is missing or uses placeholder values. The application will run using mock data. Please update services/firebase.ts with your credentials.");
}

export { db };