import { queryDb } from "../db/db-query.js";

export async function flowMessageHunter({flow}){
    try {
        const query = `
            SELECT id as item_id, content_type, content, type_expected_response, previous_item_id, next_item_id, metadata
            FROM message_flows_items
            WHERE
                flow_id = $1
        `;
        const params = [ flow ];
        const response = await queryDb(query, params, false);
        return response;
    } catch (error) {
        throw new Error(`flowMessageHunter: ${error.response?.data?.error?.message}`);
    }
    
}