const env = require("../../../shared/environments");
const redis = require("redis");

export const client = redis.createClient({
  socket: {
    host: env.redis.HOST || "127.0.0.1",
    port: env.redis.PORT || 6379,
  },
});
