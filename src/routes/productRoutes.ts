import { Router } from "express";
import type { ProductController } from "../controllers/ProductController.js";

export function productRoutes(controller: ProductController): Router {
    const router = Router();

    router.get("/", controller.getAll);
    router.get("/:id", controller.getById);
    router.post("/", controller.create);
    router.put("/:id", controller.update);
    router.delete("/:id", controller.remove);

    return router;
}
