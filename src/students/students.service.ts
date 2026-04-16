import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async list() {
    const students = await this.prisma.student.findMany({
      orderBy: { createdAt: 'asc' },
      include: { progress: { where: { done: true }, select: { date: true } } },
    });

    const today = todayLocal();
    const RECENT_DAYS = 14;
    const recentDates = lastNDates(today, RECENT_DAYS);

    return students.map((s) => {
      const totalDone = s.progress.length;
      const todayCount = s.progress.filter((p) => p.date === today).length;

      const counts: Record<string, number> = {};
      for (const d of recentDates) counts[d] = 0;
      for (const p of s.progress) {
        if (p.date && counts[p.date] !== undefined) counts[p.date]++;
      }
      const daily = recentDates.map((d) => ({ date: d, count: counts[d] }));

      return {
        id: s.id,
        name: s.name,
        parent: s.parent,
        username: s.username,
        goal: s.goal,
        totalDone,
        todayCount,
        alert: todayCount < s.goal,
        daily,
      };
    });
  }

  async getById(id: string) {
    const s = await this.prisma.student.findUnique({
      where: { id },
      include: {
        progress: {
          include: { problem: { select: { key: true, categoryId: true, stars: true, name: true } } },
        },
      },
    });
    if (!s) throw new NotFoundException('Student not found');
    return {
      id: s.id,
      name: s.name,
      parent: s.parent,
      username: s.username,
      goal: s.goal,
      progress: s.progress.map((p) => ({
        problemKey: p.problem.key,
        done: p.done,
        date: p.date,
        code: p.code,
        updatedAt: p.updatedAt,
      })),
    };
  }

  async create(dto: CreateStudentDto) {
    try {
      const s = await this.prisma.student.create({
        data: {
          name: dto.name.trim(),
          username: dto.username.trim(),
          password: dto.password,
          parent: dto.parent?.trim() || null,
          goal: dto.goal ?? 5,
        },
      });
      return { id: s.id, name: s.name, username: s.username, parent: s.parent, goal: s.goal };
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new BadRequestException('Username đã tồn tại');
      }
      throw e;
    }
  }

  async remove(id: string) {
    await this.prisma.student.delete({ where: { id } });
    return { ok: true };
  }
}

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function lastNDates(todayIso: string, n: number): string[] {
  const [y, m, d] = todayIso.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(base);
    dt.setDate(dt.getDate() - i);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    out.push(`${yy}-${mm}-${dd}`);
  }
  return out;
}
