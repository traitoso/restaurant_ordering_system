import { ValidationError } from "../errors/ValidationError.js";
import { isUUID, roundMoney } from "../utils/validators.js";

export const MAX_ITEM_QUANTITY = 50;

export interface OrderItemProps {
    id?: string | undefined;
    productId: unknown;
    productName?: string | null | undefined;
    quantity: unknown;
    unitPrice: unknown;
}

/**
 * Item de um pedido. Guarda o preço unitário do produto no momento
 * do pedido, para que mudanças futuras de preço não alterem pedidos antigos.
 */
export class OrderItem {
    private readonly id: string | undefined;
    private readonly productId: string;
    private readonly productName: string | null;
    private readonly unitPrice: number;
    private quantity = 0;

    constructor(props: OrderItemProps) {
        if (!isUUID(props.productId)) {
            throw new ValidationError("product_id deve ser um UUID válido.");
        }
        if (typeof props.unitPrice !== "number" || props.unitPrice <= 0) {
            throw new ValidationError("O preço unitário do item deve ser maior que zero.");
        }

        this.id = props.id;
        this.productId = props.productId;
        this.productName = props.productName ?? null;
        this.unitPrice = props.unitPrice;
        this.changeQuantity(props.quantity);
    }

    public getId(): string | undefined {
        return this.id;
    }

    public getProductId(): string {
        return this.productId;
    }

    public getProductName(): string | null {
        return this.productName;
    }

    public getQuantity(): number {
        return this.quantity;
    }

    public getUnitPrice(): number {
        return this.unitPrice;
    }

    public getSubtotal(): number {
        return roundMoney(this.unitPrice * this.quantity);
    }

    public changeQuantity(quantity: unknown): void {
        if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
            throw new ValidationError("A quantidade do item deve ser um número inteiro maior que zero.");
        }
        if (quantity > MAX_ITEM_QUANTITY) {
            throw new ValidationError(`A quantidade de um item não pode ultrapassar ${MAX_ITEM_QUANTITY}.`);
        }
        this.quantity = quantity;
    }

    public toJSON() {
        return {
            id: this.id,
            product_id: this.productId,
            product_name: this.productName,
            quantity: this.quantity,
            unit_price: this.unitPrice,
            subtotal: this.getSubtotal(),
        };
    }
}
