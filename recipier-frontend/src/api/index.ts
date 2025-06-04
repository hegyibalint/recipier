import { paths } from "@/api/schema.ts";
import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";

const fetchClient = createFetchClient<paths>({
  baseUrl: "/api",
});
const api = createClient(fetchClient);

export default api;
export { schemas };
