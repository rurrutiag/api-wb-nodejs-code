import { flowReviewer } from "../services/flow-reviewer.js";
import { responseManager } from "../services/response-mangament.js";
import { botMessageSender } from "../utils/bot-message-sender.js";
import companyIdHunter from "../utils/company-id-hunter.js";
import { dataExtractorFromRequest } from "../utils/data-extractor-from-request.js";
import { logRecorder } from "../utils/log-recorder.js";
import { messageSaver } from "../utils/message-saver.js";

/**
 * Maneja las solicitudes POST recibidas desde un webhook de WhatsApp Cloud API.
 *
 * @async
 * @function handlePostWebhook
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>} Responde con el estado de la solicitud y un mensaje JSON si ocurre un error.
 *
 * @description
 * Esta función recibe eventos de WhatsApp y gestiona el flujo de mensajes:
 * - Extrae el mensaje entrante desde la estructura de la solicitud.
 * - Valida que el mensaje es válido; si no lo es, responde con un código de error 400.
 * - Obtiene el teléfono del receptor (empresa) y del remitente (usuario).
 * - Identifica el `companyId` asociado al teléfono de la empresa.
 * - Extrae los datos del mensaje recibido.
 * - Determina el flujo conversacional activo para la empresa y el usuario.
 * - Guarda el mensaje entrante en la base de datos.
 * - Evalúa si el mensaje recibido tiene una respuesta esperada en el flujo conversacional.
 * - Si hay una respuesta válida en el flujo, la envía al usuario y la guarda en la base de datos.
 * - En caso de error, responde con un código de estado 500.
 *
 * @example
 * // Uso típico en una aplicación Express
 * app.post('/webhook', handlePostWebhook);
 *
 * @see {@link https://developers.facebook.com/docs/whatsapp/cloud-api} - WhatsApp Cloud API.
 */
export async function handlePostWebhook(req, res) {
    let logRegistry;
    try {
        // Recuperar la solicitud entrante
        const incomingRequest = req.body.entry?.[0]?.changes?.[0]?.value || null;
        
        if (!incomingRequest) {
            return res.status(400).json({ error: "Solicitud inválida: estructura incorrecta." });
        }

        const incomingMessage = incomingRequest.messages?.[0];
        
        if (!incomingMessage) {
            return res.status(400).json({ error: "No se encontró un mensaje válido en la solicitud." });
        }

        // Obtener el número de teléfono empresarial y del usuario
        const receiver = incomingRequest.metadata.phone_number_id;
        const sender = incomingMessage.from;
        if (!receiver || !sender) {
            return res.status(400).json({ error: "Faltan datos de contacto en la solicitud." });
        }
    
        // Obtener company_id asociado al telefono empresarial
        const companyId = await companyIdHunter({wab: receiver});
        
        if (!companyId) {
            logRegistry = {
                step: "Condicional para resultados de companyIdHunter en handlePostWebHook",
                error: "No autorizado: Empresa no identificada."
            };
            await logRecorder(logRegistry);
            return res.status(401).json({ error: logRegistry.error });
        }

        // Extraer los datos del mensaje
        const messageData = dataExtractorFromRequest({messageRequest: incomingMessage});

        if (!messageData) {
            logRegistry = {
                step: "No hay resultado de messageData",
                messageData: messageData
            };
            await logRecorder(logRegistry);
            return res.status(400).json({ error: "No se encuentra tipo o contenido del mensaje."});
        }

        // Revisar el flujo conversacional asociado a la empresa y usuario
        const flowFound = await flowReviewer({
            res: res,
            companyId: companyId,
            companyMedia: receiver,
            userMedia: sender,
            messageData: messageData
        });

        logRegistry = {
            step: "Resultado de flowReviewer",
            flowReviewer: flowFound
        };
        await logRecorder(logRegistry);

        if (flowFound.status) {
            return res.status(flowFound.status).json({error: flowFound.message});
        }

        // Registrar el mensaje el mensaje entrante
        messageSaver({
            flowSession: flowFound.flow_id,
            actor: "sender",
            content: messageData[messageData.type],
            contentType: messageData.type
        });    

        // Obtener la respuesta del flujo si aplica
        const flowResponse = responseManager({
            sessionFlowKey: flowFound.flow_id,
            messageRequest: incomingMessage,
            firstMessageId: flowFound.first_item_id
        });

        logRegistry = {
            step: "Resultado de flowResponse",
            flowResponse: flowResponse,
            
        };
        await logRecorder(logRegistry);

        if (!flowResponse) {
            return res.status(422).json({ error: "Mensaje recibido no compatible con el flujo esperado." });
        }
        // Guardar la respuesta del bot y enviarla al usuario
        messageSaver({
            flowSession: flowFound.flow_id,
            actor: "receiver",
            content: flowResponse.content,
            contentType: flowResponse.content_type
        });
        let botSentMessage = await botMessageSender({
            receiver: receiver,
            sender: sender,
            type: flowResponse.content_type,
            content: flowResponse.content
        });
        logRegistry = {
            step: "Resultado de botSentMessage",
            botSentMessage: botSentMessage,     
        };
        await logRecorder(logRegistry);

        if (botSentMessage) {
            return res.sendStatus(200); // Éxito
        } else {
            return res.status(500).json({ error: "No se envió el mensaje" });    
        }
        
    } catch (error) {
        console.error("Error details:", error);
        // throw new Error(`Error in send message: ${e}`);
        res.status(500).json({ error: `Error interno del servicio. ${error}` });
    }
}