import { dbConnection } from "./db-connection";

/**
 * Ejecuta un script SQL en la base de datos
 * 
 * @param {string} script - El script a ejecutar
 * @returns {Promise} - Devuelve una promesa con los resultados.
 * @throws {Error} - Lanza un error si la consulta falla.
 */
export const executeScript = async (script) => {
    try {
        const result = await dbConnection(script); // Ejecuta la consulta SQL
        return result; // Para operaciones de lectura, devuelve los resultados; para modificatorias, devuelve los datos de la operación (ej. número de filas afectadas).
    } catch (error) {
        console.error('Error executing script:', error);
        throw error;
    }
};