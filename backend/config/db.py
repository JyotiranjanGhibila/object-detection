from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb+srv://bikash:bikash@cluster0.vwee7we.mongodb.net/video?retryWrites=true&w=majority"
DB_NAME = "video"

client = AsyncIOMotorClient(MONGO_URI)
database = client[DB_NAME]
videos_collection = database["videos_collection"]
detections_collection = database["detections"]