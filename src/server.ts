import { app } from './app';
import { logger } from './shared/logger';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
