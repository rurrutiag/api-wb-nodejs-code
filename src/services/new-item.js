import { randomUUID } from "crypto";
import { interactiveItemConstructor } from "../utils/interactive-item-constructor.js";
import { queryDb } from "../db/db-query.js";
import { textItemConstructor } from "../utils/simple-item-constructor.js";

async function messageFlowsItemRowCreator(){
    const query = `
        INSERT INTO message_flows_items(company_id)
        VALUES($1)
        RETURNING id;
    `;
    const params = ["TEMP"];
    const dbResponse = await queryDb(query, params, false);
    return dbResponse[0].id;
}

export async function itemCreator({inputData, companyId}){
    let itemMatrix = {};
    let temporalMatrix = {};
    let itemId = null;
    let previousItemNumber = inputData.previous_item || null;
    
    let itemType = inputData.type;
    let itemContent;
    let typeResponse;

    if (inputData.number) {
        itemId = await messageFlowsItemRowCreator();
        itemMatrix[inputData.number] = itemId;
    }

    let itemPath = { 
        [inputData.number]: {
            previous_item_number: previousItemNumber
        }
    };

    let itemData = {};
    switch (inputData.type) {
        case "interactive":
                itemData = await interactiveItemConstructor(inputData);
                itemContent = itemData.requestData;
                temporalMatrix = itemData.itemMatrix;
                itemMatrix = { ...itemMatrix, ...temporalMatrix};
                typeResponse = itemData.requestReply;
            break;
        case "text":
                itemData = await textItemConstructor(inputData);
                itemContent = itemData.requestData;
                typeResponse = itemData.requestReply;
        default:
            break;
    }

    let subItemDataPath = itemData.itemPath || null;
    if (subItemDataPath) {
        for (const subItem in subItemDataPath) {
            subItemDataPath[subItem]["previous_item_id"] = itemId;
            subItemDataPath[subItem]["previous_item_number"] = inputData.number;
        }
    }
    itemPath = { ...itemPath, ... subItemDataPath };

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