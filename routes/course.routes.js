import express from "express";
import {
  addLectureByCourseId,
  createCourse,
  deleteCourseById,
  getAllCourses,
  getLecturesByCourseId,
  updateCourseById,
} from "../controllers/course.controller.js";
import { authorizeRoles, authorizeSubscribers, isLoggedIn } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

router.post(
  "/create-course",
  isLoggedIn,
  authorizeRoles("ADMIN"),
  upload.single("thumbnail"),
  createCourse
);
router.get("/get-all-courses", getAllCourses);
router.get(
  "/get-lectureby-courseid/:courseId",
  isLoggedIn,
  authorizeSubscribers,
  getLecturesByCourseId
);
router.put(
  "/update-course-byid/:courseId",
  isLoggedIn,
  authorizeRoles("ADMIN"),
  updateCourseById
);
router.delete(
  "/delete-course-byid/:courseId",
  isLoggedIn,
  authorizeRoles("ADMIN"),
  deleteCourseById
);

router.post(
  "/addlectures-by-courseid/:courseId",
  isLoggedIn,
  authorizeRoles("ADMIN"),
  upload.single("lecture"),
  addLectureByCourseId
);

export default router;
