import dns from "node:dns";
import mongoose from "mongoose";

dns.setServers(["1.1.1.1"]);

async function connectToDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Server is connected to DB");
  } catch (error) {
    console.error("Error connecting to DB:", error.message);
    process.exit(1);
  }
}

export default connectToDb;
