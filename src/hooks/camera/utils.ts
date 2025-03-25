
/**
 * Stops all media tracks in a MediaStream
 */
export const stopMediaStreamTracks = (stream: MediaStream): void => {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  }
};

/**
 * Gets a user-friendly error message from a getUserMedia error
 */
export const getCameraErrorMessage = (error: any): string => {
  if (!error) return 'Unknown camera error';
  
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return 'Camera access denied. Please grant permission to use your camera.';
  } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    return 'No camera found on this device.';
  } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    return 'Camera is already in use by another application.';
  } else if (error.name === 'OverconstrainedError') {
    return 'Camera constraints not satisfied. Please try different settings.';
  } else if (error.name === 'TypeError' || error.name === 'TypeError') {
    return 'Invalid camera constraints.';
  }
  
  return `Camera error: ${error.message || error.name || 'Unknown'}`;
};

/**
 * Merges default constraints with user provided constraints
 */
export const mergeConstraints = (userConstraints: any = {}): MediaStreamConstraints => {
  // Default constraints
  const defaultConstraints: MediaStreamConstraints = {
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  };
  
  // If user provided a simple boolean for video, use default video constraints
  if (typeof userConstraints === 'boolean') {
    return {
      ...defaultConstraints,
      video: userConstraints ? defaultConstraints.video : false
    };
  }
  
  // If user provided specific video constraints, merge them with defaults
  if (userConstraints && typeof userConstraints === 'object') {
    return {
      video: {
        ...(defaultConstraints.video as object),
        ...userConstraints
      },
      audio: false
    };
  }
  
  return defaultConstraints;
};
