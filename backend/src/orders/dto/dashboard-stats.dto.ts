export interface DashboardStats {
    otsByStatus: {
        creada: number;
        asignada: number;
        en_proceso: number;
        finalizada: number;
        cerrada: number;
    };
    topTechnicians: Array<{
        tecnico_id: string;
        tecnico_nombre: string;
        completed: number;
        avg_time: number;
    }>;
    topMaterials: Array<{
        material_id: string;
        material_nombre: string;
        total_usado: number;
        unidad: string;
    }>;
    lowInventoryAlerts: Array<{
        material_id: string;
        nombre: string;
        stock_actual: number;
        stock_minimo: number;
    }>;
    summary: {
        total_ots: number;
        ots_mes_actual: number;
        ots_pendientes: number;
        tecnicos_activos: number;
    };
}
