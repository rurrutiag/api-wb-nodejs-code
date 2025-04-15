import { itemCreator } from "./new-item.js";
import { newFlowRowCreator } from "../utils/new-flows-creation/new-flow-row-creator";
import { newFlowFirstElementAdder } from "../utils/new-flows-creation/new-flow-first-element-adder.js";
import { newFlowItemRowUpdater } from "../utils/new-flows-creation/new-flow-item-row-updater.js";

/**
 * Crea un flujo de conversación o navegación con sus respectivos ítems y los registra en base de datos.
 * 
 * Pasos:
 * 1. Valida datos de entrada.
 * 2. Crea los ítems del flujo con identificadores únicos.
 * 3. Establece relaciones entre ítems (anterior y siguiente).
 * 4. Registra el flujo en la base de datos.
 * 5. Guarda los ítems relacionados con el flujo.
 * 6. Define el primer ítem del flujo.
 * 
 * @async
 * @function
 * @param {Object} req - Objeto de solicitud HTTP con el cuerpo conteniendo la definición del flujo.
 * @param {Object} res - Objeto de respuesta HTTP para enviar el resultado de la operación.
 * @returns {void} Devuelve un status 200 si se creó correctamente o un mensaje de error si falló.
 * 
 * @throws {Error} Si ocurre un error durante el proceso, retorna status 500 con mensaje de error.
 * 
 * @example
 * POST /api/flow
 * req.body = {
 *   companyId: "abc123",
 *   platform: "wab",
 *   flow: { name: "Registro", trigger: "start", trigger_type: "keyword" },
 *   items: [{ itemNumber: 1, ... }, { itemNumber: 2, previousItemNumber: 1, ... }]
 * }
 */
export async function flowCreator(req, res){
    try {
        // Paso 0: Validaciones
        // Verifica que el body esté presente y tenga los campos requeridos.
        if (!req.body) {
            return res.status(400).json({ error: 'No data provided' });
        }
        let inputData = req.body;
        const { companyId, platform } = req.body;

        // Inicializa estructuras para mapear items y sus rutas
        let itemMatrix = {};
        let itemPath = {};
        let platformData = [{"wab": platform}];

        if (!companyId || !platform || (typeof inputData.flow !== 'object') || !inputData.items || (typeof inputData.items !== 'object')) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Paso 1: Extrae información básica del flujo
        let flow_id;
        let flow_name = inputData.flow.name;
        let flow_trigger = inputData.flow.trigger || null;
        let flow_trigger_type = inputData.flow.trigger_type || null;

        // Paso 2: Crea todos los ítems (pasos) del flujo
        let modeling_items = await Promise.all(
            inputData.items.map(async step => {
                let item = await itemCreator({ inputData: step, companyId: companyId });
                    itemMatrix = { ...itemMatrix, ... item.itemMatrix };
                let tempItemPath = item.itemPath;
                    itemPath = { ...itemPath, ...tempItemPath};
                return item;
            })
        );

        // Paso 3: Establece conexiones entre ítems (previo y siguiente)
        // 3.1 Agrega el ítem anterior a cada paso
            let items = modeling_items.map(modeled_item => {
                let tempItem = {...modeled_item};
                if(modeled_item.previousItemNumber) {
                    tempItem.previous_item_id = itemMatrix[modeled_item.previousItemNumber];
                }
                return tempItem;
            });
        // 3.2 Construye un mapa de sucesores
            const successorMap = {};
            for (const [number, data] of Object.entries(itemPath)) {
                // el nombre de la clave se almacena en number y los datos en data
                const prevNumber = data.previous_item_number;
                if (prevNumber) {
                    if (!successorMap[prevNumber]) successorMap[prevNumber] = [];
                    // Comienza a llenar el array con el número del item (en el siguiente paso, el action_id)
                    successorMap[prevNumber].push(number);
                }
            }
        // 3.3 Asocia a cada item su(s) siguiente(s) ítem(s) (array de action items)
            for (const [number, data] of Object.entries(itemPath)) {
                const successors = successorMap[number] || [];
                console.log("flowCreator | line 93 | data of itemPath", data);
                data.next_items = successors.map(successorNumber => ({
                    action_id: itemMatrix[number],
                    next_item_id: itemPath[successorNumber].id
                }));
            }

        // Paso 4: Crea el flujo en base de datos
        flow_id = await newFlowRowCreator({companyId, flow_name, flow_trigger_type, flow_trigger});

        // Entrepaso: eliminar datos de itemPath innecesarios para la base de datos
        Object.values(itemPath).forEach(element => {
            delete element["previous_item_id"];
            delete element["previous_item_number"];
        });

        // Paso 4.5: Marca el último ítem como archivo (fin del flujo)
        let lastFlowItem = Object.keys(items).length - 1;
        if(!items[lastFlowItem].metadata) {
            items[lastFlowItem].metadata = {};
        }
        items[lastFlowItem].metadata.archive_flow = true;

        // Paso 5: Guarda los ítems en la base de datos
        await Promise.all(
            items.map(async item => {
                await newFlowItemRowUpdater({
                    company_id: companyId,
                    platform: platformData,
                    content_type: item.itemType,
                    content: item.itemContent,
                    type_expected_response: item.typeResponse,
                    previous_item_id: item.previous_item_id || null,
                    next_item_id: itemPath[item.itemNumber] || null,
                    flow_id: flow_id,
                    id: item.itemId,
                    metadata: item.metadata || null
                });
            })
        );

        // Paso 6: Registra el primer ítem del flujo
        await newFlowFirstElementAdder({
            elementId: itemMatrix[1], // Se asume que el primer ítem tiene número 1 desde la solicitud POST
            flowId: flow_id
        });
        return res.sendStatus(200);
    } catch (err) {
        console.error("Error en flowCreator:", err);
        return res.status(500).json({ error: "Internal server error"});
    }
    
}