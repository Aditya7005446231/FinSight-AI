from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="FinSight AI API")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "*"  
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

from app.routers import recommend, plan, analyst, researcher

app.include_router(recommend.router)
app.include_router(plan.router)
app.include_router(analyst.router)
app.include_router(researcher.router)


