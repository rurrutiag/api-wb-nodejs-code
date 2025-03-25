import { getCache } from "../cache/manager.js";
import businessAndNumberHunter from "./business-and-number-hunter.js";
import { logRecorder } from "./log-recorder.js";

export default async function companyIdHunter({wab}) {
    const businesses = await businessAndNumberHunter();
    let wabSearched;
    let wabMatrix = {};
    let logRegistry;
    logRegistry = {
        step: "Company Id Hunter: datos capturados en businessAndNumberHunter",
        business: businesses
    };
    await logRecorder(logRegistry);
        businesses.forEach(({ id, platforms}) => {
            if (platforms.wab) {
                platforms.wab.forEach(number => {
                    wabMatrix[number] = id;
                });
            }
        });
    wabSearched = wabMatrix[wab] || null;
    // const wabIndex = getCache("wabIndex") || {};
    logRegistry = {
        step: "Company Id Hunter: Resultados",
        wabMatrix: wabSearched,
        infoRequest: wab
    };
    await logRecorder(logRegistry);
    return wabSearched || null;
}