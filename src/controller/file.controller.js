import uploadFile from "../middleware/upload";
import { request } from 'https';
//const http = require('http');
import { readdirSync, statSync, readdir } from "fs";
const baseUrl = "http://localhost:3000/files/";
import extract from 'extract-zip';
import { join } from "path";
import { exec, execSync, ChildProcess } from 'child_process';
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
      pdfFilePath = join(__basedir, AppData, pdfFolder);
      HtmlFileSaveDirectory = join(__basedir, HtmlOutputDirectory, pdfFolder);


      try {
        await extract(pdfPath, { dir: pdfFilePath })
        console.log('extraction completed');
        tempPdfFilePath = findFileByExt(pdfFilePath, 'pdf');
        console.log(tempPdfFilePath);
        if (pdfFlags == undefined) {
          pdfFlags = '--zoom 1.5 --tounicode 1 ';
        }
        conversionResult = ConvertPdfToHtml(tempPdfFilePath, HtmlFileSaveDirectory, pdfFolder, pdfFlags, instance);
        //conversionResult = true;

      } catch (err) {
        console.log('Error : ' + err)

      }
    }

    res.status(200).send({
      message: "Uploaded the file successfully: " + req.file.originalname,
    });
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

function findFileByExt(pdfFilePath, ext) {
  var files = readdirSync(pdfFilePath);
  var result = '';

  files.forEach(
    function (file) {
      var newbase = join(pdfFilePath, file);
      if (statSync(newbase).isDirectory()) {
        result = findFileByExt(newbase, ext, readdirSync(newbase), result);
      } else {
        if (file.substr(-1 * (ext.length + 1)) == '.' + ext) {
          result = newbase;
        }
      }
    }
  )
  return result;
}

function ConvertPdfToHtml(tempPdfFilePath, HtmlFileSaveDirectory, pdfFolder, pdfFlags, instance) {
  console.log(tempPdfFilePath);
  // debugger;
  // var child = childProcess.exec('pdf2htmlEX',['--zoom', '1.5', `${tempPdfFilePath}`, `${pdfFilePath}/htmloutput.html`],
  var child = exec(`pdf2htmlEX ${pdfFlags} ${tempPdfFilePath} /${HtmlOutputDirectory}/${pdfFolder}/${pdfFolder}.html`,
  // var child = exec(`dir`,
    function (error, stdout, stderr) {
      if (error) {
        console.log(error.stack);
        console.log('Error code: ' + error.code);
        console.log('Signal received: ' + error.signal);
      }
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
    });
  child.on('exit', function (code) {
    if (code == 0) {
      console.log('Conversion Completed and Child process exited with code: ' + code);
      console.log(HtmlFileSaveDirectory);
      // var makeAZipFileTest = exec(`zip -r htmloutput *`, { cwd: HtmlFileSaveDirectory }, function (error, stdout, stderr) {

      var makeAZipFileTest = exec(`zip -r htmloutput *`, { cwd: HtmlFileSaveDirectory }, function (error, stdout, stderr) {
        if (error) {
          console.log(error.stack);
          console.log('Error code: ' + error.code);
          console.log('Signal received: ' + error.signal);
        }
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
      });
      makeAZipFileTest.on('exit', function (code) {
        if (code == 0) {
          console.log('Zipping successfull and Child process exited with code: ' + code);
          console.log(HtmlFileSaveDirectory);
        }
      });
    } else {

    }
    console.log('Child process exited with exit code ' + code);
  });
}

const getListFiles = (req, res) => {
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  readdir(directoryPath, function (err, files) {
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
  const directoryPath = join(__basedir, HtmlOutputDirectory, fileName, htmloutput);
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
  var req = request(options, (res) => {
    console.log('External API Ended and Status Code :' + res.statusCode);
    //console.log('headers:', res.headers);

    res.on('data', (d) => {
      console.log('External API Ended and on Data :' + d);
      process.stdout.write(d);
    });
  });

  req.on('error', (e) => {
    console.log('External API Called and ERROR : ' + e);
    console.error(e);
  });

  req.write(postData);
  req.end();
}

export default {
  upload,
  getListFiles,
  download,
};
