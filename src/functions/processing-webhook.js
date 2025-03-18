import { addToCacheArray } from "./cache";
import findTriggeredFlow from "./find-triggered-flow";
import { getCompanyIdByWab } from "./get-company-id-by-wab-from-cache";
import { closeActiveFlows, getContentByItemId, saveReceivedMessage, sendMessageToSender } from "./webhook-flows";

function routeForTrigger({companyId, receiver, sender, findTrigger, incomingMessage, sessionKey}){
    closeActiveFlows({
        companyId: companyId,
        receiver: receiver,
        sender: sender
    });
    // Set sessionKey
    let sessionKey = `session:${companyId}:wab:receive:${receiver}:sender:${sender}`;
    // Set new session between company, sender, receiver, flow
    addToCacheArray(
        "session",
        `session:${companyId}:wab:receive:${receiver}:sender:${sender}:flow:${findTrigger.flow_id}`,
        []
    );
    updateCacheObject(
        "session",
        `session:${companyId}:wab:receive:${receiver}:sender:${sender}:flow:${findTrigger.flow_id}`,
        { status: "active", interactions: []}
    );
    // Add received message in datastore
    saveReceivedMessage({
        companyId: companyId,
        sender: sender,
        contentType: incomingMessage.type,
        content: incomingMessage[incomingMessage.type],
        sessionKey: sessionKey,
        flowId: findTrigger.flow_id
    });
    // First flow message
    const getFirstMessage = getContentByItemId({
        flowId: findTrigger.flow_id,
        itemId: findTrigger.first_item_id
    });
    sendMessageToSender({
        receiver: receiver,
        sender: sender,
        type: getFirstMessage.content_type,
        content: getFirstMessage.content,
        companyId: companyId,
        sessionKey: sessionKey,
        flowId: findTrigger.flow_id
    });
}

export default function processingWebHook(req, res){
    // Recover request
    const incomingRequest = req.body.entry?.[0]?.changes?.[0]?.value || null;
    const incomingMessage = incomingRequest.messages?.[0];

        // If incoming message doesn't exist, then it must be answered with an error
        if (!incomingMessage) return res.sendStatus(400); // Pending define error number and message

    // Capture data
        // Business phone number who recives the message
        const receiver = incomingRequest.metadata.phone_number_id;
        // User phone number sending the message
        const sender = incomingMessage.from;

    // Get company_id associate to business phone number
    const companyId = getCompanyIdByWab({wab: receiver});
        if (!companyId) return res.sendStatus(400); // Pending define error number and message

    // The message is trigger?
    const findTrigger = findTriggeredFlow({
        company_id: companyId,
        messageToValidate: incomingMessage
    });
        // Path if it's indeed a trigger
        if (findTrigger !== null) {
            routeForTrigger({
                companyId: companyId,
                receiver: receiver,
                sender: sender,
                findTrigger: findTrigger,
                incomingMessage: incomingMessage,
                sessionKey: sessionKey
            });
        } else {
        // Path if it isn't actually a trigger
            
        
        }
}