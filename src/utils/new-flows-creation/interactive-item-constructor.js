import { randomUUID } from "crypto";

/**
 * Construye un mensaje interactivo para flujos de conversación, ya sea en forma de lista
 * de servicios o botones de respuesta rápida, incluyendo encabezados, cuerpo, pie de mensaje
 * y acciones personalizadas.
 *
 * @async
 * @function
 * @param {Object} inputData - Datos para construir el mensaje interactivo.
 * @param {string} inputData.class - Tipo de mensaje: "list" o "button".
 * @param {Object} [inputData.header] - Información del encabezado del mensaje.
 * @param {string} inputData.header.text - Texto del encabezado.
 * @param {Object} [inputData.body] - Cuerpo del mensaje.
 * @param {string} inputData.body.text - Texto del cuerpo.
 * @param {Object} [inputData.footer] - Pie del mensaje.
 * @param {string} inputData.footer.text - Texto del pie.
 * @param {string} [inputData.button_text] - Texto del botón principal (solo para listas).
 * @param {Array<Object>} [inputData.services] - Categorías de servicios (para listas).
 * @param {string} inputData.services[].category - Título de la categoría.
 * @param {Array<Object>} inputData.services[].services - Servicios dentro de la categoría.
 * @param {string|number} inputData.services[].services[].number - Número identificador del servicio.
 * @param {string} inputData.services[].services[].title - Título del servicio.
 * @param {string} inputData.services[].services[].description - Descripción del servicio.
 * @param {Array<Object>} [inputData.buttons] - Opciones de botones (para botones).
 * @param {string|number} inputData.buttons[].number - Número identificador del botón.
 * @param {string} inputData.buttons[].title - Texto del botón.
 *
 * @returns {Promise<Object>} Objeto con los datos construidos del mensaje interactivo.
 * @property {Object} requestData - Cuerpo completo del mensaje interactivo.
 * @property {Object} requestReply - Tipo de respuesta esperada del mensaje.
 * @property {Object} itemMatrix - Mapa de números de ítem a UUIDs generados.
 * @property {Object} itemPath - Mapa de números de ítem a sus respectivos `action_id`.
 */
export async function interactiveItemConstructor(inputData){
    // Definir variables para almacenar los datos de la respuesta.
    let requestData;
    let requestReply;
    let itemMatrix = {}; // Mapa de números de ítem a UUID generados.
    let itemPath = {}; // Mapa de números de ítem a sus respectivos `action_id`.
    
    // Función auxiliar para generar un ID único para cada servicio o botón.
    async function idGenerator(service){
        // Verifica si el servicio tiene un número identificador
        if (service.number) {
            const uuid = randomUUID(); // Genera un UUID único.
            itemMatrix[service.number] = uuid; // Asocia el número del servicio con el UUID.
            itemPath[service.number] = { action_id: uuid }; // Crea una relación con `action_id`.
            return uuid; // Retorna el UUID generado.
        }
        return null; // Si no hay número, retorna `null`.
    }
    // Verifica si el tipo de mensaje es una lista de servicios.
    if (inputData.class === "list") {
        // Define el tipo de respuesta esperada para una lista.
        requestReply = {
            "type": "list_reply"
        };
        // Procesa las categorías de servicios y los servicios dentro de cada categoría.
        const sections = await Promise.all(
            inputData.services.map(async serviceCategory => ({
                title: serviceCategory.category, // Título de la categoría.
                rows: await Promise.all(
                    serviceCategory.services.map(async service => ({
                        id: await idGenerator(service),     // Genera el ID único para cada servicio.
                        title: service.title,               // Título del servicio.
                        description: service.description    // Descripción del servicio.
                    }))
                )
            }))
        );

        // Construye la estructura completa del mensaje interactivo con la lista de servicios.
        requestData = {
            interactive: {
                type: inputData.class, // Tipo de interacción (lista).
                header: inputData.header? { text: inputData.header.text, type: "text" } : undefined,    // Encabezado (si existe).
                body: inputData.body ? { text: inputData.body.text } : undefined,                       // Cuerpo (si existe).
                footer: inputData.footer ? { text: inputData.footer.text } : undefined,                 // Pie (si existe).
                action: {
                    sections,   // Secciones de la lista de servicios.
                    button: inputData.button_text,  // Texto del botón (si existe).
                }
            }
        }
    } else if (inputData.class == "button") {
        // Si el tipo de mensaje es un conjunto de botones.
        requestReply = {
            type: "button_reply"
        };
        // Procesa las opciones de botones y genera un ID único para cada uno.
        const buttons = await Promise.all(
            inputData.buttons.map(async option => ({
                type: "reply", // Tipo de respuesta (reply).
                reply: {
                    id: await idGenerator(option), // Genera el ID único para cada opción.
                    title: option.title // Título del botón.
                }
            }))
        );
        // Construye la estructura completa del mensaje interactivo con botones.
        requestData = {
            interactive: {
                type: inputData.class, // Tipo de interacción (botones).
                header: inputData.header? { text: inputData.header.text, type: "text" } : undefined,    // Encabezado (si existe).
                body: inputData.body ? { text: inputData.body.text } : undefined,                       // Cuerpo (si existe).
                footer: inputData.footer ? { text: inputData.footer.text } : undefined,                 // Pie (si existe).
                action: {
                    buttons // Botones generados para la respuesta.
                }
            }
        };
    }
    // Retorna los datos generados: estructura del mensaje interactivo, respuesta esperada, y matrices de ítems.
    return {
        requestData,
        requestReply,
        itemMatrix, // Mapa de números de ítem a UUID.
        itemPath // Mapa de números de ítem a `action_id`.
    };

}