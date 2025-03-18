import { setCache } from "./cache";
import getBusinessAndNumbers from "./get-business-and-numbers";
import getBusinessFlowMessages from "./get-business-flow-messages";
import getBusinessFlowTriggers from "./get-business-flow-triggers";

export default async function initializeCache() {
    try {
        // Load necessary data from database and save in cache
        const businesses = await getBusinessAndNumbers();
        const wabIndex = {};

        // Save data each company in cache
        businesses.forEach(({ id, platforms}) => {
            setCache(`company:${id}`, platforms);
            if (platforms.wab) {
                platforms.wab.forEach(wab => {
                    wabIndex[wab] = id;
                });
            }
        });;

        setCache("wabIndex", wabIndex);

        // Load flow triggers
        const flowTriggers = await getBusinessFlowTriggers();
        Object.entries(flowTriggers).forEach(([company_id, triggers]) => {
            // Save flow messages in cache
            setCache(`triggers:${company_id}`, triggers);
        });

        // Load flow messages
        const flowMessages = await getBusinessFlowMessages();
        Object.entries(flowMessages).forEach(([flowId, messages]) => {
            // Save messages each flow in cache
            setCache(`flow:${flowId}`, messages);
        });

        // Set sessions
        setCache("sessions", {});
    } catch (error) {
        throw new Error(`Error in load an save business flows in cache: ${error.message}`);
    }
}