import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Alert, AlertDocument } from '../schemas/alert.schema';

@Injectable()
export class AlertsService {
    constructor(
        @InjectModel(Alert.name) private alertModel: Model<AlertDocument>,
    ) { }

    async create(alertData: Partial<Alert>, session?: ClientSession): Promise<AlertDocument> {
        const alert = new this.alertModel({
            ...alertData,
            created_at: new Date(),
            resolved: false,
        });
        return session ? alert.save({ session }) : alert.save();
    }

    async findAll(filters: any = {}): Promise<AlertDocument[]> {
        return this.alertModel
            .find(filters)
            .sort({ created_at: -1 })
            .exec();
    }

    async resolve(alertId: string, userId: string): Promise<AlertDocument> {
        return this.alertModel
            .findByIdAndUpdate(
                alertId,
                {
                    resolved: true,
                    resolved_at: new Date(),
                    resolved_by: userId,
                },
                { new: true }
            )
            .exec();
    }
}
