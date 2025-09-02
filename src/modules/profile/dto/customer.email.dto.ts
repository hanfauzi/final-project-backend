import { IsEmail, IsOptional } from "class-validator";

export class CustomerEmailUpdateDTO {
  @IsEmail()
  @IsOptional()
  email?: string;
}
