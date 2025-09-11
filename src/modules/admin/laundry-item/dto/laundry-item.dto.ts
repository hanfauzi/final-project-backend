import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class CreateLaundryItemDTO {
  @IsNotEmpty()
  @IsString()
  name!: string;
}

export class UpdateLaundryItemDTO {
  @IsOptional()
  @IsString()
  name?: string;
}
