import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Material, MaterialDocument } from '../schemas/material.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { Alert, AlertDocument } from '../schemas/alert.schema';
import { AiPrediction, AiPredictionDocument } from '../schemas/ai-prediction.schema';

@Injectable()
export class DashboardService {
    constructor(
        @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
        @InjectModel(Material.name) private readonly materialModel: Model<MaterialDocument>,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(Alert.name) private readonly alertModel: Model<AlertDocument>,
        @InjectModel(AiPrediction.name) private readonly aiPredictionModel: Model<AiPredictionDocument>,
    ) { }

    async getStats() {
        const [
            totalOrders,
            ordersByEstado,
            totalMaterials,
            totalUsers,
            usersByRol,
            totalAlerts,
            openAlerts,
            totalPredictions,
        ] = await Promise.all([
            this.orderModel.countDocuments().exec(),
            this.orderModel.aggregate([
                { $group: { _id: '$estado', count: { $sum: 1 } } },
            ]).exec(),
            this.materialModel.countDocuments().exec(),
            this.userModel.countDocuments().exec(),
            this.userModel.aggregate([
                { $group: { _id: '$rol', count: { $sum: 1 } } },
            ]).exec(),
            this.alertModel.countDocuments().exec(),
            this.alertModel.countDocuments({ resolved: false }).exec(),
            this.aiPredictionModel.countDocuments().exec(),
        ]);

        const ordersByStatusMap = ordersByEstado.reduce((acc, item) => {
            acc[item._id || 'desconocido'] = item.count;
            return acc;
        }, {} as Record<string, number>);

        const usersByRoleMap = usersByRol.reduce((acc, item) => {
            acc[item._id || 'desconocido'] = item.count;
            return acc;
        }, {} as Record<string, number>);

        return {
            orders: {
                total: totalOrders,
                byStatus: ordersByStatusMap,
            },
            materials: {
                total: totalMaterials,
            },
            users: {
                total: totalUsers,
                byRole: usersByRoleMap,
            },
            alerts: {
                total: totalAlerts,
                open: openAlerts,
            },
            aiPredictions: {
                total: totalPredictions,
            },
        };
    }

    async getAnalystDashboard() {
        const [
            recentOrders,
            openAlerts,
        ] = await Promise.all([
            this.orderModel.find().sort({ fecha_creacion: -1 }).limit(10).exec(),
            this.alertModel.find({ resolved: false }).sort({ timestamp: -1 }).limit(10).exec(),
        ]);

        return {
            recentOrders,
            openAlerts,
        };
    }
}

