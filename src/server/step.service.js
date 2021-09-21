const MongoStep = require('./step.model');
const MongoPath = require('./path.model');
const ReadPreference = require('mongodb').ReadPreference;
const https = require('https');
const azure = require('azure-storage');
const { BlobServiceClient } = require('@azure/storage-blob');
const util = require('util')
const formidable = require('formidable');
const { getInterpolationArgsLength } = require('@angular/compiler/src/render3/view/util');

let imagesOnAzure = new Map()

require('./mongo').connect();

function scrapeContent(req, response) {
  var url = req.body.url.toString();
  if (url.includes("//www.googleapis"))
    url += `&key=${process.env.youtubeapikey}`

  if(!isValidHttpUrl(url))
    return;

  var request = https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Did not get an OK from the server. Code: ${res.statusCode}`);
      res.resume();
      response.status(200).json("{'Message':'NoDataAvailable'}");
      return;
    }
    let data = '';
    res.on('data', (chunk) => {
      data += chunk ;
    });
  
    res.on('close', () => {
      data = '{"Content": "'+ encodeURIComponent(data)+'" }'
      response.status(200).json(data);
    });
  });

  request.on('error', (e) => {
    response.status(200).json("{'Message','NoDataAvailable'}");
  });
}

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "https:";
}

async function setImageBlob(sourceUrl, imageName ) {
  process.env['AZURE_STORAGE_ACCOUNT'] = `${process.env.azurestorageimageaccount}`
  process.env['AZURE_STORAGE_ACCESS_KEY'] = `${process.env.azurestorageimageaccountkey}`
  var request = require('request').defaults({ encoding: null });
  const requestPromise = util.promisify(request);
  const blobServiceClient = BlobServiceClient.fromConnectionString(`${process.env.azurestorageimageconnectionstring}`);
  const containerClient = blobServiceClient.getContainerClient(`${process.env.azurestorageimageacontainername}`);
  const blockBlobClient = containerClient.getBlockBlobClient(imageName);
  if (sourceUrl.includes("://")){
    requestPromise(sourceUrl).then(
      o => {
      return  blockBlobClient.upload(o.body, o.body.length);
    }
   )
  }
  else {
    return  blockBlobClient.uploadFile(sourceUrl);
  }
}

function getImageBlobUrl(imageName) {
  console.log("IN getImageBlobUrl "+imageName)
  process.env['AZURE_STORAGE_ACCOUNT'] = `${process.env.azurestorageimageaccount}`
  process.env['AZURE_STORAGE_ACCESS_KEY'] = `${process.env.azurestorageimageaccountkey}`
  var blobService = azure.createBlobService();
  var sharedAccessPolicy = {
    AccessPolicy: {
      Permissions: azure.BlobUtilities.SharedAccessPermissions.READ,
      Start: azure.date.minutesFromNow(-5),
      Expiry: azure.date.daysFromNow(365),
    },
  };
  var sasToken = blobService.generateSharedAccessSignature(`${process.env.azurestorageimageacontainername}`, imageName, sharedAccessPolicy);
  var sasUrl = blobService.getUrl(`${process.env.azurestorageimageacontainername}`, imageName, sasToken);
  return sasUrl;
}

function getSteps(req, res) {
  var filter="{}"
  if (req.url.includes("?testing"))
    filter = {"TestData": "True"};
  else
    filter = {   $or: [
       {"TestData": { $exists: false }} ,
       {"TestData": "False"}
      ] };

  const stepquery = MongoStep.find(filter).read(ReadPreference.NEAREST);
  const pathquery = MongoPath.find(filter).read(ReadPreference.NEAREST);

  stepquery
    .exec()
    .then(steps => {
      for (const p in steps) {
        if (steps[p].Thumb && steps[p].Thumb.length>0){
          if (!imagesOnAzure.has(steps[p].uid))
            imagesOnAzure.set(steps[p].uid, getImageBlobUrl(steps[p].uid))
          steps[p].Thumb = imagesOnAzure.get(steps[p].uid);
        }
      }
      pathquery
        .exec()
        .then(paths => {
          res.status(200).json({ "steps": steps, "paths": paths });
        });

    })
    .catch(error => {
      res.status(500).send(error);
      return;
    });
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function postStep(req, res) {
  var testData = req.url.includes("?testing")

  const originalStep = {
    Title: req.body.Title,
    Description: req.body.Description,
    Thumb: req.body.Thumb,
    Url: req.body.Url,
    Type: req.body.Type,
    Tree: req.body.Tree,
    Tags: req.body.Tags,
    NumLikes: req.body.NumLikes,
    Comments: req.body.Comments,
    Recommender: req.body.Recommender,
    ip: req.body.ip,
    uid: req.body.uid,
    DateMS: new Date().getTime(),
    TestData: testData? "True": "False",
  };

  if (!originalStep.uid || originalStep.uid.length==0)
    originalStep.uid = uuidv4();

  MongoStep.findOne({ uid: originalStep.uid }, (error, step) => {
    if (step != null) {
      if (step._id != originalStep._id)
        console.log("ID DIFF: "+step._id +" "+originalStep._id )

      step.uid = originalStep.uid,
      step.Title = originalStep.Title,
      step.Description = originalStep.Description,
      step.Thumb = originalStep.Thumb,
      step.Url = originalStep.Url,
      step.Type = originalStep.Type,
      step.Tree = originalStep.Tree,
      step.Tags = originalStep.Tags,
      step.Comments = originalStep.Comments,
      step.DateMS = originalStep.DateMS,
      step.ip = originalStep.ip,
      step.Recommender = originalStep.Recommender,
      step.NumLikes = originalStep.NumLikes,
      step.TestData = originalStep.TestData,

      step.save(error => {
        console.log("RET "+error);
        if (checkServerError(res, error)) {
          console.log("ERROR "+error);
          return;
        }
        res.status(200).json(step);
        console.log('Step updated successfully!');
      });
    }
    else {
      const mongoStep = new MongoStep(originalStep);
      mongoStep.save(error => {
        if (checkServerError(res, error)){
          console.log("ERROR "+error)
          return;
        }
        res.status(201).json(mongoStep);
        console.log('Step created successfully!'+ JSON.stringify(originalStep));
        if (originalStep.Thumb && originalStep.Thumb.length>0){
          console.log("Saving thumb " +originalStep.Thumb+ " "+originalStep.uid)
          setImageBlob( originalStep.Thumb , originalStep.uid ).then(
            o => console.log("postStep::setImageBlobPromised Returned")
          );
        }
        console.log("postStep::setImageBlobPromised Outside")
      });
    }
  });
}

function deleteStep(req, res) {
  const uid = req.params.uid;
  MongoStep.findOneAndRemove({ uid: uid })
    .then(step => {
      if (!checkFound(res, step)) return;
      res.status(200).json(step);
      console.log('Step deleted successfully!');
    })
    .catch(error => {
      if (checkServerError(res, error)) return;
    });
}

function checkServerError(res, error) {
  if (error) {
    res.status(500).send(error);
    return error;
  }
}

function checkFound(res, step) {
  if (!step) {
    res.status(404).send('Step not found.');
    return;
  }
  return step;
}

function savePath(req, res) {

  var testData = req.url.includes("?testing")

  const origPath = {
    uid: req.params.uid,
    Title: req.body.Title,
    Description: req.body.Description,
    StepIds: req.body.StepIds,
    Contact: req.body.Contact,
    TestData: testData ? "True" : "False"
  };

  console.log("AA" + origPath.Title)
  MongoPath.findOne({ uid: origPath.uid }, (error, path) => {
    if (path != null) {
      console.log("BB " + origPath.Title + "Description "+ origPath.Description )
      path.Description = origPath.Description;
      path.StepIds = origPath.StepIds;
      path.Contact = origPath.Contact;
      path.Title = origPath.Title;
      path.save(error => {
        if (checkServerError(res, error)) return;
        res.status(200).json(path);
        console.log('Path updated successfully!');
      });
    }
    else {
      console.log("CC" + origPath.Title)
      const mongoPath = new MongoPath(origPath);
      mongoPath.save(error => {
        console.log("DD" + origPath.Title)
        if (checkServerError(res, error)) return;
        res.status(200).json(mongoPath);
        console.log('Path updated successfully!');
      });
    }
  });
}

function deletePath(req, res) {
  const uid = req.params.uid;
  MongoPath.findOneAndRemove({ uid: uid })
    .then(step => {
      if (!checkFound(res, step)) return;
      res.status(200).json(step);
      console.log('Path deleted successfully!');
    })
    .catch(error => {
      if (checkServerError(res, error)) return;
    });
}

function uploadThumb(req, res) {
  const uid = req.params.uid;
  const form = formidable({ multiples: true });
  form.parse(req, (err, fields, files) => {
     setImageBlob(files.logo.path, uid ).then (o => {
        res.writeHead(200, { 'content-type': 'application/json' });
        console.log("setImageBlob "+JSON.stringify(o))
        var imageUrl= getImageBlobUrl(uid );
        console.log("setImageBlobB "+imageUrl)
        res.end(JSON.stringify({ "imageUrl": imageUrl }, null, 2));
      }
     )
  });
}

module.exports = {
  getSteps,
  postStep,
  deleteStep,
  scrapeContent,
  savePath,
  deletePath,
  uploadThumb
};
