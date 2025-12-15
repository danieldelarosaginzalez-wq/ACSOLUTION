import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsExtendedService } from './notifications-extended.service';
import { NotificationsController } from './notifications.controller';
import { NotificationSchema } from '../schemas/notification.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Notification', schema: NotificationSchema },
        ]),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsGateway, NotificationsService, NotificationsExtendedService],
    exports: [NotificationsService, NotificationsGateway, NotificationsExtendedService],
})
export class NotificationsModule { }
