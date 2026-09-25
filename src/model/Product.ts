export interface Product {
    id: string;
    category_id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string | null;
    active: boolean;
}
