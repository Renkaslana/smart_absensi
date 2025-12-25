"""
Simple runner script for the FastAPI application.
"""

import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    print("="*60)
    print(f"🚀 Starting {settings.APP_NAME}")
    print(f"📍 Server: http://localhost:8001")
    print(f"📚 API Docs: http://localhost:8001/docs")
    print(f"🔧 Debug Mode: {settings.DEBUG}")
    print("="*60)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.DEBUG,
        log_level="info"
    )
