import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CustomerPasswordDTO {
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  oldPassword!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword!: string;


}