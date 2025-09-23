import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  IsNumber,
  MaxLength,
  MinLength,
  Min,
  Max,
} from "class-validator";

export class UpdateOutletDTO {
  @IsOptional()
  @IsString()
  @MaxLength(60, { message: "Name must not be longer than 60 characters" })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: "Address must not be longer than 200 characters" })
  address?: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: "Phone number must be at least 10 characters" })
  @MaxLength(15, { message: "Phone number must not be longer than 15 characters" })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(5, { message: "Postal code must be at least 5 characters" })
  postalCode?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsInt()
  @Min(1, { message: "Coverage area must be at least 1 km" })
  @Max(5, { message: "Coverage area must not be longer than 5 km" })
  coverageArea?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
