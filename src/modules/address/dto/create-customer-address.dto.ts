// src/modules/address/dto/create-customer-address.dto.ts
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Label } from "../../../generated/prisma";

export class CreateCustomerAddressDTO {
  label!: Label;

  @IsString()
  @MinLength(5)
  address!: string;

  @IsString()
  @MinLength(2)
  city!: string;

  @IsString()
  @Matches(/^\d{5}$/, { message: "postalCode harus 5 digit" })
  postalCode!: string;

  @IsString()
  phoneNumber!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
