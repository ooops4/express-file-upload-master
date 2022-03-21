const uploadFile = require("../middleware/upload");
const https = require('https');
//const http = require('http');
const fs = require("fs");
const util = require('util');
const baseUrl = "http://localhost:3000/files/";
const extract = require('extract-zip')
const path = require("path");
const { ChildProcess } = require("child_process");
const { stderr, stdout } = require("process");
const exec = util.promisify(require('child_process').exec);
const AppData = 'AppData';
const HtmlOutputDirectory = 'HTMLOutput';
var pdfFolder = '';
var pdfFilePath = '';
var tempPdfFilePath = '';
var conversionResult = '';
var HtmlFileSaveDirectory = '';
const apiPath = '/api/DocumentConversion/UpdateDocConvQueue';
//const debugApi = 'localhost';
//const debugPort = '48947';
const externalAPI = 'api.iriscarbon.com';
var pdfFlags = '';
const devuiURL = 'devui';

const upload = async (req, res) => {
  try {
    await uploadFile(req, res);

    if (req.file == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }
    if (req.file.path != undefined && req.file.path != null) {
      console.log(req.file.path);
      var pdfPath = req.file.path;
      pdfFolder = req.body.docConvQueueId;
      pdfFlags = req.body.pdfFlags;
      var instance = req.body.instance;
      pdfFilePath = path.join(__basedir, AppData, pdfFolder);
      HtmlFileSaveDirectory = path.join(__basedir, HtmlOutputDirectory, pdfFolder);


      try {
        const extractZip = await extract(pdfPath, { dir: pdfFilePath })
        //debugger;
        console.log('extraction completed');
        tempPdfFilePath = await findFileByExt(pdfFilePath, 'pdf');
        console.log(tempPdfFilePath);
        if (pdfFlags == undefined) {
          pdfFlags = '--zoom 1.5 --tounicode 1 ';
        }
        conversionResult = await ConvertPdfToHtml(tempPdfFilePath, HtmlFileSaveDirectory, pdfFolder, pdfFlags, instance);
        //conversionResult = true;
        if (conversionResult) {
          res.status(200).send({
            message: "Click on the link and paste on browser to download file " + req.file.originalname,
          });
        }

      } catch (err) {
        console.log('Error : ' + err)

      }
    }

    // res.status(200).send({
    //   message: "Uploaded the file successfully: " + req.file.originalname,
    // });
  } catch (err) {
    console.log(err);

    if (err.code == "LIMIT_FILE_SIZE") {
      return res.status(500).send({
        message: "File size cannot be larger than 2MB!",
      });
    }

    res.status(500).send({
      message: `Could not upload the file: ${req.file.originalname}. ${err}`,
    });
  }
};

async function findFileByExt(pdfFilePath, ext) {
  var files = fs.readdirSync(pdfFilePath);
  var result = '';

  files.forEach(
    function (file) {
      var newbase = path.join(pdfFilePath, file);
      if (fs.statSync(newbase).isDirectory()) {
        result = findFileByExt(newbase, ext, fs.readdirSync(newbase), result);
      } else {
        if (file.substr(-1 * (ext.length + 1)) == '.' + ext) {
          result = newbase;
        }
      }
    }
  )
  return result;
}

async function ConvertPdfToHtml(tempPdfFilePath, HtmlFileSaveDirectory, pdfFolder, pdfFlags, instance) {
  try {
    var { stdout, stderr } = await exec(`pdf2htmlEX ${pdfFlags} "${tempPdfFilePath}"  "/${HtmlOutputDirectory}/${pdfFolder}/${pdfFolder}.html"`);
    console.log('stdout:', stdout);
    console.error('stderr:', stderr);
    if (stdout) {
      var { stdout, stderr } = await exec(`zip -r htmloutput *`, { cwd: HtmlFileSaveDirectory });
      if (stdout) {
        if (instance != null && instance != undefined) {
          CallExternalAPIForUpdate(pdfFolder, instance);
        }
      } else {
        //DO NOTHING
      }
    } else {
      //do nothing
    }
  } catch (error) {
    console.log('Error is : ' + error);
  }


}

const getListFiles = (req, res) => {
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      res.status(500).send({
        message: "Unable to scan files!",
      });
    }

    let fileInfos = [];

    files.forEach((file) => {
      fileInfos.push({
        name: file,
        url: baseUrl + file,
      });
    });


    res.status(200).send(fileInfos);
  });
};

const download = (req, res) => {
  const fileName = req.params.name;
  const htmloutput = 'htmloutput.zip';
  const directoryPath = path.join(__basedir, HtmlOutputDirectory, fileName, htmloutput);
  console.log(directoryPath)
  res.download(directoryPath, fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not download the file. " + err,
      });
    }
  });
};

function CallExternalAPIForUpdate(queueId, instance) {
  console.log('External API call initiated');
  var postData = JSON.stringify({
    'downloadpath': queueId,
    'QueueId': queueId
  });
  if (instance) {
    instance = instance.toLowerCase();
    instance += externalAPI;
  }
  else {
    instance = devuiURL + externalAPI;
  }

  var options = {
    hostname: instance,
    port: 443,
    path: '/api/DocumentConversion/UpdateDocConvQueue',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };
  //return;
  var req = https.request(options, (res) => {
    console.log('External API Ended and Status Code :' + res.statusCode);
    console.log('Instance  :' + options.hostname);
    //console.log('headers:', res.headers);

    res.on('data', (d) => {
      //console.log('External API Ended and on Data :' + d);
      //process.stdout.write(d);
    });
  });

  req.on('error', (e) => {
    console.log('External API Called and ERROR : ' + e);
    console.error(e);
  });

  req.write(postData);
  req.end();
}

module.exports = {
  upload,
  getListFiles,
  download,
};
