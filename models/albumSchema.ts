import mongoose from 'mongoose';
import imageSchema from './imageSchema';

const adminSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {timestamps: true, _id: false},
);
const viewersSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {timestamps: true, _id: false},
);
const subAlbumsSchema = new mongoose.Schema(
  {
    album_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  {timestamps: true, _id: false},
);
const tagsSchema = new mongoose.Schema(
  {
    tag_name: {
      type: String,
    },
  },
  {timestamps: true},
);

interface Album {
  album_name: string;
  owner_name: String;
  album_description: string;
  owner_id: mongoose.Schema.Types.ObjectId;
  album_type: string;
  images: mongoose.Schema.Types.Array;
  sub_albums: mongoose.Schema.Types.Array;
  admins: mongoose.Schema.Types.Array;
  viewers: mongoose.Schema.Types.Array;
  tags: mongoose.Schema.Types.Array;
}

const albumSchema = new mongoose.Schema<Album>(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users',
    },
    images: [imageSchema],
    sub_albums: [subAlbumsSchema],
    admins: [adminSchema],
    viewers: [viewersSchema],
    tags: [tagsSchema],
    owner_name: {
      type: String,
    },
    album_name: {
      type: String,
    },
    album_type: {
      type: String,
      // required: true,
    },
    album_description: {
      type: String,
    },
  },
  {timestamps: true},
);

export default mongoose.model<Album>('album', albumSchema);
