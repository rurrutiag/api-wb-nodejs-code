import { queryDb } from "../db/db-query.js";

/**
 * Busca los datos de negocios y plataformas desde la base de datos.
 * 
 * @async
 * @function businessAndNumberHunter
 * @returns {Promise<Array<Object>>} Devuelve una lista de objetos que contienen el `id` del negocio y los datos de las plataformas agrupados.
 * @throws {Error} Lanza un error si hay un problema al consultar la base de datos o procesar los datos.
 */
export default async function businessAndNumberHunter(){
    try {
        const query = `
            SELECT id, platforms_data
            FROM businesses
        `;
        // column platforms_data has data like 	[{"wab": "123", "available": true}]
        const params = [];
        const queryResponse = await queryDb(query, params, true);
        // Procesa la respuesta para agrupar los datos de plataformas
        const result = queryResponse.map(
            ({ id, platforms_data }) => {
                const groupedData = {};
                if (Array.isArray(platforms_data)) {
                    platforms_data.forEach(({ available, ...rest }) => {
                        if (available) {
                            const [key, value] = Object.entries(rest)[0];
                            if (!groupedData[key]) {
                                groupedData[key] = [];
                            }
                            groupedData[key].push(value);
                        }
                    });
                }
                return { id, platforms: groupedData };
            }
        );

        return result;
    } catch(e) {
        throw new Error(`Error in catch businesses data: ${e.message}`);
    }
}