import { randomUUID } from "crypto";
import { itemCreator } from "./new-item.js";
import { queryDb } from "../db/db-query.js";

async function flowRowCreator({
    companyId,
    flow_name,
    flow_trigger_type,
    flow_trigger
}){
    let query = `
        INSERT INTO messages_flows(company_id, name, trigger_type, trigger_data)
        VALUES($1, $2, $3, $4::jsonb)
        RETURNING id;
    `;
    let params = [
        companyId,
        flow_name,
        flow_trigger_type,
        flow_trigger
    ]; 
    const dbResponse = await queryDb(query, params, false);
    return dbResponse[0].id;
}
async function flowFirstElementAdder({elementId, flowId}){
    let query = `
        UPDATE messages_flows
        SET trigger_data = jsonb_set(trigger_data, '{first_item_id}', $1::jsonb)
        WHERE id = $2;
    `;
    let params = [
        JSON.stringify(elementId),
        flowId
    ];
    const dbResponse = await queryDb(query, params, false);
    return true;
}
async function itemRowUpdater({
    company_id,
    platform,
    content_type,
    content,
    type_expected_response,
    previous_item_id,
    next_item_id,
    flow_id,
    id
}){
    let query = `
        UPDATE message_flows_items
        SET
            company_id = $1,
            platform = $2::jsonb,
            content_type = $3,
            content = $4,
            type_expected_response = $5,
            previous_item_id = $6::jsonb,
            next_item_id = $7::jsonb,
            flow_id = $8
        WHERE
            id = $9
    `;
    let params = [
        company_id,
        JSON.stringify(platform),
        content_type,
        content,
        type_expected_response,
        JSON.stringify(previous_item_id),
        JSON.stringify(next_item_id),
        flow_id,
        id
    ];
    const dbResponse = await queryDb(query, params, false);
    return true;
}

export async function flowCreator(req, res){

    // Paso 0: Validaciones
    if (!req.body) {
        return res.status(400).json({ error: 'No data provided' });
    }
    let inputData = req.body;
    const { companyId, platform } = req.body;

    let itemMatrix = {};
    let itemPath = {};
    let platformData = [{"wab": platform}];

    if (!companyId || !platform || (typeof inputData.flow !== 'object') || !inputData.items || (typeof inputData.items !== 'object')) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    
    // Paso 1: Crear el flujo
    let flow_id;
    let flow_name = inputData.flow.name;
    let flow_trigger = inputData.flow.trigger || null;
    let flow_trigger_type = inputData.flow.trigger_type || null;

    // Paso 2: Crear los items
    let modeling_items = await Promise.all(
        inputData.items.map(async step => {
            let item = await itemCreator({ inputData: step, companyId: companyId });
                itemMatrix = { ...itemMatrix, ... item.itemMatrix };
            let tempItemPath = item.itemPath;
                itemPath = { ...itemPath, ...tempItemPath};
            return item;
        })
    );

    // Paso 3: Vincular los items
        // Agregar item anterior
        let items = modeling_items.map(modeled_item => {
            let tempItem = modeled_item;
            if(modeled_item.previousItemNumber) {
                tempItem.previous_item_id = itemMatrix[modeled_item.previousItemNumber];
            }
            return tempItem;
        });
        // Agregar item siguiente
        const successorMap = {};
        for (const key in itemPath) {
            const { previous_item_id } = itemPath[key];
        
            if (previous_item_id) {
                if (!successorMap[previous_item_id]) {
                    successorMap[previous_item_id] = [];
                }
                successorMap[previous_item_id].push(key);
            }
        }
        // Si un item tiene más de un elemento, es un array de action items
        for (const key in itemPath) {
            const { action_id } = itemPath[key];
            if (action_id && successorMap[action_id]) {
                itemPath[key].next_items = successorMap[action_id].map(next => ({
                    action_id,
                    next_item_id: next
                }));
            } else {
                itemPath[key].next_items = [];
            }
        }
    let query;
    let params;
    // Paso 4: Crear flujo en base de datos
    flow_id = await flowRowCreator({companyId, flow_name, flow_trigger_type, flow_trigger});

    // Entrepaso: eliminar datos de itemPath innecesarios para la base de datos
    Object.values(itemPath).forEach(element => {
        delete element["previous_item_id"];
        delete element["previous_item_number"];
    });

    // Paso 5: Crear items en base de datos
    await Promise.all(
        items.map(async item => {
            await itemRowUpdater({
                company_id: companyId,
                platform: platformData,
                content_type: item.itemType,
                content: item.itemContent,
                type_expected_response: item.typeResponse,
                previous_item_id: item.previous_item_id || null,
                next_item_id: itemPath[item.itemNumber] || null,
                flow_id: flow_id,
                id: item.itemId
            });
        })
    );

    // Paso 6: Agregar el primer ítem al flujo
    await flowFirstElementAdder({
        elementId: itemMatrix[1],
        flowId: flow_id
    });
    return res.sendStatus(200);
}