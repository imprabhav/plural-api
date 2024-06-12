import mongoose, {Schema} from 'mongoose';
import imagesSchema from './imageSchema';

interface IUser {
  username: string;
  fullName: string;
  phoneNumber: string;
  dob: string;
  gender: string;
  country_code: string;
  email: string;
  own_albums: {album: mongoose.Types.ObjectId}[];
  guest_albums: {gAlbum: mongoose.Types.ObjectId}[];
  friends: {user: mongoose.Types.ObjectId}[];
  recent_visited: mongoose.Schema.Types.Array;
  preferences: mongoose.Schema.Types.Array;
  profile_image: any;
  receivedFriendRequests: {user: mongoose.Types.ObjectId}[];
  sentFriendRequests: {user: mongoose.Types.ObjectId}[];
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
    },
    fullName: {
      type: String,
    },
    dob: {
      type: String,
    },
    gender: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    profile_image: imagesSchema,
    country_code: {
      type: String,
    },
    email: {
      type: String,
    },
    own_albums: [
      {
        album: {
          type: Schema.Types.ObjectId,
          ref: 'album',
        },
      },
    ],
    guest_albums: [
      {
        gAlbum: {
          type: Schema.Types.ObjectId,
          ref: 'album',
        },
      },
    ],
    friends: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'users',
        },
      },
    ],
    recent_visited: {
      type: Array,
      timestamps: true,
    },
    preferences: {
      type: Array,
      timestamps: true,
    },
    receivedFriendRequests: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'users',
        },
      },
    ],
    sentFriendRequests: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'users',
        },
      },
    ],
  },
  {timestamps: true},
);

userSchema.index({'guest_albums.gAlbum': 1}, {unique: true, sparse: true});
userSchema.index({'own_albums.album': 1}, {unique: true, sparse: true});
userSchema.index({'friends.user': 1}, {unique: true, sparse: true});
userSchema.index(
  {'receivedFriendRequests.user': 1},
  {unique: true, sparse: true},
);
userSchema.index({'sentFriendRequests.user': 1}, {unique: true, sparse: true});

export default mongoose.model('users', userSchema);
