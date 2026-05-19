from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI(title="FinSight AI API")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "*"  # Allows all origins
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to FinSight AI API"}

# from app.routers import health, classify, predict
from app.routers import recommend

# app.include_router(health.router)
# app.include_router(classify.router)
# app.include_router(predict.router)
app.include_router(recommend.router)
