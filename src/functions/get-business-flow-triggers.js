import { queryDb } from "../db/db-query";

export default async function getBusinessFlowTriggers(){
    try {
        const query = `
            SELECT company_id, id as flow_id, trigger_type, trigger_data
            FROM messages_flows
            WHERE is_enabled = true
        `;
        const params = [];
        const queryResponse = await queryDb(query, params, true);
        const groupedData = queryResponse.reduce((acc, {company_id, flow_id, trigger_type, trigger_data}) => {
            if (!acc[company_id]) {
                acc[company_id] = [];
            }
            acc[company_id].push({ flow_id, trigger_type, trigger_data });
            return acc;
        }, {}
        );
        return groupedData;
    } catch (error) {
        throw new Error(`Error in catch businesses flow triggers data: ${error.message}`);
    }
}