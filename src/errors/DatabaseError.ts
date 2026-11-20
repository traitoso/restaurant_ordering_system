import { AppError } from "./AppError.js";

/** Falha inesperada de comunicação com o banco de dados (HTTP 500). */
export class DatabaseError extends AppError {
    constructor(message = "Erro ao acessar o banco de dados.") {
        super(message, 500);
    }
}
