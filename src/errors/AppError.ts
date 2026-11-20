/**
 * Erro base da aplicação. Cada subclasse define o código HTTP
 * correspondente, permitindo que o middleware de erros traduza
 * exceções de negócio em respostas padronizadas.
 */
export class AppError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode = 500) {
        super(message);
        this.name = new.target.name;
        this.statusCode = statusCode;
    }
}
