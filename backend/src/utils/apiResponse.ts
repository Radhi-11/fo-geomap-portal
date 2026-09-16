export function successResponse<T>(
  res: any,
  statusCode: number,
  message: string,
  data?: T,
  meta?: Record<string, any>,
) {
  const response: any = {
    success: true,
    message,
  };
  if (data !== undefined) response.data = data;
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
}

export function paginatedResponse<T>(
  res: any,
  statusCode: number,
  message: string,
  data: T[],
  page: number,
  limit: number,
  total: number,
) {
  const totalPages = Math.ceil(total / limit);
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}
