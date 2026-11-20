import { AppError } from "./AppError.js";

/** Recurso não encontrado (HTTP 404). */
export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404);
    }
}
