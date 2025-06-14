import { forwardRef, Inject, Injectable, InternalServerErrorException, NotFoundException, Req, UnauthorizedException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { Course } from './Schemas/course.schema';
import { UserService } from 'src/user/user.service';
import { LectureDTO } from './dto/lecture-course.dto';
import { Lecture } from './Schemas/lecture.schema';
import { Order } from 'src/order/schema/order.schema';
import { Request } from 'express';


@Injectable()
export class CourseService {

    constructor(@InjectModel(Course.name)private readonly courseModel: Model<Course>,
    @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
    @InjectModel(Lecture.name) private readonly lectureModel:Model<Lecture>
    
) {}
    /**
     * Create a new course
     * @param createCourseDto data for creating a course
     * @param instructorId id fo logged in user
     * @returns the created Course from database 
     */
    public async AddNewCourse(createCourseDto: CreateCourseDto, instructorId: Types.ObjectId,req: Request) {
        const user = await this.userService.getCurrentUserDocument(instructorId,req);
        if (!user) {
const lang = (req.headers['lang'] === 'ar' || req.headers['language'] === 'ar') ? 'ar' : 'en';
          const message = lang === 'ar' ? 'المستخدم غير موجود' : 'User not found';
          throw new NotFoundException(message);
        }
      
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
          level:{
            en: createCourseDto.level.en.toLowerCase(),
            ar: createCourseDto.level.ar.toLowerCase(),
          },
        });
      
        user.enrolledCourses.push(newCourse._id);
        await user.save();
      
        return newCourse;
      }

/**
 * Add Lecture To course
 * @param idCourse of course 
 * @param lectureDto 
 * @returns the created Lecture from database  
 */
public async AddLectureToCourse(idCourse: Types.ObjectId, lectureDto: LectureDTO,req: Request) {
    const lecture = await this.lectureModel.create({
      ...lectureDto,
      title: {
        en: lectureDto.title.en.toLowerCase(),
        ar: lectureDto.title.ar.toLowerCase(),
      },
    });
  
    const course = await this.courseModel.findById(idCourse);
    if (!course) {
const lang = (req.headers['lang'] === 'ar' || req.headers['language'] === 'ar') ? 'ar' : 'en';
          const message = lang === 'ar' ? 'الكورس غير موجود' : 'Course not found';
      throw new NotFoundException(message);
    }
  
    course.curriculum.push(lecture._id);
    const updatedCourse = await course.save();
    return updatedCourse;
  }
    /**
/**
 * Get All Courses from database depending on filters, pagination and sorting
 * @param category - Optional, category of the course to filter by
 * @param level - Optional, level of the course to filter by
 * @param primaryLanguage - Optional, primary language of the course to filter by
 * @param sortBy - Optional, defines how the courses should be sorted ('price-lowtohigh', 'price-hightolow', 'title-atoz', 'title-ztoa')
 * @param page - Optional, page number for pagination
 * @param limit - Optional, number of items per page for pagination
 * @returns Collection of courses with pagination
 */
/**
 * Get All Courses from database depending on filters, pagination, and sorting
 * @param category - Optional, category of the course to filter by
 * @param level - Optional, level of the course to filter by
 * @param primaryLanguage - Optional, primary language of the course to filter by
 * @param sortBy - Optional, defines how the courses should be sorted ('price-lowtohigh', 'price-hightolow', 'title-atoz', 'title-ztoa')
 * @param page - Optional, page number for pagination
 * @param limit - Optional, number of items per page for pagination
 * @returns Collection of courses with pagination details
 */
public async getAllCourses(
    category?: string,
    level?: string,
    primaryLanguage?: string,
    sortBy: string = 'price-lowtohigh',
    page: number = 1,
    limit: number = 10,
    useFilter: boolean = false,
    lang: 'en' | 'ar' = 'en' //  اللغة المختارة
  ): Promise<{ totalCourses: number, totalPages: number, currentPage: number, courses: any[] }> {
    
    const filters = {
      ...(category ? { [`category.${lang}`]: { $regex: category, $options: 'i' } } : {}),
      ...(level ? { level: { $regex: level, $options: 'i' } } : {}),
      ...(primaryLanguage ? { primaryLanguage: { $regex: primaryLanguage, $options: 'i' } } : {}),
    };
  
    let sortParam = {};
    switch (sortBy) {
      case 'price-lowtohigh':
        sortParam = { pricing: 1 };
        break;
      case 'price-hightolow':
        sortParam = { pricing: -1 };
        break;
      case 'title-atoz':
        sortParam = { [`title.${lang}`]: 1 };
        break;
      case 'title-ztoa':
        sortParam = { [`title.${lang}`]: -1 };
        break;
      default:
        sortParam = { pricing: 1 };
    }
  
    const skip = (page - 1) * limit;
  
    let coursesQuery = this.courseModel.find(useFilter ? filters : {}).sort(sortParam).skip(skip).limit(limit);
    const totalCourses = await this.courseModel.countDocuments(useFilter ? filters : {});
    const courses = await coursesQuery.exec();
  
    //  إرجاع فقط الحقول باللغة المطلوبة
    const localizedCourses = courses.map(course => ({
      ...course.toObject(),
      title: course.title[lang],
      category: course.category[lang],
      description: course.description[lang],
      welcomeMessage: course.welcomeMessage[lang],
    }));
  
    return {
      totalCourses,
      totalPages: Math.ceil(totalCourses / limit),
      currentPage: page,
      courses: localizedCourses
    };
  }

