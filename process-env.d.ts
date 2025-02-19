declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined
      MONGODB_URI: string
      PORT?: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
