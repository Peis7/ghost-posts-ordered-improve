export default () => ({
    ghost: {
      api_admin_path: process.env.GHOST_ADMIN_API_PATH,
      api_url: process.env.GHOST_API_URL,
      jwt_algorithm: process.env.JWT_ALGORITHM,
      jwt_expiration: process.env.JWT_EXPIRATION,
      content_api_key: process.env.GHOST_CONTENT_API_KEY,
      admin_api_key: process.env.GHOST_ADMIN_API_KEY,
      port: parseInt(process.env.GHOST_INSTANCE_PORT, 10) || 3004,
      content_path: process.env.GHOST_POST_PATH,
      new_publication_treshhold: process.env.NEW_PUBLICATION_TRESHOLD || 30,
      cache_members: Boolean(process.env.CACHE_MEMBESRS),
    },
    redis:{
      host: process.env.REDIS_HOST,
      username: process.env.REDIS_USER_NAME,
      password: process.env.REDIS_PASSWORD,
      port: process.env.REDIS_PORT || 6379,
    }
  });