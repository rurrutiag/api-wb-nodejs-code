export async function sendMessage({
    apiUrl, GRAPH_API_TOKEN, message
}) {
    try {
        await axios.post({
            url: apiUrl,
            data: message,
            headers: {
                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            }
        });
        if (response.status === 200) {
            return true;
        } else {
        throw new Error(`Error inesperado: ${response.statusText}`);
        }
    } catch (error) {
        throw new Error(`Error al enviar el mensaje: ${error.message}`);
    }
}