const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const mongoUri = `mongodb://${process.env.accountName}:${process.env.mongokey}@${process.env.accountName}.documents.azure.com:${process.env.mongoport}/${process.env.mongoDatabaseName}?ssl=true`;

function connect() {
  mongoose.set('debug', true);
  return mongoose.connect(
    mongoUri,
    {
      useMongoClient: true
    }
  );
}

module.exports = {
  connect,
  mongoose
};
