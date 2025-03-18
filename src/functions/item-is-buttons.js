import { sendMessage } from "./common-assets";

/**
 * Construye un objeto de botones interactivos para mensajes en WhatsApp.
 * @param {Object} params - Parámetros para construir los botones.
 * @param {string} params.text - Texto que aparece en el cuerpo del mensaje.
 * @param {Array<Object>} params.buttons - Lista de botones, cada uno con `id` y `title`.
 * @returns {Object} Objeto con la estructura de botones interactivos.
 * @throws {Error} Si no se proporciona al menos un botón.
 */
function constructButtons({ itemId, text, buttons, header }) {
    if (!buttons || buttons.length === 0) {
      throw new Error("Debe proporcionar al menos un botón.");
    }
    const body = {text};
    const messageBody = header ? { header: {type: "text", text: header }, body } : { body };
    return {
      type: "button",
      ...messageBody,
      action: {
        buttons: buttons.map(({ idButton, title }) => ({
          type: "reply",
          reply: {
            id: `${itemId}:${idButton}`,
            title,
          },
        })),
      },
    };
}

/**
 * Construye el mensaje completo en el formato esperado por la API de WhatsApp.
 * @param {Object} params - Parámetros para construir el mensaje.
 * @param {string} params.platformName - Nombre de la plataforma de mensajería (por ejemplo, "whatsapp").
 * @param {string} params.userPlatform - Identificador del usuario destinatario.
 * @param {Object} params.constructedButtons - Estructura de botones interactivos generada por `constructButtons`.
 * @returns {Object} Objeto con la estructura completa del mensaje.
 */
function constructMessage({
    platformName, userPlatform, constructedButtons
}){
    return {
        messaging_product: platformName,
        recipient_type: "individual",
        to: userPlatform,
        type: "interactive",
        interactive: constructedButtons
    };
}

/**
 * Envía un mensaje interactivo con botones a través de la API de WhatsApp.
 * @param {Object} params - Parámetros para enviar el mensaje.
 * @param {string} params.apiUrl - URL de la API para enviar el mensaje.
 * @param {string} params.userPlatform - Identificador del usuario destinatario.
 * @param {string} params.GRAPH_API_TOKEN - Token de autenticación para la API de Graph.
 * @param {Object} params.buttonsList - Objeto con los datos de los botones.
 * @param {string} params.buttonsList.bodyButtons - Texto que aparece en el mensaje.
 * @param {Array<Object>} params.buttonsList.buttons - Lista de botones con `id` y `title`.
 * @param {string} [params.headerButtons] - (Opcional) Texto para el encabezado del mensaje.
 * @returns {Promise<boolean>} `true` si el mensaje se envió correctamente.
 * @throws {Error} Si ocurre algún error durante el proceso.
 */
export default async function itemIsButtonsSender({
    apiUrl,
    userPlatform,
    GRAPH_API_TOKEN,
    itemId,
    buttonsList    
  }) {
    try {
        const { bodyButtons, buttons, headerButtons } = buttonsList;
        const constructedButtons = constructButtons({ itemId, text: bodyButtons, buttons, header: headerButtons});
        const message = constructMessage({platformName,userPlatform,constructedButtons});
        return await sendMessage({apiUrl, GRAPH_API_TOKEN, message});      
    } catch (error) {
      throw new Error(`Error al enviar el mensaje: ${error.message}`);
    }
}