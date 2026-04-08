from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

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
from routes.orders import router as orders_router
from utils.response import HTTP_STATUS_MAP

app = FastAPI(title="DearMenu API", version="1.0.0")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=False,  # 使用 Authorization header 传递 token，不需要 credentials
    allow_methods=["*"],
    allow_headers=["*"],
)


# 全局异常处理器
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """请求体验证异常处理"""
    errors = exc.errors()
    error_msg = "; ".join([f"{e['loc']}: {e['msg']}" for e in errors])
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "code": 422,
            "message": f"参数错误: {error_msg}",
            "data": None
        }
    )


@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    """Pydantic 验证异常处理"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "code": 422,
            "message": f"数据验证错误: {str(exc)}",
            "data": None
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """通用异常处理"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": 500,
            "message": f"服务器内部错误: {str(exc)}",
            "data": None
        }
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
app.include_router(orders_router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health")
def health_check():
    from utils.response import success_response
    return success_response(data={"status": "ok"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
