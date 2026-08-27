import { env } from "./env.js";
import mongoose from "mongoose";

let connected = false;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectToDatabase = async () => {
    let retryCount = 5;
    while (retryCount > 0) {
        try {
            console.log("Connecting to MongoDB...");
            const connection = await mongoose.connect(env.DB_URI, {
                keepAliveInitialDelay: 300000,
                autoIndex: process.env.NODE_ENV !== "production", // avoid performance issues with index generation in production
            });
            if (connection.connections[0]?.readyState === 1) {
                // Secure logging: extract host and db name to avoid leaking password credentials in logs
                const { host, name } = connection.connection;
                console.log(`Connected to MongoDB at ${host}/${name}`);
                connected = true;
            }
            return connection;
        } catch (error) {
            retryCount--;
            if (retryCount > 0) {
                console.warn(
                    `Failed to connect to MongoDB, retrying in 5s... (${retryCount} attempts left). Error:`,
                    error instanceof Error ? error.message : error
                );
                await delay(5000);
            } else {
                console.error("❌ Failed to connect to MongoDB after 5 attempts");
                process.exit(1);
            }
        }
    }
};

// export const db = await connectToDatabase();