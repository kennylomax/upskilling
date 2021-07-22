const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const stepSchema = new Schema(
  {
    Title : String,
    uid: { type: String, required: true, unique: true },
    Description :String,
    Thumb : String,
    Url : String,
    Type : String,
    Tags : String,
    Comments : String,
    Tree : String,
    Recommender : String,
    DateMS: Number,
    ip: String,
    NumLikes:Number,
    TestData: String
  },
  {
    collection: 'steps',
    read: 'nearest'
  }
);

const MongoStep  = mongoose.model('MongoStep', stepSchema);
module.exports = MongoStep;
