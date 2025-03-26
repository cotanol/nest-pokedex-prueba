import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PokeResponse } from './interfaces/poke-response.interface';

@Injectable()
export class SeedService {
  //Para hacer saber que tenemos una dependencia de Axios
  private readonly axios: AxiosInstance = axios;

  async excuteSEED() {
    const { data } = await this.axios.get<PokeResponse>(
      'https://pokeapi.co/api/v2/pokemon?limit=650',
    );

    data.results.forEach(({ name, url }) => {
      const segment = url.split('/');
      const no = +segment[segment.length - 2];
      console.log(`No: ${no} - Name: ${name}`);
    });

    return data.results;
  }
}
