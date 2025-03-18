/**
 * Extrae el tipo y el contenido de un mensaje de una solicitud.
 *
 * @param {Object} params - Objeto con los datos de la solicitud del mensaje.
 * @param {Object} params.messageRequest - Objeto que contiene la información del mensaje.
 * @returns {Object|boolean} - Retorna un objeto con `type` y `content` si ambos existen, de lo contrario, retorna `false`.
 */
export function dataExtractorFromRequest({messageRequest}){
    let typeRequest;
    let contentRequest;
    if (messageRequest.type) {
        typeRequest = messageRequest.type;
        if (typeRequest === "interactive" || typeRequest === "text") {
            contentRequest = messageRequest[typeRequest];
        }
    }
    if (!typeRequest || !contentRequest) { return false; }
    return { type: typeRequest, [typeRequest]: contentRequest };
}