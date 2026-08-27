import { z } from "zod"; 
export const envSchema = z.object({
    DB_URI: z.string(),
    NEST_PORT: z.string(),
});