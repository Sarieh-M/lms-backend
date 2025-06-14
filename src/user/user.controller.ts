import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Query, Type, Req, UnauthorizedException, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './Guards/auth.guard';
import { JWTPayloadType } from 'utilitis/types';
import { CurrentUser } from './decorator/current-user.decorator';
import { Roles } from './decorator/user-role.decorator';
import { UserRole } from 'utilitis/enums';
import { AuthRolesGuard } from './Guards/auth-role.guard';
import { Types } from 'mongoose';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from 'nestjs-object-id';
import { Response,Request } from 'express';
@ApiTags('Users')
@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  // ─────────────────────────────────────────────────────────────────────
  // Public Authentication Endpoints
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Register a new user.
   * @body RegisterUserDto
   */
  @Post('auth/register')
  @ApiBody({ description: 'Register User DTO', type: RegisterUserDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  public Register(@Body() createUserDto: RegisterUserDto,@Req()req:Request) {
    return this.userService.Register(createUserDto,req);
  }



  /**
   * Authenticate a user and return a JWT.
   * @body LoginDto
   */
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ description: 'Login User DTO', type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  public Login(@Body() loginUser: LoginDto,@Res({ passthrough: true }) response: Response,@Req()req:Request) {
    return this.userService.Login(loginUser,response,req);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user and clear refresh token cookie' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  logout(@Res({ passthrough: true })response:Response) {
    return this.userService.logout(response);
  }

    @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
    @ApiResponse({ status: 200, description: 'New access token generated successfully' })
    @ApiResponse({ status: 401, description: 'Invalid or missing refresh token' })
    @Post('refresh-token')
  async refreshAccessToken(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    return await this.userService.refreshAccessToken(request,response);
  }
  // ─────────────────────────────────────────────────────────────────────
  // Protected Endpoints: Current User & Password Reset
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Get the currently authenticated user's details.
   * Guards: AuthGuard
   */
  @Get('current-user')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current user details' })
  @ApiResponse({ status: 200, description: 'Current user retrieved successfully' })
  public getCurrentUser(
    @CurrentUser() userPayload: JWTPayloadType,
    @Req() req?:Request,
  ) {
    const lang=(req as any).lang || 'en';
    return this.userService.getCurrentUser(userPayload.id,lang,req);
  }

  /**
   * Send a password reset email to the given address.
   * @body ForgotPasswordDto
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ description: 'Forgot Password DTO', type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  public forgotPassword(@Body() body: ForgotPasswordDto,@Req()req:Request) {
    return this.userService.sendRestPassword(body.email,req);
  }

  /**
   * Verify a password reset token.
   * @param id - User ObjectId
   * @param resetPasswordToken - token sent via email
   */
  @Get('reset-password/:id/:resetPasswordToken')
  @ApiExcludeEndpoint()
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'resetPasswordToken', type: String })
  public getResetPassword(
    @Param('id') id: Types.ObjectId,
    @Param('resetPasswordToken') resetPasswordToken: string
    ,@Req()req:Request
  ) {
    return this.userService.getRestPassword(id, resetPasswordToken,req);
  }

  /**
   * Reset the user's password using the provided DTO.
   * @body ResetPasswordDto
   */
  @Post('reset-password')
  @ApiBody({ description: 'Reset Password DTO', type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  public resetPassword(@Body() body: ResetPasswordDto,@Req()req:Request) {
    return this.userService.resetPassword(body,req);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Email Verification (Hidden from Swagger)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Verify a new user's email address.
   * @param id - User ObjectId
   * @param verificationToken - token sent via email
   */
  @Get('verify-email/:id/:verificationToken')
  @ApiExcludeEndpoint()
  public verifyEmail(
    @Param('id') id: Types.ObjectId,
    @Param('verificationToken') verificationToken: string,
    @Req() req?:Request,
  ) {
    return this.userService.verifyEmail(id, verificationToken,req);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Admin-Only User Management
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Retrieve all users.
   * Guards: AuthGuard, AuthRolesGuard(['admin'])
   */
  @Get()
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name or email' })
  @ApiQuery({ name: 'role', required: false, type: String, description: 'Filter by role' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  public getAllUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Req() req?:Request,
  ) {
    const lang=(req as any).lang || 'en';
    return this.userService.getAllUsers(+page, +limit, search, role,lang,);
  }

  /**
   * Update a user's information.
   * Guards: AuthGuard, AuthRolesGuard(['admin'])
   * @query id - User's ObjectId to update
   * @body UpdateUserDto
   */
  @Patch('update')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update user information' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only ADMIN allowed' })
  @ApiResponse({ status: 404, description: 'User not found' })
  public update(
    @Query('id', ParseObjectIdPipe) id: Types.ObjectId,
    @CurrentUser() payload: JWTPayloadType,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req?:Request,
  ) {
    return this.userService.update(id, payload, updateUserDto,req);
  }

  /**
   * Delete a user by ID.
   * Guards: AuthGuard, AuthRolesGuard(['admin'])
   * @query id - User's ObjectId to delete
   */
  @Delete('delete')
  @UseGuards(AuthGuard, AuthRolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only ADMIN allowed' })
  @ApiResponse({ status: 404, description: 'User not found' })
  public remove(
    @CurrentUser() payload: JWTPayloadType,
    @Query('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Req() req?:Request,
  ) {
    return this.userService.remove(id, payload,req);
  }
}
