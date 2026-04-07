"""
统一响应工具模块

提供标准化的 API 响应格式：
- success_response: 成功响应
- list_response: 列表响应（带分页）
- error_response: 错误响应
"""

from typing import TypeVar, Generic, List, Optional, Any
from fastapi.responses import JSONResponse
from fastapi import status

T = TypeVar("T")


def success_response(
    data: Optional[T] = None,
    message: str = "success",
    code: int = status.HTTP_200_OK
) -> JSONResponse:
    """
    创建成功响应

    Args:
        data: 响应数据
        message: 成功消息
        code: HTTP 状态码

    Returns:
        JSONResponse
    """
    content = {
        "code": code,
        "message": message,
        "data": data
    }
    return JSONResponse(content=content, status_code=code)


def list_response(
    data: List[T],
    total: int,
    page: int = 1,
    page_size: int = 20,
    message: str = "success"
) -> JSONResponse:
    """
    创建列表响应（带分页）

    Args:
        data: 列表数据
        total: 总数
        page: 当前页码
        page_size: 每页大小
        message: 成功消息

    Returns:
        JSONResponse
    """
    content = {
        "code": 200,
        "message": message,
        "data": data,
        "total": total,
        "page": page,
        "page_size": page_size
    }
    return JSONResponse(content=content, status_code=status.HTTP_200_OK)


def error_response(
    message: str,
    code: int = status.HTTP_400_BAD_REQUEST,
    data: Optional[Any] = None
) -> JSONResponse:
    """
    创建错误响应

    Args:
        message: 错误消息
        code: HTTP 状态码
        data: 额外数据

    Returns:
        JSONResponse
    """
    content = {
        "code": code,
        "message": message,
        "data": data
    }
    return JSONResponse(content=content, status_code=code)


# HTTP 状态码与业务状态码映射
HTTP_STATUS_MAP = {
    status.HTTP_200_OK: 200,
    status.HTTP_201_CREATED: 201,
    status.HTTP_204_NO_CONTENT: 204,
    status.HTTP_400_BAD_REQUEST: 400,
    status.HTTP_401_UNAUTHORIZED: 401,
    status.HTTP_403_FORBIDDEN: 403,
    status.HTTP_404_NOT_FOUND: 404,
    status.HTTP_422_UNPROCESSABLE_ENTITY: 422,
    status.HTTP_500_INTERNAL_SERVER_ERROR: 500,
}
