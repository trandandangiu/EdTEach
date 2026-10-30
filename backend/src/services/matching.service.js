// backend/src/services/matching.service.js
import prisma from '../config/prisma.js';

export const matchingService = {
  /**
   * Tính toán điểm gợi ý gia sư phù hợp nhất cho 1 yêu cầu tìm gia sư
   * Điểm số (0 - 100) tính theo:
   * 1. Môn học & Khối lớp đăng ký (40%)
   * 2. Khu vực / Địa bàn / Tỉnh thành (25%)
   * 3. Hình thức dạy (Online / Offline / Cả hai) (15%)
   * 4. Số lớp đang dạy (Càng ít lớp càng ưu tiên nhận thêm) (10%)
   * 5. Mức học phí đề xuất tương thích (10%)
   */
  async getSuggestionsForRequest(requestId) {
    const request = await prisma.classRequest.findUnique({
      where: { id: requestId },
      include: {
        student: { include: { gradeLevel: true } },
        subjectLevel: { include: { subject: true, gradeLevel: true } },
        offers: true,
      },
    });

    if (!request) {
      throw { status: 404, message: 'Không tìm thấy yêu cầu tìm gia sư' };
    }

    // Lấy toàn bộ gia sư đang ACTIVE
    const tutors = await prisma.tutorProfile.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: { select: { id: true, fullName: true, phone: true, email: true, avatarUrl: true } },
        subjects: {
          include: {
            subjectLevel: { include: { subject: true, gradeLevel: true } },
          },
        },
        classes: {
          where: { status: { in: ['ACTIVE', 'OPEN'] } },
          select: { id: true },
        },
      },
    });

    // ID các gia sư đã được gửi offer trước đó
    const existingOfferedTutorIds = new Set(request.offers.map((o) => o.tutorId));

    const scoredTutors = tutors.map((tutor) => {
      let score = 0;
      const matchReasons = [];

      // 1. Khớp môn & khối lớp (Tối đa 40đ)
      const exactSubjectLevel = tutor.subjects.some(
        (s) => s.subjectLevelId === request.subjectLevelId
      );
      const sameSubject = tutor.subjects.some(
        (s) => s.subjectLevel?.subjectId === request.subjectLevel?.subjectId
      );

      if (exactSubjectLevel) {
        score += 40;
        matchReasons.push('Khớp chính xác môn học và khối lớp');
      } else if (sameSubject) {
        score += 25;
        matchReasons.push('Cùng chuyên môn môn học');
      }

      // 2. Khu vực / Tỉnh thành / Quận huyện (Tối đa 25đ)
      if (request.province && tutor.province) {
        const sameProvince =
          tutor.province.toLowerCase().includes(request.province.toLowerCase()) ||
          request.province.toLowerCase().includes(tutor.province.toLowerCase());

        if (sameProvince) {
          if (
            request.district &&
            tutor.district &&
            (tutor.district.toLowerCase().includes(request.district.toLowerCase()) ||
              request.district.toLowerCase().includes(tutor.district.toLowerCase()))
          ) {
            score += 25;
            matchReasons.push(`Cùng quận/huyện: ${tutor.district}`);
          } else {
            score += 15;
            matchReasons.push(`Cùng tỉnh/thành: ${tutor.province}`);
          }
        }
      } else {
        score += 10;
      }

      // 3. Hình thức dạy (Tối đa 15đ)
      if (tutor.teachingMode === 'BOTH' || tutor.teachingMode === request.teachingMode) {
        score += 15;
        matchReasons.push(`Phù hợp hình thức: ${request.teachingMode}`);
      } else {
        score += 5;
      }

      // 4. Sức chứa / Số lớp đang dạy (Tối đa 10đ)
      const currentClasses = tutor.classes.length;
      const maxClasses = tutor.maxClasses || 5;
      if (currentClasses < maxClasses) {
        const capacityRatio = 1 - currentClasses / maxClasses;
        const capPoints = Math.round(capacityRatio * 10);
        score += capPoints;
        matchReasons.push(`Còn trống ${maxClasses - currentClasses} lớp`);
      } else {
        matchReasons.push('Đã đạt giới hạn số lớp tối đa');
      }

      // 5. Học phí đề xuất (Tối đa 10đ)
      if (request.budgetPerSession && tutor.hourlyRate) {
        const budget = Number(request.budgetPerSession);
        const rate = Number(tutor.hourlyRate);
        const diffPercent = Math.abs(rate - budget) / budget;
        if (diffPercent <= 0.2) {
          score += 10;
          matchReasons.push('Mức học phí đề xuất rất phù hợp');
        } else if (diffPercent <= 0.4) {
          score += 5;
        }
      } else {
        score += 5;
      }

      return {
        id: tutor.id,
        tutorId: tutor.id,
        name: tutor.user?.fullName || 'Thầy/Cô Gia Sư',
        phone: tutor.user?.phone || '',
        avatar: tutor.user?.avatarUrl || '',
        headline: tutor.headline || 'Gia sư Tiểu học Sư phạm',
        province: tutor.province || 'Hà Nội',
        district: tutor.district || '',
        hourlyRate: Number(tutor.hourlyRate || 250000),
        teachingMode: tutor.teachingMode,
        activeClassesCount: currentClasses,
        maxClasses,
        matchScore: Math.min(score, 100),
        matchReasons,
        alreadyOffered: existingOfferedTutorIds.has(tutor.id),
      };
    });

    // Sắp xếp điểm matching từ cao xuống thấp
    scoredTutors.sort((a, b) => b.matchScore - a.matchScore);

    return {
      request: {
        id: request.id,
        code: request.code,
        studentName: request.student?.fullName,
        subject: request.subjectLevel?.subject?.name,
        grade: request.subjectLevel?.gradeLevel?.name,
        province: request.province,
        district: request.district,
        teachingMode: request.teachingMode,
        budgetPerSession: request.budgetPerSession,
      },
      suggestions: scoredTutors,
    };
  },
};
