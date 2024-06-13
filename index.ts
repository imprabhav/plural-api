import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

import UserModel from './models/userSchema';
import AlbumModel from './models/albumSchema';

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.json());
app.use('/uploads', express.static(__dirname + '/uploads'));

const port = process.env.PORT || 4000;


const multerMiddleWare = multer({dest: 'uploads/'}).array('photos');

// mongoose
//   .connect('mongodb://127.0.0.1:27017/PluralLocal')
//   .then(() => {
//     console.log('Local Connection Successful');
//   })
//   .catch(error => {
//     console.log('Connection Error:', error);
//   });

mongoose
  .connect('mongodb+srv://077satyamsharma:satyam@cluster0.fox2yli.mongodb.net/')
  .then(() => {
    console.log('Connection Successful');
  })
  .catch(error => {
    console.log('Error:', error);
  });

app.post('/createUser', async (req, res) => {
  try {
    const {username, fullName, phoneNumber, gender, dob} = req.body;
    const newUser = new UserModel({
      fullName: fullName,
      username: username,
      phoneNumber: phoneNumber,
      gender: gender,
      dob: dob,
    });
    await newUser.save();

    const token = jwt.sign(
      {
        phoneNumber,
      },
      'your_secret_key',
      {
        expiresIn: '1h',
      },
    );

    res.json({
      token: token,
      message: 'token created',
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/checkUser/:phoneNumber', async (req, res) => {
  try {
    const phoneNumber = req.params.phoneNumber;

    const user = await UserModel.findOne({phoneNumber});

    if (user) {
      const token = jwt.sign(
        {
          phoneNumber,
        },
        'your_secret_key',
        {
          expiresIn: '1h',
        },
      );
      res.json({
        token: token,
        message: 'token created',
        exists: 'true',
      });
    } else {
      res.json({
        message: 'New User',
        exists: 'false',
      });
    }
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({error: 'Internal Server Error'});
  }
});

app.get('/getUserData', async (req, res) => {
  try {
    const phoneNumber = req.query.phoneNumber as string;
    const user = await UserModel.findOne({phoneNumber: phoneNumber});
    if (user) {
      const userDetails = {
        _id: user._id,
        username: user.username,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
      };
      res.json({
        user: userDetails,
      });
    } else {
      res.status(404).json({error: 'User not found'});
    }
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

app.get('/checkUsername/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const user = await UserModel.findOne({username});
    res.json({isUnique: !user});
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({error: 'Internal Server Error'});
  }
});

app.post('/createAlbum', multerMiddleWare, async (req, res) => {
  try {
    const {userId, albumName} = req.body;
    const photos = req.files;

    const user = await UserModel.findOne({_id: userId});

    if (user) {
      const imageDetails = (photos as Express.Multer.File[]).map(photo => {
        const parts = photo.originalname.split('.');
        const ext = parts[parts.length - 1];
        const newPath = path.join(
          photo.destination,
          photo.filename + '.' + ext,
        );
        fs.renameSync(photo.path, newPath);
        return {
          filename: photo.filename + '.' + ext,
          originalname: photo.originalname,
          mimetype: photo.mimetype,
          size: photo.size,
          path: newPath,
        };
      });
      const newAlbum = new AlbumModel({
        owner_id: user._id,
        owner_name: user.username,
        album_name: albumName,
        images: imageDetails,
      });

      user.own_albums.push({album: newAlbum._id});

      await newAlbum.save();

      await user.save();

      return res.status(200).json({message: 'Album created successfully'});
    } else {
      console.log('User not found');
      return res.status(404).json({error: 'User not found'});
    }
  } catch (error) {
    console.error('Error at creating album', error);
    return res.status(500).json({error: 'Internal server error'});
  }
});

app.get('/getAlbumData/:userId', async (req, res) => {
  try {
    const {userId} = req.params;
    const albums = await AlbumModel.find({owner_id: userId});
    if (albums) {
      res.json({albums: albums.reverse()  || []});
    } else {
      return res.status(404).json({error: 'Album not found'});
    }
  } catch (error) {
    console.error('Error fetching album data:', error);
    res.status(500).json({error: 'Internal server error'});
  }
});

app.delete('/deleteAlbum/:albumId', async (req, res) => {
  try {
    const albumId = req.params.albumId;
    const user = await UserModel.findOne({'own_albums.album': albumId});
    console.log(user);

    if (user) {
      const albumIndex = user.own_albums.findIndex(
        album => album.album.toString() === albumId,
      );

      if (albumIndex !== -1) {
        user.own_albums.splice(albumIndex, 1);

        await AlbumModel.deleteOne({_id: albumId});

        await user.save();

        return res.status(200).json({message: 'Album deleted successfully'});
      } else {
        return res.status(404).json({error: 'Album not found for the user'});
      }
    } else {
      return res.status(404).json({error: 'User not found'});
    }
  } catch (error) {
    console.error('Error at deleting album', error);
    return res.status(500).json({error: 'Internal server error'});
  }
});

app.post('/addFriendsToAlbum', async (req, res) => {
  const {peerIDs, albumId} = req.body;
  try {
    const peers = await UserModel.find({_id: {$in: peerIDs}});

    if (peers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No Peers Found',
      });
    }

    const updateChanges = peers.map(peer => {
      peer.guest_albums.push({gAlbum: albumId});
      return peer.save();
    });

    await Promise.all(updateChanges);

    res.status(200).json({
      success: true,
      message: 'Friends added to album successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

app.get('/getGuestAlbumData/:userId', async (req, res) => {
  const {userId} = req.params;
  try {
    const currentUser = await UserModel.findById(userId);

    if (!currentUser) {
      return res.status(404).json({message: 'User not found'});
    }

    await currentUser.populate({
      path: 'guest_albums.gAlbum',
      select: 'owner_id owner_name album_name images createdAt',
    });

    const guest_albums = currentUser.guest_albums
      .map(request => request.gAlbum)
      .filter(album => album !== null);
    console.log(guest_albums);
    res.status(200).json({guest_albums});
  } catch (error) {
    console.error('Error fetching album data:', error);
    res.status(500).json({error: 'Internal server error'});
  }
});

app.get('/getAllUsers/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const allUsersExceptOne = await UserModel.find({_id: {$ne: userId}});
    res.json({allUsers: allUsersExceptOne});
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({success: false, message: 'Internal server error'});
  }
});

app.post('/friendRequest', async (req, res) => {
  const {senderId, recipientId} = req.body;

  try {
    await UserModel.findByIdAndUpdate(
      recipientId,
      {$push: {receivedFriendRequests: {user: senderId}}},
      {upsert: true},
    );

    await UserModel.
    findByIdAndUpdate(
      senderId,
      {$push: {sentFriendRequests: {user: recipientId}}},
      {upsert: true},
    );

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

app.post('/friendRequest/checkFriendRequest', async (req, res) => {
  const {senderId, recipientId} = req.body;

  try {
    const sender = await UserModel.findById(senderId);
    const recipient = await UserModel.findById(recipientId);

    if (!sender || !recipient) {
      return res.status(404).json({error: 'Sender or recipient not found'});
    }

    const isRequestSent = sender.sentFriendRequests.some(
      request => request.user.toString() === recipientId.toString(),
    );
    const isFriend = sender.friends.some(
      friend => friend.user.toString() === recipientId.toString(),
    );

    let friendStatus = '';

    if (isRequestSent) {
      friendStatus = 'request_sent';
    } else if (isFriend) {
      friendStatus = 'already_friends';
    } else {
      friendStatus = 'no_action';
    }

    console.log(friendStatus);
    res.status(200).json({friendStatus});
  } catch (error) {
    console.error(error);
    res.status(500).json({error: 'Internal server error'});
  }
});

app.get('/friendRequest/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const currentUser = await UserModel.findById(userId);

    if (!currentUser) {
      return res.status(404).json({message: 'User not found'});
    }

    await currentUser.populate(
      'receivedFriendRequests.user',
      'username fullName',
    );
    const receivedFriendRequests = currentUser.receivedFriendRequests.map(
      request => request.user,
    );

    res.status(200).json({receivedFriendRequests});
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal Server Error'});
  }
});

app.post('/friendRequest/accept', async (req, res) => {
  try {
    const {senderId, recipientId} = req.body;

    const sender = await UserModel.findById(senderId);
    const recipient = await UserModel.findById(recipientId);

    if (sender && recipient) {
      sender.friends.push({user: recipientId});
      recipient.friends.push({user: senderId});

      recipient.receivedFriendRequests =
        recipient.receivedFriendRequests.filter(
          request => request.user.toString() !== senderId.toString(),
        );
      sender.sentFriendRequests = sender.sentFriendRequests.filter(
        request => request.user.toString() !== recipientId.toString(),
      );

      await sender.save();
      await recipient.save();
      res.status(200).json({message: 'Friend Request accepted successfully'});
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal Server Error'});
  }
});

app.post('/friendRequest/reject', async (req, res) => {
  try {
    const {senderId, recipientId} = req.body;

    const sender = await UserModel.findById(senderId);
    const recipient = await UserModel.findById(recipientId);

    if (sender && recipient) {
      recipient.receivedFriendRequests =
        recipient.receivedFriendRequests.filter(
          request => request.user.toString() !== senderId.toString(),
        );
      sender.sentFriendRequests = sender.sentFriendRequests.filter(
        request => request.user.toString() !== recipientId.toString(),
      );

      await sender.save();
      await recipient.save();
      return res
        .status(200)
        .json({message: 'Friend Request rejected successfully'});
    } else {
      return res.status(404).json({message: 'Sender or recipient not found'});
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({message: 'Internal Server Error'});
  }
});

app.get('/getFriends/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await UserModel.findById(userId);
    await user?.populate('friends.user', 'username fullName');
    const friends = user?.friends.map(friend => friend.user);
    res.status(200).json({friends});
  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Internal Server Error'});
  }
});

app.get('/', (req, res) => {
  res.send('Home');
});

app.listen(port, () => {
  console.log(`Server is running on http://10.0.2.2:${port}`);
});
