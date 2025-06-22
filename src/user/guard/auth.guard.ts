import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { JWTPayloadType } from "utilitis/types";
import { ConfigService } from '@nestjs/config';
import { CURRNET_USER_KEY } from "utilitis/constants";



@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly jwtService:JwtService,
        private readonly configService:ConfigService
    ){}
    
    async canActivate(context: ExecutionContext){
        const request:Request =context.switchToHttp().getRequest();
        const [type,token]= request.headers.authorization?.split(' ')??[];
        if(token && type === 'Bearer'){
            try{
                const payload:JWTPayloadType = await this.jwtService.verifyAsync(token,{
                    secret:await this.configService.get<string>('JWT_SECRET')
                });
                request[CURRNET_USER_KEY] =payload;
            }catch(error){
                throw new UnauthorizedException("Access denied, Invalid token");
            }
        }else{
            throw new UnauthorizedException("Access denied, No Token Provide");
        }
        
        return true;
    }
}