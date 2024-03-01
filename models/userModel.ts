import mongoose, {Document, Schema} from 'mongoose';

interface IUser extends Document {
  fullName: string;
  username: string;
  phoneNumber: number;
  gender: string;
  dob: string;
}

const userSchema = new Schema<IUser>(
  {
    fullName: String,
    username: String,
    phoneNumber: Number,
    gender: String,
    dob: String,
  },
  {
    timestamps: {createdAt: 'createdAt', updatedAt: 'updatedAt'},
  },
);

const User = mongoose.model<IUser>('User', userSchema);

export default User;