import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema';

@Injectable()
export class AuditService {
    constructor(
        @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    ) { }

    async log(logData: Partial<AuditLog>, session?: ClientSession): Promise<AuditLogDocument> {
        const log = new this.auditLogModel({
            ...logData,
            fecha: new Date(),
        });
        return session ? log.save({ session }) : log.save();
    }

    async findAll(filters: any = {}): Promise<AuditLogDocument[]> {
        return this.auditLogModel
            .find(filters)
            .sort({ fecha: -1 })
            .limit(1000)
            .exec();
    }
}
