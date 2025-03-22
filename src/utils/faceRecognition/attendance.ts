
import { Builder, BuilderStatus } from '@/components/BuilderCard';
import { supabase } from '@/integrations/supabase/client';

// Function to get all builders (for dashboard)
export const getAllBuilders = async (): Promise<Builder[]> => {
  try {
    // Get all builders from database
    const { data: buildersData, error } = await supabase
      .from('students')
      .select('*');
      
    if (error) {
      console.error('Error fetching builders:', error);
      return [];
    }
    
    if (!buildersData || buildersData.length === 0) {
      return [];
    }
    
    // Get attendance data for today
    const today = new Date().toISOString().split('T')[0];
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', today);
      
    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
    }
    
    // Map the DB builders to our application's Builder format
    const builders: Builder[] = buildersData.map(dbBuilder => {
      // Find matching attendance record for today if it exists
      const attendance = attendanceData?.find(a => a.student_id === dbBuilder.id);
      
      // Properly handle the image URL
      let imageUrl = dbBuilder.image_url;
      
      // Debug the image URL received from DB
      console.log(`Builder ${dbBuilder.first_name} ${dbBuilder.last_name} image URL:`, imageUrl);
      
      // If no image_url exists or it's null, generate a fallback
      if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined') {
        imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(dbBuilder.first_name)}+${encodeURIComponent(dbBuilder.last_name)}&background=random`;
      }
      
      return {
        id: dbBuilder.id,
        name: `${dbBuilder.first_name} ${dbBuilder.last_name}`,
        builderId: dbBuilder.student_id || '',
        status: (attendance?.status || 'pending') as BuilderStatus,
        timeRecorded: attendance?.time_recorded 
          ? new Date(attendance.time_recorded).toLocaleTimeString() 
          : undefined,
        image: imageUrl,
        excuseReason: attendance?.excuse_reason
      };
    });
    
    console.log('Processed builder data:', builders);
    return builders;
  } catch (error) {
    console.error('Error in getAllBuilders:', error);
    return [];
  }
};

// Function to mark attendance manually
export const markAttendance = async (builderId: string, status: BuilderStatus, excuseReason?: string): Promise<boolean> => {
  try {
    const attendanceData: Record<string, any> = {
      student_id: builderId,
      status,
      time_recorded: new Date().toISOString(),
    };
    
    // Add excuse reason if status is 'excused'
    if (status === 'excused' && excuseReason) {
      attendanceData.excuse_reason = excuseReason;
    }
    
    // Update attendance in database
    const { error } = await supabase
      .from('attendance')
      .upsert(attendanceData, {
        onConflict: 'student_id,date'
      });
      
    if (error) {
      console.error('Error marking attendance:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in markAttendance:', error);
    return false;
  }
};
