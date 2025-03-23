
/**
 * This file contains the integration with facenet for improved face recognition
 * 
 * Facenet uses embeddings (128-dimensional vectors) to represent faces.
 * Similar faces have embeddings that are close to each other in vector space.
 * 
 * This approach provides more accurate recognition than our current implementation.
 */

import { supabase } from '@/integrations/supabase/client';
import { Builder } from '@/components/BuilderCard';
import { FaceRegistrationResult } from './types';
import { 
  detectFaces, 
  generateEmbedding, 
  storeFaceEmbedding, 
  findClosestMatch, 
  calculateEuclideanDistance 
} from './browser-facenet';

// Database table to store face embeddings
const FACE_EMBEDDINGS_TABLE = 'face_embeddings';

/**
 * Process an image for face registration
 * This handles face detection, alignment, and embedding generation
 */
export const processFaceForRegistration = async (
  imageData: string
): Promise<{ 
  success: boolean; 
  embedding?: number[]; 
  error?: string;
  faceImageData?: string;
}> => {
  try {
    // Step 1: Detect faces in the image
    const faces = await detectFaces(imageData);
    
    if (!faces || faces.length === 0) {
      return { success: false, error: 'No faces detected in the image' };
    }
    
    if (faces.length > 1) {
      return { success: false, error: 'Multiple faces detected. Please capture only one face.' };
    }
    
    // Step 2: Extract face and generate embedding
    // For simplicity, we're using the whole image here
    // In a production system, you'd crop the face based on detection box
    const embedding = await generateEmbedding(imageData);
    
    if (!embedding) {
      return { success: false, error: 'Failed to generate face embedding' };
    }
    
    return { 
      success: true, 
      embedding,
      faceImageData: imageData 
    };
  } catch (error) {
    console.error('Error processing face for registration:', error);
    return { success: false, error: 'Error processing face' };
  }
};

/**
 * Register a face with the system
 */
export const registerFace = async (
  studentId: string,
  imageData: string
): Promise<FaceRegistrationResult> => {
  try {
    // Process the face image and get embedding
    const result = await processFaceForRegistration(imageData);
    
    if (!result.success || !result.embedding) {
      return { success: false, message: result.error || 'Face processing failed' };
    }
    
    // Store the embedding in the database
    const stored = await storeFaceEmbedding(
      studentId, 
      result.embedding,
      result.faceImageData
    );
    
    if (!stored) {
      return { success: false, message: 'Failed to store face embedding' };
    }
    
    return { success: true, message: 'Face registered successfully' };
  } catch (error) {
    console.error('Error registering face:', error);
    return { success: false, message: 'Error during face registration' };
  }
};

/**
 * Recognize a face from an image
 */
export const recognizeFace = async (
  imageData: string,
  threshold = 0.75
): Promise<{ success: boolean; builder?: Builder; message: string }> => {
  try {
    // Process the image to get face embedding
    const result = await processFaceForRegistration(imageData);
    
    if (!result.success || !result.embedding) {
      return { success: false, message: result.error || 'Face processing failed' };
    }
    
    // Find the closest match
    const match = await findClosestMatch(result.embedding, threshold);
    
    if (!match) {
      return { success: false, message: 'No matching face found' };
    }
    
    return { success: true, builder: match, message: 'Face successfully recognized' };
  } catch (error) {
    console.error('Error recognizing face:', error);
    return { success: false, message: 'Error during face recognition' };
  }
};

// Re-export functions from browser-facenet
export { 
  detectFaces,
  generateEmbedding,
  storeFaceEmbedding,
  findClosestMatch,
  calculateEuclideanDistance 
};
