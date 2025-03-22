
import { toast } from "sonner";

const API_ENDPOINT = "wss://ws-api.runware.ai/v1";

interface GenerateImageParams {
  positivePrompt: string;
  image?: string;
  model?: string;
  numberResults?: number;
  outputFormat?: string;
  CFGScale?: number;
  scheduler?: string;
  strength?: number;
  promptWeighting?: "compel" | "sdEmbeds" | "none";
  seed?: number | null;
  lora?: string[];
}

interface GeneratedImage {
  imageURL: string;
  positivePrompt: string;
  seed: number;
  NSFWContent: boolean;
}

export class RunwareService {
  private ws: WebSocket | null = null;
  private apiKey: string | null = null;
  private connectionSessionUUID: string | null = null;
  private messageCallbacks: Map<string, (data: any) => void> = new Map();
  private isAuthenticated: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.connectionPromise = this.connect();
  }

  public getApiKey(): string | null {
    return this.apiKey;
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(API_ENDPOINT);
        
        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.authenticate().then(resolve).catch(reject);
        };

        this.ws.onmessage = (event) => {
          console.log("WebSocket message received:", event.data);
          const response = JSON.parse(event.data);
          
          if (response.error || response.errors) {
            console.error("WebSocket error response:", response);
            const errorMessage = response.errorMessage || response.errors?.[0]?.message || "An error occurred";
            toast.error(errorMessage);
            return;
          }

          if (response.data) {
            response.data.forEach((item: any) => {
              if (item.taskType === "authentication") {
                console.log("Authentication successful, session UUID:", item.connectionSessionUUID);
                this.connectionSessionUUID = item.connectionSessionUUID;
                this.isAuthenticated = true;
              } else {
                const callback = this.messageCallbacks.get(item.taskUUID);
                if (callback) {
                  callback(item);
                  this.messageCallbacks.delete(item.taskUUID);
                }
              }
            });
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          toast.error("Connection error. Please try again.");
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("WebSocket closed, attempting to reconnect...");
          this.isAuthenticated = false;
          setTimeout(() => {
            this.connectionPromise = this.connect();
          }, 1000);
        };
      } catch (error) {
        console.error("Error connecting to WebSocket:", error);
        reject(error);
      }
    });
  }

  private authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not ready for authentication"));
        return;
      }
      
      const authMessage = [{
        taskType: "authentication",
        apiKey: this.apiKey,
        ...(this.connectionSessionUUID && { connectionSessionUUID: this.connectionSessionUUID }),
      }];
      
      console.log("Sending authentication message");
      
      // Set up a one-time authentication callback
      const authCallback = (event: MessageEvent) => {
        const response = JSON.parse(event.data);
        if (response.data?.[0]?.taskType === "authentication") {
          this.ws?.removeEventListener("message", authCallback);
          resolve();
        }
      };
      
      this.ws.addEventListener("message", authCallback);
      this.ws.send(JSON.stringify(authMessage));
    });
  }

  async enhancePortrait(imageData: string): Promise<string> {
    try {
      // Wait for connection and authentication before proceeding
      await this.connectionPromise;

      if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.isAuthenticated) {
        this.connectionPromise = this.connect();
        await this.connectionPromise;
      }

      const taskUUID = crypto.randomUUID();
      
      return new Promise((resolve, reject) => {
        // Create image inference payload
        const message = [{
          taskType: "imageInference",
          taskUUID,
          model: "runware:100@1",
          positivePrompt: "professional portrait photo, high quality, sharp details, neutral background, studio lighting",
          negativePrompt: "blurry, distorted, low quality, cartoon, drawing",
          width: 512,
          height: 512,
          numberResults: 1,
          outputFormat: "WEBP",
          steps: 4,
          CFGScale: 2,
          scheduler: "FlowMatchEulerDiscreteScheduler",
          strength: 0.4,
          image: imageData, // Use image property for the source image
          lora: [],
          seed: Math.floor(Math.random() * 100000000),
        }];

        console.log("Sending image enhancement request with taskUUID:", taskUUID);

        this.messageCallbacks.set(taskUUID, (data) => {
          console.log("Received callback data:", data);
          if (data.error) {
            console.error("Error in image enhancement:", data.error);
            reject(new Error(data.errorMessage || "Error enhancing image"));
          } else if (data.imageURL) {
            console.log("Image enhanced successfully:", data.imageURL);
            resolve(data.imageURL);
          } else {
            console.error("Unexpected response:", data);
            reject(new Error("Unexpected response from image enhancement service"));
          }
        });

        this.ws.send(JSON.stringify(message));
      });
    } catch (error) {
      console.error("Error in enhancePortrait:", error);
      throw error;
    }
  }

  // Helper method to check if we have a valid API key and are connected
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      await this.connectionPromise;
      return this.isAuthenticated;
    } catch (error) {
      return false;
    }
  }
}

