import { useQuery } from "@tanstack/react-query";
import { tablesRepository } from "../repositories/tables-repository";

export const queryKeys = {
  tables: "tables",
  table: (id: string) => ["table", id],
};

export const useGetTables = () => {

  const foundationId = localStorage.getItem(
    "x-foundation-id",
  );

  return useQuery(
    {
      queryKey: [queryKeys.tables],
      queryFn: () => tablesRepository.findAll(),
      enabled: !!foundationId,
      retry: true,
      retryDelay: 500,
    },
  );
};
