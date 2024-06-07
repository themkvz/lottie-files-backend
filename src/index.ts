import express, { Express } from 'express'
import compression from 'compression'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import http from 'http'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs'
import { schema } from './schema/index.js'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'

dotenv.config()

const app: Express = express()
const PORT = process.env.PORT !== undefined ? process.env.PORT : 3000
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:4173'], // Comma separated list of your urls to access your api. * means allow everything
    credentials: true // Allow cookies to be sent with requests
  })
)
app.use(
  helmet({
    crossOriginResourcePolicy: true,
    contentSecurityPolicy: IS_PRODUCTION ? undefined : false // Disable CSP in development mode
  })
)
app.use(express.json())
app.use(compression())
app.use('/public', express.static('public'))
app.use(morgan('dev'))

const httpServer = http.createServer(app)
const apolloServer = new ApolloServer({
  schema,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  csrfPrevention: true,
  cache: 'bounded'
})

await apolloServer.start()

app.all(
  '/graphql',
  graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }),
  expressMiddleware(apolloServer)
)

app.get('/health-check', (_, res) => {
  res.status(200).send('Server is running')
})

app.all('*', (_, res) => {
  res.status(404).send("Oops! We're lost in space")
})

mongoose.connection.on('connected', () => console.log('Connected'))
mongoose.connection.on('disconnected', () => console.log('Disconnected'))

await mongoose.connect(process.env.MONGODB_URI)

await new Promise<void>(resolve => httpServer.listen({ port: PORT }, resolve))
console.log(`🚀 Server ready at ${PORT}`)
