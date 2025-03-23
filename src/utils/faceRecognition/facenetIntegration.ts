
/**
 * This file will contain the integration with facenet for improved face recognition
 * 
 * Facenet uses embeddings (128-dimensional vectors) to represent faces.
 * Similar faces have embeddings that are close to each other in vector space.
 * 
 * This approach will provide more accurate recognition than our current implementation.
 */

import { supabase } from '@/integrations/supabase/client';
import { Builder } from '@/components/BuilderCard';
import { FaceRegistrationResult } from './types';

// Database table to store face embeddings
const FACE_EMBEDDINGS_TABLE = 'face_embeddings';

/**
 * Store a face embedding in the database
 * This will be called during face registration
 */
export const storeFaceEmbedding = async (
  studentId: string,
  embedding: number[],
  imageData?: string
): Promise<boolean> => {
  try {
    console.log(`Storing face embedding for student ${studentId}`);
    
    const { error } = await supabase
      .from(FACE_EMBEDDINGS_TABLE)
      .insert({
        student_id: studentId,
        embedding,
        image_data: imageData,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error storing face embedding:', error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Exception during embedding storage:', e);
    return false;
  }
};

/**
 * Find the closest matching face from stored embeddings
 * This will be used during face recognition
 */
export const findClosestMatch = async (
  embedding: number[],
  threshold = 0.75
): Promise<Builder | null> => {
  try {
    console.log('Finding closest match for face embedding');
    
    // First, get all stored embeddings
    const { data: embeddings, error } = await supabase
      .from(FACE_EMBEDDINGS_TABLE)
      .select('*, students(id, first_name, last_name, student_id, image_url)');
      
    if (error || !embeddings || embeddings.length === 0) {
      console.error('Error fetching embeddings:', error);
      return null;
    }
    
    // Find the closest match
    let closestDistance = Infinity;
    let closestStudent = null;
    
    for (const record of embeddings) {
      const distance = calculateEuclideanDistance(embedding, record.embedding);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestStudent = record.students;
      }
    }
    
    // If the closest distance is below threshold, we have a match
    if (closestDistance <= threshold && closestStudent) {
      console.log(`Found match with distance ${closestDistance} for student ${closestStudent.id}`);
      
      // Format time for display
      const timeRecorded = new Date().toLocaleTimeString();
      
      // Record attendance (would implement this function)
      // await recordAttendance(closestStudent.id);
      
      // Convert to Builder format
      const builder: Builder = {
        id: closestStudent.id,
        name: `${closestStudent.first_name} ${closestStudent.last_name}`,
        builderId: closestStudent.student_id || '',
        status: 'present',
        timeRecorded,
        image: closestStudent.image_url || `https://ui-avatars.com/api/?name=${closestStudent.first_name}+${closestStudent.last_name}&background=random`
      };
      
      return builder;
    }
    
    console.log(`No match found (closest distance: ${closestDistance})`);
    return null;
  } catch (e) {
    console.error('Exception during match finding:', e);
    return null;
  }
};

/**
 * Calculate Euclidean distance between two embeddings
 */
export const calculateEuclideanDistance = (
  embedding1: number[],
  embedding2: number[]
): number => {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimensions');
  }
  
  let sum = 0;
  for (let i = 0; i < embedding1.length; i++) {
    const diff = embedding1[i] - embedding2[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
};

/**
 * In the future, we will need to:
 * 1. Install a facenet implementation like '@facenet/facenet-node' or similar
 * 2. Implement face alignment and cropping (crucial for good results)
 * 3. Generate embeddings for captured faces
 * 4. Store and compare embeddings for recognition
 */
