import { addToCacheArrayInArray, getCacheObjectLength, getNestedCacheValue } from "../cache/manager.js";
import { queryDb } from "../db/db-query.js";
import { getFlowData } from "./get-flow-key.js"

export async function messageSaver({
    flowSession,
    actor,
    content,
    contentType}) {
        try {
            const flowData = getFlowData({flowSession: flowSession});

            let interactionsNumber = getCacheObjectLength("session", flowSession, "interactions");
            
            let newInteractionsNumber = interactionsNumber + 1;
            const lastItemId = getNestedCacheValue({
                key: "session",
                subKey: flowSession,
                nestedKey: "interactions",
                itemKey: "index",
                valueKey: interactionsNumber,
                returnKey: "id"
            });
            // Save in database
            // Table columns
                // id varchar(36)
                // platform varchar(255)
                // interaction_index integer
                // company_id varchar(36)
                // company_media varchar(255)
                // user_media varchar(255)
                // flow_id varchar(36)
                // flow_number integer
                // from varchar(8)
                // content_type varchar(50)
                // content jsonb
                // sent_at timestamp not null default now()
                // previous_item_id varchar(36)
                // metadata jsonb
            let query = `
                INSERT INTO messages(platform, interaction_index, company_id, company_media, user_media, flow_id, flow_number, "from", content_type, content, previous_item_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
                RETURNING id;
            `;
            let sentBy;
            if (actor === "receiver" || actor === "business") {
                sentBy = "business";
            } else {
                sentBy = "user";
            }
            let params = [
                "wab",
                newInteractionsNumber,
                flowData.company,
                flowData.receive,
                flowData.sender,
                flowData.flow,
                flowData.flowNumber,
                sentBy,
                contentType,
                JSON.stringify(content),
                lastItemId
            ];
            const newMessage = await queryDb(query, params, false);
            // Save in cache
            const cacheArray = {
                index: newInteractionsNumber,
                from: actor,
                content: content,
                type: contentType,
                id: newMessage[0]["id"]
            };
            addToCacheArrayInArray({
                key: "session",
                arrayKey: flowSession,
                subArrayKey: "interactions",
                newValue: {...cacheArray}
            });
            return true;
        } catch (e) {
            console.error("Error al guardar el mensaje:", e);
            throw new Error(`Error in save message: ${e.message}`);
        }
}

export async function messageSaverNoFlow({
    company,
    companyMedia,
    userMedia,
    actor,
    content,
    contentType}) {
        try {
            let query = `
                INSERT INTO messages(platform, interaction_index, company_id, company_media, user_media, flow_id, flow_number, "from", content_type, content, previous_item_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
                RETURNING id;
            `;
            let sentBy;
            if (actor === "receiver") {
                sentBy = "business";
            } else {
                sentBy = "user";
            }
            let params = [
                "wab",
                null,
                company,
                companyMedia,
                userMedia,
                null,
                null,
                sentBy,
                contentType,
                JSON.stringify(content),
                null
            ];
            const newMessage = await queryDb(query, params, false);
            return newMessage;
        } catch (e) {
            console.error("Error al guardar el mensaje:", e);
            throw new Error(`Error in save message: ${e.message}`);
        }
}