/**
 * Get Course Details By ID
 * @param id - ID of the course
 * @returns Details of course
 */
public async getCourseDetailsByID(id: Types.ObjectId,lang: 'en' | 'ar' = 'en',) {
    const courseDetails = await this.courseModel.findById(id).populate('curriculum') as any;
    
  
    if (!courseDetails) {
      
      throw new NotFoundException('Course not found');
    }
  
    // استخراج البيانات حسب اللغة
    const localizedCourse = {
      _id: courseDetails._id,
      instructorId: courseDetails.instructorId,
      instructorName: courseDetails.instructorName,
      title: courseDetails.title?.[lang],
      category: courseDetails.category[lang],
      level: courseDetails.level,
      image:courseDetails.image,
      subtitle:courseDetails.subtitle,
      primaryLanguage:courseDetails.primaryLanguage,
      description: courseDetails.description?.[lang],
      welcomeMessage: courseDetails.welcomeMessage?.[lang],
      objectives: Array.isArray(courseDetails.objectives)
  ? courseDetails.objectives.map((obj: any) => obj?.[lang])
  : [],
      pricing: courseDetails.pricing,
      curriculum: courseDetails.curriculum,
      students:courseDetails.students,
      isPublished: courseDetails.isPublished,
    };
  
    return localizedCourse;
  }
    /**
     * update course By Id
     * @param id of course
     * @param updateCourseDto data of course for updating 
     * @param instructorId id of instructore of course
     * @returns updating course
     */
    public async updateCourseByID(id:Types.ObjectId, updateCourseDto:UpdateCourseDto,instructorId:Types.ObjectId,req:Request){
      const lang = (req.headers['lang'] === 'ar' || req.headers['language'] === 'ar') ? 'ar' : 'en';
        const course = await this.courseModel.findById(id);
        if(!course){
          const message = lang === 'ar' ? 'الكورس غير موجود' : 'Course not found';
          throw new NotFoundException(message);}
        if(course.instructorId.toString() !== instructorId.toString()){
          const message = lang === 'ar' ? 'لست مخولًا لتحديث هذه الدورة' : 'You are not authorized to update this course';
           throw new UnauthorizedException(message);
          }

        const updatedCourse = await this.courseModel.findByIdAndUpdate(id,{
            ...updateCourseDto,
            title:{
                en: updateCourseDto.title.en.toLowerCase() ?? course.title.en,
                ar: updateCourseDto.title.ar.toLowerCase() ?? course.title.ar,
              },
              description: {
                en: updateCourseDto.description.en.toLowerCase() ?? course.description.en,
                ar: updateCourseDto.description.ar.toLowerCase() ?? course.description.ar,
              },
              category:{
                en: updateCourseDto.category.en.toLowerCase() ?? course.category.en,
                ar: updateCourseDto.category.ar.toLowerCase() ?? course.category.ar,
              },
              welcomeMessage:
              {
                en: updateCourseDto.welcomeMessage.en.toLowerCase() ?? course.welcomeMessage.en,
                ar: updateCourseDto.welcomeMessage.ar.toLowerCase() ?? course.welcomeMessage.ar,
              },
            subtitle:{
                en: updateCourseDto.subtitle.en.toLowerCase() ?? course.welcomeMessage.en,
                ar: updateCourseDto.subtitle.ar.toLowerCase() ?? course.welcomeMessage.ar,
              },
        },{new:true});
        if (!updatedCourse) {
const lang = (req.headers['lang'] === 'ar' || req.headers['language'] === 'ar') ? 'ar' : 'en';
          const message = lang === 'ar' ? 'فشل في تحديث الدورة' : 'Failed to update the course';
            throw new NotFoundException(message);
        }
        return updatedCourse;
    }
    public async updateCourseJustFieldStudent(order:HydratedDocument<Order>,req:Request){
        const course = await this.getCourseDetailsByID(order.courseId);
        const user = await this.userService.getCurrentUserDocument(order.userId,req);
        course.students.push(user._id);
        
    }
// delete course
    public async deleteCourse(courseId: Types.ObjectId,req:Request) {
      const lang = (req.headers['lang'] === 'ar' || req.headers['language'] === 'ar') ? 'ar' : 'en';
        try {
          // const deletedCourse = await this.courseModel.findOneAndDelete({ _id: courseId });
          const course = await this.courseModel.findById(courseId);
            if (!course) {
          const message = lang === 'ar' ? 'الكورس غير موجود' : 'Course not found';
              throw new NotFoundException(message);
            }
            await course.deleteOne(); // 🔥 هذا يفعّل الـ hook
          // if (!deletedCourse) {
          //   throw new NotFoundException('Course not found');
          // }
          const message = lang === 'ar' ? 'تم حذف الدورة بنجاح' : 'Course deleted successfully';
          return { 
            success: true, message: message };
        } catch (error) {
          const message = lang === 'ar' ? 'فشل في حذف الدورة' : 'Failed to delete course';
          throw new InternalServerErrorException(message);
        }
      }
}
