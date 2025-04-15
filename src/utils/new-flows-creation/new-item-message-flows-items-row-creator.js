import { queryDb } from "../../db/db-query.js";

export async function messageFlowsItemRowCreator(){
    const query = `
        INSERT INTO message_flows_items(company_id)
        VALUES($1)
        RETURNING id;
    `;
    const params = ["TEMP"];
    const dbResponse = await queryDb(query, params, false);
    return dbResponse[0].id;
}