import { getCache } from "../cache/manager.js";

/**
 * Función que busca un desencadenador (trigger) en la caché basado en el tipo de mensaje y los datos del mensaje.
 * 
 * @param {Object} params - Objeto que contiene los parámetros necesarios para realizar la búsqueda.
 * @param {string} params.companyId - El ID de la compañía para buscar los desencadenadores (triggers) relacionados con esa compañía en la caché.
 * @param {Object} params.message - El mensaje que se va a comparar con los desencadenadores. Este objeto debe contener las siguientes propiedades:
 *   - {string} type - El tipo de mensaje (por ejemplo, "text").
 *   - {Object} text - El objeto de texto que contiene los datos específicos del mensaje cuando `type` es "text".
 *     - {string} body - El contenido del mensaje de texto que se va a comparar con el desencadenador.
 * 
 * @returns {Object|null} Retorna un objeto con los identificadores `flow_id` y `first_item_id` del desencadenador que coincida, o null si no hay coincidencias.
 */
export default function triggerFinder({
    companyId,
    message
}) {
    
    const triggers = getCache(`triggers:${companyId}`);
    
    if (!triggers || triggers.length === 0) {
        return null;
    }
    for (const trigger of triggers) {
        if (
            trigger.trigger_type === message.type
        ) {
            
            switch (message.type) {
                case "text":
                    if (message.text.body === trigger.trigger_data.text.body) {
                        return {
                            flow_id: trigger.flow_id,
                            first_item_id: trigger.trigger_data.first_item_id
                        };
                    }
                    break;
            
                default:
                    break;
            }
            return null;
        }
    }
    return null;
}