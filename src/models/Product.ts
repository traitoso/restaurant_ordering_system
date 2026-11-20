import { ValidationError } from "../errors/ValidationError.js";
import { isUUID } from "../utils/validators.js";

export interface ProductProps {
    id?: string | undefined;
    categoryId: unknown;
    name: unknown;
    description?: unknown;
    price: unknown;
    imageUrl?: unknown;
    available?: unknown;
    active?: unknown;
    createdAt?: string | undefined;
}

export const MAX_PRODUCT_PRICE = 99999.99;

/**
 * Produto do cardápio. Pertence a uma categoria e só pode ser
 * pedido quando está ativo e disponível.
 */
export class Product {
    private readonly id: string | undefined;
    private readonly createdAt: string | undefined;
    private categoryId = "";
    private name = "";
    private description: string | null = null;
    private price = 0;
    private imageUrl: string | null = null;
    private available = true;
    private active = true;

    constructor(props: ProductProps) {
        this.id = props.id;
        this.createdAt = props.createdAt;

        this.moveToCategory(props.categoryId);
        this.rename(props.name);
        this.changeDescription(props.description ?? null);
        this.changePrice(props.price);
        this.changeImageUrl(props.imageUrl ?? null);

        if (props.available !== undefined) this.setAvailable(props.available);
        if (props.active !== undefined) this.setActive(props.active);
    }

    public getId(): string | undefined {
        return this.id;
    }

    public getCategoryId(): string {
        return this.categoryId;
    }

    public getName(): string {
        return this.name;
    }

    public getDescription(): string | null {
        return this.description;
    }

    public getPrice(): number {
        return this.price;
    }

    public getImageUrl(): string | null {
        return this.imageUrl;
    }

    public isAvailable(): boolean {
        return this.available;
    }

    public isActive(): boolean {
        return this.active;
    }

    /** Regra de negócio: só pode ser pedido se estiver ativo e disponível. */
    public canBeOrdered(): boolean {
        return this.active && this.available;
    }

    public moveToCategory(categoryId: unknown): void {
        if (!isUUID(categoryId)) {
            throw new ValidationError("category_id deve ser um UUID válido.");
        }
        this.categoryId = categoryId;
    }

    public rename(name: unknown): void {
        if (typeof name !== "string" || name.trim().length === 0) {
            throw new ValidationError("O nome do produto é obrigatório.");
        }
        if (name.trim().length > 120) {
            throw new ValidationError("O nome do produto deve ter no máximo 120 caracteres.");
        }
        this.name = name.trim();
    }

    public changeDescription(description: unknown): void {
        if (description === null) {
            this.description = null;
            return;
        }
        if (typeof description !== "string") {
            throw new ValidationError("A descrição do produto deve ser um texto.");
        }
        this.description = description.trim() || null;
    }

    public changePrice(price: unknown): void {
        if (typeof price !== "number" || !Number.isFinite(price)) {
            throw new ValidationError("O preço do produto deve ser um número.");
        }
        if (price <= 0) {
            throw new ValidationError("O preço do produto deve ser maior que zero.");
        }
        if (price > MAX_PRODUCT_PRICE) {
            throw new ValidationError(`O preço do produto não pode ultrapassar ${MAX_PRODUCT_PRICE}.`);
        }
        if (Math.abs(Math.round(price * 100) - price * 100) > 1e-6) {
            throw new ValidationError("O preço do produto deve ter no máximo 2 casas decimais.");
        }
        this.price = price;
    }

    public changeImageUrl(imageUrl: unknown): void {
        if (imageUrl === null) {
            this.imageUrl = null;
            return;
        }
        if (typeof imageUrl !== "string" || !/^https?:\/\/\S+$/i.test(imageUrl.trim())) {
            throw new ValidationError("image_url deve ser uma URL http(s) válida.");
        }
        this.imageUrl = imageUrl.trim();
    }

    public setAvailable(available: unknown): void {
        if (typeof available !== "boolean") {
            throw new ValidationError("available deve ser verdadeiro ou falso.");
        }
        this.available = available;
    }

    public setActive(active: unknown): void {
        if (typeof active !== "boolean") {
            throw new ValidationError("active deve ser verdadeiro ou falso.");
        }
        this.active = active;
    }

    public toJSON() {
        return {
            id: this.id,
            category_id: this.categoryId,
            name: this.name,
            description: this.description,
            price: this.price,
            image_url: this.imageUrl,
            available: this.available,
            active: this.active,
            created_at: this.createdAt,
        };
    }
}
