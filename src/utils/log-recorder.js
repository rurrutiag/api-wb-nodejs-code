import { queryDb } from "../db/db-query.js";

export async function logRecorder(registry){
    try {
        let query = `
                INSERT INTO server_logs(log)
                VALUES ($1::jsonb);
            `;
        let params = [registry];
        const recording = await queryDb(query, params, false);
    } catch (error) {
        console.error("error details:", error);
        throw new Error(`Error al registrar log: ${error.response?.data?.error?.message}`);
    }
}