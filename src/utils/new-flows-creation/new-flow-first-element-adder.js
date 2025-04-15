import { queryDb } from "../../db/db-query.js";
/**
 * Asigna el primer ítem (elemento inicial) a un flujo en la tabla `messages_flows`.
 *
 * @async
 * @function newFlowFirstElementAdder
 * @param {Object} params - Parámetros para la operación.
 * @param {string} params.elementId - ID del ítem que será el primer elemento del flujo.
 * @param {string} params.flowId - ID del flujo al que se asignará el primer ítem.
 * 
 * @returns {Promise<boolean>} Retorna `true` si la operación fue exitosa.
 * @throws {Error} Lanza un error si la consulta a la base de datos falla.
 */
export async function newFlowFirstElementAdder({elementId, flowId}){
    let query = `
        UPDATE messages_flows
        SET trigger_data = jsonb_set(trigger_data, '{first_item_id}', $1::jsonb)
        WHERE id = $2;
    `;
    let params = [
        JSON.stringify(elementId),
        flowId
    ];
    try {
        await queryDb(query, params, false);
        return true;
    } catch (error) {
        console.error(`newFlowFirstElementAdder | Error al agregar el primer elemento ${elementId} al flujo ${flowId}:`, error);
        throw error;
    }
}