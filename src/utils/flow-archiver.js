import { queryDb } from "../db/db-query.js";

export async function flowArchiver({
    company_id,
    company_media,
    user_media,
    flow_id=null,
    flow_number=null,
    all_flows=null
}){
    let query;
    let params;
    if (all_flows !== null || all_flows !== false) {
        query = `
            UPDATE started_flows
            SET active = $1
            WHERE
                company_id = $2 AND
                company_media = $3 AND
                user_media = $4 AND
                active = TRUE
        `;
        params = [
            false,
            company_id,
            company_media,
            user_media
        ];
    } else if(flow_id !== null && flow_number !== null){
        query = `
            UPDATE started_flows
            SET active = $1
            WHERE
                company_id = $2 AND
                company_media = $3 AND
                user_media = $4 AND
                flow_id = $5 AND
                flow_number = $6 AND
                active = TRUE
        `;
        params = [
            false,
            company_id,
            company_media,
            user_media,
            flow_id,
            flow_number
        ];
    } else {
        return null;
    }
    const dbResponse = await queryDb(query, params, true);
}