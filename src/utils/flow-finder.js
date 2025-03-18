import { getCache } from "../cache/manager.js";
import { getBaseFlowKey } from "./get-flow-key.js";

/**
 * Busca flujos activos asociados a una empresa, receptor y remitente específicos.
 *
 * @param {Object} params - Parámetros para la búsqueda de flujos.
 * @param {string} params.companyId - Identificador único de la empresa.
 * @param {string} params.receiver - Identificador del receptor del mensaje.
 * @param {string} params.sender - Identificador del remitente del mensaje.
 * @returns {string[] | null} Un array con las claves de los flujos activos si existen, o `null` si no hay coincidencias.
 */
export function flowFinder({
    companyId, receiver, sender
}) {
    const sessionKey = getBaseFlowKey({
        companyId: companyId,
        receiver: receiver,
        sender: sender
    });
    
    const allSessions = Object.keys(getCache("sessions") || {});

    const matchingKeys = allSessions.filter( key =>
        key.startsWith(
            `${sessionKey}:flow:`
        )
    );
    if (matchingKeys.length > 0) {
        let activeFlow;
        matchingKeys.forEach(
            key => {
                if (allSessions[key] && allSessions[key].status === "active") {
                    activeFlow = key;
                }
            }
        );
        return activeFlow;
    } else {
        return null;
    }
}