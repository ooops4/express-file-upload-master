const uploadFile = require("../middleware/upload");
const fs = require("fs");
const baseUrl = "http://localhost:8080/files/";
const extract = require('extract-zip')
const path = require("path");
// const { spawn, exec } = require('child_process');
const execFile = require('child_process').execFile;
const AppData = 'AppData';
var pdfFolder = '';
var pdfFilePath = '';
var tempPdfFilePath = '';
var conversionResult = '';




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

      try {
        await extract(pdfPath, { dir: pdfFilePath })
        console.log('extraction completed');
        tempPdfFilePath = findFileByExt(pdfFilePath, 'pdf');
        console.log(tempPdfFilePath);
        conversionResult = ConvertPdfToHtml(tempPdfFilePath)


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

// function ConvertPdfToHtml(tempPdfFilePath) {
//   console.log(tempPdfFilePath);
//   // var child = spawn(`docker run -ti --rm -v E:/carbon/temp:/pdf pdf2htmlex/pdf2htmlex:0.18.8.rc1-master-20200630-Ubuntu-focal-x86_64 --zoom 1.5 "OceanTeam_2020_FF.pdf"`)
//   var child = spawn(`dir`);
//   // console.log('ConvertPdfToHtml executed and the path is = ' + child);
//   child.on('exit', function (code, signal) {
//     console.log('child process exited with ' +
//                 `code ${code} and signal ${signal}`);
//   });
//   child.stdout.on('data', (data) => {
//     console.log(`child stdout:\n${data}`);
//   });

//   child.stderr.on('data', (data) => {
//     console.error(`child stderr:\n${data}`);
//   });


// }

function ConvertPdfToHtml(tempPdfFilePath) {
  console.log(tempPdfFilePath);
  // var child = spawn(`docker run -ti --rm -v E:/carbon/temp:/pdf pdf2htmlex/pdf2htmlex:0.18.8.rc1-master-20200630-Ubuntu-focal-x86_64 --zoom 1.5 "OceanTeam_2020_FF.pdf"`)
  var child = exec.exec(`dir`,
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
    console.log('Child process exited with exit code ' + code);
  });
}

function ConvertPdfToHtml(tempPdfFilePath) {
  debugger;
  console.log(tempPdfFilePath);
  // var child = spawn(`docker run -ti --rm -v E:/carbon/temp:/pdf pdf2htmlex/pdf2htmlex:0.18.8.rc1-master-20200630-Ubuntu-focal-x86_64 --zoom 1.5 "OceanTeam_2020_FF.pdf"`)
  const child = execFile('node', ['--version'], (error, stdout, stderr) => {
    if (error) {
        console.error('stderr', stderr);
        throw error;
    }
    console.log('stdout', stdout);
});

  // ls.stdout.on('data', (data) => {
  //   console.log(`stdout: ${data}`);
  // });

  // ls.stderr.on('data', (data) => {
  //   console.error(`stderr: ${data}`);
  // });

  // ls.on('close', (code) => {
  //   console.log(`child process exited with code ${code}`);
  // });
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
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  res.download(directoryPath + fileName, fileName, (err) => {
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
