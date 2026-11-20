import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";

/** Rota inexistente (HTTP 404). */
export function notFoundHandler(req: Request, res: Response) {
    res.status(404).json({ message: `Rota ${req.method} ${req.originalUrl} não encontrada.` });
}

/**
 * Middleware global de erros: converte as exceções da aplicação
 * em respostas JSON padronizadas com o código HTTP correto.
 */
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }

    // JSON malformado enviado no corpo da requisição.
    if (error instanceof SyntaxError && "body" in error) {
        res.status(400).json({ message: "JSON inválido no corpo da requisição." });
        return;
    }

    console.error("Erro inesperado:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
}
