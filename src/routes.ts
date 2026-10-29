import { Router } from "express";
import { PlantaController } from "./controllers/PlantaController";

const routes = Router();
const plantaController = new PlantaController();

routes.get("/", (req, res) => {
  return res.status(200).json({ message: "API do treinamento de CRUD do CITI 🌱" });
});

// CRUD de Plantas
routes.post("/plantas", plantaController.create);
routes.get("/plantas", plantaController.findAll);
routes.get("/plantas/:id", plantaController.findById);
routes.patch("/plantas/:id", plantaController.update);
routes.delete("/plantas/:id", plantaController.delete);

export { routes };