import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required for creating a user"], //mtlb email to require rhega hi agar email nhi de rhe hai to ye msg chala jayega
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please fill a valid email address",
      ], //ye check krta hai ki jo user email ka formate hume de rha hai vo shi hai ki ni.. humne starting me ek regex daala hai vo tmhe net pr mil jayega
      unique: [true, "Email already exists."],
    },
    name: {
      type: String,
      required: [true, "Name is required for creating an account "],
    },
    password: {
      type: String,
      required: [true, "Password is required for creating an account "],
      minlength: [6, "Password should be contain more thean 6 character"],
      select: false,
    },
    systemUser:{
      type:Boolean,
        default:false,
        immutable:true,
        select:false
    }
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if ((!this.isModified("password"))) {
    return ;
  }

  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;

  return ;
}); // iska mtlb ye hai ki jb bhi user ka data save hoga to ye function chala dena bs .. isme hum password ko hash me convert krte hai agar password modified nhi hua mtlb user ne password ko fiture me change nhi kiya hai to .. to return ho jaao vrna hash me convert krke usko password me return kara do

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
}; // ye krta hai ki jo tmne uper me pre function chalaya hai vo password ko hash me convet me krke database me convert kr deta hai aur ye function jo user password dala hai aur jo hash hai usko compare krta hain

const User = mongoose.model("User", userSchema);

export default User;
