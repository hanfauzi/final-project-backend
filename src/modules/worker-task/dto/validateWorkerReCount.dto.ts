import { Type } from "class-transformer";
import { IsArray, IsInt, IsString, Min, ValidateNested } from "class-validator";

class OrderItemLaundryDTO {
  @IsString()
  laundryItemId: string;

  @IsInt()
  @Min(0)
  qty: number;
}

export class ValidateWorkerReCountDTO {
  @IsString()
  workerTaskId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemLaundryDTO)
  items: OrderItemLaundryDTO[];
}