import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class ClockOutAttendanceDTO {
  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;
}
