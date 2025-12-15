// Validadores para el frontend

export const validatePoliza = (polizaNumber) => {
    if (!polizaNumber) {
        return { valid: false, error: 'La póliza es obligatoria' }
    }

    if (polizaNumber.length !== 6) {
        return { valid: false, error: 'La póliza debe tener 6 dígitos' }
    }

    if (!/^\d+$/.test(polizaNumber)) {
        return { valid: false, error: 'La póliza debe contener solo números' }
    }

    return { valid: true }
}

export const validateMaterialQuantity = (quantity, unit) => {
    if (!quantity || quantity <= 0) {
        return { valid: false, error: 'La cantidad debe ser mayor a 0' }
    }

    // Validar decimales según unidad
    if (unit === 'pza' && !Number.isInteger(parseFloat(quantity))) {
        return { valid: false, error: 'Las piezas deben ser números enteros' }
    }

    return { valid: true }
}

export const validatePhotoStageSequence = (photos) => {
    const stages = ['inicial', 'durante', 'materiales', 'final']

    for (let i = 0; i < stages.length; i++) {
        if (photos[stages[i]]) {
            // Verificar que todas las etapas anteriores existan
            for (let j = 0; j < i; j++) {
                if (!photos[stages[j]]) {
                    return {
                        valid: false,
                        error: `Debe subir la foto de etapa "${stages[j]}" antes de "${stages[i]}"`
                    }
                }
            }
        }
    }

    return { valid: true }
}

export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Email inválido' }
    }
    return { valid: true }
}
