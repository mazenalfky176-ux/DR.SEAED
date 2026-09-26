import { handleApi } from '../../backend/api';
import type { Environment } from '../../backend/contracts';
export const onRequest = ({ request, env }: {
    request: Request;
    env: Environment;
}) => handleApi(request, env);
