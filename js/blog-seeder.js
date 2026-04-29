// ================================================
// CRAFTNIX DIGITAL - BLOG DATA SEEDER
// ================================================
// Run this script in browser console to add sample blog posts to Firebase

// Sample blog data


// Function to add blogs to Firebase
async function seedBlogs() {
    try {
        console.log('🌱 Starting blog seeding...');

        for (const blog of sampleBlogs) {
            const { id, ...blogData } = blog;

            await db.collection('blogs').doc(id).set({
                ...blogData,
                createdAt: firebase.firestore.Timestamp.fromDate(blogData.createdAt)
            });

            console.log(`✅ Added blog: ${blog.title}`);
        }

        console.log('🎉 All blogs seeded successfully!');
        console.log('📖 You can now view blogs at:');
        console.log('   - Blog listing: blog.html');
        console.log('   - Individual posts: blog-post.html?id=[blog-id]');

    } catch (error) {
        console.error('❌ Error seeding blogs:', error);
    }
}

// Auto-run if this script is loaded
if (typeof window !== 'undefined' && window.db) {
    // Uncomment the line below to automatically seed blogs when this script runs
    // seedBlogs();
    console.log('📝 Blog seeder loaded. Run seedBlogs() to add sample data.');
}

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { seedBlogs, sampleBlogs };
}