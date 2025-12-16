#!/usr/bin/env node

// Configuración específica para Railway
// Este archivo ayuda a debuggear las variables de entorno en Railway

console.log('🚀 Railway Configuration Debug');
console.log('================================');

console.log('📍 Variables de MongoDB disponibles:');
console.log('MONGO_URL:', process.env.MONGO_URL ? '✅ Configurada' : '❌ No configurada');
console.log('MONGO_PUBLIC_URL:', process.env.MONGO_PUBLIC_URL ? '✅ Configurada' : '❌ No configurada');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Configurada' : '❌ No configurada');

console.log('\n📍 Variables individuales de MongoDB:');
console.log('MONGOHOST:', process.env.MONGOHOST || 'No configurada');
console.log('MONGOUSER:', process.env.MONGOUSER || 'No configurada');
console.log('MONGOPASSWORD:', process.env.MONGOPASSWORD ? '***' : 'No configurada');
console.log('MONGOPORT:', process.env.MONGOPORT || 'No configurada');

console.log('\n📍 Variables de aplicación:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'No configurada');
console.log('PORT:', process.env.PORT || 'No configurada');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***' : 'No configurada');

console.log('\n🔗 URL de conexión que se usará:');
const mongoUrl = (process.env.MONGO_URL ? `${process.env.MONGO_URL}/acsolution` : null) || process.env.MONGODB_URI;
if (mongoUrl) {
    // Ocultar credenciales en el log
    const safeUrl = mongoUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('URL Final:', safeUrl);

    if (process.env.MONGO_URL) {
        console.log('✅ Usando MONGO_URL + /acsolution');
    } else if (process.env.MONGODB_URI) {
        console.log('⚠️ Usando MONGODB_URI como fallback');
    }
} else {
    console.log('❌ No hay URL de MongoDB disponible');
}

console.log('\n💡 Recomendaciones:');
if (!process.env.MONGO_URL && !process.env.MONGODB_URI) {
    console.log('- Verificar que el servicio MongoDB esté conectado en Railway');
    console.log('- Verificar que las variables estén configuradas en el proyecto');
}

if (process.env.MONGO_URL) {
    console.log('✅ Usar MONGO_URL (recomendado para Railway)');
} else if (process.env.MONGODB_URI) {
    console.log('⚠️ Usando MONGODB_URI (verificar que sea correcta)');
}