// src/index.js

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

import router from './routes.js';
import { initialize } from './cache/initialize.js';

dotenv.config();

// Inicializar
const app = express();
const PORT = process.env.PORT || 3001;
const corsOrigin = process.env.CORS_ORIGIN || true;

// Obtener el directorio actual desde import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.json()); // Analizar JSON en solicitudes  
app.use(cors({ origin: corsOrigin, methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', credentials: true }));  
app.use(express.static(path.join(__dirname, '../public'))); // Servir archivos estáticos  
app.use('/webhook', router);
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, '../public/error.html'));
});
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next(); // Continúa al siguiente middleware
});

async function startServer() {
    try {
        // Crear el servidor
        const server = createServer(app);
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE'){
                console.log(`Puerto ${PORT} en uso`);
                console.error('Error al iniciar el servidor', error.message);
                process.exit(1);
            }
        });
        // Servidor escuchando PORT
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor corriendo en puerto ${PORT}`);
        });
        // Cache initialize
        initialize()
            .then( () => {
                console.log("Cache inicializado");
            })
            .catch((error) => {
                console.error("Error al inicializar cache:", error);
            });
        
    } catch (error) {
        console.error('Error en cargar certificado', error);
    }
}

startServer();