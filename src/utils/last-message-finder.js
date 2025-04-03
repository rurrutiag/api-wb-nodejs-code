import { queryDb } from "../db/db-query.js";
/**
 * Obtiene el último mensaje enviado por el "from" dentro de una sesión específica.
 *
 * @param {Object} params - Objeto con los parámetros de búsqueda.
 * @param {string} params.flowSession - La clave de la sesión en la caché.
 * @param {string} params.from - De quien es el mensaje: receiver o sender.
 * @returns {Object|null} El último mensaje del "from" con el índice más alto o `null` si no hay mensajes.
 */
export async function lastMessageFinder({flowData, from=null}){
    const { company, receive, sender, flow, flowNumber } = flowData;
    let query;
    let params;
    // Capturamos los mensajes para el flujo en ejecución
    if (from !== null){
        query = `
            SELECT id, interaction_index, from, content_type, content, previous_item_id, metadata
            FROM messages
            WHERE
                platform = "wab" AND
                company_id = $1 AND
                company_media = $2 AND
                user_media = $3 AND
                flow_id = $4 AND
                flow_number = $5 AND
                "from" = $6
            ORDER BY interaction_index DESC
            LIMIT 1
        `;
        params = [
            company,
            receive,
            sender,
            flow,
            flowNumber,
            from
        ];
    } else {
        query = `
            SELECT id, interaction_index, from, content_type, content, previous_item_id, metadata
            FROM messages
            WHERE
                platform = "wab" AND
                company_id = $1 AND
                company_media = $2 AND
                user_media = $3 AND
                flow_id = $4 AND
                flow_number = $5
            ORDER BY interaction_index DESC
            LIMIT 1
        `;
        params = [
            company,
            receive,
            sender,
            flow,
            flowNumber,
            from
        ];
    }
    const dbResponse = await queryDb(query, params, false);
    // Search last message
    if (dbResponse && dbResponse.length > 0) {
        const row = dbResponse[0];
        return {
            item_id: row.id,
            interaction_index: row.interaction_index,
            from: row.from,
            content_type: row.content_type,
            content: row.content,
            previous_item_id: row.previous_item_id,
            metadata: row.metadata
        };
    } else {
        console.log("lastMessageFinder","No se encontraron resultados");
        return null;
    }
}