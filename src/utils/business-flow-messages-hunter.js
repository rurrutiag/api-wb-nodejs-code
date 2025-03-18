import { queryDb } from "../db/db-query.js";

export default async function businessFlowMessagesHunter(){
    try {
        const query = `
            SELECT flow_id, platform, id as item_id, content_type, content, type_expected_response, previous_item_id, next_item_id
            FROM message_flows_items
        `;
        const params = [];
        const queryResponse = await queryDb(query, params, true);
        const groupedData = queryResponse.reduce((acc, { flow_id, ...rest }) => {
            if (!acc[flow_id]) {
                acc[flow_id] = [];
            }
            acc[flow_id].push(rest);
            return acc;
        }, {});
        return groupedData;
    } catch (e) {
        throw new Error(`Error al capturar mensajes en los flujos de negocio: ${error.message}`);
    }
}