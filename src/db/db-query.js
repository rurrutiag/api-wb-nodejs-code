import { dbConnection } from "./db-connection.js";

/**
 * Ejecuta una consulta SQL en la base de datos, puede ser de lectura (SELECT) o modificación (INSERT, UPDATE, DELETE).
 * 
 * @param {string} query - La consulta SQL a ejecutar.
 * @param {Array} [params=[]] - Los parámetros de la consulta.
 * @param {boolean} [isReadOnly=true] - Indica si la consulta es de solo lectura. Si es `false`, se asume que es una consulta de modificación (INSERT, UPDATE, DELETE).
 * @returns {Promise} - Devuelve una promesa con los resultados de la consulta o el número de filas afectadas.
 * @throws {Error} - Lanza un error si la consulta falla.
 */
export const queryDb = async (query, params = [], isReadOnly = true) => {
    try {
        const result = await dbConnection(query, params); // Ejecuta la consulta SQL
        return result; // Para operaciones de lectura, devuelve los resultados; para modificatorias, devuelve los datos de la operación (ej. número de filas afectadas).
    } catch (error) {
        console.error('Error in query execution:', error);
        throw error;
    }
};