import { getCache } from "../cache/manager.js";
import { logRecorder } from "./log-recorder.js";

export default async function companyIdHunter({wab}) {
    const wabIndex = getCache("wabIndex") || {};
    let logRegistry = {
        step: "Company Id Hunter",
        getInfo: wabIndex,
        infoRequest: wab
    };
    await logRecorder(logRegistry);
    return wabIndex[wab] || null;
}