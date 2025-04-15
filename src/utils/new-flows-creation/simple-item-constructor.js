/**
 * Construye un objeto para un mensaje de tipo texto.
 *
 * @async
 * @function textItemConstructor
 * @param {Object} inputData - Datos de entrada del mensaje.
 * @param {string} inputData.type_reply - Tipo de respuesta (ej: 'text').
 * @param {boolean} [inputData.context] - Indica si se incluye contexto.
 * @param {string} [inputData.message_id] - ID del mensaje para el contexto.
 * @param {boolean} [inputData.preview=false] - Indica si se deben previsualizar enlaces.
 * @param {string} inputData.body - Cuerpo del mensaje de texto.
 *
 * @returns {Promise<Object>} Objeto con `requestData` y `requestReply` para el envío del mensaje.
 */
export async function textItemConstructor(inputData) {
    try {
        const requestReply = {
            type: inputData.type_reply
        };

        const requestData = {
            context: inputData.context ? { message_id: inputData.message_id } : undefined,
            text: {
                preview_url: inputData.preview ?? false,
                body: inputData.body
            }
        };

        return { requestData, requestReply };
    } catch (error) {
        console.error("textItemConstructor | Error:", error);
        throw error;
    }
}

/**
 * Construye un objeto para un mensaje de tipo reacción (emoji).
 *
 * @async
 * @function reactionItemConstructor
 * @param {Object} inputData - Datos de entrada de la reacción.
 * @param {string} inputData.type_reply - Tipo de respuesta (ej: 'reaction').
 * @param {string} inputData.message_id - ID del mensaje al que se reacciona.
 * @param {string} inputData.emoji - Emoji que representa la reacción.
 *
 * @returns {Promise<Object>} Objeto con `requestData` y `requestReply` para el envío de la reacción.
 */
export async function reactionItemConstructor(inputData) {
    try {
        const requestReply = {
            type: inputData.type_reply
        };

        const requestData = {
            reaction: {
                message_id: inputData.message_id,
                emoji: inputData.emoji
            }
        };

        return { requestData, requestReply };
    } catch (error) {
        console.error("reactionItemConstructor | Error:", error);
        throw error;
    }
}
