export default () => ({
    ghost: {
      api_url: process.env.GHOST_API_URL,
      content_api_key: process.env.GHOST_CONTENT_API_KEY,
      admin_api_key: process.env.GHOST_ADMIN_API_KEY,
      port: parseInt(process.env.GHOST_INSTANCE_PORT, 10) || 3004,
      content_path: process.env.GHOST_POST_PATH,
      new_publication_treshhold: process.env.NEW_PUBLICATION_TRESHOLD || 30
    }
  });