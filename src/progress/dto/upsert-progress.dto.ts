import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class UpsertProgressDto {
  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date phải dạng YYYY-MM-DD' })
  date?: string | null;

  @IsOptional()
  @IsString()
  code?: string | null;
}
