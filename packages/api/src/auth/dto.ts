import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { AdminRole } from '@prisma/client';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: AdminRole;
  };
}

export interface JwtPayload {
  sub: string;      // AdminUser.id
  email: string;
  role: AdminRole;
  type: 'access' | 'refresh';
}
