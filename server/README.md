# Lab 14 - JWT Login Endpoint

This project continues the secure user registration API with password verification and JSON Web Token issuance.

## Setup

1. Run `npm ci` to install the locked dependencies.
2. Copy `.env.example` to `.env` and set your own MongoDB URI and a private `JWT_SECRET` locally.
3. Run `npm start`. The API listens on port 5000 by default.

Never commit or submit the real `.env` file. The example file contains placeholders only.

## Log in

Send a `POST` request to `/api/users/login` with JSON such as:

    {
      "email": "test@example.com",
      "password": "MySecretPass123"
    }

On success, the API returns HTTP 200 with the user's ID, email, and a signed token that expires after 30 days. The password hash is excluded from normal Mongoose queries and is selected only for credential verification. Unknown email addresses, incorrect passwords, and missing credentials receive the same generic HTTP 401 response.

## Verify

- `npm run check` checks JavaScript syntax.
- `npm run verify` exercises the registration and login routes using an in-memory model, checks password hashing and comparison, verifies JWT signature and expiry, and covers invalid login responses. It does not require a MongoDB connection.
