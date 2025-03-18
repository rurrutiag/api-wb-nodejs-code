import { getCache } from "../cache/manager.js";
import { getFlowData } from "../utils/get-flow-key.js";
import { lastMessageFinder } from "../utils/last-message-finder.js";

/**
 * Obtiene el tipo de contenido y la respuesta esperada según el último mensaje enviado por el bot (receiver).
 *
 * @param {Object} params - Objeto con los parámetros de búsqueda.
 * @param {string} params.sessionFlowKey - La clave de la sesión en la caché.
 * @param {string} params.flowId - La clave del flujo en la caché.
 * @returns {Object|null} Un objeto con `content_type` y `type_expected_response`, o `null` si no se encuentra.
 *
 * @example
 * // Datos en caché:
 * session["session:company_id:wab:receive:numero:sender:numero:flow:flow_id"].interactions = [
 *   { "index": 1, "from": "sender", "type": "message", "content": { "text": "hola" } },
 *   { "index": 2, "from": "receiver", "type": "message", "content": { "text": "Hola, ¿cómo estás?" }, "item_id": "item_1" }
 * ];
 *
 * flow["flow:flow_id"] = [
 *   { "item_id": "item_1", "content_type": "text", "type_expected_response": "button" }
 * ];
 *
 * getExpectedMessageType({ sessionFlowKey: "12345", flowId: "flow1" });
 * // Retorna: { content_type: "text", type_expected_response: "button" || [{}, ... {}] }
 */
function getExpectedMessageType({sessionFlowKey, flowId}){
    const lastMessageSentByBot = lastMessageFinder({flowSession: sessionFlowKey, from: "receiver"});
    if (!lastMessageSentByBot || !lastMessageSentByBot.item_id) return null;
    const itemIdtoSearchFor = lastMessageSentByBot.item_id;
    const fromFlow = getCache(`flow:${flowId}`);
    const message = fromFlow.find(
        item => item.item_id === itemIdtoSearchFor
    );
    return message ? {
        content_type: message.content_type,
        type_expected_response: message.type_expected_response
    } : null;
}

/**
 * Obtiene todos los valores de `action_id` dentro del array `next_item_id` de un flujo almacenado en caché.
 *
 * @param {string} flowKey - La clave del flujo en la caché, por ejemplo, "flow:sfnsdlgfnasdñgnñ".
 * @returns {string[]} Un array con todos los `action_id` encontrados en `next_item_id`.
 *
 * @example
 * // Datos en caché:
 * [
 * {}, ...,
 * {
 *   "platform": "...",
 *   "item_id": "...",
 *   "content_type": "...",
 *   "content": "...",
 *   "type_expected_response": "...",
 *   "previous_item_id": "...",
 *   "next_item_id": [
 *     { "action_id": "action_1", "next_item_id": "item_2" },
 *     { "action_id": "action_2", "next_item_id": "item_3" },
 *     { "action_id": "action_3", "next_item_id": "item_4" }
 *   ]
 * }
 * ]
 * 
 * expectedResponses("flow:clave-en-uuid4");
 * // Retorna: ["action_1", "action_2", "action_3"]
 */
function expectedResponses({
    flowKey
}) {
    const flowData = getCache(flowKey) || {};
    let actionIds = [];
    flowData.forEach(item => {
        if (Array.isArray(item.next_item_id)) {
            actionIds = actionIds.concat(item.next_item_id.map(
                next => next.action_id
            ));
        }
    });
    return actionIds;
}

/**
 * Obtiene el siguiente mensaje en un flujo de conversación basado en respuestas esperadas.
 *
 * @param {Object} params - Parámetros de la función.
 * @param {string} params.flowKey - Clave única del flujo de conversación.
 * @param {string[]} params.expectedResponses - Respuestas esperadas para determinar el siguiente paso.
 * @returns {Object|null} - Retorna un objeto con el contenido del siguiente mensaje (`content_type` y `content`), o `null` si no hay coincidencias.
 *
 * @example
 * // Ejemplo de flujo almacenado en caché:
 * // [
 * //   { item_id: "1", next_item_id: [
 * //       { action_id: "yes", next_item_id: "2" },
 * //       { action_id: "no", next_item_id: "3" }
 * //   ] },
 * //   { item_id: "2", content_type: "text", content: "You selected YES!" },
 * //   { item_id: "3", content_type: "text", content: "You selected NO!" }
 * // ]
 *
 * const response = nextFlowMessage({
 *     flowKey: "example",
 *     expectedResponses: ["yes"]
 * });
 * console.log(response); // { content_type: "text", content: "You selected YES!" }
 */
function nextFlowMessage({
    flowKey,
    expectedResponses
}) {
    const flowData = getCache(`flow["flow:${flowKey}"]`) || {};
    let matchedNextItemId = null;
    for (const item of flowData) {
        if (Array.isArray(item.next_item_id)) {
            const match = item.next_item_id.find(
                next => expectedResponses.includes(
                    next.action_id
                )
            );
            if (match) {
                matchedNextItemId = match.next_item_id;
                break;
            }
        }
    }
    if (matchedNextItemId) {
        return dataHunterFromFlowItem({
            flowKey: flowKey,
            itemIdToUse: matchedNextItemId
        });
    }
    return null;
}

