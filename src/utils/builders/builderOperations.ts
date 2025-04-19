
import { supabase } from '@/integrations/supabase/client';
import { Builder } from '@/components/builder/types';
import { toast } from 'sonner';

/**
 * Adds a new builder to the database
 * @param firstName The builder's first name
 * @param lastName The builder's last name
 * @param email The builder's email address
 * @param builderId Optional builder ID
 * @returns The newly created builder or null if operation failed
 */
export const addBuilder = async (
  firstName: string,
  lastName: string,
  email: string,
  builderId?: string
): Promise<Builder | null> => {
  try {
    console.log(`Adding new builder: ${firstName} ${lastName}`);
    
    // Validate inputs
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error('First name, last name, and email are required');
      return null;
    }
    
    // Insert the new student into the database
    const { data, error } = await supabase
      .from('students')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        student_id: builderId?.trim() || null
      })
      .select('*')
      .single();
      
    if (error) {
      console.error('Error adding builder:', error);
      toast.error(`Failed to add builder: ${error.message}`);
      return null;
    }
    
    console.log('Builder added successfully:', data);
    toast.success(`Builder ${firstName} ${lastName} added successfully`);
    
    // Transform the student data into a Builder object
    return {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      builderId: data.student_id || '',
      status: 'pending',
      timeRecorded: '',
      image: data.image_url
    };
    
  } catch (error) {
    console.error('Unexpected error adding builder:', error);
    toast.error('An unexpected error occurred while adding the builder');
    return null;
  }
};

/**
 * Deletes a builder from the database
 * @param builderId The ID of the builder to delete
 * @returns True if deletion was successful, false otherwise
 */
export const deleteBuilder = async (builderId: string): Promise<boolean> => {
  try {
    console.log(`Deleting builder with ID: ${builderId}`);
    
    if (!builderId) {
      toast.error('Builder ID is required');
      return false;
    }
    
    // Delete the student from the database
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', builderId);
      
    if (error) {
      console.error('Error deleting builder:', error);
      toast.error(`Failed to delete builder: ${error.message}`);
      return false;
    }
    
    console.log('Builder deleted successfully');
    toast.success('Builder deleted successfully');
    return true;
    
  } catch (error) {
    console.error('Unexpected error deleting builder:', error);
    toast.error('An unexpected error occurred while deleting the builder');
    return false;
  }
};

// Clear the builders cache to ensure fresh data after operations
export const clearBuildersCache = () => {
  // This is a placeholder - the actual implementation will depend on how the cache is managed
  console.log('Clearing builders cache');
  // If you're using a global cache in memory, you'd reset it here
};

/**
 * Archives a builder instead of deleting them
 * @param builderId The ID of the builder to archive
 * @param reason The reason for archiving
 * @returns True if archival was successful, false otherwise
 */
export const archiveBuilder = async (builderId: string, reason: string): Promise<boolean> => {
  try {
    console.log(`Archiving builder with ID: ${builderId}`);
    
    if (!builderId) {
      toast.error('Builder ID is required');
      return false;
    }
    
    // Update the student record with archive information
    const { error } = await supabase
      .from('students')
      .update({
        archived_at: new Date().toISOString(),
        archived_reason: reason || 'No reason provided'  // Ensure we always have some value
      })
      .eq('id', builderId);
      
    if (error) {
      console.error('Error archiving builder:', error);
      toast.error(`Failed to archive builder: ${error.message}`);
      return false;
    }
    
    // Clear any cached builder data to ensure UI updates
    clearBuildersCache();
    
    console.log('Builder archived successfully');
    toast.success('Builder archived successfully');
    return true;
    
  } catch (error) {
    console.error('Unexpected error archiving builder:', error);
    toast.error('An unexpected error occurred while archiving the builder');
    return false;
  }
};
