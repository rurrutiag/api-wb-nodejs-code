import dotenv from 'dotenv';
import { addToCacheArray, getCache, getCacheObjectLength, getNestedCacheValue, updateCacheArrayObject } from "./cache";
import { queryDb } from '../db/db-query';
import { IncomingMessage } from 'http';

dotenv.config();

export function thereActiveFlows({companyId,receiver,sender}){
    // Are there session?
    const sessionKey = `session:${companyId}:wab:receive:${receiver}:sender:${sender}`;
        // Get all session keys
        const allSessions = Object.keys(getCache("sessions") || {});
        // Filter keys that match the pattern
        const matchingKeys = allKeys.filter(key =>
            key.startsWith(
                `${sessionKey}:flow:`
            )
        );
        // If exists sessions, return array
        if (matchingKeys.length > 0) {
            // Are active flows?
            let activeFlows = [];
            matchingKeys.forEach(key => {
                if (allSessions[key] && allSessions[key].status === "active") {
                    activeFlows.push(key);
                }
            })
            return activeFlows;
        } else {
            return null // There aren't sessions, therefore no flows.
        }
}

export function closeActiveFlows({companyId,receiver,sender}){
    const allSessions = Object.keys(getCache("sessions") || {});
    // Get active flows
    const activeFlows = thereActiveFlows({companyId: companyId, receiver: receiver, sender: sender});
    if (activeFlows !== null) {
        activeFlows.forEach(key => {
            allSessions[key].status = "closed";
        })
    }
}

export function getContentByItemId({flowId, itemId}) {
    const flowMessages = getCache(`flow:${flowId}`);
    const message = flowMessages.find(
        item => item.item_id === itemId
    );
    if (message) {
        return {
            content_type: message.content_type,
            content: message.content,
            type_expected_response: message.type_expected_response,
            next_item_id: message.next_item_id
        };
    } else {
        return null;
    }
}

export async function saveReceivedMessage({companyId, sender, contentType, content, sessionKey, flowId}){
    // Save in database
    let numRows = getCacheObjectLength("session", sessionKey, "interactions");
    let nextNumRows = numRows + 1;
    const previousItemId = getNestedCacheValue(
        {
            key: "session",
            subKey: `${sessionKey}:flow:${flowId}`,
            nestedKey: "interactions",
            itemKey: "index",
            valueKey: numRows,
            returnKey: "user_item_id"
        }

    );
    const query = `
        INSERT INTO messages(company_id, user_id, platform, content_type, content, sent_by, previous_item_id)
        VALUES $1, $2, $3, $4, $5, $6::jsonb, $7, $8
        RETURNING id;
    `;
    const params = [
        companyId,
        sender,
        "wab",
        contentType,
        JSON.stringify(content),
        `user:${sender}`,
        previousItemId
    ];
    const newIdResponse = await queryDb(query, params, false);
    const newId = newIdResponse["id"];
    // Save in cache
    addToCacheArray(
        "sessions",
        `${sessionKey}:flow:${flowId}:interactions`,
        {
            index: nextNumRows,
            user_message_type: contentType,
            user_message_content: content,
            user_item_id: newId
        }
    );
}

export async function saveSentMessage({companyId, sender, contentType, content, receiver,sessionKey, flowId}){
    // Save in database
    let numRows = getCacheObjectLength("session", sessionKey, "interactions");
    const previousItemId = getNestedCacheValue(
        {
            key: "session",
            subKey: `${sessionKey}:flow:${flowId}`,
            nestedKey: "interactions",
            itemKey: "index",
            valueKey: numRows,
            returnKey: "user_item_id"
        }

    );
    const query = `
        INSERT INTO messages(company_id, user_id, platform, content_type, content, sent_by, previous_item_id)
        VALUES $1, $2, $3, $4, $5, $6::jsonb, $7, $8
        RETURNING id;
    `;
    const params = [
        companyId,
        sender,
        "wab",
        contentType,
        JSON.stringify(content),
        `business:${receiver}`,
        previousItemId
    ];
    const newIdResponse = await queryDb(query, params, false);
    const newId = newIdResponse["id"];
    // Save in cache
    updateCacheArrayObject(
        "session",
        sessionKey,
        "interactions",
        "index",
        numRows,
        {
            business_message_type: contentType,
            business_message_content: content,
            business_item_id: newId
        }
    );
}

export async function sendMessageToSender({receiver, sender, type, content, companyId, sessionKey, flowId}){
    try {
        // First step: Send message
        const { GRAPH_API_TOKEN, WAB_API_URL } = process.env;
        await axios({
            method: "POST",
            url: `${WAB_API_URL}/${receiver}/messages`,
            headers: {
                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: sender,
                type: type,
                ...content
            }
        });
        // Second step: Save in cache and bbdd
        saveSentMessage({
            companyId: companyId,
            sender: sender,
            contentType: type,
            content: content,
            receiver: receiver,
            sessionKey: sessionKey,
            flowId: flowId
        })
        
    } catch (error) {
        throw new Error(`Error in send message: ${error.message}`);
    }
}