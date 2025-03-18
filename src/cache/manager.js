import { cache } from './node-cache.js';

// Función para guardar datos en la caché
/**
 * Guarda un valor en la caché bajo una clave especificada.
 * 
 * @param {string} key - La clave bajo la cual almacenar el valor.
 * @param {any} value - El valor que se almacenará en la caché.
 * @returns {boolean} Retorna true si se guardó correctamente.
 */
export function setCache(key, value) {
    cache.set(key, value);
}

// Función para obtener datos de la caché
/**
 * Obtiene el valor almacenado en la caché bajo una clave especificada.
 * 
 * @param {string} key - La clave del valor a obtener.
 * @returns {any} El valor almacenado o undefined si la clave no existe.
 */
export function getCache(key) {
    return cache.get(key);
}

// Función para verificar si una clave existe en la caché
/**
 * Verifica si una clave existe en la caché.
 * 
 * @param {string} key - La clave a verificar.
 * @returns {boolean} Retorna true si la clave existe, false de lo contrario.
 */
export function hasCache(key) {
    return cache.has(key);
}

// Función para eliminar datos de la caché
/**
 * Elimina un valor de la caché bajo una clave especificada.
 * 
 * @param {string} key - La clave del valor a eliminar.
 * @returns {boolean} Retorna true si el valor fue eliminado, false si no existía.
 */
export function deleteCache(key) {
    cache.del(key);
}

// Función para limpiar toda la caché
/**
 * Elimina todos los valores de la caché.
 * 
 * @returns {boolean} Retorna true si la caché fue limpiada correctamente.
 */
export function clearCache() {
    cache.flushAll();
}

// Añadir un valor a un arreglo dentro de la caché
/**
 * Añade un nuevo valor a un arreglo almacenado en la caché bajo una clave y subclave especificadas.
 * Si el arreglo no existe, lo crea.
 * 
 * @param {string} key - La clave principal donde se almacenará el objeto.
 * @param {string} arrayKey - La clave dentro del objeto donde se encuentra el arreglo.
 * @param {any} newValue - El nuevo valor a añadir al arreglo.
 */
export function addToCacheArray(key, arrayKey, newValue) {
    // Obtener el objeto en caché o inicializarlo vacío
    const obj = getCache(key) || {};
    obj[arrayKey] = [...(obj[arrayKey] || []), newValue];
    setCache(key, obj);
}

export function addToCacheArrayInArray({key, arrayKey, subArrayKey, newValue}) {
    const obj = getCache(key) || {};
    // Si arrayKey no existe, inicializarlo como un objeto vacío
    obj[arrayKey] = obj[arrayKey] || {};
    // Si subArrayKey no existe dentro de arrayKey, inicializarlo como un array vacío
    obj[arrayKey][subArrayKey] = obj[arrayKey][subArrayKey] || [];
    // Agregar el nuevo valor
    obj[arrayKey][subArrayKey].push(newValue);
    // Guardar en caché
    setCache(key, obj);
}

// Actualizar o añadir propiedades a un objeto dentro de la caché
/**
 * Actualiza o añade propiedades a un objeto almacenado en la caché bajo una clave y subclave especificadas.
 * 
 * @param {string} key - La clave principal donde se almacenará el objeto.
 * @param {string} objectKey - La clave dentro del objeto que será actualizada.
 * @param {object} newValues - El nuevo objeto con las propiedades a añadir o actualizar.
 */
export function updateCacheObject(key, objectKey, newValues) {
    const obj = getCache(key) || {};
    obj[objectKey] = { ...obj[objectKey], ...newValues };
    setCache(key, obj);
}

// Actualizar o añadir un objeto dentro de un arreglo dentro de la caché
/**
 * Actualiza o añade un objeto dentro de un arreglo anidado en la caché bajo una clave y subclave especificadas.
 * Si el objeto no existe en el arreglo, lo añade al final.
 * 
 * @param {string} key - La clave principal donde se almacenará el objeto.
 * @param {string} subKey - La clave del objeto que contiene el arreglo.
 * @param {string} nestedKey - La clave dentro del objeto que contiene el arreglo a modificar.
 * @param {string} itemKey - La clave del objeto que se busca para verificar si debe ser actualizado.
 * @param {any} itemValue - El valor de la clave del objeto para buscar la coincidencia.
 * @param {object} newValues - Los nuevos valores que se agregarán o actualizarán en el objeto.
 */
export function updateCacheArrayObject(key, subKey, nestedKey, itemKey, itemValue, newValues) {
    const obj = getCache(key) || {};
    const nestedArray = obj[subKey]?.[nestedKey] || [];
    const itemIndex = nestedArray.findIndex(item => item[itemKey] === itemValue);

    if (itemIndex !== -1) {
        nestedArray[itemIndex] = { ...nestedArray[itemIndex], ...newValues };
    } else {
        nestedArray.push({ [itemKey]: itemValue, ...newValues });
    }

    obj[subKey] = { ...obj[subKey], [nestedKey]: nestedArray };
    setCache(key, obj);
}

// Obtener la longitud de un subobjeto en un objeto cacheado
/**
 * Obtiene la longitud de un arreglo anidado dentro de un objeto cacheado.
 * 
 * @param {string} key - La clave principal donde se almacenará el objeto.
 * @param {string} objectKey - La clave dentro del objeto donde se encuentra el arreglo.
 * @param {string} subKey - La clave dentro del arreglo donde se encuentra el subarreglo.
 * @returns {number} La longitud del subarreglo o 0 si no existe.
 */
export function getCacheObjectLength(key, objectKey, subKey) {
    const obj = getCache(key) || {};
    return obj[objectKey]?.[subKey]?.length || 0;
}

// Obtener un valor anidado en un objeto cacheado
/**
 * Obtiene un valor específico de un objeto anidado en la caché utilizando varias claves.
 * 
 * @param {Object} params - Parámetros con las claves necesarias para acceder al valor anidado.
 * @param {string} params.key - La clave principal donde se almacenará el objeto.
 * @param {string} params.subKey - La clave del objeto que contiene el arreglo.
 * @param {string} params.nestedKey - La clave dentro del objeto que contiene el arreglo.
 * @param {string} params.itemKey - La clave que se utiliza para buscar el item dentro del arreglo.
 * @param {any} params.valueKey - El valor que debe coincidir en la clave `itemKey`.
 * @param {string} params.returnKey - La clave del valor que se desea obtener del objeto encontrado.
 * @returns {any} El valor encontrado o null si no se encuentra.
 */
export function getNestedCacheValue({ key, subKey, nestedKey, itemKey, valueKey, returnKey }) {
    const obj = getCache(key) || {};
    const item = obj[subKey]?.[nestedKey]?.find(item => item[itemKey] === valueKey);
    return item ? item[returnKey] : null;
}

// Verificar si existe una clave en un objeto cacheado
/**
 * Verifica si una clave existe en el objeto almacenado en la caché.
 * 
 * @param {string} key - La clave principal donde se almacenará el objeto.
 * @param {string} arrayKey - La clave a verificar dentro del objeto.
 * @returns {boolean} Retorna true si la clave existe, false de lo contrario.
 */
export function existsInCache(key, arrayKey) {
    const obj = getCache(key);
    return obj ? Object.prototype.hasOwnProperty.call(obj, arrayKey) : false;
}