import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PokemonService {
  private defaultLimit: number;
  private defaultOffset: number;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,

    private readonly configService: ConfigService,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')!;
    this.defaultOffset = this.configService.get<number>('defaultOffset')!;
  }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleException(error);
    }
  }

  findAll(paginationDto: PaginationDto) {
    const { limit = this.defaultLimit, offset = this.defaultOffset } =
      paginationDto;

    const query = this.pokemonModel
      .find()
      .limit(limit)
      .skip(offset)
      .select('-__v'); //.sort({ no: 1 }); ordenar de manera ascendente, y quitamos el campo __v

    return query;
  }

  async findOne(term: string) {
    let pokemon: Pokemon | null;

    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: +term }); //convertirmos a number
    } else if (isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term); // Buscar por mongo ID
    } else {
      pokemon = await this.pokemonModel.findOne({
        name: term.toLowerCase().trim(),
      });
    }

    if (!pokemon) {
      throw new NotFoundException(
        `Pokemon with id, name or no '${term}' not found`,
      );
    }

    return pokemon; // Asegurar siempre un retorno
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    if (!updatePokemonDto) {
      throw new BadRequestException('Update body cannot be empty');
    }

    const pokemon = await this.findOne(term);

    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    }

    try {
      await pokemon.updateOne(updatePokemonDto, { new: true }); // Actualizar y retornar el nuevo valor
      return { ...pokemon.toJSON(), ...updatePokemonDto }; // Retornar el objeto actualizado
    } catch (error) {
      this.handleException(error);
    }
  }

  async remove(id: string) {
    const result = await this.pokemonModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Pokemon with id '${id}' not found`);
    }
    return result;
  }

  private handleException(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(
        `Pokemon already exists in db ${JSON.stringify(error.keyValue)}`,
      );
    }
    console.log(error);
    throw new InternalServerErrorException(
      'Error updating or creating pokemon, check logs',
    );
  }
}
