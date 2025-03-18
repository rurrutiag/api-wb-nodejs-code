import { getCache } from "../cache/manager.js";
/**
 * Obtiene el último mensaje enviado por el "from" dentro de una sesión específica.
 *
 * @param {Object} params - Objeto con los parámetros de búsqueda.
 * @param {string} params.flowSession - La clave de la sesión en la caché.
 * @param {string} params.from - De quien es el mensaje: receiver o sender.
 * @returns {Object|null} El último mensaje del "from" con el índice más alto o `null` si no hay mensajes.
 *
 * @example
 * // Datos en caché:
 * {
 *   "interactions": [
 *     { "index": 1, "from": "sender", "type": "message", "content": { "text": "hola" } },
 *     { "index": 2, "from": "receiver", "type": "message", "content": { "text": "Hola, ¿cómo estás?" }, "item_id": "item_1" },
 *     { "index": 3, "from": "sender", "type": "message", "content": { "text": "Bien, gracias" } },
 *     { "index": 4, "from": "receiver", "type": "message", "content": { "text": "Me alegro" }, "item_id": "item_2" }
 *   ]
 * }
 *
 * lastMessageFinder({ flowSession: "session:company_id:wab:receive:numero:sender:numero:flow:flow_id", from: "receiver" });
 * // Retorna: { "index": 4, "from": "receiver", "type": "message", "content": { "text": "Me alegro" }, "item_id": "item_2" }
 */
export function lastMessageFinder({flowSession, from}){
    // Search last message
    const sessionData = getCache(`session[${flowSession}]`)?.interactions || [];
    // Filter messages from...
    const fromMessages = sessionData.filter(msg => msg.from === from);
    // If exist messages from '..', get the higher message index
    if (fromMessages.length > 0) {
        return fromMessages.reduce(
            (lastMesssage, currentMessage) => {
                return currentMessage.index > lastMesssage.index ? currentMessage : lastMesssage;
            }
        );
    }
    return null;
}