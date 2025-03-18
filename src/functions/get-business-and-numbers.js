import { queryDb } from "../db/db-query";

export default async function getBusinessAndNumbers(){
    try {
        const query = `
            SELECT id, platforms_data
            FROM businesses
        `;
        const params = [];
        const queryResponse = await queryDb(query, params, true);
        const result = queryResponse.map(({ id, platforms_data }) => {
            const groupedData = {};

            if (Array.isArray(platforms_data)) {
                platforms_data.forEach(item => {
                    const { available, ...rest } = item;
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
        });

        return result;
    } catch (error) {
        throw new Error(`Error in catch businesses data: ${error.message}`);
    }
}