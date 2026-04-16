import { Body, Controller, Delete, Param, Put } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { UpsertProgressDto } from './dto/upsert-progress.dto';

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
}
