from fastapi import FastAPI

# Create the FastAPI instance
app = FastAPI()

# Define a route for the root URL
@app.get("/")
def read_root():
    return {"message": "Welcome to my FastAPI app!"}

# Define a route with a path parameter (item_id) and an optional query parameter (q)
@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
