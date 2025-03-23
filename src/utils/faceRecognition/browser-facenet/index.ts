/**
 * Browser-compatible FaceNet implementation using TensorFlow.js
 * This provides similar functionality to node-facenet but works in browser environments
 */
import * as tf from '@tensorflow/tfjs';
import { Builder } from '@/components/BuilderCard';
import { supabase } from '@/integrations/supabase/client';

// We'll load models lazily when needed
let faceDetectionModel: tf.GraphModel | null = null;
let facenetModel: tf.GraphModel | null = null;
let isModelLoading = false;

// Constants
const FACE_EMBEDDING_SIZE = 128;
const FACE_EMBEDDINGS_TABLE = 'face_embeddings';
const MATCH_THRESHOLD = 0.75; // Lower distance means better match

/**
 * Initialize models if not already loaded
 */
export const initModels = async (): Promise<boolean> => {
  if (faceDetectionModel && facenetModel) return true;
  if (isModelLoading) {
    // Wait for loading to complete if already in progress
    while (isModelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return !!faceDetectionModel && !!facenetModel;
  }

  try {
    isModelLoading = true;
    console.log('Loading browser-compatible face models...');
    
    // First, ensure TensorFlow.js is ready
    await tf.ready();
    
    // Load the face detection model - using a more reliable model source
    // We'll use the BlazeFace model which is lightweight and works well in browsers
    try {
      console.log('Loading BlazeFace detection model...');
      faceDetectionModel = await tf.loadLayersModel(
        'https://storage.googleapis.com/tfjs-models/tfjs/blazeface_v1/model.json'
      );
      console.log('BlazeFace model loaded successfully');
    } catch (error) {
      console.error('Error loading BlazeFace model:', error);
      
      // Try an alternative model as fallback
      try {
        console.log('Trying alternative face detection model...');
        faceDetectionModel = await tf.loadGraphModel(
          'https://tfhub.dev/mediapipe/tfjs-model/blazeface/1/default/1', 
          { fromTFHub: true }
        );
        console.log('Alternative face detection model loaded successfully');
      } catch (fallbackError) {
        console.error('Error loading alternative face detection model:', fallbackError);
        return false;
      }
    }
    
    // For facenet, we'll use MobileNet as a feature extractor
    try {
      console.log('Loading feature extraction model...');
      facenetModel = await tf.loadLayersModel(
        'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
      );
      console.log('Feature extraction model loaded successfully');
    } catch (error) {
      console.error('Error loading feature extraction model:', error);
      return false;
    }
    
    console.log('Face models loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading face models:', error);
    return false;
  } finally {
    isModelLoading = false;
  }
};

/**
 * Detect faces in an image and return their bounding boxes
 */
export const detectFaces = async (imageData: string): Promise<Array<{box: [number, number, number, number], confidence: number}> | null> => {
  try {
    if (!await initModels()) {
      console.error('Failed to initialize face detection models');
      return null;
    }
    
    // Convert base64 image to tensor
    const img = await createImageTensor(imageData);
    if (!img) {
      console.error('Failed to create image tensor from image data');
      return null;
    }
    
    // Normalize and prepare input
    const input = tf.tidy(() => {
      // Resize to expected input size for BlazeFace
      return img.expandDims(0).toFloat().div(127.5).sub(1);
    });
    
    // Run detection
    const result = await faceDetectionModel!.predict(input) as any;
    
    // Process results based on model type
    let faces = [];
    
    if (Array.isArray(result)) {
      // BlazeFace model output format
      const predictions = await result[0].arraySync();
      const confidences = await result[1].arraySync();
      
      // Clean up tensors
      tf.dispose([img, input, ...result]);
      
      if (!predictions || predictions.length === 0) {
        console.log('No faces detected in image');
        return [];
      }
      
      // Format results
      faces = predictions.map((face: number[], i: number) => ({
        box: face.slice(0, 4) as [number, number, number, number],
        confidence: confidences[i]
      }));
    } else {
      // Alternative model output format
      const predictions = await result.arraySync();
      
      // Clean up tensors
      tf.dispose([img, input, result]);
      
      if (!predictions || predictions[0].length === 0) {
        console.log('No faces detected in image');
        return [];
      }
      
      // Format results - adjust based on actual model output format
      faces = predictions[0].map((pred: any) => ({
        box: [pred.topLeft[0], pred.topLeft[1], pred.bottomRight[0], pred.bottomRight[1]] as [number, number, number, number],
        confidence: pred.probability
      }));
    }
    
    console.log(`Detected ${faces.length} faces in image`);
    return faces;
  } catch (error) {
    console.error('Error detecting faces:', error);
    return null;
  }
};

/**
 * Generate embedding for a face image
 */
export const generateEmbedding = async (faceImageData: string): Promise<number[] | null> => {
  try {
    if (!await initModels()) {
      console.error('Failed to initialize face detection models');
      return null;
    }
    
    // Convert face image to tensor
    const img = await createImageTensor(faceImageData);
    if (!img) {
      console.error('Failed to create image tensor');
      return null;
    }
    
    // Resize to expected input size and normalize
    const input = tf.tidy(() => {
      return img.resizeBilinear([224, 224])
                .expandDims(0)
                .toFloat()
                .div(127.5)
                .sub(1);
    });
    
    // Get embedding
    const embedding = await facenetModel!.predict(input) as tf.Tensor;
    const embeddingData = await embedding.data();
    
    // Convert to array and normalize
    // We take a subset of the mobilenet features to simulate 128-dim facenet embeddings
    const embeddingArray = Array.from(embeddingData).slice(0, FACE_EMBEDDING_SIZE);
    
    // Normalize the vector to unit length
    const magnitude = Math.sqrt(embeddingArray.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = embeddingArray.map(val => val / magnitude);
    
    // Cleanup
    tf.dispose([img, input, embedding]);
    
    return normalizedEmbedding;
  } catch (error) {
    console.error('Error generating face embedding:', error);
    return null;
  }
};

/**
 * Helper function to create an image tensor from data URI
 */
async function createImageTensor(imageData: string): Promise<tf.Tensor3D | null> {
  try {
    // Check if the image data is valid
    if (!imageData || !imageData.startsWith('data:image/')) {
      console.error('Invalid image data format');
      return null;
    }
    
    // Create an HTML image element
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Wait for the image to load
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageData;
    });
    
    // Convert to tensor
    return tf.browser.fromPixels(img);
  } catch (error) {
    console.error('Error creating image tensor:', error);
    return null;
  }
}

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
 */
export const findClosestMatch = async (
  embedding: number[],
  threshold = MATCH_THRESHOLD
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
 * Helper function to convert data URI to Blob
 */
function dataURItoBlob(dataURI: string) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  let byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
  else
    byteString = unescape(dataURI.split(',')[1]);

  // separate out the mime component
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], {type: mimeString});
}
