import { flowMessageHunter } from "../utils/flow-message-hunter.js";
import { getFlowData } from "../utils/get-flow-key.js";
import { lastMessageFinder } from "../utils/last-message-finder.js";

/**
 * Busca el mensaje esperado en función de la información de la sesión y el remitente.
 * Esta función determina el último mensaje enviado por un bot y busca el mensaje correspondiente
 * en los datos del flujo de mensajes, basándose en el `item_id` del último mensaje.
 * Si se encuentra un mensaje correspondiente, devuelve los detalles esperados del mensaje.
 * 
 * @param {Object} params - Objeto con los datos necesarios para realizar la búsqueda.
 * @param {Object} params.sessionData - Datos de la sesión que incluyen información del flujo de trabajo.
 * @param {string} params.sessionData.company - El ID de la empresa.
 * @param {string} params.sessionData.receive - El número del negocio.
 * @param {string} params.sessionData.sender - El número del usuario que contacta.
 * @param {string} params.sessionData.flow - El ID del flujo de mensajes.
 * @param {string|number} params.sessionData.flowNumber - El número del flujo de mensajes.
 * @param {string} params.messageFrom - Indica si el mensaje proviene de "business" o "user".
 * 
 * @returns {Promise<Object|null>} Un objeto con los detalles del mensaje esperado si se encuentra, 
 * o `null` si no se encuentra el mensaje.
 * 
 * @throws {Error} Lanza un error si ocurre un problema durante la búsqueda de los mensajes.
 */
async function getExpectedMessage({sessionData, messageFrom, fromFlow}){
    // Obtener el último mensaje enviado por el bot
    const lastMessageSentByBot = await lastMessageFinder({flowData: sessionData, from: messageFrom});
    
    // Si no se encontró el mensaje del bot o no tiene un item_id, retornamos null
    if (!lastMessageSentByBot || !lastMessageSentByBot.item_id) return null;
    const itemIdtoSearchFor = lastMessageSentByBot.metadata.item_id;
    
    let message = null;
    let actionIds = [];
    // Buscar el mensaje en el flujo

    if (fromFlow && Object.keys(fromFlow).length > 0) {
        fromFlow.forEach((row) => {
            if (row.item_id === itemIdtoSearchFor) {
                message = row;
                if (row.next_item_id && typeof row.next_item_id.next_items === 'object') {
                    // Recorremos el array `next_items` dentro de `item.next_item_id`
                    row.next_item_id.next_items.forEach(nextItem => {
                        // Verificamos si el objeto dentro de `next_items` tiene la propiedad `action_id` y `next_item_id`
                        if (nextItem.action_id && nextItem.next_item_id) {
                            // Usamos `action_id` como clave y `next_item_id` como valor
                            actionIds[nextItem.action_id] = nextItem.next_item_id;
                        }
                    });
                }    
            }
        })
    }
    
    // Si se encuentra el mensaje, retornar los detalles esperados del mensaje
    return message ? {
        item_id: itemIdtoSearchFor,
        content_type: message.content_type,
        content: message.content,
        type_expected_response: message.type_expected_response,
        previous_item_id: message.previous_item_id,
        actions: actionIds,
        metadata: message.metadata
    } : null;
}


/**
 * Recupera el contenido de un ítem específico dentro de un flujo de conversación.
 *
 * @param {Object} params - Parámetros de la función.
 * @param {Object} params.fromFlow - Objeto con el flujo de mensajes.
 * @param {string} params.itemIdToUse - Identificador del ítem dentro del flujo.
 * @returns {Object|null} - Retorna un objeto con el contenido del ítem (`content_type` y `content`), o `null` si no se encuentra.
 *
 */
function dataHunterFromFlowItem({fromFlow, itemIdToUse}){
    let itemData = {};
    fromFlow.forEach((row) => {
        if (row.item_id === itemIdToUse) {
            itemData = row;
        }
    })
    return Object.keys(itemData).length > 0 ? itemData : null;
}

/**
 * Verifica si un mensaje recibido coincide con el tipo y respuestas esperadas.
 *
 * @param {Object} params - Parámetros de la función.
 * @param {Object} params.messageRequest - Objeto que representa el mensaje recibido.
 * @param {Object} params.expectedResponse - Objeto del último mensaje del bot que incluye el tipo de respuesta esperada (ej. "text", "interactive") y la lista de respuestas esperadas para validar coincidencias.
 * @returns {boolean} - Retorna el id del siguiente mensaje si coincide con lo esperado, de lo contrario `false`.
 *
 * @description
 * La función evalúa el tipo de mensaje recibido y lo compara con el tipo y contenido esperados.
 * - Los mensajes pueden ser de tipo: `text`, `button`, `reaction`, `image`, `sticker`, `unknown`, `interactive`.
 * - Si el mensaje es `interactive`, valida que el tipo coincida y que el `id` de la respuesta esté en `expectedResponse`.
 * - Si el mensaje es `text`, descarta aquellos que contienen `referral` o `context` y valida el tipo esperado.
 *
 * @see {@link https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples} - Más información sobre los payloads de WhatsApp Cloud API.
 */
