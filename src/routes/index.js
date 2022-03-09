import { Router } from "express";
const router = Router();
import controller from "../controller/file.controller";

let routes = (app) => {
  router.post("/upload", controller.upload);
  router.get("/files", controller.getListFiles);
  router.get("/files/:name", controller.download);

  app.use(router);
};

export default routes;
