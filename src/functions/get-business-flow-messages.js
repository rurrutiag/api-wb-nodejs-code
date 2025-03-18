import { queryDb } from "../db/db-query";

export default async function getBusinessFlowMessages(){
    try {
        const query = `
            SELECT flow_id, platform, id as item_id, content_type, content, type_expected_response, previous_item_id, next_item_id
            FROM messages_flows_items
        `;
        const params = [];
        const queryResponse = await queryDb(query, params, true);
        const groupedData = queryResponse.reduce((acc, { flow_id, ...rest}) => {
            if (!acc[flow_id]) {
                acc[flow_id] = [];
            }
            acc[flow_id].push(rest);
            return acc;
        }, {}
        );
        return groupedData;
    } catch (error) {
        throw new Error(`Error in catch businesses flow triggers data: ${error.message}`);
    }
}