/**
 * Recupera el contenido de un ítem específico dentro de un flujo de conversación.
 *
 * @param {Object} params - Parámetros de la función.
 * @param {string} params.flowKey - Clave única del flujo de conversación.
 * @param {string} params.itemIdToUse - Identificador del ítem dentro del flujo.
 * @returns {Object|null} - Retorna un objeto con el contenido del ítem (`content_type` y `content`), o `null` si no se encuentra.
 *
 * @example
 * // Ejemplo de flujo almacenado en caché:
 * // [
 * //   { item_id: "1", content_type: "text", content: "Hello, world!" },
 * //   { item_id: "2", content_type: "image", content: "https://example.com/image.png" }
 * // ]
 *
 * const response = dataHunterFromFlowItem({
 *     flowKey: "example",
 *     itemIdToUse: "1"
 * });
 * console.log(response); // { content_type: "text", content: "Hello, world!" }
 */
function dataHunterFromFlowItem({flowKey, itemIdToUse}){
    const flowData = getCache(`flow:${flowKey}`) || {};
    const itemData = flowData.find(
        item => item.item_id === itemIdToUse
    );
    if (itemData) {
        const { content_type, content } = itemData;
        return { content_type, content };
    }
    return null;
}

/**
 * Verifica si un mensaje recibido coincide con el tipo y respuestas esperadas.
 *
 * @param {Object} params - Parámetros de la función.
 * @param {Object} params.messageRequest - Objeto que representa el mensaje recibido.
 * @param {Object} params.expectedTypeResponse - Tipo de respuesta esperada (ej. "text", "interactive").
 * @param {string[]} params.expectedResponses - Lista de respuestas esperadas para validar coincidencias.
 * @returns {boolean} - Retorna `true` si el mensaje recibido coincide con lo esperado, de lo contrario `false`.
 *
 * @description
 * La función evalúa el tipo de mensaje recibido y lo compara con el tipo y contenido esperados.
 * - Los mensajes pueden ser de tipo: `text`, `button`, `reaction`, `image`, `sticker`, `unknown`, `interactive`.
 * - Si el mensaje es `interactive`, valida que el tipo coincida y que el `id` de la respuesta esté en `expectedResponses`.
 * - Si el mensaje es `text`, descarta aquellos que contienen `referral` o `context` y valida el tipo esperado.
 *
 * @example
 * // Ejemplo de mensaje recibido de tipo interactivo:
 * const messageRequest = {
 *   type: "interactive",
 *   0: {
 *     interactive: {
 *       type: "button",
 *       button: { id: "option_1" }
 *     }
 *   }
 * };
 *
 * const response = receivedMessageMatchesExpectedResponse({
 *   messageRequest,
 *   expectedTypeResponse: { type: "button" },
 *   expectedResponses: ["option_1", "option_2"]
 * });
 * console.log(response); // true
 *
 * @see {@link https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples} - Más información sobre los payloads de WhatsApp Cloud API.
 */
function receivedMessageMatchesExpectedResponse({messageRequest, expectedTypeResponse, expectedResponses}){
    // Hay mensajes recibidos que tienen la clave type y puede ser: text, button, reaction, image, sticker, uknown, interactive
    if (messageRequest.type) {
        if (messageRequest.type === "interactive") {
            if (messageRequest[0]?.interactive?.type === expectedTypeResponse.type) {
                // Validamos que los type coinciden, luego que el id de la respuesta, entre dentro de las esperadas
                const itemIdReply = messageRequest[0].interactive[expectedTypeResponse.type]?.id;
                return expectedResponses.includes(itemIdReply);
            } else {
                return false;
            }
        }
        if (messageRequest.type === "text") {
            // El usuario respondió con un texto cuando se espera otro tipo de mensaje
            if (messageRequest.type !== expectedTypeResponse.type) { return false; }
            // Para el caso que el usuario hizo clíck en un anuncio con un call-2-action a WhatsApp (para medir conversión)
            if (messageRequest.includes("referral")) { return false;}
            // Para el caso que el usuario solicita más información sobre un producto (responde a mensajes de un produto o varios, o accede al catalogo desde otro punto)
            if (messageRequest.includes("context")) { return false; }
            // Si no es ninguno de los casos, se espera que sea un texto normal. Para este primer paso no validaremos el tipo de texto
            return true;
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
export function responseManager({
    sessionFlowKey,
    messageRequest = null,
    firstMessageId = null
}){
    const flowData = getFlowData({flowSession: sessionFlowKey});
    
    const flowId = flowData.flow;
    // Si se recibe un ID de mensaje inicial, se recupera directamente (es trigger)
    if (firstMessageId !== null) {
        
        return dataHunterFromFlowItem({
            flowKey: flowId,
            itemIdToUse: firstMessageId
        });
    }
    // Obtener el tipo de respuesta esperada basado en el último mensaje enviado por el bot
    const typeExpectedResponse = getExpectedMessageType({
        sessionFlowKey: sessionFlowKey,
        flowId: flowId
    });
    // Si existe un tipo de respuesta esperada
    if (typeExpectedResponse) {
        // Obtener las respuestas esperadas para el flujo actual
        const expected = expectedResponses({ flowKey: `flow[flow:${flowId}]` });
        // Validar si el mensaje entrante coincide con las respuestas esperadas
        const isMatch = receivedMessageMatchesExpectedResponse({
            messageRequest: messageRequest,
            expectedTypeResponse: typeExpectedResponse,
            expectedResponses: expected
        });
        // Si el mensaje recibido es válido según el flujo, obtener el siguiente mensaje
        if (isMatch) {
            const nextItem = nextFlowMessage({
                flowKey: flowId,
                expectedResponses: expected
            });
            return nextItem ? nextItem : null;
        }
        return null;
    }
    return null;
}