// Constantes del sistema

export const ROLES = {
    ANALISTA: 'analista',
    TECNICO: 'tecnico',
    ANALISTA_INVENTARIO_OCULTO: 'analista_inventario_oculto'
}

export const OT_ESTADOS = {
    CREADA: 'creada',
    ASIGNADA: 'asignada',
    EN_PROCESO: 'en_proceso',
    FINALIZADA: 'finalizada',
    CERRADA: 'cerrada'
}

export const TIPOS_TRABAJO = {
    INSTALACION: 'instalacion',
    MANTENIMIENTO: 'mantenimiento',
    REPARACION: 'reparacion',
    INSPECCION: 'inspeccion'
}

export const TIPOS_MOVIMIENTO = {
    ENTRADA: 'entrada',
    SALIDA: 'salida',
    APARTADO: 'apartado',
    AJUSTE: 'ajuste',
    DEVOLUCION: 'devolucion'
}

export const TIPOS_ALERTA = {
    STOCK_CRITICO: 'stock_critico',
    CONSUMO_SOSPECHOSO: 'consumo_sospechoso',
    FOTO_MANIPULADA: 'foto_manipulada',
    POLIZA_INVALID: 'poliza_invalid',
    OVER_CONSUMPTION: 'over_consumption'
}

export const IA_DECISIONS = {
    PERMITIDO: 'permitido',
    IMPOSIBLE: 'imposible',
    REQUIERE_VERIFICACION: 'requiere_verificacion'
}

export const PHOTO_STAGES = ['inicial', 'durante', 'materiales', 'final']

export const POLIZA_LENGTH = 6
