import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from "class-validator";

export class CustomerProfileUpdateDTO {
  @IsString()
  @IsOptional()
  name?: string;


  @IsString()
  @IsOptional()
  phoneNumber?: string;



  @IsUrl()
  @IsOptional()
  photoUrl?: string;
}
