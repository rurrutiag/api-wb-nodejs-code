/**
 * Genera una clave base para la sesión de flujo de comunicación entre un remitente y un receptor.
 * 
 * @param {Object} params - Parámetros para la generación de la clave.
 * @param {string} params.companyId - Identificador único de la empresa.
 * @param {string} params.receiver - Identificador del receptor del mensaje.
 * @param {string} params.sender - Identificador del remitente del mensaje.
 * @returns {string} Clave base de la sesión en el formato: `session:{companyId}:wab:receive:{receiver}:sender:{sender}`
 */
export function getBaseFlowKey({companyId, receiver, sender}) {
    const sessionKey = `session:${companyId}:wab:receive:${receiver}:sender:${sender}`;
    return sessionKey
}

/**
 * Genera una clave de sesión de flujo con un identificador de flujo específico.
 * 
 * @param {Object} params - Parámetros para la generación de la clave.
 * @param {string} [params.companyId=null] - Identificador único de la empresa.
 * @param {string} [params.receiver=null] - Identificador del receptor del mensaje.
 * @param {string} [params.sender=null] - Identificador del remitente del mensaje.
 * @param {string} [params.baseKey=null] - Clave base opcional previamente generada.
 * @param {string} params.flowId - Identificador único del flujo de comunicación.
 * @returns {string|undefined} Clave de sesión con flujo en el formato: `{baseKey}:flow:{flowId}` 
 *                             o `session:{companyId}:wab:receive:{receiver}:sender:{sender}:flow:{flowId}`,
 *                             o `undefined` si los parámetros no son suficientes.
 */
export function getFlowKey({
    companyId=null,
    receiver=null,
    sender=null,
    baseKey=null,
    flowId
}) {
    let sessionKey;
    if (baseKey) {
        sessionKey = `${baseKey}:flow:${flowId}`
        return sessionKey;
    } else {
        if (companyId !== null && receiver !== null && sender !== null) {
            sessionKey = getBaseFlowKey({companyId: companyId, receiver: receiver, sender: sender});
            sessionKey = `${sessionKey}:flow:${flowId}`;
            return sessionKey;
        }
    }
}

export function getFlowData({flowSession}){
    const regex = /session:([a-f0-9-]+):wab:receive:([a-f0-9-]+):sender:([a-f0-9-]+):flow:([a-f0-9-]+):number:([0-9]+)/;
    const matches = flowSession.match(regex);
    if (matches) {
        const company = matches[1];
        const receive = matches[2];
        const sender = matches[3];
        const flow = matches[4];
        const flowNumber = matches[5];
        return {
            company,
            receive,
            sender,
            flow,
            flowNumber
        };
    }
    return null;
}