import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Retorna o cliente do Supabase (criado sob demanda).
 * As credenciais vêm de variáveis de ambiente e nunca ficam no código.
 */
export function getSupabase(): SupabaseClient {
    if (!client) {
        const url = process.env.SUPABASE_URL;
        const secretKey = process.env.SUPABASE_SECRET_KEY;

        if (!url || !secretKey) {
            throw new Error(
                "Variáveis de ambiente SUPABASE_URL e SUPABASE_SECRET_KEY não configuradas."
            );
        }

        client = createClient(url, secretKey, {
            auth: { persistSession: false },
        });
    }

    return client;
}
