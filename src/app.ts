import express from "express";
import { randomUUID } from "node:crypto";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Restaurant Ordering System - API",
        version: "1.0.0",
    });
});

const categories = [
    {
        "id": randomUUID(),
        "name": "Pizzas",
        "description": "Pizzas salgadas com sabores tradicionais, especiais e opções personalizadas."
    },
    {
        "id": randomUUID(),
        "name": "Bebidas",
        "description": "Bebidas para acompanhar a refeição, incluindo refrigerantes, sucos, águas e outras opções."
    },
    {
        "id": randomUUID(),
        "name": "Sobremesas",
        "description": "Opções doces para finalizar o pedido, como pizzas doces, brownies, sorvetes e outras sobremesas."
    }
];

const products = [
    {
        "id": randomUUID(),
        "categoryId": 1,
        "name": "Pizza Calabresa",
        "description": "Pizza com molho de tomate, mussarela, calabresa fatiada, cebola e orégano.",
        "price": 49.90
    },
    {
        "id": randomUUID(),
        "categoryId": 2,
        "name": "Coca-Cola 2L",
        "description": "Refrigerante Coca-Cola de 2 litros, ideal para acompanhar a pizza.",
        "price": 12.90
    },
    {
        "id": randomUUID(),
        "categoryId": 3,
        "name": "Pizza de Chocolate",
        "description": "Pizza doce com cobertura cremosa de chocolate e granulado.",
        "price": 39.90
    }
];

app.get("/categories", (req, res) => {
    res.status(200).json(categories);
});

app.get("/categories/:id", (req, res) => {
    const category = categories.find((category) => {
        return category.id == req.params.id
    });

    if (!category) {
        return res.status(404).json({
            message: "Categoria não encontrada.",
        });
    }

    res.status(200).json(category);
});

app.get("/products", (req, res) => {
    res.status(200).json(products);
});

app.get("/products/:id", (req, res) => {
    const product = products.find((product) => {
        return product.id == req.params.id
    });

    if (!product) {
        return res.status(404).json({
            message: "Categoria não encontrada.",
        });
    }

    res.status(200).json(product);
});

export default app;