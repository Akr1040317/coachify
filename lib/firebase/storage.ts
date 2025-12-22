import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

/**
 * Upload a file to Firebase Storage
 * @param file - The file to upload
 * @param path - Storage path (e.g., "videos/coachId/video.mp4")
 * @returns The download URL of the uploaded file
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  if (!storage) throw new Error("Firebase Storage is not initialized");
  
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

/**
 * Delete a file from Firebase Storage
 * @param path - Storage path of the file to delete
 */
export const deleteFile = async (path: string): Promise<void> => {
  if (!storage) throw new Error("Firebase Storage is not initialized");
  
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

/**
 * Upload a video file
 * @param file - Video file
 * @param coachId - Coach ID
 * @param videoId - Optional video ID (for updates)
 * @returns The download URL
 */
export const uploadVideo = async (file: File, coachId: string, videoId?: string): Promise<string> => {
  const fileName = videoId || `video-${Date.now()}`;
  const path = `videos/${coachId}/${fileName}`;
  return uploadFile(file, path);
};

/**
 * Upload a video thumbnail
 * @param file - Image file
 * @param coachId - Coach ID
 * @param videoId - Video ID
 * @returns The download URL
 */
export const uploadVideoThumbnail = async (file: File, coachId: string, videoId: string): Promise<string> => {
  const path = `videos/${coachId}/${videoId}/thumbnail`;
  return uploadFile(file, path);
};

/**
 * Upload a course thumbnail
 * @param file - Image file
 * @param coachId - Coach ID
 * @param courseId - Course ID
 * @returns The download URL
 */
export const uploadCourseThumbnail = async (file: File, coachId: string, courseId: string): Promise<string> => {
  const path = `courses/${coachId}/${courseId}/thumbnail`;
  return uploadFile(file, path);
};

/**
 * Upload an article cover image
 * @param file - Image file
 * @param coachId - Coach ID
 * @param articleId - Article ID
 * @returns The download URL
 */
export const uploadArticleCover = async (file: File, coachId: string, articleId: string): Promise<string> => {
  const path = `articles/${coachId}/${articleId}/cover`;
  return uploadFile(file, path);
};

