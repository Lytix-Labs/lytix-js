# Lytix Client NPM Packages

This directory contains all the NPM packages for the Lytix project.

#### Environment Variables

The following environment variables are required to run the Lytix client.

- `MM_API_KEY`: The API key for the Lytix API. This is required to send data to the Lytix API.

The followig environment variables are optional.

- `MM_BASE_URL`: The base URL for the Lytix API. This is required to send data to the Lytix API.

#### Configuration

There are multiple ways to use MM. Please follow the instructions relevent to what you'd like to setup.

##### Express Middleware

First make sure you have setup your httpContext middleware. This should be at the towards the top of your middleware stack, **before authentication**.

```ts
/**
 * HTTP Context middlware
 */
app.use(httpContext.middleware);
```

Then you can use the `ErrorRequestHandler` middleware.

```ts
/**
 * Lytix middleware
 */
app.use(ErrorRequestHandler);
```

_But wait, there's more._ You can define a logger, that can be passed to our middleware that can be used to trace a users request.

```ts
import { MMLogger, ErrorRequestHandler } from "@lytix/client";

export const logger = new MMLogger("main");

/**
 * Your custom auth middleware unrelated to lytix
 */
app.use(async (req, res, next) => {
  logger.info(`New request for path: ${req.path} with method: ${req.method}`);

  /**
   * Set metadata for the logger
   */
  logger.setMetadata({
    userId: "1234",
    authed: false,
  });
  next();
});

app.get(
  "/randomEndpoint",
  async (req, res) => {
    ...
    logger.info(`We are deeply nested in some functions`);
    throw new Error(`Uh oh`);
  }
);

/**
 * Lytix middleware
 */
app.use(ErrorRequestHandler);
```

Not only will you get alerts on the error, but you'll also automatically log the userId whenever you call `logger.info/debug/error/warn`

```
> [userId=1234;authed=false] We are deeply nested in some functions
```

This uses the http context to maintain the metadata state. This means as long as you use the exported `logger`, no matter where you are logging you'll always have the userId and authed flag (in this example).
