
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
  calculateEuclideanDistance,
  initModels
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
    console.log('Processing face for registration...');
    
    // Ensure models are initialized first
    const modelsInitialized = await initModels();
    if (!modelsInitialized) {
      console.error('Face models failed to initialize during registration');
      return { success: false, error: 'Face recognition models failed to load. Please try again.' };
    }
    
    // Step 1: Detect faces in the image
    const faces = await detectFaces(imageData);
    
    if (!faces || faces.length === 0) {
      console.error('No faces detected during registration');
      return { success: false, error: 'No faces detected in the image' };
    }
    
    if (faces.length > 1) {
      console.error('Multiple faces detected during registration');
      return { success: false, error: 'Multiple faces detected. Please capture only one face.' };
    }
    
    console.log('Face detected, generating embedding...');
    
    // Step 2: Extract face and generate embedding
    // For simplicity, we're using the whole image here
    // In a production system, you'd crop the face based on detection box
    const embedding = await generateEmbedding(imageData);
    
    if (!embedding) {
      console.error('Failed to generate embedding');
      return { success: false, error: 'Failed to generate face embedding' };
    }
    
    console.log(`Embedding generated successfully with length: ${embedding.length}`);
    console.log('Embedding sample:', embedding.slice(0, 5));
    
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
    console.log(`Registering face for student ${studentId}...`);
    
    // Process the face image and get embedding
    const result = await processFaceForRegistration(imageData);
    
    if (!result.success || !result.embedding) {
      console.error('Face processing failed:', result.error);
      return { success: false, message: result.error || 'Face processing failed' };
    }
    
    // DEBUGGING: Log the embedding being generated
    console.log(`Generated embedding for student ${studentId}, length: ${result.embedding.length}`);
    console.log('Embedding sample:', result.embedding.slice(0, 5));
    
    // Store the embedding in the database
    const stored = await storeFaceEmbedding(
      studentId, 
      result.embedding,
      result.faceImageData
    );
    
    if (!stored) {
      console.error('Failed to store face embedding - check Supabase console for errors');
      return { success: false, message: 'Failed to store face embedding' };
    }
    
    console.log('Face registered successfully');
    
    // Let's verify that the embedding was actually stored
    await verifyEmbeddingStorage(studentId);
    
    return { 
      success: true, 
      message: 'Face registered successfully',
      completed: true,
      faceDetected: true
    };
  } catch (error) {
    console.error('Error registering face:', error);
    return { success: false, message: 'Error during face registration' };
  }
};

/**
 * Verify that an embedding was properly stored
 */
const verifyEmbeddingStorage = async (studentId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(FACE_EMBEDDINGS_TABLE)
      .select('*')
      .eq('student_id', studentId);
      
    if (error) {
      console.error('Error verifying embedding storage:', error);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.error('No embeddings found for student after storage attempt');
      return false;
    }
    
    console.log(`Verified ${data.length} embeddings stored for student ${studentId}`);
    return true;
  } catch (e) {
    console.error('Exception during storage verification:', e);
    return false;
  }
};

/**
 * Test database connection
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Test face_embeddings table
    const testEmbedding = Array(128).fill(0.1); // Create dummy embedding
    const { error: embeddingError } = await supabase
      .from('face_embeddings')
      .insert({
        student_id: '00000000-0000-0000-0000-000000000000', // Test ID
        embedding: testEmbedding,
        created_at: new Date().toISOString()
      });
      
    if (embeddingError) {
      console.error('Error inserting test embedding:', embeddingError);
      return false;
    }
    
    console.log('Test embedding inserted successfully');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

/**
 * Recognize a face from an image
 */
export const recognizeFace = async (
  imageData: string,
  threshold = 0.65 // Using lower threshold for more permissive matching
): Promise<{ success: boolean; builder?: Builder; message: string }> => {
  try {
    console.log('Starting face recognition with threshold:', threshold);
    
    // Ensure models are initialized first
    const modelsInitialized = await initModels();
    if (!modelsInitialized) {
      console.error('Face models failed to initialize during recognition');
      return { success: false, message: 'Face recognition models failed to load. Please try again.' };
    }
    
    // Process the image to get face embedding
    const result = await processFaceForRegistration(imageData);
    
    if (!result.success || !result.embedding) {
      console.error('Face processing failed during recognition:', result.error);
      return { success: false, message: result.error || 'Face processing failed' };
    }
    
    console.log('Face embedding generated, finding closest match...');
    
    // Find the closest match
    const match = await findClosestMatch(result.embedding, threshold);
    
    if (!match) {
      console.warn('No matching face found with threshold:', threshold);
      return { success: false, message: 'No matching face found. Please try again or register your face.' };
    }
    
    console.log('Face successfully matched to:', match.name);
    return { success: true, builder: match, message: 'Face successfully recognized' };
  } catch (error) {
    console.error('Error recognizing face:', error);
    return { success: false, message: 'Error during face recognition' };
  }
};

/**
 * Set up a complete test for face registration flow
 */
export const testRegistrationFlow = async (studentId: string, imageData: string): Promise<boolean> => {
  console.group('Registration Flow Test');
  
  try {
    // Step 1: Test model initialization
    console.log('1. Testing model initialization...');
    const modelsInitialized = await initModels();
    console.log('Models initialized:', modelsInitialized);
    
    if (!modelsInitialized) {
      console.error('Model initialization failed');
      console.groupEnd();
      return false;
    }
    
    // Step 2: Test face detection
    console.log('2. Testing face detection...');
    const facesResult = await detectFaces(imageData);
    console.log('Face detection result:', facesResult);
    
    if (!facesResult || facesResult.length === 0) {
      console.error('Face detection failed');
      console.groupEnd();
      return false;
    }
    
    // Step 3: Test embedding generation
    console.log('3. Testing embedding generation...');
    const embedding = await generateEmbedding(imageData);
    console.log('Embedding generated:', embedding ? 'Yes (length: ' + embedding.length + ')' : 'No');
    
    if (!embedding) {
      console.error('Embedding generation failed');
      console.groupEnd();
      return false;
    }
    
    // Step 4: Test database insertion
    console.log('4. Testing database insertion...');
    const stored = await storeFaceEmbedding(studentId, embedding, imageData);
    console.log('Database insertion result:', stored);
    
    console.groupEnd();
    return stored;
  } catch (error) {
    console.error('Registration flow test error:', error);
    console.groupEnd();
    return false;
  }
};

/**
 * A simplified recognition test for debugging
 */
export const testSimpleRecognition = async (): Promise<Builder | null> => {
  try {
    // Bypass the complex recognition process for testing
    // 1. Get all students with face data
    const { data: students } = await supabase
      .from('students')
      .select('id, first_name, last_name, student_id, image_url')
      .not('image_url', 'is', null);
      
    if (!students || students.length === 0) {
      console.log('No students with face data found');
      return null;
    }
    
    // 2. Pick the first student for testing
    const student = students[0];
    console.log('Using student for test recognition:', student.first_name, student.last_name);
    
    // 3. Create a builder object
    return {
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      builderId: student.student_id || '',
      status: 'present',
      timeRecorded: new Date().toLocaleTimeString(),
      image: student.image_url
    };
  } catch (error) {
    console.error('Test simple recognition error:', error);
    return null;
  }
};

// Re-export functions from browser-facenet
export { 
  detectFaces,
  generateEmbedding,
  storeFaceEmbedding,
  findClosestMatch,
  calculateEuclideanDistance,
  initModels
};
