import mongoose from 'mongoose';

const imagesSchema = new mongoose.Schema(
  {
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    path: String,
  },
  {timestamps: true},
);
export default imagesSchema;

// const imagesSchema = new mongoose.Schema(
//   {
//     image_url: String,
//     file_name: String,
//     file_size: Number,
//     public_id: String,
//     secure_url: {
//       type: String,
//       select: false,
//     },
//   },

//   {timestamps: true},
// );
