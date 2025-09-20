import { Transform } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { OrderStatus, PickupStatus } from "../../generated/prisma";

export class PaginationQueryParams {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  take: number = 8;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page: number = 1;

  @IsOptional()
  @IsString()
  sortBy: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder: string = 'desc';
}

export class CustomerOrderQueryParams {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  take: number = 5;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  page: number = 1;

  @IsOptional()
  @IsEnum(OrderStatus, { message: "Invalid order status" })
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  invoiceNo?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string; 

  @IsOptional()
  @IsString()
  dateTo?: string;   
}

export class CustomerPickupQueryParams {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  take: number = 5;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  page: number = 1;

  @IsOptional()
  @IsEnum(PickupStatus, { message: "Invalid pickup status" })
  status?: PickupStatus;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}