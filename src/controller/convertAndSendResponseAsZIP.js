const uploadFile = require("../middleware/upload");
const https = require('https');
const fs = require("fs");
var AdmZip = require('adm-zip');
const util = require('util');
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
var pdfFlags = '';

const convertAndSendResponseAsZIP = async (req, res) => {
  try {
    await uploadFile(req, res);
    console.log('file save finished');
    if (req.file == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }
    if (req.file.path != undefined && req.file.path != null) {
      console.log('req.file.path:' +req.file.path);
      var pdfPath = req.file.path;
      pdfFolder = req.body.docConvQueueId;
      pdfFlags = req.body.pdfFlags;
      var instance = req.body.instance;
      pdfFilePath = path.join(DataDrive, AppData, pdfFolder);
      HtmlFileSaveDirectory = path.join("../../../../"+DataDrive, HtmlOutputDirectory, pdfFolder);
      // htmlfilepath = path.join(DataDrive,HtmlOutputDirectory,pdfFolder,pdfFolder+".html")

      console.log('HTMLFileSaveDirectory is : ' + HtmlFileSaveDirectory);


      try {
        try {
          console.log('pdfFilePath is ' + pdfFilePath);
          await extract(pdfPath, { dir: pdfFilePath })

        } catch (error) {
          console.log('ExtractZIP:' + error);
          return res.status(400).send({ message: `Error in extracting zip \n Error is ${error}`});
        }
        //debugger;
        console.log('extraction completed');
        try {
          tempPdfFilePath = await findFileByExt(pdfFilePath, 'pdf');
        } catch (error) {
          console.log('findFileByExt:' + error);
          return res.status(400).send({ message: `Error in finding PDF file \n Error is ${error}`});
        }

        console.log(tempPdfFilePath);
        if (pdfFlags == undefined) {
          pdfFlags = '--zoom 1.5 --tounicode 1 --no-drm 1';
        }
        console.log('conversion starting');
        conversionResult = await ConvertPdfToHtml(tempPdfFilePath, HtmlFileSaveDirectory, pdfFolder, pdfFlags, instance);
        //conversionResult = true;
        if (conversionResult) {
          try {
            var zip = new AdmZip();
            var absolutepath = path.join(HtmlFileSaveDirectory, pdfFolder + ".html");
            zip.addLocalFile(absolutepath);
            var zipFileContents = zip.toBuffer();
            const fileName = 'output.zip';
            const fileType = 'application/zip';
            res.writeHead(200, {
              'Content-Disposition': `attachment; filename="${fileName}"`,
              'Content-Type': fileType,
            })
            res.end(zipFileContents);
          } catch (error) {
            console.log('ErrorAttachingZIP : ' + err);
          }
        }
      } catch (err) {
        console.log('Error main: ' + err);
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
    console.log('Conversion Started');
    var { stdout, stderr } = await exec(`pdf2htmlEX ${pdfFlags} "${tempPdfFilePath}" "${HtmlFileSaveDirectory}/${pdfFolder}.html"`);
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
      console.log('zipping finished');
      return true;
    } catch (error) {
      console.log('Zipping Error is : ' + error);
    }
  } catch (error) {
    console.log('Error is : ' + error);
  }


}

module.exports = {
  convertAndSendResponseAsZIP,
};
