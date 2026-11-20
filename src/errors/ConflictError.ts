import { AppError } from "./AppError.js";

/** Conflito com o estado atual dos dados, ex.: duplicidade ou vínculo (HTTP 409). */
export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409);
    }
}
