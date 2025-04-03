import { queryDb } from "../db/db-query.js";
import { getFlowData } from "./get-flow-key.js"
import { lastMessageFinder } from "./last-message-finder.js";

export async function messageSaver({
    flowSession,
    actor,
    content,
    contentType}) {
        try {
            const flowData = getFlowData({flowSession: flowSession});
            const lastItem = await lastMessageFinder({
                flowSession: flowData
            });
            let interactionsNumber = Number(lastItem.flowNumber);
            
            let newInteractionsNumber = interactionsNumber + 1;
            const lastItemId = lastItem.id;

            let query = `
                INSERT INTO messages(platform, interaction_index, company_id, company_media, user_media, flow_id, flow_number, "from", content_type, content, previous_item_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
                RETURNING id;
            `;
            let sentBy = actor;
            if (actor === "receiver") {
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