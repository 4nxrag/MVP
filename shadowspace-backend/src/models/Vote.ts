import mongoose, { Document, Schema } from 'mongoose';

export interface IVote extends Document {
  userId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  voteType: 'upvote' | 'downvote';
  createdAt: Date;
}

const VoteSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  voteType: {
    type: String,
    enum: ['upvote', 'downvote'],
    required: true
  }
}, {
  timestamps: true
});

// Ensure one vote per user per post
VoteSchema.index({ userId: 1, postId: 1 }, { unique: true });

export default mongoose.model<IVote>('Vote', VoteSchema);
