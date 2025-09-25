import { IsArray, IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
export class PickUpOrderDTO {
  @IsString()
  @IsNotEmpty()
  customerAddressId!: string;

  @IsArray()
  @IsNotEmpty()
  services!: string[];

  @IsOptional()
  @IsString()
  @Length(2, 80)
  receiverName?: string;

  @IsOptional()
  @IsString()
  @Length(8, 20)
  receiverPhone?: string;
}
