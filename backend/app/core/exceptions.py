"""
Custom exceptions for the application.
"""

from fastapi import HTTPException, status


class NotFoundException(HTTPException):
    """Raised when a resource is not found."""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class UnauthorizedException(HTTPException):
    """Raised when authentication fails."""
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class ForbiddenException(HTTPException):
    """Raised when access is forbidden."""
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class BadRequestException(HTTPException):
    """Raised for bad requests."""
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class ConflictException(HTTPException):
    """Raised when there's a conflict (e.g., duplicate resource)."""
    def __init__(self, detail: str = "Conflict"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class DuplicateException(HTTPException):
    """Raised when there's a duplicate entry."""
    def __init__(self, detail: str = "Duplicate entry"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class FaceNotRegisteredException(HTTPException):
    """Raised when user hasn't registered their face."""
    def __init__(self, detail: str = "Face not registered. Please register your face first."):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class FaceNotRecognizedException(HTTPException):
    """Raised when face is not recognized."""
    def __init__(self, detail: str = "Face not recognized"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class AlreadyAttendedException(HTTPException):
    """Raised when user has already submitted attendance for today."""
    def __init__(self, detail: str = "You have already submitted attendance for today"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)
