require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const morgan = require("morgan");

const app = express();

// Middleware
morgan("dev");
app.use(cors());
app.use(express.json());

// Get all restaurants
app.get("/api/v1/restaurants", async (req, res) => {
  try {
    const results = await db.query(
      "SELECT * FROM restaurants LEFT JOIN (SELECT restaurant_id, COUNT(*), TRUNC(AVG(rating), 1) AS average_rating FROM reviews GROUP BY restaurant_id) reviews on restaurants.id = reviews.restaurant_id;"
    );
    res.status(200).json({
      status: "success",
      results: results.rows.lenth,
      data: { restaurants: results.rows },
    });
  } catch (error) {
    console.log(error);
  }
});

// Get a restaurant
app.get("/api/v1/restaurants/:id", async (req, res) => {
  try {
    const restaurant = await db.query(
      "SELECT * FROM restaurants LEFT JOIN (SELECT restaurant_id, COUNT(*), TRUNC(AVG(rating),1) AS average_rating FROM reviews GROUP BY restaurant_id) reviews ON restaurants.id = reviews.restaurant_id WHERE id = $1;",
      [req.params.id]
    );

    const reviews = await db.query(
      "SELECT * FROM reviews WHERE restaurant_id = $1",
      [req.params.id]
    );

    res.status(200).json({
      status: "success",
      data: { restaurant: restaurant.rows[0], reviews: reviews.rows },
    });
  } catch (error) {
    console.log(error);
  }
});

// Create a restaurant
app.post("/api/v1/restaurants", async (req, res) => {
  console.log(req.body);
  const { name, location, price_range } = req.body;

  try {
    const results = await db.query(
      "INSERT INTO restaurants (name, location, price_range) values ($1, $2, $3) returning *",
      [name, location, price_range]
    );
    res.status(201).json({
      status: "success",
      data: { restaurant: results.rows[0] },
    });
  } catch (error) {
    console.log(error);
  }
});

// Update a restaurant
app.put("/api/v1/restaurants/:id", async (req, res) => {
  const { name, location, price_range } = req.body;

  try {
    const results = await db.query(
      "UPDATE restaurants SET name = $1, location = $2, price_range = $3 WHERE id = $4 returning *",
      [name, location, price_range, req.params.id]
    );
    res.status(200).json({
      status: "success",
      data: { restaurant: results.rows[0] },
    });
  } catch (error) {
    console.log(error);
  }
});

// Delete a restaurant
app.delete("/api/v1/restaurants/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM restaurants WHERE id = $1", [req.params.id]);
    res.status(200).json({
      status: "success",
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/v1/restaurants/:id/addReview", async (req, res) => {
  const { name, review, rating } = req.body;

  try {
    const newReview = await db.query(
      "INSERT INTO reviews (restaurant_id, name, review, rating) values ($1, $2, $3, $4)",
      [req.params.id, name, review, rating]
    );
    res.status(201).json({
      status: "success",
      data: {
        review: newReview.rows[0],
      },
    });
  } catch (error) {
    console.log(error);
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is up and listening on port ${port}`);
});
