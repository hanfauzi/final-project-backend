import { IsString, IsUUID, IsNumber, Min, ValidateNested, ArrayMinSize, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class LaundryItemDto {
  @IsUUID()
  laundryItemId: string;

  @IsNumber()
  @Min(1)
  qty: number;
}

export class OrderItemDto {
  @IsUUID()
  serviceId: string;

  @IsNumber()
  @Min(1)
  qty: number;

  @IsString()
  @IsOptional()
  note?: string;

  @ValidateNested({ each: true })
  @Type(() => LaundryItemDto)
  @ArrayMinSize(1)
  laundryItems: LaundryItemDto[];
}

export class AddOrderItemsDto {
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ArrayMinSize(1)
  items: OrderItemDto[];
}
