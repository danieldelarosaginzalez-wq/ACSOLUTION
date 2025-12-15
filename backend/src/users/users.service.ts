import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async create(userData: Partial<User>): Promise<UserDocument> {
        const user = new this.userModel(userData);
        return user.save();
    }

    async findAll(filters: any = {}): Promise<UserDocument[]> {
        return this.userModel.find(filters).select('-password_hash').exec();
    }

    async findById(id: string): Promise<UserDocument> {
        return this.userModel.findById(id).select('-password_hash').exec();
    }

    async findByEmail(email: string): Promise<UserDocument> {
        return this.userModel.findOne({ email }).exec();
    }

    async update(id: string, updateData: Partial<User>): Promise<UserDocument> {
        return this.userModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .select('-password_hash')
            .exec();
    }

    async delete(id: string): Promise<UserDocument> {
        return this.userModel.findByIdAndDelete(id).exec();
    }
}
