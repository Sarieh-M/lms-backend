import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Body, UnauthorizedException } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model, Types } from 'mongoose';
import { AuthProvider } from './auth/auth.provider';
import { LoginDto } from './dto/login.dto';
import { JWTPayloadType } from 'utilitis/types';
import { UserRole } from 'utilitis/enums';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { StudentCourseService } from 'src/student-course/student-course.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  private roleTranslations = {
    ADMIN: { en: 'Admin', ar: 'مدير' },
    INSTRUCTOR: { en: 'Instructor', ar: 'مدرس' },
    STUDENT: { en: 'Student', ar: 'طالب' },
  };

  private genderTranslations = {
    male: { en: 'Male', ar: 'ذكر' },
    female: { en: 'Female', ar: 'أنثى' },
    other: { en: 'Other', ar: 'آخر' },
  };

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly authProvider: AuthProvider,
    private readonly studentService: StudentCourseService,
    private readonly jwtService: JwtService,
  ) {}

  
  // ────────────────────────────────────────────────────────
  // 1) Registration & Authentication
  // ────────────────────────────────────────────────────────

    /**
   * Register a new user and initiate email verification.
   * Expects userName as { en: string; ar: string }
   */
    public async Register(registerUserDto: RegisterUserDto) {
      if (
        !registerUserDto.userName ||
        typeof registerUserDto.userName !== 'object' ||
        !registerUserDto.userName.en ||
        !registerUserDto.userName.ar
      ) {
        throw new BadRequestException('userName must be an object with both en and ar fields');
      }
  
      registerUserDto.userName.en = registerUserDto.userName.en.toLowerCase();
      registerUserDto.userName.ar = registerUserDto.userName.ar.toLowerCase();
  
      return await this.authProvider.Register(registerUserDto);
    }
  
    /**
     * Authenticate a user and return a JWT access token.
     */
    public async Login(loginDto: LoginDto) {
      return await this.authProvider.Login(loginDto);
    }
  
  

  // ────────────────────────────────────────────────────────
  // 2) Current User Retrieval
  // ────────────────────────────────────────────────────────
 /**
   * Fetch the currently authenticated user's profile.
   * @param id - MongoDB ObjectId of the user
   * @param lang - 'en' | 'ar' to return username in selected language (default 'en')
   */
  //this one for course.servce (AddNewCourse)
 public async getCurrentUserDocument(id: Types.ObjectId) {
  const user = await this.userModel.findById(id);
  if (!user) throw new NotFoundException('User not found');
  return user;
}
// this one for all
 public async getCurrentUser(id: Types.ObjectId, lang: 'en' | 'ar' = 'en') {
  const user = await this.userModel.findById(id)
  if (!user) throw new NotFoundException('User not found');

  return {
    userName: user.userName?.[lang] ?? user.userName?.en ?? '',
    role: this.roleTranslations[user.role]?.[lang] || user.role,
    gender: this.genderTranslations[user.gender]?.[lang] || user.gender,
    userEmail:user.userEmail,
    enrolledCourses:user.enrolledCourses,
    lastLogin:user.lastLogin,
    profileImage:user.profileImage,
    age:user.age
  };
}


  // ────────────────────────────────────────────────────────
  // 3) Admin-Only User Management
  // ────────────────────────────────────────────────────────
 /**
   * Retrieve all users in the system with pagination and optional filters.
   * @param page current page (default 1)
   * @param limit items per page (default 10)
   * @param search search text for userName or email
   * @param role filter by user role
   * @param lang language to return userName in ('en' | 'ar')
   */
 public async getAllUsers(
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: string,
  lang: 'en' | 'ar' = 'en',
) {
  const query: any = {};

  if (search) {
    query.$or = [
      { [`userName.${lang}`]: { $regex: search, $options: 'i' } },
      { userEmail: { $regex: search, $options: 'i' } },
    ];
  }

  if (role) {
    query.role = role;
  }

  const totalUsers = await this.userModel.countDocuments(query);
  const totalPages = Math.ceil(totalUsers / limit);

  const users = await this.userModel
    .find(query)
    .select('userName userEmail role profileImage enrolledCourses gender age')
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const usersWithLang = users.map((u) => ({
    ...u,
    userName: u.userName?.[lang] ?? u.userName?.en ?? '',
    role: this.roleTranslations[u.role]?.[lang] || u.role,
    gender: this.genderTranslations[u.gender]?.[lang] || u.gender,
  }));

  return {
    success: true,
    totalUsers,
    currentPage: page,
    totalPages,
    data: usersWithLang,
  };
}


  /**
   * Update a user's profile.
   * Admins may update any user; non-admins may update only their own profile.
   * Accepts userName as object { en: string, ar: string }
   */
  public async update(
    id: Types.ObjectId,
    currentUser: JWTPayloadType,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    // Only admins or the user themselves can update
    if (
      currentUser.userType !== UserRole.ADMIN &&
      id.toString() !== currentUser.id.toString()
    ) {
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
    }

    const targetId =
      currentUser.userType === UserRole.ADMIN
        ? id
        : new Types.ObjectId(currentUser.id);

    const userFromDB = await this.userModel.findById(targetId);
    if (!userFromDB) throw new NotFoundException('User not found');

    const {
      userName,
      password,
      profileImage,
      age,
      gender,
      enrolledCourses,
    } = updateUserDto;

    if (userName) {
      // تحديث الاسم بكل اللغات (en, ar)
      if (typeof userName === 'object' && userName.en && userName.ar) {
        userFromDB.userName = userName;
      } else {
        throw new BadRequestException(
          'userName must be an object with both en and ar strings',
        );
      }
    }

    if (profileImage) userFromDB.profileImage = profileImage;
    if (age !== undefined) userFromDB.age = age;
    if (gender) userFromDB.gender = gender;
    if (Array.isArray(enrolledCourses)) {
      userFromDB.enrolledCourses = [...enrolledCourses];
    }

    if (password) {
      userFromDB.password = await this.authProvider.hashPasswword(password);
    }

    return await userFromDB.save();
  }

  
   /**
   * Delete a user.
   */
  public async remove(
    id: Types.ObjectId,
    payload: JWTPayloadType,
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const userFromDB = await this.userModel.findById(id);
    if (!userFromDB) {
      throw new NotFoundException('User not found');
    }

    if (
      payload.userType === UserRole.ADMIN ||
      userFromDB._id.toString() === payload.id.toString()
    ) {
      await this.userModel.deleteOne({ _id: id });
      return { message: 'User has been deleted successfully' };
    }

    throw new ForbiddenException('You are not allowed to delete this user');
  }

  
    // ────────────────────────────────────────────────────────
    // 4) Email Verification & Password Reset
    // ────────────────────────────────────────────────────────
  
    /**
     * Verify a newly registered user's email via token link.
     * On success, marks the user as verified and creates a Student record if role=STUDENT.
     *
     * @param id                - ObjectId of the user
     * @param verificationToken - token from verification email
     * @returns success message
     * @throws NotFoundException | BadRequestException on invalid token or user
     */
    public async verifyEmail(id: Types.ObjectId, verificationToken: string,): Promise<{ message: string }> {
      const userFromDB = await this.userModel.findById(id);
      if (!userFromDB) throw new NotFoundException('User not found');
  
      if (userFromDB.verificationToken === null) {
        throw new NotFoundException('No verification token present');
      }
      if (userFromDB.verificationToken !== verificationToken) {
        throw new BadRequestException('Invalid verification token');
      }
  
      userFromDB.isAccountverified = true;
      userFromDB.verificationToken = null;
      await userFromDB.save();
  
      if (userFromDB.role === UserRole.STUDENT) {
        await this.studentService.getOrCreateStudent(userFromDB._id);
      }
  
      return { message: 'Email verified successfully. You can now log in.' };
    }
  
    /**
     * Send a password-reset link to the user's email.
     * @param email - the user's registered email address
     * @returns result from AuthProvider
     */
    public async sendRestPassword(email: string) {
      return await this.authProvider.SendResetPasswordLink(email);
    }
  
    /**
     * Validate a password-reset token and user ID.
     * @param id                  - ObjectId of the user
     * @param resetPasswordToken  - token from reset email
     * @returns result from AuthProvider
     */
    public async getRestPassword(id: Types.ObjectId, resetPasswordToken: string,
    ) {
      return await this.authProvider.GetResetPasswordLink( id, resetPasswordToken,);
    }
  
    /**
     * Complete the password reset using the provided DTO.
     * @param body - ResetPasswordDto containing new password and token
     * @returns result from AuthProvider
     */
    public async resetPassword(body: ResetPasswordDto) {
      return await this.authProvider.ResetPassword(body);
    }
  }
