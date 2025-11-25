import "dotenv/config";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import app from "./firebaseConfig"; // adjust path as needed

const db = getFirestore(app);

async function testConnection() {
  try {
    const querySnapshot = await getDocs(collection(db, "test")); // "test" is your collection name
    console.log("Firestore connection successful! Document count:", querySnapshot.size);
  } catch (e) {
    console.log("Firestore connection failed:", e);
  }
}

testConnection();