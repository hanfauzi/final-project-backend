import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
export class LoginDTO {
  @IsNotEmpty()
  @IsEmail()
  email!: string;
  
  @IsString()
  @MinLength(8)
  password!: string;
}
