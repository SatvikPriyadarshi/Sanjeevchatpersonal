const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

console.log('🔍 Testing MongoDB Atlas Connection...\n');

// Show which environment we're using
console.log('📋 Environment Details:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`MongoDB URI: ${process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:[^:@]*@/, ':****@') : 'NOT SET'}\n`);

async function testConnection() {
  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(`📡 Port: ${mongoose.connection.port}`);
    
    // Test a simple operation
    console.log('\n🧪 Testing database operations...');
    
    // Create a test collection and document
    const testCollection = mongoose.connection.db.collection('connection_test');
    const testDoc = {
      message: 'Connection test successful',
      timestamp: new Date(),
      app: 'chat-app'
    };
    
    const result = await testCollection.insertOne(testDoc);
    console.log('✅ Test document inserted successfully');
    console.log(`📝 Document ID: ${result.insertedId}`);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('🧹 Test document cleaned up');
    
    console.log('\n🎉 MongoDB Atlas connection test PASSED!');
    console.log('✅ Your database is ready for production deployment');
    
  } catch (error) {
    console.error('\n❌ MongoDB Atlas connection test FAILED!');
    console.error('🔥 Error details:');
    
    if (error.name === 'MongoServerError') {
      console.error(`   Server Error: ${error.message}`);
      if (error.code === 8000) {
        console.error('   💡 This might be an authentication issue');
        console.error('   💡 Check your username and password');
      }
    } else if (error.name === 'MongoNetworkError') {
      console.error(`   Network Error: ${error.message}`);
      console.error('   💡 This might be a network access issue');
      console.error('   💡 Check your IP whitelist in MongoDB Atlas');
    } else {
      console.error(`   ${error.name}: ${error.message}`);
    }
    
    console.error('\n🛠️  Troubleshooting steps:');
    console.error('   1. Check your MongoDB Atlas username and password');
    console.error('   2. Verify IP address is whitelisted (0.0.0.0/0 for all IPs)');
    console.error('   3. Ensure your cluster is running');
    console.error('   4. Check your connection string format');
    
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⏹️  Process interrupted');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the test
testConnection();