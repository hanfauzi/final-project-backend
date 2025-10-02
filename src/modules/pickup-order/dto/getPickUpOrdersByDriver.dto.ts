import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/pagination.dto";

export enum PickUpOrderMode {
  HISTORY = "HISTORY",
  AVAILABLE_TASK = "AVAILABLE_TASK",
}

export class GetPickUpOrdersByDriverDTO extends PaginationQueryParams {
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
  @IsEnum(PickUpOrderMode)
  mode?: PickUpOrderMode; 

  take: number = 10;
}
