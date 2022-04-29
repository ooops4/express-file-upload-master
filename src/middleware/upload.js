const util = require("util");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const maxSize = 2 * 1024 * 1024 * 1024;
let generationId = "";
const AppData = "AppData";
const XBRLOutputDirectory = "HTMLOutput";


let storage =
  multer.diskStorage({
    destination: (req, file, cb) => {

      generationId = req.body.docConvQueueId;
      zipFileName = file.originalname;
      // instance = req.body.instance;
      console.log(generationId);

      if (!fs.existsSync(path.join(__basedir, AppData))) {
        fs.mkdirSync(path.join(__basedir, AppData));
      }

      if (!fs.existsSync(path.join(__basedir, XBRLOutputDirectory))) {
        fs.mkdirSync(path.join(__basedir, XBRLOutputDirectory));
        // fs.chmodSync(path.join(__basedir, HtmlOutputDirectory), 0777);
      }

      if (!fs.existsSync(path.join(__basedir, AppData, generationId))) {
        fs.mkdirSync(path.join(__basedir, AppData, generationId));
      }

      if (!fs.existsSync(path.join(__basedir, XBRLOutputDirectory, generationId))) {
        fs.mkdirSync(path.join(__basedir, XBRLOutputDirectory, generationId));
        // fs.chmodSync(path.join(__basedir, HtmlOutputDirectory, pdfFolder), 0777);;
      }

      cb(null, path.join(__basedir, AppData, generationId));
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