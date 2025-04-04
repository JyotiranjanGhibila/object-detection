from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes.upload import router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include your API routes
app.include_router(router)

@app.get("/")
async def root():
    try:
        return {"message": "Connected to MongoDB"}
    except Exception as e:
        return {"error": str(e)}
