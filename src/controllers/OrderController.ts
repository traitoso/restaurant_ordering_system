import type { Request, Response } from "express";
import type { OrderService } from "../services/OrderService.js";
import { parseStringQuery } from "../utils/validators.js";

/** Controller de pedidos. */
export class OrderController {
    private readonly service: OrderService;

    constructor(service: OrderService) {
        this.service = service;
    }

    getAll = async (req: Request, res: Response) => {
        const orders = await this.service.list(parseStringQuery(req.query.status));
        res.status(200).json(orders);
    };

    getById = async (req: Request, res: Response) => {
        const order = await this.service.getById(req.params.id);
        res.status(200).json(order);
    };

    create = async (req: Request, res: Response) => {
        const order = await this.service.create(req.body ?? {});
        res.status(201).json(order);
    };

    update = async (req: Request, res: Response) => {
        const order = await this.service.update(req.params.id, req.body);
        res.status(200).json(order);
    };

    remove = async (req: Request, res: Response) => {
        await this.service.delete(req.params.id);
        res.status(200).json({ message: "Pedido removido com sucesso." });
    };
}
