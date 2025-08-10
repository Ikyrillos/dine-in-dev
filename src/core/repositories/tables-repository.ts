import { BASE_URL } from "../apis-endpoints";
import { makeRequest } from "../make-request";
import type { Table } from "../models/TableModel";
import type { List } from "../types/list";




class TablesRepository {

    /**
     * Retrieve all restaurants
     * @returns List of all restaurants
     */
    async findAll() {
        return await makeRequest<void,List<Table>>({
            method: 'GET',
            url: `${BASE_URL}/tables`,
        });
    }


}


export const tablesRepository = new TablesRepository();
