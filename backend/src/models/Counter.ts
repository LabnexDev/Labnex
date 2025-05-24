import mongoose, { Document, Schema } from 'mongoose';

/**
 * Interface for the Counter document.
 * The _id will store the name of the counter, 
 * e.g., 'project_LABNEX_task_sequence' or 'global_task_sequence'.
 */
export interface ICounter extends Document {
  _id: string; // Counter name (e.g., 'project_PROJECTCODE_task_sequence')
  sequence_value: number;
}

const CounterSchema = new Schema<ICounter>(
  {
    _id: {
      type: String,
      required: true,
    },
    sequence_value: {
      type: Number,
      required: true,
      default: 0, // Start sequence from 0, so first ID will be 1 after increment
    },
  },
  {
    // No timestamps needed for counters generally
    timestamps: false,
    // Specify a different collection name if desired, default is 'counters'
    // collection: 'sequences' 
  }
);

export const Counter = mongoose.model<ICounter>('Counter', CounterSchema); 