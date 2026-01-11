# Swagger Fixed! ✅

## Changes Made:

1. **Updated `src/config/swagger.js`**
   - Changed server URL from `http://localhost:3000/api` to `http://localhost:3010/api`
   - Hardcoded port 3010 to match your .env configuration

2. **Updated `server.js`**
   - Changed default port from 3000 to 3010

3. **Restarted the server**
   - Server is now running on port 3010

## Access Swagger UI:

Open your browser and go to:
```
http://localhost:3010/api-docs
```

## Test the Signup Endpoint:

### Using Swagger UI:
1. Go to http://localhost:3010/api-docs
2. Find the `POST /auth/signup` endpoint
3. Click "Try it out"
4. Use this request body:
```json
{
  "name": "Namuundari",
  "email": "namuundari@gmail.com",
  "password": "123"
}
```
5. Click "Execute"

### Using cURL:
```bash
curl -X POST http://localhost:3010/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Namuundari\",\"email\":\"namuundari@gmail.com\",\"password\":\"123\"}"
```

### Using PowerShell:
```powershell
Invoke-RestMethod -Uri "http://localhost:3010/api/auth/signup" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"name":"Namuundari","email":"namuundari@gmail.com","password":"123"}'
```

## Expected Response:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid-here",
    "email": "namuundari@gmail.com",
    "name": "Namuundari"
  }
}
```

## All Endpoints Available:

- **Swagger UI**: http://localhost:3010/api-docs
- **Health Check**: http://localhost:3010/api/health
- **Auth Signup**: POST http://localhost:3010/api/auth/signup
- **Auth Login**: POST http://localhost:3010/api/auth/login
- **Auth Profile**: GET http://localhost:3010/api/auth/profile

The CORS issue is also fixed, so your frontend can now make requests to the API! 🎉
