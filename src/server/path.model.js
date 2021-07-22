const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const pathSchema = new Schema(
  {
    uid: { type: String, required: true, unique: true },
    Title : String,
    Description : String,
    Contact: String,
    StepIds: [String],
    TestData: String,
  },
  {
    collection: 'paths',
    read: 'nearest'
  }
);
const MongoPath = mongoose.model('MongoPath', pathSchema);
module.exports = MongoPath;
