import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsBoolean } from "class-validator";
import { Role } from "../../../generated/prisma"; 

export class CreateEmployeeDTO {
  @IsString()
  @IsNotEmpty()
  outletId: string;

  @IsString()
  @IsNotEmpty()
  shiftId: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  password?: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
