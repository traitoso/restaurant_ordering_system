import type { Request, Response } from "express";
import type { ProductService } from "../services/ProductService.js";
import { parseBooleanQuery, parseStringQuery } from "../utils/validators.js";

/** Controller de produtos. */
export class ProductController {
    private readonly service: ProductService;

    constructor(service: ProductService) {
        this.service = service;
    }

    getAll = async (req: Request, res: Response) => {
        const products = await this.service.list({
            search: parseStringQuery(req.query.search),
            categoryId: parseStringQuery(req.query.category_id),
            available: parseBooleanQuery(req.query.available, "available"),
            active: parseBooleanQuery(req.query.active, "active"),
        });
        res.status(200).json(products);
    };

    getById = async (req: Request, res: Response) => {
        const product = await this.service.getById(req.params.id);
        res.status(200).json(product);
    };

    create = async (req: Request, res: Response) => {
        const product = await this.service.create(req.body ?? {});
        res.status(201).json(product);
    };

    update = async (req: Request, res: Response) => {
        const product = await this.service.update(req.params.id, req.body);
        res.status(200).json(product);
    };

    remove = async (req: Request, res: Response) => {
        await this.service.delete(req.params.id);
        res.status(200).json({ message: "Produto removido com sucesso." });
    };
}
