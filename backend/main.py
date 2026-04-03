from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routes import auth, categories, dishes, favorites, history
from routes.admin import router as admin_router
from routes.husband import router as husband_router
from routes.random import router as random_router
from routes.families import router as families_router
from routes.notifications import router as notifications_router
from routes.messages import router as messages_router
from routes.recommendations import router as recommendations_router
from routes.stats import router as stats_router

app = FastAPI(title="DearMenu API", version="1.0.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(dishes.router)
app.include_router(favorites.router)
app.include_router(history.router)
app.include_router(admin_router)
app.include_router(husband_router)
app.include_router(random_router)
app.include_router(families_router)
app.include_router(notifications_router)
app.include_router(messages_router)
app.include_router(recommendations_router)
app.include_router(stats_router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
