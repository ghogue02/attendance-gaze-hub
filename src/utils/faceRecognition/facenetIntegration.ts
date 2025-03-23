
// Import TensorFlow.js
import * as tf from "@tensorflow/tfjs";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Builder } from "@/components/BuilderCard";

/**
 * Test the registration flow to validate all steps are working
 */
export const testRegistrationFlow = async (
  studentId: string,
  imageData: string
): Promise<boolean> => {
  console.group('Registration Flow Test');
  
  try {
    // Step 1: Test model initialization
    console.log('1. Testing model initialization...');
    const { initModels } = await import('./browser-facenet');
    const modelsInitialized = await initModels();
    console.log('Models initialized:', modelsInitialized);
    
    if (!modelsInitialized) {
      console.error('Model initialization failed');
      console.groupEnd();
      return false;
    }
    
    // Step 2: Test face detection
    console.log('2. Testing face detection...');
    const { detectFaces } = await import('./browser-facenet');
    const facesResult = await detectFaces(imageData);
    console.log('Face detection result:', facesResult);
    
    if (!facesResult || facesResult.length === 0) {
      console.error('Face detection failed');
      console.groupEnd();
      return false;
    }
    
    // Step 3: Test embedding generation
    console.log('3. Testing embedding generation...');
    const { generateEmbedding } = await import('./browser-facenet');
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
    
    // Step 5: Test profile image update
    console.log('5. Testing profile image update...');
    const { updateBuilderAvatar } = await import('./registration/updateAvatar');
    const avatarUpdated = await updateBuilderAvatar(studentId, imageData);
    console.log('Avatar update result:', avatarUpdated);
    
    console.groupEnd();
    return stored && avatarUpdated;
  } catch (error) {
    console.error('Registration flow test error:', error);
    console.groupEnd();
    return false;
  }
};

/**
 * Process a face image for registration
 */
export const processFaceForRegistration = async (
  imageData: string
): Promise<{
  success: boolean;
  embedding?: number[];
  faceImageData?: string;
  error?: string;
}> => {
  try {
    // First, initialize the face recognition models
    const { initModels, detectFaces, generateEmbedding } = await import("./browser-facenet");
    await initModels();
    
    // Next, detect faces in the image
    const faces = await detectFaces(imageData);
    
    // If no face was detected, return error
    if (!faces || faces.length === 0) {
      console.error("No face detected in the image during registration");
      return {
        success: false,
        error: "No face detected. Please ensure your face is clearly visible."
      };
    }
    
    // If multiple faces detected, we'll use the largest face
    if (faces.length > 1) {
      console.warn(`Multiple faces (${faces.length}) detected during registration`);
      // Sort by area (product of width and height)
      faces.sort((a, b) => 
        (b.width * b.height) - (a.width * a.height)
      );
    }
    
    // Generate face embedding for the detected face
    const embedding = await generateEmbedding(imageData);
    
    if (!embedding || embedding.length === 0) {
      return {
        success: false,
        error: "Failed to generate face embedding"
      };
    }
    
    return {
      success: true,
      embedding,
      faceImageData: imageData
    };
  } catch (error) {
    console.error("Error processing face for registration:", error);
    return {
      success: false,
      error: "Error processing face: " + (error instanceof Error ? error.message : "Unknown error")
    };
  }
};

/**
 * Store a face embedding in the database
 */
