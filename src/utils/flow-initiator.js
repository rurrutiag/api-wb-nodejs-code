import { setCache, getCache } from "../cache/manager.js";
import { queryDb } from "../db/db-query.js";
import { getFlowKey } from "./get-flow-key.js";
import { logRecorder } from "./log-recorder.js";

/**
 * Inicia un nuevo flujo en la base de datos y genera una clave de sesión única.
 * 
 * Esta función obtiene el número de flujo más alto asociado a una combinación de empresa, negocio, usuario y flujo.
 * Luego, incrementa ese número para asignar el siguiente identificador y genera una clave de sesión única.
 * 
 * @async
 * @function flowInitiator
 * @param {Object} params - Parámetros para inicializar el flujo.
 * @param {string} params.company - Identificador de la empresa.
 * @param {string} params.business - Identificador del negocio o medio de la empresa.
 * @param {string} params.user - Identificador del usuario que interactúa en el flujo.
 * @param {string} params.flow - Identificador del flujo.
 * @returns {Promise<string>} - Retorna la clave de sesión generada para el flujo.
 * @throws {Error} - Lanza un error si ocurre una excepción durante la ejecución.
 */
export async function flowInitiator({company,business,user,flow}){
    try {
        let logRegistry = {};
        // Consulta para obtener el número de flujo más alto y asignar el siguiente
        let query = `
            SELECT COALESCE(MAX(flow_number), 0) + 1 AS quantity
            FROM started_flows
            WHERE
                company_id = $1 AND
                company_media = $2 AND
                user_media = $3 AND
                flow_id = $4
        `;
        let params = [
            company,
            business,
            user,
            flow
        ];
        // Ejecutar la consulta en la base de datos para obtener el nuevo número de flujo
        const newFlowNumber = await queryDb(query, params, false);

            logRegistry = {
                step: "flowInitiator: newFlowNumber",
                results: newFlowNumber
            };
            await logRecorder(logRegistry);
        
        // Crear la clave de sesión única basada en el número de flujo obtenido
        query = `
            INSERT INTO started_flows(company_id, company_media, user_media, flow_id, flow_number, platform)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id;
        `;
        params = [
            company,
            business,
            user,
            flow,
            newFlowNumber[0].quantity
        ];
        const newFlowId = await queryDb(query, params, false);

            logRegistry = {
                step: "flowInitiator: newFlowId",
                results: newFlowId
            };
            await logRecorder(logRegistry);
        
        // Generar la clave base del flujo
        const keyBase = getFlowKey({
            companyId: company,
            receiver: business,
            sender: user,
            flowId: flow
        });
        // Crear la clave de sesión única basada en el número de flujo obtenido
        const sessionKeyDB = `${keyBase}:number:${newFlowNumber[0].quantity}`;

            logRegistry = {
                step: "flowInitiator: sessionKeyDB",
                results: sessionKeyDB
            };
            await logRecorder(logRegistry);

        return sessionKeyDB;
    } catch (e) {
        throw new Error(`Error in flow initiator: ${e.message}`);
    }
}