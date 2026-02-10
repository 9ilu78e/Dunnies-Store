import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  photo: { type: String },
  provider: { type: String, required: true, default: "firebase" },
  role: { type: String, required: true, default: "user" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: "users"
});

// Update the existing User model or create new one for Firebase users
const FirebaseUser = mongoose.models.User || mongoose.model("User", UserSchema);

export default FirebaseUser;
