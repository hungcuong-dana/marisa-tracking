import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertProgressDto } from './dto/upsert-progress.dto';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async upsert(studentId: string, problemKey: string, dto: UpsertProgressDto) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const problem = await this.prisma.problem.findUnique({ where: { key: problemKey } });
    if (!problem) throw new NotFoundException('Problem not found');

    const existing = await this.prisma.progress.findUnique({
      where: { studentId_problemId: { studentId, problemId: problem.id } },
    });

    const data: {
      done: boolean;
      date: string | null;
      code: string | null;
    } = {
      done: dto.done ?? existing?.done ?? false,
      date: dto.date !== undefined ? dto.date : existing?.date ?? null,
      code: dto.code !== undefined ? dto.code : existing?.code ?? null,
    };

    if (data.done && !data.date) data.date = todayLocal();
    if (!data.done) data.date = null;

    const rec = await this.prisma.progress.upsert({
      where: { studentId_problemId: { studentId, problemId: problem.id } },
      create: { studentId, problemId: problem.id, ...data },
      update: data,
    });

    return {
      problemKey,
      done: rec.done,
      date: rec.date,
      code: rec.code,
      updatedAt: rec.updatedAt,
    };
  }

  async remove(studentId: string, problemKey: string) {
    const problem = await this.prisma.problem.findUnique({ where: { key: problemKey } });
    if (!problem) throw new NotFoundException('Problem not found');
    await this.prisma.progress.deleteMany({
      where: { studentId, problemId: problem.id },
    });
    return { ok: true };
  }

  async addScreenshot(studentId: string, problemKey: string, data: string) {
    const progress = await this.ensureProgress(studentId, problemKey);
    const shot = await this.prisma.screenshot.create({
      data: { progressId: progress.id, data },
    });
    return { id: shot.id, data: shot.data, createdAt: shot.createdAt };
  }

  async removeScreenshot(studentId: string, screenshotId: number) {
    const shot = await this.prisma.screenshot.findUnique({
      where: { id: screenshotId },
      include: { progress: true },
    });
    if (!shot || shot.progress.studentId !== studentId) {
      throw new NotFoundException('Screenshot not found');
    }
    await this.prisma.screenshot.delete({ where: { id: screenshotId } });
    return { ok: true };
  }

  private async ensureProgress(studentId: string, problemKey: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    const problem = await this.prisma.problem.findUnique({ where: { key: problemKey } });
    if (!problem) throw new NotFoundException('Problem not found');
    return this.prisma.progress.upsert({
      where: { studentId_problemId: { studentId, problemId: problem.id } },
      create: { studentId, problemId: problem.id, done: false },
      update: {},
    });
  }
}

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
