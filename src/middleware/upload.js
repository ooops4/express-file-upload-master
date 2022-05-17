const util = require("util");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const maxSize = 2 * 1024 * 1024 * 1024;
// const __basedir = '/pdfdata';
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

      if (!fs.existsSync(path.join(__basedir, AppData))) {
        fs.mkdirSync(path.join(__basedir, AppData));
      }

      if (!fs.existsSync(path.join(__basedir, HtmlOutputDirectory))) {
        fs.mkdirSync(path.join(__basedir, HtmlOutputDirectory));
        fs.chmodSync(path.join(__basedir, HtmlOutputDirectory), 0777);
      }

      if (!fs.existsSync(path.join(__basedir, AppData, pdfFolder))) {
        fs.mkdirSync(path.join(__basedir, AppData, pdfFolder));
        fs.chmodSync(path.join(__basedir, AppData, pdfFolder), 0777);
      }

      if (!fs.existsSync(path.join(__basedir, HtmlOutputDirectory, pdfFolder))) {
        fs.mkdirSync(path.join(__basedir, HtmlOutputDirectory, pdfFolder));
        fs.chmodSync(path.join(__basedir, HtmlOutputDirectory, pdfFolder), 0777);
      }

      cb(null, path.join(__basedir, AppData, pdfFolder));
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