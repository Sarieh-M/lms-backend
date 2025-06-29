import { BadRequestException, forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException, Req, UnauthorizedException } from '@nestjs/common';
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
import { Category, CategoryDocument } from './schemas/category.schema';
import { Level } from './schemas/level.schema';

@Injectable()
export class CourseService {
    constructor(
    @InjectModel(Course.name)private readonly courseModel: Model<Course>,
    @InjectModel(Category.name)private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Level.name)private readonly levelModel: Model<Level>,
    @InjectModel(Student.name) private readonly studentModel: Model<Student>,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @InjectModel(Lecture.name) private readonly lectureModel:Model<Lecture>,) 
    {}
    // Add a new course by instructor
    // Validates instructor, creates course, links course to instructor
    public async AddNewCourse(createCourseDto: CreateCourseDto,instructorId: Types.ObjectId,lang: 'en' | 'ar' = 'en',) {
      lang = ['en', 'ar'].includes(lang) ? lang : 'en';

      const user = await this.userService.getCurrentUserDocument(instructorId, lang);
      if (!user) {
        const message = lang === 'ar' ? 'المستخدم غير موجود' : 'User not found';
        throw new NotFoundException(message);
      }

      const category = await this.categoryModel.findOne({
        $or: [
          { 'title.en': createCourseDto.category },
          { 'title.ar': createCourseDto.category },
        ],
      });

      if (!category) {
        const message = lang === 'ar' ? 'التصنيف غير موجود' : 'Category not found';
        throw new NotFoundException(message);
      }

      const level = await this.levelModel.findOne({
        $or: [
          { 'title.en': createCourseDto.level },
          { 'title.ar': createCourseDto.level },
        ],
      });

      if (!level) {
        const message = lang === 'ar' ? 'المستوى غير موجود' : 'Level not found';
        throw new NotFoundException(message);
      }

      try {
        const lectureIds = [];

        if (createCourseDto.lectures && createCourseDto.lectures.length > 0) {
          for (const lectureDto of createCourseDto.lectures) {
            const lecture = await this.lectureModel.create({
              ...lectureDto,
              title: {
                en: lectureDto.title.en.toLowerCase(),
                ar: lectureDto.title.ar.toLowerCase(),
              },
            });
            lectureIds.push(lecture._id);
          }
        }

        const newCourse = await this.courseModel.create({
          ...createCourseDto,
          instructorName: user.userName,
          instructorId,
          category: category._id,
          level: level._id,
          title: {
            en: createCourseDto.title.en.toLowerCase(),
            ar: createCourseDto.title.ar.toLowerCase(),
          },
          description: {
            en: createCourseDto.description.en.toLowerCase(),
            ar: createCourseDto.description.ar.toLowerCase(),
          },
          welcomeMessage: {
            en: createCourseDto.welcomeMessage.en.toLowerCase(),
            ar: createCourseDto.welcomeMessage.ar.toLowerCase(),
          },
          subtitle: {
            en: createCourseDto.subtitle.en.toLowerCase(),
            ar: createCourseDto.subtitle.ar.toLowerCase(),
          },
          curriculum: lectureIds,
        });

        user.enrolledCourses.push(newCourse._id);
        await user.save();

        return newCourse;
      } catch (error) {
        const message =
          lang === 'ar'
            ? 'حدث خطأ أثناء إنشاء الدورة'
            : 'An error occurred while creating the course';
        throw new InternalServerErrorException(message);
      }
    }
    //============================================================================
    // Get all courses with filters, sorting, pagination, and role-based access
    public async getAllCourses(
      category?: string,
      level?: string,
      primaryLanguage?: string,
      sortBy: string = 'price-lowtohigh',
      page: number = 1,
      limit: number = 10,
      useFilter: boolean = false,
      lang: 'en' | 'ar' = 'en',
      user?: any
    ): Promise<{ totalCourses: number; totalPages: number; currentPage: number; courses: any[] }> {
      lang = ['en', 'ar'].includes(lang) ? lang : 'en';

      // Base filters
      const baseFilters: any = {};
      if (level) baseFilters[`level.${lang}`] = { $regex: level, $options: 'i' };
      if (primaryLanguage) baseFilters.primaryLanguage = { $regex: primaryLanguage, $options: 'i' };
      if (category) baseFilters[`category.${lang}`] = { $regex: category, $options: 'i' };
      
      // Role-based filters
      let roleFilter = {};
      if (user) {
        switch (user.userType) {
          case UserRole.ADMIN:
            break;
          case UserRole.TEACHER:
            roleFilter = { instructorId: new Types.ObjectId(user.id) };
            break;
          case UserRole.STUDENT:
            const student = await this.studentModel.findOne({ userId: new Types.ObjectId(user.id) });
            if (student) {
              const enrolledCourseIds = student.courses.flatMap(c => c.idCourses);
              roleFilter = { _id: { $in: enrolledCourseIds } };
            } else {
              roleFilter = { _id: { $in: [] } };
            }
            break;
        }
      }

      const finalFilter = {
        ...(useFilter ? baseFilters : {}),
        ...roleFilter
      };

      // Sorting
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
        .populate('category', 'title')
        .populate('level', 'title')
        .sort(sortParam)
        .skip(skip)
        .limit(limit)
        .exec();

      const localizedCourses = courses.map(course => {
      return {
        ...course.toObject(),
        title: course.title?.[lang] || '',
        description: course.description?.[lang] || '',
        subtitle: course.subtitle?.[lang] || '',
        welcomeMessage: course.welcomeMessage?.[lang] || '',
        level: {
          en: (course.level as any)?.title?.en || '',
          ar: (course.level as any)?.title?.ar || '',
        },
        category: {
          en: (course.category as any)?.title?.en || '',
          ar: (course.category as any)?.title?.ar || '',
        },
      };
    });

      return {
        totalCourses,
        totalPages: Math.ceil(totalCourses / limit),
        currentPage: page,
        courses: localizedCourses,
      };
    }
    //============================================================================
    // Get course details by ID with localization
    public async getCourseDetailsByID(id: Types.ObjectId, lang: 'en' | 'ar' = 'en') {
      lang = ['en', 'ar'].includes(lang) ? lang : 'en';

      const courseDetails = await this.courseModel
        .findById(id)
        .populate('curriculum')
        .populate('category')
        .populate('level') as any;

      if (!courseDetails) {
        const message = lang === 'ar' ? 'الكورس غير موجود' : 'Course not found';
        throw new NotFoundException(message);
      }

      const localizedCourse = {
        _id: courseDetails._id,
        instructorId: courseDetails.instructorId,
        instructorName: courseDetails.instructorName,
        title: courseDetails.title?.[lang] || '',
        category: (courseDetails.category as any)?.title?.[lang] || '',
        level: (courseDetails.level as any)?.title?.[lang] || '',
        image: courseDetails.image,
        subtitle: courseDetails.subtitle?.[lang] || '',
        primaryLanguage: courseDetails.primaryLanguage,
        description: courseDetails.description?.[lang] || '',
        welcomeMessage: courseDetails.welcomeMessage?.[lang] || '',
        objectives: Array.isArray(courseDetails.objectives)
          ? courseDetails.objectives.map((obj: any) => obj?.[lang] || '')
          : [],
        pricing: courseDetails.pricing,
        curriculum: courseDetails.curriculum,
        students: courseDetails.students,
        isPublished: courseDetails.isPublished,
      };

      return localizedCourse;
    }
    //============================================================================
    // Update course by ID if instructor is authorized
    public async updateCourseByID(id: Types.ObjectId,updateCourseDto: UpdateCourseDto,
      instructorId: Types.ObjectId,lang: 'en' | 'ar' = 'en',) {
  
      lang = ['en', 'ar'].includes(lang) ? lang : 'en';
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
        //==================categories
        if (updateCourseDto.category) {
          const newCategory = await this.categoryModel.findOne({
            $or: [
              { 'title.en': updateCourseDto.category },
              { 'title.ar': updateCourseDto.category },
            ],
          }) as HydratedDocument<Category>;

          if (!newCategory) {
            const message = lang === 'ar' ? 'التصنيف غير موجود' : 'Category not found';
            throw new NotFoundException(message);
          }

          updateCourseDto.category = newCategory._id;
        }
        //==================levels
        if (updateCourseDto.level) {
          const newLevel = await this.levelModel.findOne({
            $or: [
              { 'title.en': updateCourseDto.level },
              { 'title.ar': updateCourseDto.level },
            ],
          }) as HydratedDocument<Level>;

          if (!newLevel) {
            const message = lang === 'ar' ? 'المستوى غير موجود' : 'Level not found';
            throw new NotFoundException(message);
          }

          updateCourseDto.level = newLevel._id as Types.ObjectId;
        }

        //  This one for lecture
        if (updateCourseDto.lectures && updateCourseDto.lectures.length > 0) {
          for (const lectureDto of updateCourseDto.lectures) {
            const newLecture = await this.lectureModel.create({
              ...lectureDto,
              title: {
                en: lectureDto.title.en.toLowerCase(),
                ar: lectureDto.title.ar.toLowerCase(),
              },
            });
            course.curriculum.push(newLecture._id);
          }
          await course.save(); 
        }

        
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
    // Update course students list after purchase
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
    // Delete a course by ID
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
    // Function to extract all unique categories with localization
    async getAllCategories() {
    const categories = await this.categoryModel.find().sort().lean();
    return categories.map((cat)=> ({
    _id: cat._id,
    title: cat.title??'',
    description: cat.description ??'',
    isFeatured: cat.isFeatured ?? false,
    displayOrder: cat.displayOrder ?? 0,
  }));

    }
    // Function to extract all unique levels with localization
    async getAllLevels() {
    const level = await this.levelModel.find().sort().lean();
    return level.map((cat)=> ({
    _id: cat._id,
    title: cat.title??''
  }));

    }
    }
