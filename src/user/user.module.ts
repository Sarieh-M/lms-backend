import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from './auth/auth.provider';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { DatabaseModule } from 'src/db/database.module';
import { MailModule } from 'src/mail/mail.module';
import { StudentCourseModule } from 'src/student-course/student-course.module';





@Module({
  controllers: [UserController],
  providers: [UserService, AuthProvider],
  imports:[
    DatabaseModule,
    MailModule,
    MongooseModule.forFeature([{name:User.name,schema:UserSchema}]),
    forwardRef(()=>StudentCourseModule),
    JwtModule.registerAsync({
      inject:[ConfigService],
      useFactory:(configService:ConfigService)=>({
        global:true,
        secret:configService.get<string>('JWT_SECRET'),
        signOptions:{expiresIn:configService.get<string>('JWT_EXPIRES_IN')},
      })
    }),

  ],
  exports:[UserService,JwtModule]
})
export class UserModule {}
