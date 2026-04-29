// ================================================
// CRAFTNIX DIGITAL - DEBUGGING GUIDE
// ================================================

/**
 * अगर Blog नहीं दिख रहे हैं तो यह guide follow करें
 */

// Step 1: Browser Console खोलें (F12 या Ctrl+Shift+J)
// अब blog.html को reload करें और console में देखें

// आपको कुछ ऐसा दिखेगा:
// 📖 Loading blogs from database...
// ✅ Total blogs loaded: 3
// 🎨 Rendering blogs...
// ✅ Rendered 3 blog cards

// ==========================================
// अगर ERROR आ रहे हैं तो:
// ==========================================

/**
 * ISSUE 1: Database connection नहीं हो रहा
 * Error: "Firebase not initialized"
 * 
 * Solution:
 * - Check करें कि firebase-config.js सही से load हो रहा है
 * - Check करें कि apiKey, projectId सही है
 * - Firebase Project में Firestore enable है?
 */

/**
 * ISSUE 2: Firestore में blogs collection नहीं है
 * Error: "Database error" या कोई blogs नहीं दिख रहे
 * 
 * Solution:
 * 1. browser console में यह command चलाएं:
 *    seedBlogs()
 * 
 * 2. या manually Firebase Console में जाएं:
 *    - Firestore Database खोलें
 *    - "Create collection" button दबाएं
 *    - Collection name: "blogs"
 *    - Add sample documents
 */

/**
 * ISSUE 3: Blog data structure गलत है
 * Error: Date formatting issues, fields missing
 * 
 * Firebase में हर Blog document में ये fields होने चाहिए:
 * {
 *   title: "Blog Title",
 *   category: "UI/UX",
 *   excerpt: "Short description...",
 *   readTime: "5 min",
 *   image: "image-url",
 *   content: "Full content",
 *   createdAt: Timestamp (Firebase Timestamp)
 * }
 */

/**
 * ISSUE 4: Blog post अलग page पर नहीं खुल रहा
 * 
 * Solution:
 * - Check करें कि blog.html पर blog ID क्या है
 * - blog-post.html?id=[blog-id] URL में चेक करें
 * - Console में देखें कि blog post load हुआ या नहीं
 */

// ==========================================
// Quick Debug Commands
// ==========================================

// 1. Firebase connection check करने के लिए:
// console.log(firebase);
// console.log(db);

// 2. Firestore से सभी blogs देखने के लिए:
// db.collection('blogs').get().then(snap => {
//   snap.forEach(doc => console.log(doc.data()));
// });

// 3. Specific blog document check करने के लिए:
// db.collection('blogs').doc('ui-principles').get().then(doc => {
//   console.log(doc.data());
// });

// 4. Sample data manually add करने के लिए:
// db.collection('blogs').doc('test-blog').set({
//   title: 'Test Blog',
//   category: 'General',
//   excerpt: 'This is a test blog',
//   readTime: '5 min',
//   createdAt: firebase.firestore.Timestamp.now()
// });

// ==========================================
// Common Issues और Solutions
// ==========================================

/**
 * ❌ Blogs दिख रहे हैं पर Click करने से कुछ नहीं होता
 * 
 * ✅ Solution:
 * - Check करें कि blog.html में सही blog ID दे रहे हैं
 * - blog-post.html?id=CORRECT_ID होना चाहिए
 * - Firestore में वही ID का document exist करना चाहिए
 */

/**
 * ❌ Blogs load हो गए हैं पर dates गलत दिख रहे हैं
 * 
 * ✅ Solution:
 * - Firestore में createdAt field Timestamp format में है?
 * - अगर string में है तो: new Date(blog.createdAt) करना होगा
 * - Code में पहले से handle किया गया है
 */

/**
 * ❌ Search/Filter feature चाहिए
 * 
 * ✅ Add करने के लिए:
 * 1. blog.html में filter buttons add करें
 * 2. BlogManager class में filterByCategory() method add करें
 * 3. Firestore query में .where('category', '==', category) use करें
 */

// ==========================================
// Firebase Console से Manual Testing
// ==========================================

/**
 * 1. Console.firebase.google.com खोलें
 * 2. अपना project select करें
 * 3. Firestore Database में जाएं
 * 4. "blogs" collection देखें
 * 5. हर document में सही fields हैं देखें
 * 6. "Test mode" या proper security rules set करें
 */

// ==========================================
// Useful Commands
// ==========================================

// सभी console logs देखने के लिए:
// - F12 दबाएं
// - Console tab खोलें
// - page reload करें
// - सभी logs देखें

// Firestore rules check करने के लिए:
// Firebase Console > Firestore > Rules tab में जाएं
// Test mode में कुछ भी read/write कर सकते हैं

// Deploy करने से पहले security rules set करें!

console.log('📚 Blog Debugging Guide Loaded');
console.log('🔍 Check browser console (F12) for detailed logs');