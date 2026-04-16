import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ProblemDef = [name: string, stars?: number];
type CategoryDef = { key: string; name: string; freq?: string; problems: ProblemDef[] };
type GroupDef = { name: string; categories: CategoryDef[] };
type LevelDef = {
  key: string;
  name: string;
  tagline: string;
  bg: string;
  fg: string;
  groups: GroupDef[];
};

const LEVELS: LevelDef[] = [
  {
    key: 'level0',
    name: 'Mức 0',
    tagline: 'Làm quen với ngôn ngữ lập trình',
    bg: '#111111',
    fg: '#ffffff',
    groups: [
      {
        name: 'Cơ bản',
        categories: [
          {
            key: 'io',
            name: 'Nhập xuất và điều kiện',
            problems: [
              ['Xin chào Marisa!'], ['A + B'], ['A / B'], ['Phép nhân phức tạp'], ['Phân loại năm'],
              ['Phương trình nghiệm nguyên'], ['Tuổi'], ['Ghép hình chữ nhật'], ['Xâu'], ['Tam giác'],
              ['Làm tròn thương số'], ['Hình tròn'], ['Máy tính'], ['Nhỏ nhất và lớn nhất'], ['Hình chữ nhật'],
              ['Đoạn thẳng'], ['Khoảng cách'], ['Tăng dần'], ['Số chính phương'], ['Đếm số chính phương'],
              ['Chữ hoa chữ thường'], ['Đếm chữ'], ['Định dạng thời gian'], ['Hóa đơn tiền điện'], ['Ẩn năm'],
            ],
          },
          {
            key: 'loops',
            name: 'Vòng lặp',
            problems: [
              ['Vòng lặp'], ['Số chẵn'], ['Giai thừa'], ['Tam giác sao'], ['Gấp giấy'],
              ['Phân số'], ['Ước số'], ['Phép lũy thừa phức tạp'], ['Số nguyên tố'], ['Tổng chữ số'],
              ['Fibonacci'], ['Đọc số vĩnh hằng'], ['Cực trị'], ['Đảo ngược'], ['Đổi nấm'],
              ['Chữ số 0 tận cùng'], ['Thập phân sang nhị phân'], ['Nhị phân sang thập phân'],
              ['Phép chia'], ['Bộ nghiệm'],
            ],
          },
          {
            key: 'array',
            name: 'Mảng',
            problems: [
              ['Phần tử chẵn'], ['Giá trị nhỏ nhất'], ['Trung bình cộng'], ['Đảo ngược mảng'], ['Âm dương'],
              ['Chênh lệch liên tiếp'], ['Giá trị lớn nhất'], ['Dương âm'], ['Phần tử độ lớn'], ['Lớn thứ hai'],
              ['Tích lớn nhất'], ['Xoay mảng'], ['Mảng Palindrome'], ['Đường tròn'], ['Chèn'],
              ['Mảng con dương'], ['Sắp xếp'], ['Mảng giống nhau'], ['Độc nhất'], ['Độc nhất 2'],
              ['Giá trị thường xuyên'], ['Giá trị xuất hiện nhiều nhất'], ['Dãy nón'], ['Đổi chỗ'],
            ],
          },
          {
            key: 'array2d',
            name: 'Mảng hai chiều',
            problems: [
              ['Tam giác Pascal'], ['Tổng cột'], ['Hiện diện'], ['Tổng đường chéo'], ['Phủ điểm'],
              ['Thao tác đổi chỗ'], ['Ma trận xoắn ốc'], ['Tìm từ'], ['Xoay ma trận'], ['Ma trận zigzag'],
            ],
          },
          {
            key: 'string',
            name: 'Xâu',
            problems: [
              ['Độ dài'], ['Đếm từ'], ['Chữ thường'], ['Nguyên âm'], ['Tổng chữ số'],
              ['Mật khẩu mạnh'], ['Thống kê kí tự'], ['Xâu palindrome'], ['Xâu con palindrome'], ['Mã hóa Caesar'],
              ['Đếm xâu'], ['Tổng'], ['Chuẩn hóa xâu'], ['Run-length encoding'], ['Phép tính'],
            ],
          },
        ],
      },
      {
        name: 'Khác',
        categories: [
          {
            key: 'other',
            name: 'Các bài tập khác (Mức 0)',
            problems: [
              ['Tổng ước', 800], ['Cặp số bằng nhau', 800], ['UCLN và BCNN', 800],
              ['3', 800], ['Truy vấn xâu', 800], ['Liên tiếp', 1000], ['Đi tù', 1300],
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'level1',
    name: 'Mức 1',
    tagline: 'Các thuật toán và kĩ thuật cơ bản',
    bg: '#6b7280',
    fg: '#ffffff',
    groups: [
      {
        name: 'Vét cạn',
        categories: [
          {
            key: 'backtrack',
            name: 'Quay lui',
            freq: '9/10',
            problems: [
              ['Xâu nhị phân'], ['Xâu ABC'], ['Tổng tập con'], ['Tập con'], ['Chỉnh hợp'],
              ['Chia nhóm'], ['Bài toán mã đi tuần'], ['Bài toán N quân hậu'], ['Đường đi lớn nhất'], ['Cái túi'],
              ['Xây máng'], ['Sudoku'], ['Dò mìn'], ['Bài toán người bán hàng'], ['Tìm từ'],
            ],
          },
          { key: 'perm', name: 'Hoán vị', freq: '8/10', problems: [['Hoán vị'], ['Lập lịch']] },
        ],
      },
      {
        name: 'Tổng tiền tố',
        categories: [
          {
            key: 'prefix',
            name: 'Làm quen với Tổng tiền tố',
            freq: '10/10',
            problems: [
              ['Tổng tiền tố', 800], ['Mảng con có tổng lớn nhất', 800], ['Xâu con cân bằng', 800],
              ['Chia hết cho d', 800], ['Tổng dãy con', 800], ['Trò chơi trên mảng', 800],
              ['Tổng tiền tố 2 chiều', 800], ['Truy vấn bậc thang', 900],
              ['Mảng con có tổng lớn nhất 2', 900], ['Trung bình cộng', 1000],
              ['Xâu con tỉ lệ', 1000], ['Ma trận con tổng lớn nhất', 1200],
              ['Mảng con có tổng lớn nhất 3', 1300], ['Khoảng cách manhattan', 1400],
              ['Khoảng cách nhỏ nhất', 1500],
            ],
          },
          {
            key: 'diff',
            name: 'Mảng hiệu',
            freq: '7/10',
            problems: [
              ['Cập nhật đoạn', 800], ['Cập nhật đoạn hai chiều', 800],
              ['Cập nhật đoạn số lượng lớn', 900], ['Leo núi', 1000], ['Cập nhật đoạn bậc thang', 1100],
            ],
          },
        ],
      },
      {
        name: 'Sắp xếp',
        categories: [
          {
            key: 'sort',
            name: 'Sắp xếp',
            freq: '10/10',
            problems: [
              ['Sắp xếp điểm', 800], ['Pha thuốc', 800], ['Nhỏ nhất có thể', 900],
              ['Khoảng cách nhỏ nhất', 900], ['Đoạn thẳng', 900], ['Dưa chuột', 1000],
              ['Sắp xếp lớn nhất', 1100], ['Trò chơi bấm nút', 1100], ['Xây rào', 1200],
              ['Cân bằng', 1800],
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'level2',
    name: 'Mức 2',
    tagline: 'Vẫn đơn giản, nhưng quan trọng',
    bg: '#1f8a1f',
    fg: '#ffffff',
    groups: [
      {
        name: 'Tìm kiếm nhị phân',
        categories: [
          {
            key: 'bs',
            name: 'Giới thiệu tìm kiếm nhị phân',
            freq: '10/10',
            problems: [
              ['Tìm kiếm nhị phân', 800], ['Tìm kiếm nhị phân 2', 800], ['Tìm kiếm nhị phân 3', 800],
              ['Mảng con lớn', 800], ['Truy vấn đếm', 800], ['Đếm cặp', 800], ['Viên kẹo thứ k', 800],
              ['Cạnh tam giác', 1000], ['Số Hamming', 1200], ['Số nguyên liên tiếp', 1300],
              ['Khoảng cách Gnimmah', 1400], ['Đoạn con', 1400],
            ],
          },
          {
            key: 'bsr',
            name: 'Tìm kiếm nhị phân kết quả',
            freq: '6/10',
            problems: [
              ['Đọc sách', 800], ['Giá trị lớn nhất nhỏ nhất', 800], ['Số đẹp', 1000],
              ['Bảng cửu chương', 1000], ['Chữ số thứ k', 1000], ['Trung bình cộng lớn nhất', 1200],
              ['Sinh nhật', 1200], ['Sắp xếp hiệu', 1300], ['Thu thập', 1400],
            ],
          },
        ],
      },
      {
        name: 'Hai con trỏ',
        categories: [
          {
            key: 'twopointer',
            name: 'Giới thiệu hai con trỏ',
            freq: '6/10',
            problems: [
              ['Gộp mảng', 800], ['Pha thuốc 2', 800], ['Phần tử độc nhất', 800],
              ['Phạm vi nhỏ', 800], ['Số cặp', 800], ['Tổng ba giá trị', 900],
              ['Pha thuốc 3', 900], ['Pha thuốc 4', 900], ['Ba dãy', 1000],
              ['Ma trận con lớn nhất', 1100], ['Chọn số', 1200],
            ],
          },
        ],
      },
      {
        name: 'Toán',
        categories: [
          {
            key: 'math',
            name: 'Số học cơ bản',
            freq: '7/10',
            problems: [
              ['Số nguyên tố 2', 800], ['Sàng nguyên tố', 800], ['Sàng đoạn', 800],
              ['Ước nguyên tố', 1000], ['Ước chung lớn nhất', 1000], ['Đếm ước', 1000],
              ['Bội chung nhỏ nhất', 1100], ['Phần tử gần nhất', 1200], ['Đếm ước 2', 1200],
              ['BCNN và UCLN', 1200], ['GGCD', 1200], ['Tổng căn', 1200],
              ['Số chính phương', 1300], ['Tổng tổng tổng', 1500],
            ],
          },
          {
            key: 'binpow',
            name: 'Lũy thừa nhị phân',
            freq: '7/10',
            problems: [['Tràn số', 800], ['Lũy thừa nhị phân', 800], ['Đếm số', 900]],
          },
        ],
      },
      {
        name: 'Chia đôi tập',
        categories: [
          {
            key: 'mitm',
            name: 'Giới thiệu về chia đôi tập',
            freq: '1/10',
            problems: [
              ['Tổng tập con 2', 800], ['Tổng bốn giá trị', 800], ['Robot', 900],
              ['Chênh lệch nhỏ nhất', 900], ['Tập con có tổng lớn nhất', 1000], ['Trộm sách', 1000],
            ],
          },
        ],
      },
      {
        name: 'STL',
        categories: [
          {
            key: 'stl',
            name: 'Container trong thư viện mẫu chuẩn C++ (STL)',
            problems: [
              ['Phần tử thứ k', 800], ['Mảng cộng dồn động', 900], ['Không tên', 900],
              ['Lần xuất hiện thứ k', 1000], ['Tập hợp', 1000], ['Giá trị xuất hiện nhiều nhất', 1100],
              ['Rất nhiều truy vấn', 1100], ['Trung vị', 1200], ['Nhà', 1200], ['Hái hoa', 1300],
            ],
          },
        ],
      },
    ],
  },
];

async function main() {
  console.log('Clearing existing curriculum...');
  await prisma.progress.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.group.deleteMany();
  await prisma.level.deleteMany();

  console.log('Seeding curriculum...');
  let problemCount = 0;

  for (let li = 0; li < LEVELS.length; li++) {
    const lv = LEVELS[li];
    const level = await prisma.level.create({
      data: { key: lv.key, name: lv.name, tagline: lv.tagline, bg: lv.bg, fg: lv.fg, order: li },
    });

    for (let gi = 0; gi < lv.groups.length; gi++) {
      const g = lv.groups[gi];
      const group = await prisma.group.create({
        data: { levelId: level.id, name: g.name, order: gi },
      });

      for (let ci = 0; ci < g.categories.length; ci++) {
        const c = g.categories[ci];
        const category = await prisma.category.create({
          data: { groupId: group.id, key: c.key, name: c.name, freq: c.freq ?? null, order: ci },
        });

        for (let pi = 0; pi < c.problems.length; pi++) {
          const [name, stars] = c.problems[pi];
          const key = `${lv.key}-${c.key}-${String(pi + 1).padStart(2, '0')}`;
          await prisma.problem.create({
            data: {
              categoryId: category.id,
              key,
              name,
              stars: stars ?? 800,
              url: 'https://marisaoj.com',
              order: pi,
            },
          });
          problemCount++;
        }
      }
    }
  }

  console.log(`Seeded ${LEVELS.length} levels, ${problemCount} problems.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
