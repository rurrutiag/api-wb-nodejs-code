import { sendMessage } from "./common-assets";

/**
 * Construye un objeto fila.
 * @param {Object} params - Parámetros de la fila.
 * @param {string} params.sectionId - ID de la sección.
 * @param {string} params.rowId - ID de la fila.
 * @param {string} params.titleText - Título de la fila.
 * @param {string} params.descriptionText - Descripción de la fila.
 * @returns {Object} Objeto con los datos de la fila.
 */
function rowConstructor({
    sectionId,
    rowId,
    titleText,
    descriptionText
}){
    return {
        id: `${sectionId}:${rowId}`,
        title: titleText,
        description: descriptionText
    };
}

/**
 * Construye un objeto de filas para una sección.
 * @param {Object} params - Parámetros de la sección.
 * @param {Object} params.sectionData - Datos de la sección.
 * @param {string} params.sectionData.sectionTitle - Título de la sección.
 * @param {Array} params.sectionData.sectionRows - Filas de la sección.
 * @returns {Object} Objeto con los datos de la sección.
 */
function sectionRowsConstructor({ sectionData }) {
    const { sectionTitle, sectionRows } = sectionData;
    return {
        title: sectionTitle,
        rows: sectionRows.map(({ sectionId, subitemId, subitemTitle, subitemDescription }) =>
            rowConstructor({
                sectionId,
                rowId: subitemId,
                titleText: subitemTitle,
                descriptionText: subitemDescription,
            })
        ),
    };
}

/**
 * Construye las secciones a partir de los datos proporcionados.
 * @param {Object} params - Parámetros de las acciones.
 * @param {Object} params.actionsData - Datos de las acciones.
 * @param {string} params.actionsData.actionButton - Texto del botón de acción.
 * @param {Array} params.actionsData.sectionsData - Datos de las secciones.
 * @returns {Object} Objeto con los datos construidos de las secciones.
 */
function sectionsConstructor({ actionsData }) {
    const { actionButton, sectionsData } = actionsData;
    return {
      button: actionButton,
      sections: sectionsData.map((item) =>
        sectionRowsConstructor({ sectionData: item })
      ),
    };
}

/**
 * Construye el contenido de la lista interactiva.
 * @param {Object} params - Parámetros del contenido.
 * @param {Object} params.listContent - Contenido de la lista.
 * @returns {Object} Objeto con los datos construidos de la lista interactiva.
 * @throws {Error} Si ocurre un error al construir la lista.
 */
function itemIsListConstructor({listContent}){
    try {
        const {
            headerText,
            bodyText,
            footerText,
            actionsData
        } = listContent;
        return {
            header: { type: "text", text: headerText },
            body: { text: bodyText },
            footer: { text: footerText },
            actions: sectionsConstructor({ actionsData }),
        };
    } catch (error) {
        throw new Error(`Error construyendo la lista: ${error.message}`);
    }
}

/**
 * Construye el mensaje para enviar la lista interactiva.
 * @param {Object} params - Parámetros del mensaje.
 * @param {string} params.platformName - Nombre de la plataforma.
 * @param {string} params.userPlatform - Identificador del usuario.
 * @param {Object} params.responseListConstructor - Lista interactiva construida.
 * @returns {Object} Mensaje interactivo construido.
 */
function constructMessage({
    platformName, userPlatform, responseListConstructor
}) {
    return {
        messaging_product: platformName,
        recipient_type: "individual",
        to: userPlatform,
        type: "interactive",
        interactive: {
            type: "list",
            responseListConstructor
        },
    };
}

/**
 * Construye y envía una lista interactiva a través de la API.
 * @param {Object} params - Parámetros de la función.
 * @param {string} params.platformName - Nombre de la plataforma.
 * @param {string} params.userPlatform - Identificador del usuario.
 * @param {string} params.apiUrl - URL de la API.
 * @param {string} params.GRAPH_API_TOKEN - Token de autenticación.
 * @param {Object} params.listContent - Contenido de la lista.
 * @returns {Promise<boolean>} `true` si el mensaje se envió correctamente.
 * @throws {Error} Si ocurre un error durante la construcción o el envío.
 */
export default async function itemIsListSender({
    platformName,
    userPlatform,
    apiUrl,
    GRAPH_API_TOKEN,
    listContent
}){
    const constructedList = itemIsListConstructor({listContent: listContent});
    const message = constructMessage({ platformName, userPlatform, responseListConstructor: constructedList});
    return await sendMessage({ apiUrl, GRAPH_API_TOKEN, message});
}