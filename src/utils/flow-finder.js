import { queryDb } from "../db/db-query.js";

/**
 * Busca flujos activos asociados a una empresa, receptor y remitente específicos.
 *
 * @param {Object} params - Parámetros para la búsqueda de flujos.
 * @param {string} params.companyId - Identificador único de la empresa.
 * @param {string} params.receiver - Identificador del receptor del mensaje.
 * @param {string} params.sender - Identificador del remitente del mensaje.
 * @returns {string[] | null} Un array con las claves de los flujos activos si existen, o `null` si no hay coincidencias.
 */
export async function flowFinder({
    companyId, receiver, sender
}) {
    try {
        let query = `
            SELECT *
            FROM started_flows
            WHERE
                active = $1 AND
                company_id = $2 AND
                company_media = $3 AND
                user_media = $4 AND
                platform = $5
            ORDER BY created_at DESC
        `;
        let params = [
            true,
            companyId,
            receiver,
            sender,
            "wab"
        ];
        let dbResponse = await queryDb(query, params, false);
        if (dbResponse.length > 0) {
            return dbResponse[0];
        } else {
            return null;
        }
    } catch (error) {
        throw new Error(`Error en flowFinder: ${e.message}`);
    }
}