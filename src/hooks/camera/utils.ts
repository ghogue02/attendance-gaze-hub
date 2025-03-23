
/**
 * Safely stops all tracks in a media stream
 */
export function stopMediaStreamTracks(stream: MediaStream | null): void {
  if (!stream) return;
  
  stream.getTracks().forEach(track => {
    console.log(`Stopping track: ${track.kind}, enabled: ${track.enabled}, state: ${track.readyState}`);
    track.stop();
  });
}

/**
 * Gets a more specific error message based on the DOMException
 */
export function getCameraErrorMessage(err: unknown): string {
  let errorMessage = 'Unable to access camera. Please check permissions.';
  
  if (err instanceof DOMException) {
    if (err.name === 'NotFoundError') {
      errorMessage = 'No camera found. Please make sure your device has a camera.';
    } else if (err.name === 'NotAllowedError') {
      errorMessage = 'Camera access denied. Please allow camera access in your browser settings.';
    } else if (err.name === 'AbortError') {
      errorMessage = 'Camera setup was aborted. Please try again.';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      errorMessage = 'Camera is already in use by another application. Please close other apps using the camera.';
    } else if (err.name === 'OverconstrainedError') {
      errorMessage = 'Camera cannot satisfy the requested constraints. Please use a different camera.';
    }
  }
  
  return errorMessage;
}

/**
 * Creates a set of default camera constraints
 */
export function getDefaultConstraints(): MediaStreamConstraints {
  return {
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    },
    audio: false
  };
}

/**
 * Merges user provided constraints with defaults
 */
export function mergeConstraints(userConstraints: any): MediaStreamConstraints {
  const defaultVideoConstraints = getDefaultConstraints().video;
  
  return {
    video: {
      ...defaultVideoConstraints,
      ...userConstraints
    },
    audio: false
  };
}
