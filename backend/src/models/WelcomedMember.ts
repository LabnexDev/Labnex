import { Schema, model, Document } from 'mongoose';

export interface IWelcomedMember extends Document {
  memberId: string;
  welcomedAt: Date;
}

const WelcomedMemberSchema = new Schema<IWelcomedMember>({
  memberId: { type: String, required: true, unique: true },
  welcomedAt: { type: Date, default: Date.now },
});

export default model<IWelcomedMember>('WelcomedMember', WelcomedMemberSchema); 