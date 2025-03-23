
import { useRef, useState, useEffect } from 'react';
import type { UseCameraProps, UseCameraReturn, CameraConstraints } from './types';
import { captureImageFromVideo } from './captureImage';

/**
 * Helper function to handle camera initialization
 */
export function initCamera(
  videoRef: React.RefObject<HTMLVideoElement>,
  constraints: MediaStreamConstraints
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia(constraints);
}

/**
 * Convert camera constraints object to MediaStreamConstraints
 */
export function prepareConstraints(videoConstraints?: CameraConstraints): MediaStreamConstraints {
  // Default video constraints
  const defaultConstraints: CameraConstraints = {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 }
  };

  // Merge default constraints with provided constraints
  const mergedVideoConstraints = videoConstraints 
    ? { ...defaultConstraints, ...videoConstraints }
    : defaultConstraints;

  // Return properly formatted MediaStreamConstraints
  return {
    audio: false,
    video: mergedVideoConstraints as MediaTrackConstraints
  };
}

/**
 * Check if the camera is available and has permissions
 */
export async function checkCameraAvailability(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    if (videoDevices.length === 0) {
      return false;
    }
    
    // Try to access the camera with minimal constraints
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user' },
      audio: false 
    });
    
    // Remember to stop all tracks to release the camera
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    console.error('Error checking camera availability:', error);
    return false;
  }
}

/**
 * Format camera error messages for better user understanding
 */
export function formatCameraError(error: unknown): string {
  if (!error) return 'Unknown camera error';
  
  if (error instanceof Error) {
    const { name, message } = error;
    
    switch (name) {
      case 'NotAllowedError':
        return 'Camera access denied. Please allow camera access in your browser settings.';
      case 'NotFoundError':
        return 'No camera found on this device.';
      case 'NotReadableError':
        return 'Camera is in use by another application.';
      case 'OverconstrainedError':
        return 'Camera constraints cannot be satisfied.';
      default:
        return message || 'An error occurred accessing the camera.';
    }
  }
  
  return String(error);
}
