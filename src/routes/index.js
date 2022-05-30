const express = require("express");
const router = express.Router();
const controller = require("../controller/file.controller");
const controllerzip = require("../controller/convertAndSendResponseAsZIP");

let routes = (app) => {
  router.post("/upload", controller.upload);
  router.post("/gethtmlzip", controllerzip.convertAndSendResponseAsZIP);
  // router.get("/files", controller.getListFiles);
  router.get("/files/:name", controller.download);

  app.use(router);
};

module.exports = routes;
