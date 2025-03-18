import { addToCacheArray, existsInCache } from "./cache";
import findTriggeredFlow from "./find-triggered-flow";
import { getCompanyIdByWab } from "./get-company-id-by-wab-from-cache";

export default function processingWebHookBeta(req, res){
    const incomingRequest = req.body.entry?.[0]?.changes?.[0]?.value || null;
    const incomingMessage = incomingRequest.messages?.[0];

    // If incoming message doesn't exist, then it must be answered with an error
    if (!incomingMessage) return res.sendStatus(400);

    // Business phone number who receives the message
    const receiver = incomingRequest.metadata.phone_number_id;

    // Get company_id associate to business phone number
    const companyId = getCompanyIdByWab({wab: receiver});
    if (!companyId) {
        return res.sendStatus(400);
    }

    // User phone number sending the message
    const sender = incomingMessage.from;

    // Message sent by the user
    const userMessage = incomingMessage.text?.body?.trim();

    // Is there an active session between the user and this business number?
    const sessionKey = `${companyId}:wab:receive:${receiver}:sender:${sender}`;
    const sessionInCache = existsInCache("session", sessionKey);

    // If not exist session, then create session
    if (!sessionInCache) {
        addToCacheArray("session", sessionKey, []);
    }

    // The message is trigger?
    let messageToValidate;
    switch (incomingMessage.type) {
        case "text":
            messageToValidate = {
                type: "text",
                text: {
                    body: incomingMessage.text.body
                }
            };
            break;
    
        default:
            break;
    }
    const findTrigger = findTriggeredFlow({company_id: companyId, messageToValidate: messageToValidate});
    if (findTrigger === null) {
        return res.sendStatus(400)
    }

    let sessions = getCache("sessions") || {};
        sessions = sessions[sessionKey];

    // If there is an automated flow in progress, close it
    if (Object.keys(sessions).length !== 0) {
        // Search active automated-flow
        for (const [flowKey, flowData] of Object.entries(sessions)) {
            if (flowData.status === "active") {
                flowData.status = "closed";
            }
        }
    }


}