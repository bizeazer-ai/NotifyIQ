import { envSchema } from "@notifyiq/schemas";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// 1. Check if required variables are already defined in the system process (e.g. in Kubernetes container)
const hasSystemEnv = process.env.DB_URI && process.env.NEST_PORT;

if (!hasSystemEnv) {
  // 2. Local development fallback: dynamically search for .env climbing up from process.cwd()
  let currentDir = process.cwd();
  let envPath = "";
  while (currentDir) {
    const potentialPath = path.join(currentDir, ".env");
    if (fs.existsSync(potentialPath)) {
      envPath = potentialPath;
      break;
    }
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }

  if (envPath) {
    console.log(`[Config] Loading local env variables from: ${envPath}`);
    dotenv.config({ path: envPath });
  } else {
    console.log("[Config] No local .env file found, relying on system environment.");
  }
} else {
  console.log("[Config] Production environment detected. Skipping .env file search and using injected system variables.");
}

// 3. Validate variables using Zod schema
const result = envSchema.safeParse(process.env);
if (!result.success) {
  console.error("❌ Invalid environment variables configuration:");
  const formatted = result.error.format();
  for (const [key, value] of Object.entries(formatted)) {
    if (key !== "_errors" && value && "_errors" in value) {
      console.error(`   - ${key}: ${value._errors.join(", ")}`);
    }
  }
  process.exit(1);
}

export const env = result.data;