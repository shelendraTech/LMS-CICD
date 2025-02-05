import { Schema,model } from 'mongoose';
import bcrypt from "bcrypt"
import JWT from 'jsonwebtoken';
import crypto from 'crypto'

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "FullName must be required"],
      minLength: [5, "Name must be atleast 5 character"],
      maxLength: [50, "Name must be less than 50 character"],
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minLength: [8, "Password must be atleast 8 character"],
      select: false,
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    avatar: {
      public_id: {
        type:String
      },
      secure_url: {
        type: String,
      },
    },
    forgotPasswordToken:String,
    forgotPasswordExpire:Date,
    subscription:{
      id:String,
      status:String,
    },
  },

  {
    timestamps: true,
  }
);


userSchema.pre('save', async function(next) {
  if(!this.isModified('password')){
    return next()
  }
  this.password = await bcrypt.hash(this.password,10)
})


userSchema.methods ={
  comparePassword : async function(plainTextPassword){
     return await bcrypt.compare(plainTextPassword,this.password)
  },
  generateJWTToken : function(){
    return JWT.sign(
      {id:this._id, role:this.role, email:this.email,subscription: this.subscription},
      process.env.JWT_SECRET,
      {
        expiresIn:process.env.JWT_EXPIRE
      }
    )
  },
  generatePasswordTokon: async function(){

    const resetToken = crypto.randomBytes(20).toString('hex');
    
    this.forgotPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

    this.forgotPasswordExpire = Date.now() + 15 *60 *1000; //15 minutes

    return resetToken;
  }
}

const User =  model('User',userSchema)
export default User;
