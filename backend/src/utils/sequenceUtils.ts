import { Counter } from '../models/Counter';

/**
 * Atomically increments and returns the next sequence value for a given counter name.
 * If the counter does not exist, it will be created with a starting sequence of 1.
 * 
 * @param counterName The unique name of the counter (e.g., 'task_sequence_PROJECTCODE').
 * @returns The next sequence number.
 * @throws Error if the database operation fails.
 */
export const getNextSequenceValue = async (counterName: string): Promise<number> => {
    try {
        const counter = await Counter.findByIdAndUpdate(
            counterName, // The _id of the counter document
            { $inc: { sequence_value: 1 } }, // Increment the sequence_value by 1
            {
                new: true,        // Return the modified document rather than the original
                upsert: true,     // Create the document if it doesn't exist
                setDefaultsOnInsert: true // Ensure defaults (like sequence_value: 0) are applied on upsert
            }
        ).exec();

        if (!counter) {
            // This case should ideally not be hit due to upsert:true, 
            // but as a safeguard or if defaults weren't applied as expected on a very first creation before $inc.
            // However, with upsert and $inc, it should initialize if not present and then increment.
            // If `default:0` in schema + `$inc: {sequence_value: 1}` on an upsert, it becomes 1.
            console.error(`Counter document could not be found or created for ${counterName}. This is unexpected with upsert:true.`);
            throw new Error(`Failed to retrieve or initialize counter for ${counterName}.`);
        }
        
        return counter.sequence_value;
    } catch (error) {
        console.error(`Error in getNextSequenceValue for counter ${counterName}:`, error);
        throw new Error(`Database error while trying to get next sequence for ${counterName}.`);
    }
}; 