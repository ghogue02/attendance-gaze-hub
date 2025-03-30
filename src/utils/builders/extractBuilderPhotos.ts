
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BuilderPhoto {
  id: string;
  name: string;
  photo: string | null;
  builderId?: string;
}

/**
 * Extracts all builder photos along with their names from the database
 * @returns A promise that resolves to an array of builder photos and names
 */
export const extractBuilderPhotos = async (): Promise<BuilderPhoto[]> => {
  try {
    console.log('Fetching all builder photos and names...');
    
    // Fetch all students with their image data
    const { data, error } = await supabase
      .from('students')
      .select('id, first_name, last_name, image_url, student_id')
      .order('first_name', { ascending: true });
      
    if (error) {
      console.error('Error fetching builder photos:', error);
      toast.error('Failed to fetch builder photos');
      return [];
    }
    
    // Map the students data to the BuilderPhoto interface
    const builderPhotos: BuilderPhoto[] = await Promise.all(
      data.map(async (student) => {
        let photo = student.image_url;
        
        // If no image_url, try to fetch from face_registrations
        if (!photo) {
          const { data: faceData, error: faceError } = await supabase
            .from('face_registrations')
            .select('face_data')
            .eq('student_id', student.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (!faceError && faceData?.face_data) {
            photo = faceData.face_data;
          }
        }
        
        return {
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          photo: photo,
          builderId: student.student_id || undefined
        };
      })
    );
    
    console.log(`Successfully fetched ${builderPhotos.length} builder photos`);
    return builderPhotos;
    
  } catch (error) {
    console.error('Unexpected error fetching builder photos:', error);
    toast.error('An error occurred while fetching builder photos');
    return [];
  }
};

/**
 * Downloads all builder photos as a ZIP file
 */
export const downloadBuilderPhotos = async (): Promise<void> => {
  try {
    const photos = await extractBuilderPhotos();
    
    if (photos.length === 0) {
      toast.error('No builder photos available to download');
      return;
    }
    
    // If JSZip is not available, we'll need to dynamically import it
    // This could be replaced with a proper import if JSZip is added as a dependency
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Add each photo to the zip
    let validPhotoCount = 0;
    
    for (const builder of photos) {
      if (builder.photo) {
        try {
          // If the photo is a base64 string
          if (builder.photo.startsWith('data:image/')) {
            // Extract the base64 data and convert to a Blob
            const base64Data = builder.photo.split(',')[1];
            const mimeType = builder.photo.split(';')[0].split(':')[1];
            const binaryData = atob(base64Data);
            const byteArray = new Uint8Array(binaryData.length);
            
            for (let i = 0; i < binaryData.length; i++) {
              byteArray[i] = binaryData.charCodeAt(i);
            }
            
            const blob = new Blob([byteArray], { type: mimeType });
            
            // Determine file extension
            let extension = 'jpg'; // Default
            if (mimeType === 'image/png') extension = 'png';
            if (mimeType === 'image/gif') extension = 'gif';
            if (mimeType === 'image/webp') extension = 'webp';
            
            // Add to zip with a safe filename (replace spaces and special chars)
            const safeFileName = builder.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            zip.file(`${safeFileName}.${extension}`, blob);
            validPhotoCount++;
          }
          // If the photo is a URL
          else if (builder.photo.startsWith('http')) {
            // Fetch the image from the URL
            const response = await fetch(builder.photo);
            
            if (response.ok) {
              const blob = await response.blob();
              const safeFileName = builder.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
              const extension = builder.photo.split('.').pop() || 'jpg';
              zip.file(`${safeFileName}.${extension}`, blob);
              validPhotoCount++;
            } else {
              console.error(`Failed to fetch image for ${builder.name}: ${response.statusText}`);
            }
          }
        } catch (error) {
          console.error(`Error processing photo for ${builder.name}:`, error);
        }
      }
    }
    
    if (validPhotoCount === 0) {
      toast.error('No valid photos found to download');
      return;
    }
    
    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Create download link
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'builder_photos.zip';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded ${validPhotoCount} builder photos`);
  } catch (error) {
    console.error('Error downloading builder photos:', error);
    toast.error('Failed to download builder photos');
  }
};
