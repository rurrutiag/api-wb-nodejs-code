import { getCache } from "./cache";

export default function findTriggeredFlow({company_id, messageToValidate}) {
    const triggers = getCache(`triggers:${company_id}`);
    if (!triggers || triggers.length === 0) {
        return null;
    }
    for (const trigger of triggers) {
        if (
            trigger.trigger_type === messageToValidate.type
        ) {
            switch (messageToValidate.type) {
                case "text":
                    if (messageToValidate.text.body === trigger.trigger_data.text.body) {
                        return {
                            flow_id: trigger.flow_id,
                            first_item_id: trigger_data.first_item_id
                        };
                    }
                    break;
            
                default:
                    break;
            }
            return null;
        }
    }
    return null;
}