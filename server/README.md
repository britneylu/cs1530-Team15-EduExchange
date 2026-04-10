# Backend

## Setup & Running

From root:

```bash
npm install
npm run dev   # i used nodemon so it'll auto-restart with changes
# or
npm start     
```

Server runs at `http://localhost:3000`.

## API Docs

I decided to use swagger so we can generate docs automatically. To access them start the server and visit `http://localhost:3000/api-docs`.

To document a new endpoint, add JSDoc comments above the route handler in the relevant file under `routes/`. The Swagger UI will pick them up automatically.
 
Heres a syntax reference: `https://swagger.io/specification/#info-object-example`