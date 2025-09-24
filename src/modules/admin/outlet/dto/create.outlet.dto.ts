import { Type } from "class-transformer";
import { IsString, IsNumber, MaxLength, Min, MinLength, Max, IsNotEmpty } from "class-validator";

export class CreateOutletDTO {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: "Code must be at least 3 characters" })
  @MaxLength(3, { message: "Code must not be longer than 3 characters" })
  code!: string;

  @IsString()
  @MaxLength(60, { message: "Name must not be longer than 60 characters" })
  name!: string;

  @IsString()
  @MaxLength(200, { message: "Address must not be longer than 200 characters" })
  address!: string;

  @IsString()
  @MinLength(10, { message: "Phone number must be at least 10 characters" })
  @MaxLength(15, {message: "Phone number must not be longer than 15 characters"})
  phoneNumber!: string;

 @IsNotEmpty()
  @IsString()
  cityId: string; 

  @IsNotEmpty()
  @IsString()
  postalCode: string

  @IsNumber()
  @Type(() => Number)
  latitude!: number;

  @IsNumber()
  @Type(() => Number)
  longitude!: number;

  @IsNumber()
  @Min(1, { message: "Coverage area must be at least 1 km" })
  @Max(5, { message: "Coverage area must not be longer than 5 km" })
  @Type(() => Number)
  coverageArea!: number;
}

