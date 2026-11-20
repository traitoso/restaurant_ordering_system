import { BusinessRuleError } from "../errors/BusinessRuleError.js";
import { ValidationError } from "../errors/ValidationError.js";
import { roundMoney } from "../utils/validators.js";
import { OrderItem, type OrderItemProps } from "./OrderItem.js";

export const ORDER_STATUSES = ["pending", "preparing", "ready", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Fluxo permitido de status do pedido. */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
};

export interface OrderProps {
    id?: string | undefined;
    customerName: unknown;
    tableNumber?: unknown;
    notes?: unknown;
    status?: unknown;
    items: OrderItemProps[];
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
}

export function isOrderStatus(value: unknown): value is OrderStatus {
    return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

const STATUS_MESSAGE = `status deve ser um dos valores: ${ORDER_STATUSES.join(", ")}.`;

/**
 * Pedido do autoatendimento. Concentra as regras de negócio do pedido:
 * total calculado a partir dos itens, fluxo de status e restrições de
 * alteração/exclusão conforme a etapa em que o pedido se encontra.
 */
export class Order {
    private readonly id: string | undefined;
    private readonly createdAt: string | undefined;
    private readonly updatedAt: string | undefined;
    private customerName = "";
    private tableNumber: number | null = null;
    private notes: string | null = null;
    private status: OrderStatus = "pending";
    private items: OrderItem[] = [];

    constructor(props: OrderProps) {
        this.id = props.id;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;

        if (props.status !== undefined) {
            if (!isOrderStatus(props.status)) {
                throw new ValidationError(STATUS_MESSAGE);
            }
            this.status = props.status;
        }

        this.applyCustomerName(props.customerName);
        this.applyTableNumber(props.tableNumber ?? null);
        this.applyNotes(props.notes ?? null);
        this.setItems(props.items);
    }

    public getId(): string | undefined {
        return this.id;
    }

    public getCustomerName(): string {
        return this.customerName;
    }

    public getTableNumber(): number | null {
        return this.tableNumber;
    }

    public getNotes(): string | null {
        return this.notes;
    }

    public getStatus(): OrderStatus {
        return this.status;
    }

    public getItems(): readonly OrderItem[] {
        return this.items;
    }

    /** Total do pedido: soma dos subtotais dos itens. */
    public getTotal(): number {
        return roundMoney(this.items.reduce((sum, item) => sum + item.getSubtotal(), 0));
    }

    public isFinalized(): boolean {
        return this.status === "delivered" || this.status === "cancelled";
    }

    /** Somente pedidos pendentes ou cancelados podem ser excluídos. */
    public canBeDeleted(): boolean {
        return this.status === "pending" || this.status === "cancelled";
    }

    public canTransitionTo(next: OrderStatus): boolean {
        return ALLOWED_TRANSITIONS[this.status].includes(next);
    }

    public changeStatus(next: unknown): void {
        if (!isOrderStatus(next)) {
            throw new ValidationError(STATUS_MESSAGE);
        }
        if (next === this.status) return;
        if (!this.canTransitionTo(next)) {
            throw new BusinessRuleError(
                `Não é possível alterar o status do pedido de "${this.status}" para "${next}".`
            );
        }
        this.status = next;
    }

    public changeCustomerName(name: unknown): void {
        this.ensureNotFinalized();
        this.applyCustomerName(name);
    }

    public changeTableNumber(tableNumber: unknown): void {
        this.ensureNotFinalized();
        this.applyTableNumber(tableNumber);
    }

    public changeNotes(notes: unknown): void {
        this.ensureNotFinalized();
        this.applyNotes(notes);
    }

    /** Os itens só podem ser alterados enquanto o pedido está pendente. */
    public replaceItems(items: OrderItemProps[]): void {
        if (this.status !== "pending") {
            throw new BusinessRuleError("Os itens só podem ser alterados enquanto o pedido estiver pendente.");
        }
        this.setItems(items);
    }

    private setItems(items: OrderItemProps[]): void {
        if (!Array.isArray(items) || items.length === 0) {
            throw new ValidationError("O pedido deve possuir ao menos um item.");
        }

        const merged = new Map<string, OrderItem>();
        for (const props of items) {
            const item = new OrderItem(props);
            const existing = merged.get(item.getProductId());
            if (existing) {
                // Mesmo produto informado mais de uma vez: soma as quantidades.
                existing.changeQuantity(existing.getQuantity() + item.getQuantity());
            } else {
                merged.set(item.getProductId(), item);
            }
        }
        this.items = [...merged.values()];
    }

    private ensureNotFinalized(): void {
        if (this.isFinalized()) {
            throw new BusinessRuleError("Pedidos entregues ou cancelados não podem ser alterados.");
        }
    }

    private applyCustomerName(name: unknown): void {
        if (typeof name !== "string" || name.trim().length === 0) {
            throw new ValidationError("O nome do cliente é obrigatório.");
        }
        if (name.trim().length > 100) {
            throw new ValidationError("O nome do cliente deve ter no máximo 100 caracteres.");
        }
        this.customerName = name.trim();
    }

    private applyTableNumber(tableNumber: unknown): void {
        if (tableNumber === null) {
            this.tableNumber = null;
            return;
        }
        if (
            typeof tableNumber !== "number" ||
            !Number.isInteger(tableNumber) ||
            tableNumber < 1 ||
            tableNumber > 999
        ) {
            throw new ValidationError("table_number deve ser um número inteiro entre 1 e 999.");
        }
        this.tableNumber = tableNumber;
    }

    private applyNotes(notes: unknown): void {
        if (notes === null) {
            this.notes = null;
            return;
        }
        if (typeof notes !== "string") {
            throw new ValidationError("notes deve ser um texto.");
        }
        if (notes.length > 255) {
            throw new ValidationError("notes deve ter no máximo 255 caracteres.");
        }
        this.notes = notes.trim() || null;
    }

    public toJSON() {
        return {
            id: this.id,
            customer_name: this.customerName,
            table_number: this.tableNumber,
            status: this.status,
            notes: this.notes,
            total: this.getTotal(),
            items: this.items.map((item) => item.toJSON()),
            created_at: this.createdAt,
            updated_at: this.updatedAt,
        };
    }
}
