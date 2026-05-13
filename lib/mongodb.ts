import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

type MongooseCache = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

declare global {
    var mongooseCache: MongooseCache | undefined;
}

const globalWithMongooseCache = global as typeof globalThis & {
    mongooseCache: MongooseCache;
};

const cached = globalWithMongooseCache.mongooseCache ?? {
    conn: null,
    promise: null,
}

globalWithMongooseCache.mongooseCache = cached;

export async function dbConnect(): Promise<typeof mongoose> {
    if (cached.conn) {
        return cached.conn;
    }

    if(!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI!, {
            bufferCommands: false,
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
