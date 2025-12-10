"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api import users, articles, conversations, chat, email_digests, cron

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Quorent API",
    description="AI News Assistant Backend",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # change to localhost:3000 later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(users.router)
app.include_router(articles.router)
app.include_router(conversations.router)
app.include_router(chat.router)
app.include_router(email_digests.router)
app.include_router(cron.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to Quorent API"}