import { getCache } from "../cache/manager.js";

export default function companyIdHunter({wab}) {
    const wabIndex = getCache("wabIndex") || {};
    return wabIndex[wab] || null;
}