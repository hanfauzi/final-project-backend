import { IsNotEmpty, IsString } from "class-validator";
export class PickUpOrderDTO {

  @IsString()
  @IsNotEmpty()
  customerAddressId!: string;

  @IsString()
  @IsNotEmpty()
  notes!: string;
}
