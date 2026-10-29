import { Request, Response } from "express";
import { PlantaRepository } from "../repositories/PlantaRepository";
import { Luminosidade } from "@prisma/client";

const plantaRepository = new PlantaRepository();

export class PlantaController {
  async create(req: Request, res: Response) {
    try {
      const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;

      if (
        typeof nome !== "string" || nome.trim() === "" ||
        typeof especie !== "string" || especie.trim() === "" ||
        !Number.isInteger(preco) || preco < 0 ||
        !Number.isInteger(estoque) || estoque < 0 ||
        !Object.values(Luminosidade).includes(luminosidade) ||
        typeof petFriendly !== "boolean" ||
        !Number.isInteger(regaACadaDias) || regaACadaDias <= 0
      ) {
        return res.status(400).json({ error: "Dados inválidos ou campos obrigatórios em falta." });
      }

      const novaPlanta = await plantaRepository.create({
        nome,
        especie,
        preco,
        estoque,
        luminosidade,
        petFriendly,
        regaACadaDias,
      });

      return res.status(201).json(novaPlanta);
    } catch (error) {
      return res.status(500).json({ error: "Erro interno ao criar a planta." });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const plantas = await plantaRepository.findAll();
      return res.status(200).json(plantas);
    } catch (error) {
      return res.status(500).json({ error: "Erro interno ao listar as plantas." });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const planta = await plantaRepository.findById(id);
      if (!planta) {
        return res.status(404).json({ error: "Planta não encontrada." });
      }

      return res.status(200).json(planta);
    } catch (error) {
      return res.status(500).json({ error: "Erro interno ao buscar a planta." });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const plantaExiste = await plantaRepository.findById(id);
      if (!plantaExiste) {
        return res.status(404).json({ error:"Planta não encontrada para atualização."});
      }

      const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;
      const dataToUpdate: any = {};

      if (nome !== undefined) {
        if (typeof nome !== "string" || nome.trim() === "") return res.status(400).json({ error: "Nome inválido." });
        dataToUpdate.nome = nome;
      }
      if (especie !== undefined) {
        if (typeof especie !== "string" || especie.trim() === "") return res.status(400).json({ error: "Espécie inválida." });
        dataToUpdate.especie = especie;
      }
      if (preco !== undefined) {
        if (!Number.isInteger(preco) || preco < 0) return res.status(400).json({ error: "Preço inválido." });
        dataToUpdate.preco = preco;
      }
      if (estoque !== undefined) {
        if (!Number.isInteger(estoque) || estoque < 0) return res.status(400).json({ error: "Estoque inválido." });
        dataToUpdate.estoque = estoque;
      }
      if (luminosidade !== undefined) {
        if (!Object.values(Luminosidade).includes(luminosidade)) return res.status(400).json({ error: "Luminosidade inválida." });
        dataToUpdate.luminosidade = luminosidade;
      }
      if (petFriendly !== undefined) {
        if (typeof petFriendly !== "boolean") return res.status(400).json({ error: "Campo petFriendly inválido." });
        dataToUpdate.petFriendly = petFriendly;
      }
      if (regaACadaDias !== undefined) {
        if (!Number.isInteger(regaACadaDias) || regaACadaDias <= 0) return res.status(400).json({ error: "regaACadaDias inválido." });
        dataToUpdate.regaACadaDias = regaACadaDias;
      }

      const plantaAtualizada = await plantaRepository.update(id, dataToUpdate);
      return res.status(200).json(plantaAtualizada);
    } catch (error) {
      return res.status(500).json({ error: "Erro interno ao atualizar a planta." });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const plantaExiste = await plantaRepository.findById(id);
      if (!plantaExiste) {
        return res.status(404).json({ error: "Planta não encontrada para exclusão." });
      }

      await plantaRepository.delete(id);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "Erro interno ao eliminar a planta." });
    }
  }
}