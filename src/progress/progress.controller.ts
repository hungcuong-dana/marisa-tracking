import { Body, Controller, Delete, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { UpsertProgressDto } from './dto/upsert-progress.dto';
import { AddScreenshotDto } from './dto/add-screenshot.dto';

@Controller('students/:studentId/progress')
export class ProgressController {
  constructor(private service: ProgressService) {}

  @Put(':problemKey')
  upsert(
    @Param('studentId') studentId: string,
    @Param('problemKey') problemKey: string,
    @Body() dto: UpsertProgressDto,
  ) {
    return this.service.upsert(studentId, problemKey, dto);
  }

  @Delete(':problemKey')
  remove(@Param('studentId') studentId: string, @Param('problemKey') problemKey: string) {
    return this.service.remove(studentId, problemKey);
  }

  @Post(':problemKey/screenshots')
  addScreenshot(
    @Param('studentId') studentId: string,
    @Param('problemKey') problemKey: string,
    @Body() dto: AddScreenshotDto,
  ) {
    return this.service.addScreenshot(studentId, problemKey, dto.data);
  }

  @Delete(':problemKey/screenshots/:shotId')
  removeScreenshot(
    @Param('studentId') studentId: string,
    @Param('shotId', ParseIntPipe) shotId: number,
  ) {
    return this.service.removeScreenshot(studentId, shotId);
  }
}
