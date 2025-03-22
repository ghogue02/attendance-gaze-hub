
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
    
    // Get attendance data for today using a consistent date format
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    console.log('Fetching attendance for today:', todayStr);
    
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', todayStr);
      
    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError);
    }
    
    console.log('Builder data from DB:', buildersData);
    console.log('Today\'s attendance records:', attendanceData);
    
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
      
      // Determine the correct status based on attendance record
      let status: BuilderStatus = 'pending';
      if (attendance) {
        // If there's an excuse reason, mark as excused regardless of status in DB
        if (attendance.excuse_reason) {
          status = 'excused';
        } else {
          status = attendance.status as BuilderStatus;
        }
      }
      
      return {
        id: dbBuilder.id,
        name: `${dbBuilder.first_name} ${dbBuilder.last_name}`,
        builderId: dbBuilder.student_id || '',
        status,
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
    // Generate consistent date format
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    console.log('Marking attendance for builder:', builderId, 'with status:', status, 'date:', todayStr);
    
    const attendanceData: any = {
      student_id: builderId,
      date: todayStr,
      status: status, // Store the actual status value
      time_recorded: new Date().toISOString(),
    };
    
    // Add excuse reason if provided
    if (excuseReason) {
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
