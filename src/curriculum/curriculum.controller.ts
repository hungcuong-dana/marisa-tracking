import { Controller, Get } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';

@Controller('curriculum')
export class CurriculumController {
  constructor(private service: CurriculumService) {}

  @Get()
  getTree() {
    return this.service.getTree();
  }
}
