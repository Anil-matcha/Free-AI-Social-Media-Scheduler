import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    print(f">> Starting {settings.PROJECT_NAME} on http://{settings.HOST}:{settings.PORT}")
    print(f">> Swagger Docs available at http://localhost:{settings.PORT}/docs")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
