import { ValidationError } from "../errors/ValidationError.js";

export interface CategoryProps {
    id?: string | undefined;
    name: unknown;
    description?: unknown;
    icon?: unknown;
    displayOrder?: unknown;
    active?: unknown;
    createdAt?: string | undefined;
}

/**
 * Categoria do cardápio (ex.: Lanches, Bebidas).
 * Os atributos são privados e só podem ser alterados pelos métodos,
 * que garantem que a categoria esteja sempre em um estado válido.
 */
export class Category {
    private readonly id: string | undefined;
    private readonly createdAt: string | undefined;
    private name = "";
    private description: string | null = null;
    private icon: string | null = null;
    private displayOrder = 0;
    private active = true;

    constructor(props: CategoryProps) {
        this.id = props.id;
        this.createdAt = props.createdAt;

        this.rename(props.name);
        this.changeDescription(props.description ?? null);
        this.changeIcon(props.icon ?? null);
        this.changeDisplayOrder(props.displayOrder ?? 0);

        if (props.active !== undefined) {
            this.setActive(props.active);
        }
    }

    public getId(): string | undefined {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getDescription(): string | null {
        return this.description;
    }

    public getIcon(): string | null {
        return this.icon;
    }

    public getDisplayOrder(): number {
        return this.displayOrder;
    }

    public isActive(): boolean {
        return this.active;
    }

    public rename(name: unknown): void {
        if (typeof name !== "string" || name.trim().length === 0) {
            throw new ValidationError("O nome da categoria é obrigatório.");
        }
        if (name.trim().length > 80) {
            throw new ValidationError("O nome da categoria deve ter no máximo 80 caracteres.");
        }
        this.name = name.trim();
    }

    public changeDescription(description: unknown): void {
        if (description === null) {
            this.description = null;
            return;
        }
        if (typeof description !== "string") {
            throw new ValidationError("A descrição da categoria deve ser um texto.");
        }
        if (description.length > 255) {
            throw new ValidationError("A descrição da categoria deve ter no máximo 255 caracteres.");
        }
        this.description = description.trim() || null;
    }

    public changeIcon(icon: unknown): void {
        if (icon === null) {
            this.icon = null;
            return;
        }
        if (typeof icon !== "string") {
            throw new ValidationError("O ícone da categoria deve ser um texto.");
        }
        this.icon = icon.trim() || null;
    }

    public changeDisplayOrder(displayOrder: unknown): void {
        if (typeof displayOrder !== "number" || !Number.isInteger(displayOrder) || displayOrder < 0) {
            throw new ValidationError("display_order deve ser um número inteiro não negativo.");
        }
        this.displayOrder = displayOrder;
    }

    public setActive(active: unknown): void {
        if (typeof active !== "boolean") {
            throw new ValidationError("active deve ser verdadeiro ou falso.");
        }
        this.active = active;
    }

    public activate(): void {
        this.active = true;
    }

    public deactivate(): void {
        this.active = false;
    }

    public toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            icon: this.icon,
            display_order: this.displayOrder,
            active: this.active,
            created_at: this.createdAt,
        };
    }
}
