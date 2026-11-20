import { AppError } from "./AppError.js";

/** Dados de entrada inválidos (HTTP 400). */
export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}
