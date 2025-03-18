import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300});

// Función para guardar datos en la caché
export function setCache(key, value) {
    return cache.set(key, value);
}

// Función para obtener datos de la caché
export function getCache(key) {
    return cache.get(key);
}

// Función para verificar si una clave existe en la caché
export function hasCache(key) {
    return cache.has(key);
}

// Función para eliminar datos de la caché
export function deleteCache(key) {
    return cache.del(key);
}

// Función para limpiar toda la caché
export function clearCache() {
    return cache.flushAll();
}

export function addToCacheArray(key, arrayKey, newValue) {
    let obj = getCache(key) || {};
    if (!obj[arrayKey]) {
        obj[arrayKey] = [];
    }
    obj[arrayKey].push(newValue);
    setCache(key, obj);
}

export function updateCacheObject(key, objectKey, newValues) {
    let obj = getCache(key) || {};
    if (!obj[objectKey]) {
        obj[objectKey] = {};
    }
    obj[objectKey] = { ...obj[objectKey], ...newValues};
    setCache(key, obj);
}

export function updateCacheArrayObject(key, subKey, nestedKey, itemKey, itemValue, newValues) {
    let obj = getCache(key) || {};
    const itemIndex = obj[subKey]?.[nestedKey]?.findIndex(item => item[itemKey] === itemValue);
    if (itemIndex !== -1) {
        obj[subKey][nestedKey][itemIndex] = {
            ...obj[subKey][nestedKey][itemIndex],
            ...newValues,,
        };
        setCache(key, obj);
    } else {
        obj[subKey][nestedKey].push({
            [itemKey]: itemValue,
            ...newValues,
        });
        setCache(key, obj);
    }
}

export function getCacheObjectLength(key, objectKey, subKey) {
    let obj = getCache(key) || {};
    return obj[objectKey]?.[subKey]?.length || 0;
}

export function getNestedCacheValue({key, subKey, nestedKey, itemKey, valueKey, returnKey}) {
    let obj = getCache(key) || {};
    const item = obj[subKey]?.[nestedKey]?.find(item => item[itemKey] === valueKey);
    return item ? item[returnKey] : null;
}

export function existsInCache(key, arrayKey) {
    const obj = getCache(key);
    return obj && Object.prototype.hasOwnProperty.call(obj, arrayKey);
}

export {cache};