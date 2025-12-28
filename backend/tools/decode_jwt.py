from app.core.config import settings
from jose import jwt, JWTError

# Token to test (replace if needed)
token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc2NjY1ODU5MCwidHlwZSI6ImFjY2VzcyJ9.Je-HeTjgPMDGvYMHdiVsrfgZUQvMAoSNnGzOgF_ipzg'

print('Using JWT_SECRET_KEY:', settings.JWT_SECRET_KEY[:8] + '...')
try:
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    print('DECODE OK:', payload)
except JWTError as e:
    print('DECODE ERROR:', str(e))
