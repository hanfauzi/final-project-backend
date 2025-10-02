import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/pagination.dto";

export enum DeliveryOrderMode {
  HISTORY = "HISTORY",
  AVAILABLE_TASK = "AVAILABLE_TASK",
}

export class GetDeliveryOrdersByDriverDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

  @IsOptional()
  @IsString()
  yearMonth?: string;

  @IsOptional()
  @IsEnum(DeliveryOrderMode)
  mode?: DeliveryOrderMode; 

  take: number = 10;
}
