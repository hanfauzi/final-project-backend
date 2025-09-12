export function getPagination(page: number, limit: number) {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}

export function getMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
