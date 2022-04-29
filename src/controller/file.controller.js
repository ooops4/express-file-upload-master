const uploadFile = require("../middleware/upload");
const https = require('https');
//const http = require('http');
const fs = require("fs");
const util = require('util');
const baseUrl = "http://localhost:3000/files/";
const extract = require('extract-zip')
const path = require("path");
const exec = util.promisify(require('child_process').exec);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const AppData = 'AppData';
const HtmlOutputDirectory = 'HTMLOutput';
var generationId = '';
var xbrlFolderPath = '';
var xbrlFilePath = '';
var conversionResult = '';
var taxonomyId = '';
var HtmlFileSaveDirectory = '';
var logFile = '';
const logFileName = 'Error.xml';
const apiPath = '/api/DocumentConversion/UpdateDocConvQueue';
//const debugApi = 'localhost';
//const debugPort = '48947';
const externalAPI = 'api.iriscarbon.com';
var generationFlags = '';
const devuiURL = 'devui';
const downloadUrl = 'https://nodepdfapi.iriscarbon.com/files/';
const arelleLocation = 'ArellePath';
const validationParameter = '--plugins "xule" --xule-rule-set';
const taxonomyDirectory = "Directory with all taxonomy folder";
// const taxonomyZipPath = 'ValidationZipPath';
// const validationZipPath = 'ValidationZipPath';
// const renderingZipPath = '';
const validationZipFile = 'V.zip';
const taxonomyZipFile = 'T.zip';
const renderingZipFile = 'R.zip';
var validationZipPath = '';
var renderingZipPath = '';
var taxonomyZipPath = '';



const upload = async (req, res) => {
  try {
    await uploadFile(req, res);

    if (req.file == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }
    if (req.file.path != undefined && req.file.path != null) {
      console.log(req.file.path);
      var pdfPath = req.file.path;
      generationId = req.body.generationFlag;
      generationFlags = req.body.pdfFlags;
      var instance = req.body.instance;
      taxonomyId = req.body.taxonomyId;
      xbrlFolderPath = path.join(__basedir, AppData, generationId);
      // HtmlFileSaveDirectory = path.join(__basedir, HtmlOutputDirectory, generationFlag);
      logFile = path.join(xbrlFolderPath,logFileName);


      try {
        const extractZip = await extract(pdfPath, { dir: xbrlFolderPath })
        console.log('extraction completed');
        xbrlFilePath = await findFileByExt(xbrlFolderPath, 'xbrl');
        console.log(xbrlFilePath);
        validationZipPath = path.join(taxonomyDirectory, taxonomyId, validationZipFile);
        taxonomyZipPath = path.join(taxonomyDirectory, taxonomyId, taxonomyZipFile);
        // arelle location
        // --plugins "xule" --xule-rule-set 
        // "/home/pdfadmin/arelleFiles/V.zip" 
        // -f "/home/pdfadmin/xbrlsamples/testduke/testduke.xbrl" 
        // -v 
        // --logFile "/home/pdfadmin/xbrlsamples/testduke/Error.xml" 
        //below others
        // --packages "/home/pdfadmin/arelleFiles/m32u94u409m432/T.zip"
        // --packages "/home/pdfadmin/arelleFiles/m32u94u409m432/V.zip"
        // --packages "/home/pdfadmin/arelleFiles/m32u94u409m432/R.zip"
        conversionResult = await RunArelle(arelleLocation, validationParameter, validationZipPath, xbrlFilePath, logFile, taxonomyZipPath, generationId, generationFlags, instance);
        //conversionResult = true;
        if (true) {
          res.status(200).send({
            message: `Click on the link below or copy and paste on browser to download the file \n  ${downloadUrl}${generationId}`,
          });
        }

      } catch (err) {
        console.log('Error : ' + err);
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
      // message: `Could not upload the file: ${req.file.originalname}. ${err}`,
      message: `Conversion Failed !! \n Please check the PDF conversion flags or the file you have uploaded. \n\n Error : ${err}`,

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


// RunArelle(tempPdfFilePath, null, generationId, generationFlags, instance);
async function RunArelle(arelleLocation, validationParameter, validationZipPath, xbrlFilePath, logFile, taxonomyZipPath,) {
  try {
    // var { stdout, stderr } = await exec(`pdf2htmlEX ${pdfFlags} "${tempPdfFilePath}"  "/${HtmlOutputDirectory}/${pdfFolder}/${pdfFolder}.html"`);
    
        // arelle location
        // --plugins "xule" --xule-rule-set 
        // "/home/pdfadmin/arelleFiles/V.zip" 
        // -f "/home/pdfadmin/xbrlsamples/testduke/testduke.xbrl" 
        // -v 
        // --logFile "/home/pdfadmin/xbrlsamples/testduke/Error.xml" 
        //below others
        // --packages "/home/pdfadmin/arelleFiles/m32u94u409m432/T.zip"
    var { stdout, stderr } = await exec(`"${arelleLocation}" "${validationParameter}" "${validationZipPath}" -f "${xbrlFilePath}"  -v --logFile "${logFile}" --packages "${taxonomyZipPath}"`);
    console.log('stdout:', stdout);
    console.error('stderr:', stderr);
    
      
      await delay(2000);
      exec(`zip -r htmloutput *`, { cwd: HtmlFileSaveDirectory });

      
      if (instance != null && instance != undefined) {
          CallExternalAPIForUpdate(pdfFolder, instance);
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
  console.log(directoryPath);
  res.download(directoryPath, htmloutput, (err) => {
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
    'QueueId': queueId,
    'IsPicked' : false
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
    path: apiPath,
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
