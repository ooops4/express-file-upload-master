const uploadFile = require("../middleware/upload");
const fs = require("fs");
const baseUrl = "http://localhost:8080/files/";
const extract = require('extract-zip')
const path = require("path");
const { exec, execSync } = require('child_process');
const AppData = 'AppData';
const HtmlOutputDirectory = 'HTMLOutput';
var pdfFolder = '';
var pdfFilePath = '';
var tempPdfFilePath = '';
var conversionResult = '';
var HtmlFileSaveDirectory = '';

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
      pdfFilePath = path.join(__basedir, AppData, pdfFolder);
      HtmlFileSaveDirectory = path.join(__basedir, HtmlOutputDirectory, pdfFolder);


      try {
        await extract(pdfPath, { dir: pdfFilePath })
        console.log('extraction completed');
        tempPdfFilePath = findFileByExt(pdfFilePath, 'pdf');
        console.log(tempPdfFilePath);
        conversionResult = ConvertPdfToHtml(tempPdfFilePath, HtmlFileSaveDirectory, pdfFolder);


      } catch (err) {
        console.log(err)

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

function ConvertPdfToHtml(tempPdfFilePath, HtmlFileSaveDirectory, pdfFolder) {
  console.log(tempPdfFilePath);
  // debugger;
  // var child = childProcess.exec('pdf2htmlEX',['--zoom', '1.5', `${tempPdfFilePath}`, `${pdfFilePath}/htmloutput.html`],
  var child = exec(`pdf2htmlEX --zoom 1.5 -f 1 -l 2 ${tempPdfFilePath} /${HtmlOutputDirectory}/${pdfFolder}/${pdfFolder}.html`,
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

      console.log(HtmlFileSaveDirectory);
      execSync(`zip -r htmloutput *`, {
        cwd: HtmlFileSaveDirectory
      });

    } else {

    }
    console.log('Child process exited with exit code ' + code);
  });
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

module.exports = {
  upload,
  getListFiles,
  download,
};
