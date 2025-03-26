import dotenv from 'dotenv';
import axios from "axios";
dotenv.config();

export async function handleTemporal(req, res) {
    const incomingRequest = req.body.entry?.[0]?.changes?.[0]?.value || null;
        
        if (!incomingRequest) {
            return res.status(400).json({ error: "Solicitud inválida: estructura incorrecta." });
        }

        const incomingMessage = incomingRequest.messages?.[0];
        
        if (!incomingMessage) {
            return res.status(400).json({ error: "No se encontró un mensaje válido en la solicitud." });
        }
    const { GRAPH_API_TOKEN, WAB_API_URL } = process.env;
    const receiver = "515186325014152";
    let url = `${WAB_API_URL}/${receiver}/messages`;
    let requestData = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "56984327660",
        type: interactive,
        "interactive": {
            "body": {
            "text": "Texto resumido"
            },
            "type": "button",
            "action": {
            "buttons": [
                {
                "type": "reply",
                "reply": {
                    "id": "d7412556-1135-4185-b3d9-e455d7423953",
                    "title": "Formación de pilotos"
                }
                },
                {
                "type": "reply",
                "reply": {
                    "id": "b92956e2-bfd8-4409-ab17-fa98ec774ab9",
                    "title": "Formación de mecánicos"
                }
                },
                {
                "type": "reply",
                "reply": {
                    "id": "756c4200-63a9-4808-87cf-140c9834a033",
                    "title": "Inglés aeronáutico"
                }
                },
                {
                "type": "reply",
                "reply": {
                    "id": "2bb06fc3-f5f5-46f5-8727-b3ce6d55001a",
                    "title": "Experiencia de vuelo"
                }
                },
                {
                "type": "reply",
                "reply": {
                    "id": "840a22a0-4337-4342-b015-19425f07c193",
                    "title": "Quiero saber más"
                }
                }
            ]
            },
            "header": {
            "text": "Titulo",
            "type": "text"
            }
        }
    };
    let headers = {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
    };
    try {
        // let sending = await axios.post(
        //     url,
        //     requestData,
        //     {headers}
        // );
        await axios({
            method: "POST",
            url: url,
            headers: headers,
            data: {
                messaging_product: "whatsapp",
                status: "read",
                message_id: incomingMessage.id,
            },
        });
        let sending = await axios({
            method: "POST",
            url: url,
            headers: headers,
            data: requestData,
        });
        return res.status(200);
    } catch (error) {
        return res.status(400);
    }   
}