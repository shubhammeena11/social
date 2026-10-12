
export function success(data, status = 200) {
  return Response.json(
    { success: true, data },
    { status }
  );
}

export function failure(message, status = 400, details) {
  return Response.json(
    {
      success: false,
      message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

export function validationFailure(error) {
  return failure(
    "Validation failed",
    422,
    error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }))
  );
}