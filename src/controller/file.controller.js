const uploadFile = require("../middleware/upload");
const https = require('https');
//const http = require('http');
const fs = require("fs");
const util = require('util');
const baseUrl = "http://localhost:3000/files/";
const extract = require('extract-zip')
const path = require("path");
const exec = util.promisify(require('child_process').exec);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const DataDrive = '/pdfdata';
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
const downloadUrl = 'https://nodepdfapi.iriscarbon.com/files/';

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
      pdfFilePath = path.join(DataDrive, AppData, pdfFolder);
      HtmlFileSaveDirectory = path.join(DataDrive, HtmlOutputDirectory, pdfFolder);
      console.log('HTMLFileSaveDirectory is : '+ HtmlFileSaveDirectory);


      try {
        const extractZip = await extract(pdfPath, { dir: pdfFilePath })
        //debugger;
        console.log('extraction completed');
        tempPdfFilePath = await findFileByExt(pdfFilePath, 'pdf');
        console.log(tempPdfFilePath);
        if (pdfFlags == undefined) {
          pdfFlags = '--zoom 1.5 --tounicode 1 --no-drm 1';
        }
        conversionResult = await ConvertPdfToHtml(tempPdfFilePath, HtmlFileSaveDirectory, pdfFolder, pdfFlags, instance);
        //conversionResult = true;
        if (true) {
          res.status(200).send({
            message: `Click on the link below or copy and paste on browser to download the file \n  ${downloadUrl}${pdfFolder}`,
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


async function ConvertPdfToHtml(tempPdfFilePath, HtmlFileSaveDirectory, pdfFolder, pdfFlags, instance) {
  try {
    // var { stdout, stderr } = await exec(`pdf2htmlEX ${pdfFlags} "${tempPdfFilePath}"  "/${HtmlOutputDirectory}/${pdfFolder}/${pdfFolder}.html"`);
    var { stdout, stderr } = await exec(`pdf2htmlEX ${pdfFlags} "${tempPdfFilePath}" "${HtmlFileSaveDirectory}/${pdfFolder}/${pdfFolder}.html"`);
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
    
    console.log('conversion finished');
          // setTimeout(() => {
      // exec(`zip -r htmloutput *`, { cwd: HtmlFileSaveDirectory });
      // }, 2000);
      await delay(5000);
    
    console.log('HTML File path is :' + HtmlFileSaveDirectory);
    console.log('zipping start');
    try {
      exec(`zip -r htmloutput *`, { cwd: HtmlFileSaveDirectory });
    } catch (error) {
      console.log('Zipping Error is : ' + error);
    }

      console.log('zipping finished');
      if (instance != null && instance != undefined) {
          CallExternalAPIForUpdate(pdfFolder, instance);
        }
  } catch (error) {
    console.log('Error is : ' + error);
    console.log('ERROR IS : ' + stderr);
  }


}

const download = (req, res) => {
  const fileName = req.params.name;
  const htmloutput = 'htmloutput.zip';
  const directoryPath = path.join(DataDrive, HtmlOutputDirectory, fileName, htmloutput);
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
  // getListFiles,
  download,
};
