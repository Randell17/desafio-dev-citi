import prisma from "../database";
import { Luminosidade, Prisma } from "@prisma/client";

interface IPlantaDTO {
  nome: string;
  especie: string;
  preco: number;
  estoque: number;
  luminosidade: Luminosidade;
  petFriendly: boolean;
  regaACadaDias: number;
}

export class PlantaRepository {
  async create(data: IPlantaDTO) {
    const planta = await prisma.planta.create({
      data,
    });
    return planta;
  }

  async findAllFiltered(filters: Prisma.PlantaWhereInput) {
    const plantas = await prisma.planta.findMany({
      where: filters,
    });
    return plantas;
  }

  async findById(id: number) {
    const planta = await prisma.planta.findUnique({
      where: { id },
    });
    return planta;
  }

  async update(id: number, data: Prisma.PlantaUpdateInput) {
    const planta = await prisma.planta.update({
      where: { id },
      data,
    });
    return planta;
  }

  async delete(id: number) {
    await prisma.planta.delete({
      where: { id },
    });
  }

  // Abordagem atómica para evitar condições de corrida na venda
  async venderAtomico(id: number, quantidade: number) {
    const resultado = await prisma.planta.updateMany({
      where: {
        id,
        estoque: {
          gte: quantidade, // Garante que só atualiza se houver estoque suficiente
        },
      },
      data: {
        estoque: {
          decrement: quantidade,
        },
      },
    });
    return resultado.count; // Retorna 1 se atualizou, 0 se falhou a condição
  }

  async findAllPrecoEstoque() {
    const plantas = await prisma.planta.findMany({
      select: {
        preco: true,
        estoque: true,
      },
    });
    return plantas;
  }
}