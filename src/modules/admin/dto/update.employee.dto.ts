import { IsEmail, IsEnum, IsOptional, IsString, IsBoolean, MinLength } from "class-validator";
import { Role } from "../../../generated/prisma";

export class UpdateEmployeeDTO {
  @IsOptional()
  @IsString()
  outletId?: string;

  @IsOptional()
  @IsString()
  shiftId?: string;

  @IsOptional()
  @IsEnum(Role, { message: "role must be one of Role enum" })
  role?: Role;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: "Invalid email format" })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  password?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
