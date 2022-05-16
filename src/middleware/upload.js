const util = require("util");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const maxSize = 2 * 1024 * 1024 * 1024;
const DataDrive = '/pdfdata';
let pdfFolder = '';
const AppData = 'AppData';
const HtmlOutputDirectory = 'HTMLOutput';


let storage =
  multer.diskStorage({
    destination: (req, file, cb) => {

      pdfFolder = req.body.docConvQueueId;
      zipFileName = file.originalname;
      instance = req.body.instance;
      console.log(pdfFolder);

      if (!fs.existsSync(path.join(DataDrive, AppData))) {
        fs.mkdirSync(path.join(DataDrive, AppData));
      }

      if (!fs.existsSync(path.join(DataDrive, HtmlOutputDirectory))) {
        fs.mkdirSync(path.join(DataDrive, HtmlOutputDirectory));
        // fs.chmodSync(path.join(DataDrive, HtmlOutputDirectory), 0777);
      }

      if (!fs.existsSync(path.join(DataDrive, AppData, pdfFolder))) {
        fs.mkdirSync(path.join(DataDrive, AppData, pdfFolder));
      }

      if (!fs.existsSync(path.join(DataDrive, HtmlOutputDirectory, pdfFolder))) {
        fs.mkdirSync(path.join(DataDrive, HtmlOutputDirectory, pdfFolder));
        // fs.chmodSync(path.join(DataDrive, HtmlOutputDirectory, pdfFolder), 0777);;
      }

      cb(null, path.join(DataDrive, AppData, pdfFolder));
    },
    filename: (req, file, cb) => {
      console.log(file.originalname);
      cb(null, file.originalname);
    },
  });

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single("file");

let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;