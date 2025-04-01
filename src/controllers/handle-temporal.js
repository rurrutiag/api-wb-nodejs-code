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
    const buttons = [
        { id: "d741255611354185b3d9e455d7423953", title: "Formación de pilotos", description: "Contamos con programas en Chile 🇨🇱 y EEUU 🇺🇸" },
        { id: "b92956e2bfd84409ab17fa98ec774ab9", title: "Formación de mecánicos 🇺🇸", description: "Formación con residencia e inserción laboral. _Cupos limitados_" },
        { id: "756c420063a9480887cf140c9834a033", title: "Inglés aeronáutico", description: "Preparación para *certificación OACI* o mejorar inglés en la aviación." },
        { id: "2bb06fc3f5f546f58727b3ce6d55001a", title: "Experiencias de vuelo", description: "Vive en primera persona lo que significa ser piloto." }
        // { id: "840a22a043374342b01519425f07c193", title: "Experiencias de vuelo", description: "Vive en primera persona lo que significa ser piloto." }
    ];
    let requestData = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "56984327660",
        type: "interactive",
        "interactive": {
            "type": "list",
            "header": {
                "text": "Descubre nuestras oportunidades en el mundo aeronáutico",
                "type": "text"
            },
            "body": {
                "text": "Contamos con diferentes opciones en el mundo aeronáutico. Al presionar en el botón *Ver opciones* de este mensaje, verás una lista con los servicios que podemos brindarte."
            },
            "footer": {
                "text": "Deberás seleccionar una opción para saber más información."
            },
            "action": {
                "sections": [
                    {
                        "title": "Formación de pilotos",
                        "rows": [
                            {
                                "id": "d741255611354185b3d9e455d7423953",
                                "title": "Formación en EEUU🇺🇸",
                                "description": "Programa con estándares americanos con residencia e inclusión laboral."
                            },
                            {
                                "id": "b92956e2bfd84409ab17fa98ec774ab9",
                                "title": "Formación en Chile🇨🇱",
                                "description": "Programas flexibles para obtener hasta la licencia de piloto comercial."
                            }
                        ]
                    },
                    {
                        "title": "Otros servicios",
                        "rows": [
                            {
                                "id": "756c420063a9480887cf140c9834a033",
                                "title": "Formación de mecánicos",
                                "description": "Formación en 🇺🇸 con residencia e inserción laboral."
                            },
                            {
                                "id": "2bb06fc3f5f546f58727b3ce6d55001a",
                                "title": "Inglés aeronáutico",
                                "description": "Preparación para certificación OACI o mejorar inglés en la aviación."
                            },
                            {
                                "id": "840a22a043374342b01519425f07c193",
                                "title": "Experiencias de vuelo",
                                "description": "Vive en primera persona lo que significa ser piloto."
                            }
                        ]
                    },
                ],
                "button": "Ver opciones"
            },
        }
    };
    let headers = {
            Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            'Content-Type': 'application/json'
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
        
        await axios({
            method: "POST",
            url: url,
            headers: headers,
            data: requestData,
        });

        return res.status(200).send('OK')
    } catch (error) {
        return res.status(403).send(error);
    }   
}