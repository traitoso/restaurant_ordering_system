import { Router } from "express";
import type { OrderController } from "../controllers/OrderController.js";

export function orderRoutes(controller: OrderController): Router {
    const router = Router();

    router.get("/", controller.getAll);
    router.get("/:id", controller.getById);
    router.post("/", controller.create);
    router.put("/:id", controller.update);
    router.delete("/:id", controller.remove);

    return router;
}
