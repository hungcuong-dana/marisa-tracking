import { IsString, Matches, MinLength } from 'class-validator';

export class AddScreenshotDto {
  @IsString()
  @MinLength(20)
  @Matches(/^data:image\/(png|jpe?g|gif|webp|heic|heif);base64,/i, {
    message: 'data phải là data URL ảnh (data:image/...;base64,...)',
  })
  data: string;
}
