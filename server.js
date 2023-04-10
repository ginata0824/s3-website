import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import dotenv from 'dotenv'

dotenv.config()

const bodyParser = require('body-parser');
const aws = require('aws-sdk');
const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const uuid = require('uuid').v4;
const path = require('path');
const MongoClient = require('mongodb').MongoClient;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));


MongoClient.connect('mongodb+srv://dbadmin1:123Jelly6@cluster0.vj530lf.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('Mongo Connected!');
        const db = client.db('myApp');
        const collection = db.collection('images');
        app.locals.imageCollection = collection;
    })


const s3 = new aws.S3({
    apiVersion: 'latest',
    //region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
)


//const s3 = new aws.S3({ apiVersion: '2006-03-01' });
// Needs AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

const upload = multer({
    storage: multerS3({
        s3,
        //acl: 'public-read',
        bucket: 'speak2-bookshelf',
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${uuid()}${ext}`);
        }
    })
});


async function deleteImage(id) {
    try {
      const imageCollection = req.app.locals.imageCollection;
      const result = await imageCollection.deleteOne({ _id: id });
      if (result.deletedCount === 0) {
        return false;
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }    

function deleteFile(fileName) {
    const deleteParams = {
      Bucket: 'speak2-bookshelf',
      Key: fileName,
    }
  
    return s3.send(deleteParams).promise();
  
}

app.use(express.static('webflow_updated'))

//upload.single('appImage)
app.post('/uploadAudio', upload.fields([{name:'appFile'},{ name: 'appImage'}]), (req, res) => {
    const imageCollection = req.app.locals.imageCollection;
    const uploadedFile = req.files.appFile[0].location;
    const uploadedImage = req.files.appImage[0].location;

    const name = req.body.name;
    const author = req.body.author;
    const numchapters = req.body.numchapters;
    const description = req.body.description;
    const fileUpload = req.files.appFile[0];
    const coverImage = req.files.appImage[0];
    const checkboxaudio = req.body.checkboxaudio;
    const startdateaudio = req.body.startdateaudio;
    const enddateaudio = req.body.enddateaudio;

    const metadata = {
        skill: "Audiobook Skill Upload",
        name:name,
        author: author,
        numchapters: numchapters,
        description: description,
        audiobookFile:{
            originalName: req.files.appFile[0].originalname,
            filePath: uploadedFile,
            key: req.files.appFile[0].key, 
            url: "https://d18vzpyvhn4slg.cloudfront.net/"+req.files.appFile[0].key
        },
        coverImage: {
            originalName: req.files.appImage[0].originalname,
            filePath: uploadedImage,
            imagekey: req.files.appImage[0].key,
            urlImage: "https://d18vzpyvhn4slg.cloudfront.net/"+req.files.appImage[0].key
       },
        checkboxaudio: checkboxaudio,
        startdateaudio, startdateaudio,
        enddateaudio, enddateaudio,
    };
    imageCollection.insertOne(metadata)
        .then(result => {
            return res.json({ status: 'OK', ...result });
        })
    
});


app.post('/uploadVideo', upload.fields([{name:'appVideo'},{ name: 'appVideoImage'}]), (req, res) => {
    const imageCollection = req.app.locals.imageCollection;
    const uploadedFile = req.files.appVideo[0].location;
    const uploadedImage = req.files.appVideoImage[0].location;

    const title = req.body.title;
    const episodes = req.body.episodes;
    const seasons = req.body.seasons;
    const desc = req.body.desc;
    const videoUpload = req.files.appVideo[0];
    const coverImageUpload = req.files.appVideoImage[0];
    const active = req.body.active;
    const startdatevideo = req.body.startdatevideo;
    const enddatevideo = req.body.enddatevideo;

    const metadata = {
        skill: "Video Skill Upload",
        title:title,
        episodes: episodes,
        seasons: seasons,
        description: desc,
        videoFile:{
            originalName: req.files.appVideo[0].originalname,
            filePath: uploadedFile,
            key: req.files.appVideo[0].key, 
            url: "https://d18vzpyvhn4slg.cloudfront.net/"+req.files.appVideo[0].key
        },
        coverImage: {
            originalName: req.files.appVideoImage[0].originalname,
            filePath: uploadedImage,
            imagekey: req.files.appVideoImage[0].key,
            urlImage: "https://d18vzpyvhn4slg.cloudfront.net/"+req.files.appVideoImage[0].key
       },
        checkboxaudio: checkboxaudio,
        startdateaudio, startdateaudio,
        enddateaudio, enddateaudio,
    };
    imageCollection.insertOne(metadata)
        .then(result => {
            return res.json({ status: 'OK', ...result });
        })
    
});

app.get('/images', (req, res) => {
    const imageCollection = req.app.locals.imageCollection;
    console.log('imageCollection:', imageCollection);
    imageCollection.find({})
        .toArray()
        .then(images => {
            const paths = images.map(({ name, author, numchapters, description, coverImage, audiobookFile }) => ({ 
                name,
                author,
                numchapters,
                description,
                urlImage: coverImage.urlImage,
                url: audiobookFile.url 
            }));
            res.json(paths);
        })
        .catch(error => {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
        });
});
  

const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.put('/images/:id', asyncHandler(async (req, res) => {
  const imageCollection = req.app.locals.imageCollection;
  const imageData = {
    name: req.body.name,
    author: req.body.author,
    numchapters: req.body.numchapters,
    description: req.body.description
  };
  const id = req.params.id;
  const result = await imageCollection.updateOne({ _id: id }, { $set: imageData });
  if (result.modifiedCount === 0) {
    return res.status(404).send('Image not found');
  }
  // send the updated image data as the response
  res.json(imageData);
}));
  
      
  
app.delete('/images/:id', async (req, res) => {
try {
    const id = req.params.id;
    const deletedImage = await deleteImage(id);
    if (!deletedImage) {
    return res.status(404).send('Image not found');
    }
    res.send('Image deleted successfully');
} catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
}
});
  
  app.delete('/images/:id/deleteS3', async (req, res) => {
    const { id } = req.params;
    try {
      const image = await Image.findById(id);
      if (!image) {
        return res.status(404).json({ error: 'Image not found' });
      }
      const s3 = new AWS.S3();
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: image.key,
      };
      s3.deleteObject(params, (error, data) => {
        if (error) {
          console.error(error);
          res.status(500).json({ error: 'Server error' });
        } else {
          res.json(data);
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

app.listen(3001, () => console.log('App listening on 3001'));