import type { Request, Response } from "express";
import type { CategoryService } from "../services/CategoryService.js";
import { parseBooleanQuery, parseStringQuery } from "../utils/validators.js";

/**
 * Controller de categorias: recebe a requisição HTTP, delega ao service
 * e devolve a resposta com o código HTTP adequado. Erros são tratados
 * pelo middleware global (errorHandler).
 */
export class CategoryController {
    private readonly service: CategoryService;

    constructor(service: CategoryService) {
        this.service = service;
    }

    getAll = async (req: Request, res: Response) => {
        const categories = await this.service.list({
            search: parseStringQuery(req.query.search),
            active: parseBooleanQuery(req.query.active, "active"),
        });
        res.status(200).json(categories);
    };

    search = async (req: Request, res: Response) => {
        const keyword = parseStringQuery(req.query.keyword);
        if (!keyword) {
            res.status(400).json({ message: "Palavra-chave não informada." });
            return;
        }
        const categories = await this.service.list({ search: keyword });
        res.status(200).json(categories);
    };

    getById = async (req: Request, res: Response) => {
        const category = await this.service.getById(req.params.id);
        res.status(200).json(category);
    };

    create = async (req: Request, res: Response) => {
        const category = await this.service.create(req.body ?? {});
        res.status(201).json(category);
    };

    update = async (req: Request, res: Response) => {
        const category = await this.service.update(req.params.id, req.body);
        res.status(200).json(category);
    };

    remove = async (req: Request, res: Response) => {
        await this.service.delete(req.params.id);
        res.status(200).json({ message: "Categoria removida com sucesso." });
    };
}
