import { queryDb } from "../db/db-query.js";

export default async function businessFlowTriggersHunter(){
    try {
        const query = `
            SELECT company_id, id as flow_id, trigger_type, trigger_data
            FROM messages_flows
            WHERE is_enabled = true;
        `;
        const params = [];
        const queryResponse = await queryDb(query, params,true);
        const groupedData = queryResponse.reduce(
            (acc, {company_id, flow_id, trigger_type, trigger_data}) => {
                if (!acc[company_id]) {
                    acc[company_id] = [];
                }
                acc[company_id].push({
                    flow_id, trigger_type,trigger_data
                });
                return acc;
            }, {}
        );
        return groupedData;
    } catch (e) {
        throw new Error(`businessFlowTriggersHunter | Error en capturar datos gatillos de flujos de negocio: ${e.message}`);
    }
}