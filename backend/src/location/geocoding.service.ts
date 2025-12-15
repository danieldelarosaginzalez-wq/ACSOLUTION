import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface GeocodingResult {
    lat: number;
    lng: number;
    direccion_completa: string;
    geocoded: boolean;
}

@Injectable()
export class GeocodingService {
    private readonly logger = new Logger(GeocodingService.name);
    private readonly cache = new Map<string, GeocodingResult>();

    /**
     * Parsea direcciones colombianas inteligentemente
     * Extrae: calle/carrera, número, barrio
     */
    private parseDireccionColombia(direccion: string): {
        calle?: string;
        numero?: string;
        barrio?: string;
        municipio?: string;
    } {
        const lower = direccion.toLowerCase();
        const parsed: any = {};

        // Detectar calle/carrera
        const calleMatch = lower.match(/(?:calle|cll|cl|carrera|cra|cr|diagonal|diag|transversal|tv|avenida|av)\s*(\d+[a-z]?)/i);
        if (calleMatch) {
            parsed.calle = calleMatch[0];
        }

        // Detectar número
        const numeroMatch = lower.match(/#?\s*(\d+[a-z]?)\s*-\s*(\d+)/i);
        if (numeroMatch) {
            parsed.numero = numeroMatch[0];
        }

        // Detectar barrio (palabras después de "barrio", "br", "sector")
        const barrioMatch = direccion.match(/(?:barrio|br|sector)\s+([a-záéíóúñ\s]+?)(?:,|$)/i);
        if (barrioMatch) {
            parsed.barrio = barrioMatch[1].trim();
        }

        // Detectar municipio
        const municipiosBolívar = [
            'Cartagena', 'Magangué', 'Turbaco', 'Arjona', 'El Carmen de Bolívar',
            'Mahates', 'San Juan Nepomuceno', 'María La Baja', 'Mompós', 'Mompos',
            'Santa Rosa', 'Simití', 'Morales', 'Santa Catalina', 'Córdoba',
            'San Jacinto', 'Zambrano', 'Calamar', 'Clemencia', 'Santa Rosa del Sur'
        ];

        for (const municipio of municipiosBolívar) {
            if (lower.includes(municipio.toLowerCase())) {
                parsed.municipio = municipio;
                break;
            }
        }

        return parsed;
    }

    /**
     * Normaliza y mejora direcciones colombianas (Bolívar) para mejor geocodificación
     * MEJORADO: Parsing inteligente de calles, carreras y barrios
     */
    private normalizeDireccionColombia(direccion: string): string[] {
        const normalized = direccion.trim();
        const variants: string[] = [];
        const parsed = this.parseDireccionColombia(direccion);

        // Variante 1: Dirección original
        variants.push(normalized);

        // Variante 2: Si tiene calle/carrera y número, construir dirección estructurada
        if (parsed.calle && parsed.numero) {
            const estructurada = `${parsed.calle} ${parsed.numero}`;

            // Con barrio si existe
            if (parsed.barrio) {
                variants.push(`${estructurada}, ${parsed.barrio}, Cartagena, Bolívar, Colombia`);
                variants.push(`${estructurada}, Barrio ${parsed.barrio}, Cartagena, Colombia`);
            }

            // Sin barrio
            variants.push(`${estructurada}, Cartagena, Bolívar, Colombia`);
            variants.push(`${estructurada}, Cartagena de Indias, Colombia`);
        }

        // Variante 3: Con barrio detectado
        if (parsed.barrio) {
            variants.push(`${parsed.barrio}, Cartagena, Bolívar, Colombia`);
            variants.push(`Barrio ${parsed.barrio}, Cartagena, Colombia`);
        }

        // Variante 4: Agregar municipio detectado o Cartagena por defecto
        const municipio = parsed.municipio || 'Cartagena';
        if (!normalized.toLowerCase().includes(municipio.toLowerCase())) {
            variants.push(`${normalized}, ${municipio}, Bolívar, Colombia`);
            if (municipio === 'Cartagena') {
                variants.push(`${normalized}, Cartagena de Indias, Bolívar, Colombia`);
            }
        }

        // Variante 5: Solo con Cartagena y Colombia
        if (!normalized.toLowerCase().includes('cartagena')) {
            variants.push(`${normalized}, Cartagena, Colombia`);
        }

        // Variante 6: Agregar ", Colombia" si no lo tiene
        if (!normalized.toLowerCase().includes('colombia')) {
            variants.push(`${normalized}, Colombia`);
        }

        // Variante 7: Agregar ", Bolívar, Colombia" si no lo tiene
        if (!normalized.toLowerCase().includes('bolívar') && !normalized.toLowerCase().includes('bolivar')) {
            variants.push(`${normalized}, Bolívar, Colombia`);
        }

        // Eliminar duplicados manteniendo el orden
        return [...new Set(variants)];
    }

    /**
     * Convierte una dirección en coordenadas usando Nominatim (OpenStreetMap)
     * Gratuito y sin límites estrictos
     * Mejorado con múltiples intentos y normalización para Colombia (Bolívar)
     */
    async geocodeAddress(direccion: string): Promise<GeocodingResult | null> {
        if (!direccion || direccion.trim() === '') {
            return null;
        }

        // Verificar cache
        const cacheKey = direccion.toLowerCase().trim();
        if (this.cache.has(cacheKey)) {
            this.logger.debug(`Geocoding cache hit: ${direccion}`);
            return this.cache.get(cacheKey);
        }

        // Intentar con múltiples variantes de la dirección
        const variants = this.normalizeDireccionColombia(direccion);

        for (let i = 0; i < variants.length; i++) {
            const variant = variants[i];
            try {
                this.logger.debug(`🔍 Trying geocoding variant ${i + 1}/${variants.length}: ${variant}`);

                // Usar Nominatim de OpenStreetMap (gratuito)
                const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                    params: {
                        q: variant,
                        format: 'json',
                        limit: 1,
                        countrycodes: 'co', // Colombia
                        addressdetails: 1,
                    },
                    headers: {
                        'User-Agent': 'ServiceOps-Pro/1.0', // Requerido por Nominatim
                    },
                    timeout: 5000,
                });

                if (response.data && response.data.length > 0) {
                    const result = response.data[0];
                    const geocoded: GeocodingResult = {
                        lat: parseFloat(result.lat),
                        lng: parseFloat(result.lon),
                        direccion_completa: result.display_name,
                        geocoded: true,
                    };

                    // Guardar en cache
                    this.cache.set(cacheKey, geocoded);
                    this.logger.log(`✅ Geocoded: "${direccion}" -> ${geocoded.lat}, ${geocoded.lng} (variant: ${variant})`);

                    return geocoded;
                }

                // Esperar 1 segundo entre intentos (respeto a Nominatim)
                if (i < variants.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                this.logger.warn(`⚠️ Geocoding attempt failed for variant: ${variant} - ${error.message}`);
                continue;
            }
        }

        this.logger.warn(`❌ No geocoding results for: "${direccion}" (tried ${variants.length} variants)`);
        return null;
    }

    /**
     * Convierte coordenadas en dirección (reverse geocoding)
     */
    async reverseGeocode(lat: number, lng: number): Promise<string | null> {
        try {
            const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
                params: {
                    lat,
                    lon: lng,
                    format: 'json',
                },
                headers: {
                    'User-Agent': 'ServiceOps-Pro/1.0',
                },
            });

            if (response.data && response.data.display_name) {
                return response.data.display_name;
            }

            return null;
        } catch (error) {
            this.logger.error(`Reverse geocoding error:`, error.message);
            return null;
        }
    }

    /**
     * Calcula distancia entre dos puntos (fórmula de Haversine)
     * Retorna distancia en kilómetros
     */
    calculateDistance(
        lat1: number,
        lng1: number,
        lat2: number,
        lng2: number,
    ): number {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
            Math.cos(this.toRad(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return Math.round(distance * 100) / 100; // Redondear a 2 decimales
    }

    private toRad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    /**
     * Limpia el cache (útil para testing)
     */
    clearCache(): void {
        this.cache.clear();
        this.logger.log('Geocoding cache cleared');
    }
}
