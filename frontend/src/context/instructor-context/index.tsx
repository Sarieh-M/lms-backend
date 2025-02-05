import {
  courseCurriculumInitialFormData,
  courseLandingInitialFormData,
} from "@/config";
import { IChildren } from "@/interfaces";
import { createContext, useState } from "react";

export const InstructorContext = createContext(null);

export default function InstructorProvider({ children }: IChildren) {
  const [courseLandingFormData, setCourseLandingFormData] = useState(
    courseLandingInitialFormData
  );
  const [courseCurriculumFormData, setCourseCurriculumFormData] = useState(
    courseCurriculumInitialFormData
  );
  const [mediaUploadProgress, setMediaUploadProgress] = useState(false);
  const [mediaUploadProgressPercentage, setMediaUploadProgressPercentage] =
    useState(0);
  const [instructorCoursesList, setInstructorCoursesList] = useState([]);
  const [currentEditedCourseId, setCurrentEditedCourseId] = useState(null);

  return (
    <InstructorContext.Provider
      value={{
        courseLandingFormData,
        setCourseLandingFormData,
        courseCurriculumFormData,
        setCourseCurriculumFormData,
        mediaUploadProgress,
        setMediaUploadProgress,
        mediaUploadProgressPercentage,
        setMediaUploadProgressPercentage,
        instructorCoursesList,
        setInstructorCoursesList,
        currentEditedCourseId,
        setCurrentEditedCourseId,
      }}
    >
      {children}
    </InstructorContext.Provider>
  );
}
