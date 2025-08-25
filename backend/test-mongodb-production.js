const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env.production" });

console.log("🚀 Testing PRODUCTION MongoDB Atlas Connection...\n");

// Show which environment we're using
console.log("📋 Production Environment Details:");
console.log(`NODE_ENV: ${process.env.NODE_ENV || "production"}`);
console.log(
  `MongoDB URI: ${
    process.env.MONGODB_URI
      ? process.env.MONGODB_URI.replace(/:[^:@]*@/, ":****@")
      : "NOT SET"
  }`
);
console.log(
  `JWT Secret: ${
    process.env.JWT_SECRET
      ? "****" + process.env.JWT_SECRET.slice(-4)
      : "NOT SET"
  }`
);
console.log(`CORS Origin: ${process.env.CORS_ORIGIN || "NOT SET"}\n`);

async function testProductionConnection() {
  try {
    console.log("⏳ Connecting to PRODUCTION MongoDB Atlas...");

    // Connect to MongoDB with production settings
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10, // Production pool size
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log("✅ Successfully connected to PRODUCTION MongoDB Atlas!");
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(
      `📡 Connection State: ${
        mongoose.connection.readyState === 1 ? "Connected" : "Not Connected"
      }`
    );

    // Test production-like operations
    console.log("\n🧪 Testing production database operations...");

    // Test 1: Create collections that your app will use
    const collections = ["messages", "users", "rooms"];
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        await collection.createIndex({ createdAt: 1 }); // Create index for performance
        console.log(`✅ Collection "${collectionName}" ready with indexes`);
      } catch (error) {
        console.log(
          `⚠️  Collection "${collectionName}" might already exist (this is OK)`
        );
      }
    }

    // Test 2: Insert and read test data
    const testCollection = mongoose.connection.db.collection("production_test");
    const testDoc = {
      message: "Production connection test",
      timestamp: new Date(),
      app: "chat-app",
      environment: "production",
      version: "1.0.0",
    };

    const insertResult = await testCollection.insertOne(testDoc);
    console.log("✅ Test document inserted in production database");

    // Test read operation
    const foundDoc = await testCollection.findOne({
      _id: insertResult.insertedId,
    });
    console.log("✅ Test document read successfully");

    // Test update operation
    await testCollection.updateOne(
      { _id: insertResult.insertedId },
      { $set: { updated: true, updatedAt: new Date() } }
    );
    console.log("✅ Test document updated successfully");

    // Clean up
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log("🧹 Test document cleaned up");

    // Test connection performance
    console.log("\n⚡ Testing connection performance...");
    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    const pingTime = Date.now() - startTime;
    console.log(
      `📊 Database ping: ${pingTime}ms ${
        pingTime < 100 ? "(Excellent)" : pingTime < 300 ? "(Good)" : "(Slow)"
      }`
    );

    console.log("\n🎉 PRODUCTION MongoDB Atlas connection test PASSED!");
    console.log("✅ Your production database is ready for deployment");
    console.log("🚀 You can now deploy your app to production");
  } catch (error) {
    console.error("\n❌ PRODUCTION MongoDB Atlas connection test FAILED!");
    console.error("🔥 Error details:");

    if (error.name === "MongoServerError") {
      console.error(`   Server Error: ${error.message}`);
      if (error.code === 8000) {
        console.error("   💡 Authentication failed - check username/password");
      } else if (error.code === 13) {
        console.error("   💡 Authorization failed - check user permissions");
      }
    } else if (error.name === "MongoNetworkError") {
      console.error(`   Network Error: ${error.message}`);
      console.error("   💡 Network access issue - check IP whitelist");
    } else if (error.name === "MongooseServerSelectionError") {
      console.error(`   Server Selection Error: ${error.message}`);
      console.error(
        "   💡 Cannot reach MongoDB servers - check connection string"
      );
    } else {
      console.error(`   ${error.name}: ${error.message}`);
    }

    console.error("\n🛠️  Production troubleshooting steps:");
    console.error("   1. Verify MongoDB Atlas credentials in .env.production");
    console.error("   2. Check IP whitelist includes deployment server IPs");
    console.error("   3. Ensure cluster is running and not paused");
    console.error("   4. Test connection string format");
    console.error("   5. Check MongoDB Atlas status page");

    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("\n🔌 Production connection closed");
    process.exit(0);
  }
}

// Handle process termination
process.on("SIGINT", async () => {
  console.log("\n⏹️  Process interrupted");
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

// Run the production test
testProductionConnection();
