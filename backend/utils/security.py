# =============================================================================
# SECURITY UTILITIES
# =============================================================================
# Module ini berisi utilitas keamanan:
# - Password hashing dengan bcrypt
# - JWT token management
# - Input sanitization
# - Rate limiting

import bcrypt
from jose import jwt  # Changed from 'import jwt' to 'from jose import jwt'
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import html
import logging
from functools import wraps
from collections import defaultdict
import time

logger = logging.getLogger(__name__)

# Configuration
JWT_SECRET_KEY = "your-super-secret-key-change-in-production-2024"
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7


# =============================================================================
# PASSWORD HASHING
# =============================================================================

def hash_password(password: str) -> str:
    """
    Hash password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify password against hash.
    
    Args:
        password: Plain text password to verify
        hashed_password: Stored hash
        
    Returns:
        True if password matches
    """
    try:
        return bcrypt.checkpw(
            password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


# =============================================================================
# JWT TOKEN MANAGEMENT
# =============================================================================

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create JWT access token.
    
    Args:
        data: Payload data
        expires_delta: Optional custom expiration
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create JWT refresh token.
    
    Args:
        data: Payload data
        
    Returns:
        Encoded JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded payload or None if invalid
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        return None


def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify access token and return payload.
    
    Args:
        token: JWT access token
        
    Returns:
        Decoded payload if valid access token
    """
    payload = decode_token(token)
    if payload and payload.get("type") == "access":
        return payload
    return None


def verify_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify refresh token and return payload.
    
    Args:
        token: JWT refresh token
        
    Returns:
        Decoded payload if valid refresh token
    """
    payload = decode_token(token)
    if payload and payload.get("type") == "refresh":
        return payload
    return None


# =============================================================================
# INPUT SANITIZATION
# =============================================================================

def sanitize_string(text: str) -> str:
    """
    Sanitize string input to prevent XSS and injection attacks.
    
    Args:
        text: Input string
        
    Returns:
        Sanitized string
    """
    if not text:
        return ""
    
    # HTML escape
    sanitized = html.escape(text)
    
    # Remove potential SQL injection patterns
    sql_patterns = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)",
        r"(--)",
        r"(/\*)",
        r"(\*/)",
        r"(;)",
    ]
    
    for pattern in sql_patterns:
        sanitized = re.sub(pattern, "", sanitized, flags=re.IGNORECASE)
    
    # Limit length
    max_length = 1000
    return sanitized[:max_length]


def sanitize_nim(nim: str) -> str:
    """
    Sanitize NIM/student ID input.
    Only allow alphanumeric characters.
    
    Args:
        nim: Student ID
        
    Returns:
        Sanitized NIM
    """
    if not nim:
        return ""
    
    # Only keep alphanumeric
    sanitized = re.sub(r"[^a-zA-Z0-9]", "", nim)
    
    # Limit length
    return sanitized[:20]


def sanitize_name(name: str) -> str:
    """
    Sanitize name input.
    Only allow letters, spaces, and common name characters.
    
    Args:
        name: Person name
        
    Returns:
        Sanitized name
    """
    if not name:
        return ""
    
    # Only keep letters, spaces, apostrophes, hyphens
    sanitized = re.sub(r"[^a-zA-Z\s'\-]", "", name)
    
    # Remove multiple spaces
    sanitized = re.sub(r"\s+", " ", sanitized)
    
    # Limit length and strip
    return sanitized[:100].strip()


def validate_email(email: str) -> bool:
    """
    Validate email format.
    
    Args:
        email: Email string
        
    Returns:
        True if valid email format
    """
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def validate_password_strength(password: str) -> Dict[str, Any]:
    """
    Validate password strength.
    
    Args:
        password: Password to validate
        
    Returns:
        Dictionary with validation results
    """
    result = {
        "valid": True,
        "errors": [],
        "score": 0
    }
    
    # Minimum length
    if len(password) < 8:
        result["errors"].append("Password must be at least 8 characters")
        result["valid"] = False
    else:
        result["score"] += 1
    
    # Check for uppercase
    if re.search(r"[A-Z]", password):
        result["score"] += 1
    else:
        result["errors"].append("Password should contain uppercase letters")
    
    # Check for lowercase
    if re.search(r"[a-z]", password):
        result["score"] += 1
    else:
        result["errors"].append("Password should contain lowercase letters")
    
    # Check for digits
    if re.search(r"\d", password):
        result["score"] += 1
    else:
        result["errors"].append("Password should contain numbers")
    
    # Check for special characters
    if re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        result["score"] += 1
    
    # Minimum valid score
    if result["score"] < 3:
        result["valid"] = False
    
    return result


# =============================================================================
# RATE LIMITING
# =============================================================================

class RateLimiter:
    """
    Simple in-memory rate limiter.
    For production, use Redis-based solution.
    """
    
    def __init__(self):
        self.requests = defaultdict(list)
        self.blocked_ips = {}
    
    def is_rate_limited(
        self,
        key: str,
        limit: int,
        window_seconds: int
    ) -> bool:
        """
        Check if request should be rate limited.
        
        Args:
            key: Identifier (IP, user ID, etc.)
            limit: Maximum requests allowed
            window_seconds: Time window in seconds
            
        Returns:
            True if rate limited
        """
        current_time = time.time()
        window_start = current_time - window_seconds
        
        # Clean old requests
        self.requests[key] = [
            t for t in self.requests[key]
            if t > window_start
        ]
        
        # Check limit
        if len(self.requests[key]) >= limit:
            return True
        
        # Add current request
        self.requests[key].append(current_time)
        return False
    
    def block_ip(self, ip: str, duration_seconds: int):
        """
        Block an IP address temporarily.
        
        Args:
            ip: IP address to block
            duration_seconds: Block duration
        """
        self.blocked_ips[ip] = time.time() + duration_seconds
        logger.warning(f"IP {ip} blocked for {duration_seconds} seconds")
    
    def is_ip_blocked(self, ip: str) -> bool:
        """
        Check if IP is blocked.
        
        Args:
            ip: IP address to check
            
        Returns:
            True if IP is blocked
        """
        if ip not in self.blocked_ips:
            return False
        
        if time.time() > self.blocked_ips[ip]:
            del self.blocked_ips[ip]
            return False
        
        return True
    
    def clear(self):
        """Clear all rate limit data."""
        self.requests.clear()
        self.blocked_ips.clear()


# Global rate limiter instance
rate_limiter = RateLimiter()


def rate_limit(limit: int = 60, window: int = 60):
    """
    Rate limit decorator for FastAPI endpoints.
    
    Args:
        limit: Maximum requests per window
        window: Time window in seconds
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get request from kwargs or args
            request = kwargs.get("request")
            
            if request:
                client_ip = request.client.host
                
                if rate_limiter.is_ip_blocked(client_ip):
                    from fastapi import HTTPException
                    raise HTTPException(
                        status_code=429,
                        detail="IP temporarily blocked"
                    )
                
                if rate_limiter.is_rate_limited(client_ip, limit, window):
                    from fastapi import HTTPException
                    raise HTTPException(
                        status_code=429,
                        detail="Rate limit exceeded"
                    )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


# =============================================================================
# SECURITY HEADERS
# =============================================================================

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'",
    "Referrer-Policy": "strict-origin-when-cross-origin"
}
