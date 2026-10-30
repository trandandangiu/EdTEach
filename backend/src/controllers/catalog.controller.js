// backend/src/controllers/catalog.controller.js
import prisma from '../config/prisma.js';

export async function getEducationLevels(req, res, next) {
  try {
    const list = await prisma.educationLevel.findMany({
      where: { active: true },
      include: {
        gradeLevels: {
          where: { active: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

export async function getGradeLevels(req, res, next) {
  try {
    const list = await prisma.gradeLevel.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

export async function getSubjects(req, res, next) {
  try {
    const list = await prisma.subject.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: { id: 'asc' },
    });
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

export async function getSubjectLevels(req, res, next) {
  try {
    const { gradeLevelId, subjectId } = req.query;
    const where = { active: true };
    if (gradeLevelId) where.gradeLevelId = parseInt(gradeLevelId, 10);
    if (subjectId) where.subjectId = parseInt(subjectId, 10);

    const list = await prisma.subjectLevel.findMany({
      where,
      include: {
        subject: true,
        gradeLevel: true,
      },
      orderBy: [
        { gradeLevel: { order: 'asc' } },
        { subject: { id: 'asc' } },
      ],
    });
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}
