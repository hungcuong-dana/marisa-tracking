import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { StudentsModule } from './students/students.module';
import { ProgressModule } from './progress/progress.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    PrismaModule,
    CurriculumModule,
    StudentsModule,
    ProgressModule,
  ],
})
export class AppModule {}
