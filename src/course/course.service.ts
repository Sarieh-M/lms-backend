import { forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException, Req, UnauthorizedException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { Course } from './schemas/course.schema';
import { UserService } from 'src/user/user.service';
import { LectureDTO } from './dto/lecture-course.dto';
import { Lecture } from './schemas/lecture.schema';
import { Order } from 'src/order/schema/order.schema';
import { UserRole } from 'utilitis/enums';
import { Student } from 'src/student-course/schemas/student-course.schema';


@Injectable()
export class CourseService {

    constructor(@InjectModel(Course.name)private readonly courseModel: Model<Course>,
    @InjectModel(Student.name) private readonly studentModel: Model<Student>,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @InjectModel(Lecture.name) private readonly lectureModel:Model<Lecture>,
    
) {}
   
public async AddNewCourse(createCourseDto: CreateCourseDto, instructorId: Types.ObjectId, lang: 'en' | 'ar' = 'en') {
  lang=['en','ar'].includes(lang)?lang:'en';

  const user = await this.userService.getCurrentUserDocument(instructorId, lang);
  if (!user) {
    const message = lang === 'ar' ? '  المستخدم غير موجود' : 'User not found';
    throw new NotFoundException(message);
  }

  try {
    const newCourse = await this.courseModel.create({
      ...createCourseDto,
      instructorName: user.userName,
      instructorId: instructorId,
      title: {
        en: createCourseDto.title.en.toLowerCase(),
        ar: createCourseDto.title.ar.toLowerCase(),
      },
      description: {
        en: createCourseDto.description.en.toLowerCase(),
        ar: createCourseDto.description.ar.toLowerCase(),
      },
      category: {
        en: createCourseDto.category.en.toLowerCase(),
        ar: createCourseDto.category.ar.toLowerCase(),
      },
      welcomeMessage: {
        en: createCourseDto.welcomeMessage.en.toLowerCase(),
        ar: createCourseDto.welcomeMessage.ar.toLowerCase(),
      },
      subtitle: {
        en: createCourseDto.subtitle.en.toLowerCase(),
        ar: createCourseDto.subtitle.ar.toLowerCase(),
      },
      level: {
        en: createCourseDto.level.en.toLowerCase(),
        ar: createCourseDto.level.ar.toLowerCase(),
      },
    });

    user.enrolledCourses.push(newCourse._id);
    await user.save();

    return newCourse;
  } catch (error) {
    const message = lang === 'ar' ? ' حدث خطأ أثناء إنشاء الدورة' : 'An error occurred while creating the course';
    throw new InternalServerErrorException(message);
  }
}
//============================================================================
public async AddLectureToCourse(idCourse: Types.ObjectId, lectureDto: LectureDTO,lang: 'en' | 'ar' = 'en') {
  lang=['en','ar'].includes(lang)?lang:'en';

  try {
    const lecture = await this.lectureModel.create({
      ...lectureDto,
      title: {
        en: lectureDto.title.en.toLowerCase(),
        ar: lectureDto.title.ar.toLowerCase(),
      },
    });

    const course = await this.courseModel.findById(idCourse);
    if (!course) {
      const message = lang === 'ar' ? 'الكورس غير موجود' : 'Course not found';
      throw new NotFoundException(message);
    }

    course.curriculum.push(lecture._id);
    const updatedCourse = await course.save();
    return updatedCourse;
  } catch (error) {
    const message = lang === 'ar' ? 'حدث خطأ أثناء إضافة المحاضرة' : 'An error occurred while adding the lecture';
    throw new InternalServerErrorException(message);
  }
}
//============================================================================
public async getAllCourses(
  category?: string,
  level?: string,
  primaryLanguage?: string,
  sortBy: string = 'price-lowtohigh',
  page: number = 1,
  limit: number = 10,
  useFilter: boolean = false,
  lang: 'en' | 'ar' = 'en',
  user?: any // Add user parameter
): Promise<{ totalCourses: number; totalPages: number; currentPage: number; courses: any[] }> {
  lang = ['en', 'ar'].includes(lang) ? lang : 'en';

  // Base filters
  const baseFilters = {
    ...(category ? { [`category.${lang}`]: { $regex: category, $options: 'i' } } : {}),
    ...(level ? { level: { $regex: level, $options: 'i' } } : {}),
    ...(primaryLanguage ? { primaryLanguage: { $regex: primaryLanguage, $options: 'i' } } : {}),
  };

  // Role-based filters
  let roleFilter = {};
  if (user) {
    switch (user.userType) {
      case UserRole.ADMIN:
        // Admin sees all courses
        break;
        
      case UserRole.TEACHER:
        // Teacher sees only their own courses
        roleFilter = { instructorId: new Types.ObjectId(user.id) };
        break;
        
      case UserRole.STUDENT:
        // Student sees only enrolled courses
        const student = await this.studentModel.findOne({ userId: new Types.ObjectId(user.id) });
        if (student) {
          const enrolledCourseIds = student.courses.flatMap(c => c.idCourses);
          roleFilter = { _id: { $in: enrolledCourseIds } };
        } else {
          roleFilter = { _id: { $in: [] } }; // No courses if student not found
        }
        break;
        
      default:
        // Unauthenticated/other roles see all courses
    }
  }

  // Combine filters
  const finalFilter = {
    ...(useFilter ? baseFilters : {}),
    ...roleFilter
  };

  // Sorting logic
  let sortParam = {};
  switch (sortBy) {
    case 'price-lowtohigh': sortParam = { pricing: 1 }; break;
    case 'price-hightolow': sortParam = { pricing: -1 }; break;
    case 'title-atoz': sortParam = { [`title.${lang}`]: 1 }; break;
    case 'title-ztoa': sortParam = { [`title.${lang}`]: -1 }; break;
    default: sortParam = { pricing: 1 };
  }

  const skip = (page - 1) * limit;
  const totalCourses = await this.courseModel.countDocuments(finalFilter);
  const courses = await this.courseModel.find(finalFilter)
    .sort(sortParam)
    .skip(skip)
    .limit(limit)
    .exec();

  // Localize courses
  const localizedCourses = courses.map(course => ({
    ...course.toObject(),
    title: course.title[lang] || '',
    category: course.category[lang] || '',
    description: course.description[lang] || '',
    welcomeMessage: course.welcomeMessage[lang] || '',
    subtitle: course.subtitle?.[lang] || '',
    level: course.level?.[lang] || '',
  }));

  return {
    totalCourses,
    totalPages: Math.ceil(totalCourses / limit),
    currentPage: page,
    courses: localizedCourses,
  };
}
//============================================================================
public async getCourseDetailsByID(id: Types.ObjectId, lang: 'en' | 'ar' = 'en') {
  const courseDetails = await this.courseModel.findById(id).populate('curriculum') as any;
  lang=['en','ar'].includes(lang)?lang:'en';
  if (!courseDetails) {
    const message = lang === 'ar' ? 'الكورس غير موجود' : 'Course not found';
    throw new NotFoundException(message);
  }

  const localizedCourse = {
    _id: courseDetails._id,
    instructorId: courseDetails.instructorId,
    instructorName: courseDetails.instructorName,
    title: courseDetails.title?.[lang]||'',
    category: courseDetails.category?.[lang]||'',
    level: courseDetails.level?.[lang]||'',
    image: courseDetails.image,
    subtitle: courseDetails.subtitle?.[lang]||'',
    primaryLanguage: courseDetails.primaryLanguage,
    description: courseDetails.description?.[lang]||'',
    welcomeMessage: courseDetails.welcomeMessage?.[lang]||'',
    objectives: Array.isArray(courseDetails.objectives)
      ? courseDetails.objectives.map((obj: any) => obj?.[lang]||'')
      : [],
    pricing: courseDetails.pricing,
    curriculum: courseDetails.curriculum,
    students: courseDetails.students,
    isPublished: courseDetails.isPublished,
  };

  return localizedCourse;
}
//============================================================================
public async updateCourseByID(id: Types.ObjectId, updateCourseDto: UpdateCourseDto, instructorId: Types.ObjectId, lang: 'en' | 'ar' = 'en') {
  lang=['en','ar'].includes(lang)?lang:'en';

  const course = await this.courseModel.findById(id);
  if (!course) {
    const message = lang === 'ar' ? 'الكورس غير موجود' : 'Course not found';
    throw new NotFoundException(message);
  }

  if (course.instructorId.toString() !== instructorId.toString()) {
    const message = lang === 'ar' ? 'لست مخولًا لتحديث هذه الدورة' : 'You are not authorized to update this course';
    throw new UnauthorizedException(message);
  }

  try {
    const updatedCourse = await this.courseModel.findByIdAndUpdate(
      id,
      {
        ...updateCourseDto,
        title: {
          en: updateCourseDto.title?.en?.toLowerCase() ?? course.title.en,
          ar: updateCourseDto.title?.ar?.toLowerCase() ?? course.title.ar,
        },
        description: {
          en: updateCourseDto.description?.en?.toLowerCase() ?? course.description.en,
          ar: updateCourseDto.description?.ar?.toLowerCase() ?? course.description.ar,
        },
        category: {
          en: updateCourseDto.category?.en?.toLowerCase() ?? course.category.en,
          ar: updateCourseDto.category?.ar?.toLowerCase() ?? course.category.ar,
        },
        welcomeMessage: {
          en: updateCourseDto.welcomeMessage?.en?.toLowerCase() ?? course.welcomeMessage.en,
          ar: updateCourseDto.welcomeMessage?.ar?.toLowerCase() ?? course.welcomeMessage.ar,
        },
        subtitle: {
          en: updateCourseDto.subtitle?.en?.toLowerCase() ?? course.subtitle.en,
          ar: updateCourseDto.subtitle?.ar?.toLowerCase() ?? course.subtitle.ar,
        },
      },
      { new: true },
    );

    if (!updatedCourse) {
      const message = lang === 'ar' ? 'فشل في تحديث الدورة' : 'Failed to update the course';
      throw new NotFoundException(message);
    }

    return updatedCourse;
  } catch (error) {
    const message = lang === 'ar' ? 'حدث خطأ أثناء تحديث الدورة' : 'An error occurred while updating the course';
    throw new InternalServerErrorException(message);
  }
}
//============================================================================
public async updateCourseJustFieldStudent(order: HydratedDocument<Order>, lang: 'en' | 'ar' = 'en') {
  lang=['en','ar'].includes(lang)?lang:'en';

  const course = await this.getCourseDetailsByID(order.courseId, lang);
  const user = await this.userService.getCurrentUserDocument(order.userId, lang);

  if (!course) {
    const message = lang === 'ar' ? 'الكورس غير موجود' : 'Course not found';
    throw new NotFoundException(message);
  }

  if (!user) {
    const message = lang === 'ar' ? 'المستخدم غير موجود' : 'User not found';
    throw new NotFoundException(message);
  }

  course.students.push(user._id);

  // لازم تحفظ التغييرات لو الكورس كائن من Mongoose
  await this.courseModel.findByIdAndUpdate(order.courseId, { students: course.students });
}
//============================================================================
public async deleteCourse(courseId: Types.ObjectId,  lang: 'en' | 'ar' = 'en') {
  lang=['en','ar'].includes(lang)?lang:'en';

  try {
    const course = await this.courseModel.findById(courseId);
    if (!course) {
      const message = lang === 'ar' ? 'الكورس غير موجود' : 'Course not found';
      throw new NotFoundException(message);
    }

    await course.deleteOne();

    const message = lang === 'ar' ? 'تم حذف الدورة بنجاح' : 'Course deleted successfully';
    return {
      success: true,
      message: message,
    };
  } catch (error) {
    const message = lang === 'ar' ? 'فشل في حذف الدورة' : 'Failed to delete course';
    throw new InternalServerErrorException(message);
  }
}
//============================================================================
}
