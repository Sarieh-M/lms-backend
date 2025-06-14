import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsEmail, IsDate, IsMongoId, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Types } from 'mongoose';

class LocalizedTitel{
    @IsString()
    en:string
    @IsString()
    ar:string
}
export class OrderDto {

    @IsString()
    @IsNotEmpty()
    userName: string;

    @IsEmail()
    @IsNotEmpty()
    userEmail: string;

    @IsString()
    @IsNotEmpty()
    orderStatus: string;

    @IsString()
    @IsNotEmpty()
    paymentMethod: string;

    @IsString()
    @IsNotEmpty()
    paymentStatus: string;

    @IsDate()
    @Type(()=>Date)
    @IsNotEmpty()
    orderDate: Date;

    @IsString()
    @IsNotEmpty()
    paymentId: string;

    @IsString()
    @IsNotEmpty()
    payerId: string;

    @IsMongoId()
    @IsNotEmpty()
    instructorId: Types.ObjectId;

    @IsString()
    @IsNotEmpty()
    instructorName: string;

    @IsString()
    @IsNotEmpty()
    courseImage: string;

    @IsObject()
    @ValidateNested()
    @Type(()=>LocalizedTitel)
    @IsNotEmpty()
    courseTitle: string;

    @IsMongoId()
    @IsNotEmpty()
    courseId: Types.ObjectId;

    @IsNumber()
    coursePricing: number;
}
