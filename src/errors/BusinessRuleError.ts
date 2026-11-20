import { AppError } from "./AppError.js";

/** Operação válida sintaticamente, mas que viola uma regra de negócio (HTTP 422). */
export class BusinessRuleError extends AppError {
    constructor(message: string) {
        super(message, 422);
    }
}
