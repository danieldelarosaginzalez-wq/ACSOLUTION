// Configuración MongoDB específica para Railway
// Este archivo exporta la función para construir la URL de MongoDB

function getMongoUrl() {
    // Prioridad de variables:
    // 1. MONGO_URL (si Railway la proporciona correctamente)
    // 2. Variables individuales de Railway
    // 3. Fallback para desarrollo

    if (process.env.MONGO_URL) {
        return `${process.env.MONGO_URL}/acsolution`;
    }

    if (process.env.MONGODB_URI) {
        return process.env.MONGODB_URI;
    }

    // Construir desde variables individuales (más confiable en Railway)
    const mongoUser = process.env.MONGOUSER || process.env.MONGO_INITDB_ROOT_USERNAME || 'mongo';
    const mongoPassword = process.env.MONGOPASSWORD || process.env.MONGO_INITDB_ROOT_PASSWORD;
    const mongoHost = process.env.MONGOHOST || process.env.RAILWAY_PRIVATE_DOMAIN;
    const mongoPort = process.env.MONGOPORT || '27017';
    const database = 'acsolution';

    if (mongoPassword && mongoHost) {
        return `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${database}`;
    }

    // Fallback para desarrollo local
    return 'mongodb://localhost:27017/acsolution';
}

function logConnectionInfo() {
    console.log('🔍 Railway MongoDB Configuration:');
    console.log('MONGO_URL:', process.env.MONGO_URL ? '✅ Available' : '❌ Not available');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Available' : '❌ Not available');
    console.log('MONGOUSER:', process.env.MONGOUSER ? '✅ Available' : '❌ Not available');
    console.log('MONGOPASSWORD:', process.env.MONGOPASSWORD ? '✅ Available' : '❌ Not available');
    console.log('MONGOHOST:', process.env.MONGOHOST ? '✅ Available' : '❌ Not available');
    console.log('RAILWAY_PRIVATE_DOMAIN:', process.env.RAILWAY_PRIVATE_DOMAIN ? '✅ Available' : '❌ Not available');

    const url = getMongoUrl();
    const safeUrl = url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('Final URL:', safeUrl);
}

module.exports = {
    getMongoUrl,
    logConnectionInfo
};

// Si se ejecuta directamente, mostrar información
if (require.main === module) {
    logConnectionInfo();
}