import { flowArchiver } from "../utils/flow-archiver.js";
import { flowFinder } from "../utils/flow-finder.js";
import { flowInitiator } from "../utils/flow-initiator.js";
import { logRecorder } from "../utils/log-recorder.js";
import { messageSaverNoFlow } from "../utils/message-saver.js";
import triggerFinder from "../utils/trigger-finder.js";

/**
 * Revisa si existe un flujo de conversación activo para un usuario y un negocio.
 * Si no existe, busca si el mensaje es un trigger que pueda iniciar un flujo.
 * 
 * @async
 * @function flowReviewer
 * @param {Object} params - Parámetros de entrada.
 * @param {Object} params.res - Objeto de respuesta HTTP.
 * @param {string} params.companyId - ID de la empresa asociada al flujo.
 * @param {string} params.companyMedia - Número de teléfono de la empresa que recibe el mensaje.
 * @param {string} params.userMedia - Número de teléfono del usuario que envió el mensaje.
 * @param {Object} params.messageData - Datos del mensaje entrante.
 * @param {string} params.messageData.content - Contenido del mensaje recibido.
 * @param {string} params.messageData.type - Tipo de contenido del mensaje (texto, imagen, etc.).
 * @returns {Promise<Object>} Retorna un objeto con `flow_id` si hay un flujo activo 
 * o se inicia uno nuevo, y `first_item_id` si es un trigger inicial.
 * @throws {Object} Retorna un error HTTP 404 si no se encuentra un flujo o un trigger válido.
 */
export async function flowReviewer({
    companyId, companyMedia, userMedia, messageData
}) {
    try {
        // Buscaremos los flujos activos
        let flowFound = await flowFinder({
            companyId: companyId,
            receiver: companyMedia,
            sender: userMedia
        });
        // Tambien validaremos que el mensaje entrante sea un trigger
        const triggerFound = await triggerFinder({
            companyId: companyId,
            message: messageData
        });

        console.log("flow-reviewer | linea 42", triggerFound);
       
        // Si el mensaje es trigger, cerraremos los flujos activos
        if (triggerFound !== null && flowFound !== null) {

            await flowArchiver({
                company_id: companyId,
                company_media: companyMedia,
                user_media: userMedia,
                all_flows: true
            });
            flowFound = null;
        }

        let firstTriggerMessage = null;

        if (flowFound === null) {
            await logRecorder({
                step: "flowReviewer: flowFound es null",
                triggerFound: triggerFound
            });
            
            // Si el trigger existe, entonces determinar el flujo encontrado
            if (triggerFound !== null) {
                // Obtener key de la sesión
                const newFlow = await flowInitiator({
                        company: companyId,
                        business: companyMedia,
                        user: userMedia,
                        flow: triggerFound.flow_id
                    });
                    await logRecorder({
                        step: "flowReviewer: flowInitiator ejecutado",
                        flowInitiator: newFlow
                    });
                flowFound = newFlow;
                firstTriggerMessage = triggerFound.first_item_id;

            } else {
                // Si no existe trigger, entonces el mensaje no sigue un flujo
                // Guardar de todas formas el mensaje entrante
                let messageSent = await messageSaverNoFlow({
                    company: companyId,
                    companyMedia: companyMedia,
                    userMedia: userMedia,
                    actor: "user",
                    content: messageData[messageData.type],
                    contentType: messageData.type
                });
                if (messageSent) {

                    return {
                        status: 200,
                        message: 'Flujo de conversación no encontrado.'
                    };
                }
                return {
                    status: 404,
                    message: 'Error desconocido.'
                };
            }
        }
        return {
            flow_id: flowFound,
            first_item_id: firstTriggerMessage
        };
    } catch(e) {
        throw new Error(`Error en flow-reviewer: ${e.message}`);
    }  
}