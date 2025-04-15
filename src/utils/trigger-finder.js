import businessFlowTriggersHunter from "./business-flow-triggers-hunter.js";

function doesMessageMatchSupply(message, supply) {
    switch (message.type) {
        case "text":
            return supply.text && supply.text?.body && message.text?.body && message.text?.body === supply.text?.body;
        case "interactive":
            return (
                message.interactive &&
                message.interactive?.type === supply.interactive?.type &&
                message.interactive?.[message.interactive.type]?.id === supply.interactive?.[message.interactive.type]?.id
            );
        default:
            return false;
    }
}

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
export default async function triggerFinder({
    companyId,
    message
}) {
    
    const flowTriggers = await businessFlowTriggersHunter();
    let triggersMatrix = {};
    //  Asegurar que trigger_data sea parseado y esté como array
    Object.entries(flowTriggers).forEach(([company, triggers]) => {
        triggersMatrix[company] = triggers;
    });

    let companyTriggers = triggersMatrix[companyId];
    // const triggers = getCache(`triggers:${companyId}`);
    
    if (!companyTriggers || companyTriggers.length === 0) {
        return null;
    }

    for (const trigger of companyTriggers) {
        if ( trigger.trigger_type === "basic" ) {
            const supplies = trigger.trigger_data?.supplies ?? [];
            for (const supply of supplies) {
                if (doesMessageMatchSupply(message, supply)) {
                    return {
                        flow_id: trigger.flow_id,
                        first_item_id: trigger.trigger_data.first_item_id
                    }
                }
            }
            
        }
    }   
    return null;
}