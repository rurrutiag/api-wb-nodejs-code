import businessAndNumberHunter from "../utils/business-and-number-hunter.js";
import businessFlowMessagesHunter from "../utils/business-flow-messages-hunter.js";
import businessFlowTriggersHunter from "../utils/business-flow-triggers-hunter.js";
import { getCache, setCache } from "./manager.js";

export async function initialize() {
    try {
        // Cargar datos necesarios desde la base de datos y guardar en cache
        const businesses = await businessAndNumberHunter();
        const wabIndex = {};
        businesses.forEach(({ id, platforms}) => {
            setCache(`company:${id}`, platforms);
            if (platforms.wab) {
                platforms.wab.forEach(wab => {
                    wabIndex[wab] = id;
                });
            }
        });
        setCache("wabIndex", wabIndex);
        const flowTriggers = await businessFlowTriggersHunter();
        Object.entries(flowTriggers).forEach(([company_id, triggers]) => {
            setCache(`triggers:${company_id}`, triggers);
        });
        const flowMessages = await businessFlowMessagesHunter();
        Object.entries(flowMessages).forEach(([flowId, messages]) => {
            setCache(`flow:${flowId}`, messages);
        });
        setCache("session", {});
    } catch (e) {
        throw new Error(`Error al cargar y guardar flujos en cache: ${e.message}`);
    }
}