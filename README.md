# Proyecto Node.js + Neon.tech DB (PostgreSQL) + Azure App Service

Esta es una plantilla de una aplicación Node.js. Debes considerar lo siguiente:

## Variables de entorno

* **PORT:** Puerto en donde se iniciará el servidor (Si no existe, se establece en 3001)
* **CORS_ORIGIN:** URL desde donde se aceptarán peticiones separados por comas (,). Si no existe, se utilizará '*' por defecto.
* **DATABASE_URL:** Es la URL de la base de datos de Neon.tech, debe incluir el ambiente con el que se trabajará

## Secretos (Actions) de GitHub

Este proyecto incluye un pipeline para publicación mediante código en un Azure Web App.

* **AZUREAPPSERVICE_CLIENTID_DEV:** Id de cliente (UUID) de la aplicación registrada en Microsoft Entra con rol de contributor sobre el recurso.
* **AZUREAPPSERVICE_NAME_DEV:** Nombre dado al recurso (WebApp)
* **AZUREAPPSERVICE_SUBSCRIPTIONID:** Id de la subscripción (UUID) asociada al recurso.
* **AZUREAPPSERVICE_TENANTID:** Id de inquilino (UUID) de la organización.

## Páginas estáticas

El proyecto incluye una página estática para indicar error cuando se intenta entrar a la URL del servidor, una dirección incorrecta o acceder a un endpoint con el método HTTP incorrecto.
