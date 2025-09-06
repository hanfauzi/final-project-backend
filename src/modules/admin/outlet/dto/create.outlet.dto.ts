import { IsString, IsNumber, MaxLength, Min, MinLength, Max } from "class-validator";

export class CreateOutletDTO {
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

  @IsString()
  city!: string;

  @IsString()
  @MinLength(5, { message: "Postal code must be at least 5 characters" })
  postalCode!: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsNumber()
  @Min(1, { message: "Coverage area must be at least 1 km" })
  @Max(3, { message: "Coverage area must not be longer than 3 km" })
  coverageArea!: number;
}
