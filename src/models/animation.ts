import { Schema, model, Document, plugin } from 'mongoose'
import slug from 'mongoose-slug-updater'

plugin(slug)

export interface IAnimation extends Document {
  name: string
  slug: string
  jsonName: string
  createdAt: Date
  updatedAt: Date
}

const AnimationSchema: Schema<IAnimation> = new Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  slug: {
    type: String,
    slug: 'name',
    unique: true
  },
  jsonName: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export const Animation = model<IAnimation>('Animation', AnimationSchema)

export default Animation
