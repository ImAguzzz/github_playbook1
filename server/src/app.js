const path = require("node:path");
const express = require("express");

function createApp(database) {
  const app = express();
  app.use(express.json({ limit: "16kb" }));

  app.get("/api/posts", (request, response) => {
    const posts = database.prepare(`
      SELECT id, author, content, created_at AS createdAt
      FROM posts
      ORDER BY id DESC
      LIMIT 100
    `).all();
    response.json(posts);
  });

  app.post("/api/posts", (request, response) => {
    const author = typeof request.body?.author === "string" ? request.body.author.trim() : "";
    const content = typeof request.body?.content === "string" ? request.body.content.trim() : "";

    if (!author || author.length > 60) {
      return response.status(400).json({ error: "Name must be between 1 and 60 characters." });
    }
    if (!content || content.length > 500) {
      return response.status(400).json({ error: "Post must be between 1 and 500 characters." });
    }

    const result = database.prepare(
      "INSERT INTO posts (author, content) VALUES (?, ?)"
    ).run(author, content);
    const post = database.prepare(`
      SELECT id, author, content, created_at AS createdAt
      FROM posts
      WHERE id = ?
    `).get(result.lastInsertRowid);

    return response.status(201).json(post);
  });

  app.get("/", (request, response) => {
    response.sendFile(path.resolve(__dirname, "../../index.html"));
  });

  app.use((error, request, response, next) => {
    if (response.headersSent) {
      return next(error);
    }

    if (error.type === "entity.parse.failed") {
      return response.status(400).json({ error: "Request body must be valid JSON." });
    }
    if (error.type === "entity.too.large") {
      return response.status(413).json({ error: "Request body is too large." });
    }

    console.error("Request failed:", error);
    return response.status(500).json({ error: "The server could not complete the request." });
  });

  return app;
}

module.exports = { createApp };
