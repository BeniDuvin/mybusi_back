import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false, enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
