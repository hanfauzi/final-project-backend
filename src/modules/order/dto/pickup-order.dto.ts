import { IsArray, IsNotEmpty, IsString } from "class-validator";
export class PickUpOrderDTO {
  @IsString()
  @IsNotEmpty()
  customerAddressId!: string;

  @IsArray()
  @IsNotEmpty()
  services!: string[];
}
