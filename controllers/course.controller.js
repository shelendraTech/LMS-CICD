import AppError from "../utils/appError.js";
import Course from "../models/course.model.js";
import cloudinary from "cloudinary";
import path from "path";
import fs from "fs/promises";

export const createCourse = async (req, res, next) => {
  try {
    // console.log("Request Body:", req.body);
    // console.log("Request File:", req.file);

    const { title, description, category, createdBy } = req.body;

    if (!title || !description || !category || !createdBy) {
      return next(new AppError("All fields are required", 400));
    }

    const course = await Course.create({
      title,
      description,
      category,
      createdBy,
      thumbnail: {
        public_id: "DUMMY",
        secure_url: "DUMMY",
      },
    });

    //if file send
    if (req.file) {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: "lms",
      });
      course.thumbnail.public_id = result.public_id;
      course.thumbnail.secure_url = result.secure_url;
      fs.rm(`uploads/${req.file.filename}`); // Remove uploaded file
    }

    await course.save();
    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    next(error);
  }
};

export const getAllCourses = async (req, res, next) => {
  try {
    // Find all the courses without lectures
    const courses = await Course.find({}).select("-lectures");
    res.status(200).json({
      success: true,
      message: "All Courses",
      courses,
    });
  } catch (e) {
    return next(new AppError(e.message, 500));
  }
};

export const getLecturesByCourseId = async (req, res, next) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);

  if (!course) {
    return next(new AppError("Invalid course id or course not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Course lectures fetched successfully",
    lectures: course.lectures,
  });
};

export const updateCourseById = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findByIdAndUpdate(
      courseId,
      {
        $set: req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!course) {
      return next(new AppError("Course Does not exist", 400));
    }

    res.status(200).json({
      success: true,
      message: "Course Update Successfully",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message || "Server error", 500));
  }
};

export const deleteCourseById = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
      return next(new AppError("Course with given id does not exist", 400));
    }

    // This is another way to delete
    await Course.findByIdAndDelete(courseId);

    // Remove course
    // await course.remove();

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (e) {
    return next(e.message || "Server error", 500);
  }
};

export const addLectureByCourseId = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const { courseId } = req.params;

    const lectureData = {};

    if (!title || !description) {
      return next(new AppError("Title and description are required", 400));
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return next(new AppError("Invalid course id or course not found", 400));
    }

    // Run only if user sends a file
    if (req.file) {
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms", // Save files in a folder named lms
          chunk_size: 50000000, // 50 mb size
          resource_type: "video",
        });

        if (result) {
          lectureData.public_id = result.public_id;
          lectureData.secure_url = result.secure_url;
        }
        // After successful upload remove the file from local storage
        fs.rm(`uploads/${req.file.filename}`);
      } catch (e) {
        return next(
          new AppError(e.message || "File not uploaded, please try again", 400)
        );
      }
    }

    course.lectures.push({
      title,
      description,
      lecture: lectureData,
    });

    course.numberOfLectures = course.lectures.length;

    await course.save();

    res.status(200).json({
      success: true,
      message: "Course lecture added successfully",
      course,
    });
  } catch (e) {
    return next(new AppError(e.message || "Something false", 400));
  }
};
