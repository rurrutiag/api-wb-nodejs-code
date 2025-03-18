import { queryDb } from "./db/db-query";

// Función para obtener configuraciones de negocio y flujo por palabra clave
const getBusinessFlow = async (triggerWord) => {
    const query = `
        SELECT bf.*, ba.id as business_id 
        FROM business_flows bf
        JOIN business_accounts ba ON bf.business_id = ba.id
        WHERE bf.trigger_word = $1
    `;
    const { rows } = await queryDb(query, [triggerWord], false);
    return rows[0];
};

// Función para enviar un mensaje usando la API de WhatsApp Business
const sendMessage = async (to, text, businessConfig) => {
    if (!businessConfig || !businessConfig.whatsapp_phone_id || !businessConfig.access_token) {
        console.error("Configuración del negocio incompleta:", businessConfig);
        return;
    }
    const url = `https://graph.facebook.com/v14.0/${businessConfig.whatsapp_phone_id}/messages`;
    const payload = {
        messaging_product: "whatsapp",
        to: to,
        text: { body: text },
    };
    const headers = {
        Authorization: `Bearer ${businessConfig.access_token}`,
        "Content-Type": "application/json",
    };
    try {
        await axios.post(url, payload, { headers});
    } catch (error) {
        console.error("Error enviando mensaje:", error.response.data);
    }
};

// Registrar interacción del usuario en la base de datos
const logUserInteraction = async (userNumber, businessId, question, response) => {
    const query = `
        INSERT INTO user_responses (user_number, business_id, question, response) 
        VALUES ($1, $2, $3, $4)
     `;
    const queryParams = [userNumber, businessId, question, response];
    try {
        await queryDb(query, queryParams, false);
    } catch (error) {
        console.error("Error registrando interacción del usuario:", error.message);
    }
};

export {logUserInteraction, sendMessage, getBusinessFlow}