import { composeWithMongoose } from 'graphql-compose-mongoose'
import { schemaComposer } from 'graphql-compose'
import GraphQLUpload, { FileUpload } from 'graphql-upload/GraphQLUpload.mjs'
import { createWriteStream } from 'fs'
import path from 'path'
import { MongoServerError } from 'mongodb'
import slugify from 'slugify'

import Animation from '../models/animation.js'

schemaComposer.add(GraphQLUpload)

const AnimationTC = composeWithMongoose(Animation, {
  resolvers: {
    createOne: {
      record: {
        removeFields: ['updatedAt', 'createdAt', '_id']
      }
    }
  }
})

AnimationTC.removeField('_id')
AnimationTC.setField('id', {
  type: 'String',
  description: 'The id of the animation',
  resolve: source => source._id
})

interface UploadAnimationArgs {
  file: Promise<FileUpload>
  name: string
}

const uploadAnimationResolver = schemaComposer.createResolver<
unknown,
UploadAnimationArgs
>({
  name: 'uploadAnimationResolver',
  type: 'Boolean',
  args: {
    file: 'Upload!',
    name: 'String'
  },
  resolve: async ({ args }) => {
    try {
      const file = await args.file
      const { createReadStream, filename, mimetype } = file

      // TODO Validate Lottie json file

      const sanitazedFilename = slugify.default(filename, { lower: true })

      const allowedMimeTypes = ['application/json']
      if (!allowedMimeTypes.includes(mimetype)) {
        throw new Error('Invalid file mime type')
      }

      const animationName =
        args.name !== undefined
          ? args.name
          : sanitazedFilename.replace('.json', '')
      await Animation.create({
        name: animationName,
        jsonName: sanitazedFilename
      })

      const readStream = createReadStream()
      const destPath = path.resolve(`./public/${sanitazedFilename}`)

      await new Promise((resolve, reject) =>
        readStream
          .pipe(createWriteStream(destPath))
          .on('finish', resolve)
          .on('error', reject)
      )

      return true
    } catch (error) {
      if (error instanceof MongoServerError) {
        throw new Error('Animation already exists')
      }

      return false
    }
  }
})

schemaComposer.Query.addFields({
  animations: AnimationTC.getResolver('pagination')
})

schemaComposer.Mutation.addFields({
  deleteAnimation: AnimationTC.getResolver('removeById'),
  uploadAnimation: uploadAnimationResolver
})

export const schema = schemaComposer.buildSchema()

export default schema
