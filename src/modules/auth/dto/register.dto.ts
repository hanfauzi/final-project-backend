import { IsEmail, IsNotEmpty } from "class-validator";

export class RegisterDTO { 
    @IsNotEmpty()
    @IsEmail()
    email! : string;
}