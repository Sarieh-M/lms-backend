import { BadRequestException, Injectable, Res, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import {JWTPayloadType} from '../../../utilitis/types';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import { MailService } from 'src/mail/mail.service';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginDto } from './../dto/login.dto';
import { ResetPasswordDto } from './../dto/reset-password.dto';
import { Response,Request } from 'express';


@Injectable()
export class AuthProvider {

    constructor(
        @InjectModel(User.name) private readonly userModul:Model<User>,
        private readonly jwtService:JwtService,
        private readonly configService:ConfigService,
        private readonly mailService:MailService
    ){}


/**
 * Register new user
 * @param registerUserDto for register new user
 * @returns jwt {access token}
 */
    public async Register(registerUserDto:RegisterUserDto){
        const {userEmail,password,userName} = registerUserDto;
        const userFromDB = await this.userModul.findOne({$or: [{ userEmail }, { userName }]});
        if(userFromDB ){
            throw new BadRequestException('User name or user email already exists');
        }
        const hashedPassword = await this.hashPasswword(password);
        let newUser = await new this.userModul({
            ...registerUserDto,
            password:hashedPassword,
            verificationToken:await randomBytes(32).toString('hex')
        });
        newUser = await newUser.save();
        const link = await this.generateLinke(newUser._id,newUser.verificationToken);
        await this.mailService.sendVerifyEmailTemplate(userEmail,link);
        return {message:"verification token has been sent to your email,Please verify your email to continue"} ;
    }


/**
 * Log in user
 * @param loginDto Data for login user 
 * @returns jwt {access token}
 */
    public async Login(loginDto:LoginDto,response:Response){
        const {userEmail,password} = loginDto;
        const userFromDB = await this.userModul.findOne({userEmail});
        if(!userFromDB){
            throw new BadRequestException('Invalid Email or Password');
        }
        const isPasswordValid = await bcrypt.compare(password,userFromDB.password);
        if(!isPasswordValid){
            throw new BadRequestException('Invalid Email or Password');
        }
        if(!userFromDB.isAccountverified){
            let verficationToken = userFromDB.verificationToken;
            if(!verficationToken){
                userFromDB.verificationToken = await randomBytes(32).toString('hex');
                const result = await userFromDB.save(); 
                verficationToken = result.verificationToken;
            }
            const link = await this.generateLinke(userFromDB._id,verficationToken);
            await this.mailService.sendVerifyEmailTemplate(userEmail,link);
            return {message:"verification token has been sent to your email,Please verify your email to continue"};
        }
        const accessToken = await this.generateJWT({id:userFromDB._id, userType:userFromDB.role});
        const refreshToken = await this.generateRefreshToken({id:userFromDB._id, userType:userFromDB.role});

        // ✅ Set refresh token in cookie
        response.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: true, // true for HTTPS
        sameSite: "strict",
        path: '/api/user/refresh-token', // Only sent when requesting this endpoint
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 أيام
        });

        await this.mailService.sendLoginEmail(userEmail);
        return {AccessToken:accessToken};
    }

    public async refreshAccessToken(request:Request,response:Response){
        const refreshToken = request.cookies['refresh_token'];
            if (!refreshToken) {
                throw new UnauthorizedException('Refresh token not found');
            }
        
            try {
                const payload = await this.jwtService.verifyAsync(refreshToken, {
                    secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                });
        
                const newAccessToken = await this.generateJWT({ id: payload.id, userType: payload.userType });
                const newRefreshToken = await this.generateRefreshToken({ id: payload.id, userType: payload.userType });

                response.cookie('refresh_token', newRefreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "strict",
                    path: '/api/user/refresh-token',
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 أيام
                });
                return { AccessToken: newAccessToken };
            } catch (err) {
                throw new UnauthorizedException('Invalid or expired refresh token');
            }
    }

/**
 * Sending Reset Password Link to clint
 * @param userEmail email of the user
 * @returns message
 */
    public async SendResetPasswordLink(userEmail:string){
        const userFromDB = await this.userModul.findOne({email:userEmail});
        if(!userFromDB){
            throw new BadRequestException("User not found");
        }
        userFromDB.resetPasswordToken = await randomBytes(32).toString('hex');
        const result = await userFromDB.save();
        const resetPasswordLink = `${this.configService.get<string>('DOMAIN')}/reset-password/${result._id}/${result.resetPasswordToken}`;
        await this.mailService.sendRestPasswordTemplate(userEmail,resetPasswordLink);
        return {message:"Reset password link has been sent to your email,Please check your email to continue"};
    }

    /**
     * Get Reset Password Link
     * @param userId id of user
     * @param resetPassordToken 
     * @returns message
     */
    public async GetResetPasswordLink(userId:Types.ObjectId,resetPassordToken:string){
        const userFromDB = await this.userModul.findOne({id:userId});
        if(!userFromDB){
            throw new BadRequestException("Invalid Link");
        }
        if(userFromDB.resetPasswordToken !== resetPassordToken || userFromDB.resetPasswordToken === null){
            throw new BadRequestException("Invalid Link");
        }
        return {message:"Valid Link"};
    }

    /**
     * Reset The Password
     * @param resetPasswordDto 
     * @returns 
     */
    public async ResetPassword(resetPasswordDto:ResetPasswordDto){
        const {userEmail,newPassword,RestPasswordToken} = resetPasswordDto;
        const userFromDB = await this.userModul.findOne({userEmail});
        if(!userFromDB)throw new BadRequestException("Invalid Link");
        if(userFromDB.resetPasswordToken !== RestPasswordToken || userFromDB.resetPasswordToken === null){
            throw new BadRequestException("Invalid Link");
        }
        const hashedPassword = await this.hashPasswword(newPassword);
        userFromDB.password = hashedPassword;
        userFromDB.resetPasswordToken = null;
        await userFromDB.save();
        return {message:"Password Changed Successfully"}
    }

/**
 * Hash Password
 * @param password plain text password
 * @returns hashed password
 */
    public async hashPasswword(password:string):Promise<string>{
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password,salt);
    }


    /**
     * Generate Json Web Token
     * @param payload jwt payload
     * @returns token
     */
    private generateJWT(payload:JWTPayloadType):Promise<string>{
        return this.jwtService.signAsync(payload);
    }
    private async generateRefreshToken(payload: JWTPayloadType): Promise<string> {
        return await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });
}

    /**
     * Generate Linke For Email Verification
     * @param userId id for user
     * @param verficationToken plain text
     * @returns Linke Eamil Verification
     */
    private async generateLinke(userId:Types.ObjectId,verficationToken:string){
        return `${this.configService.get<string>('DOMAIN')}/api/user/verify-email/${userId}/${verficationToken}`;
    }

}
