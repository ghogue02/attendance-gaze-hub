
/**
 * Stop all tracks in a media stream
 */
export const stopMediaStreamTracks = (stream: MediaStream) => {
  stream.getTracks().forEach(track => track.stop());
};

/**
 * Get a friendly error message for camera access issues
 */
export const getCameraErrorMessage = (error: any): string => {
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return 'Camera access denied. Please allow camera access in your browser settings.';
  } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return 'No camera found. Please connect a camera to your device.';
  } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return 'Camera is in use by another application. Please close other applications that may be using the camera.';
  } else if (error.name === 'OverconstrainedError') {
    return 'The requested camera settings are not supported by your device.';
  } else if (error.name === 'TypeError' || error.message?.includes('getUserMedia is not defined')) {
    return 'Camera access is not supported in this browser.';
  } else {
    return `Camera error: ${error.message || 'Unknown error'}`;
  }
};

/**
 * Merge default constraints with user-provided constraints
 */
export const mergeConstraints = (userConstraints: MediaTrackConstraints = {}) => {
  // Default constraints for good video quality
  const defaultConstraints = {
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  };
  
  return {
    ...defaultConstraints,
    video: {
      ...defaultConstraints.video,
      ...userConstraints
    }
  };
};
