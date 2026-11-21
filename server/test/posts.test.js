const assert = require("node:assert/strict");
const test = require("node:test");
const { createApp } = require("../src/app");
const { openDatabase } = require("../src/database");

test("posts can be created, validated, and listed", async (context) => {
  const database = openDatabase(":memory:");
  const server = createApp(database).listen(0);
  context.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    database.close();
  });

  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/api/posts`;

  const invalidResponse = await fetch(baseUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ author: "Aditya", content: "   " }),
  });
  assert.equal(invalidResponse.status, 400);

  const createResponse = await fetch(baseUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ author: "  Aditya  ", content: "  Hello, Ruang!  " }),
  });
  assert.equal(createResponse.status, 201);
  assert.deepEqual(
    (({ author, content }) => ({ author, content }))(await createResponse.json()),
    { author: "Aditya", content: "Hello, Ruang!" }
  );

  const listResponse = await fetch(baseUrl);
  const posts = await listResponse.json();
  assert.equal(posts.length, 1);
  assert.equal(posts[0].author, "Aditya");
  assert.equal(posts[0].content, "Hello, Ruang!");
});
