import { IsString, MinLength } from "class-validator";
export class SetPasswordDTO {
  @IsString()
  @MinLength(8)
  password!: string;
}
