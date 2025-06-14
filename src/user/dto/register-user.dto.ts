import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDate, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Length, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";
import { Types } from "mongoose";
import { UserGender, UserRole } from "utilitis/enums";


export class  RegisterUserDto {
        @IsString()
        @IsNotEmpty({message: 'User Name is required'})
        @ApiProperty({
                description: 'Name of the user',
                example: 'John Doe',
        })
        userName:string;

        @IsNotEmpty({message: 'User Email is required'})
        @MaxLength(250,{ message: 'Password must not exceed 250 characters' })
        @IsString({message:'User Email must be a string'})
        @IsEmail({},{message:'User Email must be a valid email'})
        @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/ ,{message:'User Email must be a valid email'})
        @ApiProperty({
                description: 'User email address',
                example: 'user@example.com',
        })
        userEmail:string;

        @IsNotEmpty({message: 'Password is required'})
        @MaxLength(250)
        @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, { 
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'})
        @IsString({message:'Password must be a string'})
        @Length(8, 250, {message: 'Password must be at least 8 characters long and contaions small and capital letters and numbers and special characters'})
        @ApiProperty({
                description: 'Password for the user',
                example: 'Password@123',
        })
        password:string;

        @IsOptional()
        @IsEnum(UserRole,{ message: 'Role must be a valid UserRole value' })
        role?:UserRole;
        
        @IsOptional()
        @IsString({message:'Profile Image must be a string'})
        profileImage?: string;

        @IsOptional()
        @IsInt({ message: 'Age must be a valid number' })
        @Min(18, { message: 'Age must be at least 18' })
        @Max(100, { message: 'Age cannot exceed 100' })
        age?: number;

        @IsOptional()
        @Transform(({ value }) => value ? new Date(value) : value)
        @IsDate({ message: 'Date of birth must be a valid date' })
        dateOfBirth?: Date;  

        @IsOptional()
        @IsEnum(UserGender,{ message: 'Gender must be a valid UserGender value' })
        gender?: UserGender;  

        @IsOptional()
        enrolledCourses?:Types.ObjectId[];
}
