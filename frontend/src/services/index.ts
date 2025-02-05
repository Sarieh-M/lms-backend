import axiosInstance from "@/api/axiosInstance";

export async function registerService(formData: FormData) {
  const { data } = await axiosInstance.post("/auth/register", {
    ...formData,
    role: "user",
  });

  return data;
}

export async function loginService(formData: FormData) {
  const { data } = await axiosInstance.post("/auth/login", formData);

  return data;
}

export async function checkAuthService() {
  const { data } = await axiosInstance.get("/auth/check-auth");

  return data;
}

export async function mediaUploadService(
  formData: FormData,
  onProgressCallback
) {
  const { data } = await axiosInstance.post("/media/upload", formData, {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgressCallback(percentCompleted);
    },
  });

  return data;
}

export async function mediaDeleteService(id: string | number) {
  const { data } = await axiosInstance.delete(`/media/delete/${id}`);

  return data;
}

export async function fetchInstructorCourseListService() {
  const { data } = await axiosInstance.get(`/instructor/course/get`);

  return data;
}

export async function addNewCourseService(formData: FormData) {
  const { data } = await axiosInstance.post(`/instructor/course/add`, formData);

  return data;
}

export async function fetchInstructorCourseDetailsService(id: string | number) {
  const { data } = await axiosInstance.get(
    `/instructor/course/get/details/${id}`
  );

  return data;
}

export async function updateCourseByIdService(
  id: string | number,
  formData: FormData
) {
  const { data } = await axiosInstance.put(
    `/instructor/course/update/${id}`,
    formData
  );

  return data;
}

export async function mediaBulkUploadService(
  formData: FormData,
  onProgressCallback
) {
  const { data } = await axiosInstance.post("/media/bulk-upload", formData, {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgressCallback(percentCompleted);
    },
  });

  return data;
}

export async function fetchStudentViewCourseListService(query: string) {
  const { data } = await axiosInstance.get(`/student/course/get?${query}`);

  return data;
}

export async function fetchStudentViewCourseDetailsService(courseId: string) {
  const { data } = await axiosInstance.get(
    `/student/course/get/details/${courseId}`
  );

  return data;
}

export async function checkCoursePurchaseInfoService(
  courseId: string,
  studentId: string
) {
  const { data } = await axiosInstance.get(
    `/student/course/purchase-info/${courseId}/${studentId}`
  );

  return data;
}

export async function createPaymentService(formData: FormData) {
  const { data } = await axiosInstance.post(`/student/order/create`, formData);

  return data;
}

export async function captureAndFinalizePaymentService(
  paymentId: string,
  payerId: string,
  orderId: string
) {
  const { data } = await axiosInstance.post(`/student/order/capture`, {
    paymentId,
    payerId,
    orderId,
  });

  return data;
}

export async function fetchStudentBoughtCoursesService(studentId: string) {
  const { data } = await axiosInstance.get(
    `/student/courses-bought/get/${studentId}`
  );

  return data;
}

export async function getCurrentCourseProgressService(
  userId: string,
  courseId: string
) {
  const { data } = await axiosInstance.get(
    `/student/course-progress/get/${userId}/${courseId}`
  );

  return data;
}

export async function markLectureAsViewedService(
  userId: string,
  courseId: string,
  lectureId: string
) {
  const { data } = await axiosInstance.post(
    `/student/course-progress/mark-lecture-viewed`,
    {
      userId,
      courseId,
      lectureId,
    }
  );

  return data;
}

export async function resetCourseProgressService(
  userId: string,
  courseId: string
) {
  const { data } = await axiosInstance.post(
    `/student/course-progress/reset-progress`,
    {
      userId,
      courseId,
    }
  );

  return data;
}
