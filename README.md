# The Internet Game Database Service

This is the backend microservice for The Internet Game Database.  
The service runs on port <code>8101</code> by default.

## 🌐 Endpoints

| Method | Endpoint                   | Description                                           |
| ------ | -------------------------- | ----------------------------------------------------- |
| GET    | /options?name=\<NAME\>     | Get a list of game options matching the given name    |
| GET    | /info?id=\<ID\>            | Get detailed information about a game by ID           |
| GET    | /recommendations?id=\<ID\> | Get recommendations based on the given ID             |
