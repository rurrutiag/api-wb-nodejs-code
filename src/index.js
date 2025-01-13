// src/index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes.js';
import { createServer } from 'http';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const corsOrigin = process.env.CORS_ORIGIN || true;

// Obtener el directorio actual desde import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware para analizar el cuerpo de las solicitudes JSON
app.use(express.json());

// Middleware para registrar las solicitudes entrantes y habilitar CORS
app.use(cors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, '../public')));

// Registrar las solicitudes entrantes
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next(); // Continúa al siguiente middleware
});

// Si alguien hace una solicitud a la URL base '/', servir el archivo 'index.html'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use('/', routes);

// Middleware para manejar errores 404 (páginas no encontradas)
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, '../public/error.html'));
});

async function startServer() {
    try {
        const server = createServer(app);
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE'){
                console.log(`Puerto ${PORT} en uso`);
                console.error('Error al iniciar el servidor', error.message);
                process.exit(1);
            }
        });
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor corriendo en puerto ${PORT}`);
        });
    } catch (error) {
        console.error('Error en cargar certificado', error);
    }
}

startServer();