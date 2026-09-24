import type { Request, Response } from "express";
import Category from "../model/Category.js";

async function getAll(req: Request, res: Response) {
    try {
        const categories = await Category.findAll();

        res.status(200).json(categories);
    } catch (error) {
        console.error("Erro ao buscar categorias:", error);

        res.status(500).json({ message: "Erro ao buscar categorias." });
    }
}

async function searchbyKeyword(req: Request<{ keyword: string }>, res: Response) {
    const { keyword } = req.params;

    if (!keyword) {
        res.status(400).json({ message: "Palavra-chave não fornecida." });
        return;
    }

    try {
        const categories = await Category.searchByKeyword(keyword);

        res.status(200).json(categories);
    } catch (error) {
        console.error("Erro ao pesquisar categorias:", error);

        res.status(500).json({ message: "Erro ao pesquisar categorias." });
    }
}

async function getById(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(400).json({ message: "ID da categoria não fornecido." });
        return;
    }

    try {
        const category = await Category.findById(id);

        res.status(200).json(category);
    } catch (error) {
        console.error("Erro ao buscar categoria:", error);

        res.status(500).json({ message: "Erro ao buscar categoria." });
    }
}

async function create(req: Request, res: Response) {
    try {
        const category = await Category.create(req.body);

        res.status(201).json(category);
    } catch (error) {
        console.error("Erro ao criar categoria:", error);

        res.status(500).json({ message: "Erro ao criar categoria." });
    }
}

async function update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(400).json({ message: "ID da categoria não fornecido." });
        return;
    }

    try {
        const category = await Category.update(id, req.body);

        res.status(200).json(category);
    } catch (error) {
        console.error("Erro ao atualizar categoria:", error);

        res.status(500).json({ message: "Erro ao atualizar categoria." });
    }
}

async function remove(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;

    if (!id) {
        res.status(400).json({ message: "ID da categoria não fornecido." });
        return;
    }

    try {
        await Category.remove(id);

        res.status(200).json({ message: "Categoria removida com sucesso." });
    } catch (error) {
        console.error("Erro ao excluir categoria:", error);

        res.status(500).json({ message: "Erro ao excluir categoria." });
    }
}

export default {
    getAll,
    searchbyKeyword,
    getById,
    create,
    update,
    remove
};
