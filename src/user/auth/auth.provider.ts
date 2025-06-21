import {BadRequestException,forwardRef,Inject,Injectable,UnauthorizedException,} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import { JWTPayloadType } from '../../../utilitis/types';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../schemas/user.schema';
import { MailService } from 'src/mail/mail.service';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginDto } from './../dto/login.dto';
import { ResetPasswordDto } from './../dto/reset-password.dto';
import { Response, Request } from 'express';
import { UserService } from '../user.service';

@Injectable()
export class AuthProvider {
  constructor(
    @InjectModel(User.name) private readonly userModul: Model<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

public async Register(registerUserDto: RegisterUserDto, lang: 'en' | 'ar' = 'en' ) {
  lang = ['en', 'ar'].includes(lang) ? lang : 'en';
  const { userEmail, password } = registerUserDto;
  const errors = [];

  // مثال تحقق مبسط
  if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    errors.push({
      field: 'userEmail',
      message: lang === 'ar' ? 'البريد الإلكتروني غير صالح' : 'User email is not a valid email address',
    });
  }

  // تحقق من باقي الحقول بنفس الطريقة...

  if (errors.length > 0) {
    throw new BadRequestException({
      message: lang === 'ar' ? 'يوجد أخطاء في البيانات المُدخلة' : 'There are validation errors',
      errors,
    });
  }
  // هاش لكلمة المرور
  const hashedPassword = await this.hashPasswword(password);

  // إنشاء المستخدم
  let newUser = new this.userModul({
    ...registerUserDto,
    password: hashedPassword,
    verificationToken: (await randomBytes(32)).toString('hex'),
  });

  newUser = await newUser.save();

  const link = await this.generateLinke(newUser._id, newUser.verificationToken);

  await this.mailService.sendVerifyEmailTemplate(userEmail, link);

  // استدعاء بيانات المستخدم الجديد للرجوع بها
  const userRegisterData = await this.userService.getCurrentUser(newUser._id, lang);

  const msg =
    lang === 'ar'
      ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني. يرجى التحقق للمتابعة'
      : 'Verification token has been sent to your email. Please verify your email to continue';

  return { message: msg, userData: userRegisterData };
}
  //============================================================================
  public async Login(loginDto: LoginDto,response: Response,lang: 'en' | 'ar' = 'en') {
      lang=['en','ar'].includes(lang)?lang:'en';
    const { userEmail, password } = loginDto;
    const errors = [];
    // التحقق من أن البريد مكتوب كصيغة إيميل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      errors.push({
        field: 'userEmail',
        message:
          lang === 'ar'
            ? 'صيغة البريد الإلكتروني غير صحيحة'
            : 'Invalid email format',
      });
    }
    //  التحقق إذا كان المستخدم موجود
    const userFromDB = await this.userModul.findOne({ userEmail });
    if (!userFromDB) {
      errors.push({
        field: 'userEmail',
        message:
          lang === 'ar'
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            : 'Invalid email or password',
      });
    }

    //  التحقق من صحة كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, userFromDB.password);
    if (!isPasswordValid) {
      errors.push({
        field: 'password',
        message:
          lang === 'ar'
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            : 'Invalid email or password',
      });
    }

    // إذا في أخطاء، رجعها
    if (errors.length > 0) {
      throw new BadRequestException({
        message:
          lang === 'ar'
            ? 'يوجد أخطاء في البيانات المُدخلة'
            : 'There are validation errors',
        errors,
      });
    }

    //التحقق من تفعيل الحساب
    if (!userFromDB.isAccountverified) {
      let verficationToken = userFromDB.verificationToken;
      if (!verficationToken) {
        userFromDB.verificationToken = await randomBytes(32).toString('hex');
        const result = await userFromDB.save();
        verficationToken = result.verificationToken;
      }

      const link = await this.generateLinke(userFromDB._id, verficationToken);
      await this.mailService.sendVerifyEmailTemplate(userEmail, link);

      const msg =
        lang === 'ar'
          ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني، يرجى التحقق لإكمال التسجيل'
          : 'Verification token has been sent to your email, please verify to continue';
      return { message: msg };
    }

    //  إنشاء الرموز وإعداد الكوكيز
    const accessToken = await this.generateJWT({id: userFromDB._id,userType: userFromDB.role,});
    const refreshToken = await this.generateRefreshToken({id: userFromDB._id,userType: userFromDB.role,});

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/api/user/refresh-token',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const userLoginData = await this.userService.getCurrentUser(userFromDB._id,lang,);
    return { AccessToken: accessToken, userData: userLoginData };
  }
  //============================================================================
    public async refreshAccessToken(request: Request, response: Response) {
    const lang = request.headers['lang'] === 'ar' || request.headers['language'] === 'ar' ? 'ar' : 'en';

    const refreshToken = request.cookies['refresh_token'];

    if (!refreshToken) {
      const msg =
        lang === 'ar' ? 'رمز التحديث غير موجود' : 'Refresh token not found';
      throw new UnauthorizedException(msg);
    }

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const newAccessToken = await this.generateJWT({
        id: payload.id,
        userType: payload.userType,
      });

      const newRefreshToken = await this.generateRefreshToken({
        id: payload.id,
        userType: payload.userType,
      });

      response.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return { AccessToken: newAccessToken };
    } catch (err) {
      let msg = '';
      if (err.name === 'TokenExpiredError') {
        msg =
          lang === 'ar'
            ? 'انتهت صلاحية رمز التحديث'
            : 'Refresh token has expired';
      } else if (err.name === 'JsonWebTokenError') {
        msg = lang === 'ar' ? 'رمز التحديث غير صالح' : 'Invalid refresh token';
      } else {
        msg =
          lang === 'ar'
            ? 'فشل في التحقق من رمز التحديث'
            : 'Failed to verify refresh token';
      }

      throw new UnauthorizedException(msg);
    }
  }
  //============================================================================
    public async SendResetPasswordCode(userEmail: string, lang: 'en' | 'ar' = 'en') {
        lang = ['en', 'ar'].includes(lang) ? lang : 'en';
        const cleanedEmail = userEmail.trim().toLowerCase();

        const userFromDB = await this.userModul.findOne({ userEmail: cleanedEmail });
        if (!userFromDB) {
            const msg = lang === 'ar' ? 'المستخدم غير موجود' : 'User not found';
            throw new BadRequestException(msg);
        }

        const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
        const expiry = new Date(Date.now() + 2 * 60 * 1000); 

        userFromDB.resetCode = resetCode;
        userFromDB.resetCodeExpiry = expiry;

        await userFromDB.save();

        await this.mailService.sendResetCodeEmail(userEmail, resetCode, lang);

    const successMsg =
      lang === 'ar'
        ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من البريد لمتابعة العملية'
        : 'Reset password link has been sent to your email. Please check your email to continue';

    return {
      message: successMsg,
      userName: userFromDB.userName,
    };
  }
  //============================================================================
  public async GetResetPasswordLink(
    userId: Types.ObjectId,
    resetPassordToken: string,
    lang: 'en' | 'ar' = 'en',
  ) {
    lang = ['en', 'ar'].includes(lang) ? lang : 'en';

    const userFromDB = await this.userModul.findOne({ _id: userId }); // استخدم _id بدل id

    if (!userFromDB) {
      const msg = lang === 'ar' ? 'الرابط غير صالح' : 'Invalid link';
      throw new BadRequestException({
        message: lang === 'ar' ? 'يوجد أخطاء' : 'There errors',
        errors: msg,
      });
    }

    if (
      !userFromDB.resetPasswordToken ||
      userFromDB.resetPasswordToken !== resetPassordToken
    ) {
      const msg =
        lang === 'ar' ? 'الرابط غير صالح أو منتهي' : 'Invalid or expired link';
      throw new BadRequestException({
        message: lang === 'ar' ? 'يوجد أخطاء' : 'There errors',
        errors: msg,
      });
    }

    const successMsg =
      lang === 'ar'
        ? 'الرابط صالح، يمكنك المتابعة'
        : 'Valid link. You may proceed';
    return { message: successMsg };
  }
  //============================================================================
 public async ResetPassword(resetPasswordDto: ResetPasswordDto, lang: 'en' | 'ar' = 'en') {
        lang = ['en', 'ar'].includes(lang) ? lang : 'en';
        const { userEmail, newPassword, resetCode } = resetPasswordDto;

        const userFromDB = await this.userModul.findOne({ userEmail: userEmail.trim().toLowerCase() });

        if (!userFromDB) {
            throw new BadRequestException(lang === 'ar' ? 'المستخدم غير موجود' : 'User not found');
        }

        if (
            !userFromDB.resetCode ||
            userFromDB.resetCode !== resetCode ||
            !userFromDB.resetCodeExpiry ||
            new Date() > new Date(userFromDB.resetCodeExpiry)
        ) {
            throw new BadRequestException(lang === 'ar' ? 'رمز التحقق غير صالح أو منتهي' : 'Invalid or expired reset code');
        }

        const hashedPassword = await this.hashPasswword(newPassword);
        userFromDB.password = hashedPassword;
        userFromDB.resetCode = null;
        userFromDB.resetCodeExpiry = null;

        await userFromDB.save();

        return { message: lang === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully' };
    }
  //============================================================================
  public async hashPasswword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }
  //============================================================================
  private generateJWT(payload: JWTPayloadType): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
  //============================================================================  
    private async generateRefreshToken(payload: JWTPayloadType): Promise<string> {
        return await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });
  }
  //============================================================================
  private async generateLinke(userId: Types.ObjectId,verficationToken: string,) {
    return `${this.configService.get<string>('DOMAIN')}/api/user/verify-email/${userId}/${verficationToken}`;
  }
  //============================================================================
}
