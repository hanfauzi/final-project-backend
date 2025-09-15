import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryParams } from '../../pagination/pagination.dto';

export class GetAttendanceByAdminDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  attendanceStatus?: string;

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

  @IsOptional()
  @IsString()
  yearMonth?: string;

  take: number = 31;
}
