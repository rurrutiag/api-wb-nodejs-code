import { queryDb } from "../../db/db-query.js";
/**
 * Actualiza un ítem de flujo en la base de datos.
 *
 * @async
 * @function newFlowItemRowUpdater
 * @param {Object} params - Parámetros para la actualización del ítem.
 * @param {number} params.company_id - ID de la empresa.
 * @param {Object[]} params.platform - Plataforma asociada (JSON).
 * @param {string} params.content_type - Tipo de contenido.
 * @param {Object} params.content - Contenido del ítem.
 * @param {string} params.type_expected_response - Tipo de respuesta esperada.
 * @param {string|null} params.previous_item_id - ID del ítem anterior.
 * @param {Object|null} params.next_item_id - Objeto con IDs de los siguientes ítems.
 * @param {number} params.flow_id - ID del flujo.
 * @param {string} params.id - ID del ítem a actualizar.
 * @param {Object|null} [params.metadata] - Metadata adicional.
 * 
 * @returns {Promise<boolean>} Retorna true si fue exitoso.
 * @throws {Error} Lanza un error si la operación falla.
 */
export async function newFlowItemRowUpdater({
    company_id,
    platform,
    content_type,
    content,
    type_expected_response,
    previous_item_id,
    next_item_id,
    flow_id,
    id,
    metadata
}){
    let query = `
        UPDATE message_flows_items
        SET
            company_id = $1,
            platform = $2::jsonb,
            content_type = $3,
            content = $4,
            type_expected_response = $5,
            previous_item_id = $6::jsonb,
            next_item_id = $7::jsonb,
            flow_id = $8,
            metadata = $10::jsonb
        WHERE
            id = $9
    `;
    let params = [
        company_id,
        JSON.stringify(platform),
        content_type,
        content,
        type_expected_response,
        JSON.stringify(previous_item_id),
        JSON.stringify(next_item_id),
        flow_id,
        id,
        metadata
    ];
    try {
        const dbResponse = await queryDb(query, params, false);
        return true;
    } catch (error) {
        console.error(`newFlowItemRowUpdater | Error al actualizar item ${id} en el flujo ${flow_id}:`, error);
        throw error; // o return false, según tu patrón de manejo
    }
}