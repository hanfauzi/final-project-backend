// src/controllers/order/dto/CreateOrderFromPickup.dto.ts
import { IsString, IsUUID, IsArray, ValidateNested, IsOptional, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

class LaundryItemDTO {
  @IsUUID()
  laundryItemId!: string;

  @IsInt()
  @Min(1)
  qty!: number;
}

export class OrderItemDTO {
  @IsUUID()
  serviceId!: string;

  @IsInt()
  @Min(1)
  qty!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsString()
  note?: string; //

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LaundryItemDTO)
  laundryItems?: LaundryItemDTO[];
}

export class CreateOrderFromPickupDTO {
  @IsUUID()
  pickupOrderId!: string;

  @IsString()
  notes!: string; // optional descriptive notes from admin

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDTO)
  items!: OrderItemDTO[];

  @IsOptional()
  @IsString()
  paymentMethod?: string; // e.g. CASH, DEBIT
}
