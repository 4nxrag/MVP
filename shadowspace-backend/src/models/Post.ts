import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  upvotes: number;
  downvotes: number;
  impressions: number;
  fakeRegion: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  upvotes: {
    type: Number,
    default: 0,
    min: 0
  },
  downvotes: {
    type: Number,
    default: 0,
    min: 0
  },
  impressions: {
    type: Number,
    default: 0,
    min: 0
  },
  fakeRegion: {
    type: String,
    required: true
  }
}, {
  timestamps: true // This automatically creates createdAt and updatedAt
});

// Index for better query performance
PostSchema.index({ createdAt: -1 });
PostSchema.index({ upvotes: -1 });

export default mongoose.model<IPost>('Post', PostSchema);
