// ================================================
// CRAFTNIX DIGITAL - FIREBASE CONFIG
// ================================================
// 👇 YAHAN APNI FIREBASE CONFIG DAALO
// Firebase Console → Project Settings → Your Apps

const firebaseConfig = {
    apiKey: "AIzaSyDJY8HAAddrNJD_5pS_ASQe7IiTr327JlM",
    authDomain: "craftnixdigital-54a54.firebaseapp.com",
    projectId: "craftnixdigital-54a54",
    storageBucket: "craftnixdigital-54a54.firebasestorage.app",
    messagingSenderId: "97786624013",
    appId: "1:97786624013:web:f02d2cc715def2ef9f7d44"
};

// Cloudinary Config (Yahan apni details daalo)
window.CLOUDINARY_CLOUD_NAME = "dgtxzsjgk"; 
window.CLOUDINARY_UPLOAD_PRESET = "craftnix"; 

// Firebase Initialize
firebase.initializeApp(firebaseConfig);

// Services ko globally available banao
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Global expose karo
window.db = db;
window.auth = auth;
window.storage = storage;

console.log("✅ Firebase connected successfully!");