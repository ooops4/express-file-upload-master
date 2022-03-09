import { promisify } from "util";
import multer, { diskStorage } from "multer";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
const maxSize = 2 * 1024 * 1024 * 1024;
let pdfFolder = "";
const AppData = "AppData";
const HtmlOutputDirectory = "HTMLOutput";


let storage =
  diskStorage({
    destination: (req, file, cb) => {

      pdfFolder = req.body.docConvQueueId;
      zipFileName = file.originalname;
      instance = req.body.instance;
      console.log(pdfFolder);

      if (!existsSync(join(__basedir, AppData))) {
        mkdirSync(join(__basedir, AppData));
      }

      if (!existsSync(join(__basedir, HtmlOutputDirectory))) {
        mkdirSync(join(__basedir, HtmlOutputDirectory));
        // fs.chmodSync(path.join(__basedir, HtmlOutputDirectory), 0777);
      }

      if (!existsSync(join(__basedir, AppData, pdfFolder))) {
        mkdirSync(join(__basedir, AppData, pdfFolder));
      }

      if (!existsSync(join(__basedir, HtmlOutputDirectory, pdfFolder))) {
        mkdirSync(join(__basedir, HtmlOutputDirectory, pdfFolder));
        // fs.chmodSync(path.join(__basedir, HtmlOutputDirectory, pdfFolder), 0777);;
      }

      cb(null, join(__basedir, AppData, pdfFolder));
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

let uploadFileMiddleware = promisify(uploadFile);
export default uploadFileMiddleware;