function receivedMessageMatchesExpectedResponse({messageRequest, expectedResponse}){
    // falta considerar el análisis de mensaje si lo indica metadata
    // messageRequest viene de req.body.entry[0].changes.messages
    let nextMessageId;
    if (messageRequest.type) {
        if (messageRequest.type === "interactive") {
            if (messageRequest[0]?.interactive?.type === expectedResponse.type_expected_response.type) {
                // Validamos que los type coinciden, luego que el id de la respuesta, entre dentro de las esperadas
                const itemIdReply = messageRequest[0].interactive[expectedResponse.type_expected_response.type]?.id;
                // return expectedResponses.includes(itemIdReply);
                // buscará que itemIdReply esté presente en las actions de expectedResponse (verdadero o falso)
                if (expectedResponse.actions.hasOwnProperty(itemIdReply)){
                    nextMessageId = expectedResponse.actions[itemIdReply];
                }
            } else {
                return false;
            }
        }
        if (messageRequest.type === "text") {
            // El usuario respondió con un texto cuando se espera otro tipo de mensaje
            if (messageRequest.type !== expectedResponse.type_expected_response.type) { return false; }
            // Para el caso que el usuario hizo clíck en un anuncio con un call-2-action a WhatsApp (para medir conversión)
            if ('referral' in messageRequest) { return false;}
            // Para el caso que el usuario solicita más información sobre un producto (responde a mensajes de un produto o varios, o accede al catalogo desde otro punto)
            if ('context' in messageRequest) { return false; }
            // Si no es ninguno de los casos, se espera que sea un texto normal. Para este primer paso no validaremos el tipo de texto
            return expectedResponse.actions[expectedResponse.item_id];
        }
    }
    return false;
    // mensaje sin clave type y que tiene clave location
    // mensaje sin clave type ni location, pero si contacts
    // mensaje con clave text pero existe clave referral (trigger por whatsapp ads)
    // mensaje con clave text pero en context existe referred_product
    // mensaje del type order
    // mensaje del type system para notificar cambio de número del usuario
    // cuando el request no tiene message no entra aqui, pero si posee el campo statuses para message sent
    //  mismo caso del anterior, para validar que el mensaje fue entregado
    //  mismo caso pero para indicar que el mensaje fue leído (status: read)
    // mas info en: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
}

/**
 * Gestiona la respuesta del flujo conversacional basado en el mensaje recibido y el estado de la sesión.
 *
 * @param {Object} params - Parámetros de la función.
 * @param {string} params.sessionFlowKey - Clave de sesión que identifica el flujo de conversación.
 * @param {Object|null} [params.messageRequest=null] - Mensaje recibido del usuario, si existe.
 * @param {string|null} [params.firstMessageId=null] - ID del primer mensaje a enviar, si se trata de un trigger.
 * @returns {Object|null} - Retorna el contenido del siguiente mensaje en el flujo o `null` si no hay coincidencia.
 *
 * @description
 * Esta función administra la lógica de respuestas dentro de un flujo conversacional.
 * - Si `firstMessageId` no es `null`, se obtiene directamente el mensaje correspondiente.
 * - Si no, se busca el último mensaje enviado por el bot y se determina el tipo de respuesta esperada.
 * - Luego, se comparan las acciones esperadas con el mensaje recibido.
 * - Si hay coincidencia, se obtiene el siguiente mensaje en el flujo y se retorna su contenido.
 *
 * @example
 * // Caso donde se recibe un mensaje esperado y se obtiene la siguiente respuesta del flujo
 * const response = responseManager({
 *   sessionFlowKey: "user123",
 *   messageRequest: { type: "text", text: "Sí" },
 *   firstMessageId: null
 * });
 * console.log(response); // { content_type: "text", content: "¡Gracias por confirmar!" }
 *
 * @see {@link https://developers.facebook.com/docs/whatsapp/cloud-api} - WhatsApp Cloud API para integración de mensajes.
 */
export async function responseManager({
    sessionFlowKey,
    messageRequest = null,
    firstMessageId = null
}){

    // const flowData = getFlowData({flowSession: sessionFlowKey});
    const flowData = sessionFlowKey;

    const fromFlow = await flowMessageHunter({flow: flowData.flow_id});

    // Si se recibe un ID de mensaje inicial, se recupera directamente (es trigger)
    if (firstMessageId !== null) {
        const huntedData = dataHunterFromFlowItem({
            fromFlow: fromFlow,
            itemIdToUse: firstMessageId
        });
        return huntedData;
    }
    // Obtener respuesta esperada basado en el último mensaje enviado por el bot
    const expectedResponse = await getExpectedMessage({
        sessionData: flowData,
        messageFrom: "business",
        fromFlow: fromFlow
    });

    // Si existe un tipo de respuesta esperada
    if (expectedResponse) {
        // Obtener las respuestas esperadas para el flujo actual
        // Validar si el mensaje entrante coincide con las respuestas esperadas
        const isMatch = receivedMessageMatchesExpectedResponse({
            messageRequest: messageRequest,
            expectedResponse: expectedResponse
        });
        
        let nextMessageObject = {};
        if (isMatch) {
            fromFlow.forEach((row) => {
                if (row.item_id === isMatch) {
                    nextMessageObject = row;
                }
            })
        }
        // Si el mensaje recibido es válido según el flujo, obtener el siguiente mensaje
        return isMatch ? nextMessageObject : null;
    }
    return null;
}