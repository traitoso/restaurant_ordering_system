import express from "express";
import { CategoryController } from "./controllers/CategoryController.js";
import { OrderController } from "./controllers/OrderController.js";
import { ProductController } from "./controllers/ProductController.js";
import { openApiSpec, swaggerHtml } from "./docs/swagger.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { CategoryRepository } from "./repositories/CategoryRepository.js";
import { OrderRepository } from "./repositories/OrderRepository.js";
import { ProductRepository } from "./repositories/ProductRepository.js";
import { categoryRoutes } from "./routes/categoryRoutes.js";
import { orderRoutes } from "./routes/orderRoutes.js";
import { productRoutes } from "./routes/productRoutes.js";
import { CategoryService } from "./services/CategoryService.js";
import { OrderService } from "./services/OrderService.js";
import { ProductService } from "./services/ProductService.js";

// =====================
// Injeção de dependências (Repository -> Service -> Controller)
// =====================
const categoryRepository = new CategoryRepository();
const productRepository = new ProductRepository();
const orderRepository = new OrderRepository();

const categoryService = new CategoryService(categoryRepository, productRepository);
const productService = new ProductService(productRepository, categoryRepository, orderRepository);
const orderService = new OrderService(orderRepository, productRepository);

const app = express();
app.use(express.json());

// =====================
// Root
// =====================
app.get("/", (_req, res) => {
    res.status(200).json({
        message: "Restaurant Ordering System - API",
        version: "1.0.0",
        docs: "/api-docs",
    });
});

// =====================
// Documentação Swagger/OpenAPI
// =====================
app.get("/api-docs.json", (_req, res) => {
    res.status(200).json(openApiSpec);
});
app.get("/api-docs", (_req, res) => {
    res.status(200).type("html").send(swaggerHtml);
});

// =====================
// Rotas das entidades
// =====================
app.use("/categories", categoryRoutes(new CategoryController(categoryService)));
app.use("/products", productRoutes(new ProductController(productService)));
app.use("/orders", orderRoutes(new OrderController(orderService)));

// =====================
// Tratamento de erros
// =====================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
