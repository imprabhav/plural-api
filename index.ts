import express from 'express';
import mongoose from 'mongoose';
import User from './models/userModel';
import bodyParser from 'body-parser';
import cors from 'cors';

const port = 4000;

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.json());

mongoose
  .connect('mongodb+srv://sp3innovators:7007153281@cluster0.3fyaejl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('Connection Successful');
  })
  .catch(error => {
    console.log('Error:', error);
  });

app.post('/createUser', async (req, res) => {
  try {
    const {username, fullName, phoneNumber, gender, dob} = req.body;
    const newUser = new User({
      fullName: fullName,
      username: username,
      phoneNumber: phoneNumber,
      gender: gender,
      dob: dob,
    });
    await newUser.save();
    res.send('User created');
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

app.get('/checkUser/:phoneNumber', async (req, res) => {
  try {
    const phoneNumber = req.params.phoneNumber;

    // Check if the phone number exists in the database
    const user = await User.findOne({ phoneNumber });

    // Send a response indicating whether the phone number exists
    res.json({ exists: !!user });
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// In your server's index.ts or another routing file
app.get('/getUserData', async (req, res) => {
  try {
    const phoneNumber = req.query.phoneNumber;
    // Use the phone number to fetch user data from the database
    const user = await User.findOne({ phoneNumber });
    if (user) {
      // If user is found, send the user data
      res.json({
        fullName: user.fullName,
        username: user.username,
      });
    } else {
      // If user is not found, send an appropriate response
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});


// Add a new route to check if a username is unique
app.get('/checkUsername/:username', async (req, res) => {
  try {
    const username = req.params.username;

    // Check if the username exists in the database
    const user = await User.findOne({ username });

    // Send a response indicating whether the username is unique
    res.json({ isUnique: !user });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.listen(port, () => {
  console.log(`Server is running on http://10.0.2.2:${port}`);
});