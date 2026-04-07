// 统一错误处理工具
// 从 API 错误中提取用户友好的错误消息

export function getErrorMessage(error: unknown, fallback: string = '操作失败'): string {
  if (error instanceof Error) {
    // ApiError 已经包含了 API 返回的 message
    // 网络错误等情况 fallback 到默认消息
    return error.message || fallback;
  }
  return fallback;
}

// 从 Axios 错误中提取消息
export function getAxiosErrorMessage(error: unknown, fallback: string = '操作失败'): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
  }
  return fallback;
}
