import { prisma } from "../database/prismaClient";
import { Luminosidade } from "@prisma/client";

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

  async findAll() {
    const plantas = await prisma.planta.findMany();
    return plantas;
  }

  async findById(id: number) {
    const planta = await prisma.planta.findUnique({
      where: { id },
    });
    return planta;
  }

  async update(id: number, data: Partial<IPlantaDTO>) {
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
}