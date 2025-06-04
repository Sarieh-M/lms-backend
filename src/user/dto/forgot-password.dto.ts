import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";



export class ForgotPasswordDto {
    
    @IsNotEmpty({message: 'User Email is required'})
    @MaxLength(250,{ message: 'Password must not exceed 250 characters' })
    @IsString({message:'User Email must be a string'})
    @IsEmail({},{message:'User Email must be a valid email'})
    @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/ ,{message:'User Email must be a valid email'})
    email:string;
}