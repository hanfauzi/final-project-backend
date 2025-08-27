import { IsString, Length } from "class-validator";

export class GoogleIdTokenDTO {
  @IsString()
  @Length(10, 4000) 
  idToken!: string;
}