// Create a singleton instance with null API key - will be initialized later
let runwareService: RunwareService | null = null;

export const initRunwareService = (apiKey: string): RunwareService => {
  if (!runwareService || runwareService.getApiKey() !== apiKey) {
    console.log("Initializing Runware service with API key");
    runwareService = new RunwareService(apiKey);
  }
  return runwareService;
};

export const getRunwareService = (): RunwareService | null => {
  return runwareService;
};

// Enhanced function that applies AI transformation to a face image
export const enhanceFaceImage = async (imageDataString: string): Promise<string | null> => {
  try {
    // First apply basic image enhancement as a fallback
    const basicEnhancedImage = await applyBasicEnhancement(imageDataString);
    
    // Try to enhance with AI if available
    try {
      // Check if Runware service is initialized and available
      const service = getRunwareService();
      if (service && await service.isAvailable()) {
        console.log("Using Runware AI for image enhancement");
        const aiEnhancedImage = await service.enhancePortrait(basicEnhancedImage);
        console.log("Successfully enhanced image with AI");
        return aiEnhancedImage;
      } else {
        console.log("Runware AI service not available, using basic enhancement");
        return basicEnhancedImage;
      }
    } catch (aiError) {
      console.warn("AI enhancement failed, using basic enhancement instead:", aiError);
      return basicEnhancedImage;
    }
  } catch (error) {
    console.error("Error enhancing image:", error);
    return imageDataString; // Return original if enhancement fails
  }
};

// Apply basic image enhancements using canvas
const applyBasicEnhancement = async (imageDataString: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new Image object to work with
      const img = new Image();
      
      // Handle load errors
      img.onerror = () => {
        console.error("Failed to load image");
        reject("Image loading failed");
      };
      
      // Set up image loading
      img.onload = () => {
        try {
          // Create a canvas to manipulate the image
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          
          if (!ctx) {
            console.warn("Could not get 2D context");
            resolve(imageDataString);
            return;
          }
          
          // Set canvas dimensions (maintain aspect ratio but ensure reasonable size)
          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height = height * (MAX_SIZE / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = width * (MAX_SIZE / height);
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw the original image to the canvas
          ctx.drawImage(img, 0, 0, width, height);
          
          // Apply a series of effects to create a professional headshot look:
          
          // 1. Increase contrast slightly
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // Contrast adjustment
          const contrast = 20; // Increase contrast by 20%
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          
          for (let i = 0; i < data.length; i += 4) {
            // Apply to each RGB channel
            data[i] = clamp(factor * (data[i] - 128) + 128); // Red
            data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128); // Green
            data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128); // Blue
            // Alpha channel unchanged
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          // 2. Apply a subtle vignette effect (darkened edges)
          ctx.globalCompositeOperation = "multiply";
          const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) / 1.7
          );
          gradient.addColorStop(0, "rgba(255,255,255,1)");
          gradient.addColorStop(1, "rgba(230,230,230,1)");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
          
          // 3. Reset composite operation
          ctx.globalCompositeOperation = "source-over";
          
          // 4. Add a subtle border/glow effect
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 5;
          ctx.shadowColor = "rgba(0,0,0,0.2)";
          ctx.shadowBlur = 10;
          ctx.strokeRect(0, 0, width, height);
          
          // 5. Slight color warming
          ctx.globalCompositeOperation = "overlay";
          ctx.fillStyle = "rgba(255, 240, 220, 0.1)";
          ctx.fillRect(0, 0, width, height);
          
          // Reset composite operation
          ctx.globalCompositeOperation = "source-over";
          
          // Convert the canvas back to a data URL with high quality
          const enhancedImageData = canvas.toDataURL("image/jpeg", 0.95);
          
          resolve(enhancedImageData);
        } catch (canvasError) {
          console.error("Canvas processing error:", canvasError);
          resolve(imageDataString);
        }
      };
      
      // Set image source and begin loading
      img.crossOrigin = "anonymous";
      img.src = imageDataString;
      
    } catch (error) {
      console.error("Error in basic enhancement:", error);
      resolve(imageDataString);
    }
  });
};

// Helper function to clamp pixel values between 0-255
const clamp = (value: number): number => {
  return Math.max(0, Math.min(255, value));
};
