import { interactiveItemConstructor } from "../utils/new-flows-creation/interactive-item-constructor.js";
import { textItemConstructor } from "../utils/new-flows-creation/simple-item-constructor.js";
import { messageFlowsItemRowCreator } from "../utils/new-flows-creation/new-item-message-flows-items-row-creator.js";

/**
 * Crea un ítem dentro de un flujo de mensajes o procesos, generando su contenido,
 * identificadores, y relaciones de secuencia según el tipo de ítem especificado.
 *
 * @async
 * @function
 * @param {Object} params - Parámetros de entrada.
 * @param {Object} params.inputData - Datos del ítem a crear.
 * @param {string} params.inputData.type - Tipo de ítem: "text" o "interactive".
 * @param {string|number} [params.inputData.number] - Número identificador del ítem dentro del flujo.
 * @param {string|number} [params.inputData.previous_item] - Número del ítem anterior, si existe.
 * @param {string} params.companyId - ID de la empresa a la que pertenece el ítem.
 * @returns {Promise<Object>} Objeto con los datos generados del ítem.
 *
 * @property {string|number|null} previousItemNumber - Número del ítem anterior en el flujo.
 * @property {string|null} itemId - ID generado para el nuevo ítem.
 * @property {string|number} itemNumber - Número identificador del ítem actual.
 * @property {string} companyId - ID de la empresa.
 * @property {string} itemType - Tipo de ítem ("text" o "interactive").
 * @property {*} itemContent - Contenido específico del ítem (estructura depende del tipo).
 * @property {*} typeResponse - Estructura de respuesta esperada del ítem.
 * @property {Object} itemMatrix - Mapa de números de ítem a sus IDs.
 * @property {Object} itemPath - Mapa de relaciones entre ítems (número previo y/o ID previo).
 */
export async function itemCreator({inputData, companyId}){
    // Definición de matrices para relacionar números de ítems con sus IDs (itemMatrix) y una temporal (temporalMatrix)
    let itemMatrix = {};
    let temporalMatrix = {};
    let itemId = null;
    // Guardar el número del ítem anterior si existe
    let previousItemNumber = inputData.previous_item || null;
    
    let itemType = inputData.type;
    let itemContent;
    let typeResponse;

    // Si el inputData contiene number, se genera un nuevo itemId utilizando messageFlowsItemRowCreator() y se registra en itemMatrix
    if (inputData.number) {
        itemId = await messageFlowsItemRowCreator();
        itemMatrix[inputData.number] = itemId;
    }

    // Definir e inicializar el flujo de conexión (path) desde este ítem al anterior
    let itemPath = { 
        [inputData.number]: {
            previous_item_number: previousItemNumber
        }
    };

    let itemData = {};
    // Construcción del ítem según su tipo
    switch (inputData.type) {
        // Si es tipo "interactive" usa interactiveItemConstructor para construir el contenido y relaciones.
        case "interactive":
                itemData = await interactiveItemConstructor(inputData);
                itemContent = itemData.requestData;
                temporalMatrix = itemData.itemMatrix;
                itemMatrix = { ...itemMatrix, ...temporalMatrix};
                typeResponse = itemData.requestReply;
            break;
        // Si es tipo "text" ysa textItemConstructor para construirlo
        case "text":
                itemData = await textItemConstructor(inputData);
                itemContent = itemData.requestData;
                typeResponse = itemData.requestReply;
            break;
        //  En todos los casos, se obtienen:
        //  - requestData: contenido o configuración del ítem
        //  - requestReply: respuesta esperada
        //  - itemMatrix e itemPath adicionales en el caso de ítem complejos (como botones interactivos)
        default:
            break;
    }

    // Si hay subítems (como opciones dentro de un ítem interactivo), se les asigna como previous_item_id el itemId actual, y se agrega al itemPath
    let subItemDataPath = itemData.itemPath || null;
    if (subItemDataPath) {
        for (const subItem in subItemDataPath) {
            subItemDataPath[subItem]["previous_item_id"] = itemId;
            subItemDataPath[subItem]["previous_item_number"] = inputData.number;
        }
    }
    itemPath = { ...itemPath, ... subItemDataPath };

    // Retorna un objeto con toda la información relacionada al ítem creado y su posición dentro del flujo.
    return {
        previousItemNumber,
        itemId,
        itemNumber: inputData.number,
        companyId,
        itemType,
        itemContent,
        typeResponse,
        itemMatrix,
        itemPath
    };

}

// let inputData = {
//     header: {
//         text: "Descubre nuestras oportunidades en el mundo aeronáutico"
//     },
//     body: {
//         text: "Contamos con diferentes opciones en el mundo aeronáutico. Al presionar en el botón *Ver opciones* de este mensaje, verás una lista con los servicios que podemos brindarte."
//     },
//     footer: {
//         text: "Deberás seleccionar una opción para saber más información."
//     },
//     last_item: numero identificador dado por el usuario,
//     preview_url: false,
//     services: [
//         {
//             category: "Formación de pilotos",
//             services: [
//                 {
//                     number: numero identificador dado por el usuario,
//                     title: "Formación en EEUU🇺🇸",
//                     description: "Programa con estándares americanos con residencia e inclusión laboral."
//                 },
//                 {
//                     number: numero identificador dado por el usuario,
//                     title: "Formación en Chile🇨🇱",
//                     description: "Programas flexibles para obtener hasta la licencia de piloto comercial."
//                 }
//             ]
//         },
//         {
//             category: "Otros servicios",
//             services: [
//                 {
//                     number: numero identificador dado por el usuario,
//                     title: "Formación de mecánicos",
//                     description: "Formación en 🇺🇸 con residencia e inserción laboral."
//                 },
//                 {
//                     number: numero identificador dado por el usuario,
//                     title: "Inglés aeronáutico",
//                     description: "Preparación para certificación OACI o mejorar inglés en la aviación."
//                 },
//                 {
//                     number: numero identificador dado por el usuario,
//                     title: "Experiencias de vuelo",
//                     description: "Vive en primera persona lo que significa ser piloto."
//                 }
//             ]
//         }
//     ]
// };