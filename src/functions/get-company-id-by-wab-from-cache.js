import { getCache } from "./cache";

export function getCompanyIdByWab({wab}) {
    const wabIndex = getCache("wabIndex") || {};
    return wabIndex[wab] || null;
}