export const storeFaceEmbedding = async (
  studentId: string,
  embedding: number[],
  imageData?: string
): Promise<boolean> => {
  try {
    console.log(`Storing face embedding for student ${studentId}`);
    
    // Ensure embedding is in the expected format
    if (!Array.isArray(embedding) || embedding.length === 0) {
      console.error("Invalid embedding format:", embedding);
      return false;
    }
    
    // Store the embedding in the database
    const { error } = await supabase
      .from("face_embeddings")
      .insert({
        student_id: studentId,
        embedding: embedding,
        image_data: imageData || null
      });
    
    if (error) {
      console.error("Error storing face embedding:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception storing face embedding:", error);
    return false;
  }
};

/**
 * Register a face directly using the Facenet model
 */
export const registerFace = async (
  studentId: string,
  imageData: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log(`Starting face registration for student ${studentId} using Facenet`);
    
    // First attempt to process the face using facenet
    const result = await processFaceForRegistration(imageData);
    
    if (!result.success || !result.embedding) {
      // If facenet processing fails, use the fallback registration method
      console.log("Facenet processing failed, using fallback registration method");
      const { registerFaceImage } = await import("./registration/registerFace");
      const fallbackResult = await registerFaceImage(studentId, imageData, false);
      
      if (fallbackResult.success) {
        console.log("Fallback registration successful");
        return { 
          success: true, 
          message: "Face registered successfully with fallback method"
        };
      } else {
        console.error("Both Facenet and fallback registration failed");
        return { 
          success: false, 
          message: fallbackResult.message || "Registration failed with both methods"
        };
      }
    }
    
    // Log the embedding being generated for debugging
    console.log(`Generated embedding for student ${studentId}, length: ${result.embedding.length}`);
    
    // Store the embedding in the database
    const embeddingStored = await storeFaceEmbedding(
      studentId, 
      result.embedding,
      result.faceImageData
    );
    
    if (!embeddingStored) {
      console.error("Failed to store embedding - falling back to simple registration");
      
      // If embedding storage fails, try the simpler registration method
      const { registerFaceImage } = await import("./registration/registerFace");
      const fallbackResult = await registerFaceImage(studentId, imageData, false);
      
      if (fallbackResult.success) {
        return { 
          success: true, 
          message: "Face registered with basic method (embedding storage failed)"
        };
      } else {
        return { 
          success: false, 
          message: "Registration failed completely"
        };
      }
    }
    
    // Also update the avatar image in the student profile
    const { updateBuilderAvatar } = await import("./registration/updateAvatar");
    const avatarUpdated = await updateBuilderAvatar(studentId, imageData);
    
    if (!avatarUpdated) {
      console.warn("Warning: Embedding stored but failed to update avatar");
    }
    
    // Also store the face in face_registrations table for comprehensive access
    const { registerFaceWithoutDetection } = await import("./registration/registerFaceWithoutDetection");
    await registerFaceWithoutDetection(studentId, imageData);
    
    return {
      success: true,
      message: "Face registered successfully"
    };
  } catch (error) {
    console.error("Error in registerFace:", error);
    return {
      success: false,
      message: "An unexpected error occurred during registration"
    };
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
    throw new Error("Embeddings must have the same length");
  }
  
  let sum = 0;
  for (let i = 0; i < embedding1.length; i++) {
    const diff = embedding1[i] - embedding2[i];
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
};

/**
 * Find the closest match for a face embedding
 */
export const findClosestMatch = async (
  embedding: number[],
  threshold: number = 0.6
): Promise<Builder | null> => {
  try {
    // Fetch all stored face embeddings
    const { data: embeddings, error } = await supabase
      .from("face_embeddings")
      .select("student_id, embedding");
    
    if (error || !embeddings || embeddings.length === 0) {
      console.error("Error fetching face embeddings:", error);
      return null;
    }
    
    let closestMatch: { studentId: string; distance: number } | null = null;
    
    // Find the closest match
    for (const storedEmbedding of embeddings) {
      const distance = calculateEuclideanDistance(embedding, storedEmbedding.embedding);
      
      if (distance < threshold && (!closestMatch || distance < closestMatch.distance)) {
        closestMatch = {
          studentId: storedEmbedding.student_id,
          distance
        };
      }
    }
    
    if (closestMatch) {
      // Fetch student details
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", closestMatch.studentId)
        .maybeSingle();
      
      if (studentError || !student) {
        console.error("Error fetching student details:", studentError);
        return null;
      }
      
      // Convert to Builder object
      const builder: Builder = {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        builderId: student.student_id || "",
        status: "present",
        timeRecorded: new Date().toLocaleTimeString(),
        image: student.image_url
      };
      
      return builder;
    }
    
    return null;
  } catch (error) {
    console.error("Error finding closest match:", error);
    return null;
  }
};

/**
 * Recognize a face in an image
 */
export const recognizeFace = async (
  imageData: string
): Promise<Builder | null> => {
  try {
    // Initialize models if not already done
    const { initModels, detectFaces, generateEmbedding } = await import("./browser-facenet");
    const initialized = await initModels();
    
    if (!initialized) {
      console.error("Failed to initialize face recognition models");
      toast.error("Face recognition not available");
      return null;
    }
    
    // Detect faces in the image
    const faces = await detectFaces(imageData);
    
    if (!faces || faces.length === 0) {
      console.log("No face detected in the image");
      return null;
    }
    
    // Generate embedding for the face
    const embedding = await generateEmbedding(imageData);
    
    if (!embedding) {
      console.error("Failed to generate face embedding");
      return null;
    }
    
    // Find the closest match
    const match = await findClosestMatch(embedding);
    
    return match;
  } catch (error) {
    console.error("Error recognizing face:", error);
    return null;
  }
};

/**
 * Generate embedding for a face image
 */
export const generateEmbedding = async (
  imageData: string
): Promise<number[] | null> => {
  try {
    const { initModels } = await import("./browser-facenet");
    const { generateEmbedding: genEmbed } = await import("./browser-facenet");
    
    await initModels();
    return await genEmbed(imageData);
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
};

/**
 * Detect faces in an image
 */
export const detectFaces = async (
  imageData: string
): Promise<Array<{ x: number; y: number; width: number; height: number }> | null> => {
  try {
    const { initModels, detectFaces: detect } = await import("./browser-facenet");
    
    await initModels();
    return await detect(imageData);
  } catch (error) {
    console.error("Error detecting faces:", error);
    return null;
  }
};
