// services/city.service.ts
import axios from "axios";
import fs from "fs";
import path from "path";
import {parse} from "csv-parse/sync"


export interface City {
  cityId: string;
  cityName: string;
  postalCode: string;
}

export class CityService {
   getCities = async (): Promise<City[]> => {
    const filePath = path.join(process.cwd(), "data/regencies.csv");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    
    const records = parse(fileContent, {
      columns: ['id', 'provinceId', 'name'],
      skip_empty_lines: true,
    });

    return records
  .filter((r: any) => r.id) 
  .map((r: any) => ({
    cityId: String(r.id),
    cityName: r.name,
    postalCode: "", 
  }));
  };
  };

